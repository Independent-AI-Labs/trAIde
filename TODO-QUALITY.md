# Quality Plan (Architecture, Tests, Reliability, Security)

Purpose: actionable roadmap to raise quality, stability, and confidence across UI, proxy, MCP, and runner. Priorities reflect user‑visible impact and risk.

Scope: apps/traide-ui, packages/traide-mcp, packages/traide-runner, and proxy route in Next.js. Core TA lib already has excellent coverage and is out of scope except for integration points.

---

## Objectives

- Reliability: stable reconnects, controlled resource use, graceful degradation.
- Correctness: proxy behavior, SSE streaming, and REST responses well‑specified and verified.
- Security: SSRF protections, CORS discipline, rate limiting, and auth paths covered by tests.
- Observability: metrics on critical paths, targeted logs, easy local diagnostics.
- Coverage: measurable confidence with package‑level coverage and thresholds.

---

## Current State Summary

- UI proxy (`apps/traide-ui/src/app/api/mcp/[...path]/route.ts`): SSE passthrough, 5MB cap, in‑memory GET /klines cache, upstream 502 fallback. No purge strategy. Host allowlist envs exist but not fully tested.
- UI streaming: `useSSE` with backoff/visibility, `useBatchKlines` for multiplexed prices; Ticker modal paginates 20 items per page.
- MCP: HTTP server with REST + SSE, rate limit, optional token auth, metrics. Binance provider has WS backoff + closed-candle replay. Mini server for dev with batch cap.
- Runner: start/stop/status/logs with port cleanup; nodemon optional.
- Coverage: root report covers only `src/**`. MCP/UI tests exist but not included in coverage reporting.

---

## Risks & Gaps (Prioritized)

P0 (must do):
- Coverage blind spots: MCP and UI not in coverage; regressions are hard to quantify.
- Proxy cache unbounded by key count; long‑lived dev sessions can leak memory.
- SSE resource control: production MCP lacks enforced per‑connection symbol cap for batch stream.
- Host allowlist/private CIDR behavior lacks tests; potential SSRF risks in dev when `MCP_FORCE_LOCAL=false`.

P1 (should do):
- Reconnect storms: `useSSE` can flap on rapid URL toggles; add jitter and guard.
- Observability: missing counters for upstream failures and SSE backpressure; sparse client‑side diagnostics in dev.
- Runner watch UX: nodemon not guaranteed; unclear messaging if watch not active.

P2 (nice to have):
- E2E browser smoke for proxied SSE.
- UI micro‑perf: reduce initial Ticker page size or adapt to device perf.

---

## Work Plan by Area

### 1) Test Coverage & CI

- Action: Extend root Vitest coverage include to `packages/traide-mcp/src/**/*.ts`.
  - File: `vitest.config.ts`
  - Acceptance: coverage HTML shows MCP files; maintain thresholds (≥90% stmts/lines, ≥85% branches for MCP).

- Action: Add coverage config for UI tests.
  - File: `apps/traide-ui/vitest.config.ts` add coverage block; output to `apps/traide-ui/coverage/`.
  - Acceptance: UI coverage report generated; basic thresholds (≥70% stmts/lines initially, ratchet later).

- Action: CI job to run 3 test suites: core, MCP, UI, and upload coverage artifacts.
  - Files: `.github/workflows/*` (add or update), npm scripts as needed.
  - Acceptance: CI green across suites; artifacts visible; coverage gates enforced per project.

### 2) UI Proxy Hardening

- Action: Replace ad‑hoc Map cache with capped LRU+TTL (evict oldest on write and optionally age out on read).
  - File: `apps/traide-ui/src/app/api/mcp/[...path]/route.ts`
  - Acceptance: unit tests prove eviction and TTL honoring; memory stable under synthetic churn.

