/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { startHttpServer } from '../../src/http'
import type { MarketDataProvider } from '../../src/provider'
import type { Candle } from '../../src/types'

class MockProvider implements MarketDataProvider {
  async getSymbols() { return ['AAA', 'BBB', 'CCC', 'DDD'] }
  async getKlines(): Promise<Candle[]> { return [] }
  streamKlines() { return () => {} }
}

describe('HTTP batch SSE cap', () => {
  it('rejects when symbols exceed MCP_MAX_BATCH', async () => {
    process.env.PORT = '0'
    process.env.MCP_ENABLE_HTTP = 'true'
    process.env.MCP_MAX_BATCH = '2'
    delete process.env.MCP_TRUNCATE_BATCH
    const srv = startHttpServer(new MockProvider())!
    await new Promise((r) => setTimeout(r, 30))
    const addr = srv.address() as any
    const base = `http://127.0.0.1:${addr.port}`
    const res = await fetch(`${base}/stream/klines/batch?symbols=AAA,BBB,CCC&interval=1m`, { headers: { accept: 'text/event-stream' } })
    expect(res.status).toBe(400)
    const j = await res.json() as any
    expect(j.error).toBe('too_many_symbols')
    expect(j.max).toBe(2)
    srv.close()
  }, 10000)
})

