// MCP stdio server skeleton with tools
import { createServer, Tool } from '@modelcontextprotocol/sdk/server/index.js';
import type { ComputeIndicatorsRequest, ComputeIndicatorsResponse, HealthStatus, StreamKlinesRequest } from './types.js';
import { logger } from './logger.js';
import type { MarketDataProvider } from './provider.js';
import { validateComputeRequest, validateStreamRequest } from './validation.js';
import { buildSeries } from './compute.js';
import * as core from '../../../src/index.js';
import { metrics, withTiming } from './metrics.js';

export function createMcpServer(provider: MarketDataProvider) {
  const tools: Tool[] = [];

  tools.push({
    name: 'health',
    description: 'Health status of the MCP server',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: async (): Promise<HealthStatus> => {
      metrics.inc('mcp_tool_calls_total', { tool: 'health' });
      return { status: 'ok', uptime: process.uptime(), version: '0.1.0', provider: 'binance' };
    },
  });

  tools.push({
    name: 'list_symbols',
    description: 'Return available market symbols',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: async () => {
      metrics.inc('mcp_tool_calls_total', { tool: 'list_symbols' });
      const symbols = await withTiming('mcp_latency_seconds', () => provider.getSymbols());
      return { symbols, updatedAt: Date.now() };
    },
  });

  tools.push({
    name: 'compute_indicators',
    description: 'Compute historical indicators for a symbol and interval',
    inputSchema: { type: 'object', properties: {}, additionalProperties: true },
    handler: async (input: ComputeIndicatorsRequest): Promise<ComputeIndicatorsResponse> => {
      logger.info('compute_indicators request', { input });
      metrics.inc('mcp_tool_calls_total', { tool: 'compute_indicators' });
      validateComputeRequest(input);
      const candles = await withTiming('mcp_latency_seconds', () => provider.getKlines({
        symbol: input.symbol,
        interval: input.interval,
        start: input.start,
        end: input.end,
        limit: input.limit,
      }));
      return buildSeries(input, candles);
    },
  });

  tools.push({
    name: 'stream_klines',
    description: 'Stream klines and optional incremental indicators',
    inputSchema: { type: 'object', properties: {}, additionalProperties: true },
    handler: async (input: StreamKlinesRequest, { emit }) => {
      logger.info('stream_klines subscribe', { input });
      validateStreamRequest(input);
      return async () => {
      const wants = input.indicators ?? {};
      const calc = {
        macd: wants.macd ? new core.calculators.MacdCalc(wants.macd.slow ?? 26, wants.macd.fast ?? 12, wants.macd.signal ?? 9) : null,
        rsi: wants.rsi ? new core.calculators.RsiCalc(wants.rsi.period ?? 14) : null,
        atr: wants.atr ? new core.calculators.AtrCalc(wants.atr.period ?? 14) : null,
        stoch: wants.stoch ? new core.calculators.StochasticCalc(wants.stoch.k ?? 14, wants.stoch.smooth ?? 3) : null,
        vwap: wants.vwap ? new core.calculators.VwapCalc(14) : null,
        ppo: wants.ppo ? new core.calculators.PpoCalc(wants.ppo.fast ?? 12, wants.ppo.slow ?? 26, wants.ppo.signal ?? 9) : null,
        pvo: wants.pvo ? new core.calculators.PvoCalc(wants.pvo.fast ?? 12, wants.pvo.slow ?? 26, wants.pvo.signal ?? 9) : null,
      } as const;
      const unsubscribe = provider.streamKlines(
        { symbol: input.symbol, interval: input.interval, closedOnly: input.closedOnly ?? true },
        (e) => {
          if (e.type !== 'kline' || !e.candle) return emit(e);
          const { h, l, c, v } = { h: e.candle.h, l: e.candle.l, c: e.candle.c, v: e.candle.v };
          const deltas: Record<string, number | null> = {};
          if (calc.macd) {
            const m = calc.macd.update(c);
            deltas.macd = Number.isFinite(m.line) ? m.line : null;
            deltas.signal = Number.isFinite(m.signal) ? m.signal : null;
            deltas.diff = Number.isFinite(m.diff) ? m.diff : null;
          }
          if (calc.rsi) {
            const r = calc.rsi.update(c);
            deltas.rsi = Number.isFinite(r) ? r : null;
          }
          if (calc.atr) {
            const a = calc.atr.update(h, l, c);
            deltas.atr = Number.isFinite(a) ? a : null;
          }
          if (calc.stoch) {
            const s = calc.stoch.update(h, l, c);
            deltas.stoch_k = Number.isFinite(s.k) ? s.k : null;
            deltas.stoch_d = Number.isFinite(s.d) ? s.d : null;
          }
          if (calc.vwap) {
            const w = calc.vwap.update(h, l, c, v);
            deltas.vwap = Number.isFinite(w) ? w : null;
          }
          if (calc.ppo) {
            const r = calc.ppo.update(c);
            deltas.ppo = Number.isFinite(r.ppo) ? r.ppo : null;
            deltas.ppo_signal = Number.isFinite(r.signal) ? r.signal : null;
            deltas.ppo_hist = Number.isFinite(r.hist) ? r.hist : null;
          }
          if (calc.pvo) {
            const r = calc.pvo.update(v);
            deltas.pvo = Number.isFinite(r.pvo) ? r.pvo : null;
            deltas.pvo_signal = Number.isFinite(r.signal) ? r.signal : null;
            deltas.pvo_hist = Number.isFinite(r.hist) ? r.hist : null;
          }
          emit({ ...e, deltas });
        },
      );
      return async () => {
        unsubscribe();
        logger.info('stream_klines unsubscribe', { input });
      };
        unsubscribe();
        logger.info('stream_klines unsubscribe', { input });
      };
    },
  });

  return createServer({ name: 'traide-mcp', version: '0.1.0', tools });
}
