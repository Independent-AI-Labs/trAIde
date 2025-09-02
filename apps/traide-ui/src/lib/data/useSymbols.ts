"use client"
import { useEffect, useState } from 'react'
import { useMarketCache } from './market-cache'
import { useNetConfig } from '@/lib/net/config'

export function useSymbols() {
  const cache = useMarketCache()
  const { schedule, ttlMs } = useNetConfig()
  const [symbols, setSymbols] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    const key = 'symbols:v1'
    const prior = cache.get(key) as string[] | undefined
    if (prior && Array.isArray(prior) && prior.length) { setSymbols(prior) }
    setLoading(true)
    schedule(async () => {
      const r = await fetch('/api/mcp/symbols', { cache: 'no-cache' })
      if (!r.ok) throw new Error('symbols_fetch_error')
      const j = await r.json()
      const arr = Array.isArray(j?.symbols) ? (j.symbols as string[]) : []
      return arr
    }).then((arr) => {
      if (cancelled) return
      cache.set(key, arr, ttlMs)
      setSymbols(arr)
    }).catch(() => { if (!cancelled) setError('symbols_error') }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])
  return { symbols, loading, error }
}

