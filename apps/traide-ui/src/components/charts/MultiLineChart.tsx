"use client"
import { createChart, IChartApi, ISeriesApi, LineData, UTCTimestamp } from 'lightweight-charts'
import { useEffect, useRef } from 'react'

type Series = { id: string; color: string; data: { t: number; v: number }[] }

export function MultiLineChart({ series, className }: { series: Series[]; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const api = useRef<IChartApi | null>(null)
  const lines = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())

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
    api.current = chart
    return () => { chart.remove(); api.current = null; lines.current.clear() }
  }, [])

  useEffect(() => {
    const chart = api.current
    if (!chart) return
    const m = lines.current
    const existing = new Set(m.keys())
    for (const s of series) {
      let ln = m.get(s.id)
      if (!ln) {
        ln = chart.addLineSeries({ color: s.color, lineWidth: 2 })
        m.set(s.id, ln)
      }
      const data: LineData[] = s.data.map((d) => ({ time: (d.t / 1000) as UTCTimestamp, value: d.v }))
      ln.setData(data)
      existing.delete(s.id)
    }
    // remove stale
    existing.forEach((id) => {
      const ln = m.get(id)
      if (ln && chart) chart.removeSeries(ln)
      m.delete(id)
    })
  }, [series])

  return <div ref={ref} className={className} />
}

