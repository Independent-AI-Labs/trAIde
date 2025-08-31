import { describe, it, expect } from 'vitest';

import { volume } from '../src';

describe('Chaikin Oscillator', () => {
  it('positive when closes near highs with constant volume', () => {
    const high = [10, 11, 12, 13, 14, 15, 16];
    const low = [9, 10, 11, 12, 13, 14, 15];
    const close = [9.9, 10.9, 11.9, 12.9, 13.9, 14.9, 15.9];
    const vol = Array(high.length).fill(1000);
    const osc = volume.chaikinOscillator(high, low, close, vol, 3, 5);
    // After warmup, expect positive tendency
    expect(osc[6]).toBeGreaterThanOrEqual(0);
  });
});

