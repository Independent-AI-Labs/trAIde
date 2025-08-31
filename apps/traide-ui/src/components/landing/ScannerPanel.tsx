"use client"
import { useEffect, useMemo, useState } from 'react'
import { GroupSelect } from '@/components/ui/GroupSelect'
import { IntervalSelect } from '@/components/ui/IntervalSelect'
import { getGroup } from '@/lib/symbols'

type Candle = { t: number; o: number; h: number; l: number; c: number; v: number }

type Row = {
  symbol: string
  price: number
  changePct: number
  rangePct: number
  vol: number
  slope: number
}

export function ScannerPanel() {
  const [groupId, setGroupId] = useState('majors')
  const [interval, setInterval] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1m')
  const [lookback, setLookback] = useState(120)
  const [minVol, setMinVol] = useState(0)
  const [sortBy, setSortBy] = useState<keyof Row>('changePct')
  const [desc, setDesc] = useState(true)
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  const group = getGroup(groupId)

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      setLoading(true)
      const out: Row[] = []
      for (const sym of group.symbols) {
        try {
          const r = await fetch(`/api/mcp/klines?symbol=${sym}&interval=${interval}&limit=${lookback}`, { cache: 'no-cache' })
          const j = await r.json()
          const cs: Candle[] = (j?.candles || []).map((k: any) => ({ t: k.t, o: k.o, h: k.h, l: k.l, c: k.c, v: k.v }))
          if (!cs.length) continue
          const first = cs[0]!.c
          const last = cs[cs.length - 1]!.c
          const changePct = ((last - first) / first) * 100
          const hi = Math.max(...cs.map((x) => x.h))
          const lo = Math.min(...cs.map((x) => x.l))
          const rangePct = ((hi - lo) / first) * 100
          const vol = cs.reduce((a, b) => a + b.v, 0)
          const slope = linregSlope(cs.map((x) => x.c))
          out.push({ symbol: sym, price: last, changePct, rangePct, vol, slope })
        } catch {}
      }
      if (!cancelled) setRows(out)
      setLoading(false)
    }
    loadAll(); return () => { cancelled = true }
  }, [groupId, interval, lookback])

  const filtered = useMemo(() => rows.filter((r) => r.vol >= minVol), [rows, minVol])
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const va = a[sortBy]
    const vb = b[sortBy]
    return (desc ? -1 : 1) * (va === vb ? 0 : va > vb ? 1 : -1)
  }), [filtered, sortBy, desc])

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
        <label className="ml-2 text-white/70">Sort
          <select className="ml-2 rounded-xl border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/90 outline-none" value={sortBy} onChange={(e) => setSortBy(e.target.value as keyof Row)}>
            <option value="changePct" className="bg-neutral-900">Change %</option>
            <option value="rangePct" className="bg-neutral-900">Range %</option>
            <option value="vol" className="bg-neutral-900">Volume</option>
            <option value="slope" className="bg-neutral-900">Trend</option>
          </select>
          <button className="ml-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1" onClick={() => setDesc((d) => !d)}>{desc ? 'Desc' : 'Asc'}</button>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Symbol</th>
              <th className="px-3 py-2 text-right font-medium">Price</th>
              <th className="px-3 py-2 text-right font-medium">Change%</th>
              <th className="px-3 py-2 text-right font-medium">Range%</th>
              <th className="px-3 py-2 text-right font-medium">Volume</th>
              <th className="px-3 py-2 text-right font-medium">Trend</th>
              <th className="px-3 py-2 text-right font-medium">Open</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-white/60">Loading…</td></tr>
            )}
            {!loading && sorted.map((r) => (
              <tr key={r.symbol} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-3 py-2 font-medium text-white/90">{r.symbol}</td>
                <td className="px-3 py-2 text-right">{fmt(r.price)}</td>
                <td className={cls(r.changePct)}>{r.changePct.toFixed(2)}%</td>
                <td className={cls(r.rangePct)}>{r.rangePct.toFixed(2)}%</td>
                <td className="px-3 py-2 text-right">{fmt(r.vol)}</td>
                <td className={cls(r.slope)}>{r.slope.toFixed(4)}</td>
                <td className="px-3 py-2 text-right"><a className="rounded-lg bg-white/5 px-2 py-1" href={`/app/chart/${r.symbol}`}>Chart</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function cls(v: number) {
  return `px-3 py-2 text-right ${v >= 0 ? 'text-emerald-300' : 'text-rose-300'}`
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

