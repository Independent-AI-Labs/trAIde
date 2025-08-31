import { useEffect, useRef, useState } from 'react'

export type SSEMessage<T> = { data: T }

export function useSSE<T = unknown>(url?: string, enabled = true) {
  const [last, setLast] = useState<T | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!url || !enabled) return
    const es = new EventSource(url, { withCredentials: false })
    esRef.current = es
    setConnected(false)
    setError(null)

    es.onopen = () => setConnected(true)
    es.onerror = () => {
      setConnected(false)
      setError('stream_error')
    }
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data)
        setLast(payload as T)
      } catch (e) {
        // ignore parse errors to keep stream alive
      }
    }
    return () => {
      es.close()
      esRef.current = null
    }
  }, [url, enabled])

  return { last, connected, error }
}

