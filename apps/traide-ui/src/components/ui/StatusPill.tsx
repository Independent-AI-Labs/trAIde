"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { sseUrl } from '@/lib/mcp'

export function StatusPill({ label, healthUrl = '/api/mcp/health', connected }: { label?: string; healthUrl?: string; connected?: boolean }) {
  const [latency, setLatency] = useState<number | null>(null)
  const [ok, setOk] = useState<boolean | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true
    async function ping() {
      const t0 = performance.now()
      try {
        // Prefer same-origin proxy when using /api/mcp to avoid CORS in browsers
        const target = healthUrl && healthUrl.startsWith('/api/mcp')
          ? healthUrl
          : sseUrl(healthUrl)
        const r = await fetch(target, { cache: 'no-cache' })
        const t1 = performance.now()
        if (!mounted) return
        setLatency(Math.round(t1 - t0))
        setOk(r.ok)
      } catch {
        if (!mounted) return
        setOk(false)
        setLatency(null)
      }
    }
    ping()
    const id = window.setInterval(ping, 5000)
    timer.current = id as unknown as number
    return () => { if (timer.current) window.clearInterval(timer.current); mounted = false }
  }, [healthUrl])

  const status = useMemo(() => {
    if (connected === false) return 'RECONNECTING'
    if (ok === false) return 'DEGRADED'
    return 'LIVE'
  }, [connected, ok])

  return (
    <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
      <span className={statusColorClass(status)}>{status}</span>
      {label ? <span className="text-white/60">· {label}</span> : null}
      {latency != null ? <span className="text-white/60">· {latency}ms</span> : null}
    </div>
  )
}

function statusColorClass(status: string) {
  switch (status) {
    case 'LIVE':
      return 'text-emerald-300'
    case 'RECONNECTING':
      return 'text-amber-300'
    case 'DEGRADED':
      return 'text-rose-300'
    default:
      return 'text-white/80'
  }
}
