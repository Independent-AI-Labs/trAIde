# Traide UI — Product Spec (SPA)

A single-page application that is both a full‑featured technical analysis platform and the marketing/landing hub for the Traide project. It showcases real‑time streaming indicators powered by the Traide MCP server, drives signups via Google/X login, and presents the project’s portfolio, docs, and credibility.

---

## 1) Vision, Users, Success

- Vision: A delightful, fast, realtime TA SPA that doubles as the landing site. It demonstrates the platform’s power (live streams, indicators, scanning) and funnels visitors into authenticated usage with minimal friction.
- Primary users: active traders, quants/devs, curious builders, and partners/recruiters.
- Primary outcomes: signups (email capture), engagement (returning users), and credibility (portfolio presentation + docs).
- Success metrics (initial):
  - Conversion: Landing → signup rate ≥ 8–12% (baseline dependent on traffic source).
  - Activation: First session completes “watchlist + indicator add” within 3 minutes (≥ 60%).
  - Performance: TTI < 2.5s on 75th percentile; stream latency P95 < 400ms; error rate < 0.5%.
  - Reliability: WS/SSE reconnects recover < 5s; uptime ≥ 99.5% for UI.

---

## 2) Information Architecture (IA) & Routes

Public (marketing + portfolio)
- `/` Home: Hero with live chart demo, product value, CTAs.
- `/features` Feature deep‑dive with animated demos of indicators/streaming.
- `/docs` Quickstart/docs hub linking to MCP/API/TA docs.
- `/portfolio` Project showcase: MCP server, TA library, CI, badges, repos.
- `/pricing` (optional now, stub) Free vs Pro roadmap.
- `/blog` (optional now) Lightweight posts, release notes.
- `/legal/{privacy,terms}` Compliance pages.

Authenticated App (SPA shell)
- `/app` Shell redirects to last workspace route.
- `/app/markets` Watchlist + market overview (sparkline, % change, volume).
- `/app/chart/:symbol` Chart workspace with indicators, overlays, multi‑pane.
- `/app/scanner` Screener (rule builder over symbols/timeframes).
- `/app/playground` Indicator playground (compute/simulate params, live/historic).
- `/app/indicators` Catalog with docs, presets, and parity status.
- `/app/settings` Profile, preferences, API keys (future), themes.
- `/*` 404 with quick links.

Top‑level navigation
- Left: Logo (to `/`), Home, Features, Docs, Portfolio.
- Right: Login/Account, GitHub CTA, Theme toggle.
- App shell: Left sidebar (watchlist/navigation), top toolbar (symbol/timeframe/actions), main content (chart/scanner).

---

## 3) Core Features

Marketing/Portfolio
- Hero with live streaming mini‑chart powered by MCP SSE/WS.
- Social proof: CI badges, coverage %, GitHub stars, build status, metrics.
- “How it works”: brief diagrams (MCP ↔ UI), code snippets.
- CTA: Sign in with Google/X; email capture preauth (magic‑link optional later).

App — Markets & Charting
- Watchlist: add/remove symbols, pin, group by exchange; real‑time quotes.
- Chart workspace: TradingView Lightweight Charts with overlays and studies.
- Indicator panel: add/remove/configure indicators; presets; show input windows.
- Layouts: multi‑pane (price/volume/oscillators), save/restore to cloud.
- Timeframes: 1m..1D; historical fetch + live stream merge with gap fill.
- Stream status: connected, lag, server region; reconnection toasts.
- Toolbar: crosshair, measure tool, zoom/pan, screenshot/share.

App — Scanner & Playground
- Screener: rules over indicators (e.g., RSI<30 AND PPO>0), run across lists.
- Real‑time mode: streaming deltas update matching set; batch mode for backfills.
- Playground: choose indicator(s), parameters, compute over window, compare vs core ta parity; CSV export.

Account & Settings
- Profile: name, avatar from Google/X; email verified.
- Preferences: theme, default timeframe, latency meter on/off.
- Data: watchlists, saved layouts, scanner presets; export/import JSON.

---

## 4) Authentication & Authorization

- Providers: Google OAuth and X (Twitter) OAuth 2.0.
- Identity: third‑party OAuth for sign‑in; store minimal profile + email consent.
- Session: secure HTTP‑only cookie session (short‑lived) + rotating refresh; or managed by the chosen auth provider SDK.
- Options:
  - Next.js + Auth.js (NextAuth) with Google + Twitter providers.
  - Or Supabase Auth (Google + X), simple client SDK, row‑level security for user data.
