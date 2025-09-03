"use client"
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { GROUPS } from '@/lib/symbols'
import { useModals } from '@/lib/ui/modals'
import { useSymbols } from '@/lib/data/useSymbols'
import { useBatchKlines } from '@/lib/stream/useBatchKlines'
import { useFetchers } from '@/lib/data/fetchers'
import { useTickMs } from '@/lib/tickConfig'

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

// Internal helper to stream a chunk and report updates upward
function ChunkStream({
  keyId,
  symbols,
  interval,
  enabled,
  throttleMs,
  onUpdate,
}: {
  keyId: string
  symbols: string[]
  interval: string
  enabled: boolean
  throttleMs: number
  onUpdate: (keyId: string, map: Map<string, { t: number; c: number }>) => void
}) {
  const { fetchKlinesBatchCached, fetchKlinesCached } = useFetchers()
  // Seed current prices via HTTP batch to avoid blanks until next candle closes
  useEffect(() => {
    if (!enabled || !symbols.length) return
    const ac = new AbortController()
    const run = async () => {
      try {
        const m = new Map<string, { t: number; c: number }>()
        const batch = await fetchKlinesBatchCached(symbols, interval, 1)
        for (const sym of symbols) {
          const arr = batch[sym.toUpperCase()] || []
          const last = arr.length ? arr[arr.length - 1]! : undefined
          if (last) m.set(sym.toUpperCase(), { t: last.t, c: last.c })
        }
        // Fallback to singles if batch produced nothing (e.g., upstream blocked)
        if (m.size === 0) {
          for (const sym of symbols) {
            try {
              const arr = await fetchKlinesCached(sym, interval, 1)
              const last = arr.length ? arr[arr.length - 1]! : undefined
              if (last) m.set(sym.toUpperCase(), { t: last.t, c: last.c })
            } catch {}
          }
        }
        if (m.size) onUpdate(keyId, m)
      } catch {}
    }
    run()
    return () => ac.abort()
  }, [enabled, symbols.join(','), interval, keyId, onUpdate])

  const { lastBySymbol } = useBatchKlines(symbols, interval, { throttleMs, enabled })
  useEffect(() => { onUpdate(keyId, lastBySymbol) }, [keyId, lastBySymbol, onUpdate])
  return null
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

  // Lazy-load visible items in pages to limit concurrent SSE streams
  // Batch cap mirrors server-side MCP_MAX_BATCH to avoid 400s
  const BATCH_CAP = Math.max(1, Number(process.env.NEXT_PUBLIC_MCP_MAX_BATCH || 20))
  const PAGE = Math.max(1, Number(process.env.NEXT_PUBLIC_TICKER_PAGE_SIZE || BATCH_CAP))
  const [visibleCount, setVisibleCount] = useState(PAGE)
  const listRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const tickMs = useTickMs()

  // Reset pagination when the filtered list changes
  useEffect(() => { setVisibleCount(PAGE) }, [groupList])

  const visible = useMemo(() => groupList.slice(0, visibleCount), [groupList, visibleCount])
  // Stream batching to respect server-side MCP_MAX_BATCH cap
  const chunks = useMemo(() => {
    const out: { key: string; syms: string[] }[] = []
    for (let i = 0; i < visible.length; i += BATCH_CAP) {
      const syms = visible.slice(i, i + BATCH_CAP)
      const key = syms.map((s) => s.toUpperCase()).join(',')
      out.push({ key, syms })
    }
    return out
  }, [visible, BATCH_CAP])

  // Collect per-chunk maps, then merge for display
  const [chunkMaps, setChunkMaps] = useState<Record<string, Map<string, { t: number; c: number }>>>({})
  const onChunkUpdate = useCallback((id: string, map: Map<string, { t: number; c: number }>) => {
    setChunkMaps((prev) => {
      // Ignore empty updates so we don't wipe seeded values before SSE emits
      if (!map || map.size === 0) return prev
      if (prev[id] === map) return prev
      const next = { ...prev, [id]: map }
      // prune stale keys when chunk composition changes
      const valid = new Set(chunks.map((c) => c.key))
      Object.keys(next).forEach((k) => { if (!valid.has(k)) delete (next as any)[k] })
      return next
    })
  }, [chunks])

  const merged = useMemo(() => {
    const out = new Map<string, { t: number; c: number }>()
    for (const m of Object.values(chunkMaps)) for (const [k, v] of m) out.set(k.toUpperCase(), v)
    return out
  }, [chunkMaps])

  // Derive display prices and direction per visible symbol from merged map
  const [display, setDisplay] = useState<Map<string, { price: number; dir: 1 | 0 | -1 }>>(new Map())
  const prevPriceRef = useRef<Map<string, number>>(new Map())
  useEffect(() => {
    const next = new Map<string, { price: number; dir: 1 | 0 | -1 }>()
    for (const s of visible) {
      const key = s.toUpperCase()
      const last = merged.get(key)
      if (!last) continue
      const price = Number(last.c)
      if (!Number.isFinite(price)) continue
      const prior = prevPriceRef.current.get(key)
      const dir: 1 | 0 | -1 = prior == null ? 0 : price > prior ? 1 : price < prior ? -1 : 0
      prevPriceRef.current.set(key, price)
      next.set(key, { price, dir })
    }
    setDisplay(next)
  }, [merged, visible])

  // Auto-load next page when sentinel becomes visible
  useEffect(() => {
    const root = listRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setVisibleCount((n) => Math.min(groupList.length, n + PAGE))
        }
      }
    }, { root, rootMargin: '0px', threshold: 1.0 })
    io.observe(sentinel)
    return () => { try { io.disconnect() } catch {} }
  }, [groupList.length])

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
      <div ref={listRef} className="grid max-h-96 grid-cols-2 gap-2 overflow-auto pr-1 sm:grid-cols-3">
        {/* Hidden chunk streams to cover all visible pairs under server batch cap */}
        {chunks.map((ch) => (
          <ChunkStream key={`chunk-${ch.key}`} keyId={ch.key} symbols={ch.syms} interval="1m" enabled={ticker.open} throttleMs={tickMs} onUpdate={onChunkUpdate} />
        ))}
        {visible.map((s, i) => {
          const info = display.get(s.toUpperCase())
          return <TickerItem key={`${s}-${i}`} symbol={s} onPick={onPick} price={info?.price ?? null} dir={info?.dir ?? 0} />
        })}
        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} style={{ height: 1, gridColumn: '1 / -1' }} />
        {/* Manual fallback control */}
        {visibleCount < groupList.length && (
          <button
            onClick={() => setVisibleCount((n) => Math.min(groupList.length, n + PAGE))}
            className="col-span-full mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            {(() => { const remaining = Math.max(0, groupList.length - visibleCount); const next = Math.min(PAGE, remaining); return `Load more (${next} of ${remaining} remaining)` })()}
          </button>
        )}
      </div>
    </Modal>
  )
}
