import type { Candle, KlineEvent } from './types.js';

export interface MarketDataProvider {
  getSymbols(): Promise<string[]>;
  getKlines(params: {
    symbol: string;
    interval: string;
    start?: number;
    end?: number;
    limit?: number;
  }): Promise<Candle[]>;
  streamKlines(
    params: { symbol: string; interval: string; closedOnly: boolean },
    onEvent: (e: KlineEvent) => void,
  ): () => void; // returns unsubscribe
}

