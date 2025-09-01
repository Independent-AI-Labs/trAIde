"use client"
import { useSSE } from '@/lib/useSSE'
import { sseUrl } from '@/lib/mcp'
import { useEffect, useRef, useState } from 'react'
import { MiniChart } from '../charts/MiniChart'
import { StatusPill } from '@/components/ui/StatusPill'

type KlineEvent = {
  type: 'kline'
  symbol: string
  interval: string
  candle?: { t: number; o: number; h: number; l: number; c: number; v: number }
  deltas?: Record<string, number | null>
}

export function HeroChartLive({ symbol = 'BTCUSDT', interval = '1m' }: { symbol?: string; interval?: string }) {
  // Proxy through same-origin to avoid CORS, the server route forwards to baseUrl
  const url = sseUrl(`/stream/klines?symbol=${symbol}&interval=${interval}&indicators=ppo,rsi`)
  const { last, connected } = useSSE<KlineEvent>(url, true)
  const [series, setSeries] = useState<{ t: number; c: number }[]>([])
  const lastTs = useRef<number>(0)

  useEffect(() => {
    // trim to last 200 points to keep it light
    if (series.length > 220) setSeries((s) => s.slice(-200))
  }, [series])

  useEffect(() => {
    if (!last || last.type !== 'kline' || !last.candle) return
    const { t, c } = last.candle
    if (t === lastTs.current) {
      setSeries((s) => (s.length ? [...s.slice(0, -1), { t, c }] : [{ t, c }]))
    } else if (t > lastTs.current) {
      setSeries((s) => [...s, { t, c }])
      lastTs.current = t
    }
  }, [last])

  // Seed with recent history so chart isn't empty
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const r = await fetch(`/api/mcp/klines?symbol=${symbol}&interval=${interval}&limit=200`, { cache: 'no-cache' })
        if (!r.ok) throw new Error('history_fetch_error')
        const j = await r.json()
        const candles: { t: number; c: number }[] = (j?.candles || []).map((k: any) => ({ t: k.t, c: k.c }))
        if (!cancelled) {
          setSeries(candles)
          lastTs.current = candles.length ? candles[candles.length - 1]!.t : 0
        }
      } catch {
        // ignore for now
      } finally {
        // noop
      }
    }
    load()
    return () => { cancelled = true }
  }, [symbol, interval])

  return (
    <div className="relative">
      <div className="absolute right-3 top-3 z-10">
        <StatusPill label={`${symbol} · ${interval}`} connected={connected} />
      </div>
      <MiniChart data={series} className="h-64 w-full rounded-xl" />
    </div>
  )
}
