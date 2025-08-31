"use client"
import React, { createContext, useContext, useMemo, useRef } from 'react'

type Entry = { exp: number; data: any }
const MAX_ENTRIES = 200

type Ctx = {
  get: (key: string) => any | undefined
  set: (key: string, data: any, ttlMs?: number) => void
}

const C = createContext<Ctx | null>(null)

export function MarketCacheProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<Map<string, Entry>>(new Map())
  const api = useMemo<Ctx>(() => ({
    get(key) {
      const hit = mapRef.current.get(key)
      if (!hit) return undefined
      if (hit.exp && hit.exp < Date.now()) { mapRef.current.delete(key); return undefined }
      // refresh LRU order
      mapRef.current.delete(key)
      mapRef.current.set(key, hit)
      return hit.data
    },
    set(key, data, ttlMs = 10000) {
      const m = mapRef.current
      if (m.size >= MAX_ENTRIES) {
        // delete oldest
        const first = m.keys().next().value
        if (first) m.delete(first)
      }
      m.set(key, { exp: Date.now() + ttlMs, data })
    },
  }), [])
  return <C.Provider value={api}>{children}</C.Provider>
}

export function useMarketCache() {
  const ctx = useContext(C)
  if (!ctx) throw new Error('useMarketCache must be used within MarketCacheProvider')
  return ctx
}
