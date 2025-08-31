import { describe, it, expect } from 'vitest';

import { volatility } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('Bollinger Bands', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-bbands.csv');
    const close = extractColumn(rows, 'Close');
    const mavg = volatility.bollingerMavg(close, 20);
    const h = volatility.bollingerHband(close, 20, 2);
    const l = volatility.bollingerLband(close, 20, 2);
    const w = volatility.bollingerWband(close, 20, 2);
    const p = volatility.bollingerPband(close, 20, 2);
    const expM = extractColumn(rows, 'MiddleBand');
    const expH = extractColumn(rows, 'HighBand');
    const expL = extractColumn(rows, 'LowBand');
    const expW = extractColumn(rows, 'WidthBand');
    const expP = extractColumn(rows, 'PercentageBand');
    for (let i = 0; i < close.length; i++) {
      if (!Number.isNaN(expM[i])) expect(near(mavg[i], expM[i], 1e-3)).toBe(true);
      if (!Number.isNaN(expH[i])) expect(near(h[i], expH[i], 1e-3)).toBe(true);
      if (!Number.isNaN(expL[i])) expect(near(l[i], expL[i], 1e-3)).toBe(true);
      if (!Number.isNaN(expW[i])) expect(near(w[i], expW[i], 1e-3)).toBe(true);
      if (!Number.isNaN(expP[i])) expect(near(p[i], expP[i], 1e-3)).toBe(true);
    }
  });
});
