import { describe, it, expect } from 'vitest';

import { trend } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('Vortex', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-vortex.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const expPos = extractColumn(rows, 'VI+');
    const expNeg = extractColumn(rows, 'VI-');
    const gotPos = trend.vortexIndicatorPos(high, low, close, 14);
    const gotNeg = trend.vortexIndicatorNeg(high, low, close, 14);
    for (let i = 0; i < close.length; i++) {
      if (!Number.isNaN(expPos[i])) expect(near(gotPos[i], expPos[i], 1e-6)).toBe(true);
      if (!Number.isNaN(expNeg[i])) expect(near(gotNeg[i], expNeg[i], 1e-6)).toBe(true);
    }
  });

  it('diff equals pos minus neg', () => {
    const rows = readCsv('ta/test/data/cs-vortex.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const pos = trend.vortexIndicatorPos(high, low, close, 14);
    const neg = trend.vortexIndicatorNeg(high, low, close, 14);
    const diff = trend.vortexIndicatorDiff(high, low, close, 14);
    const start = Math.max(0, close.length - 20);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(diff[i])) expect(near(diff[i], pos[i] - neg[i], 1e-12)).toBe(true);
    }
  });
});
