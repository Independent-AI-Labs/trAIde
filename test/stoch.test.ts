import { describe, it, expect } from 'vitest';

import { momentum } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('Stochastic Oscillator', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-soo.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const expK = extractColumn(rows, 'SO');
    const expD = extractColumn(rows, 'SO_SIG');
    const { k, d } = momentum.stochastic(high, low, close, 14, 3);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(expK[i])) expect(near(k[i], expK[i], 1e-4)).toBe(true);
      if (!Number.isNaN(expD[i])) expect(near(d[i], expD[i], 1e-4)).toBe(true);
    }
  });
});
