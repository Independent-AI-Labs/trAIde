import { describe, it, expect } from 'vitest';

import { returns } from '../src';

describe('Returns', () => {
  it('dailyReturn: simple arithmetic returns', () => {
    const close = [100, 110, 121, 108.9];
    const r = returns.dailyReturn(close);
    expect(Number.isNaN(r[0])).toBe(true);
    expect(r[1]).toBeCloseTo(0.1, 12);
    expect(r[2]).toBeCloseTo(0.1, 12);
    expect(r[3]).toBeCloseTo(-0.1, 12);
  });

  it('logReturn: natural log returns', () => {
    const close = [100, 110, 121];
    const r = returns.logReturn(close);
    expect(Number.isNaN(r[0])).toBe(true);
    expect(r[1]).toBeCloseTo(Math.log(1.1), 12);
    expect(r[2]).toBeCloseTo(Math.log(1.1), 12);
  });

  it('cumulativeReturn: product of (1+r)-1', () => {
    const close = [100, 110, 121, 108.9];
    const cr = returns.cumulativeReturn(close);
    expect(Number.isNaN(cr[0])).toBe(true);
    expect(cr[1]).toBeCloseTo(0.1, 12);
    expect(cr[2]).toBeCloseTo(0.21, 12);
    expect(cr[3]).toBeCloseTo(0.089, 12);
  });
});