- Action: Tests for allowlist/private CIDR and POST passthrough.
  - Files: `apps/traide-ui/test/api.proxy.test.ts` (new cases)
  - Acceptance: tests demonstrate: private IP blocked unless `MCP_ALLOW_PRIVATE=true`; host allowlist enforced; POST `/indicators` forwards body/headers and returns upstream status.

### 3) Streaming Reliability & Resource Control

- Action: Enforce batch SSE symbol cap in production MCP HTTP server (not just mini).
  - File: `packages/traide-mcp/src/http.ts` (cap per connection; env `MCP_MAX_BATCH` with sane default 20).
  - Acceptance: attempts beyond cap are silently truncated or 400 with clear error; tests verify behavior.

- Action: Optional global SSE/WS budget.
  - File: `packages/traide-mcp/src/state.ts` or `src/http.ts` (track active subscriptions; refuse when above budget; metric exposed).
  - Acceptance: budget respected; metric `active_streams` present; tests simulate many streams.

- Action: Harden `useSSE` against rapid URL churn.
  - File: `apps/traide-ui/src/lib/useSSE.ts`
  - Changes: jitter on reconnect timers, guard duplicate opens within N ms, optional sticky backoff between URL changes.
  - Acceptance: unit test simulating toggle churn; no reconnection storm; connectivity indicator stable.

### 4) Observability

- Action: MCP metrics for upstream failures and SSE backpressure.
  - File: `packages/traide-mcp/src/metrics.ts`, `src/http.ts`
  - Counters: `upstream_failures_total{route=...}`, `sse_backpressure_total`, `active_streams` gauge.
  - Acceptance: metrics visible at `/metrics`; integration test checks counters increment.

- Action: Dev‑only client logs for SSE state.
  - File: `apps/traide-ui/src/lib/useSSE.ts`
  - Acceptance: behind `process.env.NEXT_PUBLIC_DEBUG_SSE === 'true'`, logs open/close/retry.

### 5) Security & Config

- Action: Default dev allowlist guidance.
  - Files: `apps/traide-ui/.env.example`, `README.md`
  - Acceptance: docs explain `MCP_FORCE_LOCAL`, `MCP_ALLOW_PRIVATE`, `MCP_ALLOWED_HOSTS` and recommended dev/prod values.

- Action: Enforce CORS in mini server parity with main server (documented behavior already similar).
  - File: `packages/traide-mcp/dev-server.js` (confirm and test)
  - Acceptance: options requests and origin reflection covered by tests.

### 6) Runner UX

- Action: Clear message when `--watch` requested but `nodemon` not found; provide install hint.
  - File: `packages/traide-runner/bin/traide-runner.js`
  - Acceptance: CLI prints actionable info; exit code remains success with non‑watch fallback.

---

## Test Additions Matrix

- UI Proxy
  - Caching: HIT/MISS with TTL; eviction when >N keys.
  - Size guard: content-length and actual body length paths.
  - SSE passthrough: single and batch; headers preserved.
  - Security: private CIDR blocked by default; allowlist enforced; POST passthrough body integrity.

- MCP HTTP
  - REST: health/symbols/klines/indicators valid shapes and error mapping.
  - SSE: single stream heartbeat + close cleanup; batch cap enforcement.
  - Security: rate limit path, token auth path (401 vs 200), CORS OPTIONS.
  - Metrics: presence and increments for key counters.

- UI Hooks/Components
  - useSSE: backoff progression, visibility pause/resume, churn guard.
  - useBatchKlines: per-symbol last event consolidation and reset on input change.
  - MarketCacheProvider: LRU‑ish eviction (exists), TTL expiry on read (exists), add stress test.
  - TickerModal: page size control, “Load more” label correctness.

---

## Milestones & Acceptance Criteria

Milestone 1 (P0): Coverage + Proxy + Batch Cap (2–3 days)
- Root coverage includes MCP; UI coverage configured.
- UI proxy LRU+TTL query cache implemented + unit tests.
- MCP batch SSE cap in `src/http.ts` with tests.
- Proxy security tests (allowlist/private IP) added.

