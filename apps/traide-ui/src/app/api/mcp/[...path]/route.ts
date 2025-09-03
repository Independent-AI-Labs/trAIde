import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

// LRU+TTL cache for GET /klines* to reduce upstream load
type CacheEntry = { body: ArrayBuffer; ct: string; exp: number }
const cache = new Map<string, CacheEntry>()
const TTL_MS = 10_000
function cacheCapacity() {
  const raw = Number(process.env.MCP_PROXY_CACHE_KEYS || 200)
  if (!Number.isFinite(raw)) return 200
  return Math.max(50, Math.min(2000, Math.floor(raw)))
}
function cacheGet(key: string): CacheEntry | undefined {
  const hit = cache.get(key)
  if (!hit) return undefined
  const now = Date.now()
  if (hit.exp <= now) { cache.delete(key); return undefined }
  // Move to MRU by re-inserting
  cache.delete(key)
  cache.set(key, hit)
  return hit
}
function cacheSet(key: string, val: CacheEntry) {
  cache.set(key, val)
  const cap = cacheCapacity()
  // Evict LRU while above capacity
  while (cache.size > cap) {
    const oldest = cache.keys().next().value as string | undefined
    if (oldest == null) break
    cache.delete(oldest)
  }
}
const MAX_BODY_BYTES = 5 * 1024 * 1024 // 5MB cap for non-SSE
const ALLOW_PRIVATE = process.env.MCP_ALLOW_PRIVATE === 'true'
const ALLOWED_HOSTS = (process.env.MCP_ALLOWED_HOSTS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

function isPrivateHost(host: string): boolean {
  // IPv6 localhost
  if (host === '::1' || host === '[::1]') return true
  // strip port
  const h = host.split(':')[0]!
  // IPv4 checks
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (m) {
    const a = m.slice(1).map((x) => parseInt(x, 10))
    if (a[0] === 10) return true
    if (a[0] === 127) return true
    if (a[0] === 169 && a[1] === 254) return true
    if (a[0] === 172 && a[1] >= 16 && a[1] <= 31) return true
    if (a[0] === 192 && a[1] === 168) return true
  }
  return false
}

function targetBase(req: NextRequest) {
  // In dev, prefer local MCP to avoid LAN routing issues unless explicitly disabled
  const forceLocal = process.env.MCP_FORCE_LOCAL !== 'false'
  if (process.env.NODE_ENV !== 'production' && forceLocal) {
    return 'http://localhost:62007'
  }
  const envProd = process.env.MCP_BASE_URL || process.env.NEXT_PUBLIC_MCP_BASE_URL
  // In production, prefer pinned env and ignore cookie unless allowlisted
  if (process.env.NODE_ENV === 'production') {
    if (envProd) return envProd
    // fallback to default in the rare case env is unset
    return 'http://localhost:62007'
  }
  // Use request-bound cookies to avoid dynamic headers() access in dev
  const c = req.cookies.get('mcp')?.value
  const raw = (c && decodeURIComponent(c)) || envProd || 'http://localhost:62007'
  try {
    const u = new URL(raw)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('scheme')
    const host = u.host.toLowerCase()
    if (!ALLOW_PRIVATE && isPrivateHost(host)) throw new Error('private')
    if (ALLOWED_HOSTS.length && !ALLOWED_HOSTS.includes(host)) throw new Error('not-allowed')
    return u.origin
  } catch {
    return 'http://localhost:62007'
  }
}

function buildTargetUrl(req: NextRequest) {
  const base = targetBase(req).replace(/\/$/, '')
  const path = req.nextUrl.pathname.replace(/^\/api\/mcp/, '')
  const qs = req.nextUrl.search
  return base + path + qs
}

async function proxy(req: NextRequest, init?: RequestInit) {
  const url = buildTargetUrl(req)
  const isKlines = req.method === 'GET' && url.includes('/klines')
  if (isKlines) {
    const hit = cacheGet(url)
    if (hit) {
      const headers: Record<string, string> = { 'content-type': hit.ct, 'x-cache': 'HIT' }
      if (process.env.NODE_ENV !== 'production') {
        headers['x-cache-size'] = String(cache.size)
        headers['x-cache-capacity'] = String(cacheCapacity())
      }
      return new Response(hit.body, { status: 200, headers })
    }
  }
  const ac = new AbortController()
  const to = setTimeout(() => ac.abort(), 15_000)
  let res: Response
  try {
    res = await fetch(url, {
      // Pass through method and body for POST
      method: init?.method || req.method,
      body: init?.body || (req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined),
      headers: { 'content-type': req.headers.get('content-type') || undefined },
      duplex: 'half',
      redirect: 'manual',
      cache: 'no-cache',
      signal: ac.signal,
    } as RequestInit)
  } catch (e) {
    clearTimeout(to)
    // Upstream unreachable; return a small JSON error instead of throwing to avoid huge dev logs
    const body = JSON.stringify({ error: 'upstream_unreachable' })
    return new Response(body, { status: 502, headers: { 'content-type': 'application/json', 'x-proxy-target': url } })
  } finally {
    clearTimeout(to)
  }
  // For SSE, stream through raw body and critical headers
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('text/event-stream')) {
    return new Response(res.body, {
      status: res.status,
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        'connection': 'keep-alive',
        'x-proxy-target': url,
      },
    })
  }
  // Otherwise return as-is with JSON/text
  const len = parseInt(res.headers.get('content-length') || '0', 10)
  if (!ct.includes('text/event-stream') && len && len > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'response_too_large' }), { status: 502, headers: { 'content-type': 'application/json' } })
  }
  const ab = await res.arrayBuffer()
  if (!ct.includes('text/event-stream') && ab.byteLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'response_too_large' }), { status: 502, headers: { 'content-type': 'application/json' } })
  }
  if (isKlines && res.ok) cacheSet(url, { body: ab, ct, exp: Date.now() + TTL_MS })
  return new Response(ab, { status: res.status, headers: { 'content-type': ct || 'application/json', 'x-proxy-target': url } })
}

export async function GET(req: NextRequest) { return proxy(req) }
export async function POST(req: NextRequest) { return proxy(req) }
