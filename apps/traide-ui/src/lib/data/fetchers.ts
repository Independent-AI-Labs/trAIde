"use client"
import { useMarketCache } from './market-cache'
import { useNetConfig } from '@/lib/net/config'

export type Kline = { t: number; o: number; h: number; l: number; c: number; v: number }

export function useFetchers() {
  const cache = useMarketCache()
  const { schedule, ttlMs: defaultTtl } = useNetConfig()
  async function fetchKlinesCached(symbol: string, interval: string, limit = 240, ttl = 10_000): Promise<Kline[]> {
    const key = `klines:${symbol}:${interval}:${limit}`
    const prior = cache.get(key) as Kline[] | undefined
    if (prior) return prior
    try {
      const arr = await schedule(async () => {
        const r = await fetch(`/api/mcp/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`, { cache: 'no-cache' })
        if (!r.ok) throw new Error('klines_fetch_error')
        const j = await r.json()
        const list = Array.isArray(j?.candles) ? j.candles : []
        const valid = list.filter((k: any) => k && typeof k.t === 'number' && typeof k.c === 'number' && typeof k.h === 'number' && typeof k.l === 'number' && typeof k.o === 'number' && typeof k.v === 'number')
        return valid.map((k: any) => ({ t: k.t, o: k.o, h: k.h, l: k.l, c: k.c, v: k.v })) as Kline[]
      })
      cache.set(key, arr, ttl ?? defaultTtl)
      return arr
    } catch {
      // graceful SWR fallback: serve prior if any, else empty
      return prior ?? []
    }
  }
  async function fetchKlinesBatchCached(symbols: string[], interval: string, limit = 240, ttl = 10_000): Promise<Record<string, Kline[]>> {
    const norm = Array.from(new Set(symbols.map((s) => s.toUpperCase()).filter(Boolean)))
    if (norm.length === 0) return {}
    const key = `klines_batch:${norm.join(',')}:${interval}:${limit}`
    const prior = cache.get(key) as Record<string, Kline[]> | undefined
    if (prior) return prior
    try {
      const qs = new URLSearchParams({ symbols: norm.join(','), interval, limit: String(limit) }).toString()
      const res = await schedule(async () => {
        const r = await fetch(`/api/mcp/klines/batch?${qs}`, { cache: 'no-cache' })
        if (!r.ok) throw new Error('klines_batch_fetch_error')
        const j = await r.json()
        const obj = (j?.result || {}) as Record<string, any[]>
        const out: Record<string, Kline[]> = {}
        for (const sym of Object.keys(obj)) {
          const list = Array.isArray(obj[sym]) ? obj[sym] : []
          const valid = list.filter((k: any) => k && typeof k.t === 'number' && typeof k.c === 'number' && typeof k.h === 'number' && typeof k.l === 'number' && typeof k.o === 'number' && typeof k.v === 'number')
          out[sym] = valid.map((k: any) => ({ t: k.t, o: k.o, h: k.h, l: k.l, c: k.c, v: k.v }))
        }
        return out
      })
      cache.set(key, res, ttl ?? defaultTtl)
      return res
    } catch {
      return prior ?? {}
    }
  }
  return { fetchKlinesCached, fetchKlinesBatchCached }
}
