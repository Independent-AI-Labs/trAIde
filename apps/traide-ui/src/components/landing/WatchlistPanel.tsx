"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { MiniChart } from '@/components/charts/MiniChart'
import { useSSE } from '@/lib/useSSE'

type KEvent = { type: 'kline'; candle?: { t: number; c: number } }

const DEFAULT = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT']

export function WatchlistPanel({ symbols = DEFAULT, interval = '1m' }: { symbols?: string[]; interval?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {symbols.map((s) => (
        <WatchItem key={s} symbol={s} interval={interval} />
      ))}
    </div>
  )
}

function WatchItem({ symbol, interval }: { symbol: string; interval: string }) {
  const url = `/api/mcp/stream/klines?symbol=${symbol}&interval=${interval}`
  const { last, connected } = useSSE<KEvent>(url, true)
  const [series, setSeries] = useState<{ t: number; c: number }[]>([])
  const [base, setBase] = useState<number | null>(null)
  const lastTs = useRef(0)

  useEffect(() => {
    let cancelled = false
    async function seed() {
      try {
        const r = await fetch(`/api/mcp/klines?symbol=${symbol}&interval=${interval}&limit=60`, { cache: 'no-cache' })
        const j = await r.json()
        const candles: { t: number; c: number }[] = (j?.candles || []).map((k: any) => ({ t: k.t, c: k.c }))
        if (!cancelled) {
          setSeries(candles)
          lastTs.current = candles.length ? candles[candles.length - 1]!.t : 0
          setBase(candles.length ? candles[0]!.c : null)
        }
      } catch {}
    }
    seed()
    return () => { cancelled = true }
  }, [symbol, interval])

  useEffect(() => {
    if (!last || last.type !== 'kline' || !last.candle) return
    const { t, c } = last.candle
    if (t === lastTs.current) setSeries((s) => (s.length ? [...s.slice(0, -1), { t, c }] : [{ t, c }]))
    else if (t > lastTs.current) { setSeries((s) => [...s, { t, c }]); lastTs.current = t }
  }, [last])

  const price = series.length ? series[series.length - 1]!.c : null
  const changePct = useMemo(() => {
    if (price == null || base == null) return null
    return ((price - base) / base) * 100
  }, [price, base])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
      <div className="mb-2 flex items-center justify-between text-sm">
        <div className="font-medium text-white/90">{symbol}</div>
        <div className="flex items-center gap-2">
          <span className={changePct == null ? 'text-white/60' : changePct >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
            {changePct == null ? '—' : `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`}
          </span>
          <span className={connected ? 'text-emerald-300' : 'text-amber-300'}>•</span>
        </div>
      </div>
      <MiniChart data={series} className="h-28 w-full rounded-xl" />
    </div>
  )
}

