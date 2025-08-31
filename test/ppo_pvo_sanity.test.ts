import { describe, it, expect } from 'vitest';

import { momentum } from '../src';

describe('PPO/PVO sanity', () => {
  it('PPO line/signal/hist internal consistency', () => {
    const close = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const line = momentum.ppo(close, 3, 5);
    const sig = momentum.ppoSignal(close, 3, 5, 4);
    const hist = momentum.ppoHist(close, 3, 5, 4);
    const n = close.length;
    for (let i = 0; i < n; i++) {
      if (!Number.isNaN(sig[i])) expect(hist[i]).toBeCloseTo(line[i] - sig[i], 12);
    }
  });

  it('PVO line/signal/hist internal consistency', () => {
    const vol = [10, 20, 30, 40, 50, 40, 30, 20, 10, 15, 20, 25, 30, 35, 40];
    const line = momentum.pvo(vol, 3, 5);
    const sig = momentum.pvoSignal(vol, 3, 5, 4);
    const hist = momentum.pvoHist(vol, 3, 5, 4);
    const n = vol.length;
    for (let i = 0; i < n; i++) {
      if (!Number.isNaN(sig[i])) expect(hist[i]).toBeCloseTo(line[i] - sig[i], 12);
    }
  });
});
