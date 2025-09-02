"use client"
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { TileCanvas } from '@/components/canvas/TileCanvas'
import { useModals } from '@/lib/ui/modals'

export default function DashboardPage() {
  const qs = useSearchParams()
  const { openChart } = useModals()
  useEffect(() => {
    const symbol = qs.get('chart') || qs.get('symbol')
    const tf = (qs.get('tf') as any) || undefined
    if (symbol) openChart(symbol.toUpperCase(), (tf as any) || '1m')
  }, [qs, openChart])
  return (
    <div className="px-4 py-8 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white/90">Dashboard</h1>
        <p className="text-sm text-white/60">Right‑click to add panels</p>
      </div>
      <TileCanvas />
    </div>
  )
}
