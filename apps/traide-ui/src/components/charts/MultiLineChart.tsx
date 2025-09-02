"use client"
import { createChart, IChartApi, ISeriesApi, LineData, UTCTimestamp } from 'lightweight-charts'
import { useEffect, useRef } from 'react'

type Series = { id: string; color: string; data: { t: number; v: number }[] }

export function MultiLineChart({ series, className }: { series: Series[]; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const api = useRef<IChartApi | null>(null)
  const lines = useRef<Map<string, { s: ISeriesApi<'Line'>; lastT?: number }>>(new Map())

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
    api.current = chart
    return () => { chart.remove(); api.current = null; lines.current.clear() }
  }, [])

  useEffect(() => {
    const chart = api.current
    if (!chart) return
    const m = lines.current
    const existing = new Set(Array.from(m.keys()))
    for (const s of series) {
      let entry = m.get(s.id)
      if (!entry) {
        const ns = chart.addLineSeries({ color: s.color, lineWidth: 2 })
        entry = { s: ns, lastT: undefined }
        m.set(s.id, entry)
      }
      const prevLast = entry.lastT
      const len = s.data.length
      if (len === 0) {
        entry.s.setData([])
        entry.lastT = undefined
      } else {
        const last = s.data[len - 1]!
        if (prevLast && (last.t === prevLast)) {
          entry.s.update({ time: (last.t / 1000) as UTCTimestamp, value: last.v })
        } else if (prevLast && len >= 2 && s.data[len - 2]!.t === prevLast) {
          entry.s.update({ time: (last.t / 1000) as UTCTimestamp, value: last.v })
          entry.lastT = last.t
        } else {
          const data: LineData[] = s.data.map((d) => ({ time: (d.t / 1000) as UTCTimestamp, value: d.v }))
          entry.s.setData(data)
          entry.lastT = last.t
        }
      }
      existing.delete(s.id)
    }
    // remove stale
    existing.forEach((id) => {
      const ln = m.get(id)
      if (ln && chart) chart.removeSeries(ln.s)
      m.delete(id)
    })
  }, [series])

  return <div ref={ref} className={className} />
}
