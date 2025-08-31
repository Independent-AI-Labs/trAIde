import { describe, it, expect } from 'vitest';
import { buildSeries } from '../../src/compute';

const mkCandle = (t: number, c: number) => ({ t, o: c, h: c, l: c, c, v: 1 });

describe('buildSeries', () => {
  it('returns requested series keys and meta', () => {
    const candles = Array.from({ length: 100 }, (_, i) => mkCandle(1_700_000_000_000 + i * 60_000, i + 1));
    const req = { symbol: 'BTCUSDT', interval: '1m', windows: { rsi: { period: 14 }, macd: { fast: 12, slow: 26, signal: 9 } } } as unknown as import("../../src/types").ComputeIndicatorsRequest;
    const out = buildSeries(req, candles);
    expect(out.series.rsi).toBeDefined();
    expect(out.series.macd).toBeDefined();
    expect(out.series.signal).toBeDefined();
    expect(out.series.diff).toBeDefined();
    expect(out.meta?.warmup).toBeGreaterThan(0);
    expect(out.schemaVersion).toBe('1.0');
  });
});
