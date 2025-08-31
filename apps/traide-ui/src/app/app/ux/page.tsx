import { GlassCard, GlassButton } from '@/components/ui/GlassCard'
import { HoloSpinner } from '@/components/ui/HoloSpinner'
import { SkeletonWave } from '@/components/ui/SkeletonWave'
import { StatusPill } from '@/components/ui/StatusPill'
import { MiniChart } from '@/components/charts/MiniChart'

export default function UXPage() {
  const demo = Array.from({ length: 60 }, (_, i) => ({ t: Date.now() - (60 - i) * 60_000, c: 100 + Math.sin(i / 4) * 2 + (Math.random() - 0.5) }))
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div className="grid gap-6 md:grid-cols-3">
        <GlassCard title="Buttons" subtitle="Variants">
          <div className="flex flex-wrap gap-3">
            <GlassButton>Primary</GlassButton>
            <GlassButton className="bg-white/5">Secondary</GlassButton>
            <GlassButton className="bg-emerald-500/10">Emphasis</GlassButton>
          </div>
        </GlassCard>
        <GlassCard title="Skeleton" subtitle="Loading state">
          <SkeletonWave rows={6} />
        </GlassCard>
        <GlassCard title="Spinner" subtitle="In progress">
          <div className="flex h-40 items-center justify-center"><HoloSpinner /></div>
        </GlassCard>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard title="Status" subtitle="Latency pill">
          <StatusPill label="UI ↔ MCP" />
        </GlassCard>
        <GlassCard title="MiniChart" subtitle="Static demo">
          <MiniChart data={demo} className="h-40 w-full rounded-xl" />
        </GlassCard>
      </div>
    </div>
  )
}

