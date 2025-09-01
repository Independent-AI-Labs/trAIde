# trAIde React UI — Technical Notes

The UI is a Next.js app that renders a glass‑styled landing and a simple TA workspace. It proxies MCP via `/api/mcp/*` to avoid CORS and provides ergonomic endpoint controls.

## Providers (current)
- `MCPConfigProvider`: manages MCP base URL via UI control; persists to cookie `mcp` (used by server proxy) and localStorage; probes `/health` and shows status.
- `NetConfigProvider`: schedules network calls with simple concurrency control and default TTL.
- `MarketCacheProvider`: small TTL LRU cache for REST results.
- `ToastProvider`: lightweight global toasts.

## Hooks (current)
- `useFetchers()`: `fetchKlinesCached(symbol, interval, limit?, ttl?)` via Next proxy (`/api/mcp/klines`); validates shape and caches ~10s by default.
- `useKlines({ symbol, interval, limit, stream })`: loads REST history then optionally merges SSE ticks into a live series; exponential backoff and minimal coalescing.
- `useSSE(url, opts)`: generic SSE helper (internal to components) with exponential backoff and optional pause when tab is hidden.

## Components (current)
- Workspace: `ChartWorkspace` (symbol input, timeframe switch, overlays toggle), `TimeframeSwitch`.
- UI primitives: `DataTable`, `GlassCard`, `Toast`, `StatusPill`, `SkeletonWave`, `HoloSpinner`.
- Endpoint control: floating pill to edit MCP URL; writes cookie and localStorage.
- Landing: `HeroChartLive` (MCP SSE with `indicators=ppo,rsi`), `ComparePanel`, `WatchlistPanel`, `ScannerPanel`, `HeatmapPanel`, `StreamStatusPanel`, `PlaygroundPanel`.

## Proxying & Env
- Next API route `/api/mcp/[...path]` forwards to MCP; caches `GET /klines` for ~10s and streams SSE through for `/stream/klines`.
- Base URL is set by `NEXT_PUBLIC_MCP_BASE_URL` or the `mcp` cookie. The config UI normalizes and persists changes.

### SSE Base Resolution
- Client code builds SSE URLs via `sseUrl(path)` from `apps/traide-ui/src/lib/mcp.ts`.
- Behavior:
  - If `NEXT_PUBLIC_MCP_BASE_URL` is set or a `mcp` cookie exists, it returns an absolute URL to the MCP server (offloading the connection from Next’s origin).
  - Otherwise it proxies requests through the Next route at `/api/mcp/*`.
- This avoids CORS issues by default while allowing explicit override in dev/production.

## Notes
- Stream tick handling currently updates state per event; consider rAF batching for heavy pages.
- Keep indicator calculation on server for consistency; client calculators exist for live deltas rendering.
- Default ports (compose): UI `62008`, MCP `62007`.
