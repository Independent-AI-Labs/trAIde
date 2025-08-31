import { describe, it, expect } from 'vitest';

import { trend } from '../src';

describe('Trend extras: TRIX/Mass/Ichimoku/DPO', () => {
  it('TRIX is finite for constant series after warmup', () => {
    const close = Array(50).fill(100);
    const t = trend.trix(close, 15);
    expect(Number.isFinite(t[30])).toBe(true);
  });

  it('Mass Index returns array of same length', () => {
    const high: number[] = [];
    const low: number[] = [];
    for (let i = 0; i < 60; i++) { high.push(10 + i * 0.1 + (i % 3)); low.push(9 + i * 0.1); }
    const mi = trend.massIndex(high, low, 3, 9);
    expect(mi.length).toBe(high.length);
  });

  it('Ichimoku lines are midpoints of highs/lows over windows', () => {
    const high = [1,2,3,4,5,6,7,8,9];
    const low = [0,1,2,3,4,5,6,7,8];
    const { tenkan, kijun, spanA, spanB } = trend.ichimoku(high, low, 3, 5, 7);
    expect(tenkan[2]).toBeCloseTo((3 + 0)/2);
    expect(kijun[4]).toBeCloseTo((5 + 0)/2);
    expect(spanA[4]).toBeCloseTo((tenkan[4] + kijun[4]) / 2);
    expect(spanB[6]).toBeCloseTo((7 + 0)/2);
  });

  it('Ichimoku shifted spans align with displacement', () => {
    const high = [1, 3, 5, 7, 9, 11, 13, 15, 17];
    const low = [0, 2, 4, 6, 8, 10, 12, 14, 16];
    const { spanA, spanB, spanA_fwd, spanB_fwd } = trend.ichimokuShifted(high, low, 3, 4, 5, 2);
    for (let i = 0; i < high.length - 2; i++) {
      if (!Number.isNaN(spanA[i])) expect(spanA_fwd[i + 2]).toBeCloseTo(spanA[i], 12);
      if (!Number.isNaN(spanB[i])) expect(spanB_fwd[i + 2]).toBeCloseTo(spanB[i], 12);
    }
  });

  it('DPO defines values at shifted indices', () => {
    const close = [1,2,3,4,5,6,7,8,9,10,11,12];
    const d = trend.dpo(close, 6);
    // value appears at index i+shift
    expect(Number.isFinite(d[10])).toBe(true);
  });
});
