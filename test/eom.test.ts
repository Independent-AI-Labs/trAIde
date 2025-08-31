import { describe, it, expect } from 'vitest';

import { volume } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('Ease of Movement', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-easeofmovement.csv');
    const high = extractColumn(rows, 'High');
    const low = extractColumn(rows, 'Low');
    const vol = extractColumn(rows, 'Volume');
    const expEmv = extractColumn(rows, 'EMV');
    const expSma = extractColumn(rows, 'SMA_EMV$');
    const { emv, sma } = volume.easeOfMovement(high, low, vol, 14);
    const start = Math.max(0, high.length - 30);
    for (let i = start; i < high.length; i++) {
      if (!Number.isNaN(expEmv[i])) expect(near(emv[i], expEmv[i], 1e-6)).toBe(true);
      if (!Number.isNaN(expSma[i])) expect(near(sma[i], expSma[i], 1e-6)).toBe(true);
    }
  });
});
