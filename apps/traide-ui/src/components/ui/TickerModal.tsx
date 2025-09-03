"use client"
import { useMemo, useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { GROUPS } from '@/lib/symbols'
import { useModals } from '@/lib/ui/modals'
import { useSymbols } from '@/lib/data/useSymbols'
import { useBatchQuotes } from '@/lib/data/useQuotes'

function TickerItem({ symbol, onPick, price, dir }: { symbol: string; onPick: (s: string) => void; price: number | null | undefined; dir: 1 | 0 | -1 }) {
  const color = price == null ? 'text-white/60' : dir > 0 ? 'text-emerald-300' : dir < 0 ? 'text-rose-300' : 'text-white/70'
  return (
    <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20" onClick={() => onPick(symbol)}>
      <div className="flex items-center justify-between">
        <div className="font-medium text-white/90">{symbol}</div>
        <div className={`ml-2 tabular-nums ${color}`}>{price == null ? '—' : price.toFixed(2)}</div>
      </div>
      <div className="text-xs text-white/50">USDT Pair</div>
    </button>
  )
}

export function TickerModal() {
  const { ticker, closeTicker, openChart } = useModals()
  const [q, setQ] = useState('')
  const [activeGroup, setActiveGroup] = useState<'all' | string>('all')
  const { symbols } = useSymbols()
  const listAll = useMemo(() => (symbols.length ? symbols : GROUPS.flatMap((g) => g.symbols)), [symbols.join(',')])
  const groupList = useMemo(() => {
    const dynAll = { id: 'all', name: 'All', symbols: listAll } as { id: string; name: string; symbols: string[] }
    const g = [dynAll, ...GROUPS].find((g) => g.id === activeGroup) || dynAll
    const base = g.symbols.length ? g.symbols : listAll
    const qq = q.trim().toUpperCase()
    const filtered = qq ? base.filter((s) => s.includes(qq)) : base
    // De-duplicate to avoid React key collisions
    return Array.from(new Set(filtered))
  }, [q, activeGroup, listAll])

  const visible = useMemo(() => groupList.slice(0, 60), [groupList])
  const quotes = useBatchQuotes(visible, { interval: '1m', refreshMs: 1500, limit: 1 })

  const onPick = (s: string) => {
    if (ticker.onSelect) ticker.onSelect(s)
    else openChart(s)
    closeTicker()
  }

  return (
    <Modal open={ticker.open} onClose={closeTicker} title={<div className="flex items-center justify-between"><span>Select Ticker / Pair</span><span className="text-xs text-white/50">{groupList.length} results</span></div>}>
      <div className="mb-3 flex items-center gap-2">
        {[{ id: 'all', name: 'All' } as const, ...GROUPS].map((g) => (
          <button key={g.id} className={`rounded-lg px-2 py-1 text-xs ${g.id === activeGroup ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'}`} onClick={() => setActiveGroup(g.id)}>
            {g.name}
          </button>
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
        {visible.map((s, i) => {
          const qv = quotes.get(s)
          return <TickerItem key={`${s}-${i}`} symbol={s} onPick={onPick} price={qv?.price ?? null} dir={qv?.dir ?? 0} />
        })}
      </div>
    </Modal>
  )
}
