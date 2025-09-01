# trAIde TODO — UX & UI Phase 2

Owner: Product/UX with input from trading/quant users
Goal: Ship a pro-grade trading UI with a tile-based canvas, configurable components, a powerful charting experience, and streamlined workflows for symbol/indicator selection.

## 1) Tile‑Based Canvas (Panels)

Objectives
- Flexible, composable workspace where users arrange multiple panels (chart, orderbook, watchlist, scanner, notes, metrics) on a grid/canvas.
- Persisted layouts with quick switching (e.g., Day Trade, Swing, Research).

Core Requirements
- Layout system: grid + freeform hybrid.
  - Grid snapping, drag‑to‑reorder, resize handles (N/S/E/W + corners), minimum/maximum sizes.
  - Docking zones and ghost previews during drag.
  - Responsive behavior: breakpoint‑aware column counts and tile break rules.
- Panel shell: common chrome for all panels.
  - Header: title, icon, instance selector, context actions/menu (⋮), collapse/expand, close.
  - Toolbar zone: per‑panel controls (e.g., timeframe, overlays) with overflow handling.
  - Footer/status: connection status, last update, latency.
  - Keyboard: panel focus, move, resize (arrow + modifiers), bring to front.
- Persistence:
  - Save/rename/delete layouts locally; optional cloud sync later.
  - Import/export JSON layouts; default starter layouts bundled.
- Performance:
  - Virtualized rendering for off‑screen panels; pause heavy panels when hidden.
  - rAF‑batched UI updates; CSS transforms for smooth drag.

Deliverables
- `TileCanvas` (grid manager), `TilePanel` (shell), `TileResizeHandle`, `DockOverlay`.
- Layout store (Zustand): `{ tiles[], selectedTileId, layouts[] }` with undo/redo.
- Layout serialization format with versioning.

Panel Groups & Containers (New)
- Generic container panels (e.g., Watchlist, Playground) can host other components as children.
- Drag to group: drop a tile onto a container to nest it; visual drop indicators and smooth animation.
- Move between containers: context action “Move to…”, plus drag‑out to ungroup.
- Group via menu: multi‑select tiles → “Group into Panel…”.
- Container toolbar exposes “Ungroup all”, “Rename”, and quick layout presets for child arrangement.

Acceptance Criteria
- Nesting/ungrouping is fluid with clear affordances; no layout thrash.
- Moving tiles between containers preserves panel state and sizes.
- Keyboard support: multi‑select + group/ungroup via shortcuts.

Acceptance Criteria
- Drag, reorder, resize with snap and visual previews.
- Panel header with title/actions; collapse/expand; close restores layout gracefully.
- Layouts persist across reloads; quick-switch menu works.

## 2) Configurable, User‑Friendly Components

Objectives
- Make core inputs discoverable and ergonomic for trading speed and accuracy.

Ticker & Pair Inputs
- Replace free‑text with a proper Symbol/Pairs selector.
  - Searchable dropdown with exchange/source badges; keyboard‑first (↑/↓/Enter).
  - Filters: exchange, asset class, quote (e.g., USDT, USD, BTC), favorites/starred.
  - Normalization: validate formats (e.g., `BTCUSDT`, `BTC/USDT` → canonical); recent selections.
  - Pairs view: base/quote split with dependent dropdowns; popular lists.

Timeframe & Session Controls
- Dropdown with fast presets (1m/5m/15m/1h/4h/1D) + custom.
- Multi‑select for multi‑pane comparisons.
- Session boundaries, RTH/ETH toggle (if data permits), log/linear scale toggle.

Indicator Configuration
- Unified Indicator Picker with search, categories (Trend/Momentum/Volatility/Volume), and presets.
- Parameter editor per indicator with sane defaults and validation.
- Global options: warm‑up visibility, `fillNa` behavior, color presets.
- Favorite indicators; per‑symbol indicator bundles.

Data/Stream Controls
- Endpoint selector (MCP base) with health status; remember per‑layout.
- Live toggle, closed‑only vs partial updates; reconnect/backoff display.

Acceptance Criteria
- All key inputs are keyboard‑navigable with visible focus and ARIA roles.
- Selections validate and normalize; error states are clear with fixes suggested.

## 3) Common Selection Views

Symbol Selector (Modal/Popover)
- Tabs: Symbols, Pairs, Watchlists, Recent, Favorites.
- Search with fuzzy match; filters (exchange, asset class, quote currency).
- Result table: symbol, name, exchange, last, change %, volume; virtualized.

Pairs Builder
- Base dropdown then constrained Quote dropdown; show available markets count; invert button.

Indicator Catalog
- Cards/list with name, tags, short description; parity badge (Core/Client/MCP).
- Presets (e.g., RSI 14, RSI 7; MACD classic; BB 20/2); preview sparkline.

Acceptance Criteria
- Unified look/feel and keyboard shortcuts across selectors.
- Selection immediately updates bound tiles and persists to layout state.

## 4) Advanced Chart (Lightweight Charts)

Objectives
- Deliver a pro charting experience leveraging Lightweight Charts; maximize TA overlays/panes.

Features
- Multi‑pane layout: price + N indicator panes; linked crosshair/time scale.
- Overlays (price): EMA/SMA, BB, Ichimoku cloud, PSAR, Keltner, Donchian, VWAP.
- Panes (oscillators): RSI, MACD (line/signal/hist), PPO/PVO, Stoch %K/%D, CMF, MFI, UO, AO, ADX.
- Compare: overlay multiple symbols (percent or price); per‑series color/style.
- Scale & axes: log/linear toggle, autoscale by series, Y‑axis ranges per pane.
- Tools & UX: crosshair readout, measure tool, snap to OHLC, tooltip/legend with last values.
- Data handling: REST seed + SSE deltas merge; gap fill on reconnect; partial candle updates.
- Appearance: theme tokens, color presets, opacity sliders; screenshot/export PNG.
- Performance: rAF batch updates, decimation for dense overlays, paused updates when off‑screen.