- Roles: `anonymous` (read‑only demo), `user` (saved data), `admin` (feature flags).
- Gating: anonymous can use demo symbol and limited history; `user` gets full watchlists, custom symbols, saved layouts.
- Security: state/nonce, PKCE; strict redirect/callbacks on `traide-ui.com`.

---

## 5) Data & MCP Integration

- Base API: Traide MCP server over HTTPS for REST + SSE endpoints:
  - `GET /health`, `GET /symbols`, `GET /klines`, `POST /indicators`, `GET /stream/klines` (SSE) or WS if enabled.
- Auth to MCP: public endpoints for demo; bearer token for authenticated traffic (optional now). CORS allowlist includes `https://traide-ui.com`.
- Client contracts:
  - Klines: `{ t, o, h, l, c, v }` numeric; time in ms.
  - Indicators (batch): `{ name, params, series: [...] }` aligned to klines.
  - Stream: deltas with `{ symbol, interval, t, c, v, ...indicators? }` as configured.
- Data flow:
  - Historical fetch via REST → seed chart.
  - Live via SSE/WS → apply deltas; reconcile gaps on reconnect.
  - Indicator compute: prefer server batch for parity; optionally client compute (subset) in playground for responsiveness.

---

## 6) Streaming, State, and Performance

- Transport: SSE default; WS optional if MCP WS enabled. Auto‑upgrade logic can pick WS when available.
- State:
  - Query cache: TanStack Query for REST data + SSR hydration for marketing pages.
  - App state: Zustand store for workspace (watchlists, layouts, indicator configs).
  - Stream store: lightweight event bus (RxJS optional) that fans out updates to chart, watchlist, and scanner.
- Merging: deterministic reducer merges stream ticks into series; de‑dupe by `t` and `symbol+interval` key; late events gracefully patch.
- Performance budgets: avoid chart reflow > 60Hz; batch UI updates with `requestAnimationFrame`; windowed lists for watchlist/scanner.
- Offline/PWA: optional later; cache last session layout + snapshot only.

---

## 7) UI/UX & Components

- Design system: Tailwind CSS + shadcn/ui (Radix) for primitives; dark‑first.
- Charts: TradingView Lightweight Charts; custom series for indicators; color tokens.
- Key components:
  - AppShell (sidebar, header, content, toasts, modals)
  - MarketList (virtualized), SymbolSearch (cmd‑k), TimeframeSwitch
  - ChartContainer, OverlayManager, IndicatorConfigPanel
  - StreamStatusBar (ping/lag), LatencyMeter, ReconnectToast
  - RuleBuilder (scanner), ResultTable (virtualized)
  - PlaygroundConsole (params, preview, export)
  - AuthButton (Google/X), AccountMenu, SettingsPanel
  - PortfolioShowcase (cards), HeroChart (mini live chart)
- Accessibility: keyboard first (cmd‑k, shortcuts), focus rings, proper roles.

---

## 8) SEO, Analytics, and Marketing

- SEO: use SSR/SSG for public pages; meta, OG images, sitemap, robots, schema.org Product.
- Performance: images optimized, critical CSS, font subsetting; Core Web Vitals monitoring.
- Analytics: privacy‑friendly (Plausible) or PostHog for product analytics; track signup funnel, feature usage, stream health; cookie banner only if necessary.
- Error monitoring: Sentry with DSN per‑env; source maps in CI.
- Marketing hooks: shareable chart snapshots with prefilled OG images; social cards.

---

## 9) Security & Compliance

- CSP: strict default‑src, connect‑src includes MCP domain, frame‑ancestors none.
- OAuth: PKCE, state/nonce, exact redirect URIs; rotate client secrets.
- Data: only store necessary PII (email, provider id, avatar URL). GDPR‑friendly deletion on request.
- Rate limits: MCP and any proxy; UI debounces noisy actions (search, scanner).

---

## 10) Deployment & Operations

- Stack:
  - Framework: Next.js (hybrid) to get SSG/SSR for marketing + SPA app shell for `/app/*`.
  - Alternative: Vite SPA + Astro/Static for marketing; but Next.js preferred for speed of integration.
