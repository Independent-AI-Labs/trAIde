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
    // Probe /health; if 404/failed, try fallbacks (:62007, :65000, :8787)
    ;(async () => {
      try {
        const resp = await fetch(val.replace(/\/$/, '') + '/health', { mode: 'cors' })
        if (!resp.ok) throw new Error('bad_status')
        const j = await resp.json().catch(() => ({}))
        if (j && j.status === 'ok') return
      } catch {
        const candidates: string[] = []
        try {
          const loc = new URL(window.location.origin)
          candidates.push(`${loc.protocol}//${loc.hostname}:62007`)
          candidates.push(`${loc.protocol}//${loc.hostname}:65000`)
          candidates.push(`${loc.protocol}//${loc.hostname}:8787`)
        } catch {}
        // Fallbacks commonly used in local/dev LANs
        candidates.push('http://localhost:62007')
        // Avoid pinning to specific IP unless provided via ?mcp or Settings
        for (const c of candidates) {
          try {
            const r = await fetch(c.replace(/\/$/, '') + '/health', { mode: 'cors' })
            if (r.ok) {
              setBaseUrlState(c)
              try {
                localStorage.setItem(KEY, c)
                document.cookie = `mcp=${encodeURIComponent(c)}; path=/; max-age=${60 * 60 * 24 * 365}`
              } catch {}
              return
            }
          } catch {}
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
