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
import { compactVertical, ensureNoOverlap, moveElement } from './engine'

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
  // Fast drag preview using an imperative ghost overlay (no per-frame React updates)
  const dragRef = useRef<null | { id: string; dx: number; dy: number; w: number; h: number; fromX: number; fromY: number }>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)
  const [resize, setResize] = useState<null | { id: string; startX: number; startY: number; w: number; h: number }>(null)
  const [preview, setPreview] = useState<Tile[] | null>(null)
  const previewRaf = useRef<number | null>(null)
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

  const [canvasW, setCanvasW] = useState(1)
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (cr) setCanvasW(Math.max(1, Math.floor(cr.width)))
    })
    ro.observe(el)
    setCanvasW(el.clientWidth || 1)
    return () => ro.disconnect()
  }, [canvasRef.current])

  const metrics = useMemo(() => {
    const w = canvasW || 1
    const gap = 16 // matches gap-4
    const colW = Math.max(1, (w - gap * (cols - 1)) / cols)
    const rowH = 380
    return { colW, rowH, gap }
  }, [cols, canvasW])

  // basic collision check for target slot (kept for local drag targeting)
  const occupied = useCallback((id: string, x: number, y: number, w: number, h: number) => {
    return tiles.some(t => t.id !== id && !(x + w <= t.x || t.x + t.w <= x || y + h <= t.y || t.y + t.h <= y))
  }, [tiles])

  // rAF-throttled live preview compute
  const desiredRef = useRef<{ id: string; gx: number; gy: number } | null>(null)

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
    setTiles(autoArrange(copy, next.id))
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
    const { colW, rowH, gap } = metrics
    const dx = px - tile.x * (colW + gap)
    const dy = py - tile.y * (rowH + gap)
    setSelectedId(id)
    // remember origin to allow more intuitive swapping and ghost placement
    dragRef.current = { id, dx, dy, w: tile.w, h: tile.h, fromX: tile.x, fromY: tile.y }

    // Create a visible ghost overlay following the cursor (snapped to grid)
    try {
      const g = document.createElement('div')
      g.setAttribute('data-ghost', id)
      g.style.position = 'absolute'
      g.style.pointerEvents = 'none'
      g.style.zIndex = '60'
      g.style.borderRadius = '0.75rem'
      g.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.8)'
      g.style.background = 'rgba(255,255,255,0.06)'
      g.style.backdropFilter = 'blur(2px)'
      g.style.width = `${tile.w * (colW + gap) - gap}px`
      g.style.height = `${tile.h * (rowH + gap) - gap}px`
      el.appendChild(g)
      ghostRef.current = g
      const left0 = tile.x * (colW + gap)
      const top0 = tile.y * (rowH + gap)
      g.style.transform = `translate(${left0}px, ${top0}px)`
    } catch {}
    const onMove = (ev: MouseEvent) => {
      const r = canvasRef.current?.getBoundingClientRect(); if (!r) return
      const d = dragRef.current; if (!d) return
      const px2 = ev.clientX - r.left
      const py2 = ev.clientY - r.top
      const tileNow = tiles.find(t => t.id === d.id); if (!tileNow) return
      // Center-based snapping for more predictable targets
      const cellW = colW + gap
      const cellH = rowH + gap
      const leftPx = px2 - d.dx
      const topPx = py2 - d.dy
      const centerGX = (leftPx + (tileNow.w * cellW - gap) / 2) / cellW
      const centerGY = (topPx + (tileNow.h * cellH - gap) / 2) / cellH
      let gx = Math.round(centerGX - tileNow.w / 2)
      let gy = Math.round(centerGY - tileNow.h / 2)
      gx = Math.max(0, Math.min(Math.max(0, cols - tileNow.w), gx))
      gy = Math.max(0, gy)

      // Move ghost to snapped slot
      if (ghostRef.current) {
        const left = gx * cellW
        const top = gy * cellH
        ghostRef.current.style.transform = `translate(${left}px, ${top}px)`
      }

      // rAF-throttled arrangement
      desiredRef.current = { id: tileNow.id, gx, gy }
      if (previewRaf.current == null) {
        previewRaf.current = requestAnimationFrame(() => {
          const d = desiredRef.current; previewRaf.current = null
          if (!d) return
          const placed = tiles.map(t => t.id === d.id ? { ...t, x: d.gx, y: d.gy } : t)
          const arranged = autoArrange(placed, d.id, cols)
          setPreview(arranged)
        })
      }
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      dragRef.current = null
      if (previewRaf.current != null) { cancelAnimationFrame(previewRaf.current); previewRaf.current = null }
      if (preview) setTiles(preview)
      setPreview(null)
      // remove ghost
      if (ghostRef.current) {
        const g = ghostRef.current
        ghostRef.current = null
        try { g.remove() } catch {}
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [tiles, metrics, cols, occupied, preview])

  useEffect(() => {
    if (!resize) return
    const onMove = (e: MouseEvent) => {
      e.preventDefault()
      const el = canvasRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const { colW, rowH, gap } = metrics
      const tile = tiles.find(t => t.id === resize.id)
      if (!tile) return
      let gw = Math.max(1, Math.min(cols - tile.x, Math.round((px - tile.x * (colW + gap)) / (colW + gap))))
      let gh = Math.max(1, Math.round((py - tile.y * (rowH + gap)) / (rowH + gap)))
      const copy = tiles.map(t => t.id === tile.id ? { ...t, w: gw, h: gh } : t)
      const noOverlap = ensureNoOverlap(copy, tile.id)
      const compacted = compactVertical(noOverlap, cols)
      setPreview(compacted)
      setResize(r => (r ? { ...r, w: gw, h: gh } : r))
    }
    const onUp = (e: MouseEvent) => {
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
            const noOverlap = ensureNoOverlap(copy, tile.id)
            const compacted = compactVertical(noOverlap, cols)
            setTiles(compacted)
          }
        }
      }
      setResize(null)
      setPreview(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp, { once: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp as any)
    }
  }, [resize, tiles, cols, metrics, occupied])

  const renderTiles = preview ?? tiles
  const containerPxHeight = useMemo(() => {
    const { rowH, gap } = metrics
    let maxBottom = 0
    for (const t of renderTiles) {
      const bottom = t.y * (rowH + gap) + t.h * (rowH + gap) - gap
      if (bottom > maxBottom) maxBottom = bottom
    }
    return Math.max(maxBottom, 1)
  }, [renderTiles, metrics])

  return (
    <div
      className="relative h-[calc(100vh-120px)] w-full select-none"
      onContextMenu={onContextMenu}
      tabIndex={0}
      onKeyDown={onKeyDown}
      ref={canvasRef}
    >
      <div className="relative" style={{ height: containerPxHeight }}>
        {renderTiles.map(t => {
          const { colW, rowH, gap } = metrics
          const left = t.x * (colW + gap)
          const top = t.y * (rowH + gap)
          const width = t.w * (colW + gap) - gap
          const height = t.h * (rowH + gap) - gap
          const isDragging = dragRef.current?.id === t.id
          return (
            <div
              key={t.id}
              data-tile-id={t.id}
              className={"group absolute outline-2 outline-offset-2 " + (selectedId === t.id ? 'outline-blue-400/70' : 'outline-transparent')}
              style={{
                width,
                height,
                transform: `translate(${left}px, ${top}px)`,
                transition: isDragging ? 'none' : 'transform 140ms ease-out',
                zIndex: isDragging ? 40 : undefined,
                opacity: isDragging ? 0.5 : 1,
                willChange: 'transform',
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
          )
        })}
        {renderTiles.length === 0 && (
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

      {/* Dragging feedback: live preview swaps via transform-based tiles */}
    </div>
  )
}
