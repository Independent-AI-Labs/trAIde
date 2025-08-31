import { describe, it, expect } from 'vitest';

import { trend } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('WMA', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-wma.csv');
    const close = extractColumn(rows, 'Close');
    const exp = extractColumn(rows, 'WMA');
    const got = trend.wmaIndicator(close, 9);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(exp[i])) expect(near(got[i], exp[i], 1e-4)).toBe(true);
    }
  });
});
