import { describe, it, expect } from 'vitest';

import {
  toNumberArray,
  asArray,
  nans,
  rollingStd,
  trueRange,
  highest as rollingHigh,
  lowest as rollingLow,
  tp,
  fillna,
  emaFrom,
  wilderRma,
  sma,
  ewmAlpha,
} from '../src/utils';

describe('Low-level utils coverage', () => {
  it('toNumberArray/asArray/nans basic behavior', () => {
    expect(toNumberArray([1, null, undefined, '3' as unknown as number])[1]).toEqual(NaN);
    expect(asArray(new Float64Array([1, 2]))).toEqual([1, 2]);
    expect(asArray([1, 2, 3])).toEqual([1, 2, 3]);
    const xs = nans(3);
    expect(xs.length).toBe(3);
    expect(xs.every(Number.isNaN)).toBe(true);
  });

  it('rollingStd ddof=0 and tp', () => {
    const data = [1, 2, 3, 4];
    const std2 = rollingStd(data, 2);
    // std of [1,2] with ddof=0 is 0.5
    expect(std2[1]).toBeCloseTo(0.5);
    const h = [10, 12];
    const l = [8, 9];
    const c = [9, 11];
    const t = tp(h, l, c);
    expect(t[0]).toBeCloseTo((10 + 8 + 9) / 3);
  });

  it('trueRange first element and subsequent', () => {
    const h = [10, 12];
    const l = [9, 8];
    const c = [9.5, 9.2];
    const tr = trueRange(h, l, c);
    expect(tr[0]).toBeCloseTo(1);
    expect(tr[1]).toBeCloseTo(Math.max(12 - 8, Math.abs(12 - 9.5), Math.abs(8 - 9.5)));
  });

  it('rolling highest/lowest with ties', () => {
    const vals = [1, 2, 2, 1, 3, 3, 2];
    const hi = rollingHigh(vals, 3);
    const lo = rollingLow(vals, 3);
    expect(hi[2]).toBe(2);
    expect(lo[2]).toBe(1);
    expect(hi[4]).toBe(3);
    expect(lo[6]).toBe(2);
  });

  it('edge branches for utils', () => {
    // sma window<=0
    expect(sma([1, 2, 3], 0).every(Number.isNaN)).toBe(true);
    // rollingStd window<=1
    expect(rollingStd([1, 2, 3], 1).every(Number.isNaN)).toBe(true);
    // wilderRma window<=0
    expect(wilderRma([1, 2, 3], 0).every(Number.isNaN)).toBe(true);
    // emaFrom window<=0
    expect(emaFrom([1, 2, 3], 0, 0).every(Number.isNaN)).toBe(true);
    // ewmAlpha invalid alpha
    expect(ewmAlpha([1, 2, 3], 0, 1).every(Number.isNaN)).toBe(true);
  });

  it('fillna replaces NaN with provided value', () => {
    const arr = [NaN, 1, NaN, 2];
    expect(fillna(arr, -1)).toEqual([-1, 1, -1, 2]);
  });

  it('emaFrom respects startIndex and min periods', () => {
    const line = [NaN, NaN, 1, 2, 3, 4];
    const out = emaFrom(line.map((x) => (Number.isFinite(x) ? (x as number) : 0)), 3, 2);
    expect(Number.isNaN(out[3])).toBe(true); // first two NaNs, then seed at index 2 -> output starts at 2 + (3-1)
    expect(Number.isNaN(out[4])).toBe(false);
  });
});
