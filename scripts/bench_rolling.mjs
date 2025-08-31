/* eslint-disable no-undef */
// Micro-benchmark for rolling highest/lowest: naive O(n*w) vs deque O(n)
// Run: node scripts/bench_rolling.mjs

function highestDeque(values, window) {
  const out = new Array(values.length).fill(NaN);
  const dq = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    while (dq.length && values[dq[dq.length - 1]] <= v) dq.pop();
    dq.push(i);
    while (dq[0] <= i - window) dq.shift();
    if (i >= window - 1) out[i] = values[dq[0]];
  }
  return out;
}

function highestNaive(values, window) {
  const out = new Array(values.length).fill(NaN);
  for (let i = window - 1; i < values.length; i++) {
    let hi = -Infinity;
    for (let j = i - window + 1; j <= i; j++) hi = Math.max(hi, values[j]);
    out[i] = hi;
  }
  return out;
}

function run() {
  const n = 200000;
  const w = 50;
  const arr = Float64Array.from({ length: n }, (_, i) => Math.sin(i * 0.001) * 100 + Math.random());
  const t1 = performance.now();
  const a = highestNaive(arr, w);
  const t2 = performance.now();
  const b = highestDeque(arr, w);
  const t3 = performance.now();
  let maxDiff = 0;
  for (let i = 0; i < n; i++) if (Number.isFinite(a[i]) && Number.isFinite(b[i])) maxDiff = Math.max(maxDiff, Math.abs(a[i] - b[i]));
  console.log(JSON.stringify({ n, w, naiveMs: (t2 - t1).toFixed(1), dequeMs: (t3 - t2).toFixed(1), maxDiff }));
}

run();
