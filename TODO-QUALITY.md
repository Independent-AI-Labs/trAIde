Traide Quality Backlog

Scope: actionable, high‑impact improvements to reliability, security, performance, tests, and dev ergonomics across core, MCP, and UI.

Validation & Security
- Unify request validation in HTTP with MCP tool validators for parity and clearer errors (zod or shared helpers).
- Tighten CORS defaults: avoid wildcard in non‑local profiles; document per‑env values.
- Enable bearer token by default for non‑local profiles; add 401/403 test coverage.
- Normalize and validate `interval` and `symbol` across all entry points (HTTP + tools); reject invalids early.

Observability & Reliability
- Add request IDs (e.g., `x-request-id`) and include in logs and responses.
- Expand metrics labels (route, status) and add per‑route histograms for HTTP and MCP tools.
- Emit SSE comment pings to prevent idle intermediaries from closing streams.
- Surface provider errors with structured codes; map common upstream failures.

Performance
- UI proxy: consider stale‑while‑revalidate strategy for `/klines` to reduce wait when cache refreshes.
- Batch UI state updates on stream ticks (rAF or transitions) to minimize reflows.
- Evaluate Next.js standalone output to reduce UI image size and cold start.

Testing
- MCP: unit tests for `http.ts` routing (auth, validation, limits) and error paths.
- MCP: integration tests for `/stream/klines` SSE lifecycle (open, heartbeat, reconnect).
- UI: integration test covering proxy SSE passthrough headers and stream consistency.
- Core: add property tests for rolling helpers (highest/lowest/wma) for edge cases.

Build & Deploy
- Add production Dockerfile for MCP that builds TS → dist and runs `node dist/index.js`.
- Switch UI container to Next standalone output; document envs `NEXT_PUBLIC_MCP_BASE_URL` and port mapping.
- Provide example `.env` templates for local vs. production (MCP_HTTP_TOKEN, CORS, BINANCE_ urls).

DX & Docs
- Generate API reference from TypeScript (TSDoc) for core indicators.
- Document UI proxy contract (`/api/mcp/*`) and cookie override (`mcp`) in one place.
- Add troubleshooting section (ports busy, CORS 401/403, SSE disconnects) to README.

Risk Cleanup
- Audit duplicate code paths for unsubscribe/cleanup in MCP and UI hooks.
- Guard against unbounded memory growth in in‑memory caches (server and UI) beyond current LRU caps.

Tracking
- Create GitHub issues for each task with labels: `area:mcp`, `area:ui`, `area:core`, `kind:security`, `kind:perf`, `kind:test`.

