import { ChartWorkspace } from '@/components/workspace/ChartWorkspace'

export default function ChartPage({ params }: { params: { symbol: string } }) {
  const symbol = decodeURIComponent(params.symbol?.toUpperCase?.() || 'BTCUSDT')
  return <ChartWorkspace symbol={symbol} />
}

