import { GlassButton, GlassCard } from '@/components/ui/GlassCard'
import { HeroChartLive } from '@/components/hero/HeroChartLive'
import Link from 'next/link'

export function HeroGlass() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-20">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <h1 className="text-5xl font-black leading-tight text-glow">Real‑time Technical Analysis</h1>
          <p className="mt-6 text-lg text-white/80">
            Live streaming indicators, blazing performance, and a glassmorphic interface that feels tangible. Built on the trAIde MCP.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/app/dashboard" className="contents"><GlassButton>Launch App</GlassButton></Link>
            <a href="https://github.com/Independent-AI-Labs/trAIde" target="_blank" className="contents"><GlassButton className="bg-white/5">View GitHub</GlassButton></a>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-8 -z-10 rounded-3xl blur-3xl" style={{ background: 'radial-gradient(600px 300px at 100% 0%, rgba(128,90,213,0.25), transparent), radial-gradient(600px 300px at 0% 100%, rgba(45,212,191,0.25), transparent)' }} />
          <GlassCard title="Live Market" subtitle="Real-time stream from MCP" floating>
            <HeroChartLive />
          </GlassCard>
        </div>
      </div>
    </section>
  )
}
