"use client"
import { useEffect, useMemo, useState } from 'react'
import { GroupSelect } from '@/components/ui/GroupSelect'
import { IntervalSelect } from '@/components/ui/IntervalSelect'
import { getGroup } from '@/lib/symbols'
import { useFetchers } from '@/lib/data/fetchers'
import { usePref } from '@/lib/prefs'
import { DataTable, Column } from '@/components/ui/DataTable'
import { useIdlePrefetch } from '@/lib/data/prefetch'
import { useTicker } from '@/lib/tickConfig'

// candle type kept implicit via fetchers; avoid unused type warning

type Row = {
  symbol: string
  price: number
  changePct: number
  rangePct: number
  vol: number
  slope: number
}

export function ScannerPanel() {
  const [groupId, setGroupId] = usePref<string>('scanner.group', 'majors')
  const [interval, setInterval] = usePref<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('scanner.interval', '1m')
  const [lookback, setLookback] = usePref<number>('scanner.lookback', 120)
  const [minVol, setMinVol] = usePref<number>('scanner.minVol', 0)
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const { fetchKlinesCached } = useFetchers()
  const tick = useTicker()

  const group = getGroup(groupId)
  useIdlePrefetch(group.symbols, interval, lookback)

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      setLoading(true)
      const res = await Promise.allSettled(
        group.symbols.map(async (sym) => {
          const cs = await fetchKlinesCached(sym, interval, lookback)
          if (!cs.length) return null
          const first = cs[0]!.c
          const last = cs[cs.length - 1]!.c
          const changePct = ((last - first) / first) * 100
          const hi = Math.max(...cs.map((x) => x.h))
          const lo = Math.min(...cs.map((x) => x.l))
          const rangePct = ((hi - lo) / first) * 100
          const vol = cs.reduce((a, b) => a + b.v, 0)
          const slope = linregSlope(cs.map((x) => x.c))
          return { symbol: sym, price: last, changePct, rangePct, vol, slope } as Row
        }),
      )
      const out = res.map((r) => (r.status === 'fulfilled' ? r.value : null)).filter(Boolean) as Row[]
      if (!cancelled) setRows(out)
      setLoading(false)
    }
    loadAll(); return () => { cancelled = true }
  }, [groupId, interval, lookback, tick])

  const filtered = useMemo(() => rows.filter((r) => r.vol >= minVol), [rows, minVol])
  const cols: Column<Row>[] = [
    { key: 'symbol', label: 'Symbol' },
    { key: 'price', label: 'Price', align: 'right', render: (r) => fmt(r.price) },
    { key: 'changePct', label: 'Change%', align: 'right', render: (r) => <span className={r.changePct >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{r.changePct.toFixed(2)}%</span> },
    { key: 'rangePct', label: 'Range%', align: 'right', render: (r) => <span className={r.rangePct >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{r.rangePct.toFixed(2)}%</span> },
    { key: 'vol', label: 'Volume', align: 'right', render: (r) => fmt(r.vol) },
    { key: 'slope', label: 'Trend', align: 'right', render: (r) => <span className={r.slope >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{r.slope.toFixed(4)}</span> },
    { key: 'symbol', label: 'Open', align: 'right', render: (r) => <a className="rounded-lg bg-white/5 px-2 py-1" href={`/app/chart/${r.symbol}`}>Chart</a> },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <GroupSelect value={groupId} onChange={setGroupId} />
        <IntervalSelect value={interval} onChange={setInterval} />
        <label className="ml-2 text-white/70">Lookback
          <input type="number" className="ml-2 w-20 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/90 outline-none" value={lookback} onChange={(e) => setLookback(Number(e.target.value || 0))} />
        </label>
        <label className="ml-2 text-white/70">Min Vol
          <input type="number" className="ml-2 w-28 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/90 outline-none" value={minVol} onChange={(e) => setMinVol(Number(e.target.value || 0))} />
        </label>
        {/** External sort controls removed; DataTable header handles sorting */}
      </div>

      {loading ? (
        <div className="rounded-xl border border-white/10 px-3 py-6 text-center text-white/60">Loading…</div>
      ) : (
        <DataTable rows={filtered} columns={cols} defaultSort={{ key: 'changePct', desc: true }} />
      )}
    </div>
  )
}

function fmt(n: number) {
  if (n > 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n > 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n > 1e3) return (n / 1e3).toFixed(2) + 'K'
  return n.toFixed(4)
}

function linregSlope(vals: number[]) {
  const n = vals.length
  if (!n) return 0
  const xs = vals.map((_, i) => i)
  const xMean = xs.reduce((a, b) => a + b, 0) / n
  const yMean = vals.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) { const dx = xs[i]! - xMean; num += dx * (vals[i]! - yMean); den += dx * dx }
  return den ? num / den : 0
}
