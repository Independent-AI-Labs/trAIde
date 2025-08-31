import { describe, it, expect } from 'vitest';

import { trend } from '../src';

import { extractColumn, readCsv } from './helpers';

describe('STC', () => {
  it('outputs finite values within [0,100] after warmup', () => {
    const rows = readCsv('ta/test/data/cs-stc.csv');
    const close = extractColumn(rows, 'Close');
    const got = trend.stc(close, 50, 23, 10, 3, 3);
    const n = close.length;
    for (let i = n - 30; i < n; i++) {
      if (!Number.isNaN(got[i])) {
        expect(got[i]).toBeGreaterThanOrEqual(0);
        expect(got[i]).toBeLessThanOrEqual(100);
      }
    }
  });
});
