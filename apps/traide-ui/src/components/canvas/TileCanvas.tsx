"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ContextMenu, MenuItem, MenuSep } from './ContextMenu'
import { ComponentPalette } from './ComponentPalette'
import { PANEL_REGISTRY, Tile, TileKind } from './types'
import { TilePanel } from './TilePanel'
import { WatchlistPanel } from '@/components/landing/WatchlistPanel'
import { StreamStatusPanel } from '@/components/landing/StreamStatusPanel'
import { ScannerPanel } from '@/components/landing/ScannerPanel'
import { ComparePanel } from '@/components/landing/ComparePanel'
import { HeatmapPanel } from '@/components/landing/HeatmapPanel'
import dynamic from 'next/dynamic'
import { RichTextPanel } from '@/components/panels/RichTextPanel'

// lightweight chart wrapper used in landing; avoid SSR
const OverlayChart = dynamic(() => import('@/components/charts/OverlayChart').then(m => m.OverlayChart), { ssr: false })
import { useKlines } from '@/lib/data/useKlines'

function ChartPanelInner() {
  const { data } = useKlines({ symbol: 'BTCUSDT', interval: '1m', limit: 240, stream: true })
  const overlays = useMemo(() => [{ type: 'ema', period: 20, color: 'rgba(99,102,241,1)' }], [])
  return <OverlayChart data={data.map(d => ({ t: d.t, c: d.c }))} overlays={overlays as any} className="h-[360px] w-full rounded-lg" />
}

function GalleryPanel() {
  // minimal gallery using existing primitives
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3"><StreamStatusPanel /></div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3"><WatchlistPanel /></div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3"><ScannerPanel /></div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3"><ComparePanel /></div>
    </div>
  )
}

function renderTileContent(kind: TileKind, id: string) {
  switch (kind) {
    case 'chart':
      return <ChartPanelInner />
    case 'watchlist':
      return <WatchlistPanel />
    case 'stream-status':
      return <StreamStatusPanel />
    case 'scanner':
      return <ScannerPanel />
    case 'heatmap':
      return <HeatmapPanel />
    case 'compare':
      return <ComparePanel />
    case 'gallery':
      return <GalleryPanel />
    case 'rich-text':
      return <RichTextPanel storageKey={`traide.richtext.${id}`} />
    default:
      return <div className="text-white/70">Unknown panel</div>
  }
}

function titleFor(kind: TileKind): string {
  const r = PANEL_REGISTRY.find(r => r.id === kind)
  return r?.title ?? kind
}

function nextId() { return Math.random().toString(36).slice(2, 9) }

const DEFAULT_TILES_KEY = 'traide.tiles.v1'
const DEFAULT_LAYOUTS_KEY = 'traide.layouts.v1'

function loadLayouts(baseKey?: string): Record<string, Tile[]> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(baseKey ? `${baseKey}.layouts` : DEFAULT_LAYOUTS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as Record<string, Tile[]>
  } catch {}
  return {}
}

function saveLayouts(obj: Record<string, Tile[]>, baseKey?: string) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(baseKey ? `${baseKey}.layouts` : DEFAULT_LAYOUTS_KEY, JSON.stringify(obj)) } catch {}
}

