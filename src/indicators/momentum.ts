import { ewmAlpha, emaFrom, highest, lowest } from "../utils";

export function rsi(close: number[], window = 14): number[] {
  const n = close.length;
  const gains = new Array(n).fill(NaN);
  const losses = new Array(n).fill(NaN);
  for (let i = 1; i < n; i++) {
    const diff = close[i] - close[i - 1];
    gains[i] = diff > 0 ? diff : 0;
    losses[i] = diff < 0 ? -diff : 0;
  }
  const avgGain = ewmAlpha(gains.map((v) => (Number.isFinite(v) ? v : 0)), 1 / window, window);
  const avgLoss = ewmAlpha(losses.map((v) => (Number.isFinite(v) ? v : 0)), 1 / window, window);
  const out = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    const loss = avgLoss[i];
    const rs = loss === 0 ? Infinity : avgGain[i] / loss;
    out[i] = 100 - 100 / (1 + rs);
  }
  return out;
}

export function stochastic(
  high: number[],
  low: number[],
  close: number[],
  window = 14,
  smoothWindow = 3
): { k: number[]; d: number[] } {
  const n = Math.min(high.length, low.length, close.length);
  const highestHigh = highest(high.slice(0, n), window);
  const lowestLow = lowest(low.slice(0, n), window);
  const k = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    const hh = highestHigh[i];
    const ll = lowestLow[i];
    const denom = hh - ll;
    k[i] = denom === 0 ? 0 : ((close[i] - ll) / denom) * 100;
  }
  const d = smaLocal(k, smoothWindow);
  return { k, d };
}

function smaLocal(values: number[], window: number): number[] {
  const out = new Array(values.length).fill(NaN);
  let sum = 0;
  const buf: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    buf.push(v);
    if (buf.length > window) {
      buf.shift();
    }
    if (buf.length === window && buf.every(Number.isFinite)) {
      sum = buf.reduce((a, b) => a + b, 0);
      out[i] = sum / window;
    }
  }
  return out;
}

export function roc(close: number[], window = 12): number[] {
  const n = close.length;
  const out = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (i >= window && close[i - window] !== 0) {
      out[i] = ((close[i] - close[i - window]) / close[i - window]) * 100;
    }
  }
  return out;
}

export function kama(
  close: number[],
  window = 10,
  pow1 = 2,
  pow2 = 30,
): number[] {
  const n = close.length;
  const out = new Array(n).fill(NaN);
  if (n === 0) return out;
  const vol: number[] = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    vol[i] = i === 0 ? NaN : Math.abs(close[i] - close[i - 1]);
  }
  const erNum: number[] = new Array(n).fill(NaN);
  const erDen: number[] = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (i >= window) erNum[i] = Math.abs(close[i] - close[i - window]);
    if (i >= window) {
      let sum = 0;
      let valid = true;
      for (let j = i - window + 1; j <= i; j++) {
        if (!Number.isFinite(vol[j])) {
          valid = false;
          break;
        }
        sum += vol[j] as number;
      }
      erDen[i] = valid ? sum : NaN;
    }
  }
  const fast = 2 / (pow1 + 1);
  const slow = 2 / (pow2 + 1);
  const sc: number[] = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    const den = erDen[i];
    const er = den && den !== 0 ? (erNum[i] ?? 0) / den : 0;
    sc[i] = Math.pow(er * (fast - slow) + slow, 2);
  }
  let seeded = false;
  for (let i = 0; i < n; i++) {
    if (Number.isNaN(sc[i])) {
      out[i] = NaN;
    } else if (!seeded) {
      out[i] = close[i];
      seeded = true;
    } else {
      out[i] = out[i - 1] + sc[i] * (close[i] - out[i - 1]);
    }
  }
  return out;
}

export function tsi(close: number[], windowSlow = 25, windowFast = 13): number[] {
  const n = close.length;
  const mom = new Array(n).fill(NaN);
  for (let i = 1; i < n; i++) mom[i] = close[i] - close[i - 1];
  const alphaSlow = 2 / (windowSlow + 1);
  const alphaFast = 2 / (windowFast + 1);
  const eslow = ewmAlpha(mom.map((v) => (Number.isFinite(v) ? (v as number) : 0)), alphaSlow, windowSlow);
  const efast = ewmAlpha(eslow.map((v) => (Number.isFinite(v) ? (v as number) : 0)), alphaFast, windowFast);
  const absMom = mom.map((v) => (Number.isFinite(v) ? Math.abs(v as number) : 0));
  const eslowAbs = ewmAlpha(absMom, alphaSlow, windowSlow);
  const efastAbs = ewmAlpha(eslowAbs.map((v) => (Number.isFinite(v) ? (v as number) : 0)), alphaFast, windowFast);
  const out = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    const denom = efastAbs[i];
    out[i] = denom === 0 ? NaN : (efast[i] / denom) * 100;
  }
  return out;
}

export function ultimateOscillator(
  high: number[],
  low: number[],
  close: number[],
  window1 = 7,
  window2 = 14,
  window3 = 28,
): number[] {
  const n = Math.min(high.length, low.length, close.length);
  const bp = new Array(n).fill(NaN);
  const tr = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    const cPrev = i > 0 ? close[i - 1] : close[i];
    const minLow = Math.min(low[i], cPrev);
    const maxHigh = Math.max(high[i], cPrev);
    bp[i] = close[i] - minLow;
    tr[i] = maxHigh - minLow;
  }
  const avg = (_: number[], window: number): number[] => {
    const out = new Array(n).fill(NaN);
    let sumBP = 0;
    let sumTR = 0;
    for (let i = 0; i < n; i++) {
      sumBP += bp[i];
      sumTR += tr[i];
      if (i >= window) {
        sumBP -= bp[i - window];
        sumTR -= tr[i - window];
      }
      if (i >= window - 1) out[i] = sumTR === 0 ? 0 : sumBP / sumTR;
    }
    return out;
  };
  const a1 = avg(bp, window1);
  const a2 = avg(bp, window2);
  const a3 = avg(bp, window3);
  const out = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) out[i] = 100 * ((4 * a1[i] + 2 * a2[i] + a3[i]) / 7);
  return out;
}

