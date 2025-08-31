"use client"
import { useMarketCache } from './market-cache'
import { useNetConfig } from '@/lib/net/config'

export type Kline = { t: number; o: number; h: number; l: number; c: number; v: number }

export function useFetchers() {
  const cache = useMarketCache()
  const { schedule, ttlMs: defaultTtl } = useNetConfig()
  async function fetchKlinesCached(symbol: string, interval: string, limit = 240, ttl = 10_000): Promise<Kline[]> {
    const key = `klines:${symbol}:${interval}:${limit}`
    const hit = cache.get(key)
    if (hit) return hit as Kline[]
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
  }
  return { fetchKlinesCached }
}
