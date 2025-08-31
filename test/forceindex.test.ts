import { describe, it, expect } from 'vitest';

import { volume } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('Force Index', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-fi.csv');
    const close = extractColumn(rows, 'Close');
    const vol = extractColumn(rows, 'Volume');
    const exp1 = extractColumn(rows, 'FI_1');
    const exp = extractColumn(rows, 'FI');
    const { fi1, fi } = volume.forceIndex(close, vol, 13);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(exp1[i])) expect(near(fi1[i], exp1[i], 1e-6)).toBe(true);
      if (!Number.isNaN(exp[i])) expect(near(fi[i], exp[i], 1e-2)).toBe(true);
    }
  });
});
