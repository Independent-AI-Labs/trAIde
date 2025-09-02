"use client"
import { createChart, IChartApi, ISeriesApi, LineData, UTCTimestamp } from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { ema } from '@/lib/indicators'

type Price = { t: number; c: number }

export function OverlayChart({ data, overlays = [], className }: { data: Price[]; overlays?: { type: 'sma' | 'ema'; period: number; color?: string }[]; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const api = useRef<IChartApi | null>(null)
  const price = useRef<ISeriesApi<'Area'> | null>(null)
  const lines = useRef<Map<string, { s: ISeriesApi<'Line'>; lastEma?: number; initialized: boolean }>>(new Map())
  const priceInit = useRef(false)
  const lastTime = useRef<UTCTimestamp | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height: ref.current.clientHeight,
      autoSize: true,
      layout: { background: { color: 'transparent' }, textColor: 'rgba(255,255,255,0.82)' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.06)' }, horzLines: { color: 'rgba(255,255,255,0.06)' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      crosshair: { mode: 0 },
    })
    price.current = chart.addAreaSeries({ lineColor: 'rgba(45,212,191,1)', topColor: 'rgba(45,212,191,0.25)', bottomColor: 'rgba(45,212,191,0.0)', lineWidth: 2 })
    api.current = chart
    return () => { chart.remove(); api.current = null; price.current = null; lines.current.clear(); priceInit.current = false; lastTime.current = null }
  }, [])

  useEffect(() => {
    if (!price.current) return
    if (!data.length) return
    const t = (data[data.length - 1]!.t / 1000) as UTCTimestamp
    const v = data[data.length - 1]!.c
    if (!priceInit.current) {
      const seriesData: LineData[] = data.map((d) => ({ time: (d.t / 1000) as UTCTimestamp, value: d.c }))
      price.current.setData(seriesData)
      priceInit.current = true
      lastTime.current = t
    } else {
      // Incremental update: update last point (same or new t)
      price.current.update({ time: t, value: v })
      lastTime.current = t
    }
  }, [data])

  useEffect(() => {
    const chart = api.current
    if (!chart) return
    // Diff overlays by key
    const keyFor = (o: { type: 'sma' | 'ema'; period: number; color?: string }) => `${o.type}:${o.period}:${o.color || ''}`
    const desiredKeys = new Set(overlays.map(keyFor))
    // remove deleted
    for (const [key, entry] of Array.from(lines.current.entries())) {
      if (!desiredKeys.has(key)) {
        try { chart.removeSeries(entry.s as any) } catch {}
        lines.current.delete(key)
      }
    }
    // add new
    for (const ov of overlays) {
      const key = keyFor(ov)
      if (!lines.current.has(key)) {
        const s = chart.addLineSeries({ color: ov.color || 'rgba(255,255,255,0.8)', lineWidth: 1 })
        lines.current.set(key, { s, initialized: false })
      }
    }
    if (!data.length) return
    // update each overlay series
    const closes = data.map((d) => d.c)
    const t = (data[data.length - 1]!.t / 1000) as UTCTimestamp
    for (const ov of overlays) {
      const key = keyFor(ov)
      const state = lines.current.get(key)!
      if (!state.initialized) {
        // initial full set for visual stability
        const base = ov.type === 'ema' ? ema(closes, ov.period) : sma(closes, ov.period)
        const ldata: LineData[] = []
        for (let i = 0; i < data.length; i++) {
          const vv = base[i]
          if (Number.isFinite(vv)) ldata.push({ time: (data[i]!.t / 1000) as UTCTimestamp, value: vv as number })
        }
        state.s.setData(ldata)
        state.lastEma = ov.type === 'ema' ? (ldata.length ? (ldata[ldata.length - 1]!.value as number) : undefined) : undefined
        state.initialized = true
      } else {
        // incremental update: compute last value
        let val: number | null = null
        if (ov.type === 'sma') {
          if (closes.length >= ov.period) {
            let sum = 0
            for (let i = closes.length - ov.period; i < closes.length; i++) sum += closes[i]!
            val = sum / ov.period
          }
        } else {
          const alpha = 2 / (ov.period + 1)
          const prev = state.lastEma
          const last = closes[closes.length - 1]!
          if (prev == null) {
            // fallback: bootstrap from SMA of first period if possible
            if (closes.length >= ov.period) {
              let sum = 0
              for (let i = closes.length - ov.period; i < closes.length; i++) sum += closes[i]!
              val = alpha * last + (1 - alpha) * (sum / ov.period)
            }
          } else {
            val = alpha * last + (1 - alpha) * prev
          }
          if (val != null) state.lastEma = val
        }
        if (val != null && Number.isFinite(val)) state.s.update({ time: t, value: val })
      }
    }
  }, [overlays?.map((o) => `${o.type}:${o.period}:${o.color}`).join('|'), data])

  return <div ref={ref} className={className} />
}

function sma(values: number[], period: number) {
  const out: number[] = []
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]!
    if (i >= period) sum -= values[i - period]!
    out.push(i >= period - 1 ? sum / period : NaN)
  }
  return out
}
