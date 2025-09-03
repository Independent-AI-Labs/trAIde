/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { startHttpServer } from '../../src/http'
import type { MarketDataProvider } from '../../src/provider'
import type { Candle } from '../../src/types'

class MockProvider implements MarketDataProvider {
  async getSymbols() { return ['AAA', 'BBB', 'CCC'] }
  async getKlines(params: { symbol: string; interval: string; limit?: number }): Promise<Candle[]> {
    const n = Math.max(1, Math.min(10, params.limit ?? 1))
    return Array.from({ length: n }, (_, i) => ({ t: i + 1, o: 1, h: 1, l: 1, c: i + 0.5, v: 1 }))
  }
  streamKlines() { return () => {} }
}

describe('HTTP batch endpoints', () => {
  it('serves klines batch for multiple symbols', async () => {
    process.env.PORT = '0'
    process.env.MCP_ENABLE_HTTP = 'true'
    const srv = startHttpServer(new MockProvider())
    if (!srv) throw new Error('server not started')
    await new Promise((r) => setTimeout(r, 50))
    const addr = srv.address() as any
    const base = `http://127.0.0.1:${addr.port}`
    const res = await fetch(`${base}/klines/batch?symbols=AAA,BBB&interval=1m&limit=3`)
    expect(res.ok).toBe(true)
    const j = await res.json() as any
    expect(j.interval).toBe('1m')
    expect(Array.isArray(j.result.AAA)).toBe(true)
    expect(j.result.AAA.length).toBe(3)
    expect(Array.isArray(j.result.BBB)).toBe(true)
    expect(j.result.BBB.length).toBe(3)
    srv.close()
  }, 10000)
})

