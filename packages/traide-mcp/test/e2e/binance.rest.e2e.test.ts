import { describe, it, expect } from 'vitest';
import { BinanceProvider } from '../../src/providers/binance';

// Run locally by default; on GitHub Actions require opt-in flag
const ci = process.env.GITHUB_ACTIONS === 'true';
const enabled = ci ? process.env.BINANCE_REST_E2E === '1' : true;

const provider = new BinanceProvider(
  process.env.BINANCE_REST_URL ?? 'https://api.binance.com',
  process.env.BINANCE_WS_URL ?? 'wss://stream.binance.com/ws',
);

(enabled ? describe : describe.skip)('Binance REST E2E', () => {
  it('lists trading symbols', async () => {
    const symbols = await provider.getSymbols();
    expect(Array.isArray(symbols)).toBe(true);
    expect(symbols.length).toBeGreaterThan(0);
    expect(symbols).toContain('BTCUSDT');
  });

  it('fetches recent klines', async () => {
    const candles = await provider.getKlines({ symbol: 'BTCUSDT', interval: '1m', limit: 50 });
    expect(candles.length).toBeGreaterThan(0);
    const c = candles[candles.length - 1];
    expect(typeof c.t).toBe('number');
    expect(typeof c.o).toBe('number');
    expect(typeof c.h).toBe('number');
    expect(typeof c.l).toBe('number');
    expect(typeof c.c).toBe('number');
    expect(typeof c.v).toBe('number');
  });

});
