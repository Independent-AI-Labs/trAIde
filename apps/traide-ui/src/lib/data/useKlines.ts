"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { Kline, useFetchers } from './fetchers'
import { sseUrl, useMcpBaseUrl } from '@/lib/mcp'
import { useSSE } from '@/lib/useSSE'
import { useTickMs } from '@/lib/tickConfig'

export function useKlines({ symbol, interval, limit = 240, stream = false }: { symbol: string; interval: string; limit?: number; stream?: boolean }) {
  const { fetchKlinesCached } = useFetchers()
  const base = useMcpBaseUrl()
  const [data, setData] = useState<Kline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ticks, setTicks] = useState(0)
  const lastTs = useRef(0)
  const tickMs = useTickMs()
  const streamUrl = useMemo(() => stream ? sseUrl(`/stream/klines?symbol=${symbol}&interval=${interval}`) : undefined, [stream, symbol, interval])
  const { last: lastEvt } = useSSE<any>(streamUrl, { enabled: stream, throttleMs: tickMs })

  useEffect(() => {
    let cancelled = false
    const ac = new AbortController()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const arr = await fetchKlinesCached(symbol, interval, limit)
        if (cancelled) return
        setData(arr)
        lastTs.current = arr.length ? arr[arr.length - 1]!.t : 0
      } catch (e) {
        if (!cancelled) setError('history_error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load(); return () => { cancelled = true; ac.abort() }
  }, [symbol, interval, limit])

  useEffect(() => {
    if (!stream || !lastEvt) return
    const k = (lastEvt as any)?.candle
    if (!k) return
    if (k.t === lastTs.current) setData((s) => (s.length ? [...s.slice(0, -1), k] : [k]))
    else if (k.t > lastTs.current) { setData((s) => [...s, k]); lastTs.current = k.t }
    setTicks((t) => t + 1)
  }, [lastEvt, stream])

  return { data, loading, error, ticks }
}
