# trAIde MCP Server — Product/Technical Specification

This document specifies the trAIde MCP server: scope, architecture, tools, schemas, transports, streaming semantics, security, observability, testing, and rollout. It complements DOCUMENTATION-MCP.md (technical notes) with a formal, implementation-ready spec.

## 1) Goals and Non‑Goals

- Goals:
  - Provide an MCP server exposing trAIde indicators for agents via stdio MCP tools, plus an HTTP/SSE/WS surface for UIs.
  - Support historical batch computation and low‑latency incremental updates for live streams.
  - Define stable, versioned schemas for candles, indicator requests, and results.
  - Be vendor‑pluggable for market data (Binance first), with clear adapter contracts.

- Non‑Goals:
  - Brokerage/trading execution (order routing) in the first milestone.
  - Strategy backtesting framework or storage of long‑term datasets.
  - Multi‑tenant auth beyond basic token/keys; no user accounts in v0.

## 2) High‑Level Architecture

- Node.js service written in TypeScript using `@modelcontextprotocol/sdk`.
- Two transport faces:
  - MCP stdio tool server for AI agents (editor/CLI integrations).
  - HTTP API for web apps; Streaming via SSE or WebSocket for live klines/indicators.
- Core components:
  - Data Providers: REST/WS adapters (Binance first; interface allows others).
  - Indicator Engine: uses existing trAIde library (`src/indicators/*`, streaming calculators in `src/calculators.ts`).
  - Session/State Manager: per‑subscription calculator state; LRU caches for candles/series.
  - Transport Layer: request routing, validation, schema versioning, error mapping.
  - Observability: logging, metrics, health.

Planned monorepo structure (future):

```
packages/
  traide-core/           # current TA library (this repo)
  traide-mcp/            # MCP server (this spec)
apps/
  web/                   # Next.js UI consuming HTTP/SSE/WS
```

## 3) Transports and Endpoints

3.1 MCP (stdio)
- Protocol: Model Context Protocol via `@modelcontextprotocol/sdk` stdio server.
- Tools exposed (v1): `compute_indicators`, `stream_klines`, `list_symbols`, `health`.
- Concurrency: per‑tool bounded with queue; configurable via env.
- Timeouts: default 30s compute, 1h streams; overridable per request.

3.2 HTTP (for UI and external services)
- REST endpoints:
  - `GET /health` → `{ status, uptime, version }`
  - `GET /symbols` → `{ symbols: string[] }`
  - `GET /klines?symbol=BTCUSDT&interval=1h&start=...&end=...&limit=...` → `{ candles: Candle[] }`
  - `POST /indicators` → body `ComputeIndicatorsRequest` → `ComputeIndicatorsResponse`
- Streaming:
  - SSE: `GET /stream/klines?symbol=BTCUSDT&interval=1m&indicators=macd,rsi` emits `KlineEvent`.
  - WebSocket: `GET /ws` then JSON messages with `subscribe`, `unsubscribe`, events.

## 4) Tools (MCP) — Contracts

4.1 Tool: `compute_indicators`
- Purpose: Fetch historical candles and compute requested indicators.
- Input (TypeScript type, JSON‑serializable):
```
type ComputeIndicatorsRequest = {
  symbol: string;            // e.g., "BTCUSDT"
  interval: string;          // e.g., "1m", "1h", "1d"
  start?: number;            // ms epoch (inclusive)
  end?: number;              // ms epoch (exclusive)
  limit?: number;            // optional cap if start/end not given
  windows?: IndicatorWindows;// indicator configs (see below)
  includeCandles?: boolean;  // default true
  schemaVersion?: string;    // default "1.0"
};

type IndicatorWindows = {
  macd?: { fast?: number; slow?: number; signal?: number };
  rsi?: { period?: number };
  atr?: { period?: number };
  stoch?: { k?: number; d?: number; smooth?: number };
  stochRsi?: { rsi?: number; k?: number; d?: number };
  bollinger?: { period?: number; stdev?: number };
  ppo?: { fast?: number; slow?: number; signal?: number };
  pvo?: { fast?: number; slow?: number; signal?: number };
  vwap?: { session?: "day"|"continuous" };
  // extend with other indicators as needed
};
```
- Output:
```
type ComputeIndicatorsResponse = {
  schemaVersion: string;   // "1.0"
  symbol: string;
  interval: string;
  candles?: Candle[];      // included if includeCandles true
  series: Record<string, number[]>; // e.g., { macd:[], signal:[], rsi:[] }
  meta?: { warmup: number; source: string; generatedAt: number };
};
```

