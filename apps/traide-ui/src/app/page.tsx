import { HeroGlass } from '@/components/hero/HeroGlass'
import { GlassCard } from '@/components/ui/GlassCard'
import { HoloSpinner } from '@/components/ui/HoloSpinner'
import { SkeletonWave } from '@/components/ui/SkeletonWave'

export default function Page() {
  return (
    <div className="relative">
      <HeroGlass />

      <section className="mx-auto mt-2 max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <GlassCard title="Scanner" subtitle="High‑impact placeholder">
            <SkeletonWave rows={5} />
          </GlassCard>
          <GlassCard title="Playground" subtitle="Indicator params">
            <div className="space-y-3">
              <div className="h-10 rounded-lg bg-white/10" />
              <div className="h-10 rounded-lg bg-white/10" />
              <div className="h-10 rounded-lg bg-white/10" />
            </div>
          </GlassCard>
          <GlassCard title="Stream Status" subtitle="Aesthetic loader" floating>
            <div className="flex h-40 items-center justify-center">
              <HoloSpinner />
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  )
}

