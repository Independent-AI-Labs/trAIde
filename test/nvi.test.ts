import { describe, it, expect } from 'vitest';

import { volume } from '../src';

describe('NVI sanity', () => {
  it('starts at 1000 and updates only when volume decreases', () => {
    const close = [10, 11, 12, 11, 12, 13];
    const vol = [100, 90, 95, 80, 85, 70];
    const nvi = volume.negativeVolumeIndex(close, vol);
    expect(nvi[0]).toBeCloseTo(1000);
    // volume decreased at index 1 -> increase by price change
    expect(nvi[1]).toBeGreaterThan(nvi[0]);
    // volume increased at index 2 -> unchanged
    expect(nvi[2]).toBeCloseTo(nvi[1]);
  });
});
