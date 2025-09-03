"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSSE } from '@/lib/useSSE'
import { sseUrl } from '@/lib/mcp'

export type BatchKlineEvent = { type: 'kline'; symbol: string; candle?: { t: number; c: number } }

export function useBatchKlines(symbols: string[], interval: string, opts?: { throttleMs?: number; enabled?: boolean }) {
  const list = useMemo(() => Array.from(new Set(symbols.map((s) => s.toUpperCase()).filter(Boolean))), [symbols.join(',')])
  const qs = useMemo(() => (list.length ? `symbols=${encodeURIComponent(list.join(','))}&interval=${encodeURIComponent(interval)}` : ''), [list, interval])
  const url = useMemo(() => (qs ? sseUrl(`/stream/klines/batch?${qs}`) : undefined), [qs])
  const { last, connected } = useSSE<BatchKlineEvent>(url, { enabled: Boolean(url) && (opts?.enabled ?? true), throttleMs: Math.max(0, opts?.throttleMs ?? 0) })
  const [map, setMap] = useState<Map<string, { t: number; c: number }>>(new Map())
  const lastTs = useRef<Map<string, number>>(new Map())
  useEffect(() => {
    if (!last || last.type !== 'kline' || !last.candle || !last.symbol) return
    const sym = last.symbol.toUpperCase()
    const { t, c } = last.candle
    setMap((old) => {
      const next = new Map(old)
      const prevT = lastTs.current.get(sym) || 0
      if (t >= prevT) { next.set(sym, { t, c }); lastTs.current.set(sym, t) }
      return next
    })
  }, [last])
  useEffect(() => { setMap(new Map()); lastTs.current.clear() }, [qs])
  return { lastBySymbol: map, connected }
}

