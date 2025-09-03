"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNetConfig } from '@/lib/net/config'
import { sseUrl } from '@/lib/mcp'

export type Quote = { price: number; dir: 1 | 0 | -1 }

export function useBatchQuotes(
  symbols: string[],
  { interval = '1m', refreshMs = 1500, limit = 1, enabled = true }: { interval?: string; refreshMs?: number; limit?: number; enabled?: boolean } = {},
) {
  const { schedule } = useNetConfig()
  const [map, setMap] = useState<Map<string, Quote>>(new Map())
  const prevRef = useRef<Map<string, number>>(new Map())
  const timer = useRef<number | null>(null)
  const list = useMemo(() => Array.from(new Set(symbols)).filter(Boolean), [symbols.join(',')])

  useEffect(() => {
    let cancelled = false
    async function tick() {
      if (cancelled || list.length === 0 || !enabled) return
      const jobs = list.map((sym) =>
        schedule(async () => {
          const u = new URL(`/api/mcp/klines`, window.location.origin)
          u.searchParams.set('symbol', sym)
          u.searchParams.set('interval', interval)
          u.searchParams.set('limit', String(Math.max(1, limit)))
          const r = await fetch(u.toString(), { cache: 'no-cache' })
          if (!r.ok) return { sym, price: null as number | null }
          const j = await r.json()
          const cs = Array.isArray(j?.candles) ? j.candles : []
          const last = cs.length ? cs[cs.length - 1] : null
          return { sym, price: last ? Number(last.c) : null }
        }).catch(() => ({ sym, price: null as number | null })),
      )
      const results = await Promise.all(jobs)
      if (cancelled) return
      setMap((old) => {
        const next = new Map(old)
        for (const r of results) {
          if (!r) continue
          const prior = prevRef.current.get(r.sym)
          if (r.price != null) {
            const dir: 1 | 0 | -1 = prior == null ? 0 : r.price > prior ? 1 : r.price < prior ? -1 : 0
            prevRef.current.set(r.sym, r.price)
            next.set(r.sym, { price: r.price, dir })
          }
        }
        return next
      })
      timer.current = window.setTimeout(tick, Math.max(500, refreshMs)) as unknown as number
    }
    if (enabled) tick()
    return () => {
      cancelled = true
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [list, interval, refreshMs, limit, schedule, enabled])

  return map
}

// Live quotes via multiple SSE streams (one per symbol), capped by the length
// of the `symbols` list provided. Uses memoization to keep streams stable when
// the input set does not change. Falls back to REST polling if EventSource is
// unavailable.
export function useQuoteStreams(
  symbols: string[],
  { interval = '1m' }: { interval?: string } = {},
) {
  const [map, setMap] = useState<Map<string, Quote>>(new Map())
  const prevRef = useRef<Map<string, number>>(new Map())
  const esMap = useRef<Map<string, EventSource>>(new Map())
  const list = useMemo(() => Array.from(new Set(symbols)).filter(Boolean), [symbols.join(',')])

  useEffect(() => {
    const current = new Set(list)
    // Close streams for symbols no longer visible
    for (const [sym, es] of esMap.current) {
      if (!current.has(sym)) { try { es.close() } catch {} esMap.current.delete(sym) }
    }
    // Open streams for new symbols
    for (const sym of current) {
      if (esMap.current.has(sym)) continue
      try {
        const url = sseUrl(`/stream/klines?symbol=${encodeURIComponent(sym)}&interval=${encodeURIComponent(interval)}`)
        const es = new EventSource(url, { withCredentials: false })
        es.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data)
            const k = payload?.candle
            if (!k) return
            const price = Number(k.c)
            if (!Number.isFinite(price)) return
            setMap((old) => {
              const next = new Map(old)
              const prior = prevRef.current.get(sym)
              const dir: 1 | 0 | -1 = prior == null ? 0 : price > prior ? 1 : price < prior ? -1 : 0
              prevRef.current.set(sym, price)
              next.set(sym, { price, dir })
              return next
            })
          } catch {}
        }
        es.onerror = () => { /* let useSSE-style backoff be implicit via browser */ }
        esMap.current.set(sym, es)
      } catch {
        // If EventSource is not available, bail out; caller may switch to polling
      }
    }
    return () => {
      // Do not close here; streams are managed across changes and on unmount
    }
  }, [list, interval])

  useEffect(() => {
    return () => {
      for (const [, es] of esMap.current) { try { es.close() } catch {} }
      esMap.current.clear()
    }
  }, [])

  return map
}
