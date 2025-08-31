"use client"
import { useMcpConfig } from '@/lib/config'
import { useSSE } from '@/lib/useSSE'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MiniChart } from '../charts/MiniChart'

type KlineEvent = {
  type: 'kline'
  symbol: string
  interval: string
  candle?: { t: number; o: number; h: number; l: number; c: number; v: number }
  deltas?: Record<string, number | null>
}

export function HeroChartLive({ symbol = 'BTCUSDT', interval = '1m' }: { symbol?: string; interval?: string }) {
  const { baseUrl } = useMcpConfig()
  // Proxy through same-origin to avoid CORS, the server route forwards to baseUrl
  const url = `/api/mcp/stream/klines?symbol=${symbol}&interval=${interval}&indicators=ppo,rsi`
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

  const status = useMemo(() => (connected ? 'LIVE' : 'RECONNECTING'), [connected])

  return (
    <div className="relative">
      <div className="absolute right-3 top-3 z-10 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
        {symbol} · {interval} · {status}
      </div>
      <MiniChart data={series} className="h-64 w-full rounded-xl" />
    </div>
  )
}
