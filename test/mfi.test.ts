import { describe, it, expect } from 'vitest';

import { volume } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('MFI', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-mfi.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const vol = extractColumn(rows, 'Volume');
    const exp = extractColumn(rows, 'MFI');
    const got = volume.moneyFlowIndex(high, low, close, vol, 14);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(exp[i])) expect(near(got[i], exp[i], 1e-5)).toBe(true);
    }
  });
});
