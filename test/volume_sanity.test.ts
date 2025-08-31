import { describe, it, expect } from 'vitest';

import { volume } from '../src';

describe('Volume indicators sanity', () => {
  it('Force Index basic behavior', () => {
    const close = [10, 11, 12, 13, 12];
    const vol = [100, 100, 100, 100, 100];
    const { fi1, fi } = volume.forceIndex(close, vol, 3);
    expect(fi1[1]).toBeCloseTo(100);
    expect(fi1[4]).toBeCloseTo(-100);
    // EMA smoothed should be finite after warmup
    expect(Number.isFinite(fi[3])).toBe(true);
  });

  it('EoM basic behavior', () => {
    const high = [10, 11, 12, 13];
    const low = [9, 10, 11, 12];
    const vol = [1000, 1000, 1000, 1000];
    const { emv, sma } = volume.easeOfMovement(high, low, vol, 2);
    expect(Number.isFinite(emv[1])).toBe(true);
    expect(Number.isFinite(sma[2])).toBe(true);
  });

  it('VPT monotonicity under up moves', () => {
    const close = [10, 11, 12, 13];
    const vol = [100, 100, 100, 100];
    const vpt = volume.volumePriceTrend(close, vol);
    expect(vpt[3]).toBeGreaterThan(vpt[2]);
  });

  it('MFI within [0,100]', () => {
    const high = [10, 11, 12, 11, 12, 13, 12, 11, 10, 9, 10, 9, 10, 11, 12];
    const low = [9, 10, 11, 10, 11, 12, 11, 10, 9, 8, 9, 8, 9, 10, 11];
    const close = [9.5, 10.5, 11.5, 10.5, 11.5, 12.5, 11.5, 10.5, 9.5, 8.5, 9.5, 8.5, 9.5, 10.5, 11.5];
    const vol = Array(15).fill(1000);
    const mfi = volume.moneyFlowIndex(high, low, close, vol, 5);
    expect(mfi[mfi.length - 1]).toBeGreaterThanOrEqual(0);
    expect(mfi[mfi.length - 1]).toBeLessThanOrEqual(100);
  });
});
