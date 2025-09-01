/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Candle, KlineEvent } from '../types.js';
import type { MarketDataProvider } from '../provider.js';
import { logger } from '../logger.js';
import { Backoff, intervalToMs } from '../utils.js';

export class BinanceProvider implements MarketDataProvider {
  constructor(
    private restUrl: string,
    private wsUrl: string,
    private opts: { replayCandles?: number; backoffBaseMs?: number; backoffMaxMs?: number; heartbeatMs?: number } = {},
  ) {}

  async getSymbols(): Promise<string[]> {
    try {
      const url = `${this.restUrl}/api/v3/exchangeInfo`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`exchangeInfo ${res.status}`);
      const json: any = await res.json();
      const syms = (json?.symbols ?? [])
        .filter((s: any) => s?.status === 'TRADING')
        .map((s: any) => s?.symbol)
        .filter((s: any) => typeof s === 'string');
      return syms;
    } catch (e) {
      logger.warn('getSymbols failed, using fallback', { err: (e as Error).message });
      return ['BTCUSDT', 'ETHUSDT'];
    }
  }

  async getKlines(params: {
    symbol: string;
    interval: string;
    start?: number | undefined;
    end?: number | undefined;
    limit?: number | undefined;
  }): Promise<Candle[]> {
    const { symbol, interval, start, end, limit } = params;
    const max = Math.min(limit ?? 500, 1000);
    const candles: Candle[] = [];
    let startTime = start;
    // Simple one-shot or forward pagination if start/end provided
    for (;;) {
      const u = new URL(`${this.restUrl}/api/v3/klines`);
      u.searchParams.set('symbol', symbol);
      u.searchParams.set('interval', interval);
      if (startTime != null) u.searchParams.set('startTime', String(startTime));
      if (end != null) u.searchParams.set('endTime', String(end));
      u.searchParams.set('limit', String(max));
      const res = await fetch(u, { method: 'GET' });
      if (!res.ok) throw new Error(`klines ${res.status}`);
      const rows: any[] = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) break;
      for (const r of rows) {
        const [openTime, open, high, low, close, volume] = r;
        candles.push({ t: +openTime, o: +open, h: +high, l: +low, c: +close, v: +volume });
      }
      if (limit != null || start == null || end == null || rows.length < max) break;
      // advance startTime to next candle
      startTime = (rows[rows.length - 1][0] as number) + 1;
      // safety cap
      if (candles.length >= (limit ?? 5000)) break;
    }
    return candles;
  }

  streamKlines(
    params: { symbol: string; interval: string; closedOnly: boolean },
    onEvent: (e: KlineEvent) => void,
  ): () => void {
    const { symbol, interval, closedOnly } = params;
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    const intervalMs = intervalToMs(interval);
    let active = true;
    let lastClosedT: number | null = null;
    const backoff = new Backoff(this.opts.backoffBaseMs ?? 500, this.opts.backoffMaxMs ?? 30000);

    const heartbeat = setInterval(
      () => active && onEvent({ type: 'heartbeat', generatedAt: Date.now() }),
      this.opts.heartbeatMs ?? 15000,
    );
    let current: any = null;

    const connect = () => {
      if (!active) return;
      const url = `${this.wsUrl}/${stream}`;
      (async () => {
        // dynamic import via function to avoid TS resolution of 'ws' types
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const mod: any = await (new Function('m', 'return import(m)'))('ws');
        const WS = mod?.default ?? mod?.WebSocket ?? mod;
        const ws = new WS(url);
        current = ws;
      ws.on('open', () => {
        backoff.reset();
        onEvent({ type: 'status', generatedAt: Date.now(), symbol, interval });
        logger.info('Binance WS open', { stream });
      });
      ws.on('message', (data: any) => {
        try {
          const msg = JSON.parse(data.toString());
          const k = msg?.k;
          if (!k) return;
          const candle = { t: +k.t, o: +k.o, h: +k.h, l: +k.l, c: +k.c, v: +k.v } as Candle;
          const closed = !!k.x;
          if (closed) lastClosedT = candle.t;
          if (closedOnly && !closed) return;
          onEvent({ type: 'kline', symbol, interval, candle: { ...candle, closed }, generatedAt: Date.now() });
        } catch (e) {
          logger.warn('WS message parse error', { err: (e as Error).message });
        }
      });
      const scheduleReconnect = async () => {
        if (!active) return;
        const delay = backoff.next();
        logger.warn('WS reconnect scheduled', { delay, stream });
        setTimeout(async () => {
          if (!active) return;
          try {
            // Replay recent closed candles to minimize gaps
            const replay = this.opts.replayCandles ?? 5;
            const since = (lastClosedT ?? Date.now() - 10 * intervalMs) - replay * intervalMs;
            const recent = await this.getKlines({ symbol, interval, start: since, end: undefined, limit: replay + 5 });
            for (const c of recent) {
              if (lastClosedT && c.t <= lastClosedT) continue;
              onEvent({ type: 'kline', symbol, interval, candle: { ...c, closed: true }, generatedAt: Date.now() });
              lastClosedT = c.t;
            }
          } catch (e) {
            logger.warn('replay failed', { err: (e as Error).message });
          }
          connect();
        }, delay);
      };
      ws.on('error', () => scheduleReconnect());
      ws.on('close', () => scheduleReconnect());
      })();
      return;
    };

    connect();

    return () => {
      active = false;
      clearInterval(heartbeat);
      if (current && typeof current.close === "function") {
        try { current.close(); } catch { /* ignore */ }
      }
      logger.debug('streamKlines unsubscribed', { params });
    };
  }
}
