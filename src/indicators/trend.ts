import { ema, emaFrom, sma, trueRange, wilderRma, wma } from "../utils";

export function smaIndicator(close: number[], window = 12): number[] {
  return sma(close, window);
}

export function emaIndicator(close: number[], window = 12): number[] {
  return ema(close, window);
}

export function macd(
  close: number[],
  windowSlow = 26,
  windowFast = 12
): number[] {
  const slow = ema(close, windowSlow);
  const fast = ema(close, windowFast);
  return close.map((_, i) => fast[i] - slow[i]);
}

export function macdSignal(
  close: number[],
  windowSlow = 26,
  windowFast = 12,
  windowSign = 9
): number[] {
  const line = macd(close, windowSlow, windowFast);
  const start = line.findIndex((x) => !Number.isNaN(x));
  return emaFrom(line.map((x) => (Number.isFinite(x) ? x : 0)), windowSign, start < 0 ? 0 : start);
}

export function macdDiff(
  close: number[],
  windowSlow = 26,
  windowFast = 12,
  windowSign = 9
): number[] {
  const line = macd(close, windowSlow, windowFast);
  const start = line.findIndex((x) => !Number.isNaN(x));
  const signal = emaFrom(line.map((x) => (Number.isFinite(x) ? x : 0)), windowSign, start < 0 ? 0 : start);
  return line.map((_, i) => line[i] - signal[i]);
}

export function adx(
  high: number[],
  low: number[],
  close: number[],
  window = 14
): number[] {
  const n = Math.min(high.length, low.length, close.length);
  if (window <= 0) return new Array(n).fill(NaN);
  // Replicate ta.trend.ADXIndicator algorithm
  const prevClose = close.map((c, i) => (i > 0 ? close[i - 1] : c));
  const trSeries = new Array(n).fill(0).map((_, i) => {
    const tr1 = high[i] - low[i];
    const tr2 = i === 0 ? 0 : Math.abs(high[i] - prevClose[i]);
    const tr3 = i === 0 ? 0 : Math.abs(low[i] - prevClose[i]);
    return Math.max(tr1, tr2, tr3);
  });
  const trs = new Array(n - (window - 1)).fill(0);
  let sumTr = 0;
  for (let i = 0; i < window; i++) sumTr += trSeries[i];
  trs[0] = sumTr;
  for (let i = 1; i < trs.length - 1; i++) {
    trs[i] = trs[i - 1] - trs[i - 1] / window + trSeries[window + i];
  }
  const diffUp = high.map((h, i) => (i > 0 ? h - high[i - 1] : NaN));
  const diffDown = low.map((l, i) => (i > 0 ? low[i - 1] - l : NaN));
  const pos = diffUp.map((du, i) => {
    const dd = diffDown[i];
    return Math.abs(du > (dd ?? 0) && (du ?? 0) > 0 ? (du as number) : 0);
  });
  const neg = diffDown.map((dd, i) => {
    const du = diffUp[i];
    return Math.abs((dd ?? 0) > (du ?? 0) && (dd ?? 0) > 0 ? (dd as number) : 0);
  });
  const dip = new Array(n - (window - 1)).fill(0);
  let sumPos = 0;
  for (let i = 1; i <= window; i++) sumPos += pos[i] ?? 0; // dropna in pandas removes first NaN
  dip[0] = sumPos;
  for (let i = 1; i < dip.length - 1; i++) dip[i] = dip[i - 1] - dip[i - 1] / window + (pos[window + i] ?? 0);

  const din = new Array(n - (window - 1)).fill(0);
  let sumNeg = 0;
  for (let i = 1; i <= window; i++) sumNeg += neg[i] ?? 0;
  din[0] = sumNeg;
  for (let i = 1; i < din.length - 1; i++) din[i] = din[i - 1] - din[i - 1] / window + (neg[window + i] ?? 0);

  const dipPct = dip.map((v, i) => (trs[i] !== 0 ? (100 * v) / trs[i] : 0));
  const dinPct = din.map((v, i) => (trs[i] !== 0 ? (100 * v) / trs[i] : 0));
  const dx = dipPct.map((v, i) => {
    const sum = v + dinPct[i];
    return sum !== 0 ? (100 * Math.abs(v - dinPct[i])) / sum : 0;
  });
  const adxSeries = new Array(trs.length).fill(0);
  // initial average over first window of dx
  let dxSum = 0;
  for (let i = 0; i < window; i++) dxSum += dx[i];
  adxSeries[window] = dxSum / window;
  for (let i = window + 1; i < adxSeries.length; i++) {
    adxSeries[i] = (adxSeries[i - 1] * (window - 1) + dx[i - 1]) / window;
  }
  // pad initial
  const padded = new Array(window - 1).fill(0).concat(adxSeries);
  return padded.slice(0, n);
}

