import { describe, it, expect } from 'vitest';

import { volatility } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('ATR', () => {
  it('matches Python ta fixtures (variant 2)', () => {
    const rows = readCsv('ta/test/data/cs-atr.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const expAtr = extractColumn(rows, 'ATR');
    const got = volatility.atr(high, low, close, 14);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(expAtr[i])) expect(near(got[i], expAtr[i], 1e-3)).toBe(true);
    }
  });
});
