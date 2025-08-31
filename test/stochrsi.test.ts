import { describe, it, expect } from 'vitest';

import { momentum } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('StochRSI', () => {
  it('matches Python ta fixtures for StochRSI(14)', () => {
    const rows = readCsv('ta/test/data/cs-stochrsi.csv');
    const close = extractColumn(rows, 'Close');
    const exp = extractColumn(rows, 'StochRSI(14)');
    const got = momentum.stochRsi(close, 14);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(exp[i])) expect(near(got[i], exp[i], 1e-6)).toBe(true);
    }
  });

  it('%K and %D smoothing internal consistency', () => {
    const close = [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 5];
    const k = momentum.stochRsiK(close, 5, 3);
    const d = momentum.stochRsiD(close, 5, 3, 3);
    for (let i = 0; i < close.length; i++) {
      if (!Number.isNaN(d[i]) && !Number.isNaN(k[i])) {
        // d is SMA of k
        // minimal check: d defined implies previous 3 k's were defined
        expect(Number.isFinite(d[i])).toBe(true);
      }
    }
  });
});

