"use client"
import React, { createContext, useContext } from 'react'
import type { Tile, TileKind } from '@/components/canvas/types'

export type TickDefaults = {
  tickMs: number
}

export type LayoutTickSettings = {
  tickMs?: number
  panelTickMs?: Partial<Record<TileKind, number>>
}

const AppTickContext = createContext<TickDefaults>({ tickMs: 1000 })
const LayoutTickContext = createContext<LayoutTickSettings>({})
const TileContext = createContext<Tile | null>(null)

export function TickConfigProvider({
  defaults,
  layout,
  children,
}: {
  defaults?: Partial<TickDefaults>
  layout?: LayoutTickSettings
  children: React.ReactNode
}) {
  const val: TickDefaults = { tickMs: Math.max(0, defaults?.tickMs ?? 1000) }
  return (
    <AppTickContext.Provider value={val}>
      <LayoutTickContext.Provider value={layout ?? {}}>{children}</LayoutTickContext.Provider>
    </AppTickContext.Provider>
  )
}

export function TileConfigProvider({ tile, children }: { tile: Tile; children: React.ReactNode }) {
  return <TileContext.Provider value={tile}>{children}</TileContext.Provider>
}

// Resolve tick (ms) hierarchically: app default -> layout -> panel kind -> tile -> component override
export function useTickMs(componentOverride?: number): number {
  const app = useContext(AppTickContext)
  const layout = useContext(LayoutTickContext)
  const tile = useContext(TileContext)
  const fromApp = Math.max(0, app.tickMs)
  const fromLayout = layout.tickMs != null ? Math.max(0, layout.tickMs) : undefined
  const fromPanel = tile && layout.panelTickMs && layout.panelTickMs[tile.kind] != null
    ? Math.max(0, layout.panelTickMs[tile.kind] as number)
    : undefined
  // Tile.settings?.tickMs if added
  const fromTile = (tile as any)?.settings?.tickMs as number | undefined
  const resolved =
    componentOverride ?? fromTile ?? fromPanel ?? fromLayout ?? fromApp
  return Number.isFinite(resolved) ? Math.max(0, resolved) : fromApp
}

