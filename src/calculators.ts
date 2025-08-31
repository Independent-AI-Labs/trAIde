
export class EmaCalc {
  private readonly alpha: number;
  private readonly minPeriods: number;
  private s: number | undefined;
  private count = 0;
  constructor(window: number, minPeriods?: number) {
    this.alpha = 2 / (window + 1);
    this.minPeriods = minPeriods ?? window;
  }
  update(v: number): number {
    this.count++;
    this.s = this.s === undefined ? v : this.alpha * v + (1 - this.alpha) * this.s;
    return this.count >= this.minPeriods ? (this.s as number) : NaN;
  }
}

export class EmaFromCalc {
  private readonly alpha: number;
  private readonly minPeriods: number;
  private s: number | undefined;
  private started = false;
  private count = 0; // counts since start
  constructor(window: number) {
    this.alpha = 2 / (window + 1);
    this.minPeriods = window;
  }
  updateMaybeStart(v: number, canStart: boolean): number {
    if (!this.started) {
      if (!canStart) return NaN;
      this.started = true;
      this.s = v;
      this.count = 1;
      return this.count >= this.minPeriods ? (this.s as number) : NaN;
    }
    this.count++;
    this.s = this.alpha * v + (1 - this.alpha) * (this.s as number);
    return this.count >= this.minPeriods ? (this.s as number) : NaN;
  }
}

export class RsiCalc {
  private readonly emaGain: EmaCalc;
  private readonly emaLoss: EmaCalc;
  private prev: number | undefined;
  constructor(window = 14) {
    // rsi uses ewmAlpha with alpha=1/window, minPeriods=window
    const alpha = 1 / window;
    this.emaGain = new EmaCalc(2 / alpha - 1, window); // convert alpha to window equiv
    this.emaLoss = new EmaCalc(2 / alpha - 1, window);
  }
  update(price: number): number {
    let gain = 0, loss = 0;
    if (this.prev !== undefined) {
      const diff = price - this.prev;
      gain = diff > 0 ? diff : 0;
      loss = diff < 0 ? -diff : 0;
    }
    this.prev = price;
    const ag = this.emaGain.update(gain);
    const al = this.emaLoss.update(loss);
    if (!Number.isNaN(ag) && !Number.isNaN(al)) {
      const rs = al === 0 ? Infinity : ag / al;
      return 100 - 100 / (1 + rs);
    }
    return NaN;
  }
}

export class MacdCalc {
  private readonly fast: EmaCalc;
  private readonly slow: EmaCalc;
  private readonly sig: EmaFromCalc;
  private lastLine: number | undefined;
  constructor(windowSlow = 26, windowFast = 12, windowSign = 9) {
    this.fast = new EmaCalc(windowFast, windowFast);
    this.slow = new EmaCalc(windowSlow, windowSlow);
    this.sig = new EmaFromCalc(windowSign);
  }
  update(price: number): { line: number; signal: number; diff: number } {
    const ef = this.fast.update(price);
    const es = this.slow.update(price);
    const line = !Number.isNaN(ef) && !Number.isNaN(es) ? ef - es : NaN;
    this.lastLine = Number.isNaN(line) ? this.lastLine : line;
    const canStart = !Number.isNaN(line);
    const signal = this.sig.updateMaybeStart(canStart ? (line as number) : 0, canStart);
    const diff = !Number.isNaN(line) && !Number.isNaN(signal) ? (line as number) - signal : NaN;
    return { line, signal, diff };
  }
}

export class AtrCalc {
  private readonly w: number;
  private prevClose: number | undefined;
  private count = 0;
  private sumTR = 0;
  private atr: number | undefined;
  constructor(window = 14) { this.w = window; }
  update(high: number, low: number, close: number): number {
    const tr1 = high - low;
    const tr2 = this.prevClose === undefined ? NaN : Math.abs(high - this.prevClose);
    const tr3 = this.prevClose === undefined ? NaN : Math.abs(low - this.prevClose);
    const tr = this.prevClose === undefined ? tr1 : Math.max(tr1, tr2, tr3);
    this.prevClose = close;
    this.count++;
    if (this.count <= this.w) {
      this.sumTR += tr;
      if (this.count === this.w) {
        this.atr = this.sumTR / this.w;
        return this.atr;
      }
      return NaN;
    }
    this.atr = ((this.atr as number) * (this.w - 1) + tr) / this.w;
    return this.atr;
  }
}

