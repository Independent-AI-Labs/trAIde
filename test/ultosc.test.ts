import { describe, it, expect } from 'vitest';

import { momentum } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('Ultimate Oscillator', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-ultosc.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const close = extractColumn(rows, 'Close');
    const exp = extractColumn(rows, 'Ult_Osc');
    const got = momentum.ultimateOscillator(high, low, close, 7, 14, 28);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(exp[i])) expect(near(got[i], exp[i], 1e-4)).toBe(true);
    }
  });
});
