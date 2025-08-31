# TATS TODO — Porting Python `ta` to TypeScript

This is a living checklist to complete feature parity with the Python `ta` library, ensure robust tests, and reach/maintain 95%+ coverage.

## Goals
- [ ] 1:1 feature parity with Python `ta` (latest pinned version in this repo).
- [ ] Numerical parity within tight tolerances against upstream fixtures or dynamically generated references.
- [ ] 95%+ test coverage enforced in CI.
- [ ] API that feels idiomatic in TypeScript while clearly documented for parity.
 - [ ] Interactive demo showcasing indicators on historical + live Binance data.

## Indicators To Implement (Remaining)

### Trend
- [x] Aroon: `AroonIndicator`, function variants (up/down)
- [x] WMA: class + `wma_indicator`
- [x] TRIX: class + function
- [x] Mass Index: class + function
- [x] Ichimoku: conversion, base, leading spans, lagging span
- [x] KST: class + function
- [x] DPO: class + function
- [x] Vortex: class + functions `vortex_indicator_pos/neg/diff`
- [x] PSAR: class + functions `psar_up_indicator` / `psar_down_indicator`
- [x] STC: class + function

### Momentum
- [x] ROC: class + function
- [x] KAMA: class + function
- [x] TSI: class + function
- [x] Ultimate Oscillator: class + function
- [x] Williams %R: class + function
- [x] Awesome Oscillator: class + function
- [x] StochRSI: class + functions `stochrsi`, `%K`, `%D`
- [x] PPO: class + functions
- [x] PVO: class + functions

### Volatility
- [x] Keltner Channel: mid/high/low bands + indicators
- [x] Donchian Channel: bands + indicators
- [x] Ulcer Index: class + function
- [x] Bollinger band indicators: cross up/down booleans

### Volume
- [x] Accumulation/Distribution Index (ADI/ADL)
- [x] Chaikin Money Flow (CMF)
- [x] Force Index (FI)
- [x] Ease of Movement (EoM) + SMA of EoM
- [x] Volume Price Trend (VPT)
- [x] Negative Volume Index (NVI)
- [x] Money Flow Index (MFI)
- [x] VWAP (if present in upstream API)

### Others
- [x] Daily Return, Daily Log Return, Cumulative Return

## Demo (React + Binance) — Detailed Plan

### Scope
- Interactive app visualizing indicators over historical candles (REST) and live streams (WebSocket).
- Controls: symbol, interval, lookback, and indicator parameters.

### Tech Stack
- Vite + React + TypeScript
- Charting: lightweight-charts or custom canvas/SVG
- Data: Binance public REST/WS API

### Architecture
- data layer: REST fetch for klines; WS subscribe to kline streams; normalize OHLCV
- indicators layer: glue to compute overlays/subpanes from OHLCV arrays
- UI: symbol/interval pickers, indicator toggles/params, overlays (BB/Ichimoku/PSAR), subpanes (RSI/MACD/PPO/PVO/MFI/CMF)

### Milestones
1) Scaffold `apps/demo` (Vite React); share workspace config
2) Load historical klines; render chart with BB/RSI/MACD overlays
3) Indicator picker + parameters; recompute on change
4) Ichimoku cloud via `ichimokuDisplay`; PSAR overlay
5) Volume panel (OBV, CMF, MFI) + PPO/PVO panels
6) WebSocket live kline updates; incremental recompute
7) Persist UI in URL; theme toggle
8) CI deploy demo (Pages/Vercel) on main

### Binance Integration Notes
- REST: `/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=1000`
- WS: `wss://stream.binance.com:9443/ws/btcusdt@kline_1h`
- Respect rate limits; cache recent results; UTC timestamps

### Next Steps (Actionable)
1) Parity sweep across all indicators vs fixtures; add any missing fixtures
2) Add streaming calculators (incremental) for EMA/RSI/MACD/ATR/Stoch/VWAP
3) Generate Typedoc and publish docs site (VitePress)
4) Create `apps/demo` and implement Milestones 1–3
5) Wire WS streaming (Milestone 6); measure perf and optimize
6) CI: lint, typecheck, test, build + demo deploy


## MCP Server Roadmap (Next Items)
- Dockerize MCP: add `packages/traide-mcp/Dockerfile` and optional `docker-compose.yml`; publish GHCR image in CI.
- Tighten MCP JSON Schemas: full schemas for `compute_indicators` (required fields, numeric bounds) and `stream_klines`; add explicit schemas for `list_symbols` and `health`.
- Docs/README: expand deploy instructions (Docker/compose), document CORS/auth envs, CI badges, and a brief OPERATIONS guide.
- Provider hardening: REST retry/backoff, time-window pagination, proxy support; add unit tests with mocked fetch/ws.
- Observability: adopt prom-client for metrics, pino logs with request IDs; optional tracing hooks.
- Workspace polish: consider moving core to `packages/traide-core` and depend from MCP via workspace instead of relative paths.
- CI release: npm publish for `traide` and GHCR image publish for MCP; changelog/tagging automation.
- Streaming coverage: add more streaming deltas (e.g., STC, Bollinger band signals) as needed.
- Tests: unskip SSE integration test once stabilized in CI; add WS reconnection unit tests with fakes.
- Security: bearer auth for SSE; tune rate limiting; document `MCP_CORS_ORIGINS` behavior.


