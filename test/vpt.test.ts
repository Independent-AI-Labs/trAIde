import { describe, it, expect } from 'vitest';

import { volume } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('VPT', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-vpt.csv');
    const close = extractColumn(rows, 'Close');
    const vol = extractColumn(rows, 'Volume');
    const exp = extractColumn(rows, 'unsmoothed vpt');
    const expSm = extractColumn(rows, '14-smoothed vpt');
    const vpt = volume.volumePriceTrend(close, vol);
    const vptSm = volume.volumePriceTrend(close, vol, 14);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(exp[i])) expect(near(vpt[i], exp[i], 0.2)).toBe(true);
      if (!Number.isNaN(expSm[i])) expect(near(vptSm[i], expSm[i], 0.2)).toBe(true);
    }
  });
});