Milestone 2 (P1): Streaming Hardening + Metrics (2–3 days)
- `useSSE` churn guard and jitter added + tests.
- MCP metrics for upstream failures and active streams + tests.
- Runner watch UX clarified.

Milestone 3 (P2): E2E + Polish (2–3 days)
- Optional Playwright smoke for proxied SSE.
- UI perf nits (initial Ticker page size configurable via env).
- Documentation updates for env and ops.

---

## Success Metrics

- Test pass rate: 100% across core, MCP, UI suites.
- Coverage: Core ≥98% (maintain), MCP ≥90% stmts/lines, UI ≥70% stmts/lines initial.
- Reliability: manual chaos (restart MCP during active SSE) shows UI recovery within 10s, no console error flood.
- Security: proxy SSRF tests pass by default (blocked) and pass when allowlist configured.
- Resource control: batch SSE cap enforced; server stream budget visible and respected.

---

## Implementation Notes

- Keep changes minimal and surgical; preserve file structure and code style.
- Avoid broad refactors; focus on caps, guards, and coverage.
- Document any new env vars: `MCP_MAX_BATCH`, `NEXT_PUBLIC_DEBUG_SSE`.

---

## Addenda: Detailed Specs & Findings

Additional details from code review to make work items executable and testable.

1) Proxy behavior and security guards
- Base URL resolution: in non‑production, `MCP_FORCE_LOCAL !== 'false'` forces `http://localhost:62007` regardless of cookie/env; in production, `MCP_BASE_URL || NEXT_PUBLIC_MCP_BASE_URL` wins and cookies are ignored unless host allowlist permits.
- CIDR checks: blocks 10/8, 127/8, 169.254/16, 172.16‑31/12, 192.168/16 and IPv6 `::1` unless `MCP_ALLOW_PRIVATE=true`.
- Allowlist: `MCP_ALLOWED_HOSTS` compared against `URL.host` (host:port). Mismatch throws back to default (localhost) in dev.
- Size guard: non‑SSE responses checked using `content-length` when available, else by actual buffered length; both paths return `{ error: 'response_too_large' }` with 502.
- Gaps to cover via tests: private CIDR blocked by default, allowlist permit/deny, POST passthrough body/content‑type integrity, oversized response without `content-length`.

2) Proxy cache LRU+TTL (spec)
- Scope: GET `/klines*` only (history endpoints).
- Key: full target URL after proxy normalization.
- TTL: 10s (existing). Evict expired entries on read before counting toward capacity.
- Capacity: default 200 keys; env `MCP_PROXY_CACHE_KEYS` (50‑2000). On write beyond capacity, evict least‑recently‑used.
- Headers: keep `x-cache: HIT|MISS`. In dev with `NODE_ENV!=='production'`, optionally add `x-cache-size: <n>` and `x-cache-capacity: <n>` for diagnostics.
- Metrics: add `proxy_cache_hits_total{route='klines'}`, `proxy_cache_misses_total{route='klines'}`, `proxy_cache_evictions_total{route='klines'}`.

3) Streaming caps and budgets (spec)
- Per‑connection batch cap: `MCP_MAX_BATCH` (default 20, min 1, max 200) enforced by production MCP at `/stream/klines/batch`.
  - Behavior option A (default): reject with 400 `{ error: 'too_many_symbols', max }` and increment `http_requests_total{route='stream_klines_batch',status='400'}`.
  - Behavior option B (opt‑in via `MCP_TRUNCATE_BATCH=true`): truncate symbol list to `max`, add header `x-truncated: true` and increment `sse_truncated_total`.
- Global budget: `MCP_STREAM_BUDGET` (unset by default). When active streams (single + batch subscriptions) exceed budget, reject new connections with 429 `{ error: 'too_many_streams' }`, increment `sse_rejected_total`, and expose `active_streams` gauge.
- Backpressure: detect `res.write()` false return; increment `sse_backpressure_total{route}`; optionally drop non‑critical sends while maintaining keepalives.

