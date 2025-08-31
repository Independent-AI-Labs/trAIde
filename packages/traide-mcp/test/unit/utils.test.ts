import { describe, it, expect } from 'vitest';
import { intervalToMs, Backoff } from '../../src/utils';

describe('intervalToMs', () => {
  it('parses units', () => {
    expect(intervalToMs('1s')).toBe(1000);
    expect(intervalToMs('1m')).toBe(60_000);
    expect(intervalToMs('2h')).toBe(7_200_000);
    expect(intervalToMs('1d')).toBe(86_400_000);
    expect(intervalToMs('1w')).toBe(604_800_000);
  });
  it('throws on invalid', () => {
    expect(() => intervalToMs('x')).toThrow();
  });
});

describe('Backoff', () => {
  it('increases then resets', () => {
    const b = new Backoff(10, 100);
    const d1 = b.next();
    const d2 = b.next();
    expect(d2).toBeGreaterThanOrEqual(d1);
    b.reset();
    const d3 = b.next();
    expect(d3).toBeLessThanOrEqual(d2);
  });
});