## Parity Tasks (Double/Triple‑Check Against Python Source)
- [ ] Review `ta/utils.py` `IndicatorMixin` behavior for `fillna`, and replicate via options: `fillna?: boolean | number` with matching semantics.
- [ ] Confirm seeding/initialization:
  - [ ] EMA/MACD: EMA seeded via SMA of first window (verify constants and warm‑up alignment).
  - [ ] Wilder RMA for RSI/ATR/ADX: match update equations and initial SMA window.
  - [ ] WMA weighting scheme matches upstream implementation.
  - [ ] TRIX triple EMA, signal smoothing and scaling.
  - [ ] PSAR step and max step defaults, extreme point handling and trend flips.
  - [ ] Ichimoku offsets, window defaults, and line shift conventions.
  - [ ] Keltner/Donchian/BB: width and percentage band formulas exactly match upstream (including x100 scaling and division by middle band).
  - [ ] Stochastic/RSI/StochRSI smoothing windows, min/max clipping and edge cases (flat ranges).
  - [x] PPO/PVO base (EMA vs SMA), percentage scaling (adjust=false, min_periods=0 line; signal parity confirmed)
- [ ] Verify function signatures and defaults match upstream `ta` (parameter names and defaults).
- [ ] Align NaN policy: where upstream returns NaN vs 0 after `fillna`.
- [ ] Match indicator output names in docs/examples to reduce confusion when migrating.

## Tests & Coverage
- [ ] Port remaining fixture tests using `ta/test/data/*.csv`:
  - [ ] Trend: Aroon, WMA, TRIX, MassIndex, Ichimoku, KST, DPO, Vortex, PSAR, STC
  - [ ] Momentum: ROC, KAMA, TSI, UO, WilliamsR, AO, StochRSI, PPO, PVO
  - [ ] Volatility: Keltner, Donchian, Ulcer, BB indicators (cross up/down)
  - [ ] Volume: ADL, CMF, FI, EoM (+SMA), VPT, NVI, MFI, VWAP (if present)
- [ ] Create unit tests for math utils (SMA/EMA/WilderRMA/std/trueRange/highest/lowest) covering edge cases and NaN handling.
- [ ] Add property tests where appropriate (e.g., invariants for OBV, bounds for RSI/Stoch, monotonicity in rolling min/max).
- [ ] Ensure numerical parity within strict tolerances; flag and document any known deviations.
- [ ] Configure coverage reporting with Vitest + c8 and enforce >=95% threshold.

## API & DX
- [ ] Add options objects for all indicators to support `fillna`, custom NaN handling, and return shapes.
- [ ] Provide both functional API and lightweight stateful calculators (streaming updates) for real‑time use.
- [ ] Ensure tree‑shaking: verify no accidental side‑effects and granular exports.
- [ ] Typedoc: generate reference docs from TS types and JSDoc.
- [ ] Write migration guide from Python `ta` (mapping table: ta -> tats functions, params, defaults).

## Performance
- [ ] Optimize hotspots using deques for rolling windows (Donchian, Aroon, rolling min/max).
- [ ] Prefer typed arrays (`Float64Array`) with careful conversion for inputs/outputs.
- [ ] Microbenchmarks comparing different implementations; document Big‑O behavior.

## CI/Tooling
- [ ] Add GitHub Actions workflow: lint, build, test with coverage gate (95%).
- [ ] Add `eslint` + `prettier` configs and scripts.
- [ ] Add `vitest.config.ts` with coverage settings and aliasing.
- [ ] Add release workflow (npm publish) with provenance.

## Validation (Triple‑Check)
- [ ] Cross‑language parity harness: script to run Python `ta` locally on fixtures and auto‑diff results against TS outputs (pin exact `ta` version).
- [ ] Randomized series generator to compare results (TS vs Python) over many seeds/windows.
- [ ] Manual spot‑checks for each indicator’s first 2x window period to ensure warm‑up alignment.
- [ ] Re‑generate CSVs from Python `ta` and confirm tests still pass (guard against fixture drift).

## Documentation & Examples
- [ ] Expand README with all indicators, examples, and caveats.
- [ ] Add cookbook for common strategies (e.g., MACD crossover, BB squeeze, ADX trend filter).
- [ ] Clarify differences from Python `ta` where intentional (e.g., functional API, browser support).

## Release Checklist
- [ ] Final test run: 100% passing, 95%+ coverage.
- [ ] Semver audit and changelog.
- [ ] Bundle size check and export map validation (ESM/CJS/types).
- [ ] Tag and publish.

---

Scope note: keep implementations minimal and faithful to upstream; avoid unrelated refactors until parity is complete.
