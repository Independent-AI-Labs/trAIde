import { describe, it, expect } from 'vitest';

import { volume as vol } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('VWAP (rolling)', () => {
  it('matches Python ta fixtures (window=14)', () => {
    const rows = readCsv('ta/test/data/cs-vwap.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const volume = extractColumn(rows, 'Volume');
    const exp = extractColumn(rows, 'vwap');
    const got = vol.vwap(high, low, close, volume, 14);
    const start = 14 - 1;
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(exp[i]) && !Number.isNaN(got[i])) expect(near(got[i], exp[i], 1e-12)).toBe(true);
    }
  });
});
