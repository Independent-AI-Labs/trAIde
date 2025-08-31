"use client"
import { useEffect, useRef, useState } from 'react'
import { Kline, useFetchers } from './fetchers'

export function useKlines({ symbol, interval, limit = 240, stream = false }: { symbol: string; interval: string; limit?: number; stream?: boolean }) {
  const { fetchKlinesCached } = useFetchers()
  const [data, setData] = useState<Kline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ticks, setTicks] = useState(0)
  const esRef = useRef<EventSource | null>(null)
  const lastTs = useRef(0)

  useEffect(() => {
    let cancelled = false
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
    load(); return () => { cancelled = true }
  }, [symbol, interval, limit])

  useEffect(() => {
    if (!stream) return
    const url = `/api/mcp/stream/klines?symbol=${symbol}&interval=${interval}`
    const es = new EventSource(url)
    esRef.current = es
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data)
        const k = payload?.candle
        if (!k) return
        if (k.t === lastTs.current) setData((s) => (s.length ? [...s.slice(0, -1), k] : [k]))
        else if (k.t > lastTs.current) { setData((s) => [...s, k]); lastTs.current = k.t }
        setTicks((t) => t + 1)
      } catch {}
    }
    return () => { es.close(); esRef.current = null }
  }, [symbol, interval, stream])

  return { data, loading, error, ticks }
}

