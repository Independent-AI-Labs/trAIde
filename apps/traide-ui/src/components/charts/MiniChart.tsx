"use client"
import { createChart, IChartApi, ISeriesApi, LineData, UTCTimestamp } from 'lightweight-charts'
import { useEffect, useRef } from 'react'

type Props = {
  data: { t: number; c: number }[]
  className?: string
}

export function MiniChart({ data, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const api = useRef<IChartApi | null>(null)
  const line = useRef<ISeriesApi<'Line'> | null>(null)
  const lastLen = useRef<number>(0)
  const lastTs = useRef<number>(0)

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
    const series = chart.addAreaSeries({
      lineColor: 'rgba(45,212,191,1)',
      topColor: 'rgba(45,212,191,0.25)',
      bottomColor: 'rgba(45,212,191,0.0)',
      lineWidth: 2,
    })
    api.current = chart
    line.current = series
    return () => {
      chart.remove()
      api.current = null
      line.current = null
    }
  }, [])

  useEffect(() => {
    if (!line.current) return
    if (!data.length) { line.current.setData([]); lastLen.current = 0; lastTs.current = 0; return }
    const currLast = data[data.length - 1]!
    if (data.length === lastLen.current && currLast.t === lastTs.current) {
      line.current.update({ time: (currLast.t / 1000) as UTCTimestamp, value: currLast.c })
    } else if (data.length === lastLen.current + 1 && data[data.length - 2]?.t === lastTs.current) {
      line.current.update({ time: (currLast.t / 1000) as UTCTimestamp, value: currLast.c })
      lastLen.current = data.length
      lastTs.current = currLast.t
    } else {
      const seriesData: LineData[] = data.map((d) => ({ time: (d.t / 1000) as UTCTimestamp, value: d.c }))
      line.current.setData(seriesData)
      lastLen.current = data.length
      lastTs.current = currLast.t
    }
  }, [data])

  return <div ref={ref} className={className} />
}
