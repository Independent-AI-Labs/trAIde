export function psar(
  high: number[],
  low: number[],
  close: number[],
  step = 0.02,
  maxStep = 0.2,
): { psar: number[]; up: (number | null)[]; down: (number | null)[] } {
  const n = Math.min(high.length, low.length, close.length);
  const sar = new Array(n).fill(NaN);
  const up: (number | null)[] = new Array(n).fill(null);
  const down: (number | null)[] = new Array(n).fill(null);
  if (n < 3) return { psar: sar, up, down };

  let upTrend = true;
  let af = step;
  let upTrendHigh = high[0];
  let downTrendLow = low[0];
  sar[0] = close[0];

  for (let i = 2; i < n; i++) {
    let reversal = false;
    const maxHigh = high[i];
    const minLow = low[i];
    if (upTrend) {
      sar[i] = sar[i - 1] + af * (upTrendHigh - sar[i - 1]);
      if (minLow < sar[i]) {
        reversal = true;
        sar[i] = upTrendHigh;
        downTrendLow = minLow;
        af = step;
      } else {
        if (maxHigh > upTrendHigh) {
          upTrendHigh = maxHigh;
          af = Math.min(af + step, maxStep);
        }
        const low1 = low[i - 1];
        const low2 = low[i - 2];
        if (low2 < sar[i]) sar[i] = low2;
        else if (low1 < sar[i]) sar[i] = low1;
      }
    } else {
      sar[i] = sar[i - 1] - af * (sar[i - 1] - downTrendLow);
      if (maxHigh > sar[i]) {
        reversal = true;
        sar[i] = downTrendLow;
        upTrendHigh = maxHigh;
        af = step;
      } else {
        if (minLow < downTrendLow) {
          downTrendLow = minLow;
          af = Math.min(af + step, maxStep);
        }
        const high1 = high[i - 1];
        const high2 = high[i - 2];
        if (high2 > sar[i]) sar[i] = high2;
        else if (high1 > sar[i]) sar[i] = high1;
      }
    }
    upTrend = upTrend !== reversal;
    if (upTrend) up[i] = sar[i];
    else down[i] = sar[i];
  }
  return { psar: sar, up, down };
}

