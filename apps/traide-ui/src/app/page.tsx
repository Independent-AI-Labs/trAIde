import { TileCanvas } from '@/components/canvas/TileCanvas'

export default function Page() {
  // Seed a sensible landing layout on first load; users can rearrange/save
  const seed = [
    { id: 'rt1', kind: 'rich-text', x: 0, y: 0, w: 1, h: 1 },
    { id: 'wl1', kind: 'watchlist', x: 1, y: 0, w: 1, h: 1 },
    { id: 'ss1', kind: 'stream-status', x: 0, y: 1, w: 1, h: 1 },
    { id: 'sc1', kind: 'scanner', x: 1, y: 1, w: 1, h: 1 },
    { id: 'cp1', kind: 'compare', x: 0, y: 2, w: 1, h: 1 },
    { id: 'hm1', kind: 'heatmap', x: 1, y: 2, w: 1, h: 1 },
  ] as const
  return (
    <div className="relative">
      <div className="mx-auto max-w-7xl px-6 pt-20">
        <p className="mb-2 text-sm text-white/60">Fully composable panels. Right‑click to add more.</p>
        <TileCanvas storageKey="traide.landing.tiles.v1" seed={seed as any} />
      </div>
    </div>
  )
}
