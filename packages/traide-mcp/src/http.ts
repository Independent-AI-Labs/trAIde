import http, { IncomingMessage, ServerResponse } from 'http';
import { loadConfig } from './config.js';
import { logger } from './logger.js';
import type { MarketDataProvider } from './provider.js';
import { RateLimiter } from './ratelimit.js';
import { buildSeries } from './compute.js';
import * as core from '../../../src/index.js';
import { metrics, withTiming } from './metrics.js';
import { mapError, validateKlinesQuery, validateComputeRequest } from './validation.js';

export function startHttpServer(provider: MarketDataProvider) {
  const cfg = loadConfig();
  if (!cfg.enableHttp) return null;

  const limiter = new RateLimiter(30, 15); // 30 burst, 15 rps refill
  const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
      const reqId = Math.random().toString(36).slice(2, 10);
      res.setHeader('x-request-id', reqId);

      // CORS handling
      const origin = req.headers.origin as string | undefined;
      if (origin) {
        const allowed = process.env.MCP_CORS_ORIGINS?.split(',').map((s) => s.trim()) ?? [];
        if (allowed.length === 0 || allowed.includes('*') || allowed.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Vary', 'Origin');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        }
      }
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return void res.end();
      }

      const ip = (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress ?? 'unknown';
      if (!limiter.allow(ip)) {
        res.writeHead(429, { 'content-type': 'application/json' });
        metrics.inc('http_requests_total', { route: 'rate_limited', method: req.method ?? 'GET', status: '429' });
        return void res.end(JSON.stringify({ error: 'rate_limited', requestId: reqId }));
      }
      // Optional bearer token auth
      if (cfg.httpToken) {
        const auth = (req.headers['authorization'] ?? '').toString();
        if (!auth.startsWith('Bearer ') || auth.slice(7) !== cfg.httpToken) {
          res.writeHead(401, { 'content-type': 'application/json' });
          metrics.inc('http_requests_total', { route: 'unauthorized', method: req.method ?? 'GET', status: '401' });
          return void res.end(JSON.stringify({ error: 'unauthorized', requestId: reqId }));
        }
      }

      if (req.method === 'GET' && url.pathname === '/health') {
        metrics.inc('http_requests_total', { route: 'health', method: 'GET' });
        res.writeHead(200, { 'content-type': 'application/json' });
        return void res.end(
          JSON.stringify({ status: 'ok', uptime: process.uptime(), version: '0.1.0', provider: 'binance', requestId: reqId }),
        );
      }

      if (req.method === 'GET' && url.pathname === '/symbols') {
        metrics.inc('http_requests_total', { route: 'symbols', method: 'GET' });
        const symbols = await withTiming('http_latency_seconds', () => provider.getSymbols());
        res.writeHead(200, { 'content-type': 'application/json' });
        return void res.end(JSON.stringify({ symbols, updatedAt: Date.now(), requestId: reqId }));
      }

      if (req.method === 'GET' && url.pathname === '/klines') {
        metrics.inc('http_requests_total', { route: 'klines', method: 'GET' });
        const symbol = url.searchParams.get('symbol') ?? '';
        const interval = url.searchParams.get('interval') ?? '';
        const start = url.searchParams.get('start');
        const end = url.searchParams.get('end');
        const limit = url.searchParams.get('limit');
        try {
          validateKlinesQuery({ symbol, interval, start: start ? +start : undefined, end: end ? +end : undefined, limit: limit ? +limit : undefined })
        } catch (e) {
          res.writeHead(400, { 'content-type': 'application/json' });
          metrics.inc('http_requests_total', { route: 'klines', method: 'GET', status: '400' });
          return void res.end(JSON.stringify({ error: mapError(e), requestId: reqId }));
        }
        const candles = await withTiming('http_latency_seconds', () => provider.getKlines({
          symbol,
          interval,
          start: start ? +start : undefined,
          end: end ? +end : undefined,
          limit: limit ? +limit : undefined,
        }));
        res.writeHead(200, { 'content-type': 'application/json' });
        metrics.inc('http_requests_total', { route: 'klines', method: 'GET', status: '200' });
        return void res.end(JSON.stringify({ candles, requestId: reqId }));
      }

      if (req.method === 'POST' && url.pathname === '/indicators') {
        metrics.inc('http_requests_total', { route: 'indicators', method: 'POST' });
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
        try {
          validateComputeRequest(body)
        } catch (e) {
          res.writeHead(400, { 'content-type': 'application/json' });
          metrics.inc('http_requests_total', { route: 'indicators', method: 'POST', status: '400' });
          return void res.end(JSON.stringify({ error: mapError(e), requestId: reqId }));
        }
        const candles = await withTiming('http_latency_seconds', () => provider.getKlines({
          symbol: body.symbol,
          interval: body.interval,
          start: body.start,
          end: body.end,
          limit: body.limit,
        }));
        const out = buildSeries(body, candles);
        res.writeHead(200, { 'content-type': 'application/json' });
        metrics.inc('http_requests_total', { route: 'indicators', method: 'POST', status: '200' });
        return void res.end(JSON.stringify({ ...out, requestId: reqId }));
      }

      if (req.method === 'GET' && url.pathname === '/stream/klines') {
        metrics.inc('http_requests_total', { route: 'stream_klines', method: 'GET' });
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'x-request-id': reqId,
        });
        metrics.inc('http_streams_open_total', { route: 'stream_klines' });
        const symbol = url.searchParams.get('symbol') ?? 'BTCUSDT';
        const interval = url.searchParams.get('interval') ?? '1m';
        const indParam = url.searchParams.get('indicators');
        const wantKeys = indParam ? indParam.split(',').map((k) => k.trim()).filter(Boolean) : [];
        const wants: Record<string, unknown> = Object.fromEntries(wantKeys.map((k) => [k, {}]));
        const calc = {
          macd: wants.macd ? new core.calculators.MacdCalc() : null,
          rsi: wants.rsi ? new core.calculators.RsiCalc() : null,
          atr: wants.atr ? new core.calculators.AtrCalc() : null,
          stoch: wants.stoch ? new core.calculators.StochasticCalc() : null,
          vwap: wants.vwap ? new core.calculators.VwapCalc() : null,
          ppo: wants.ppo ? new core.calculators.PpoCalc() : null,
          pvo: wants.pvo ? new core.calculators.PvoCalc() : null
        } as const;
        const startedAt = Date.now();
        const keepalive = setInterval(() => {
          try { res.write(': keepalive\n\n'); } catch {}
        }, 15000);
        const unsubscribe = provider.streamKlines({ symbol, interval, closedOnly: true }, (e) => {
          if (e.type === 'kline' && e.candle) {
            const { h, l, c, v } = { h: e.candle.h, l: e.candle.l, c: e.candle.c, v: e.candle.v };
            const deltas: Record<string, number | null> = {};
            if (calc.macd) { const m = calc.macd.update(c); deltas.macd = Number.isFinite(m.line) ? m.line : null; deltas.signal = Number.isFinite(m.signal) ? m.signal : null; deltas.diff = Number.isFinite(m.diff) ? m.diff : null; }
            if (calc.ppo) { const r = calc.ppo.update(c); deltas.ppo = Number.isFinite(r.ppo) ? r.ppo : null; deltas.ppo_signal = Number.isFinite(r.signal) ? r.signal : null; deltas.ppo_hist = Number.isFinite(r.hist) ? r.hist : null; }
            if (calc.pvo) { const r = calc.pvo.update(v); deltas.pvo = Number.isFinite(r.pvo) ? r.pvo : null; deltas.pvo_signal = Number.isFinite(r.signal) ? r.signal : null; deltas.pvo_hist = Number.isFinite(r.hist) ? r.hist : null; }
            if (calc.rsi) { const r = calc.rsi.update(c); deltas.rsi = Number.isFinite(r) ? r : null; }
            if (calc.atr) { const a = calc.atr.update(h, l, c); deltas.atr = Number.isFinite(a) ? a : null; }
            if (calc.stoch) { const s = calc.stoch.update(h, l, c); deltas.stoch_k = Number.isFinite(s.k) ? s.k : null; deltas.stoch_d = Number.isFinite(s.d) ? s.d : null; }
            if (calc.vwap) { const w = calc.vwap.update(h, l, c, v); deltas.vwap = Number.isFinite(w) ? w : null; }
            res.write(`data: ${JSON.stringify({ ...e, deltas, requestId: reqId })}\n\n`);
          } else {
            res.write(`data: ${JSON.stringify({ ...e, requestId: reqId })}\n\n`);
          }
        });
        req.on('close', () => {
          clearInterval(keepalive);
          unsubscribe();
          metrics.inc('http_streams_closed_total', { route: 'stream_klines' });
          const seconds = Math.max(0, (Date.now() - startedAt) / 1000);
          metrics.observe('http_stream_duration_seconds', seconds);
        });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/metrics') {
        const body = metrics.renderProm();
        res.writeHead(200, { 'content-type': 'text/plain; version=0.0.4' });
        return void res.end(body);
      }

      res.writeHead(404, { 'content-type': 'application/json' });
      metrics.inc('http_requests_total', { route: 'not_found', method: req.method ?? 'GET', status: '404' });
      res.end(JSON.stringify({ error: 'not_found', requestId: reqId }));
    } catch (err) {
      const reqId = res.getHeader('x-request-id') as string | undefined;
      logger.error('HTTP error', { err: (err instanceof Error ? err.message : String(err)), requestId: reqId })
      res.writeHead(500, { 'content-type': 'application/json' });
      metrics.inc('http_requests_total', { route: 'internal_error', method: 'UNKNOWN', status: '500' });
      res.end(JSON.stringify({ error: { code: 'internal_error', ...mapError(err) }, requestId: reqId }));
    }
  });

  const port = cfg.port;
  server.listen(port, '0.0.0.0', () => logger.info(`HTTP listening on :${port}`));
  return server;
}
