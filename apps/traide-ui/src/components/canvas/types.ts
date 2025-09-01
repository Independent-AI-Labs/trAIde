export type TileKind =
  | 'chart'
  | 'watchlist'
  | 'stream-status'
  | 'scanner'
  | 'heatmap'
  | 'compare'
  | 'gallery'
  | 'rich-text'

export type Tile = {
  id: string
  kind: TileKind
  x: number
  y: number
  w: number
  h: number
}

export type RegistryItem = {
  id: TileKind
  title: string
  description?: string
}

export const PANEL_REGISTRY: RegistryItem[] = [
  { id: 'chart', title: 'Chart', description: 'Price chart with overlays' },
  { id: 'watchlist', title: 'Watchlist', description: 'Symbols with mini‑charts' },
  { id: 'stream-status', title: 'Stream Status', description: 'Connection & latency' },
  { id: 'scanner', title: 'Scanner', description: 'Rules & results' },
  { id: 'heatmap', title: 'Heatmap', description: 'Group performance' },
  { id: 'compare', title: 'Compare', description: 'Compare multiple symbols' },
  { id: 'gallery', title: 'Gallery', description: 'UI components demo' },
  { id: 'rich-text', title: 'Notes', description: 'Rich‑text editor / notes' },
]
