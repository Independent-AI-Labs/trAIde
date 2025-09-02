import { describe, it, expect } from 'vitest'
import { startHttpServer } from '../../src/http'
import type { MarketDataProvider } from '../../src/provider'
import type { Candle } from '../../src/types'

class MockProvider implements MarketDataProvider {
  async getSymbols() { return ['AAA'] }
  async getKlines(): Promise<Candle[]> { return [{ t: 1, o: 1, h: 1, l: 1, c: 1, v: 1 }] }
  streamKlines() { return () => {} }
}

describe('HTTP validation', () => {
  it('rejects klines with invalid interval', async () => {
    process.env.PORT = '0'
    process.env.MCP_ENABLE_HTTP = 'true'
    const srv = startHttpServer(new MockProvider())!
    await new Promise((r) => setTimeout(r, 30))
    const addr = srv.address()
    const port = typeof addr === 'object' && addr ? (addr as any).port : 0
    const base = `http://127.0.0.1:${port}`
    const res = await fetch(`${base}/klines?symbol=AAA&interval=13x`)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.error).toBe('invalid_interval')
    srv.close()
  })

  it('rejects indicators with invalid body', async () => {
    process.env.PORT = '0'
    process.env.MCP_ENABLE_HTTP = 'true'
    const srv = startHttpServer(new MockProvider())!
    await new Promise((r) => setTimeout(r, 30))
    const addr = srv.address()
    const port = typeof addr === 'object' && addr ? (addr as any).port : 0
    const base = `http://127.0.0.1:${port}`
    // Missing symbol
    const bad = await fetch(`${base}/indicators`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ interval: '1m', windows: { rsi: { period: -2 } } }) })
    expect(bad.status).toBe(400)
    const body = await bad.json()
    expect(body.error.error).toBeDefined()
    srv.close()
  })
})

