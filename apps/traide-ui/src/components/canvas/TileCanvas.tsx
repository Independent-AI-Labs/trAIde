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

export function TileCanvas() {
  const [tiles, setTiles] = useState<Tile[]>([])
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const onContextMenu = useCallback((e: React.MouseEvent) => {
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
    </div>
  )
}