export function ppo(
  close: number[],
  windowFast = 12,
  windowSlow = 26,
): number[] {
  // Match pandas/ta: adjust=false with min_periods=0 (emit from start)
  const fast = ewmAlpha(close, 2 / (windowFast + 1), 1);
  const slow = ewmAlpha(close, 2 / (windowSlow + 1), 1);
  return close.map((_, i) => (slow[i] === 0 ? NaN : ((fast[i] - slow[i]) / slow[i]) * 100));
}

export function ppoSignal(
  close: number[],
  windowFast = 12,
  windowSlow = 26,
  windowSign = 9,
): number[] {
  const line = ppo(close, windowFast, windowSlow);
  const start = line.findIndex((x) => !Number.isNaN(x));
  return emaFrom(line.map((v) => (Number.isFinite(v) ? (v as number) : 0)), windowSign, start < 0 ? 0 : start);
}

export function ppoHist(
  close: number[],
  windowFast = 12,
  windowSlow = 26,
  windowSign = 9,
): number[] {
  const line = ppo(close, windowFast, windowSlow);
  const sig = ppoSignal(close, windowFast, windowSlow, windowSign);
  return line.map((_, i) => line[i] - sig[i]);
}

export function pvo(
  volume: number[],
  windowFast = 12,
  windowSlow = 26,
): number[] {
  // Match pandas/ta: adjust=false with min_periods=0 (emit from start)
  const fast = ewmAlpha(volume, 2 / (windowFast + 1), 1);
  const slow = ewmAlpha(volume, 2 / (windowSlow + 1), 1);
  return volume.map((_, i) => (slow[i] === 0 ? NaN : ((fast[i] - slow[i]) / slow[i]) * 100));
}

export function pvoSignal(
  volume: number[],
  windowFast = 12,
  windowSlow = 26,
  windowSign = 9,
): number[] {
  const line = pvo(volume, windowFast, windowSlow);
  const start = line.findIndex((x) => !Number.isNaN(x));
  return emaFrom(line.map((v) => (Number.isFinite(v) ? (v as number) : 0)), windowSign, start < 0 ? 0 : start);
}

export function pvoHist(
  volume: number[],
  windowFast = 12,
  windowSlow = 26,
  windowSign = 9,
): number[] {
  const line = pvo(volume, windowFast, windowSlow);
  const sig = pvoSignal(volume, windowFast, windowSlow, windowSign);
  return line.map((_, i) => line[i] - sig[i]);
}

export function williamsR(
  high: number[],
  low: number[],
  close: number[],
  window = 14,
): number[] {
  const n = Math.min(high.length, low.length, close.length);
  const out = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (i >= window - 1) {
      let hh = -Infinity;
      let ll = Infinity;
      for (let j = i - window + 1; j <= i; j++) {
        if (high[j] > hh) hh = high[j];
        if (low[j] < ll) ll = low[j];
      }
      const denom = hh - ll;
      out[i] = denom === 0 ? NaN : ((hh - close[i]) / denom) * -100;
    }
  }
  return out;
}

/**
 * StochRSI normalized to [0,1]: (RSI - min(RSI, w)) / (max(RSI, w) - min(RSI, w)).
 */
export function stochRsi(
  close: number[],
  window = 14,
): number[] {
  const n = close.length;
  const r = rsi(close, window);
  const out = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (i >= window - 1) {
      let hh = -Infinity;
      let ll = Infinity;
      let valid = true;
      for (let j = i - window + 1; j <= i; j++) {
        const v = r[j];
        if (!Number.isFinite(v)) { valid = false; break; }
        if (v > hh) hh = v as number;
        if (v < ll) ll = v as number;
      }
      if (valid) {
        const den = hh - ll;
        out[i] = den === 0 ? 0 : ((r[i] - ll) / den);
      }
    }
  }
  return out;
}

/** SMA-smoothed %K of StochRSI (values in [0,1]) */
export function stochRsiK(
  close: number[],
  window = 14,
  smoothK = 3,
): number[] {
  const sr = stochRsi(close, window);
  return smaLocal(sr.map(v => (Number.isFinite(v) ? (v as number) : NaN)), smoothK);
}

/** SMA of %K over smoothD */
export function stochRsiD(
  close: number[],
  window = 14,
  smoothK = 3,
  smoothD = 3,
): number[] {
  const k = stochRsiK(close, window, smoothK);
  return smaLocal(k.map(v => (Number.isFinite(v) ? (v as number) : NaN)), smoothD);
}

export function awesomeOscillator(
  high: number[],
  low: number[],
  window1 = 5,
  window2 = 34,
): number[] {
  const n = Math.min(high.length, low.length);
  const median = new Array(n).fill(NaN).map((_, i) => (high[i] + low[i]) / 2);
  const smaLocal = (arr: number[], w: number): number[] => {
    const out = new Array(n).fill(NaN);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += arr[i];
      if (i >= w) sum -= arr[i - w];
      if (i >= w - 1) out[i] = sum / w;
    }
    return out;
  };
  const s1 = smaLocal(median, window1);
  const s2 = smaLocal(median, window2);
  return median.map((_, i) => s1[i] - s2[i]);
}
