export function onBalanceVolume(close: number[], volume: number[]): number[] {
  const n = Math.min(close.length, volume.length);
  const out = new Array(n).fill(NaN);
  let obv = 0;
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      out[i] = NaN;
      continue;
    }
    if (close[i] > close[i - 1]) obv += volume[i];
    else if (close[i] < close[i - 1]) obv -= volume[i];
    out[i] = obv;
  }
  return out;
}

export function accumulationDistributionIndex(
  high: number[],
  low: number[],
  close: number[],
  volume: number[],
): number[] {
  const n = Math.min(high.length, low.length, close.length, volume.length);
  const out = new Array(n).fill(NaN);
  let ad = 0;
  for (let i = 0; i < n; i++) {
    const hl = high[i] - low[i];
    const mfm = hl === 0 ? 0 : ((close[i] - low[i]) - (high[i] - close[i])) / hl;
    const mfv = mfm * volume[i];
    ad += mfv;
    out[i] = ad;
  }
  return out;
}

export function chaikinMoneyFlow(
  high: number[],
  low: number[],
  close: number[],
  volume: number[],
  window = 20,
): number[] {
  const n = Math.min(high.length, low.length, close.length, volume.length);
  const mfv = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const hl = high[i] - low[i];
    const mfm = hl === 0 ? 0 : ((close[i] - low[i]) - (high[i] - close[i])) / hl;
    mfv[i] = mfm * volume[i];
  }
  const out = new Array(n).fill(NaN);
  let sumMFV = 0;
  let sumVol = 0;
  for (let i = 0; i < n; i++) {
    sumMFV += mfv[i];
    sumVol += volume[i];
    if (i >= window) {
      sumMFV -= mfv[i - window];
      sumVol -= volume[i - window];
    }
    if (i >= window - 1) out[i] = sumVol === 0 ? 0 : sumMFV / sumVol;
  }
  return out;
}

export function forceIndex(
  close: number[],
  volume: number[],
  window = 13,
): { fi1: number[]; fi: number[] } {
  const n = Math.min(close.length, volume.length);
  const fi1 = new Array(n).fill(NaN);
  for (let i = 1; i < n; i++) fi1[i] = (close[i] - close[i - 1]) * volume[i];
  // EMA of fi1 with adjust=false, min_periods=0 (emit from start)
  const fi = new Array(n).fill(NaN);
  const alpha = 2 / (window + 1);
  let s: number | undefined;
  for (let i = 0; i < n; i++) {
    const raw = fi1[i];
    const have = Number.isFinite(raw);
    const v = have ? (raw as number) : 0;
    if (s === undefined) {
      if (have) s = v;
    } else {
      s = alpha * v + (1 - alpha) * s;
    }
    if (s !== undefined) fi[i] = s;
  }
  return { fi1, fi };
}

export function easeOfMovement(
  high: number[],
  low: number[],
  volume: number[],
  window = 14,
): { emv: number[]; sma: number[] } {
  const n = Math.min(high.length, low.length, volume.length);
  const emv = new Array(n).fill(NaN);
  for (let i = 1; i < n; i++) {
    const dm = (high[i] - high[i - 1] + (low[i] - low[i - 1]));
    const br = high[i] - low[i];
    emv[i] = (dm * br) / (2 * volume[i]) * 1e8;
  }
  const sma = new Array(n).fill(NaN);
  let sum = 0;
  const valid: number[] = [];
  for (let i = 0; i < n; i++) {
    const v = emv[i];
    valid.push(v);
    if (valid.length > window) valid.shift();
    if (valid.length === window && valid.every((x) => Number.isFinite(x))) {
      sum = valid.reduce((a, b) => a + b, 0);
      sma[i] = sum / window;
    }
  }
  return { emv, sma };
}

export function volumePriceTrend(
  close: number[],
  volume: number[],
  smoothingFactor?: number,
): number[] {
  const n = Math.min(close.length, volume.length);
  const vpt = new Array(n).fill(NaN);
  let acc = 0;
  // Standard convention: start at 0
  if (n > 0) vpt[0] = 0;
  for (let i = 1; i < n; i++) {
    const pct = close[i - 1] === 0 ? 0 : (close[i] - close[i - 1]) / close[i - 1];
    acc += pct * volume[i];
    vpt[i] = acc;
  }
  if (!smoothingFactor) return vpt;
  const out = new Array(n).fill(NaN);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const v = vpt[i];
    sum += v;
    if (i >= smoothingFactor) sum -= vpt[i - smoothingFactor];
    if (i >= smoothingFactor - 1) out[i] = sum / smoothingFactor;
  }
  return out;
}

