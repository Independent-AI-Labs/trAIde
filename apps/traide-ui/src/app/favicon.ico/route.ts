import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  // Minimal placeholder to avoid 404 noise in dev; real icon is /icon.svg
  return new Response(null, { status: 204, headers: { 'content-type': 'image/x-icon' } })
}

