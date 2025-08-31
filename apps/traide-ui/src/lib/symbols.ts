export type SymbolGroup = {
  id: string
  name: string
  symbols: string[]
}

export const GROUPS: SymbolGroup[] = [
  { id: 'majors', name: 'Majors', symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT'] },
  { id: 'l1', name: 'Layer 1', symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'AVAXUSDT', 'NEARUSDT', 'ATOMUSDT'] },
  { id: 'defi', name: 'DeFi', symbols: ['UNIUSDT', 'AAVEUSDT', 'MKRUSDT', 'SNXUSDT', 'SUSHIUSDT', 'CRVUSDT'] },
]

export function getGroup(id?: string): SymbolGroup {
  const g = GROUPS.find((g) => g.id === id)
  return g || GROUPS[0]!
}

