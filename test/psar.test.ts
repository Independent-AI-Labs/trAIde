import { describe, it, expect } from 'vitest';

import { psar } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('PSAR', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-psar.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const expPsar = extractColumn(rows, 'PSAR');
    const expUp = extractColumn(rows, 'PSARup');
    const expDown = extractColumn(rows, 'PSARdown');
    const got = psar.psar(high, low, close, 0.02, 0.2);
    for (let i = 0; i < close.length; i++) {
      if (!Number.isNaN(expPsar[i])) expect(near(got.psar[i], expPsar[i], 1e-6)).toBe(true);
      if (!Number.isNaN(expUp[i])) expect(near((got.up[i] ?? NaN) as number, expUp[i], 1e-6)).toBe(true);
      if (!Number.isNaN(expDown[i])) expect(near((got.down[i] ?? NaN) as number, expDown[i], 1e-6)).toBe(true);
    }
  });
});
