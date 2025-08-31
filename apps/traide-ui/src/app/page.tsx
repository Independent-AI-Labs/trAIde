import { HeroGlass } from '@/components/hero/HeroGlass'
import { GlassCard } from '@/components/ui/GlassCard'
import { WatchlistPanel } from '@/components/landing/WatchlistPanel'
import { PlaygroundPanel } from '@/components/landing/PlaygroundPanel'
import { StreamStatusPanel } from '@/components/landing/StreamStatusPanel'

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
        <div className="mt-8 flex justify-end gap-3 text-sm text-white/80">
          <a className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" href="/app/demo">Open Demo View</a>
          <a className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" href="/app/ux">Open UX Gallery</a>
        </div>
      </section>
    </div>
  )
}
