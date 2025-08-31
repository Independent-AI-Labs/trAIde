"use client"
import { useMarketCache } from './market-cache'

export type Kline = { t: number; o: number; h: number; l: number; c: number; v: number }

export function useFetchers() {
  const cache = useMarketCache()
  async function fetchKlinesCached(symbol: string, interval: string, limit = 240, ttl = 10_000): Promise<Kline[]> {
    const key = `klines:${symbol}:${interval}:${limit}`
    const hit = cache.get(key)
    if (hit) return hit as Kline[]
    const r = await fetch(`/api/mcp/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`, { cache: 'no-cache' })
    if (!r.ok) throw new Error('klines_fetch_error')
    const j = await r.json()
    const arr = (j?.candles || []).map((k: any) => ({ t: k.t, o: k.o, h: k.h, l: k.l, c: k.c, v: k.v })) as Kline[]
    cache.set(key, arr, ttl)
    return arr
  }
  return { fetchKlinesCached }
}

