import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
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

describe.sequential('Proxy security and POST passthrough', () => {
  const OLD_ENV = process.env
  let upstream: { server: http.Server; url: string; port: number } | null = null
  let lastPostBody: any = null

  beforeAll(async () => {
    process.env = { ...OLD_ENV }
    upstream = await startMockServer((req, res) => {
      if (!req.url) return
      if (req.method === 'POST' && req.url.startsWith('/indicators')) {
        const chunks: Buffer[] = []
        req.on('data', (c) => chunks.push(Buffer.from(c)))
        req.on('end', () => {
          const body = chunks.length ? Buffer.concat(chunks).toString('utf8') : ''
          lastPostBody = body
          res.writeHead(200, { 'content-type': req.headers['content-type'] || 'application/json' })
          res.end(body || '{}')
        })
        return
      }
      if (req.url.startsWith('/big-no-length')) {
        res.writeHead(200, { 'content-type': 'application/json' })
        // send >5MB without content-length
        const big = 'x'.repeat(5 * 1024 * 1024 + 10)
        res.end(big)
        return
      }
      if (req.url.startsWith('/health')) {
        res.writeHead(200, { 'content-type': 'text/plain' })
        res.end('ok')
        return
      }
      res.writeHead(404, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'not_found' }))
    })
    vi.resetModules()
    route = await import('@/app/api/mcp/[...path]/route')
  })

  afterAll(async () => {
    if (upstream) await new Promise((r) => upstream!.server.close(() => r(null)))
    process.env = OLD_ENV
  })

  it('blocks private CIDR by default (falls back to localhost)', async () => {
    process.env.MCP_FORCE_LOCAL = 'false'
    delete process.env.MCP_ALLOW_PRIVATE
    vi.resetModules(); route = await import('@/app/api/mcp/[...path]/route')
    const cookie = 'mcp=' + encodeURIComponent(upstream!.url)
    const res = await route.GET(makeReq('http://ui.local/api/mcp/health', { cookie }))
    expect([502, 200]).toContain(res.status) // expect failure to reach upstream or dev local if running
    // If blocked, proxy target should be localhost:62007
    expect(res.headers.get('x-proxy-target')).toContain('http://localhost:62007')
  })

  it('enforces allowlist host match even when private allowed', async () => {
    process.env.MCP_FORCE_LOCAL = 'false'
    process.env.MCP_ALLOW_PRIVATE = 'true'
    process.env.MCP_ALLOWED_HOSTS = `127.0.0.1:${upstream!.port}`
    vi.resetModules(); route = await import('@/app/api/mcp/[...path]/route')
    const cookie = 'mcp=' + encodeURIComponent(upstream!.url)
    const ok = await route.GET(makeReq('http://ui.local/api/mcp/health', { cookie }))
    expect(ok.status).toBe(200)
    expect(ok.headers.get('x-proxy-target')).toContain(`${upstream!.url}/health`)
    // now set allowlist to different host; expect fallback
    process.env.MCP_ALLOWED_HOSTS = 'example.com:443'
    vi.resetModules(); route = await import('@/app/api/mcp/[...path]/route')
    const blocked = await route.GET(makeReq('http://ui.local/api/mcp/health', { cookie }))
    expect([502, 200]).toContain(blocked.status)
    expect(blocked.headers.get('x-proxy-target')).toContain('http://localhost:62007')
  })

  it('passes through POST /indicators body and content-type', async () => {
    process.env.MCP_FORCE_LOCAL = 'false'
    process.env.MCP_ALLOW_PRIVATE = 'true'
    process.env.MCP_ALLOWED_HOSTS = `127.0.0.1:${upstream!.port}`
    vi.resetModules(); route = await import('@/app/api/mcp/[...path]/route')
    const cookie = 'mcp=' + encodeURIComponent(upstream!.url)
    const body = JSON.stringify({ symbol: 'AAA', interval: '1m', limit: 10 })
    const res = await route.POST(makeReq('http://ui.local/api/mcp/indicators', { cookie, method: 'POST', body }))
    expect(res.status).toBe(200)
    expect(res.headers.get('x-proxy-target')).toContain(`${upstream!.url}/indicators`)
    const text = await res.text()
    expect(text).toBe(body)
    expect(lastPostBody).toBe(body)
  })

  it('blocks overly large responses without content-length', async () => {
    process.env.MCP_FORCE_LOCAL = 'false'
    process.env.MCP_ALLOW_PRIVATE = 'true'
    process.env.MCP_ALLOWED_HOSTS = `127.0.0.1:${upstream!.port}`
    vi.resetModules(); route = await import('@/app/api/mcp/[...path]/route')
    const cookie = 'mcp=' + encodeURIComponent(upstream!.url)
    const res = await route.GET(makeReq('http://ui.local/api/mcp/big-no-length', { cookie }))
    expect(res.status).toBe(502)
    const j = await res.json()
    expect(j.error).toBe('response_too_large')
  })
})
