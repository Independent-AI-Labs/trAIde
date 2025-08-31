import { describe, it, expect } from 'vitest';

import { trend } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('CCI', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-cci.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const exp = extractColumn(rows, 'CCI');
    const got = trend.cci(high, low, close, 20);
    for (let i = 0; i < close.length; i++) {
      if (!Number.isNaN(exp[i])) expect(near(got[i], exp[i], 1e-3)).toBe(true);
    }
  });
});