export class StochasticCalc {
  private readonly w: number;
  private readonly smooth: number;
  private hiDQ: number[] = [];
  private loDQ: number[] = [];
  private kBuf: number[] = [];
  private kSum = 0;
  private idx = 0;
  private highs: number[] = [];
  private lows: number[] = [];
  constructor(window = 14, smoothWindow = 3) { this.w = window; this.smooth = smoothWindow; }
  update(high: number, low: number, close: number): { k: number; d: number } {
    this.highs.push(high); this.lows.push(low);
    const i = this.idx++;
    // maintain hi deque (indices of decreasing values)
    while (this.hiDQ.length && this.highs[this.hiDQ[this.hiDQ.length - 1]] <= high) this.hiDQ.pop();
    this.hiDQ.push(i);
    while (this.hiDQ[0] <= i - this.w) this.hiDQ.shift();
    // maintain lo deque (indices of increasing values)
    while (this.loDQ.length && this.lows[this.loDQ[this.loDQ.length - 1]] >= low) this.loDQ.pop();
    this.loDQ.push(i);
    while (this.loDQ[0] <= i - this.w) this.loDQ.shift();
    let k = NaN, d = NaN;
    if (i >= this.w - 1) {
      const hh = this.highs[this.hiDQ[0]];
      const ll = this.lows[this.loDQ[0]];
      const denom = hh - ll;
      k = denom === 0 ? 0 : ((close - ll) / denom) * 100;
      // smooth K with SMA
      this.kBuf.push(k); this.kSum += k;
      if (this.kBuf.length > this.smooth) this.kSum -= this.kBuf.shift() as number;
      if (this.kBuf.length === this.smooth) d = this.kSum / this.smooth;
    }
    return { k, d };
  }
}

export class VwapCalc {
  private readonly w: number;
  private pvSum = 0;
  private vSum = 0;
  private tpBuf: number[] = [];
  private vBuf: number[] = [];
  constructor(window = 14) { this.w = window; }
  update(high: number, low: number, close: number, volume: number): number {
    const tp = (high + low + close) / 3;
    const pv = tp * volume;
    this.tpBuf.push(pv); this.vBuf.push(volume);
    this.pvSum += pv; this.vSum += volume;
    if (this.tpBuf.length > this.w) { this.pvSum -= this.tpBuf.shift() as number; this.vSum -= this.vBuf.shift() as number; }
    if (this.tpBuf.length === this.w) return this.vSum === 0 ? NaN : this.pvSum / this.vSum;
    return NaN;
  }
}

// Helper to ensure batch and streaming EMA produce equivalent sequences
export function emaSeries(values: number[], window: number): number[] {
  const calc = new EmaCalc(window);
  return values.map(v => calc.update(v));
}


export class PpoCalc {
  private readonly fast: EmaCalc;
  private readonly slow: EmaCalc;
  private readonly sig: EmaFromCalc;
  constructor(windowFast = 12, windowSlow = 26, windowSign = 9) {
    this.fast = new EmaCalc(windowFast, 1);
    this.slow = new EmaCalc(windowSlow, 1);
    this.sig = new EmaFromCalc(windowSign);
  }
  update(price: number): { ppo: number; signal: number; hist: number } {
    const ef = this.fast.update(price);
    const es = this.slow.update(price);
    const line = !Number.isNaN(ef) && !Number.isNaN(es) && es !== 0 ? ((ef - es) / es) * 100 : NaN;
    const canStart = !Number.isNaN(line);
    const signal = this.sig.updateMaybeStart(canStart ? (line as number) : 0, canStart);
    const hist = !Number.isNaN(line) && !Number.isNaN(signal) ? (line as number) - signal : NaN;
    return { ppo: line, signal, hist };
  }
}

export class PvoCalc {
  private readonly fast: EmaCalc;
  private readonly slow: EmaCalc;
  private readonly sig: EmaFromCalc;
  constructor(windowFast = 12, windowSlow = 26, windowSign = 9) {
    this.fast = new EmaCalc(windowFast, 1);
    this.slow = new EmaCalc(windowSlow, 1);
    this.sig = new EmaFromCalc(windowSign);
  }
  update(volume: number): { pvo: number; signal: number; hist: number } {
    const ef = this.fast.update(volume);
    const es = this.slow.update(volume);
    const line = !Number.isNaN(ef) && !Number.isNaN(es) && es !== 0 ? ((ef - es) / es) * 100 : NaN;
    const canStart = !Number.isNaN(line);
    const signal = this.sig.updateMaybeStart(canStart ? (line as number) : 0, canStart);
    const hist = !Number.isNaN(line) && !Number.isNaN(signal) ? (line as number) - signal : NaN;
    return { pvo: line, signal, hist };
  }
}
