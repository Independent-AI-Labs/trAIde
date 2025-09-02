"use client"
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
const MultiLineChart = dynamic(() => import('@/components/charts/MultiLineChart').then(m => m.MultiLineChart), { ssr: false })
import { IntervalSelect } from '@/components/ui/IntervalSelect'
import { Field } from '@/components/ui/Field'
import { useFetchers } from '@/lib/data/fetchers'
import { usePref } from '@/lib/prefs'
import { useIdlePrefetch } from '@/lib/data/prefetch'
import { useTicker } from '@/lib/tickConfig'

const COLORS = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24']

export function ComparePanel() {
  const [symbols, setSymbols] = useState<string[]>(['BTCUSDT', 'ETHUSDT', 'SOLUSDT'])
  const [interval, setInterval] = usePref<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('compare.interval', '1m')
  const [data, setData] = useState<Record<string, { t: number; c: number }[]>>({})
  const { fetchKlinesCached } = useFetchers()
  useIdlePrefetch(symbols, interval, 240)
  const tick = useTicker()

  useEffect(() => {
    let cancelled = false
    async function load(sym: string) {
      const cs = await fetchKlinesCached(sym, interval, 240)
      const candles = cs.map((k) => ({ t: k.t, c: k.c }))
      if (!cancelled) setData((d) => ({ ...d, [sym]: candles }))
    }
    // Do not clear existing state to avoid visual resets; update per-symbol instead
    symbols.forEach((s) => { load(s) })
    return () => { cancelled = true }
  }, [symbols.join(','), interval, tick])

  const series = useMemo(() => {
    return symbols.map((s, idx) => {
      const arr = data[s] || []
      if (!arr.length) return { id: s, color: COLORS[idx % COLORS.length]!, data: [] as { t: number; v: number }[] }
      const base = arr[0]!.c || 1
      return { id: s, color: COLORS[idx % COLORS.length]!, data: arr.map((d) => ({ t: d.t, v: (d.c / base) * 100 })) }
    })
  }, [symbols.join(','), data])

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between text-sm">
        <div className="flex items-start gap-3">
          {symbols.map((s, i) => (
            <Field key={i} label={`Symbol ${i + 1}`}>
              <input
                className="w-28 rounded-xl border border-white/15 bg-white/5 px-2 py-1 text-xs uppercase text-white/80 outline-none"
                value={s}
                onChange={(e) => setSymbols((arr) => arr.map((v, idx) => (idx === i ? e.target.value.toUpperCase() : v)))}
              />
            </Field>
          ))}
        </div>
        <IntervalSelect label="Interval" value={interval} onChange={setInterval} />
      </div>
      <MultiLineChart series={series} className="h-60 w-full rounded-xl" />
    </div>
  )
}