Constraints & Extensions
- Drawing tools are limited in Lightweight Charts; consider lightweight custom annotations (levels/lines) or future integration with a drawing overlay.

Acceptance Criteria
- Indicator render parity (batch vs stream) for supported set.
- Smooth panning/zooming with stable 60 FPS on typical datasets.
- Layout save/restore preserves series, colors, and pane configuration.

Deliverables
- `ChartContainer` v2 (multi‑pane, series manager, legend bar).
- Overlay/Panes registry with typed specs and parameter schemas (Zod).
- Screenshot/export utility; compare series adapter; autoscale helpers.

## 5) Quality of Life & UX Improvements

Global
- Command Palette (⌘K): jump to symbols, layouts, indicators, actions.
- Keyboard shortcuts: timeframe (1/2/3/4/5/6), toggle overlays (o), add indicator (i), save layout (⌘S), screenshot (⌘⇧S).
- Theme system: dark/light with CSS variables; high‑contrast mode.
- A11y: focus rings, ARIA roles, reduced motion, screen reader labels.

Data & State
- Autosave layouts; versioned migrations on shape changes.
- Import/export layouts and indicator presets as JSON.
- Optimistic UI for panel moves/resizes; visual diff when restoring.

Feedback & Observability
- Latency/stream status pill; endpoint health check indicator.
- Inline errors with retry actions; non‑blocking toasts.
- Analytics events: symbol change, timeframe change, indicator add/remove, layout switch (privacy‑friendly).

Performance
- Virtualize long lists (watchlist/scanner); offscreen pause; memoized series transforms.
- rAF batching for stream ticks; avoid layout thrash on resize by using transforms.

## 6) Technical Plan & Milestones

M0 — Canvas Foundations (1–2 weeks)
- Implement `TileCanvas` + `TilePanel` with drag/resize and persistence.
- Convert existing pages (Chart, Watchlist, Stream Status) into panels.

M1 — Selectors & Config (1–2 weeks)
- Ship Symbol/Pairs Selector and unified Indicator Catalog with presets.
- Wire panel toolbars for chart (timeframe, overlays) and watchlist.

M2 — Chart v2 (2–3 weeks)
- Multi‑pane chart with overlays/panes registry; legend bar; compare series.
- SSE merge stabilization and performance pass.

M3 — QoL & Polish (1–2 weeks)
- Command palette, shortcuts, screenshot/export, autosave layouts.
- A11y pass and error states.

## 7) Context Menu & Component Palette (Right‑Click “New…”) 

Objectives
- Enable users to right‑click anywhere on the canvas to add new panels/components, supporting fast dashboard composition.

Requirements
- Right‑click context menu on the `TileCanvas` background and on empty space within a panel group.
- Menu items:
  - New… → opens Component Palette (modal/popover) with searchable list of available components (Chart, Watchlist, Stream Status, Scanner, Heatmap, Compare, Notes, UX Gallery, Custom/External).
  - Layout → Save As…, Load…, Reset to Default.
  - View → Toggle grid, Snap to grid, Show rulers (optional).
  - Paste (if a tile has been copied), Duplicate (when invoked on a tile).
- Component Palette:
  - Search + categories; keyboard navigation; preview thumbnail when possible.
  - On select, spawn a new `TilePanel` at click position (or nearest free slot), focused and selected.
  - UX Gallery appears here as a selectable component (no separate page). 

Deliverables
- `ContextMenu` component with accessible keyboard controls.
- `ComponentPalette` with registry‑driven items and thumbnails.
- Tile spawn logic (placement, focus, undo/redo entry).

Acceptance Criteria
- Right‑click opens a menu with New…; selecting a component creates a panel at the intended location.
- UX Gallery is available as a component in the palette; standalone Demo/UX pages removed.

## 8) SPA Navigation & Cleanup

Objectives
- Provide a smooth single‑page application experience; remove redundant routes and expose functionality via panels/components.

Requirements
- Remove “Open Demo View” and “Open UX Gallery” links from the landing page.
- Retire `/app/demo` and `/app/ux` pages; re‑introduce their functionality as palette‑spawned panels (e.g., “Gallery”, “Demo Showcase”).
- Ensure deep‑linking to dashboard state via URL params (symbol, timeframe, layout id), but keep interactions SPA‑local (no full navigations).
- Global shell retains lightweight marketing home `/`; main app under `/app` behaves as SPA with in‑memory routing/state.

Acceptance Criteria
- Creating/arranging panels stays within the SPA; no full page reloads.
- Gallery/Demo are accessible via right‑click New… and spawn as panels.

## 7) Non‑Functional Requirements
- Accessibility: WCAG AA targets for focus/contrast/keyboard navigation.
- Performance: initial load TTI < 2.5s on P75; steady‑state chart updates ≤16ms/frame P95.
- Reliability: SSE reconnect within 5s P95; state recovered after reload.
- Internationalization ready for number/date formatting.

## 8) Tracking & Acceptance
- Create issues per deliverable with `area:ui`, `kind:ux`, `kind:perf`, `kind:a11y` labels.
- Define end‑to‑end happy paths for: “Add symbol → add indicators → rearrange panels → save layout → reload”.
