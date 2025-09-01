"use client"
import { useEffect, useMemo, useState } from 'react'
import { GlassCard, GlassButton } from '@/components/ui/GlassCard'
import { TimeframeSwitch } from './TimeframeSwitch'
import { useRouter, useSearchParams } from 'next/navigation'
import { SymbolInput } from '@/components/ui/SymbolInput'
import dynamic from 'next/dynamic'
const OverlayChart = dynamic(() => import('@/components/charts/OverlayChart').then(m => m.OverlayChart), { ssr: false })
import { useKlines } from '@/lib/data/useKlines'

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

  const { data } = useKlines({ symbol, interval: tf, limit: 300, stream: true })
  const [ovEMA, setOvEMA] = useState(true)
  const [ovSMA, setOvSMA] = useState(false)
  const overlays = useMemo(() => [
    ...(ovEMA ? [{ type: 'ema', period: 20, color: 'rgba(99,102,241,1)' } as const] : []),
    ...(ovSMA ? [{ type: 'sma', period: 50, color: 'rgba(251,191,36,1)' } as const] : []),
  ], [ovEMA, ovSMA])

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SymbolInput value={symbol} onChange={(v) => setSymbol(v)} onEnter={() => router.push(`/app/chart/${encodeURIComponent(symbol.trim().toUpperCase())}?tf=${tf}`)} />
          <TimeframeSwitch value={tf} onChange={setTf} />
        </div>
        <div className="flex items-center gap-3">
          <GlassButton className="bg-white/5" aria-pressed={ovEMA} aria-label="Toggle EMA20 overlay" onClick={() => setOvEMA((v) => !v)}>{ovEMA ? 'EMA20 ✓' : 'EMA20'}</GlassButton>
          <GlassButton className="bg-white/5" aria-pressed={ovSMA} aria-label="Toggle SMA50 overlay" onClick={() => setOvSMA((v) => !v)}>{ovSMA ? 'SMA50 ✓' : 'SMA50'}</GlassButton>
        </div>
      </div>

      <GlassCard>
        <div className="relative h-[520px] w-full">
          <OverlayChart data={data.map((d) => ({ t: d.t, c: d.c }))} overlays={overlays as any} className="h-[520px] w-full rounded-xl" />
        </div>
      </GlassCard>
    </div>
  )
}
