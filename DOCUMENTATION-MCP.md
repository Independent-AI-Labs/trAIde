# trAIde MCP Server — Technical Notes

The MCP server exposes trAIde’s indicators and market data via two surfaces:
- MCP stdio tools for agents.
- HTTP + SSE for UIs and services.

It implements validation, basic rate‑limiting, structured logs, and Prometheus‑style metrics.

## Environment
- `PORT` (default `8080` for dev, compose maps to `65000`)
- `MCP_ENABLE_HTTP` (`true`/`false`, default `true`)
- `MCP_ENABLE_SSE` (`true`/`false`, default `true`)
- `MCP_ENABLE_WS` (`true`/`false`, default `false`)
- `MCP_HTTP_TOKEN` (optional bearer token for HTTP)
- `MCP_CORS_ORIGINS` (CSV list or `*`)
- `BINANCE_REST_URL` (default `https://api.binance.com`)
- `BINANCE_WS_URL` (default `wss://stream.binance.com/ws`)
- Backoff/heartbeat: `MCP_WS_REPLAY_CANDLES`, `MCP_BACKOFF_BASE_MS`, `MCP_BACKOFF_MAX_MS`, `MCP_HEARTBEAT_MS`

## HTTP API

Base URL depends on deployment (e.g., `http://localhost:65000`). The UI proxies requests via Next at `/api/mcp/*` and can override the base URL using a `mcp` cookie or `NEXT_PUBLIC_MCP_BASE_URL`.

- `GET /health`
  - 200 `{ status:'ok', uptime:number, version:string, provider:'binance' }`

- `GET /symbols`
  - 200 `{ symbols: string[], updatedAt: number }`

- `GET /klines?symbol=BTCUSDT&interval=1m&start=...&end=...&limit=...`
  - 200 `{ candles: Candle[] }`
  - 400 `{ error: { code:'missing_params', message:string } }`

- `POST /indicators`
  - Body: `ComputeIndicatorsRequest`
  - 200 `ComputeIndicatorsResponse`
  - 400 `{ error: { code:'invalid_compute_request' | 'invalid_*', ... } }`

- `GET /stream/klines?symbol=BTCUSDT&interval=1m&indicators=rsi,ppo,macd`
  - SSE stream; each event is a `KlineEvent`.
  - When `indicators` are provided, events include `deltas` (incremental values) with keys: `macd`, `signal`, `diff`, `rsi`, `atr`, `stoch_k`, `stoch_d`, `vwap`, `ppo`, `ppo_signal`, `ppo_hist`, `pvo`, `pvo_signal`, `pvo_hist`.

- `GET /metrics`
  - Prometheus‑style metrics for HTTP and MCP tools.

Auth: if `MCP_HTTP_TOKEN` is set, HTTP requests must include `Authorization: Bearer <token>`.

CORS: allowed origins controlled by `MCP_CORS_ORIGINS` (CSV or `*`).

Rate limiting: IP‑based, 30 burst with ~15 rps refill.

Types: see `packages/traide-mcp/src/types.ts` for `Candle`, `ComputeIndicatorsRequest/Response`, `KlineEvent`.

## MCP Tools (stdio)

- `health`: returns server status and uptime.
- `list_symbols`: fetches available market symbols.
- `compute_indicators`: validates request, fetches klines, returns series per requested windows.
- `stream_klines`: subscribes to live klines and optionally computes incremental indicator deltas.

## Provider

Current provider: Binance.
- REST: `/api/v3/klines` pagination for history.
- WS: `${symbol}@kline_${interval}` for live candles.
- Resilience: exponential backoff, heartbeat events, and “replay recent” on reconnect to reduce gaps.

## Error Handling

Errors are mapped to JSON with stable codes where possible, e.g. `missing_params`, `invalid_compute_request`, and a structured `error` message for internal failures.
