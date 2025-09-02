"use client"
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useModals } from '@/lib/ui/modals'
import { useKlines } from '@/lib/data/useKlines'
import { TimeframeSwitch } from '@/components/workspace/TimeframeSwitch'
import { IndicatorPicker, type IndicatorOverlay } from '@/components/ui/IndicatorPicker'

const OverlayChart = dynamic(() => import('@/components/charts/OverlayChart').then(m => m.OverlayChart), { ssr: false })

export function ChartModal() {
  const { chart, closeChart, openChart } = useModals()
  if (!chart.open) return null
  const [tf, setTf] = useState(chart.tf)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [overlays, setOverlays] = useState<IndicatorOverlay[]>([{ type: 'ema', period: 20, color: 'rgba(99,102,241,1)' }])

  useEffect(() => { if (chart.open) setTf(chart.tf) }, [chart.open, chart.tf])

  const { data } = useKlines({ symbol: chart.symbol, interval: tf, limit: 300, stream: chart.open })
  const title = useMemo(() => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-medium text-white/90">{chart.symbol}</span>
        <TimeframeSwitch value={tf} onChange={setTf} />
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15" onClick={() => setPickerOpen(true)}>Indicators…</button>
      </div>
    </div>
  ), [chart.symbol, tf])

  return (
    <>
      <Modal open={chart.open} onClose={closeChart} title={title}>
        <div className="relative h-[60vh] min-h-[420px] w-full">
          <OverlayChart data={data.map((d) => ({ t: d.t, c: d.c }))} overlays={overlays as any} className="h-[60vh] min-h-[420px] w-full rounded-xl" />
        </div>
      </Modal>
      <IndicatorPicker open={pickerOpen} overlays={overlays as any} onClose={() => setPickerOpen(false)} onChange={(next) => setOverlays(next as any)} />
    </>
  )
}
