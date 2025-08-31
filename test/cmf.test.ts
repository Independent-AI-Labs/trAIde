import { describe, it, expect } from 'vitest';

import { volume } from '../src';

describe('Chaikin Money Flow (CMF)', () => {
  it('computes expected values on a simple series', () => {
    const high = [10, 12, 11, 12];
    const low = [8, 10, 9, 10];
    const close = [9, 11, 10, 12];
    const vol = [100, 200, 150, 250];
    const cmf = volume.chaikinMoneyFlow(high, low, close, vol, 2);
    // Last two periods are valid
    expect(Number.isNaN(cmf[0])).toBe(true);
    expect(Number.isNaN(cmf[1])).toBe(false);
    expect(Number.isNaN(cmf[2])).toBe(false);
    expect(Number.isNaN(cmf[3])).toBe(false);
    // CMF should be between -1 and 1
    expect(cmf[3]).toBeLessThanOrEqual(1);
    expect(cmf[3]).toBeGreaterThanOrEqual(-1);
  });
});

