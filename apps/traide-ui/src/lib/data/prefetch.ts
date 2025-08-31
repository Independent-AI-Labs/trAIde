"use client"
import { useEffect } from 'react'
import { useFetchers } from './fetchers'

declare global { interface Window { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number } }

export function useIdlePrefetch(symbols: string[], interval: string, limit = 240) {
  const { fetchKlinesCached } = useFetchers()
  useEffect(() => {
    if (!symbols.length) return
    const cb = () => { symbols.forEach((s) => { fetchKlinesCached(s, interval, limit).catch(() => {}) }) }
    const id: any = (window.requestIdleCallback ? window.requestIdleCallback(cb, { timeout: 1500 }) : window.setTimeout(cb, 250)) as any
    return () => { try { if (!window.requestIdleCallback) window.clearTimeout(id) } catch {} }
  }, [symbols.join(','), interval, limit])
}

