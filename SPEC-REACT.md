# trAIde React UI — Product/Technical Specification

This spec defines a production‑grade React UI that demonstrates the full system: trAIde (TA core), the MCP server (batch + streaming), and live Binance data. The UI serves as both a demo app and a reference component library developers can adopt.

## 1) Goals
- Showcase historical + live indicators with low‑latency streaming.
- Provide reusable, typed components and hooks for charts, overlays, and panes.
- Clean separation of data (MCP/REST/WS/SSE), compute (TA + MCP), and presentation (charts + UI).
- High performance and accessible UX; responsive and themeable.

## 2) High‑Level Architecture
- App framework: Next.js 14 (App Router) or Vite (SPA). Target Next.js for SSR/SEO and routes; Vite for fast dev.
- Charting: lightweight‑charts (TradingView) with custom adapters; fallbacks for SSR.
- Data layer: MCP HTTP for batch (`/indicators`, `/klines`), SSE for live (`/stream/klines`). Local cache and backpressure.
- State: Zustand (simple store) + URL query sync; no global Redux unless needed.
- Types: strict TS everywhere; domain types co‑located under `lib/types`.
- UI kit: Headless UI + tailwind (or CSS variables) for speed; accessible controls.

Proposed workspace layout (apps/web):
- `apps/web` (Next.js)
  - `components/` — presentational + container components
  - `charts/` — chart primitives and adapters
  - `hooks/` — data/stream hooks
  - `stores/` — Zustand stores
  - `lib/` — utils, types, MCP client, binance symbols cache
  - `pages/` or `app/` routes — home, dashboard, playground
  - `styles/` — theme variables (CSS)

## 3) Data Contracts
- Candle: `{ t:number; o:number; h:number; l:number; c:number; v:number }` (ms epoch)
- MCP Compute (request): `{ symbol:string; interval:string; windows: IndicatorWindows; includeCandles?: boolean }`
- MCP Compute (response): `{ schemaVersion:'1.0'; symbol; interval; candles?: Candle[]; series: Record<string, (number|null)[]>; meta:{ warmup:number; source:string; generatedAt:number } }`
- MCP Stream event: `{ type:'kline'|'heartbeat'|'status'; symbol; interval; candle?: Candle & { closed:boolean }; deltas?: Record<string, number|null>; generatedAt:number }`

## 4) Hooks (Data + Streaming)
- `useSymbols()` — fetch `/symbols`; cache + staleWhileRevalidate.
- `useKlines({ symbol, interval, start?, end?, limit? })` — fetch historical candles; returns `{ candles, loading, error }`.
- `useIndicators({ symbol, interval, windows, includeCandles })` — POST `/indicators`; returns `{ candles, series, warmup }`.
- `useStream({ symbol, interval, indicators, closedOnly })` — connect SSE; yields an async iterator or callback subscription for KlineEvent; handles reconnect/backoff; exposes `pause/resume`.
- `useCombinedSeries({ candles, series, stream })` — merges stream deltas into in‑memory series; preserves warm‑ups and null semantics.
- `useUrlState()` — syncs UI state (symbol/interval/indicators) with URL params.

Notes:
- All hooks return typed data and stable functions; abort signals on unmount; backpressure via bounded queue.
- Idle tabs pause stream via `document.visibilityState` unless `keepLive=true`.

## 5) State Stores (Zustand)
- `useChartStore`: `{ symbol, interval, windows, overlays[], panes[], set() }`
- `useDataStore`: cache of candles and computed series keyed by `{symbol|interval|hash}`
- `useStreamStore`: map of subscriptions and metadata (lastT, status, errors)

Hash: SHA‑1 of JSON.stringify({windows}) with canonical key order.

## 6) Charting Primitives
- `ChartContainer`
  - Props: `{ candles: Candle[], height?: number, onCursor?: (info) => void }`
  - Manages lightweight‑charts instance; SSR‑safe dynamic import.
- `CandlesSeries`
  - Props: `{ candles, colorUp?, colorDown? }` — adds/updates OHLC series.
- `OverlayLine`
  - Props: `{ values: (number|null)[], color, title }` — adds indicator line overlay.
- `BandsArea`
  - Props: `{ upper: (number|null)[], lower: (number|null)[], color, opacity }` — BB/Donchian area.
- `MarkersLayer`
  - Props: `{ markers: { t:number; price:number; color:string; shape:'circle'|'arrowUp'|'arrowDown' }[] }`

All primitives accept `warmup` to hide pre‑warm values.

## 7) Composed Components
- `PriceChart`
  - Combines `ChartContainer` + `CandlesSeries` + overlays; props: `{ candles, overlays: OverlaySpec[], warmup }`.
- `IndicatorPane`
  - Separate chart for oscillator (RSI/MACD/PPO/PVO/CMF/MFI/etc.); props: `{ series: Record<string,(number|null)[]>, yRange?: [min,max], warmup }`.
- `Dashboard`
  - Layout with a price chart and N panes; symbol/interval pickers; indicator toggles; legends and live indicators.
- `StreamingBadge` — connection status; shows reconnect/backoff timing.

## 8) Overlay & Pane Specifications
- Overlays (price): SMA/EMA, BB (mavg/upper/lower), Ichimoku cloud (spanA/spanB), PSAR, Keltner, Donchian mid/width/%B.
- Panes (oscillators): RSI, MACD (line/signal/hist), PPO (line/signal/hist), PVO (line/signal/hist), Stoch %K/%D, CMF, MFI, UO, AO, ADX.

