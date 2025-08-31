"use client"
import { useEffect, useState } from 'react'
import { GlassCard, GlassButton } from '@/components/ui/GlassCard'
import { TimeframeSwitch } from './TimeframeSwitch'
import { HeroChartLive } from '@/components/hero/HeroChartLive'
import { useRouter, useSearchParams } from 'next/navigation'

export function ChartWorkspace({ symbol: initialSymbol }: { symbol: string }) {
  const router = useRouter()
  const qs = useSearchParams()
  const [symbol, setSymbol] = useState(initialSymbol)
  const [tf, setTf] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>(
    (qs.get('tf') as any) || '1m',
  )

  useEffect(() => {
    // keep URL in sync (shallow)
    const u = new URL(window.location.href)
    u.searchParams.set('tf', tf)
    window.history.replaceState(null, '', u.toString())
  }, [tf])

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            className="w-40 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm uppercase tracking-wide text-white placeholder-white/50 outline-none focus:border-white/30"
            value={symbol}
            placeholder="SYMBOL"
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && symbol.trim()) {
                router.push(`/app/chart/${encodeURIComponent(symbol.trim().toUpperCase())}?tf=${tf}`)
              }
            }}
          />
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
