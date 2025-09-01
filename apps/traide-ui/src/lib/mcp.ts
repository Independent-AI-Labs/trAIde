"use client"
import { useMcpConfig } from '@/lib/config'

// Client-side helper to resolve MCP base URL for SSE and other direct calls.
// Order of precedence (robust): localStorage (user setting) → NEXT_PUBLIC_MCP_BASE_URL → `mcp` cookie → window.location host:62007 → undefined.
export function getMcpBaseUrlClient(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const ls = window.localStorage.getItem('traide.mcpBaseUrl')
    if (ls && ls.trim()) return ls.trim()
  } catch {}
  const env = process.env.NEXT_PUBLIC_MCP_BASE_URL
  if (env && env.trim()) return env.trim()
  try {
    const m = document.cookie.match(/(?:^|; )mcp=([^;]+)/)
    if (m && m[1]) return decodeURIComponent(m[1])
  } catch {}
  try {
    const loc = new URL(window.location.origin)
    return `${loc.protocol}//${loc.hostname}:62007`
  } catch {}
  return undefined
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
