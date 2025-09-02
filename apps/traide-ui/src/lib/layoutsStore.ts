import type { Tile, TileKind } from '@/components/canvas/types'

export const DEFAULT_TILES_KEY = 'traide.tiles.v1'
export const DEFAULT_LAYOUTS_KEY = 'traide.layouts.v1'

export function tilesKey(storageKey?: string) { return storageKey || DEFAULT_TILES_KEY }
export function layoutsKey(storageKey?: string) { return storageKey ? `${storageKey}.layouts` : DEFAULT_LAYOUTS_KEY }
export function tickMsKey(storageKey?: string) { return `${storageKey || DEFAULT_TILES_KEY}.tickMs` }
export function panelTickMsKey(storageKey?: string) { return `${storageKey || DEFAULT_TILES_KEY}.panelTickMs` }

export function loadLayouts(storageKey?: string): Record<string, Tile[]> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(layoutsKey(storageKey))
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as Record<string, Tile[]>
  } catch {}
  return {}
}

export function saveLayouts(obj: Record<string, Tile[]>, storageKey?: string) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(layoutsKey(storageKey), JSON.stringify(obj)) } catch {}
}

export function loadTiles(storageKey?: string): Tile[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(tilesKey(storageKey))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as Tile[]
  } catch {}
  return null
}

export function saveTiles(tiles: Tile[], storageKey?: string) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(tilesKey(storageKey), JSON.stringify(tiles)) } catch {}
}

export function getLayoutTickMs(storageKey?: string): number | null {
  if (typeof window === 'undefined') return null
  try { const s = window.localStorage.getItem(tickMsKey(storageKey)); return s != null ? Math.max(0, Number(s)) : null } catch {}
  return null
}

export function setLayoutTickMs(v: number, storageKey?: string) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(tickMsKey(storageKey), String(Math.max(0, v))) } catch {}
}

export function getPanelTickMs(storageKey?: string): Partial<Record<TileKind, number>> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(panelTickMsKey(storageKey))
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as Partial<Record<TileKind, number>>
  } catch {}
  return {}
}

export function setPanelTickMs(map: Partial<Record<TileKind, number>>, storageKey?: string) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(panelTickMsKey(storageKey), JSON.stringify(map)) } catch {}
}

