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
    let timer: number | null = null
    const key = 'symbols:v1'

    const shallowEqual = (a: string[], b: string[]) => {
      if (a === b) return true
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
      return true
    }

    const loadOnce = async () => {
      try {
        const r = await fetch('/api/mcp/symbols', { cache: 'no-cache' })
        if (!r.ok) throw new Error('symbols_fetch_error')
        const j = await r.json()
        const arr = Array.isArray(j?.symbols) ? (j.symbols as string[]) : []
        const uniq = Array.from(new Set(arr)).filter(Boolean)
        uniq.sort()
        return uniq
      } catch (e) {
        throw e
      }
    }

    const loop = async () => {
      setLoading(true)
      try {
        const arr = await schedule(loadOnce)
        if (cancelled) return
        const prior = cache.get(key) as string[] | undefined
        if (!prior || !shallowEqual(prior, arr)) {
          cache.set(key, arr, ttlMs)
          setSymbols(arr)
        }
      } catch {
        if (!cancelled) setError('symbols_error')
      } finally {
        if (!cancelled) setLoading(false)
        // schedule next refresh respecting ttl
        timer = window.setTimeout(loop, Math.max(5000, ttlMs)) as unknown as number
      }
    }

    const warm = cache.get(key) as string[] | undefined
    if (warm && Array.isArray(warm) && warm.length) setSymbols(warm)
    loop()
    return () => { cancelled = true; if (timer) window.clearTimeout(timer) }
  }, [cache, schedule, ttlMs])
  return { symbols, loading, error }
}
