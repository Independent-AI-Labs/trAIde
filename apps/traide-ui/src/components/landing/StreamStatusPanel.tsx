"use client"
import { StatusPill } from '@/components/ui/StatusPill'
import { useEffect, useRef, useState } from 'react'
import { sseUrl, useMcpBaseUrl } from '@/lib/mcp'

export function StreamStatusPanel() {
  const base = useMcpBaseUrl()
  const [ticks, setTicks] = useState(0)
  const [last, setLast] = useState<number | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource(sseUrl('/stream/klines?symbol=BTCUSDT&interval=1m'))
    esRef.current = es
    es.onmessage = () => { setTicks((t) => t + 1); setLast(Date.now()) }
    return () => { es.close(); esRef.current = null }
  }, [base])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <StatusPill label="Stream Health" />
        <div className="text-sm text-white/70">Ticks: <span className="text-white/90">{ticks}</span></div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
        Last update: {last ? new Date(last).toLocaleTimeString() : '—'}
      </div>
    </div>
  )
}