- Hosting: Vercel for UI; custom domain `https://traide-ui.com`.
- MCP: separate deployment at `https://api.traide-ui.com` (or subpath) with CORS and optional bearer auth; region close to Vercel region.
- Env config:
  - `NEXT_PUBLIC_MCP_BASE_URL`, `NEXT_PUBLIC_STREAM_TRANSPORT` (sse|ws)
  - `AUTH_GOOGLE_CLIENT_ID/SECRET`, `AUTH_TWITTER_CLIENT_ID/SECRET`
  - `NEXTAUTH_URL` (if using Auth.js) or Supabase keys if chosen.
- Observability: uptime checks (Pingdom/Cronitor), synthetic tests for `/health`, stream connection, and basic chart render.

---

## 11) Milestones & Scope Cuts

M0 — Foundation (1–2 weeks)
- Marketing home (`/`), Features, Docs links, Portfolio.
- Auth: Google/X sign‑in; basic profile store.
- App shell (`/app`), Markets page, single live chart with 2–3 indicators (EMA, RSI, PPO) from MCP; watchlist basic.

M1 — Charting & Indicators (2–3 weeks)
- Full indicator panel, presets, layout save/restore.
- Robust stream handling, latency bar, reconnect flows; historic gap fill.
- Playground with client compute vs server parity check.

M2 — Scanner & Polish (2–3 weeks)
- Rule‑based screener with batch + incremental streaming; result virtualized table.
- Portfolio enhancements, docs embeds, blog stub; analytics + Sentry.

M3 — Hardening & Launch (1–2 weeks)
- SEO pass, lighthouse ≥ 95; accessibility pass.
- Security headers, CSP, rate limit tuning; error empty states.

Scope cuts when needed
- Defer blog; limit to 6–10 core indicators; scanner batch‑only; no sharing images.

---

## 12) Open Decisions

- Auth backend: Auth.js (NextAuth) vs Supabase Auth. Default to Auth.js for tight Next.js integration; Supabase is fine if we want hosted DB + RLS out‑of‑box.
- Streaming client: SSE first, WS optional; keep both with a small adapter.
- Payments: None initially; pricing page is informational only.

---

## 13) Technical Notes & Packages

- UI framework: Next.js 14+, React 18; TypeScript strict.
- UI libs: Tailwind, shadcn/ui, Radix UI, cmdk.
- State: Zustand (+ immer), TanStack Query, optional RxJS for stream bus.
- Charts: `lightweight-charts` with custom overlays.
- Forms: `react-hook-form` + `zod`.
- Analytics/monitoring: Plausible or PostHog; Sentry.
- Testing: Vitest/Playwright for e2e of chart render + stream; MSW for REST.

---

## 14) Data Models (client‑side)

- User: `{ id, email, name, avatar, provider }`
- Watchlist: `{ id, name, symbols: string[], sort, createdAt, updatedAt }`
- Layout: `{ id, name, panes: [...], indicators: [...], timeframe, symbol }`
- IndicatorConfig: `{ id, name, params, pane, color, visible }`
- ScannerPreset: `{ id, name, rules: [...], universe: [...], timeframe }`

---

## 15) MCP Contracts (reference)

- `GET /symbols` → `{ symbols: string[] }`
- `GET /klines?symbol=...&interval=...&start=...&end=...&limit=...` → `[{ t,o,h,l,c,v }]`
- `POST /indicators` body `{ symbol, interval, indicators: [{ name, params }] }` → `{ series: { [name]: [{ t, value }] } }`
- `GET /stream/klines?symbol=...&interval=...` (SSE) → events `kline` with `{ symbol, interval, t, o,h,l,c,v }`

---

## 16) Wireframe Summary (text)

- Home: Split hero (left copy, right live mini‑chart). Below: 3 columns Features, Portfolio cards, CTA bar.
- App: Sidebar watchlist; header (search/symbol/timeframe/auth); main chart with resizable panes; drawer for indicators; bottom status with stream latency.

---

## 17) Domain & Branding

- Domain: `traide-ui.com` (apex) → Vercel. `www` redirects to apex. `api.traide-ui.com` → MCP.
- Branding: simple wordmark; dark gradient hero; accessible contrast; consistent purple/teal accent.

---

This spec prioritizes a fast landing + convincing demo, then an immediately useful workspace with live indicators. It keeps options open for growth (scanner, strategies) without over‑committing the first release.

