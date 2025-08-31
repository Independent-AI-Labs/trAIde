export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

export type IndicatorWindows = {
  macd?: { fast?: number; slow?: number; signal?: number };
  rsi?: { period?: number };
  atr?: { period?: number };
  stoch?: { k?: number; d?: number; smooth?: number };
  stochRsi?: { rsi?: number; k?: number; d?: number };
  bollinger?: { period?: number; stdev?: number };
  ppo?: { fast?: number; slow?: number; signal?: number };
  pvo?: { fast?: number; slow?: number; signal?: number };
  vwap?: { session?: 'day' | 'continuous' };
};

export type ComputeIndicatorsRequest = {
  symbol: string;
  interval: string;
  start?: number;
  end?: number;
  limit?: number;
  windows?: IndicatorWindows;
  includeCandles?: boolean;
  schemaVersion?: string;
};

export type ComputeIndicatorsResponse = {
  schemaVersion: string;
  symbol: string;
  interval: string;
  candles?: Candle[];
  series: Record<string, Array<number | null>>;
  meta?: { warmup: number; source: string; generatedAt: number };
};

export type StreamKlinesRequest = {
  symbol: string;
  interval: string;
  indicators?: IndicatorWindows;
  closedOnly?: boolean;
  heartbeatMs?: number;
  schemaVersion?: string;
};

export type KlineEvent = {
  type: 'kline' | 'heartbeat' | 'status';
  symbol?: string;
  interval?: string;
  candle?: Candle & { closed: boolean };
  deltas?: Record<string, number | null>;
  generatedAt?: number;
};

export type HealthStatus = { status: 'ok' | 'degraded' | 'error'; uptime: number; version: string; provider: string };

