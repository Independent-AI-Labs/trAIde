import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

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
  return new Response(res.body, { status: res.status, headers: { 'content-type': ct || 'application/json' } })
}

export async function GET(req: NextRequest) { return proxy(req) }
export async function POST(req: NextRequest) { return proxy(req) }