Config model (IndicatorWindows) mirrors MCP:
```
{
  macd?: { fast?: number; slow?: number; signal?: number };
  rsi?: { period?: number };
  atr?: { period?: number };
  stoch?: { k?: number; d?: number; smooth?: number };
  stochRsi?: { rsi?: number; k?: number; d?: number };
  bollinger?: { period?: number; stdev?: number };
  ppo?: { fast?: number; slow?: number; signal?: number };
  pvo?: { fast?: number; slow?: number; signal?: number };
  vwap?: { session?: 'day'|'continuous' };
}
```

## 9) Data Flow (Batch + Stream Merge)
1. On symbol/interval/windows change: call `useIndicators` to load batch series (and optionally candles).
2. Start `useStream` with requested `indicators` to get deltas on kline events.
3. `useCombinedSeries` merges deltas into working series:
   - Maintain `lastIndex` per indicator; for closed candles, append new values; for partial (if closedOnly=false), update in place.
   - Preserve null (NaN) entries and warmup offsets.
4. Repaint overlays and panes on each update; debounce if needed.

## 10) Performance & Stability
- Coalesce stream updates to rAF; bound queue size; drop partials before closed events.
- Lazy‑mount panes; virtualize large panes with windowed rendering.
- Use TypedArrays internally and convert to numbers for chart API.
- Guard against SSR mismatches; dynamic import chart code client‑side only.

## 11) Controls
- `SymbolSelect`: searchable select; loads from `/symbols`; remembers recent.
- `IntervalSelect`: choices like 1m, 5m, 15m, 1h, 4h, 1d; validates MCP intervals.
- `IndicatorPicker`: toggles for overlays/panes; parameters editor with presets.
- `LayoutToggles`: show/hide panes; full‑screen chart.
- `LegendBar`: shows live last values; color‑coded up/down.
- `ThemeSwitch`: dark/light; CSS variables.

## 12) Error Handling & UX
- Unified error boundary around data hooks.
- Toasts for provider/MCP connectivity issues; auto‑retry details.
- Empty states: no data, invalid params; suggest fixes.
- Loading states: skeletons and shimmer.

## 13) Testing Strategy
- Unit: hooks (mocks for MCP), merge logic, stores.
- Integration: render charts with stub data; verify overlays/panes render as expected.
- Visual regression: Storybook + Chromatic (optional).
- E2E: Playwright for critical flows (load, toggle indicators, live updates).

## 14) Pages (Next.js)
- `/` — Marketing/overview with CTA; basic live mini‑chart.
- `/playground` — Full dashboard; URL‑driven state.
- `/symbols/[symbol]` — Preconfigured view for a symbol.

## 15) MCP Client Library (UI)
- `createMcpClient(baseUrl: string, token?: string)`
  - Methods: `getSymbols()`, `getKlines()`, `computeIndicators()`, `streamKlines()` (SSE wrapper).
  - Handles auth headers, backoff, SSE disconnects, and JSON parsing; typed responses.

## 16) Accessibility & Internationalization
- Keyboard navigable controls; focus visuals; ARIA in pickers and legends.
- Locale‑aware formatting (Intl.NumberFormat) for prices and volumes; timezone handling.

## 17) Theming & Styling
- CSS variables for colors (up/down candles, overlays) and font sizes; theming via data‑theme attribute.
- Prefer tailwind plugin or CSS Modules for component styles.

## 18) Security
- If MCP token set, provide UI to store token in memory (not localStorage) with optional session cookie.
- CORS must allow app origin; document env setup.

## 19) Deliverables & Milestones
- M1: Hooks + MCP client + PriceChart (candles + EMA/SMA/BB overlays) + live streaming.
- M2: Indicator panes (RSI/MACD/PPO/PVO) + LegendBar + controls.
- M3: Full Dashboard page with URL state + Theme + symbol/interval pickers.
- M4: Stability hardening (reconnect tests, error boundaries), performance pass, and Storybook showcase.
- M5: Deploy (Vercel) + docs with usage examples.

## 20) Example Usage (pseudo‑code)
```
const { candles, series, warmup } = useIndicators({ symbol, interval, windows, includeCandles: true });
const { events, status } = useStream({ symbol, interval, indicators: windows, closedOnly: true });
const merged = useCombinedSeries({ candles, series, stream: events });

<Dashboard
  symbol={symbol}
  interval={interval}
  overlays={[{ id:'bb', type:'bollinger', period:20, stdev:2 }, { id:'psar', step:0.02, max:0.2 }]}
  panes={[{ id:'rsi', type:'rsi', period:14 }, { id:'macd', fast:12, slow:26, signal:9 }, { id:'ppo' }, { id:'pvo' }]}
  data={{ candles, series: merged.series, warmup }}
/>
```

## 21) Nice‑to‑Haves
- Multi‑symbol grid view with synced crosshair; watchlists.
- Strategy playground with simple rules (e.g., RSI < 30 + MACD cross) and backtest preview.
- Export/Share: generate shareable link with full configuration.

This spec balances an inspiring demo and a practical, reusable component library. It showcases trAIde + MCP + Binance working together in a way teams can lift directly into production‑grade apps.
