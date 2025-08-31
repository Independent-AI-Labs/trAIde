/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { startHttpServer } from '../../src/http';
import type { MarketDataProvider } from '../../src/provider';
import type { Candle } from '../../src/types';

class MockProvider implements MarketDataProvider {
  async getSymbols() { return ['AAA', 'BBB']; }
  async getKlines(): Promise<Candle[]> { return [{ t: 1, o: 1, h: 1, l: 1, c: 1, v: 1 }]; }
  streamKlines() { return () => {}; }
}

describe('HTTP server', () => {
  it('serves health, symbols, klines, indicators', async () => {
    process.env.PORT = '0';
    process.env.MCP_ENABLE_HTTP = 'true';
    const srv = startHttpServer(new MockProvider());
    if (!srv) throw new Error('server not started');
    // wait for listen
    await new Promise((r) => setTimeout(r, 50));
    const addr = srv.address();
    const port = typeof addr === 'object' && addr ? (addr as any).port : 0;
    const base = `http://127.0.0.1:${port}`;
    const h = await fetch(`${base}/health`).then((r) => r.json());
    expect(h.status).toBe('ok');
    const s = await fetch(`${base}/symbols`).then((r) => r.json());
    expect(s.symbols).toEqual(['AAA', 'BBB']);
    const k = await fetch(`${base}/klines?symbol=AAA&interval=1m`).then((r) => r.json());
    expect(Array.isArray(k.candles)).toBe(true);
    const ind = await fetch(`${base}/indicators`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ symbol: 'AAA', interval: '1m', windows: { rsi: { period: 14 } } }) }).then((r) => r.json());
    expect(ind.series.rsi).toBeDefined();
    const m = await fetch(`${base}/metrics`).then((r) => r.text());
    expect(m).toContain('http_requests_total');
    srv.close();
  }, 15000);
  it.skip('streams SSE events', async () => {
    process.env.PORT = '0';
    process.env.MCP_ENABLE_HTTP = 'true';
    let push: any;
    const provider: MarketDataProvider = {
      async getSymbols() { return []; },
      async getKlines() { return []; },
      streamKlines(_p, onEvent) { push = onEvent; return () => {}; },
    } as any;
    const srv = startHttpServer(provider)!;
    await new Promise((r) => setTimeout(r, 50));
    const addr = srv.address();
    const port = typeof addr === 'object' && addr ? (addr as any).port : 0;
    const base = `http://127.0.0.1:${port}`;
    const res = await fetch(`${base}/stream/klines?symbol=AAA&interval=1m`, { headers: { accept: 'text/event-stream' } });
    const reader = (res.body as any).getReader();
    // trigger a fake kline event
    push({ type: 'kline', symbol: 'AAA', interval: '1m', candle: { t: 1, o: 1, h: 1, l: 1, c: 1, v: 1, closed: true } });
    const { value } = await reader.read();
    const chunk = new TextDecoder().decode(value);
    expect(chunk).toContain('data:');
    srv.close();
  }, 15000);

});
