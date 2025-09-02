"use client"
import { useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { GROUPS } from '@/lib/symbols'
import { useModals } from '@/lib/ui/modals'

export function TickerModal() {
  const { ticker, closeTicker, openChart } = useModals()
  const [q, setQ] = useState('')
  const [activeGroup, setActiveGroup] = useState(GROUPS[0]!.id)
  const list = useMemo(() => {
    const g = GROUPS.find((g) => g.id === activeGroup) || GROUPS[0]!
    const items = g.symbols
    const qq = q.trim().toUpperCase()
    return qq ? items.filter((s) => s.includes(qq)) : items
  }, [q, activeGroup])
  return (
    <Modal open={ticker.open} onClose={closeTicker} title={<div className="flex items-center justify-between"><span>Select Ticker / Pair</span><span className="text-xs text-white/50">{list.length} results</span></div>}>
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
      />
      <div className="grid max-h-80 grid-cols-2 gap-2 overflow-auto pr-1 sm:grid-cols-3">
        {list.map((s) => (
          <button key={s} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10" onClick={() => { openChart(s); closeTicker() }}>
            <div className="font-medium text-white/90">{s}</div>
            <div className="text-xs text-white/60">USDT Pair</div>
          </button>
        ))}
      </div>
    </Modal>
  )
}

