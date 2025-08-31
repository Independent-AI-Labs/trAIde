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

function isLocalhostUrl(v: string) {
  try {
    const u = new URL(v)
    return (
      u.hostname === 'localhost' ||
      u.hostname === '127.0.0.1' ||
      u.hostname === '::1'
    )
  } catch {
    return false
  }
}

function defaultBaseUrl() {
  // VM default requested
  return 'http://172.72.72.2:8080'
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
      try { localStorage.setItem(KEY, val) } catch {}
      return
    }
    // Migrate away from localhost-stuck values
    const normalized = normalizeBaseUrl(ls || '')
    if (normalized && isLocalhostUrl(normalized)) {
      setBaseUrlState(def)
      try { localStorage.setItem(KEY, def) } catch {}
      // continue to probe
    }
    const val = normalized || def
    setBaseUrlState(val)
    // Probe /health; if 404/failed, try fallbacks (:65000, :8787)
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
          candidates.push(`${loc.protocol}//${loc.hostname}:65000`)
          candidates.push(`${loc.protocol}//${loc.hostname}:8787`)
        } catch {}
        candidates.push('http://172.72.72.2:65000')
        candidates.push('http://172.72.72.2:8787')
        for (const c of candidates) {
          try {
            const r = await fetch(c.replace(/\/$/, '') + '/health', { mode: 'cors' })
            if (r.ok) {
              setBaseUrlState(c)
              try { localStorage.setItem(KEY, c) } catch {}
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
