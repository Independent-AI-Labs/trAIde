"use client"
import { useEffect, useRef, useState } from 'react'
import { Kline, useFetchers } from './fetchers'
import { sseUrl, useMcpBaseUrl } from '@/lib/mcp'

export function useKlines({ symbol, interval, limit = 240, stream = false }: { symbol: string; interval: string; limit?: number; stream?: boolean }) {
  const { fetchKlinesCached } = useFetchers()
  const base = useMcpBaseUrl()
  const [data, setData] = useState<Kline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ticks, setTicks] = useState(0)
  const esRef = useRef<EventSource | null>(null)
  const lastTs = useRef(0)

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
    if (!stream) return
    let cancelled = false
    let retry = 0
    let timer: any
    const backoffBase = 500
    const backoffMax = 8000
    const open = () => {
      if (cancelled) return
      const es = new EventSource(sseUrl(`/stream/klines?symbol=${symbol}&interval=${interval}`))
      esRef.current = es
      es.onopen = () => { retry = 0 }
      es.onerror = () => {
        es.close(); esRef.current = null
        const wait = Math.min(backoffMax, Math.floor(backoffBase * Math.pow(2, retry++)))
        timer = window.setTimeout(open, wait)
      }
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
    }
    open()
    return () => { cancelled = true; if (timer) window.clearTimeout(timer); if (esRef.current) esRef.current.close(); esRef.current = null }
  }, [symbol, interval, stream, base])

  return { data, loading, error, ticks }
}
