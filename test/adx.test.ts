import { describe, it, expect } from 'vitest';

import { trend } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('ADX', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-adx.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const expAdx = extractColumn(rows, 'ADX');
    const expPos = extractColumn(rows, '+DI14');
    const expNeg = extractColumn(rows, '-DI14');
    const gotAdx = trend.adx(high, low, close, 14);
    const gotPos = trend.adxPos(high, low, close, 14);
    const gotNeg = trend.adxNeg(high, low, close, 14);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(expAdx[i])) expect(near(gotAdx[i], expAdx[i], 1e-6)).toBe(true);
      if (!Number.isNaN(expPos[i])) expect(near(gotPos[i], expPos[i], 1e-6)).toBe(true);
      if (!Number.isNaN(expNeg[i])) expect(near(gotNeg[i], expNeg[i], 1e-6)).toBe(true);
    }
  });
});
