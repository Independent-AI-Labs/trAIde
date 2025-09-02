"use client"
import { useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { GROUPS } from '@/lib/symbols'
import { useModals } from '@/lib/ui/modals'
import { useSymbols } from '@/lib/data/useSymbols'
import { useSSE } from '@/lib/useSSE'
import { sseUrl } from '@/lib/mcp'

export function TickerModal() {
  const { ticker, closeTicker, openChart } = useModals()
  const [q, setQ] = useState('')
  const [activeGroup, setActiveGroup] = useState(GROUPS[0]!.id)
  const { symbols } = useSymbols()
  const listAll = useMemo(() => (symbols.length ? symbols : GROUPS.flatMap(g => g.symbols)), [symbols.join(',')])
  const groupList = useMemo(() => {
    const g = GROUPS.find((g) => g.id === activeGroup) || GROUPS[0]!
    const base = g.symbols.length ? g.symbols : listAll
    const qq = q.trim().toUpperCase()
    return qq ? base.filter((s) => s.includes(qq)) : base
  }, [q, activeGroup, listAll])

  const top = groupList.slice(0, 24)
  type Quote = { price: number; dir: 1 | -1 | 0 }
  const quotes = useMemo(() => new Map<string, Quote>(), [])
  const [, setTick] = useState(0)
  useMemo(() => {
    // reset quotes on new list chunk
    quotes.clear()
  }, [top.map((s) => s).join(','), quotes])

  // Open up to 24 SSE streams for visible symbols; throttle updates
  top.forEach((sym) => {
    const { last } = useSSE<any>(sseUrl(`/stream/klines?symbol=${sym}&interval=1m`), { enabled: ticker.open, throttleMs: 500 })
    if (last && (last as any).candle) {
      const k = (last as any).candle
      const prev = quotes.get(sym)
      const dir: 1 | -1 | 0 = prev ? (k.c > prev.price ? 1 : (k.c < prev.price ? -1 : 0)) : 0
      quotes.set(sym, { price: k.c, dir })
      // force local re-render
      setTick((t) => t + 1)
    }
  })

  const onPick = (s: string) => {
    if (ticker.onSelect) ticker.onSelect(s)
    else openChart(s)
    closeTicker()
  }

  return (
    <Modal open={ticker.open} onClose={closeTicker} title={<div className="flex items-center justify-between"><span>Select Ticker / Pair</span><span className="text-xs text-white/50">{groupList.length} results</span></div>}>
      <div className="mb-3 flex items-center gap-2">
        {GROUPS.map((g) => (
          <button key={g.id} className={`rounded-lg px-2 py-1 text-xs ${g.id === activeGroup ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'}`} onClick={() => setActiveGroup(g.id)}>{g.name}</button>
        ))}
      </div>
      <input
        className="mb-3 w-full rounded-lg border border-white/20 bg-base-800/80 px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
        placeholder="Search symbol, e.g. BTCUSDT"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && groupList.length) onPick(groupList[0]!)
        }}
      />
      <div className="grid max-h-96 grid-cols-2 gap-2 overflow-auto pr-1 sm:grid-cols-3">
        {groupList.map((s) => {
          const q = quotes.get(s)
          const color = q ? (q.dir > 0 ? 'text-emerald-300' : q.dir < 0 ? 'text-rose-300' : 'text-white/70') : 'text-white/60'
          return (
            <button key={s} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20" onClick={() => onPick(s)}>
              <div className="flex items-center justify-between">
                <div className="font-medium text-white/90">{s}</div>
                <div className={`ml-2 tabular-nums ${color}`}>{q ? q.price.toFixed(2) : '—'}</div>
              </div>
              <div className="text-xs text-white/50">USDT Pair</div>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
