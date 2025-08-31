import { describe, it, expect } from 'vitest';

import { momentum } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('PVO', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-pvo.csv');
    const vol = extractColumn(rows, 'Volume');
    const expLine = extractColumn(rows, 'PVO');
    /* const _expSig = */ extractColumn(rows, 'PVO_Signal_Line');
    /* const _expHist = */ extractColumn(rows, 'PVO_Histogram');
    const line = momentum.pvo(vol, 12, 26);
    const sig = momentum.pvoSignal(vol, 12, 26, 9);
    const hist = momentum.pvoHist(vol, 12, 26, 9);
    const start = Math.max(0, vol.length - 30);
    for (let i = start; i < vol.length; i++) {
      if (!Number.isNaN(expLine[i])) expect(near(line[i], expLine[i], 1e-6)).toBe(true);
      if (!Number.isNaN(sig[i])) expect(near(hist[i], line[i] - sig[i], 1e-12)).toBe(true);
    }
  });
});
