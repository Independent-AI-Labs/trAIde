/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComputeIndicatorsRequest, StreamKlinesRequest } from './types.js';

export function validateComputeRequest(input: unknown): asserts input is ComputeIndicatorsRequest {
  const i = input as any;
  if (!i || typeof i.symbol !== 'string' || typeof i.interval !== 'string') {
    throw new Error('invalid_compute_request');
  }
  if (i.windows && typeof i.windows !== 'object') throw new Error('invalid_windows');
  if (i.windows?.rsi && !isPositiveInt(i.windows.rsi.period ?? 14)) throw new Error('invalid_rsi_period');
  if (i.windows?.atr && !isPositiveInt(i.windows.atr.period ?? 14)) throw new Error('invalid_atr_period');
  if (i.windows?.macd) {
    const { fast = 12, slow = 26, signal = 9 } = i.windows.macd;
    if (!isPositiveInt(fast) || !isPositiveInt(slow) || !isPositiveInt(signal)) throw new Error('invalid_macd');
  }
  if (i.windows?.ppo) {
    const { fast = 12, slow = 26, signal = 9 } = i.windows.ppo;
    if (!isPositiveInt(fast) || !isPositiveInt(slow) || !isPositiveInt(signal)) throw new Error('invalid_ppo');
  }
  if (i.windows?.pvo) {
    const { fast = 12, slow = 26, signal = 9 } = i.windows.pvo;
    if (!isPositiveInt(fast) || !isPositiveInt(slow) || !isPositiveInt(signal)) throw new Error('invalid_pvo');
  }
  if (i.windows?.stoch) {
    const { k = 14, d = 3, smooth = 3 } = i.windows.stoch;
    if (!isPositiveInt(k) || !isPositiveInt(d) || !isPositiveInt(smooth)) throw new Error('invalid_stoch');
  }
  if (i.windows?.stochRsi) {
    const { rsi = 14, k = 3, d = 3 } = i.windows.stochRsi;
    if (!isPositiveInt(rsi) || !isPositiveInt(k) || !isPositiveInt(d)) throw new Error('invalid_stochrsi');
  }
}

export function validateStreamRequest(input: unknown): asserts input is StreamKlinesRequest {
  const i = input as any;
  if (!i || typeof i.symbol !== 'string' || typeof i.interval !== 'string') {
    throw new Error('invalid_stream_request');
  }
  if (i.indicators) validateComputeRequest({ symbol: i.symbol, interval: i.interval, windows: i.indicators });
}

export function mapError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return { error: message };
}

function isPositiveInt(x: unknown): boolean {
  return Number.isInteger(x) && (x as number) > 0;
}
