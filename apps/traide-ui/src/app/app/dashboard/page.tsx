import { TileCanvas } from '@/components/canvas/TileCanvas'

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white/90">Dashboard</h1>
        <p className="text-sm text-white/60">Right‑click to add panels</p>
      </div>
      <TileCanvas />
    </div>
  )
}

