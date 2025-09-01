/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';

// Opt-in WS E2E to avoid flakiness and CI/network constraints
const enabled = process.env.BINANCE_WS_E2E === '1';
let hasWs = enabled;
if (enabled) {
  try { await import('ws'); } catch { hasWs = false; }
}

(enabled && hasWs ? describe : describe.skip)('Binance WS E2E', () => {
  it('receives kline events', async () => {
    const { BinanceProvider } = await import('../../src/providers/binance');
    const provider = new BinanceProvider(
      process.env.BINANCE_REST_URL ?? 'https://api.binance.com',
      process.env.BINANCE_WS_URL ?? 'wss://stream.binance.com/ws',
    );
    const events: any[] = [];
    await new Promise<void>((resolve, reject) => {
      const unsubscribe = provider.streamKlines({ symbol: 'BTCUSDT', interval: '1m', closedOnly: false }, (e) => {
        if (e.type === 'kline') {
          events.push(e);
          if (events.length >= 2) {
            unsubscribe();
            resolve();
          }
        }
      });
      setTimeout(() => { unsubscribe(); reject(new Error('timeout')); }, 15000);
    });
    expect(events.length).toBeGreaterThanOrEqual(1);
    const ev = events[0];
    expect(ev.candle).toBeTruthy();
    expect(typeof ev.candle.t).toBe('number');
  }, 20000);
});
