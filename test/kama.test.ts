import { describe, it, expect } from 'vitest';

import { momentum } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('KAMA', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-kama.csv');
    const close = extractColumn(rows, 'Close');
    const exp = extractColumn(rows, 'KAMA');
    const got = momentum.kama(close, 10, 2, 30);
    const start = Math.max(0, close.length - 20);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(exp[i])) expect(near(got[i], exp[i], 0.5)).toBe(true);
    }
  });
});
