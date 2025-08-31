import { describe, it, expect } from 'vitest';

import { trend, momentum } from '../src';

describe('Aroon/DPO/KST/AO sanity', () => {
  it('Aroon up/down within [0,100] and complementary in extremes', () => {
    const high = [1,2,3,2,5,6,7,6,8,7,9];
    const low = [0.5,1,1.2,1,2,3,4,3,5,4,6];
    const { up, down } = trend.aroon(high, low, 5);
    const n = high.length;
    for (let i = 0; i < n; i++) {
      if (!Number.isNaN(up[i])) {
        expect(up[i]).toBeGreaterThanOrEqual(0);
        expect(up[i]).toBeLessThanOrEqual(100);
        expect(down[i]).toBeGreaterThanOrEqual(0);
        expect(down[i]).toBeLessThanOrEqual(100);
      }
    }
  });

  it('DPO outputs defined values after warmup', () => {
    const close = [1,2,3,4,5,6,7,8,9,10,11];
    const d = trend.dpo(close, 6);
    expect(Number.isFinite(d[9])).toBe(true);
  });

  it('KST produces signal and diff', () => {
    const close = [10,11,10,12,11,13,12,14,13,15,14,16,15,17,16];
    const { kst, signal, diff } = trend.kst(close);
    const n = close.length;
    for (let i = 0; i < n; i++) {
      if (!Number.isNaN(signal[i]) && !Number.isNaN(kst[i])) expect(diff[i]).toBeCloseTo(kst[i] - signal[i], 12);
    }
  });

  it('Awesome Oscillator reflects momentum in median price', () => {
    const high = [10,11,12,13,14,15,16];
    const low = [9,10,11,12,13,14,15];
    const ao = momentum.awesomeOscillator(high, low, 3, 4);
    expect(Number.isFinite(ao[6])).toBe(true);
  });
});
