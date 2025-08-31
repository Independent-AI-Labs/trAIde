import { describe, it, expect } from 'vitest';

import { volatility } from '../src';

import { extractColumn, readCsv } from './helpers';

describe('Bollinger band indicators', () => {
  it('CrossUp/CrossDown parity with fixtures', () => {
    const rows = readCsv('ta/test/data/cs-bbands.csv');
    const close = extractColumn(rows, 'Close');
    const expUp = extractColumn(rows, 'CrossUp');
    const expDown = extractColumn(rows, 'CrossDown');
    const up = volatility.bollingerHbandIndicator(close, 20, 2);
    const down = volatility.bollingerLbandIndicator(close, 20, 2);
    const start = Math.max(0, close.length - 40);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(expUp[i])) expect(up[i]).toBe(expUp[i]);
      if (!Number.isNaN(expDown[i])) expect(down[i]).toBe(expDown[i]);
    }
  });
});

