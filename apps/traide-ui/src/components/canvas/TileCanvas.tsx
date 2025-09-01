"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
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

function renderTileContent(kind: TileKind) {
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
    default:
      return <div className="text-white/70">Unknown panel</div>
  }
}

function titleFor(kind: TileKind): string {
  const r = PANEL_REGISTRY.find(r => r.id === kind)
  return r?.title ?? kind
}

function nextId() { return Math.random().toString(36).slice(2, 9) }

const LS_KEY = 'traide.tiles.v1'
const LS_LAYOUTS = 'traide.layouts.v1'

function loadLayouts(): Record<string, Tile[]> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(LS_LAYOUTS)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as Record<string, Tile[]>
  } catch {}
  return {}
}

function saveLayouts(obj: Record<string, Tile[]>) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LS_LAYOUTS, JSON.stringify(obj)) } catch {}
}

export function TileCanvas() {
  const [tiles, setTiles] = useState<Tile[]>([])
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [layouts, setLayouts] = useState<Record<string, Tile[]>>({})
  const [savingName, setSavingName] = useState('')
  const [layoutOpen, setLayoutOpen] = useState(false)
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
    setLayouts(loadLayouts())
    try {
      const raw = window.localStorage.getItem(LS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const sane = parsed.filter((p) => p && typeof p.id === 'string' && typeof p.kind === 'string')
        if (sane.length) setTiles(sane as Tile[])
      }
    } catch {}
  }, [])

  // Persist layout on change
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(tiles)) } catch {}
  }, [tiles])

  // Layout actions
  const saveCurrentAs = useCallback((name: string) => {
    const n = name.trim()
    if (!n) return
    const next = { ...layouts, [n]: tiles }
    setLayouts(next)
    saveLayouts(next)
  }, [layouts, tiles])
  const loadLayout = useCallback((name: string) => {
    const t = layouts[name]
    if (t && Array.isArray(t)) setTiles(t)
  }, [layouts])
  const deleteLayout = useCallback((name: string) => {
    const next = { ...layouts }
    delete next[name]
    setLayouts(next)
    saveLayouts(next)
  }, [layouts])
  return (
    <div className="relative h-[calc(100vh-120px)] w-full select-none" onContextMenu={onContextMenu}>
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2">
        {tiles.map(t => (
          <div key={t.id} className="min-h-[380px]">
            <TilePanel title={titleFor(t.kind)} onClose={() => closeTile(t.id)}>
              {renderTileContent(t.kind)}
            </TilePanel>
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
                    <button className="text-white/50 hover:text-rose-300" onClick={() => deleteLayout(name)}>Delete</button>
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
    </div>
  )
}
