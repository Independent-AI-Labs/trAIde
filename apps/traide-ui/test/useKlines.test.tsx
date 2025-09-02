import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { useKlines } from '../src/lib/data/useKlines'
import { MarketCacheProvider } from '../src/lib/data/market-cache'
import { NetConfigProvider } from '../src/lib/net/config'

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

function Test({ onData }: { onData: (n: number) => void }) {
  const { data } = useKlines({ symbol: 'BTCUSDT', interval: '1m', limit: 3, stream: false })
  onData(data.length)
  return null
}

describe('useKlines', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url: any) => {
      const u = new URL(String(url), 'http://x')
      if (u.pathname.includes('/klines')) {
        return { ok: true, json: async () => ({ candles: [
          { t: 1, o: 1, h: 2, l: 0.5, c: 1.5, v: 10 },
          { t: 2, o: 1.5, h: 2.2, l: 1.1, c: 2.0, v: 12 },
          { t: 3, o: 2.0, h: 2.3, l: 1.7, c: 2.1, v: 8 },
        ] }) } as any
      }
      return { ok: false } as any
    }))
  })

  it('loads history and returns data', async () => {
    let length = 0
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    root.render(
      <NetConfigProvider>
        <MarketCacheProvider>
          <Test onData={(n) => { length = n }} />
        </MarketCacheProvider>
      </NetConfigProvider>
    )
    await sleep(80)
    expect(length).toBe(3)
  })
})
