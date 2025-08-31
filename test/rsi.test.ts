import { describe, it, expect } from 'vitest';

import { momentum } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('RSI', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-rsi.csv');
    const close = extractColumn(rows, 'Close');
    const expected = extractColumn(rows, 'RSI');
    const result = momentum.rsi(close, 14);
    const start = Math.max(0, expected.length - 30);
    for (let i = start; i < expected.length; i++) {
      // Only validate where expected has a value
      if (!Number.isNaN(expected[i])) {
        expect(near(result[i], expected[i], 1e-3)).toBe(true);
      }
    }
  });
});
