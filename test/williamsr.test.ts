import { describe, it, expect } from 'vitest';

import { momentum } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('Williams %R', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-percentr.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const exp = extractColumn(rows, 'Williams_%R');
    const got = momentum.williamsR(high, low, close, 14);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(exp[i])) expect(near(got[i], exp[i], 1e-6)).toBe(true);
    }
  });
});
