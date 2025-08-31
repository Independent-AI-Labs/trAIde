import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

// naive in-memory cache for /klines GET to reduce upstream load
const cache = new Map<string, { body: Uint8Array; ct: string; exp: number }>()
const TTL_MS = 10_000

function targetBase() {
  const c = cookies().get('mcp')?.value
  const env = process.env.NEXT_PUBLIC_MCP_BASE_URL
  return (c && decodeURIComponent(c)) || env || 'http://localhost:65000'
}

function buildTargetUrl(req: NextRequest) {
  const base = targetBase().replace(/\/$/, '')
  const path = req.nextUrl.pathname.replace(/^\/api\/mcp/, '')
  const qs = req.nextUrl.search
  return base + path + qs
}

async function proxy(req: NextRequest, init?: RequestInit) {
  const url = buildTargetUrl(req)
  const isKlines = req.method === 'GET' && url.includes('/klines')
  if (isKlines) {
    const hit = cache.get(url)
    const now = Date.now()
    if (hit && hit.exp > now) {
      return new Response(hit.body, { status: 200, headers: { 'content-type': hit.ct, 'x-cache': 'HIT' } })
    }
  }
  const res = await fetch(url, {
    // Pass through method and body for POST
    method: init?.method || req.method,
    body: init?.body || (req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined),
    headers: { 'content-type': req.headers.get('content-type') || undefined },
    duplex: 'half',
    cache: 'no-cache',
  } as RequestInit)
  // For SSE, stream through raw body and critical headers
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('text/event-stream')) {
    return new Response(res.body, {
      status: res.status,
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        'connection': 'keep-alive',
      },
    })
  }
  // Otherwise return as-is with JSON/text
  const bodyBuf = new Uint8Array(await res.arrayBuffer())
  if (isKlines && res.ok) {
    cache.set(url, { body: bodyBuf, ct, exp: Date.now() + TTL_MS })
  }
  return new Response(bodyBuf, { status: res.status, headers: { 'content-type': ct || 'application/json' } })
}

export async function GET(req: NextRequest) { return proxy(req) }
export async function POST(req: NextRequest) { return proxy(req) }
