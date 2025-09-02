# trAIde TODO — Phase 2 (Consolidated Remaining Work)

Scope: everything left to implement or harden across core (indicators), MCP server, and UI (Next.js). This file reflects the current code as implemented in apps/traide-ui and packages/traide-mcp.

Status snapshot (code‑informed)
- UI canvas/panels: implemented with drag, resize, live preview (rAF), keyboard arrows, context menu, Component Palette, and persistent layouts. See `TileCanvas.tsx` and `components/canvas/*`.
- Notes panel XSS: mitigated via in‑app sanitizer in `RichTextPanel.tsx` (allowlist; strips scripts/handlers/styles; safe links).
- Proxy hardening: Next API proxy `/api/mcp/*` validates scheme, blocks private CIDRs by default, supports host allowlist, caps response size, and streams SSE. See `app/api/mcp/[...path]/route.ts`.
- Security headers: CSP, frame‑ancestors/denied, nosniff, referrer policy, and permissions policy configured in `apps/traide-ui/next.config.js`.
- Streaming client: `useSSE` has backoff, visibility pause, and optional throttling. `useKlines` merges live closed candles with history.
- MCP server: HTTP endpoints, SSE with incremental indicator deltas, IP rate limiting, optional Bearer auth, and Prometheus‑style counters/histograms.
- Tests & coverage: Core + UI tests green; Vitest coverage thresholds enforced (≥95% stmts/funcs/lines; branches 88%).

## High‑Level Themes
- UI product (marketing + app): ship core routes, charts, streaming, auth, and scanner.
- MCP polish: schemas, provider robustness, observability, security.
- Parity and tests: strict parity vs Python ta, coverage ≥95%, property tests.
- Docs + site: Typedoc + guides, quickstarts, troubleshooting.
- CI/CD + release: coverage gates, npm + GHCR publish, provenance.

## UI (Next.js App)
- Marketing/Portfolio routes: `/`, `/features`, `/docs` hub, `/portfolio`, `/pricing` (stub), `/blog` (optional), `/legal/{terms,privacy}`.
  - Current: landing `/` exists and uses panels; other marketing routes not implemented.
- App routes: `/app` shell, `/app/chart/:symbol`, `/app/dashboard` implemented. Missing: `/app/markets`, `/app/scanner` page (scanner exists as a panel), `/app/playground`, `/app/indicators`, `/app/settings`.
- Auth: integrate Google + X (Auth.js or Supabase); session handling; feature gates. Not implemented.
- Charting: Lightweight Charts wired; simple overlays (EMA/SMA) toggles; URL‑synced timeframe on chart route.
  - Next: indicator panes and overlays registry; compare series; legend.
- Indicators UI: picker, params, presets; parity badges (Core/Client/MCP). Not implemented.
- Streaming: UI uses SSE via proxy; merges closed candles with history; backoff and visibility pause present.
  - Next: WS auto‑upgrade optional; live deltas viz; user‑visible reconnect states in more panels.
- Stores & hooks: `useKlines`, `useSSE` present; basic tick config context in place.
  - Next: `useSymbols`, `useIndicators`, `useCombinedSeries`, `useUrlState` and central store for layouts/state.
- Scanner: panel implemented (group, interval, lookback, minVol; computed stats); no rule builder yet.
  - Next: rule builder with indicator comparators; incremental scanning; virtualization for large sets.
- Playground: not implemented (parity compare client vs MCP; CSV export; parity badge).
- Panel groups/containers: single‑level panels implemented. Not yet supporting nested containers/grouping/ungrouping.
- UX: Status pill, toasts, loading/empty states present; theme toggle not implemented.
- Analytics & monitoring: not integrated.
- SEO & marketing: baseline metadata present; OG/sitemap/robots pending.
- Container: Next headers include CSP; standalone image not configured; env docs pending.