4.2 Tool: `stream_klines`
- Purpose: Subscribe to live klines and optional incremental indicator updates.
- Input:
```
type StreamKlinesRequest = {
  symbol: string;
  interval: string;
  indicators?: IndicatorWindows;  // if set, stream computed deltas (supported: macd, rsi, atr, stoch, vwap, ppo, pvo)
  closedOnly?: boolean;            // default true (emit on candle close)
  heartbeatMs?: number;            // optional heartbeat (default 15s)
  schemaVersion?: string;          // default "1.0"
};
```
- Streamed Event (one per message):
```
type KlineEvent = {
  type: "kline" | "heartbeat" | "status";
  symbol?: string;
  interval?: string;
  candle?: Candle & { closed: boolean };
  deltas?: Record<string, number | null>; // latest values for configured indicators
  generatedAt?: number;
};
```

4.3 Tool: `list_symbols`
- Output: `{ symbols: string[]; updatedAt: number }`

4.4 Tool: `health`
- Output: `{ status: "ok"|"degraded"|"error"; uptime: number; version: string; provider: string }`

## 5) Data Models and Conventions

- Candle:
```
type Candle = { t:number; o:number; h:number; l:number; c:number; v:number };
```
- Time: milliseconds since epoch (UTC). Intervals use exchange naming; normalized internally.
- Series alignment: arrays index‑aligned to candles; warm‑up entries set to `NaN`.
- NaN/Infinity: serialized as `null` in JSON; use `Number.isFinite` guards internally.

## 6) Data Providers (Binance v1)

- REST: `GET /api/v3/klines` for historical klines. Backoff and chunked pagination.
- WS: `wss://stream.binance.com/ws/{symbol}@kline_{interval}` for real‑time.
- Adapter interface:
```
interface MarketDataProvider {
  getSymbols(): Promise<string[]>;
  getKlines(params:{symbol:string; interval:string; start?:number; end?:number; limit?:number}): Promise<Candle[]>;
  streamKlines(params:{symbol:string; interval:string; closedOnly:boolean}, onEvent:(e:KlineEvent)=>void): ()=>void;
}
```
- Configuration: env vars `BINANCE_API_KEY?`, `BINANCE_API_SECRET?` not required for public klines; optional for higher limits.

## 7) Streaming Semantics

- Default emits only on candle close (`closedOnly=true`) to avoid churn; partial updates optional when `closedOnly=false`.
- Reconnect policy: exponential backoff with jitter; resume without data loss by replaying last N candles (configurable).
- Ordering: events are strictly ordered per stream; deduplicate by `candle.t`.
- Heartbeats: periodic `heartbeat` events ensure liveness and keep‑alive.
- Backpressure: bounded queue per subscription (default 1,000). On overflow: drop oldest non‑closed partials first; never drop closed candles.
- Session affinity: indicator calculators keyed by `{symbol, interval, indicators-hash}` per subscription.
- Indicator coverage: MACD/RSI/ATR/Stochastic/VWAP/PPO/PVO implemented for streaming deltas. Batch compute supports additional indicators (e.g., Bollinger, StochRSI).

## 8) Performance Characteristics

- Warm‑up: compute minimal history needed per indicator (e.g., max(periods) + lookbacks). Batch fetch to reduce REST calls.
- Caching: LRU cache of recent klines per `{symbol, interval}` (e.g., last 5,000 candles).
- Compute: use streaming calculators from `src/calculators.ts` where possible; fall back to batch from `src/indicators/*`.
- Concurrency: limit simultaneous provider calls; coalesce duplicate requests.

