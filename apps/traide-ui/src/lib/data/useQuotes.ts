"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNetConfig } from '@/lib/net/config'

export type Quote = { price: number; dir: 1 | 0 | -1 }

export function useBatchQuotes(symbols: string[], { interval = '1m', refreshMs = 1500, limit = 1 }: { interval?: string; refreshMs?: number; limit?: number } = {}) {
  const { schedule } = useNetConfig()
  const [map, setMap] = useState<Map<string, Quote>>(new Map())
  const prevRef = useRef<Map<string, number>>(new Map())
  const timer = useRef<number | null>(null)
  const list = useMemo(() => Array.from(new Set(symbols)).filter(Boolean), [symbols.join(',')])

  useEffect(() => {
    let cancelled = false
    async function tick() {
      if (cancelled || list.length === 0) return
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
    tick()
    return () => {
      cancelled = true
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [list, interval, refreshMs, limit, schedule])

  return map
}

