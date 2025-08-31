import type { Candle, ComputeIndicatorsRequest, ComputeIndicatorsResponse } from './types.js';
import * as core from '../../../src/index.js';

function toNulls(a: number[]): Array<number | null> {
  return a.map((v) => (Number.isFinite(v) ? (v as number) : null));
}

export function buildSeries(req: ComputeIndicatorsRequest, candles: Candle[]): ComputeIndicatorsResponse {
  const close = candles.map((c) => c.c);
  const high = candles.map((c) => c.h);
  const low = candles.map((c) => c.l);
  const volume = candles.map((c) => c.v);
  const windows = req.windows ?? {};
  const series: Record<string, Array<number | null>> = {};

  if (windows.macd) {
    const slow = windows.macd.slow ?? 26;
    const fast = windows.macd.fast ?? 12;
    const sign = windows.macd.signal ?? 9;
    series.macd = toNulls(core.trend.macd(close, slow, fast));
    series.signal = toNulls(core.trend.macdSignal(close, slow, fast, sign));
    series.diff = toNulls(core.trend.macdDiff(close, slow, fast, sign));
  }

  if (windows.rsi) {
    const p = windows.rsi.period ?? 14;
    series.rsi = toNulls(core.momentum.rsi(close, p));
  }

  if (windows.atr) {
    const p = windows.atr.period ?? 14;
    series.atr = toNulls(core.volatility.atr(high, low, close, p));
  }

  if (windows.bollinger) {
    const p = windows.bollinger.period ?? 20;
    const sd = windows.bollinger.stdev ?? 2;
    series.bb_mavg = toNulls(core.volatility.bollingerMavg(close, p));
    series.bb_hband = toNulls(core.volatility.bollingerHband(close, p, sd));
    series.bb_lband = toNulls(core.volatility.bollingerLband(close, p, sd));
  }

  if (windows.ppo) {
    const fast = windows.ppo.fast ?? 12;
    const slow = windows.ppo.slow ?? 26;
    const sign = windows.ppo.signal ?? 9;
    series.ppo = toNulls(core.momentum.ppo(close, fast, slow));
    series.ppo_signal = toNulls(core.momentum.ppoSignal(close, fast, slow, sign));
    series.ppo_hist = toNulls(core.momentum.ppoHist(close, fast, slow, sign));
  }

  if (windows.pvo) {
    const fast = windows.pvo.fast ?? 12;
    const slow = windows.pvo.slow ?? 26;
    const sign = windows.pvo.signal ?? 9;
    series.pvo = toNulls(core.momentum.pvo(volume, fast, slow));
    series.pvo_signal = toNulls(core.momentum.pvoSignal(volume, fast, slow, sign));
    series.pvo_hist = toNulls(core.momentum.pvoHist(volume, fast, slow, sign));
  }

  if (windows.vwap) {
    series.vwap = toNulls(core.volume.vwap(high, low, close, volume, 14));
  }

  if (windows.stoch) {
    const k = windows.stoch.k ?? 14;
    const sm = windows.stoch.smooth ?? 3;
    const s = core.momentum.stochastic(high, low, close, k, sm);
    series.stoch_k = toNulls(s.k);
    // Using d window as additional smoothing of %K already done via sm param
    series.stoch_d = toNulls(s.d);
  }

  if (windows.stochRsi) {
    const r = windows.stochRsi.rsi ?? 14;
    const k = windows.stochRsi.k ?? 3;
    const d = windows.stochRsi.d ?? 3;
    series.stochrsi = toNulls(core.momentum.stochRsi(close, r));
    series.stochrsi_k = toNulls(core.momentum.stochRsiK(close, r, k));
    series.stochrsi_d = toNulls(core.momentum.stochRsiD(close, r, k, d));
  }

  // Rough warmup estimation: max relevant window among requested
  const warmup = Math.max(
    windows.rsi?.period ?? 0,
    windows.atr?.period ?? 0,
    windows.bollinger?.period ?? 0,
    windows.ppo?.slow ?? 0,
    windows.pvo?.slow ?? 0,
    windows.stoch?.k ?? 0,
    windows.stochRsi?.rsi ?? 0,
  );

  return {
    schemaVersion: '1.0',
    symbol: req.symbol,
    interval: req.interval,
    candles: req.includeCandles === false ? undefined : candles,
    series,
    meta: { warmup, source: 'binance', generatedAt: Date.now() },
  };
}

