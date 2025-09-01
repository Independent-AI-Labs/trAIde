# trAIde TODO — Phase 2 (Consolidated Remaining Work)

Scope: everything left to implement or harden across core (indicators), MCP server, and UI (Next.js). Derived from TODO.md, TODO-QUALITY.md, SPEC-UI.md, SPEC-REACT.md, SPEC-REACT-COMP.md and current code state.

## High‑Level Themes
- UI product (marketing + app): ship core routes, charts, streaming, auth, and scanner.
- MCP polish: schemas, provider robustness, observability, security.
- Parity and tests: strict parity vs Python ta, coverage ≥95%, property tests.
- Docs + site: Typedoc + guides, quickstarts, troubleshooting.
- CI/CD + release: coverage gates, npm + GHCR publish, provenance.

## UI (Next.js App)
- Marketing/Portfolio routes: `/`, `/features`, `/docs` hub, `/portfolio`, `/pricing` (stub), `/blog` (optional), `/legal/{terms,privacy}`.
- App routes: `/app` shell, `/app/markets`, `/app/chart/:symbol`, `/app/scanner`, `/app/playground`, `/app/indicators`, `/app/settings`.
- Auth: integrate Google + X (Auth.js or Supabase); session handling; gate features for anonymous vs user.
- Charting: Lightweight Charts wiring with overlays and panes; URL‑synced state.
- Indicators UI: picker, params, presets; overlays (EMA/SMA/BB/Ichimoku/PSAR/Keltner/Donchian) and panes (RSI/MACD/PPO/PVO/CMF/MFI/UO/AO/ADX/Stoch/StochRSI).
- Streaming: SSE default with optional WS auto‑upgrade; merge deltas with history; reconnection UX.
- Stores & hooks: Zustand stores; `useSymbols`, `useKlines`, `useIndicators`, `useStream`, `useCombinedSeries`, `useUrlState`.
- Scanner: rule builder (indicator comparators), batch + incremental modes; virtualized results.
- Playground: client compute vs MCP parity view; CSV export; parity badge.
- UX: StreamStatusBar, LatencyMeter, toasts, error/empty/loading states; theme toggle.
- Analytics & monitoring: Plausible/PostHog, Sentry, basic performance beacons.
- SEO & marketing: metadata/OG, sitemap/robots, portfolio cards, badges.
- Security headers: CSP, frame‑ancestors, strict connect‑src to MCP.
- Container: Next standalone image; `NEXT_PUBLIC_MCP_BASE_URL` documented.

## MCP Server
- JSON Schemas: full request validation for `compute_indicators`, `stream_klines`, plus explicit schemas for `list_symbols`, `health`; unify error codes.
- Provider hardening: REST retry/backoff, klines pagination, proxy support; structured provider errors.
- Observability: request IDs, structured logs (pino), prom‑client metrics (counters + histograms by route/status), SSE keepalive comments.
- Security: bearer token defaults for non‑local profiles, tuned rate limits, clear CORS allowlist config.
- Streaming deltas: extend incremental support beyond current set where practical; reconnection tests with fake WS.
- Docker & compose: production Dockerfile (build TS → dist), healthcheck, example compose; publish GHCR image in CI.
- Docs: deployment, CORS/auth envs, operations and troubleshooting.

## Core Indicators Parity
- Parity sweep vs pinned Python `ta`: confirm formulas, warm‑ups, defaults for EMA/MACD/Wilder RMA/PSAR/Ichimoku/Keltner/Donchian/BB/Stoch/StochRSI, TRIX, WMA weighting.
- Signatures/defaults: align parameter names and defaults with upstream `ta` where intended; document any deviations.
- NaN policy: align with upstream where applicable; configurable `fillna?: boolean | number` semantics.

## Tests & Coverage
- Port/extend fixtures for remaining indicators (trend, momentum, volatility, volume) where gaps exist.
- Math utils unit tests: SMA/EMA/WilderRMA/std/trueRange/highest/lowest edge cases and NaN handling.
- Property tests: invariants (e.g., OBV), bounds (RSI/Stoch), rolling min/max monotonicity.
- Streaming/integration: SSE lifecycle (open/heartbeat/reconnect), WS reconnection, unskip SSE test when stable in CI.
- Coverage gates: Vitest + c8 thresholds ≥95% enforced in CI.

## Docs & Site
- Typedoc reference for core indicators and types; VitePress (or similar) docs site with guides and examples.
- Cookbook: common strategies (MACD cross, BB squeeze, ADX filter).
- Migration guide: Python `ta` → trAIde TS mapping (functions, params, defaults, caveats).
- UI proxy contract: document `/api/mcp/*` and cookie override for MCP base URL.
- Troubleshooting: ports busy, CORS 401/403, SSE disconnects, rate limits.

## CI/CD & Release
- Workflows: lint, typecheck, test with coverage gate; build.
- Release: npm publish (core) + GHCR publish (MCP) with signed provenance; changelog and semver audit.
- Optional: nightly job to run WS/REST E2E with flags enabled.

## Performance
- Rolling window optimizations (deques) for Donchian/Aroon/min/max; TypedArrays where beneficial.
- UI: rAF‑batched updates on ticks; windowed lists; SSR/CSR split for chart code.
- Benchmarks: microbench docs and Big‑O notes.

## Validation & Parity Harness
- Cross‑language harness: run Python `ta` over fixtures/random series; auto‑diff TS outputs; regenerate CSVs and guard against drift.
- Manual warm‑up spot checks around first 2×window.

## Quality Backlog (from TODO‑QUALITY)
- Validation: unify HTTP validation and MCP tool validators; tighten CORS defaults; enable bearer token by default non‑local; normalize `interval` and `symbol` across entry points.
- Observability: request IDs, expanded metrics labels and per‑route histograms; SSE pings; map upstream provider errors.
- Performance: UI proxy SWR for `/klines`; batch UI state updates on stream; Next standalone output.
- Testing: MCP routing unit tests (auth/validation/limits), `/stream/klines` integration, UI proxy SSE passthrough test, core property tests for rolling helpers.
- Build/Deploy: production Dockerfile for MCP (dist run), Next standalone UI image, `.env` templates for local/prod (MCP_HTTP_TOKEN, CORS, BINANCE urls).
- DX & Docs: generate TS API reference; document proxy contract; troubleshooting section.
- Risk cleanup: audit unsubscribe/cleanup code paths; cap in‑memory caches (LRU) server/UI.
- Tracking: create GitHub issues per task with labels (`area:*`, `kind:*`).

---

Note: Remove or update README links that referenced the old TODO/SPEC documents to point to this file and the docs site once available.