4) Metrics (authoritative names/labels)
- Counters: `http_requests_total{route,method,status}`, `http_streams_open_total{route}`, `http_streams_closed_total{route}`, `proxy_cache_hits_total{route}`, `proxy_cache_misses_total{route}`, `proxy_cache_evictions_total{route}`, `upstream_failures_total{route}`, `sse_backpressure_total{route}`, `sse_rejected_total{route}`.
- Gauges: `active_streams`.
- Histograms: `http_stream_duration_seconds{route}`, `http_latency_seconds{route}`.
- Tests should open and close streams to assert increments and labels.

5) Coverage & CI implementation details
- Root `vitest.config.ts`: set `coverage.include` to also cover `packages/traide-mcp/src/**/*.ts`; keep thresholds (core already ≥95%).
- UI `apps/traide-ui/vitest.config.ts`: add `coverage` block with provider `v8`, reporters `text,html,lcov`, thresholds initial `70/70/60/65` (stmts/lines/branches/funcs), include `src/**/*.{ts,tsx}`.
- Scripts: retain `ui:test`; consider adding `mcp:test` (e.g., `vitest run --dir packages/traide-mcp`). CI job runs core, MCP, UI, and uploads 3 coverage artifacts.

6) Concrete test files to add
- `apps/traide-ui/test/api.proxy.security.test.ts`: CIDR blocking, allowlist pass/fail, POST `/indicators` passthrough body and content‑type preserved, oversized response without `content-length` path.
- `packages/traide-mcp/test/integration/http.cors.test.ts`: OPTIONS and CORS origin handling for main and mini servers.
- `packages/traide-mcp/test/integration/http.batch.cap.test.ts`: `MCP_MAX_BATCH` 400 and truncate behaviors.
- `packages/traide-mcp/test/integration/http.metrics.test.ts`: metrics exposure, stream lifecycle increments, active_streams gauge.
- `apps/traide-ui/test/useSSE.churn.test.tsx`: rapid URL toggling; verifies jittered reconnect, min reopen interval, no storm.

7) Operational checks (manual)
- Dev happy‑path: `npm run dev:start` → UI reachable; `/api/mcp/health` OK; default `MCP_FORCE_LOCAL` respected.
- Chaos: kill MCP during `/stream/klines/batch`; UI reconnects within ≤10s, no console error flood; last‑by‑symbol map repopulates within 1–2 intervals.
- Memory: with churned klines queries, proxy cache heap remains stable (≤ capacity) after GC; no unbounded Map growth.

8) Env/config matrix (reference)
- UI proxy: `MCP_FORCE_LOCAL` (default true in non‑prod), `MCP_ALLOW_PRIVATE` (default false), `MCP_ALLOWED_HOSTS` (empty default), `MCP_PROXY_CACHE_KEYS` (default 200).
- MCP: `MCP_MAX_BATCH` (default 20), `MCP_TRUNCATE_BATCH` (default false), `MCP_STREAM_BUDGET` (unset), `MCP_BATCH_CONCURRENCY` (default 6), `MCP_HTTP_TOKEN` (optional), CORS envs per README.
- UI (client): `NEXT_PUBLIC_MCP_BASE_URL` (prod pin), `NEXT_PUBLIC_DEBUG_SSE` (dev logs), optional `NEXT_PUBLIC_TICKER_PAGE_SIZE`.

9) Open questions
- Batch overflow: prefer 400 error or truncation? If truncating, should SSE events include a comment `: truncated` to aid clients, or rely on HTTP header only?
- Proxy cache: strict cap vs soft cap (evict to 90% when exceeded)? Any production deployments of the Next proxy where capacity should be higher?
- Private CIDR in prod: should we require allowlist even when `MCP_ALLOW_PRIVATE=true`, i.e., both toggles needed for internal deployments?
