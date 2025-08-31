import { GlassCard } from '@/components/ui/GlassCard'
import { WatchlistPanel } from '@/components/landing/WatchlistPanel'
import { PlaygroundPanel } from '@/components/landing/PlaygroundPanel'
import { StreamStatusPanel } from '@/components/landing/StreamStatusPanel'
import { HeroChartLive } from '@/components/hero/HeroChartLive'

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <GlassCard title="Hero Live Chart" subtitle="BTCUSDT · 1m" >
        <div className="h-[360px]"><HeroChartLive symbol="BTCUSDT" interval="1m" /></div>
      </GlassCard>
      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard title="Watchlist" subtitle="Live mini charts">
          <WatchlistPanel />
        </GlassCard>
        <GlassCard title="Playground" subtitle="RSI · PPO controls">
          <PlaygroundPanel />
        </GlassCard>
      </div>
      <GlassCard title="Stream Status" subtitle="Latency and ticks">
        <StreamStatusPanel />
      </GlassCard>
    </div>
  )
}

