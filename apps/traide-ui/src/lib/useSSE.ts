import { useEffect, useRef, useState } from 'react'

export type SSEMessage<T> = { data: T }
type Options = { enabled?: boolean; backoffBaseMs?: number; backoffMaxMs?: number; pauseWhenHidden?: boolean }

export function useSSE<T = unknown>(url?: string, opts: boolean | Options = true) {
  const [last, setLast] = useState<T | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const retryRef = useRef<number>(0)
  const timerRef = useRef<number | null>(null)
  const visibleRef = useRef<boolean>(typeof document !== 'undefined' ? document.visibilityState === 'visible' : true)

  const enabled = typeof opts === 'boolean' ? opts : (opts.enabled ?? true)
  const backoffBaseMs = typeof opts === 'boolean' ? 500 : (opts.backoffBaseMs ?? 500)
  const backoffMaxMs = typeof opts === 'boolean' ? 8000 : (opts.backoffMaxMs ?? 8000)
  const pauseWhenHidden = typeof opts === 'boolean' ? true : (opts.pauseWhenHidden ?? true)

  useEffect(() => {
    if (!url || !enabled) return
    let cancelled = false
    const open = () => {
      if (cancelled) return
      if (pauseWhenHidden && !visibleRef.current) return
      const es = new EventSource(url, { withCredentials: false })
      esRef.current = es
      setConnected(false)
      setError(null)
      es.onopen = () => { setConnected(true); retryRef.current = 0 }
      es.onerror = () => {
        setConnected(false)
        setError('stream_error')
        es.close(); esRef.current = null
        const attempt = Math.min(backoffMaxMs, Math.floor(backoffBaseMs * Math.pow(2, retryRef.current++)))
        timerRef.current = window.setTimeout(open, attempt) as unknown as number
      }
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data)
          setLast(payload as T)
        } catch {}
      }
    }
    open()
    const onVis = () => {
      const vis = document.visibilityState === 'visible'
      visibleRef.current = vis
      if (pauseWhenHidden) {
        if (!vis && esRef.current) { esRef.current.close(); esRef.current = null; setConnected(false) }
        if (vis && !esRef.current) open()
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
  }, [url, enabled, backoffBaseMs, backoffMaxMs, pauseWhenHidden])

  return { last, connected, error }
}
