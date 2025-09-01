"use client"
import { useMcpConfig } from '@/lib/config'

// Client-side helper to resolve MCP base URL for SSE and other direct calls.
// Prefers NEXT_PUBLIC_MCP_BASE_URL, then a `mcp` cookie (URL-encoded), else undefined.
export function getMcpBaseUrlClient(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const env = process.env.NEXT_PUBLIC_MCP_BASE_URL
  if (env && env.trim()) return env.trim()
  try {
    const m = document.cookie.match(/(?:^|; )mcp=([^;]+)/)
    if (m && m[1]) return decodeURIComponent(m[1])
  } catch {}
  // Sensible dev default; in production set NEXT_PUBLIC_MCP_BASE_URL or mcp cookie
  return 'http://localhost:62007'
}

// Build an SSE-friendly URL: if a base URL is configured, return absolute URL
// to offload connections from Next.js origin; otherwise, proxy via /api/mcp.
export function sseUrl(pathAndQuery: string): string {
  const base = getMcpBaseUrlClient()
  const path = pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`
  if (base) return `${base.replace(/\/$/, '')}${path}`
  // Fallback to same-origin proxy
  return `/api/mcp${path}`
}

// Hook to subscribe to MCP base changes from context so components re-render
export function useMcpBaseUrl(): string {
  try {
    const { baseUrl } = useMcpConfig()
    return baseUrl
  } catch {
    // If not inside provider, fall back to client resolver
    return getMcpBaseUrlClient() || ''
  }
}
