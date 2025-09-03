/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { startHttpServer } from '../../src/http'
import type { MarketDataProvider } from '../../src/provider'
import type { Candle } from '../../src/types'

describe('HTTP SSE endpoints', () => {
  it('streams single-symbol klines over SSE', async () => {
    process.env.PORT = '0'
    process.env.MCP_ENABLE_HTTP = 'true'
    let push: any
    const provider: MarketDataProvider = {
      async getSymbols() { return [] },
      async getKlines() { return [] as Candle[] },
      streamKlines(_p, onEvent) { push = onEvent; return () => {} },
    } as any
    const srv = startHttpServer(provider)!
    await new Promise((r) => setTimeout(r, 30))
    const addr = srv.address() as any
    const base = `http://127.0.0.1:${addr.port}`
    const res = await fetch(`${base}/stream/klines?symbol=AAA&interval=1m`, { headers: { accept: 'text/event-stream' } })
    expect(res.ok).toBe(true)
    const reader = (res.body as any).getReader()
    // wait briefly to ensure subscription installed, then push
    await new Promise(r => setTimeout(r, 50))
    if (!push) throw new Error('subscription not ready')
    setTimeout(() => {
      try { push({ type: 'kline', symbol: 'AAA', interval: '1m', candle: { t: 1, o: 1, h: 1, l: 1, c: 1, v: 1 } }) } catch {}
    }, 10)
    let chunk = ''
    const td = new TextDecoder()
    for (let i = 0; i < 10 && !chunk.includes('data:'); i++) {
      const { value } = await reader.read()
      chunk += td.decode(value)
    }
    expect(chunk).toContain('data:')
    expect(chunk).toContain('"symbol":"AAA"')
    await reader.cancel()
    srv.close()
  }, 20000)

  it('streams batch klines for multiple symbols', async () => {
    process.env.PORT = '0'
    process.env.MCP_ENABLE_HTTP = 'true'
    const handlers = new Map<string, any>()
    const provider: MarketDataProvider = {
      async getSymbols() { return [] },
      async getKlines() { return [] as Candle[] },
      streamKlines(p, onEvent) { handlers.set(`${p.symbol}:${p.interval}`, onEvent); return () => {} },
    } as any
    const srv = startHttpServer(provider)!
    await new Promise((r) => setTimeout(r, 30))
    const addr = srv.address() as any
    const base = `http://127.0.0.1:${addr.port}`
    const res = await fetch(`${base}/stream/klines/batch?symbols=AAA,BBB&interval=1m`, { headers: { accept: 'text/event-stream' } })
    expect(res.ok).toBe(true)
    const reader = (res.body as any).getReader()
    // wait for subscriptions to be set
    const start = Date.now()
    while (!(handlers.get('AAA:1m') && handlers.get('BBB:1m'))) { if (Date.now() - start > 3000) throw new Error('subscriptions not ready'); await new Promise(r => setTimeout(r, 10)) }
    // push events for both symbols and read chunks until a data frame arrives
    handlers.get('AAA:1m')!({ type: 'kline', symbol: 'AAA', interval: '1m', candle: { t: 1, o: 1, h: 1, l: 1, c: 1, v: 1 } })
    handlers.get('BBB:1m')!({ type: 'kline', symbol: 'BBB', interval: '1m', candle: { t: 2, o: 1, h: 1, l: 1, c: 2, v: 1 } })
    let chunk = ''
    const td = new TextDecoder()
    for (let i = 0; i < 10 && !chunk.includes('data:'); i++) {
      const { value } = await reader.read()
      chunk += td.decode(value)
    }
    expect(chunk).toContain('data:')
    // One of the symbols must appear
    expect(chunk).toMatch(/"symbol":"(AAA|BBB)"/)
    await reader.cancel()
    srv.close()
  }, 15000)
})
