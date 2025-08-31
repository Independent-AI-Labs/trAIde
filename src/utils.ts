export type Series = (number | null | undefined)[];

export function toNumberArray(a: Series): number[] {
  return a.map(v => (v == null ? NaN : Number(v)));
}

export function asArray(a: number[] | Float64Array): number[] {
  return Array.isArray(a) ? a : Array.from(a);
}

export function nans(n: number): number[] {
  return Array.from({ length: n }, () => NaN);
}

export function sma(values: number[], window: number): number[] {
  const out = new Array(values.length).fill(NaN);
  if (window <= 0) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    sum += v;
    if (i >= window) sum -= values[i - window];
    if (i >= window - 1) out[i] = sum / window;
  }
  return out;
}

export function rollingStd(values: number[], window: number): number[] {
  const out = new Array(values.length).fill(NaN);
  if (window <= 1) return out;
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    sum += v;
    sumSq += v * v;
    if (i >= window) {
      const old = values[i - window];
      sum -= old;
      sumSq -= old * old;
    }
    if (i >= window - 1) {
      const mean = sum / window;
      const variance = Math.max(0, sumSq / window - mean * mean);
      out[i] = Math.sqrt(variance);
    }
  }
  return out;
}

export function ema(values: number[], window: number): number[] {
  return ewmAlpha(values, 2 / (window + 1), window);
}

export function wilderRma(values: number[], window: number): number[] {
  // Wilder's smoothing (equivalent to RMA):
  // seed = SMA(window); then rma[i] = (rma[i-1] * (window - 1) + value[i]) / window
  const out = new Array(values.length).fill(NaN);
  if (window <= 0) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (i < window) sum += v;
    if (i === window - 1) out[i] = sum / window;
    else if (i >= window) out[i] = (out[i - 1] * (window - 1) + v) / window;
  }
  return out;
}

export function emaFrom(values: number[], window: number, startIndex: number): number[] {
  // EMA with adjust=false starting at startIndex; minPeriods=window
  const alpha = 2 / (window + 1);
  const out = new Array(values.length).fill(NaN);
  if (window <= 0) return out;
  // initialize state with first value at startIndex
  let s: number | undefined;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (i < startIndex) continue;
    if (s === undefined) {
      s = v;
    } else {
      s = alpha * v + (1 - alpha) * s;
    }
    if (i - startIndex >= window - 1) out[i] = s;
  }
  return out;
}

export function ewmAlpha(values: number[], alpha: number, minPeriods: number): number[] {
  // Pandas ewm(..., adjust=false).mean() with given alpha and minPeriods
  const out = new Array(values.length).fill(NaN);
  if (!(alpha > 0 && alpha <= 1)) return out;
  let s: number | undefined;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (s === undefined) s = v;
    else s = alpha * v + (1 - alpha) * s;
    if (i >= minPeriods - 1) out[i] = s;
  }
  return out;
}

export function trueRange(high: number[], low: number[], close: number[]): number[] {
  const n = Math.min(high.length, low.length, close.length);
  const out = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    const h = high[i];
    const l = low[i];
    const cPrev = i > 0 ? close[i - 1] : NaN;
    const tr1 = h - l;
    const tr2 = i === 0 ? NaN : Math.abs(h - cPrev);
    const tr3 = i === 0 ? NaN : Math.abs(l - cPrev);
    out[i] = i === 0 ? tr1 : Math.max(tr1, tr2, tr3);
  }
  return out;
}

export function highest(values: number[], window: number): number[] {
  const out = new Array(values.length).fill(NaN);
  const dq: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    while (dq.length && values[dq[dq.length - 1]] <= v) dq.pop();
    dq.push(i);
    while (dq[0] <= i - window) dq.shift();
    if (i >= window - 1) out[i] = values[dq[0]];
  }
  return out;
}

export function lowest(values: number[], window: number): number[] {
  const out = new Array(values.length).fill(NaN);
  const dq: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    while (dq.length && values[dq[dq.length - 1]] >= v) dq.pop();
    dq.push(i);
    while (dq[0] <= i - window) dq.shift();
    if (i >= window - 1) out[i] = values[dq[0]];
  }
  return out;
}

export function wma(values: number[], window: number): number[] {
  const out = new Array(values.length).fill(NaN);
  if (window <= 0) return out;
  const denom = (window * (window + 1)) / 2;
  let acc = 0;
  for (let i = 0; i < values.length; i++) {
    if (i >= window - 1) {
      acc = 0;
      for (let j = 0; j < window; j++) acc += values[i - j] * (window - j);
      out[i] = acc / denom;
    }
  }
  return out;
}

export function tp(high: number[], low: number[], close: number[]): number[] {
  const n = Math.min(high.length, low.length, close.length);
  const out = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) out[i] = (high[i] + low[i] + close[i]) / 3;
  return out;
}

export function fillna(arr: number[], value = 0): number[] {
  return arr.map(x => (Number.isNaN(x) ? value : x));
}
