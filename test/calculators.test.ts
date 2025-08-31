import { describe, it, expect } from 'vitest';

import { calculators, momentum, trend, volatility, volume } from '../src';
import { ema } from '../src/utils';

describe('Streaming calculators parity', () => {
  it('EMA streaming matches batch', () => {
    const vals = [1,2,3,4,5,6,7,8,9,10];
    const calc = new calculators.EmaCalc(3);
    const got = vals.map(v => calc.update(v));
    const exp = ema(vals, 3);
    for (let i = 0; i < vals.length; i++) {
      if (Number.isNaN(exp[i])) continue;
      expect(got[i]).toBeCloseTo(exp[i], 12);
    }
  });

  it('RSI streaming matches batch', () => {
    const close = [10,11,12,13,12,11,12,13,14,15,16,17,16];
    const calc = new calculators.RsiCalc(5);
    const got = close.map(v => calc.update(v));
    const exp = momentum.rsi(close, 5);
    for (let i = 0; i < close.length; i++) if (!Number.isNaN(exp[i])) expect(got[i]).toBeCloseTo(exp[i], 8);
  });

  it('MACD streaming matches batch', () => {
    const close = [1,2,3,4,5,6,7,8,9,10,9,8,7,6,5];
    const m = new calculators.MacdCalc(6, 3, 4);
    const line: number[] = [], sig: number[] = [], diff: number[] = [];
    for (const c of close) { const r = m.update(c); line.push(r.line); sig.push(r.signal); diff.push(r.diff); }
    const expLine = trend.macd(close, 6, 3);
    const expSig = trend.macdSignal(close, 6, 3, 4);
    const expDiff = trend.macdDiff(close, 6, 3, 4);
    for (let i = 0; i < close.length; i++) {
      if (!Number.isNaN(expLine[i])) expect(line[i]).toBeCloseTo(expLine[i], 8);
      if (!Number.isNaN(expSig[i])) expect(diff[i]).toBeCloseTo(expDiff[i], 8);
    }
  });

  it('ATR streaming matches batch', () => {
    const high = [10,11,12,13,14,15,16,15,14];
    const low =  [ 9,10,11,12,13,14,15,14,13];
    const close =[ 9.5,10.5,11.5,12.5,13.5,14.5,15.5,14.5,13.5];
    const a = new calculators.AtrCalc(5);
    const got = high.map((_, i) => a.update(high[i], low[i], close[i]));
    const exp = volatility.atr(high, low, close, 5);
    for (let i = 0; i < high.length; i++) {
      if (i >= 5 - 1) expect(got[i]).toBeCloseTo(exp[i], 8);
    }
  });

  it('Stochastic streaming matches batch', () => {
    const high = [10,11,12,13,14,15,16,17];
    const low  = [ 9,10,11,12,13,14,15,16];
    const close= [ 9.5,10.1,10.9,12.5,13.2,14.8,15.1,16.9];
    const s = new calculators.StochasticCalc(5, 3);
    const k: number[] = [], d: number[] = [];
    for (let i = 0; i < high.length; i++) { const r = s.update(high[i], low[i], close[i]); k.push(r.k); d.push(r.d); }
    const exp = momentum.stochastic(high, low, close, 5, 3);
    for (let i = 0; i < high.length; i++) {
      if (!Number.isNaN(exp.k[i])) expect(k[i]).toBeCloseTo(exp.k[i], 8);
      if (!Number.isNaN(exp.d[i])) expect(d[i]).toBeCloseTo(exp.d[i], 8);
    }
  });

  it('VWAP streaming matches batch', () => {
    const high = [10,11,12,13,14,15,16];
    const low  = [ 9,10,11,12,13,14,15];
    const close= [ 9.5,10.5,11.5,12.5,13.5,14.5,15.5];
    const vol  = [100,200,150,100,120,130,140];
    const c = new calculators.VwapCalc(4);
    const got = high.map((_, i) => c.update(high[i], low[i], close[i], vol[i]));
    const exp = volume.vwap(high, low, close, vol, 4);
    for (let i = 0; i < high.length; i++) if (!Number.isNaN(exp[i])) expect(got[i]).toBeCloseTo(exp[i], 12);
  });
});

  it('PpoCalc approximates batch PPO/Signal/Hist', () => {
    const closes = Array.from({ length: 200 }, (_, i) => 100 + Math.sin(i / 10) * 5 + i * 0.1);
    const ppo = new calculators.PpoCalc();
    const line: number[] = [];
    const sig: number[] = [];
    const hist: number[] = [];
    for (const c of closes) { const r = ppo.update(c); line.push(r.ppo); sig.push(r.signal); hist.push(r.hist); }
    const bppo = momentum.ppo(closes, 12, 26);
    const bsig = momentum.ppoSignal(closes, 12, 26, 9);
    const bhist = momentum.ppoHist(closes, 12, 26, 9);
    for (let i = 30; i < closes.length; i++) {
      if (!Number.isNaN(bppo[i])) expect(Math.abs(line[i] - bppo[i])).toBeLessThan(1e-6);
      if (!Number.isNaN(bsig[i])) expect(Math.abs(sig[i] - bsig[i])).toBeLessThan(1e-6);
      if (!Number.isNaN(bhist[i])) expect(Math.abs(hist[i] - bhist[i])).toBeLessThan(1e-6);
    }
  });

  it('PvoCalc approximates batch PVO/Signal/Hist', () => {
    const vols = Array.from({ length: 200 }, (_, i) => 1000 + Math.sin(i / 7) * 100 + (i % 13));
    const pvo = new calculators.PvoCalc();
    const line: number[] = [];
    const sig: number[] = [];
    const hist: number[] = [];
    for (const v of vols) { const r = pvo.update(v); line.push(r.pvo); sig.push(r.signal); hist.push(r.hist); }
    const bpvo = momentum.pvo(vols, 12, 26);
    const bsig = momentum.pvoSignal(vols, 12, 26, 9);
    const bhist = momentum.pvoHist(vols, 12, 26, 9);
    for (let i = 30; i < vols.length; i++) {
      if (!Number.isNaN(bpvo[i])) expect(Math.abs(line[i] - bpvo[i])).toBeLessThan(1e-6);
      if (!Number.isNaN(bsig[i])) expect(Math.abs(sig[i] - bsig[i])).toBeLessThan(1e-6);
      if (!Number.isNaN(bhist[i])) expect(Math.abs(hist[i] - bhist[i])).toBeLessThan(1e-6);
    }
  });

  it('PPO streaming matches batch', () => {
    const closes = Array.from({ length: 120 }, (_, i) => 100 + Math.sin(i / 10) * 3 + i * 0.05);
    const ppo = new calculators.PpoCalc();
    const line: number[] = [], sig: number[] = [], hist: number[] = [];
    for (const c of closes) { const r = ppo.update(c); line.push(r.ppo); sig.push(r.signal); hist.push(r.hist); }
    const bl = momentum.ppo(closes, 12, 26);
    const bs = momentum.ppoSignal(closes, 12, 26, 9);
    const bh = momentum.ppoHist(closes, 12, 26, 9);
    for (let i = 30; i < closes.length; i++) {
      if (!Number.isNaN(bl[i])) expect(line[i]).toBeCloseTo(bl[i], 8);
      if (!Number.isNaN(bs[i])) expect(sig[i]).toBeCloseTo(bs[i], 8);
      if (!Number.isNaN(bh[i])) expect(hist[i]).toBeCloseTo(bh[i], 8);
    }
  });

  it('PVO streaming matches batch', () => {
    const vols = Array.from({ length: 120 }, (_, i) => 1000 + Math.sin(i / 8) * 120 + (i % 11));
    const pvo = new calculators.PvoCalc();
    const line: number[] = [], sig: number[] = [], hist: number[] = [];
    for (const v of vols) { const r = pvo.update(v); line.push(r.pvo); sig.push(r.signal); hist.push(r.hist); }
    const bl = momentum.pvo(vols, 12, 26);
    const bs = momentum.pvoSignal(vols, 12, 26, 9);
    const bh = momentum.pvoHist(vols, 12, 26, 9);
    for (let i = 30; i < vols.length; i++) {
      if (!Number.isNaN(bl[i])) expect(line[i]).toBeCloseTo(bl[i], 8);
      if (!Number.isNaN(bs[i])) expect(sig[i]).toBeCloseTo(bs[i], 8);
      if (!Number.isNaN(bh[i])) expect(hist[i]).toBeCloseTo(bh[i], 8);
    }
  });
