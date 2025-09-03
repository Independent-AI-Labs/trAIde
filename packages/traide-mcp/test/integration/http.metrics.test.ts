/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { startHttpServer } from '../../src/http'
import type { MarketDataProvider } from '../../src/provider'
import type { Candle } from '../../src/types'

function getMetric(body: string, name: string): string[] {
  return body.split('\n').filter((l) => l.startsWith(name))
}

describe('HTTP metrics exposure', () => {
  it('reports upstream failures and latency histogram', async () => {
    process.env.PORT = '0'
    process.env.MCP_ENABLE_HTTP = 'true'
    const provider: MarketDataProvider = {
      async getSymbols() { return [] },
      async getKlines({ symbol }): Promise<Candle[]> { if (symbol === 'BOOM') throw new Error('boom'); return [] },
      streamKlines() { return () => {} },
    } as any
    const srv = startHttpServer(provider)!
    await new Promise((r) => setTimeout(r, 30))
    const addr = srv.address() as any
    const base = `http://127.0.0.1:${addr.port}`

    // Trigger an upstream failure on /klines
    const bad = await fetch(`${base}/klines?symbol=BOOM&interval=1m`)
    expect(bad.status).toBe(500)

    // Successful REST call to populate latency histogram
    const ok = await fetch(`${base}/symbols`)
    expect(ok.status).toBe(200)

    // Fetch metrics
    const mc = new AbortController()
    const t = setTimeout(() => mc.abort(), 2000)
    // eslint-disable-next-line no-console
    console.log('Fetching metrics')
    const m = await fetch(`${base}/metrics`, { signal: mc.signal })
    // eslint-disable-next-line no-console
    console.log('Fetched metrics')
    clearTimeout(t)
    const text = await m.text()
    const upstream = getMetric(text, 'upstream_failures_total')
    expect(upstream.some((l) => l.includes('{route="klines"') && l.trim().endsWith(' 1'))).toBe(true)
    const histCount = getMetric(text, 'http_latency_seconds_count')
    expect(histCount.length > 0).toBe(true)
    srv.close()
  }, 10000)
})
