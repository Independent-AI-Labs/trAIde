"use client"
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const KEY = 'traide.mcpBaseUrl'

function normalizeBaseUrl(v: string) {
  let s = (v || '').trim()
  if (!s) return ''
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`
  // remove trailing slash
  s = s.replace(/\/$/, '')
  return s
}


function defaultBaseUrl() {
  // Prefer current host with MCP port to avoid localhost-stuck issues
  try {
    const loc = new URL(window.location.origin)
    return `${loc.protocol}//${loc.hostname}:62007`
  } catch {
    return 'http://localhost:62007'
  }
}

type Ctx = {
  baseUrl: string
  setBaseUrl: (v: string) => void
}

const C = createContext<Ctx | null>(null)

export function MCPConfigProvider({ children }: { children: React.ReactNode }) {
  const [baseUrl, setBaseUrlState] = useState<string>(defaultBaseUrl())

  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const qp = url.searchParams.get('mcp')
    const ls = localStorage.getItem(KEY)
    const def = defaultBaseUrl()
    // Prefer query param when present
    if (qp) {
      const val = normalizeBaseUrl(qp)
      setBaseUrlState(val)
      try {
        localStorage.setItem(KEY, val)
        document.cookie = `mcp=${encodeURIComponent(val)}; path=/; max-age=${60 * 60 * 24 * 365}`
      } catch {}
      return
    }
    // Start from saved or sensible default (current host:62007)
    const normalized = normalizeBaseUrl(ls || '')
    const val = normalized || def
    setBaseUrlState(val)
    try { document.cookie = `mcp=${encodeURIComponent(val)}; path=/; max-age=${60 * 60 * 24 * 365}` } catch {}
    // Probe via same-origin proxy to avoid browser CORS/noise; try sensible fallbacks only
    ;(async () => {
      async function okFor(candidate: string) {
        try {
          document.cookie = `mcp=${encodeURIComponent(candidate.replace(/\/$/, ''))}; path=/; max-age=${60 * 60 * 24 * 365}`
          const resp = await fetch('/api/mcp/health', { cache: 'no-store' })
          if (!resp.ok) return false
          const j = await resp.json().catch(() => null)
          return Boolean(j && (j.status === 'ok' || j.provider))
        } catch {
          return false
        }
      }
      if (await okFor(val)) return
      const candidates: string[] = []
      try {
        const loc = new URL(window.location.origin)
        candidates.push(`${loc.protocol}//${loc.hostname}:62007`)
      } catch {}
      candidates.push('http://localhost:62007')
      for (const c of candidates) {
        if (await okFor(c)) {
          setBaseUrlState(c)
          try {
            localStorage.setItem(KEY, c)
            document.cookie = `mcp=${encodeURIComponent(c)}; path=/; max-age=${60 * 60 * 24 * 365}`
          } catch {}
          return
        }
      }
    })()
  }, [])

  const setBaseUrl = (v: string) => {
    const norm = normalizeBaseUrl(v)
    setBaseUrlState(norm)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(KEY, norm)
        // also set cookie for server proxy
        document.cookie = `mcp=${encodeURIComponent(norm)}; path=/; max-age=${60 * 60 * 24 * 365}`
      }
    } catch {}
  }

  const value = useMemo(() => ({ baseUrl, setBaseUrl }), [baseUrl])
  return <C.Provider value={value}>{children}</C.Provider>
}

export function useMcpConfig() {
  const ctx = useContext(C)
  if (!ctx) throw new Error('useMcpConfig must be used within MCPConfigProvider')
  return ctx
}