## 9) Security and Config

- No PII stored. No secrets in logs. Redact query params in errors.
- HTTP optional bearer token: `MCP_HTTP_TOKEN` enables `Authorization: Bearer <token>` checks.
- CORS: allowlist via `MCP_CORS_ORIGINS` (comma‑separated). `*` permits any origin.
- Rate limiting: token‑bucket per IP for HTTP; per‑client window for WS/SSE.
- Rate limiting: token‑bucket per IP for HTTP; per‑client window for WS/SSE.
- Env config (examples):
```
PORT=8080
MCP_ENABLE_HTTP=true
MCP_ENABLE_WS=true
MCP_ENABLE_SSE=true
MCP_HTTP_TOKEN=changeme
PROVIDER=binance
BINANCE_WS_URL=wss://stream.binance.com/ws
BINANCE_REST_URL=https://api.binance.com
```

## 10) Observability

- Health: `GET /health` and MCP `health` tool.
- Logging: structured JSON logs with levels; request IDs; redact secrets.
- Metrics: counters for requests, streams, errors; gauges for queue depth; histograms for latency.

## 11) Testing Strategy

- Unit: provider adapters (mocked HTTP/WS), calculators, validators.
- Contract: golden inputs → outputs for indicator parity (leveraging existing tests).
- Integration: against Binance test/mocked servers; stream reconnects; backpressure behavior.
- Load: synthetic kline feeds to validate throughput and memory.

## 12) Versioning and Compatibility

- SemVer for package. `schemaVersion` field in I/O; start at "1.0".
- Backwards‑compatible field additions only in minor versions. Breaking changes bump major.
- Tool names stable; new tools added with new names.

## 13) Deployment

- Node service: Docker image with `node:18-alpine` or later. Runtime `node >= 18`.
- Suggested run: Docker or PM2. Example compose:
```
services:
  traide-mcp:
    image: ghcr.io/independent-ai-labs/traide-mcp:0.1.0
    env_file: .env
    ports: ["8080:8080"]
```

## 14) Implementation Plan (Milestones)

M0: Bootstrap
- Scaffold `packages/traide-mcp` with SDK, config, logging, health.

M1: Historical compute
- Implement Binance REST adapter; `compute_indicators` with core set (MACD, RSI, ATR, BBANDS, StochRSI, PPO/PVO, VWAP). Parity tests.

M2: Streaming
- WS adapter; streaming calculators; SSE/WS endpoints; `stream_klines` tool.

M3: Hardening
- Caching, rate limiting, reconnection tests, metrics, docs.

M4: UI integration
- Connect Next.js app to HTTP/SSE; publish guides.

## 15) Risks and Mitigations

- Exchange limits/instability: retry/backoff, caching, optional mirroring.
- Drift vs Python ta: maintain parity tests; document defaults and warm‑ups.
- Stream overload: bounded queues, drop policy, per‑client limits.
- Schema creep: versioned schemas, review gates.

## 16) Appendix — Example Payloads

Compute (request):
```
{
  "symbol":"BTCUSDT","interval":"1h","limit":500,
  "windows":{"macd":{"fast":12,"slow":26,"signal":9},"rsi":{"period":14}},
  "includeCandles":true
}
```

Compute (response excerpt):
```
{
  "schemaVersion":"1.0","symbol":"BTCUSDT","interval":"1h",
  "candles":[{"t":1725015600000,"o":63100,"h":63300,"l":62900,"c":63250,"v":123.4}],
  "series":{"macd":[null,null,...],"signal":[null,...],"rsi":[null,...]},
  "meta":{"warmup":33,"source":"binance","generatedAt":1725020000000}
}
```

Stream (event):
```
{"type":"kline","symbol":"BTCUSDT","interval":"1m","candle":{"t":1725020100000,"o":63200,"h":63220,"l":63180,"c":63210,"v":12.3,"closed":true},"deltas":{"macd":-12.34,"signal":-10.87,"rsi":48.2}}
```

