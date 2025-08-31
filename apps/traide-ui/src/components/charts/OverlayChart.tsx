"use client"
import { createChart, IChartApi, ISeriesApi, LineData, UTCTimestamp } from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { ema } from '@/lib/indicators'

type Price = { t: number; c: number }

export function OverlayChart({ data, overlays = [], className }: { data: Price[]; overlays?: { type: 'sma' | 'ema'; period: number; color?: string }[]; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const api = useRef<IChartApi | null>(null)
  const price = useRef<ISeriesApi<'Area'> | null>(null)
  const lines = useRef<ISeriesApi<'Line'>[]>([])

  useEffect(() => {
    if (!ref.current) return
    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height: ref.current.clientHeight,
      autoSize: true,
      layout: { background: { type: 'solid', color: 'transparent' }, textColor: 'rgba(255,255,255,0.82)' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.06)' }, horzLines: { color: 'rgba(255,255,255,0.06)' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      crosshair: { mode: 0 },
    })
    price.current = chart.addAreaSeries({ lineColor: 'rgba(45,212,191,1)', topColor: 'rgba(45,212,191,0.25)', bottomColor: 'rgba(45,212,191,0.0)', lineWidth: 2 })
    api.current = chart
    return () => { chart.remove(); api.current = null; price.current = null; lines.current = [] }
  }, [])

  useEffect(() => {
    if (!price.current) return
    const seriesData: LineData[] = data.map((d) => ({ time: (d.t / 1000) as UTCTimestamp, value: d.c }))
    price.current.setData(seriesData)
  }, [data])

  useEffect(() => {
    const chart = api.current
    if (!chart) return
    // remove existing overlays
    for (const l of lines.current) chart.removeSeries(l as any)
    lines.current = []
    if (!data.length) return
    for (const ov of overlays) {
      const line = chart.addLineSeries({ color: ov.color || 'rgba(255,255,255,0.8)', lineWidth: 1 })
      const closes = data.map((d) => d.c)
      const base = ov.type === 'ema' ? ema(closes, ov.period) : sma(closes, ov.period)
      const ldata: LineData[] = data.map((d, i) => ({ time: (d.t / 1000) as UTCTimestamp, value: base[i]! }))
      line.setData(ldata)
      lines.current.push(line)
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

