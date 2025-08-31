# @traide/mcp

trAIde MCP server exposing indicators and market data to AI agents (MCP stdio) and UIs (HTTP/SSE/WS).

Status: bootstrap skeleton. Implements health, symbols, SSE heartbeat; provider stubs.

## Scripts
- build: compile TypeScript to `dist/`
- start: run compiled server
- dev: ts-node-dev entry (requires dev deps installed)

## Config (env)
- PORT: default 8080
- MCP_ENABLE_HTTP: true|false (default true)
- MCP_ENABLE_SSE: true|false (default true)
- MCP_ENABLE_WS: true|false (default false)
- MCP_HTTP_TOKEN: optional bearer token
- BINANCE_REST_URL, BINANCE_WS_URL: provider endpoints

## Next
- Implement Binance REST/WS adapters
- Wire compute_indicators and stream_klines
- Add validation, rate limiting, metrics

