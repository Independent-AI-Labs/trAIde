import { describe, it, expect } from 'vitest';

import { trend } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('MACD', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-macd.csv');
    const close = extractColumn(rows, 'Close');
    const line = trend.macd(close, 26, 12);
    const signal = trend.macdSignal(close, 26, 12, 9);
    const diff = trend.macdDiff(close, 26, 12, 9);
    const expLine = extractColumn(rows, 'MACD_line');
    const expSignal = extractColumn(rows, 'MACD_signal');
    const expDiff = extractColumn(rows, 'MACD_diff');
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(expLine[i])) expect(near(line[i], expLine[i], 1e-6)).toBe(true);
      if (!Number.isNaN(expSignal[i])) expect(near(signal[i], expSignal[i], 1e-6)).toBe(true);
      if (!Number.isNaN(expDiff[i])) expect(near(diff[i], expDiff[i], 1e-6)).toBe(true);
    }
  });
});
