import { describe, it, expect } from 'vitest';

import { volume } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('OBV', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-obv.csv');
    const close = extractColumn(rows, 'Close');
    const vol = extractColumn(rows, 'Volume');
    const exp = extractColumn(rows, 'OBV');
    const got = volume.onBalanceVolume(close, vol);
    for (let i = 0; i < close.length; i++) {
      if (!Number.isNaN(exp[i])) expect(near(got[i], exp[i], 1e-9)).toBe(true);
    }
  });
});
