import { describe, it, expect } from 'vitest';

import { trend } from '../src';

describe('Ichimoku display helpers', () => {
  it('chikou equals close shifted back by displacement', () => {
    const high = [1, 3, 5, 7, 9, 11, 13, 15];
    const low = [0, 2, 4, 6, 8, 10, 12, 14];
    const close = [0.5, 2.5, 4.5, 6.5, 8.5, 10.5, 12.5, 14.5];
    const disp = 3;
    const { chikou } = trend.ichimokuDisplay(high, low, close, 3, 4, 5, disp);
    for (let i = disp; i < close.length; i++) {
      expect(chikou[i - disp]).toBeCloseTo(close[i], 12);
    }
  });

  it('forward spans match unshifted spans delayed by displacement', () => {
    const high = [1, 3, 5, 7, 9, 11, 13, 15];
    const low = [0, 2, 4, 6, 8, 10, 12, 14];
    const disp = 2;
    const base = trend.ichimoku(high, low, 3, 4, 5);
    const { spanA_fwd, spanB_fwd } = trend.ichimokuDisplay(high, low, high, 3, 4, 5, disp);
    for (let i = 0; i < high.length - disp; i++) {
      if (!Number.isNaN(base.spanA[i])) expect(spanA_fwd[i + disp]).toBeCloseTo(base.spanA[i], 12);
      if (!Number.isNaN(base.spanB[i])) expect(spanB_fwd[i + disp]).toBeCloseTo(base.spanB[i], 12);
    }
  });
});

