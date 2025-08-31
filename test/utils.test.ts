import { describe, it, expect } from 'vitest';

import { momentum, trend, volatility } from '../src';
import { ewmAlpha } from '../src/utils';

describe('Utils and math helpers', () => {
  it('sma produces correct moving average', () => {
    const data = [1, 2, 3, 4, 5, 6];
    const sma3 = trend.smaIndicator(data, 3);
    expect(sma3.slice(0, 2).every(Number.isNaN)).toBe(true);
    expect(sma3[2]).toBeCloseTo(2);
    expect(sma3[3]).toBeCloseTo(3);
    expect(sma3[5]).toBeCloseTo(5);
  });

  it('ema matches constant series and reacts to steps', () => {
    const data = Array(10).fill(10);
    const ema5 = trend.emaIndicator(data, 5);
    // Once enough samples, EMA of constant equals the constant
    expect(ema5[4]).toBeCloseTo(10);
    expect(ema5[9]).toBeCloseTo(10);
    // Step response
    const step = [1, 1, 1, 1, 10, 10, 10, 10, 10];
    const e = trend.emaIndicator(step, 3);
    expect(Number.isNaN(e[0])).toBe(true);
    expect(e[4]).toBeGreaterThan(1);
    expect(e[e.length - 1]).toBeLessThanOrEqual(10);
  });

  it('ewmAlpha respects minPeriods and smoothing', () => {
    const data = [1, 2, 3, 4, 5];
    const out = ewmAlpha(data, 0.5, 3);
    expect(Number.isNaN(out[0])).toBe(true);
    expect(Number.isNaN(out[1])).toBe(true);
    expect(out[2]).toBeGreaterThan(0);
    expect(out[4]).toBeGreaterThan(out[3]);
  });

  it('ATR true range and smoothing basics', () => {
    const h = [10, 12, 12, 11];
    const l = [9, 10, 10, 9.5];
    const c = [9.5, 11, 11.5, 10];
    const atr = volatility.atr(h, l, c, 2);
    expect(atr[1]).toBeGreaterThan(0);
    expect(atr[3]).toBeGreaterThanOrEqual(atr[2] - 10); // finite
  });

  it('RSI bounds and monotonicity around moves', () => {
    const flat = Array(20).fill(100);
    const r1 = momentum.rsi(flat, 14);
    expect(r1[r1.length - 1]).toBeCloseTo(100, 5);
    const up = [1, 2, 3, 4, 5, 6, 7, 8];
    const r2 = momentum.rsi(up, 3);
    expect(r2[r2.length - 1]).toBeGreaterThan(50);
  });
});