export function adxPos(
  high: number[],
  low: number[],
  close: number[],
  window = 14
): number[] {
  const n = Math.min(high.length, low.length, close.length);
  const plusDM = new Array(n).fill(NaN);
  const tr = trueRange(high, low, close);
  for (let i = 1; i < n; i++) {
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];
    plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
  }
  const atr = wilderRma(tr, window);
  const smPlusDM = wilderRma(plusDM.map(v => (Number.isNaN(v) ? 0 : v)), window);
  return smPlusDM.map((v, i) => 100 * (v / atr[i]));
}

export function adxNeg(
  high: number[],
  low: number[],
  close: number[],
  window = 14
): number[] {
  const n = Math.min(high.length, low.length, close.length);
  const minusDM = new Array(n).fill(NaN);
  const tr = trueRange(high, low, close);
  for (let i = 1; i < n; i++) {
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];
    minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;
  }
  const atr = wilderRma(tr, window);
  const smMinusDM = wilderRma(minusDM.map(v => (Number.isNaN(v) ? 0 : v)), window);
  return smMinusDM.map((v, i) => 100 * (v / atr[i]));
}

export function cci(
  high: number[],
  low: number[],
  close: number[],
  window = 20
): number[] {
  const n = Math.min(high.length, low.length, close.length);
  const tp = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) tp[i] = (high[i] + low[i] + close[i]) / 3;
  const smaTp = sma(tp, window);
  const out = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (i < window - 1) continue;
    const start = i - window + 1;
    let meanDev = 0;
    for (let j = start; j <= i; j++) meanDev += Math.abs(tp[j] - smaTp[i]);
    meanDev /= window;
    out[i] = (tp[i] - smaTp[i]) / (0.015 * meanDev);
  }
  return out;
}

export function wmaIndicator(close: number[], window = 9): number[] {
  return wma(close, window);
}

export function trix(close: number[], window = 15): number[] {
  const e1 = ema(close, window);
  const e2 = ema(e1.map((v) => (Number.isFinite(v) ? (v as number) : 0)), window);
  const e3 = ema(e2.map((v) => (Number.isFinite(v) ? (v as number) : 0)), window);
  const out = new Array(close.length).fill(NaN);
  for (let i = 1; i < out.length; i++) {
    const prev = e3[i - 1];
    const curr = e3[i];
    out[i] = prev === 0 ? NaN : ((curr - prev) / prev) * 100;
  }
  return out;
}

export function massIndex(
  high: number[],
  low: number[],
  windowFast = 9,
  windowSlow = 25,
): number[] {
  const n = Math.min(high.length, low.length);
  const amp = new Array(n).fill(NaN).map((_, i) => high[i] - low[i]);
  const ema1 = ema(amp, windowFast);
  const ema2 = ema(ema1.map((v) => (Number.isFinite(v) ? (v as number) : 0)), windowFast);
  const ratio = ema1.map((_, i) => ema2[i] === 0 ? NaN : ema1[i] / ema2[i]);
  const out = new Array(n).fill(NaN);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const v = ratio[i];
    sum += v;
    if (i >= windowSlow) sum -= ratio[i - windowSlow];
    if (i >= windowSlow - 1) out[i] = sum;
  }
  return out;
}