## MCP Server
- JSON Schemas: validate `compute_indicators` and `stream_klines` inputs; explicit schemas for `symbols`, `health`. Unify error codes.
- Provider hardening: pagination and replay on reconnect are implemented; add REST retry/backoff for 5xx/429; proxy support.
- Observability: metrics exist (counters + latency histogram). Add request IDs and include route/method/status labels consistently; expose them in logs.
- Security: bearer token supported (optional); consider enabling by default in non‑local; document CORS allowlist behavior.
- Streaming deltas: implemented for MACD/RSI/ATR/Stoch/VWAP/PPO/PVO. Add tests and extend where beneficial.
- Keepalive: provider emits heartbeat events; consider periodic SSE comments from HTTP layer to keep intermediaries alive.
- Docker & compose: Dockerfile and healthcheck present. Add GHCR publish workflow and production dist image for the full server.
- Docs: deployment, CORS/auth envs, ops and troubleshooting.

## Core Indicators Parity
- Parity sweep vs pinned Python `ta`: confirm formulas, warm‑ups, defaults for EMA/MACD/Wilder RMA/PSAR/Ichimoku/Keltner/Donchian/BB/Stoch/StochRSI, TRIX, WMA weighting.
- Signatures/defaults: align parameter names and defaults with upstream `ta` where intended; document deviations.
- NaN policy: align with upstream where applicable; configurable `fillna?: boolean | number` semantics.

## Tests & Coverage
- Port/extend fixtures for remaining indicators (trend, momentum, volatility, volume) where gaps exist.
- Math utils unit tests: SMA/EMA/WilderRMA/std/trueRange/highest/lowest edge cases and NaN handling.
- Property tests: invariants (e.g., OBV), bounds (RSI/Stoch), rolling min/max monotonicity.
- Streaming/integration: SSE lifecycle (open/heartbeat/reconnect), WS reconnection; expand MCP HTTP unit tests (auth/validation/limits).
- Coverage gates: already enforced. Keep thresholds; add UI tests for sanitizer and proxy validation.

## Docs & Site
- Typedoc reference for core indicators and types; VitePress (or similar) docs site with guides and examples.
- Cookbook: common strategies (MACD cross, BB squeeze, ADX filter).
- Migration guide: Python `ta` → trAIde TS mapping (functions, params, defaults, caveats).
- UI proxy contract: document `/api/mcp/*`, cookie override, and env allowlist vars (`MCP_ALLOWED_HOSTS`, `MCP_ALLOW_PRIVATE`).
- Troubleshooting: ports busy, CORS 401/403, SSE disconnects, rate limits.

## CI/CD & Release
- Workflows: lint, typecheck, tests with coverage gate, and build already present.
- Release: add npm publish (core) + GHCR publish (MCP) with provenance; changelog and semver audit.
- Optional: nightly job to run WS/REST E2E with flags enabled.

## Performance
- Rolling window optimizations (deques) for Donchian/Aroon/min/max; TypedArrays where beneficial.
- UI: rAF‑batched drag/preview implemented; add windowed lists for large watchlists/scanner; SSR/CSR split for heavy chart code maintained.
- Benchmarks: microbench docs and Big‑O notes.

## Validation & Parity Harness
- Cross‑language harness: run Python `ta` over fixtures/random series; auto‑diff TS outputs; regenerate CSVs and guard against drift.
- Manual warm‑up spot checks around first 2×window.

## Quality Backlog (refined; code‑aware)
- Validation: add JSON schema validation for HTTP `POST /indicators` and query validators for `GET /klines`/`/stream/klines`; align error codes across routes and MCP tools. Normalize `interval`/`symbol`.
- Observability: add request IDs; expand metrics labels (route, method, status); include IDs in logs. Consider periodic SSE comments from HTTP layer in addition to provider heartbeats.
- Security: proxy is hardened; add tests for allowlist/private CIDR handling; consider enabling Bearer by default in non‑local.
- UI Performance: windowed virtualized tables/lists; keep rAF batching; consider diffing overlay series for large counts.
- Testing: add UI tests for RichTextPanel sanitizer; server unit tests for proxy target selection and response caps; SSE lifecycle tests; property tests for rolling helpers.
- Build/Deploy: production dist image for MCP full server; Next standalone UI image; `.env.example` for root with MCP vars.
- DX & Docs: typedoc for core; document proxy contract and env; troubleshooting section.
- Risk cleanup: audit unsubscribe/cleanup paths; cap caches (LRU) where needed.

---

Note: README links now point to docs; no obsolete TODO/SPEC links found. Keep this file as the single source for planning status.
