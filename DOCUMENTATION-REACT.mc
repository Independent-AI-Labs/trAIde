# trAIde React UI — Technical Notes

The UI is a Next.js app that renders a glass‑styled landing and a simple TA workspace. It proxies MCP via `/api/mcp/*` to avoid CORS and provides ergonomic endpoint controls.

## Providers (current)
- `MCPConfigProvider`: manages MCP base URL with localStorage + cookie override; probes `/health` and fallbacks.
- `NetConfigProvider`: concurrency limiter and default TTL for network calls.
- `MarketCacheProvider`: small TTL LRU cache for REST results.
- `ToastProvider`: lightweight global toasts.

## Hooks (current)
- `useFetchers()`: `fetchKlinesCached(symbol, interval, limit?, ttl?)` via Next proxy.
- `useKlines({ symbol, interval, limit, stream })`: seeds from REST and optionally merges SSE ticks.
- `useSSE(url, opts)`: SSE with exponential backoff and optional pause when tab is hidden.

## Components (current)
- Workspace: `ChartWorkspace`, `TimeframeSwitch`.
- UI primitives: `DataTable`, `GlassCard`, `Toast`, `StatusPill`, `SkeletonWave`, `HoloSpinner`.
- Endpoint control: `EndpointControl` floating pill to edit MCP URL.
- Landing: `HeroChartLive`, `ComparePanel`, `WatchlistPanel`, `ScannerPanel`, `HeatmapPanel`, `StreamStatusPanel`, `PlaygroundPanel`.

## Proxying & Env
- Next API route `/api/mcp/[...path]` forwards to MCP; caches `/klines` for ~10s.
- Base URL is set by `NEXT_PUBLIC_MCP_BASE_URL` or the `mcp` cookie. The provider normalizes and persists changes.

## Notes
- Stream tick handling batches updates minimally; consider rAF batching for heavy pages.
- Keep indicator calculation on server for consistency; client calculators exist for live deltas rendering.
