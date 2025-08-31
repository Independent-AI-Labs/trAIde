"use client"
import { useEffect, useMemo, useState } from 'react'
import { MiniChart } from '@/components/charts/MiniChart'
import { rsi, ppo } from '@/lib/indicators'
import { GlassButton } from '@/components/ui/GlassCard'

export function PlaygroundPanel({ symbol = 'BTCUSDT', interval = '1m' }: { symbol?: string; interval?: string }) {
  const [data, setData] = useState<{ t: number; c: number }[]>([])
  const [rsiLen, setRsiLen] = useState(14)
  const [fast, setFast] = useState(12)
  const [slow, setSlow] = useState(26)
  const [sig, setSig] = useState(9)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const r = await fetch(`/api/mcp/klines?symbol=${symbol}&interval=${interval}&limit=300`, { cache: 'no-cache' })
        const j = await r.json()
        const candles = (j?.candles || []).map((k: any) => ({ t: k.t, c: k.c }))
        if (!cancelled) setData(candles)
      } catch {}
    }
    load(); return () => { cancelled = false }
  }, [symbol, interval])

  const closes = useMemo(() => data.map((d) => d.c), [data])
  const rsiVal = useMemo(() => {
    const arr = rsi(closes, rsiLen)
    return finite(arr[arr.length - 1])
  }, [closes, rsiLen])
  const ppoVals = useMemo(() => {
    const v = ppo(closes, fast, slow, sig)
    return {
      ppo: finite(v.ppo[v.ppo.length - 1]),
      signal: finite(v.signal[v.signal.length - 1]),
      hist: finite(v.hist[v.hist.length - 1]),
    }
  }, [closes, fast, slow, sig])

  return (
    <div className="space-y-3">
      <MiniChart data={data} className="h-40 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-3 text-sm">
        <Param label={`RSI (${rsiLen})`} value={rsiVal != null ? rsiVal.toFixed(2) : '—'}>
          <input type="range" min={5} max={50} value={rsiLen} onChange={(e) => setRsiLen(Number(e.target.value))} />
        </Param>
        <Param label={`PPO Fast (${fast})`} value={ppoVals.ppo != null ? ppoVals.ppo.toFixed(2) : '—'}>
          <input type="range" min={5} max={30} value={fast} onChange={(e) => setFast(Number(e.target.value))} />
        </Param>
        <Param label={`PPO Slow (${slow})`} value={ppoVals.signal != null ? ppoVals.signal.toFixed(2) : '—'}>
          <input type="range" min={10} max={60} value={slow} onChange={(e) => setSlow(Number(e.target.value))} />
        </Param>
        <Param label={`Signal (${sig})`} value={ppoVals.hist != null ? ppoVals.hist.toFixed(2) : '—'}>
          <input type="range" min={5} max={30} value={sig} onChange={(e) => setSig(Number(e.target.value))} />
        </Param>
        <div className="col-span-3 mt-2 flex justify-end">
          <GlassButton className="bg-white/5" onClick={() => { setRsiLen(14); setFast(12); setSlow(26); setSig(9) }}>Reset</GlassButton>
        </div>
      </div>
    </div>
  )
}

function Param({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-white/70">{label}</span>
        <span className="font-medium text-white/90">{value}</span>
      </div>
      <div className="[&>input[type=range]]:w-full [&>input[type=range]]:accent-emerald-400">{children}</div>
    </div>
  )
}

function finite(v: number | undefined): number | null {
  return v != null && Number.isFinite(v) ? v : null
}

