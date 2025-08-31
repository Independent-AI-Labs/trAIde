export function dailyReturn(close: number[]): number[] {
  const n = close.length;
  const out = new Array(n).fill(NaN);
  for (let i = 1; i < n; i++) {
    const prev = close[i - 1];
    const cur = close[i];
    out[i] = Number.isFinite(prev) && prev !== 0 ? cur / prev - 1 : NaN;
  }
  return out;
}

export function logReturn(close: number[]): number[] {
  const n = close.length;
  const out = new Array(n).fill(NaN);
  for (let i = 1; i < n; i++) {
    const prev = close[i - 1];
    const cur = close[i];
    out[i] = Number.isFinite(prev) && prev > 0 && Number.isFinite(cur) && cur > 0 ? Math.log(cur / prev) : NaN;
  }
  return out;
}

export function cumulativeReturn(close: number[]): number[] {
  const n = close.length;
  const out = new Array(n).fill(NaN);
  if (n === 0) return out;
  let acc = 1;
  for (let i = 1; i < n; i++) {
    const prev = close[i - 1];
    const cur = close[i];
    if (!(Number.isFinite(prev) && prev !== 0 && Number.isFinite(cur))) {
      out[i] = NaN;
      continue;
    }
    const r = cur / prev - 1;
    acc *= 1 + r;
    out[i] = acc - 1;
  }
  return out;
}