export function ichimoku(
  high: number[],
  low: number[],
  window1 = 9,
  window2 = 26,
  window3 = 52,
): { tenkan: number[]; kijun: number[]; spanA: number[]; spanB: number[] } {
  const n = Math.min(high.length, low.length);
  const highestIn = (i: number, w: number) => {
    let v = -Infinity;
    for (let j = i - w + 1; j <= i; j++) v = Math.max(v, high[j]);
    return v;
  };
  const lowestIn = (i: number, w: number) => {
    let v = Infinity;
    for (let j = i - w + 1; j <= i; j++) v = Math.min(v, low[j]);
    return v;
  };
  const tenkan = new Array(n).fill(NaN);
  const kijun = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (i >= window1 - 1) tenkan[i] = (highestIn(i, window1) + lowestIn(i, window1)) / 2;
    if (i >= window2 - 1) kijun[i] = (highestIn(i, window2) + lowestIn(i, window2)) / 2;
  }
  const spanA = new Array(n).fill(NaN);
  const spanB = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (i >= window2 - 1) spanA[i] = (tenkan[i] + kijun[i]) / 2;
    if (i >= window3 - 1) spanB[i] = (highestIn(i, window3) + lowestIn(i, window3)) / 2;
  }
  return { tenkan, kijun, spanA, spanB };
}

export function ichimokuShifted(
  high: number[],
  low: number[],
  window1 = 9,
  window2 = 26,
  window3 = 52,
  displacement = 26,
): { tenkan: number[]; kijun: number[]; spanA: number[]; spanB: number[]; spanA_fwd: number[]; spanB_fwd: number[] } {
  const { tenkan, kijun, spanA, spanB } = ichimoku(high, low, window1, window2, window3);
  const n = Math.min(high.length, low.length);
  const spanA_fwd = new Array(n).fill(NaN);
  const spanB_fwd = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    const j = i + displacement;
    if (j < n) {
      spanA_fwd[j] = spanA[i];
      spanB_fwd[j] = spanB[i];
    }
  }
  return { tenkan, kijun, spanA, spanB, spanA_fwd, spanB_fwd };
}

export function ichimokuDisplay(
  high: number[],
  low: number[],
  close: number[],
  window1 = 9,
  window2 = 26,
  window3 = 52,
  displacement = 26,
): { tenkan: number[]; kijun: number[]; spanA_fwd: number[]; spanB_fwd: number[]; chikou: number[] } {
  const { tenkan, kijun, spanA, spanB, spanA_fwd, spanB_fwd } = ichimokuShifted(high, low, window1, window2, window3, displacement);
  const n = Math.min(high.length, low.length, close.length);
  const chikou = new Array(n).fill(NaN);
  // chikou(t) is close(t) plotted at t - displacement
  for (let i = 0; i < n; i++) {
    const j = i - displacement;
    if (j >= 0) chikou[j] = close[i];
  }
  return { tenkan, kijun, spanA_fwd, spanB_fwd, chikou };
}

export function stc(
  close: number[],
  windowSlow = 50,
  windowFast = 23,
  cycle = 10,
  smooth1 = 3,
  smooth2 = 3,
): number[] {
  const efast = ema(close, windowFast);
  const eslow = ema(close, windowSlow);
  const macd = efast.map((_, i) => efast[i] - eslow[i]);
  const stoch = (arr: number[], w: number): number[] => {
    const n = arr.length;
    const out = new Array(n).fill(NaN);
    for (let i = 0; i < n; i++) {
      if (i >= w - 1) {
        let mn = Infinity, mx = -Infinity;
        for (let j = i - w + 1; j <= i; j++) { const v = arr[j]; mn = Math.min(mn, v); mx = Math.max(mx, v);} 
        out[i] = mx === mn ? 0 : 100 * (arr[i] - mn) / (mx - mn);
      }
    }
    return out;
  };
  const stochK = stoch(macd, cycle);
  const stochD = ema(stochK.map((v) => (Number.isFinite(v) ? (v as number) : 0)), smooth1);
  const stochKd = stoch(stochD, cycle);
  const stcLine = ema(stochKd.map((v) => (Number.isFinite(v) ? (v as number) : 0)), smooth2);
  return stcLine;
}

export function dpo(close: number[], window = 20): number[] {
  const n = close.length;
  const out = new Array(n).fill(NaN);
  const shift = Math.floor(0.5 * window) + 1;
  const ma = sma(close, window);
  for (let i = 0; i < n; i++) {
    const idx = i + shift;
    if (idx < n && !Number.isNaN(ma[i])) out[idx] = close[idx] - ma[i];
  }
  return out;
}

