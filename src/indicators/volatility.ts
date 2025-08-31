import { ema, rollingStd, sma, trueRange, highest, lowest } from "../utils";

export function bollingerMavg(close: number[], window = 20): number[] {
  return sma(close, window);
}

export function bollingerHband(
  close: number[],
  window = 20,
  windowDev = 2
): number[] {
  const mavg = sma(close, window);
  const std = rollingStd(close, window);
  return close.map((_, i) => mavg[i] + windowDev * std[i]);
}

export function bollingerLband(
  close: number[],
  window = 20,
  windowDev = 2
): number[] {
  const mavg = sma(close, window);
  const std = rollingStd(close, window);
  return close.map((_, i) => mavg[i] - windowDev * std[i]);
}

export function bollingerWband(
  close: number[],
  window = 20,
  windowDev = 2
): number[] {
  const mavg = sma(close, window);
  const std = rollingStd(close, window);
  return close.map((_, i) => (2 * windowDev * std[i] * 100) / mavg[i]);
}

export function bollingerPband(
  close: number[],
  window = 20,
  windowDev = 2
): number[] {
  const h = bollingerHband(close, window, windowDev);
  const l = bollingerLband(close, window, windowDev);
  return close.map((c, i) => (c - l[i]) / (h[i] - l[i]));
}

export function bollingerHbandIndicator(
  close: number[],
  window = 20,
  windowDev = 2,
): number[] {
  const n = close.length;
  const h = bollingerHband(close, window, windowDev);
  const out = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (i >= window - 1) out[i] = close[i] > h[i] ? 1 : 0;
  }
  return out;
}

export function bollingerLbandIndicator(
  close: number[],
  window = 20,
  windowDev = 2,
): number[] {
  const n = close.length;
  const l = bollingerLband(close, window, windowDev);
  const out = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (i >= window - 1) out[i] = close[i] < l[i] ? 1 : 0;
  }
  return out;
}

export function atr(
  high: number[],
  low: number[],
  close: number[],
  window = 14
): number[] {
  const n = Math.min(high.length, low.length, close.length);
  const tr = trueRange(high, low, close);
  const out = new Array(n).fill(0);
  if (window <= 0) return out;
  let sum = 0;
  for (let i = 0; i < window; i++) sum += tr[i];
  out[window - 1] = sum / window;
  for (let i = window; i < n; i++) {
    out[i] = (out[i - 1] * (window - 1) + tr[i]) / window;
  }
  return out;
}

export function keltnerChannel(
  high: number[],
  low: number[],
  close: number[],
  window = 20,
  windowAtr = 10,
  originalVersion = true,
  multiplier = 2,
): { m: number[]; h: number[]; l: number[]; w: number[]; p: number[] } {
  const n = Math.min(high.length, low.length, close.length);
  const m: number[] = new Array(n).fill(NaN);
  const hband: number[] = new Array(n).fill(NaN);
  const lband: number[] = new Array(n).fill(NaN);
  if (originalVersion) {
    const tp = close.map((_, i) => (high[i] + low[i] + close[i]) / 3);
    const mavg = sma(tp, window);
    const tph = sma(close.map((_, i) => ((4 * high[i]) - (2 * low[i]) + close[i]) / 3), window);
    const tpl = sma(close.map((_, i) => ((-2 * high[i]) + (4 * low[i]) + close[i]) / 3), window);
    for (let i = 0; i < n; i++) {
      m[i] = mavg[i];
      hband[i] = tph[i];
      lband[i] = tpl[i];
    }
  } else {
    const mavg = ema(close, window);
    const atrv = atr(high, low, close, windowAtr);
    for (let i = 0; i < n; i++) {
      m[i] = mavg[i];
      hband[i] = mavg[i] + multiplier * atrv[i];
      lband[i] = mavg[i] - multiplier * atrv[i];
    }
  }
  const wband = m.map((mv, i) => ((hband[i] - lband[i]) / mv) * 100);
  const pband = m.map((_, i) => (close[i] - lband[i]) / (hband[i] - lband[i]));
  return { m, h: hband, l: lband, w: wband, p: pband };
}

export function donchianChannel(
  high: number[],
  low: number[],
  close: number[],
  window = 20,
  offset = 0,
): { h: number[]; l: number[]; m: number[]; w: number[]; p: number[] } {
  const n = Math.min(high.length, low.length, close.length);
  // Use O(n) deque helpers for rolling highs/lows
  const hband = highest(high.slice(0, n), window);
  const lband = lowest(low.slice(0, n), window);
  const applyOffset = (arr: number[]) => {
    if (offset === 0) return arr;
    const out = new Array(n).fill(NaN);
    for (let i = 0; i < n; i++) {
      const idx = i - offset;
      out[i] = idx >= 0 && idx < n ? arr[idx] : NaN;
    }
    return out;
  };
  const h = applyOffset(hband);
  const l = applyOffset(lband);
  const m = h.map((_, i) => ((h[i] - l[i]) / 2) + l[i]);
  const ma = sma(close, window);
  const w = h.map((_, i) => ((h[i] - l[i]) / ma[i]) * 100);
  const p = h.map((_, i) => (close[i] - l[i]) / (h[i] - l[i]));
  return { h, l, m, w, p };
}

export function ulcerIndex(close: number[], window = 14): number[] {
  const n = close.length;
  const uiMax = highest(close, window);
  const r: number[] = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) r[i] = 100 * ((close[i] - uiMax[i]) / uiMax[i]);
  const out = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (i >= window - 1) {
      let sumSq = 0;
      for (let j = i - window + 1; j <= i; j++) sumSq += r[j] * r[j];
      out[i] = Math.sqrt(sumSq / window);
    }
  }
  return out;
}
