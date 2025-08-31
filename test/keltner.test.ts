import { describe, it, expect } from 'vitest';

import { volatility } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('Keltner Channel', () => {
  it('matches Python ta fixtures (original version)', () => {
    const rows = readCsv('ta/test/data/cs-kc.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const expM = extractColumn(rows, 'MiddleBand');
    const expH = extractColumn(rows, 'HighBand');
    const expL = extractColumn(rows, 'LowBand');
    const { m, h, l } = volatility.keltnerChannel(high, low, close, 20, 10, true, 2);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(expM[i])) expect(near(m[i], expM[i], 1e-3)).toBe(true);
      if (!Number.isNaN(expH[i])) expect(near(h[i], expH[i], 1e-3)).toBe(true);
      if (!Number.isNaN(expL[i])) expect(near(l[i], expL[i], 1e-3)).toBe(true);
    }
  });

  it('EMA+ATR version produces consistent bands', () => {
    const rows = readCsv('ta/test/data/cs-kc.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const kc = volatility.keltnerChannel(high, low, close, 20, 10, false, 2);
    // sanity: h >= m >= l, and width positive
    const start = Math.max(0, close.length - 20);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(kc.m[i])) {
        expect(kc.h[i]).toBeGreaterThanOrEqual(kc.m[i]);
        expect(kc.m[i]).toBeGreaterThanOrEqual(kc.l[i]);
        expect(kc.w[i]).toBeGreaterThan(0);
      }
    }
  });
});
