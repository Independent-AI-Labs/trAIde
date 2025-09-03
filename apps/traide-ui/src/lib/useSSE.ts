import { useEffect, useRef, useState } from 'react'

export type SSEMessage<T> = { data: T }
type Options = { enabled?: boolean; backoffBaseMs?: number; backoffMaxMs?: number; pauseWhenHidden?: boolean; throttleMs?: number; minOpenIntervalMs?: number }

export function useSSE<T = unknown>(url?: string, opts: boolean | Options = true) {
  const [last, setLast] = useState<T | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const retryRef = useRef<number>(0)
  const timerRef = useRef<number | null>(null)
  const visibleRef = useRef<boolean>(typeof document !== 'undefined' ? document.visibilityState === 'visible' : true)
  const lastOpenAtRef = useRef<number>(0)
  const urlRef = useRef<string | undefined>(url)

  const enabled = typeof opts === 'boolean' ? opts : (opts.enabled ?? true)
  const backoffBaseMs = typeof opts === 'boolean' ? 500 : (opts.backoffBaseMs ?? 500)
  const backoffMaxMs = typeof opts === 'boolean' ? 8000 : (opts.backoffMaxMs ?? 8000)
  const pauseWhenHidden = typeof opts === 'boolean' ? true : (opts.pauseWhenHidden ?? true)
  const throttleMs = typeof opts === 'boolean' ? 0 : Math.max(0, Math.floor(opts.throttleMs ?? 0))
  const minOpenIntervalMs = typeof opts === 'boolean' ? 300 : Math.max(0, Math.floor((opts as Options).minOpenIntervalMs ?? 300))

  useEffect(() => {
    urlRef.current = url
    if (!url || !enabled) return
    let cancelled = false
    const scheduleOpen = (delayMs: number) => {
      if (cancelled) return
      if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null }
      const now = Date.now()
      const since = now - (lastOpenAtRef.current || 0)
      const wait = Math.max(0, Math.max(delayMs, minOpenIntervalMs - since))
      timerRef.current = window.setTimeout(() => doOpen(), wait) as unknown as number
    }
    const doOpen = () => {
      if (cancelled) return
      if (pauseWhenHidden && !visibleRef.current) return
      const u = urlRef.current
      if (!u) return
      // Guard against duplicate opens
      if (esRef.current) { try { esRef.current.close() } catch {} esRef.current = null }
      lastOpenAtRef.current = Date.now()
      const es = new EventSource(u, { withCredentials: false })
      esRef.current = es
      setConnected(false)
      setError(null)
      es.onopen = () => { setConnected(true); retryRef.current = 0 }
      es.onerror = () => {
        setConnected(false)
        setError('stream_error')
        es.close(); esRef.current = null
        // Exponential backoff with jitter, respecting minOpenIntervalMs
        const base = Math.min(backoffMaxMs, Math.floor(backoffBaseMs * Math.pow(2, retryRef.current++)))
        const jitter = 0.5 + Math.random() // 0.5x .. 1.5x
        const attempt = Math.floor(base * jitter)
        scheduleOpen(attempt)
      }
      const lastEmitRef = { t: 0 }
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data)
          const now = performance.now()
          if (!throttleMs || now - lastEmitRef.t >= throttleMs) {
            lastEmitRef.t = now
            setLast(payload as T)
          }
        } catch {}
      }
    }
    scheduleOpen(0)
    const onVis = () => {
      const vis = document.visibilityState === 'visible'
      visibleRef.current = vis
      if (pauseWhenHidden) {
        if (!vis && esRef.current) { esRef.current.close(); esRef.current = null; setConnected(false) }
        if (vis && !esRef.current) scheduleOpen(0)
      }
    }
    if (pauseWhenHidden && typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      if (timerRef.current) window.clearTimeout(timerRef.current)
      if (esRef.current) esRef.current.close()
      esRef.current = null
      if (pauseWhenHidden && typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis)
    }
  }, [url, enabled, backoffBaseMs, backoffMaxMs, pauseWhenHidden, minOpenIntervalMs])

  return { last, connected, error }
}
