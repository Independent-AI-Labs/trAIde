"use client"
import { useState } from 'react'
import { GlassCard, GlassButton } from '@/components/ui/GlassCard'
import { TimeframeSwitch } from './TimeframeSwitch'
import { HeroChartLive } from '@/components/hero/HeroChartLive'

export function ChartWorkspace({ symbol: initialSymbol }: { symbol: string }) {
  const [symbol] = useState(initialSymbol)
  const [tf, setTf] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1m')

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/10 px-3 py-1.5 text-sm text-white/80">{symbol}</div>
          <TimeframeSwitch value={tf} onChange={setTf} />
        </div>
        <div className="flex items-center gap-3">
          <GlassButton className="bg-white/5">Indicators</GlassButton>
          <GlassButton className="bg-white/5">Layouts</GlassButton>
        </div>
      </div>

      <GlassCard>
        <div className="relative h-[520px] w-full">
          <HeroChartLive symbol={symbol} interval={tf} />
        </div>
      </GlassCard>
    </div>
  )
}
