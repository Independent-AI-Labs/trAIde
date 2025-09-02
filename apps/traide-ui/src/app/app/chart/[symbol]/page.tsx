"use client"
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ChartPage({ params }: { params: { symbol: string } }) {
  const router = useRouter()
  const qs = useSearchParams()
  useEffect(() => {
    const symbol = decodeURIComponent(params.symbol?.toUpperCase?.() || 'BTCUSDT')
    const tf = qs.get('tf') || '1m'
    router.replace(`/app/dashboard?chart=${encodeURIComponent(symbol)}&tf=${encodeURIComponent(tf)}`)
  }, [router, params.symbol, qs])
  return null
}