export function moneyFlowIndex(
  high: number[],
  low: number[],
  close: number[],
  volume: number[],
  window = 14,
): number[] {
  const n = Math.min(high.length, low.length, close.length, volume.length);
  const tp = new Array(n).fill(NaN).map((_, i) => (high[i] + low[i] + close[i]) / 3);
  const upDown = new Array(n).fill(NaN);
  for (let i = 1; i < n; i++) upDown[i] = tp[i] >= tp[i - 1] ? 1 : -1;
  const mfr = new Array(n).fill(NaN).map((_, i) => tp[i] * volume[i] * (upDown[i] ?? 0));
  const pos = new Array(n).fill(0);
  const neg = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    pos[i] = mfr[i] >= 0 ? mfr[i] : 0;
    neg[i] = mfr[i] < 0 ? -mfr[i] : 0;
  }
  const sumPos = new Array(n).fill(NaN);
  const sumNeg = new Array(n).fill(NaN);
  let accPos = 0;
  let accNeg = 0;
  for (let i = 0; i < n; i++) {
    accPos += pos[i];
    accNeg += neg[i];
    if (i >= window) {
      accPos -= pos[i - window];
      accNeg -= neg[i - window];
    }
    if (i >= window - 1) {
      sumPos[i] = accPos;
      sumNeg[i] = accNeg;
    }
  }
  const out = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    const den = sumNeg[i];
    if (Number.isFinite(sumPos[i]) && Number.isFinite(den) && den !== 0) {
      const ratio = (sumPos[i] as number) / (den as number);
      out[i] = 100 - 100 / (1 + ratio);
    }
  }
  return out;
}

export function negativeVolumeIndex(
  close: number[],
  volume: number[],
): number[] {
  const n = Math.min(close.length, volume.length);
  const out = new Array(n).fill(NaN);
  if (n === 0) return out;
  out[0] = 1000;
  for (let i = 1; i < n; i++) {
    const volDec = volume[i - 1] > volume[i];
    const pct = close[i - 1] === 0 ? 0 : (close[i] - close[i - 1]) / close[i - 1];
    out[i] = volDec ? out[i - 1] * (1 + pct) : out[i - 1];
  }
  return out;
}

export function vwap(
  high: number[],
  low: number[],
  close: number[],
  volume: number[],
  window = 14,
): number[] {
  const n = Math.min(high.length, low.length, close.length, volume.length);
  const tp = new Array(n).fill(NaN).map((_, i) => (high[i] + low[i] + close[i]) / 3);
  const pv = new Array(n).fill(NaN).map((_, i) => tp[i] * volume[i]);
  const out = new Array(n).fill(NaN);
  let sumPV = 0;
  let sumV = 0;
  for (let i = 0; i < n; i++) {
    sumPV += pv[i];
    sumV += volume[i];
    if (i >= window) {
      sumPV -= pv[i - window];
      sumV -= volume[i - window];
    }
    if (i >= window - 1) out[i] = sumV === 0 ? NaN : sumPV / sumV;
  }
  return out;
}

/**
 * Chaikin Oscillator: EMA(fast, ADL) - EMA(slow, ADL).
 * Uses adjust=false semantics with continuous seeding via emaFrom.
 */
export function chaikinOscillator(
  high: number[],
  low: number[],
  close: number[],
  volume: number[],
  fast = 3,
  slow = 10,
): number[] {
  const n = Math.min(high.length, low.length, close.length, volume.length);
  // Accumulation/Distribution Line (ADL)
  const adl = new Array(n).fill(NaN);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const hl = high[i] - low[i];
    const mfm = hl === 0 ? 0 : ((close[i] - low[i]) - (high[i] - close[i])) / hl;
    const mfv = mfm * volume[i];
    acc += mfv;
    adl[i] = acc;
  }
  // EMA(adl, fast) - EMA(adl, slow)
  const fastE = emaFrom(adl.map(v => (Number.isFinite(v) ? (v as number) : 0)), fast, 0);
  const slowE = emaFrom(adl.map(v => (Number.isFinite(v) ? (v as number) : 0)), slow, 0);
  return adl.map((_, i) => fastE[i] - slowE[i]);
}
import { emaFrom } from "../utils";
