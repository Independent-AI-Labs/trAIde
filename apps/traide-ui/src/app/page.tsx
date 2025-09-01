import { HeroGlass } from '@/components/hero/HeroGlass'
import { GlassCard } from '@/components/ui/GlassCard'
import { WatchlistPanel } from '@/components/landing/WatchlistPanel'
import { PlaygroundPanel } from '@/components/landing/PlaygroundPanel'
import { StreamStatusPanel } from '@/components/landing/StreamStatusPanel'
import { ScannerPanel } from '@/components/landing/ScannerPanel'
import { ComparePanel } from '@/components/landing/ComparePanel'
import { HeatmapPanel } from '@/components/landing/HeatmapPanel'

import Link from 'next/link'

export default function Page() {
  return (
    <div className="relative">
      <HeroGlass />

      <section className="mx-auto mt-2 max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <GlassCard title="Watchlist" subtitle="Live mini‑charts, 1m" >
            <WatchlistPanel />
          </GlassCard>
          <GlassCard title="Playground" subtitle="RSI · PPO controls">
            <PlaygroundPanel />
          </GlassCard>
          <GlassCard title="Stream Health" subtitle="Latency · tick count" floating>
            <StreamStatusPanel />
          </GlassCard>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <GlassCard title="Scanner" subtitle="Change · Range · Volume · Trend">
            <ScannerPanel />
          </GlassCard>
          <GlassCard title="Compare" subtitle="Normalize to 100 and compare">
            <ComparePanel />
          </GlassCard>
        </div>
        <div className="mt-6">
          <GlassCard title="Heatmap" subtitle="Group performance (1h window)">
            <HeatmapPanel />
          </GlassCard>
        </div>
        <div className="mt-8 flex justify-end gap-3 text-sm text-white/80">
          <Link className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" href="/app/dashboard">Open Dashboard</Link>
        </div>
      </section>
    </div>
  )
}
