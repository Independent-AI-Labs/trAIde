"use client"
import { useEffect, useMemo, useState } from 'react'
import { getGroup } from '@/lib/symbols'
import { IntervalSelect } from '@/components/ui/IntervalSelect'
import { useFetchers } from '@/lib/data/fetchers'
import { usePref } from '@/lib/prefs'
import { useIdlePrefetch } from '@/lib/data/prefetch'

export function HeatmapPanel() {
  const [groupId, setGroupId] = usePref<string>('heatmap.group', 'majors')
  const [interval, setInterval] = usePref<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('heatmap.interval', '1m')
  const group = getGroup(groupId)
  useIdlePrefetch(group.symbols, interval, 60)
  const [rows, setRows] = useState<{ symbol: string; changePct: number }[]>([])
  const { fetchKlinesCached } = useFetchers()

  useEffect(() => {
    let cancelled = false
    async function load() {
      const res = await Promise.allSettled(
        group.symbols.map(async (sym) => {
          const cs = await fetchKlinesCached(sym, interval, 60)
          if (!cs.length) return null
          const first = cs[0]!.c
          const last = cs[cs.length - 1]!.c
          const changePct = ((last - first) / first) * 100
          return { symbol: sym, changePct }
        }),
      )
      const out = res.map((r) => (r.status === 'fulfilled' ? r.value : null)).filter(Boolean) as { symbol: string; changePct: number }[]
      if (!cancelled) setRows(out)
    }
    load(); return () => { cancelled = true }
  }, [groupId, interval])

  const min = useMemo(() => Math.min(...rows.map((r) => r.changePct), 0), [rows])
  const max = useMemo(() => Math.max(...rows.map((r) => r.changePct), 0), [rows])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <select className="rounded-xl border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/90" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          <option value="majors" className="bg-neutral-900">Majors</option>
          <option value="l1" className="bg-neutral-900">Layer 1</option>
          <option value="defi" className="bg-neutral-900">DeFi</option>
        </select>
        <IntervalSelect value={interval} onChange={setInterval} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.symbol} className="rounded-xl p-3 text-sm text-white/90" style={{ background: colorFor(r.changePct, min, max) }}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{r.symbol}</span>
              <span className={r.changePct >= 0 ? 'text-emerald-900' : 'text-rose-900'}>{r.changePct >= 0 ? '+' : ''}{r.changePct.toFixed(2)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function colorFor(v: number, min: number, max: number) {
  // Map to gradient from rose to neutral to emerald
  const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
  const norm = v >= 0 ? (max ? clamp(v / max, 0, 1) : 0) : (min ? clamp(v / min, 0, 1) : 0)
  if (v >= 0) {
    return `linear-gradient(180deg, rgba(16,185,129,${0.25 + 0.35 * norm}), rgba(16,185,129,${0.1 + 0.2 * norm}))`
  } else {
    return `linear-gradient(180deg, rgba(244,63,94,${0.25 + 0.35 * norm}), rgba(244,63,94,${0.1 + 0.2 * norm}))`
  }
}
