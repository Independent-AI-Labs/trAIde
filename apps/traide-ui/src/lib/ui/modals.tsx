"use client"
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ChartState = { open: boolean; symbol: string; tf: '1m'|'5m'|'15m'|'1h'|'4h'|'1d' }
type TickerState = { open: boolean }

type Ctx = {
  chart: ChartState
  ticker: TickerState
  openChart: (symbol: string, tf?: ChartState['tf']) => void
  closeChart: () => void
  openTicker: () => void
  closeTicker: () => void
}

const ModalsCtx = createContext<Ctx | null>(null)

export function UIOverlayProvider({ children }: { children: React.ReactNode }) {
  const [chart, setChart] = useState<ChartState>({ open: false, symbol: 'BTCUSDT', tf: '1m' })
  const [ticker, setTicker] = useState<TickerState>({ open: false })

  const openChart = useCallback((symbol: string, tf: ChartState['tf'] = '1m') => setChart({ open: true, symbol, tf }), [])
  const closeChart = useCallback(() => setChart((c) => ({ ...c, open: false })), [])
  const openTicker = useCallback(() => setTicker({ open: true }), [])
  const closeTicker = useCallback(() => setTicker({ open: false }), [])

  const value = useMemo<Ctx>(() => ({ chart, ticker, openChart, closeChart, openTicker, closeTicker }), [chart, ticker, openChart, closeChart, openTicker, closeTicker])
  return <ModalsCtx.Provider value={value}>{children}</ModalsCtx.Provider>
}

export function useModals() {
  const ctx = useContext(ModalsCtx)
  if (!ctx) throw new Error('useModals must be used within UIOverlayProvider')
  return ctx
}