export function TileCanvas({ storageKey = 'traide.tiles.v1', seed }: { storageKey?: string; seed?: Tile[] }) {
  const [tiles, setTiles] = useState<Tile[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cols, setCols] = useState<number>(1)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [drag, setDrag] = useState<null | { id: string; dx: number; dy: number; w: number; h: number; px: number; py: number }>(null)
  const pointerRef = useRef<{ px: number; py: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const [resize, setResize] = useState<null | { id: string; startX: number; startY: number; w: number; h: number }>(null)
  const [snapFx, setSnapFx] = useState<null | { x: number; y: number; vertical: boolean }>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [layouts, setLayouts] = useState<Record<string, Tile[]>>({})
  const [savingName, setSavingName] = useState('')
  const [layoutOpen, setLayoutOpen] = useState(false)
  const [layoutAnchor, setLayoutAnchor] = useState<HTMLDivElement | null>(null)
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    // Ignore right-clicks originating from overlay UIs
    const target = e.target as HTMLElement
    if (target && (target.closest('.ui-overlay') || target.closest('[data-ui-overlay="1"]'))) {
      return
    }
    e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY })
  }, [])
  const addTile = useCallback((kind: TileKind) => {
    setPaletteOpen(false); setMenu(null)
    // Simple placement: stack tiles in rows of 2
    const count = tiles.length
    const row = Math.floor(count / 2)
    const col = count % 2
    const id = nextId()
    setTiles(prev => [...prev, { id, kind, x: col, y: row, w: 1, h: 1 }])
  }, [tiles])
  const closeTile = (id: string) => setTiles(prev => prev.filter(t => t.id !== id))

  // Load persisted layout on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    setLayouts(loadLayouts(storageKey))
    try {
      const key = storageKey || DEFAULT_TILES_KEY
      const raw = window.localStorage.getItem(key)
      if (!raw) {
        if (seed && seed.length) setTiles(seed)
        return
      }
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const sane = parsed.filter((p) => p && typeof p.id === 'string' && typeof p.kind === 'string')
        if (sane.length) setTiles(sane as Tile[])
      }
    } catch {}
  }, [storageKey, seed])

  // Persist layout on change
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { window.localStorage.setItem(storageKey || DEFAULT_TILES_KEY, JSON.stringify(tiles)) } catch {}
  }, [tiles, storageKey])

  // Close layout menu on outside click
  useEffect(() => {
    if (!layoutOpen) return
    function onDown(e: MouseEvent) {
      const el = layoutAnchor
      if (!el) return
      if (!el.contains(e.target as Node)) setLayoutOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [layoutOpen, layoutAnchor])

  // Layout actions
  const saveCurrentAs = useCallback((name: string) => {
    const n = name.trim()
    if (!n) return
    const next = { ...layouts, [n]: tiles }
    setLayouts(next)
    saveLayouts(next, storageKey)
  }, [layouts, tiles, storageKey])
  const loadLayout = useCallback((name: string) => {
    const t = layouts[name]
    if (t && Array.isArray(t)) setTiles(t)
  }, [layouts])
  const deleteLayout = useCallback((name: string) => {
    const next = { ...layouts }
    delete next[name]
    setLayouts(next)
    saveLayouts(next, storageKey)
  }, [layouts, storageKey])
  // derive responsive columns (match md breakpoint)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const apply = () => setCols(mq.matches ? 2 : 1)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const metrics = useMemo(() => {
    const el = canvasRef.current
    const w = el?.clientWidth || 1
    const gap = 16 // matches gap-4
    const colW = Math.max(1, (w - gap * (cols - 1)) / cols)
    const rowH = 380
    return { colW, rowH, gap }
  }, [cols, canvasRef.current?.clientWidth])

  // basic collision check for target slot
  const occupied = useCallback((id: string, x: number, y: number, w: number, h: number) => {
    return tiles.some(t => t.id !== id && !(x + w <= t.x || t.x + t.w <= x || y + h <= t.y || t.y + t.h <= y))
  }, [tiles])

  // keyboard movement for selected tile (arrow keys)
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedId) return
    const idx = tiles.findIndex(t => t.id === selectedId)
    if (idx < 0) return
    const t = tiles[idx]
    let dx = 0, dy = 0
    if (e.key === 'ArrowLeft') dx = -1
    else if (e.key === 'ArrowRight') dx = 1
    else if (e.key === 'ArrowUp') dy = -1
    else if (e.key === 'ArrowDown') dy = 1
    else return
    e.preventDefault()
    const next = { ...t, x: Math.max(0, Math.min(Math.max(0, cols - t.w), t.x + dx)), y: Math.max(0, t.y + dy) }
    // simple collision resolve: if occupied, push down until free
    let ty = next.y
    while (occupied(next.id, next.x, ty, next.w, next.h)) ty++
    next.y = ty
    const copy = tiles.slice(); copy[idx] = next
    setTiles(copy)
  }, [selectedId, tiles, cols, occupied])

  // Drag handlers
  const startDrag = useCallback((id: string, e: React.MouseEvent) => {
    const el = canvasRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const tile = tiles.find(t => t.id === id)
    if (!tile) return
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const { colW, rowH } = metrics
    const dx = px - tile.x * (colW + metrics.gap)
    const dy = py - tile.y * (rowH + metrics.gap)
    setSelectedId(id)
    setDrag({ id, dx, dy, w: tile.w, h: tile.h, px, py })
    pointerRef.current = { px, py }
    if (rafRef.current == null) {
      const tick = () => {
        if (pointerRef.current) {
          setDrag(d => (d ? { ...d, px: pointerRef.current!.px, py: pointerRef.current!.py } : d))
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [tiles, metrics])

  useEffect(() => {
    if (!drag && !resize) return
    const onMove = (e: MouseEvent) => {
      e.preventDefault()
      const el = canvasRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      pointerRef.current = { px: e.clientX - rect.left, py: e.clientY - rect.top }
      setResize(r => (r ? { ...r } : r))
    }
    const onUp = (e: MouseEvent) => {
      if (drag) {
        const el = canvasRef.current
        if (el) {
          const rect = el.getBoundingClientRect()
          const px = pointerRef.current?.px ?? drag.px ?? e.clientX - rect.left
          const py = pointerRef.current?.py ?? drag.py ?? e.clientY - rect.top
          const { colW, rowH, gap } = metrics
          const tile = tiles.find(t => t.id === drag.id)
          if (tile) {
            let gx = Math.max(0, Math.min(Math.max(0, cols - tile.w), Math.round((px - drag.dx) / (colW + gap))))
            let gy = Math.max(0, Math.round((py - drag.dy) / (rowH + gap)))
            while (occupied(tile.id, gx, gy, tile.w, tile.h)) gy++
            const copy = tiles.map(t => t.id === tile.id ? { ...t, x: gx, y: gy } : t)
            setTiles(copy)
            // physics snap: brief bounce
            requestAnimationFrame(() => {
              const elTile = document.querySelector(`[data-tile-id="${tile.id}"]`) as HTMLElement | null
              if (elTile) {
                elTile.classList.remove('snap-bounce')
                void elTile.offsetWidth
                elTile.classList.add('snap-bounce')
                setTimeout(() => elTile.classList.remove('snap-bounce'), 260)
              }
            })
            // draw snap line if adjacent to any neighbor
            const neighbor = tiles.find(t => t.id !== tile.id && (t.x === gx + tile.w && t.y <= gy + tile.h - 1 && gy <= t.y + t.h - 1))
              || tiles.find(t => t.id !== tile.id && (t.y === gy + tile.h && t.x <= gx + tile.w - 1 && gx <= t.x + t.w - 1))
            if (neighbor) {
              const vertical = Boolean(neighbor.x === gx + tile.w)
              setSnapFx({ x: vertical ? neighbor.x : gx, y: vertical ? Math.max(gy, neighbor.y) : neighbor.y, vertical })
              setTimeout(() => setSnapFx(null), 220)
            }
          }
        }
      }
      if (resize) {
        const el = canvasRef.current
        if (el) {
          const rect = el.getBoundingClientRect()
          const px = e.clientX - rect.left
          const py = e.clientY - rect.top
          const { colW, rowH, gap } = metrics
          const tile = tiles.find(t => t.id === resize.id)
          if (tile) {
            let gw = Math.max(1, Math.min(cols - tile.x, Math.round((px - tile.x * (colW + gap)) / (colW + gap))))
            let gh = Math.max(1, Math.round((py - tile.y * (rowH + gap)) / (rowH + gap)))
            while (occupied(tile.id, tile.x, tile.y, gw, gh)) gh++
            const copy = tiles.map(t => t.id === tile.id ? { ...t, w: gw, h: gh } : t)
            setTiles(copy)
          }
        }
      }
      setDrag(null); setResize(null)
      pointerRef.current = null
      if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp, { once: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp as any)
    }
  }, [drag, resize, tiles, cols, metrics, occupied])

  return (
    <div
      className="relative h-[calc(100vh-120px)] w-full select-none"
      onContextMenu={onContextMenu}
      tabIndex={0}
      onKeyDown={onKeyDown}
      ref={canvasRef}
    >
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2" style={{ gridAutoRows: '380px' }}>
        {tiles.map(t => (
          <div
            key={t.id}
            data-tile-id={t.id}
            className={"group relative min-h-[380px] outline-2 outline-offset-2 transition-transform " + (selectedId === t.id ? 'outline-blue-400/70' : 'outline-transparent')}
            style={{
              gridColumn: `${Math.min(t.x + 1, cols)} / span ${Math.min(t.w, cols)}`,
              gridRow: `${t.y + 1} / span ${Math.max(1, t.h)}`,
              transform: drag && drag.id === t.id ? `translate(${(drag.px - drag.dx) - t.x * (metrics.colW + metrics.gap)}px, ${(drag.py - drag.dy) - t.y * (metrics.rowH + metrics.gap)}px)` : undefined,
              zIndex: drag && drag.id === t.id ? 30 : undefined,
              willChange: drag && drag.id === t.id ? 'transform' as any : undefined,
            }}
            onMouseDown={(e) => { e.stopPropagation(); setSelectedId(t.id) }}
          >
            <TilePanel title={titleFor(t.kind)} onClose={() => closeTile(t.id)} onDragStart={(e) => startDrag(t.id, e)}>
              {renderTileContent(t.kind, t.id)}
            </TilePanel>
            {/* Resize handle (SE) */}
            <div
              className="absolute bottom-1 right-1 hidden h-3 w-3 cursor-nwse-resize rounded-sm bg-white/50 group-hover:block"
              onMouseDown={(e) => {
                e.stopPropagation(); e.preventDefault()
                setResize({ id: t.id, startX: e.clientX, startY: e.clientY, w: t.w, h: t.h })
                setSelectedId(t.id)
              }}
            />
          </div>
        ))}
        {tiles.length === 0 && (
          <div className="flex h-full items-center justify-center text-white/60">
            Right‑click to add panels…
          </div>
        )}
      </div>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          <MenuItem onClick={() => { setPaletteOpen(true) }}>New…</MenuItem>
          <MenuSep />
          <MenuItem onClick={() => setTiles([])}>Reset Layout</MenuItem>
        </ContextMenu>
      )}
      <ComponentPalette items={PANEL_REGISTRY} open={paletteOpen} onClose={() => setPaletteOpen(false)} onSelect={addTile} />

      {/* Layout quick menu */}
      <div className="pointer-events-none absolute left-3 top-3 z-20">
        <div
          className="pointer-events-auto inline-flex gap-2 rounded-xl border border-white/10 bg-white/10 p-2 backdrop-blur ui-overlay"
          data-ui-overlay="1"
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}
          ref={setLayoutAnchor}
        >
          <button className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/15" onClick={() => setLayoutOpen(v => !v)}>
            Layouts
          </button>
          {layoutOpen && (
            <div className="absolute mt-10 w-64 rounded-xl border border-white/10 bg-base-900/95 p-3 text-sm text-white/80 shadow-depth ui-overlay" data-ui-overlay="1">
              <div className="mb-2 text-xs uppercase tracking-wide text-white/60">Saved Layouts</div>
              <div className="max-h-48 space-y-1 overflow-auto">
                {Object.keys(layouts).length === 0 && <div className="text-white/50">No saved layouts</div>}
                {Object.entries(layouts).map(([name]) => (
                  <div key={name} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-white/10">
                    <button className="truncate" onClick={() => { loadLayout(name); setLayoutOpen(false) }}>{name}</button>
                    <button aria-label="Delete layout" title="Delete" className="rounded p-1 text-white/50 hover:text-rose-300" onClick={() => deleteLayout(name)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
                        <path d="M9 3h6m-7 3h8m-8 0l-.8 13a2 2 0 0 0 2 2h5.6a2 2 0 0 0 2-2L16 6M10 10v7m4-7v7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input className="w-full rounded-lg border border-white/20 bg-base-800/80 px-2 py-1 text-xs text-white placeholder-white/50 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20" placeholder="Save as…" value={savingName} onChange={(e) => setSavingName(e.target.value)} />
                <button className="rounded-lg bg-white/10 px-2 py-1 text-xs hover:bg-white/15" onClick={() => { saveCurrentAs(savingName); setSavingName('') }}>Save</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drop preview rectangle while dragging */}
      {drag && (() => {
        const tile = tiles.find(tt => tt.id === drag.id)
        if (!tile) return null
        const { colW, rowH, gap } = metrics
        let gx = Math.max(0, Math.min(Math.max(0, cols - tile.w), Math.round((drag.px - drag.dx) / (colW + gap))))
        let gy = Math.max(0, Math.round((drag.py - drag.dy) / (rowH + gap)))
        while (occupied(tile.id, gx, gy, tile.w, tile.h)) gy++
        const left = gx * (colW + gap)
        const top = gy * (rowH + gap)
        const width = tile.w * (colW + gap) - gap
        const height = tile.h * (rowH + gap) - gap
        return (
          <div className="pointer-events-none absolute z-20 rounded-xl border-2 border-sky-300/70 bg-sky-300/10" style={{ left, top, width, height }} />
        )
      })()}

      {snapFx && (() => {
        const { colW, rowH, gap } = metrics
        const left = snapFx.vertical ? (snapFx.x) * (colW + gap) - gap / 2 : 0
        const top = snapFx.vertical ? snapFx.y * (rowH + gap) : (snapFx.y) * (rowH + gap) - gap / 2
        const w = snapFx.vertical ? 2 : (cols * (colW + gap))
        const h = snapFx.vertical ? (rowH) : 2
        return <div className="pointer-events-none absolute z-20 rounded-full bg-sky-300/50 blur-[1px]" style={{ left, top, width: w, height: h }} />
      })()}
    </div>
  )
}
