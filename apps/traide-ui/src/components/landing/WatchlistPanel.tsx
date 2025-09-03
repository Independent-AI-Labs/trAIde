"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { MiniChart } from '@/components/charts/MiniChart'
import { useMcpBaseUrl } from '@/lib/mcp'
import { useTickMs } from '@/lib/tickConfig'
import { useModals } from '@/lib/ui/modals'
import { useBatchKlines } from '@/lib/stream/useBatchKlines'
import { useFetchers } from '@/lib/data/fetchers'

type KEvent = { type: 'kline'; candle?: { t: number; c: number } }

const DEFAULT = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT']

export function WatchlistPanel({ symbols = DEFAULT, interval = '1m' }: { symbols?: string[]; interval?: string }) {
  const { lastBySymbol, connected } = useBatchKlines(symbols, interval)
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {symbols.map((s) => (
        <WatchItem key={s} symbol={s} interval={interval} last={lastBySymbol.get(s.toUpperCase())} connected={connected} />
      ))}
    </div>
  )
}

function WatchItem({ symbol, interval, last, connected }: { symbol: string; interval: string; last?: { t: number; c: number }; connected?: boolean }) {
  useMcpBaseUrl()
  const tickMs = useTickMs()
  const [series, setSeries] = useState<{ t: number; c: number }[]>([])
  const [base, setBase] = useState<number | null>(null)
  const lastTs = useRef(0)
  const { openChart } = useModals()
  const { fetchKlinesCached } = useFetchers()

  useEffect(() => {
    let cancelled = false
    async function seed() {
      const cs = await fetchKlinesCached(symbol, interval, 60)
      if (!cancelled) {
        const candles = cs.map((k) => ({ t: k.t, c: k.c }))
        setSeries(candles)
        lastTs.current = candles.length ? candles[candles.length - 1]!.t : 0
        setBase(candles.length ? candles[0]!.c : null)
      }
    }
    seed(); return () => { cancelled = true }
  }, [symbol, interval])

  useEffect(() => {
    if (!last) return
    const { t, c } = last
    if (t === lastTs.current) setSeries((s) => (s.length ? [...s.slice(0, -1), { t, c }] : [{ t, c }]))
    else if (t > lastTs.current) { setSeries((s) => [...s, { t, c }]); lastTs.current = t }
  }, [last?.t, last?.c])

  const price = series.length ? series[series.length - 1]!.c : null
  const changePct = useMemo(() => {
    if (price == null || base == null) return null
    return ((price - base) / base) * 100
  }, [price, base])

  return (
    <button onClick={() => openChart(symbol)} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left backdrop-blur hover:bg-white/10">
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
    </button>
  )
}