export function kst(
  close: number[],
  roc1 = 10,
  roc2 = 15,
  roc3 = 20,
  roc4 = 30,
  window1 = 10,
  window2 = 10,
  window3 = 10,
  window4 = 15,
  nsig = 9,
): { kst: number[]; signal: number[]; diff: number[] } {
  const n = close.length;
  const roc = (p: number): number[] => {
    const out = new Array(n).fill(NaN);
    for (let i = p; i < n; i++) {
      const prev = close[i - p];
      out[i] = prev === 0 ? NaN : (close[i] - prev) / prev;
    }
    return out;
  };
  const smaArr = (arr: number[], w: number): number[] => sma(arr.map((v) => (Number.isFinite(v) ? (v as number) : 0)), w);
  const r1 = smaArr(roc(roc1), window1);
  const r2 = smaArr(roc(roc2), window2);
  const r3 = smaArr(roc(roc3), window3);
  const r4 = smaArr(roc(roc4), window4);
  const kstLine = new Array(n).fill(NaN).map((_, i) => 100 * (r1[i] + 2 * r2[i] + 3 * r3[i] + 4 * r4[i]));
  const signal = sma(kstLine.map((v) => (Number.isFinite(v) ? (v as number) : 0)), nsig);
  const diff = kstLine.map((_, i) => kstLine[i] - signal[i]);
  return { kst: kstLine, signal, diff };
}

export function aroon(
  high: number[],
  low: number[],
  window = 25,
): { up: number[]; down: number[] } {
  const n = Math.min(high.length, low.length);
  const up = new Array(n).fill(NaN);
  const down = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (i >= window - 1) {
      let hh = -Infinity, ihh = i;
      let ll = Infinity, ill = i;
      for (let j = i - window + 1; j <= i; j++) {
        if (high[j] >= hh) { hh = high[j]; ihh = j; }
        if (low[j] <= ll) { ll = low[j]; ill = j; }
      }
      up[i] = 100 * (window - (i - ihh)) / window;
      down[i] = 100 * (window - (i - ill)) / window;
    }
  }
  return { up, down };
}

export function vortexIndicatorPos(
  high: number[],
  low: number[],
  close: number[],
  window = 14
): number[] {
  const n = Math.min(high.length, low.length, close.length);
  const tr = trueRange(high, low, close);
  const vmPlus = new Array(n).fill(NaN);
  for (let i = 1; i < n; i++) {
    vmPlus[i] = Math.abs(high[i] - low[i - 1]);
  }
  const out = new Array(n).fill(NaN);
  let sumTR = 0;
  let sumVM = 0;
  for (let i = 0; i < n; i++) {
    sumTR += tr[i];
    sumVM += vmPlus[i] ?? 0;
    if (i >= window) {
      sumTR -= tr[i - window];
      sumVM -= vmPlus[i - window] ?? 0;
    }
    if (i >= window - 1) out[i] = sumTR === 0 ? NaN : sumVM / sumTR;
  }
  return out;
}

export function vortexIndicatorNeg(
  high: number[],
  low: number[],
  close: number[],
  window = 14
): number[] {
  const n = Math.min(high.length, low.length, close.length);
  const tr = trueRange(high, low, close);
  const vmMinus = new Array(n).fill(NaN);
  for (let i = 1; i < n; i++) {
    vmMinus[i] = Math.abs(low[i] - high[i - 1]);
  }
  const out = new Array(n).fill(NaN);
  let sumTR = 0;
  let sumVM = 0;
  for (let i = 0; i < n; i++) {
    sumTR += tr[i];
    sumVM += vmMinus[i] ?? 0;
    if (i >= window) {
      sumTR -= tr[i - window];
      sumVM -= vmMinus[i - window] ?? 0;
    }
    if (i >= window - 1) out[i] = sumTR === 0 ? NaN : sumVM / sumTR;
  }
  return out;
}

export function vortexIndicatorDiff(
  high: number[],
  low: number[],
  close: number[],
  window = 14
): number[] {
  const pos = vortexIndicatorPos(high, low, close, window);
  const neg = vortexIndicatorNeg(high, low, close, window);
  return pos.map((_, i) => pos[i] - neg[i]);
}
