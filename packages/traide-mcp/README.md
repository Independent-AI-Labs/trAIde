# @traide/mcp

trAIde MCP server exposing indicators and market data to AI agents (MCP stdio) and UIs (HTTP + SSE).

Status: functional. Implements health, symbols, klines history, indicators compute, live SSE with incremental deltas, IP rate limiting, metrics, bearer token auth (optional), and CORS controls.

## Scripts
- `build`: compile TypeScript to `dist/`
- `start`: run compiled server (`node dist/index.js`)
- `dev`: dev stdio server (`src/index.ts`)
- `dev:http`: dev HTTP server (`src/dev-http.ts`)
- `serve:mini`: minimal HTTP/SSE server for demos (`dev-server.js`)

## Config (env)
- `PORT` (default `8080`)
- `MCP_ENABLE_HTTP` (`true`|`false`, default `true`)
- `MCP_ENABLE_SSE` (`true`|`false`, default `true`)
- `MCP_ENABLE_WS` (`true`|`false`, default `false`)
- `MCP_HTTP_TOKEN` (optional bearer token)
- `MCP_CORS_ORIGINS` (CSV list or `*`)
- `BINANCE_REST_URL`, `BINANCE_WS_URL` (provider endpoints)
- Backoff/heartbeat: `MCP_WS_REPLAY_CANDLES`, `MCP_BACKOFF_BASE_MS`, `MCP_BACKOFF_MAX_MS`, `MCP_HEARTBEAT_MS`

## HTTP API (mini or full)
- `GET /health`: status, uptime, version.
- `GET /symbols`: list of symbols (from provider).
- `GET /klines`: history for `symbol`, `interval`, optional `start|end|limit`.
- `POST /indicators`: `ComputeIndicatorsRequest` → `ComputeIndicatorsResponse`.
- `GET /stream/klines`: SSE stream of `KlineEvent` with optional `indicators` deltas.
- `GET /metrics`: Prometheus metrics.

See `src/types.ts` for data contracts.

## Provider
Binance REST/WS with exponential backoff, heartbeat, and “replay recent” on reconnect to reduce gaps.

## Dev Notes
The UI proxies through Next.js at `/api/mcp/*` and can override the MCP base URL via `mcp` cookie or `NEXT_PUBLIC_MCP_BASE_URL`.

