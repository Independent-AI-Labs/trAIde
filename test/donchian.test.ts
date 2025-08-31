import { describe, it, expect } from 'vitest';

import { volatility } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('Donchian Channel', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-dc.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const expH = extractColumn(rows, 'HighBand');
    const expL = extractColumn(rows, 'LowBand');
    const expM = extractColumn(rows, 'MiddleBand');
    const { h, l, m } = volatility.donchianChannel(high, low, close, 20, 0);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(expH[i])) expect(near(h[i], expH[i], 1e-6)).toBe(true);
      if (!Number.isNaN(expL[i])) expect(near(l[i], expL[i], 1e-6)).toBe(true);
      if (!Number.isNaN(expM[i])) expect(near(m[i], expM[i], 1e-6)).toBe(true);
    }
  });

  it('offset shifts bands consistently', () => {
    const rows = readCsv('ta/test/data/cs-dc.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const dc0 = volatility.donchianChannel(high, low, close, 20, 0);
    const dc1 = volatility.donchianChannel(high, low, close, 20, 1);
    const n = close.length;
    for (let i = 1; i < n; i++) {
      if (!Number.isNaN(dc1.h[i])) expect(near(dc1.h[i], dc0.h[i - 1], 1e-12)).toBe(true);
    }
  });
});
