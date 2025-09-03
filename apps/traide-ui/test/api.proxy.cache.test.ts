import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import http from 'http'
import { AddressInfo } from 'net'
import { NextRequest } from 'next/server'

let route: any

function makeReq(url: string, opts?: { method?: string; cookie?: string; body?: string; headers?: Record<string, string> }) {
  const headers = new Headers(opts?.headers || {})
  if (opts?.cookie) headers.set('cookie', opts.cookie)
  return new NextRequest(url, { method: opts?.method || 'GET', headers } as any)
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

describe.sequential('Proxy LRU cache for /klines', () => {
  const OLD_ENV = process.env
  let upstream: { server: http.Server; url: string; port: number } | null = null
  const counts = new Map<string, number>()

  beforeAll(async () => {
    process.env = { ...OLD_ENV, MCP_FORCE_LOCAL: 'false', MCP_ALLOW_PRIVATE: 'true', MCP_PROXY_CACHE_KEYS: '50' }
    upstream = await startMockServer((req, res) => {
      const key = req.url || ''
      counts.set(key, (counts.get(key) || 0) + 1)
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ k: key, n: counts.get(key) }))
    })
    route = await import('@/app/api/mcp/[...path]/route')
  })

  afterAll(async () => {
    if (upstream) await new Promise((r) => upstream!.server.close(() => r(null)))
    process.env = OLD_ENV
  })

  it('evicts least-recently-used entries when over capacity', async () => {
    const cookie = 'mcp=' + encodeURIComponent(upstream!.url)
    const makeUrl = (sym: string) => `http://ui.local/api/mcp/klines?symbol=${sym}&interval=1m&limit=1`

    // fill with u1, u2
    // fresh import to reset cache per test
    const { default: _noop } = await import('node:module').catch(() => ({ default: null }))
    // ensure module cache reset so LRU map is empty
    const { vi } = await import('vitest') as any
    vi.resetModules()
    const mod = await import('@/app/api/mcp/[...path]/route')
    route = mod
    // Warm cache with 50 distinct keys
    const syms: string[] = []
    for (let i = 0; i < 50; i++) { syms.push(`S${String(i).padStart(2, '0')}`) }
    for (const s of syms) { await route.GET(makeReq(makeUrl(s), { cookie })) }
    // Hit one to confirm cache and capture capacity header
    const h = await route.GET(makeReq(makeUrl('S49'), { cookie })) // HIT
    // should be a HIT and expose dev headers with capacity=2
    expect(h.headers.get('x-cache')).toBe('HIT')
    expect(h.headers.get('x-cache-capacity')).toBe('50')

    // Insert 2 more to exceed capacity and force eviction of the LRU (S00)
    await route.GET(makeReq(makeUrl('S50'), { cookie }))
    await route.GET(makeReq(makeUrl('S51'), { cookie }))
    // Access S00 again -> should be MISS and increment count to 2
    await route.GET(makeReq(makeUrl('S00'), { cookie }))
    const p0 = '/klines?symbol=S00&interval=1m&limit=1'
    const p49 = '/klines?symbol=S49&interval=1m&limit=1'
    expect(counts.get(p0)).toBe(2)
    expect(counts.get(p49)).toBe(1)
  })
})
