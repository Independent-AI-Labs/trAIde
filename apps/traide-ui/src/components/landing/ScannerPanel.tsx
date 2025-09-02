"use client"
import { useEffect, useMemo, useState } from 'react'
import { GroupSelect } from '@/components/ui/GroupSelect'
import { IntervalSelect } from '@/components/ui/IntervalSelect'
import { Field } from '@/components/ui/Field'
import { getGroup } from '@/lib/symbols'
import { useFetchers } from '@/lib/data/fetchers'
import { useMcpBaseUrl } from '@/lib/mcp'
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
  // Touch MCP base/proxy early to ensure correct origin/cookie resolution
  useMcpBaseUrl()
  const [groupId, setGroupId] = usePref<string>('scanner.group', 'majors')
  const [interval, setInterval] = usePref<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('scanner.interval', '1m')
  const [lookback, setLookback] = usePref<number>('scanner.lookback', 120)
  const [minVol, setMinVol] = usePref<number>('scanner.minVol', 0)
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [rules, setRules] = useState<Array<{ key: keyof Row; op: '>=' | '<=' | '>' | '<'; value: number }>>([
    { key: 'changePct', op: '>=', value: -1000 },
  ])
  const { fetchKlinesCached } = useFetchers()
  const tick = useTicker()

  const group = getGroup(groupId)
  useIdlePrefetch(group.symbols, interval, lookback)

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      setLoading((was) => (rows.length === 0 ? true : was))
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

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (r.vol < minVol) return false
      for (const rule of rules) {
        const lhs = r[rule.key] as number
        const rhs = rule.value
        if (rule.op === '>=') { if (!(lhs >= rhs)) return false }
        if (rule.op === '<=') { if (!(lhs <= rhs)) return false }
        if (rule.op === '>') { if (!(lhs > rhs)) return false }
        if (rule.op === '<') { if (!(lhs < rhs)) return false }
      }
      return true
    })
  }, [rows, minVol, rules])
  const cols: Column<Row>[] = [
    { key: 'symbol', label: 'Symbol' },
    { key: 'price', label: 'Price', align: 'right', render: (r) => fmt(r.price) },
    { key: 'changePct', label: 'Change%', align: 'right', render: (r) => <span className={r.changePct >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{r.changePct.toFixed(2)}%</span> },
    { key: 'rangePct', label: 'Range%', align: 'right', render: (r) => <span className={r.rangePct >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{r.rangePct.toFixed(2)}%</span> },
    { key: 'vol', label: 'Volume', align: 'right', render: (r) => fmt(r.vol) },
    { key: 'slope', label: 'Trend', align: 'right', render: (r) => <span className={r.slope >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{r.slope.toFixed(4)}</span> },
    { key: 'symbol', label: 'Open', align: 'right', render: (r) => (
      <button
        className="rounded-lg bg-white/5 px-2 py-1 hover:bg-white/10"
        onClick={() => {
          const { openTicker, openChart } = require('@/lib/ui/modals') as typeof import('@/lib/ui/modals')
          // If user wants a different symbol, allow change; otherwise open current
          openTicker((sym) => openChart(sym))
        }}
      >
        Chart…
      </button>
    ) },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-3 text-sm">
        <GroupSelect label="Group" value={groupId} onChange={setGroupId} />
        <IntervalSelect label="Interval" value={interval} onChange={setInterval} />
        <Field label="Lookback">
          <input type="number" className="w-20 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/90 outline-none" value={lookback} onChange={(e) => setLookback(Number(e.target.value || 0))} />
        </Field>
        <Field label="Min Volume">
          <input type="number" className="w-28 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/90 outline-none" value={minVol} onChange={(e) => setMinVol(Number(e.target.value || 0))} />
        </Field>
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">Rules (AND):</span>
            <button className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/15" onClick={() => setRules(arr => [...arr, { key: 'changePct', op: '>=', value: 0 }])}>+ Rule</button>
          </div>
          <div className="flex flex-col gap-2">
            {rules.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-white/5 p-2">
                <div className="flex items-center gap-2">
                  <span className="min-w-[1.5rem] text-center text-[11px] text-white/50">{i + 1}.</span>
                  <select className="rounded bg-black/30 px-1 py-0.5 text-xs" value={r.key} onChange={(e) => setRules(arr => arr.map((it, idx) => idx === i ? { ...it, key: e.target.value as keyof Row } : it))}>
                    <option value="changePct">Change%</option>
                    <option value="rangePct">Range%</option>
                    <option value="slope">Trend</option>
                    <option value="price">Price</option>
                    <option value="vol">Volume</option>
                  </select>
                  <select className="rounded bg-black/30 px-1 py-0.5 text-xs" value={r.op} onChange={(e) => setRules(arr => arr.map((it, idx) => idx === i ? { ...it, op: e.target.value as any } : it))}>
                    <option value=">=">≥</option>
                    <option value=">">&gt;</option>
                    <option value="<=">≤</option>
                    <option value="<">&lt;</option>
                  </select>
                  <input type="number" className="w-24 rounded bg-black/30 px-2 py-0.5 text-xs outline-none" value={r.value} onChange={(e) => setRules(arr => arr.map((it, idx) => idx === i ? { ...it, value: Number(e.target.value || 0) } : it))} />
                </div>
                <div className="flex items-center gap-1">
                  <button className="rounded px-1 text-xs text-white/60 hover:bg-white/10 disabled:opacity-40" aria-label="Move up" title="Move up" disabled={i === 0} onClick={() => setRules(arr => { const copy = arr.slice(); const t = copy[i-1]; copy[i-1] = copy[i]; copy[i] = t!; return copy })}>↑</button>
                  <button className="rounded px-1 text-xs text-white/60 hover:bg-white/10 disabled:opacity-40" aria-label="Move down" title="Move down" disabled={i === rules.length - 1} onClick={() => setRules(arr => { const copy = arr.slice(); const t = copy[i+1]; copy[i+1] = copy[i]; copy[i] = t!; return copy })}>↓</button>
                  <button className="rounded px-1 text-xs text-white/60 hover:bg-white/10" aria-label="Remove rule" title="Remove" onClick={() => setRules(arr => arr.filter((_, idx) => idx !== i))}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {rows.length === 0 && loading ? (
        <div className="rounded-xl border border-white/10 px-3 py-6 text-center text-white/60">Loading…</div>
      ) : (
        <>
          <DataTable rows={filtered} columns={cols} defaultSort={{ key: 'changePct', desc: true }} />
          {loading && rows.length > 0 && (
            <div className="pt-1 text-right text-xs text-white/50">Refreshing…</div>
          )}
        </>
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
