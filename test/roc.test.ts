import { describe, it, expect } from 'vitest';

import { momentum } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('ROC', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-roc.csv');
    const close = extractColumn(rows, 'Close');
    const exp = extractColumn(rows, 'ROC');
    const got = momentum.roc(close, 12);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(exp[i])) expect(near(got[i], exp[i], 1e-6)).toBe(true);
    }
  });
});
