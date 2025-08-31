import { describe, it, expect } from 'vitest';

import { momentum } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('TSI', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-tsi.csv');
    const close = extractColumn(rows, 'Close');
    const exp = extractColumn(rows, 'TSI');
    const got = momentum.tsi(close, 25, 13);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(exp[i])) expect(near(got[i], exp[i], 0.01)).toBe(true);
    }
  });
});
