"use client"
import { StatusPill } from '@/components/ui/StatusPill'
import { useEffect, useMemo, useRef, useState } from 'react'
import { sseUrl, useMcpBaseUrl } from '@/lib/mcp'
import { useSSE } from '@/lib/useSSE'
import { useTickMs } from '@/lib/tickConfig'

export function StreamStatusPanel() {
  const base = useMcpBaseUrl()
  const tickMs = useTickMs()
  const { last, connected } = useSSE<any>(sseUrl('/stream/klines?symbol=BTCUSDT&interval=1m'), { enabled: true, throttleMs: tickMs })
  const [ticks, setTicks] = useState(0)
  const lastTime = useMemo(() => (last ? Date.now() : null), [last])
  useEffect(() => { if (last) setTicks((t) => t + 1) }, [last])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <StatusPill label="Stream Health" tickMs={tickMs} connected={connected} />
        <div className="text-sm text-white/70">Ticks: <span className="text-white/90">{ticks}</span></div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
        Last update: {lastTime ? new Date(lastTime).toLocaleTimeString() : '—'}
      </div>
    </div>
  )
}
