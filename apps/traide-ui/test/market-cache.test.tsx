import { describe, it, expect } from 'vitest'
import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { MarketCacheProvider, useMarketCache } from '../src/lib/data/market-cache'

function Act({ onDone }: { onDone: (v1: any, vOld: any) => void }) {
  const cache = useMarketCache()
  useEffect(() => {
    for (let i = 0; i < 210; i++) cache.set('k' + i, i, 10_000)
    const v1 = cache.get('k209')
    const vOld = cache.get('k0') // likely evicted by LRU cap
    onDone(v1, vOld)
  }, [])
  return null
}

describe('MarketCacheProvider (LRU-ish)', () => {
  it('evicts oldest entries when over capacity', async () => {
    let got: any = null
    let old: any = 'present'
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    await new Promise<void>((resolve) => {
      root.render(
        <MarketCacheProvider>
          <Act onDone={(v, o) => { got = v; old = o; resolve() }} />
        </MarketCacheProvider>
      )
    })
    expect(got).toBe(209)
    expect(old).toBeUndefined()
  })
})

