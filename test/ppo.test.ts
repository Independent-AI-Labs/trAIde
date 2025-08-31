import { describe, it, expect } from 'vitest';

import { momentum } from '../src';

import { extractColumn, near, readCsv } from './helpers';

describe('PPO', () => {
  it('matches Python ta fixtures', () => {
    const rows = readCsv('ta/test/data/cs-ppo.csv');
    const close = extractColumn(rows, 'Close');
    const expLine = extractColumn(rows, 'PPO');
    /* const _expSig = */ extractColumn(rows, 'PPO_Signal_Line');
    /* const _expHist = */ extractColumn(rows, 'PPO_Histogram');
    const line = momentum.ppo(close, 12, 26);
    const sig = momentum.ppoSignal(close, 12, 26, 9);
    const hist = momentum.ppoHist(close, 12, 26, 9);
    const start = Math.max(0, close.length - 30);
    for (let i = start; i < close.length; i++) {
      if (!Number.isNaN(expLine[i])) expect(near(line[i], expLine[i], 1e-6)).toBe(true);
      if (!Number.isNaN(sig[i])) expect(near(hist[i], line[i] - sig[i], 1e-12)).toBe(true);
    }
  });
});
