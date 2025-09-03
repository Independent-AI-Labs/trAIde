import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import http from 'http'
import { AddressInfo } from 'net'
import { NextRequest } from 'next/server'
let route: any

function makeReq(url: string, opts?: { method?: string; cookie?: string; body?: string; headers?: Record<string, string> }) {
  const headers = new Headers(opts?.headers || {})
  if (opts?.cookie) headers.set('cookie', opts.cookie)
  if (opts?.body && !headers.has('content-type')) headers.set('content-type', 'application/json')
  return new NextRequest(url, { method: opts?.method || 'GET', body: opts?.body, headers } as any)
}

function startMockServer(handler: (req: http.IncomingMessage, res: http.ServerResponse) => void) {
  const server = http.createServer(handler)
  return new Promise<{ server: http.Server; url: string; port: number }>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo
      resolve({ server, url: `http://127.0.0.1:${addr.port}`, port: addr.port })
    })
  })
}

describe.sequential('Next API proxy /api/mcp/*', () => {
  const OLD_ENV = process.env
  let upstream: { server: http.Server; url: string; port: number } | null = null
  let counter = 0

  beforeAll(async () => {
    process.env = { ...OLD_ENV, MCP_FORCE_LOCAL: 'false', MCP_ALLOW_PRIVATE: 'true' }
    upstream = await startMockServer((req, res) => {
      if (!req.url) return
      if (req.url.startsWith('/health')) {
        res.writeHead(200, { 'content-type': 'text/plain' })
        res.end('ok')
        return
      }
      if (req.url.startsWith('/klines/big')) {
        res.writeHead(200, { 'content-type': 'application/json', 'content-length': String(6_000_000) })
        res.end('{"ok":true}')
        return
      }
      if (req.url.startsWith('/klines')) {
        counter += 1
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ n: counter }))
        return
      }
      if (req.url.startsWith('/stream/klines')) {
        res.writeHead(200, {
          'content-type': 'text/event-stream',
          'connection': 'keep-alive',
          'cache-control': 'no-cache',
        })
        const timer = setInterval(() => {
          res.write(`event: tick\n`)
          res.write(`data: {\"t\":${Date.now()}}\n\n`)
        }, 50)
        // End after a few writes to not hang tests too long
        setTimeout(() => { clearInterval(timer); try { res.end() } catch {}
        }, 220)
        return
      }
      // default
      res.writeHead(404, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'not_found' }))
    })
    // import route after env so top-level flags read correctly
    route = await import('@/app/api/mcp/[...path]/route')
  })

  afterAll(async () => {
    if (upstream) await new Promise((r) => upstream!.server.close(() => r(null)))
    process.env = OLD_ENV
  })

  beforeEach(() => {
    counter = 0
  })

  it('passes through simple GET and sets x-proxy-target', async () => {
    const cookie = 'mcp=' + encodeURIComponent(upstream!.url)
    const req = makeReq('http://ui.local/api/mcp/health', { cookie })
    const res = await route.GET(req)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('ok')
    expect(res.headers.get('x-proxy-target')).toContain(`${upstream!.url}/health`)
  })

  it('caches GET /klines and returns x-cache HIT', async () => {
    const cookie = 'mcp=' + encodeURIComponent(upstream!.url)
    const r1 = await route.GET(makeReq('http://ui.local/api/mcp/klines?symbol=BTCUSDT&interval=1m&limit=2', { cookie }))
    expect(r1.status).toBe(200)
    const body1 = await r1.json()
    expect(body1.n).toBe(1)
    expect(r1.headers.get('x-cache')).toBeNull()
    const r2 = await route.GET(makeReq('http://ui.local/api/mcp/klines?symbol=BTCUSDT&interval=1m&limit=2', { cookie }))
    expect(r2.status).toBe(200)
    expect(r2.headers.get('x-cache')).toBe('HIT')
    const body2 = await r2.json()
    expect(body2.n).toBe(1)
  })

  it('blocks overly large responses via content-length', async () => {
    const cookie = 'mcp=' + encodeURIComponent(upstream!.url)
    const res = await route.GET(makeReq('http://ui.local/api/mcp/klines/big', { cookie }))
    expect(res.status).toBe(502)
    const j = await res.json()
    expect(j.error).toBe('response_too_large')
  })

  it('streams SSE through for /stream/klines', async () => {
    const cookie = 'mcp=' + encodeURIComponent(upstream!.url)
    const res = await route.GET(makeReq('http://ui.local/api/mcp/stream/klines?symbol=BTCUSDT&interval=1m', { cookie }))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    const reader = res.body!.getReader()
    let chunks = ''
    // Read a few chunks and then stop
    for (let i = 0; i < 3; i++) {
      const { value, done } = await reader.read()
      if (done) break
      chunks += Buffer.from(value).toString('utf8')
    }
    expect(chunks).toContain('event: tick')
    expect(chunks).toContain('data:')
    reader.cancel().catch(() => {})
  })

  it('streams SSE through for /stream/klines/batch', async () => {
    const cookie = 'mcp=' + encodeURIComponent(upstream!.url)
    const res = await route.GET(makeReq('http://ui.local/api/mcp/stream/klines/batch?symbols=BTCUSDT,ETHUSDT&interval=1m', { cookie }))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    const reader = res.body!.getReader()
    let chunks = ''
    for (let i = 0; i < 3; i++) {
      const { value, done } = await reader.read()
      if (done) break
      chunks += Buffer.from(value).toString('utf8')
    }
    expect(chunks).toContain('event: tick')
    reader.cancel().catch(() => {})
  })
})

describe.sequential('dev force localhost override', () => {
  const OLD_ENV = process.env
  let local62007: http.Server | null = null

  beforeAll(async () => {
    process.env = { ...OLD_ENV }
    // Start a server on fixed 62007 to serve a known body
    local62007 = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'content-type': 'text/plain' })
        res.end('ok-dev-local')
      } else {
        res.writeHead(200, { 'content-type': 'text/plain' })
        res.end('unknown')
      }
    })
    await new Promise((r) => local62007!.listen(62007, '127.0.0.1', () => r(null)))
    // Reset module cache so route reads fresh env defaults
    vi.resetModules()
    route = await import('@/app/api/mcp/[...path]/route')
  })

  afterAll(async () => {
    await new Promise((r) => local62007!.close(() => r(null)))
    process.env = OLD_ENV
  })

  it('defaults to localhost:62007 in non-production even if cookie set', async () => {
    delete process.env.MCP_FORCE_LOCAL // default true
    process.env.NODE_ENV = 'test'
    const cookie = 'mcp=' + encodeURIComponent('http://127.0.0.1:65535')
    const req = makeReq('http://ui.local/api/mcp/health', { cookie })
    const res = await route.GET(req)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('ok-dev-local')
  })
})
