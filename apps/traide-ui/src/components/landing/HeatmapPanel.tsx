"use client"
import { useEffect, useMemo, useState } from 'react'
import { getGroup } from '@/lib/symbols'
import { IntervalSelect } from '@/components/ui/IntervalSelect'

export function HeatmapPanel() {
  const [groupId, setGroupId] = useState('majors')
  const [interval, setInterval] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1m')
  const group = getGroup(groupId)
  const [rows, setRows] = useState<{ symbol: string; changePct: number }[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const out: { symbol: string; changePct: number }[] = []
      for (const sym of group.symbols) {
        try {
          const r = await fetch(`/api/mcp/klines?symbol=${sym}&interval=${interval}&limit=60`, { cache: 'no-cache' })
          const j = await r.json()
          const cs = (j?.candles || [])
          if (!cs.length) continue
          const first = cs[0]!.c
          const last = cs[cs.length - 1]!.c
          const changePct = ((last - first) / first) * 100
          out.push({ symbol: sym, changePct })
        } catch {}
      }
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
    const g = Math.round(200 + 55 * norm)
    return `linear-gradient(180deg, rgba(16,185,129,${0.25 + 0.35 * norm}), rgba(16,185,129,${0.1 + 0.2 * norm}))`
  } else {
    const r = Math.round(244)
    return `linear-gradient(180deg, rgba(244,63,94,${0.25 + 0.35 * norm}), rgba(244,63,94,${0.1 + 0.2 * norm}))`
  }
}

