import { describe, it, expect } from 'vitest';

import { volatility } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('Ulcer Index', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-ui.csv');
    const close = extractColumn(rows, 'Close');
    const exp = extractColumn(rows, 'Ulcer Index').map((v) => (Number.isNaN(v) ? NaN : v));
    const got = volatility.ulcerIndex(close, 14);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(exp[i])) expect(near(got[i], exp[i], 1e-6)).toBe(true);
    }
  });
});
