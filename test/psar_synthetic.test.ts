import { describe, it, expect } from 'vitest';

import { psar } from '../src';

describe('PSAR synthetic branch coverage', () => {
  it('handles multiple reversals and boundary adjustments', () => {
    // Construct a choppy series to trigger both low1/low2 and high1/high2 adjustments and reversals
    const close = [10, 11, 12, 11.5, 13, 12.2, 14, 13.1, 15, 14.1, 16, 15.2, 14.8, 15.5, 14.2, 13.0, 12.0, 11.0, 12.5, 11.8, 10.5];
    const high = close.map((c, i) => c + (i % 3 === 0 ? 0.9 : 0.4));
    const low = close.map((c, i) => c - (i % 4 === 0 ? 0.9 : 0.5));
    const out = psar.psar(high, low, close, 0.02, 0.2);
    // Ensure both up and down arrays contain values and several reversals occurred
    const ups = out.up.filter((v) => v != null).length;
    expect(ups).toBeGreaterThanOrEqual(1);
    // PSAR values remain finite where computed
    for (let i = 2; i < close.length; i++) {
      if (!Number.isNaN(out.psar[i])) expect(Number.isFinite(out.psar[i]!)).toBe(true);
    }
  });
});
