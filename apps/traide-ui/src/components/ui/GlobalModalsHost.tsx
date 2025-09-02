"use client"
import { TickerModal } from '@/components/ui/TickerModal'
import { ChartModal } from '@/components/ui/ChartModal'

export function GlobalModalsHost() {
  return (
    <>
      <TickerModal />
      <ChartModal />
    </>
  )
}

