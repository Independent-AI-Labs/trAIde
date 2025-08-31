# Traide UI — React Component Inventory Spec
This document enumerates the React components (and key hooks) for the Traide SPA: landing + full TA platform, aligned with SPEC-UI.md. Each item lists role and core props. Components are grouped by feature for clarity. Names are stable; props may evolve.

Conventions
- Naming: PascalCase for components, `useX` for hooks, kebab for routes.
- Style: Tailwind + shadcn/ui + Radix primitives; dark-first.
- Charts: TradingView Lightweight Charts via wrappers in Chart components.
- Data: TanStack Query for REST; Zustand for app/store; SSE/WS stream adapter.

Key Shared Types (conceptual)
- `Kline`: `{ t:number, o:number, h:number, l:number, c:number, v:number }`
- `IndicatorPoint`: `{ t:number, value:number } | Record<string, number>`
- `StreamDelta`: `{ symbol:string, interval:string, t:number, ...fields }`
- `SymbolRef`: `{ id:string; exchange?:string } | string`

----------------------------------------

Layout & Shell
- AppShell: Top bar, sidebar, content area, toasts, modals; props `{ children }`
- HeaderBar: Logo, search, timeframe, auth; props `{ onSearch, actions? }`
- SidebarNav: Sections + watchlists; props `{ items, active }`
- ContentArea: Responsive container; props `{ padded?:boolean }`
- FooterBar: Links, status; props `{}`
- Modal, Drawer, Dialog: UI primitives; props per shadcn/ui
- ToastContainer: Global toasts; props `{}`
- Breadcrumbs: Path display; props `{ items }`

Common UI
- Button, IconButton, Toggle, Switch, Select, Tabs, Chip: primitives.
- Input, NumberInput, RangeSlider, ColorPicker, ComboBox: form controls.
- Tooltip, Popover, HoverCard: info surfaces.
- EmptyState: `{ title, description, action? }`
- ErrorState: `{ error, retry? }`
- LoadingState: `{ message? }`
- DataTable (VirtualTable): `{ columns, data, onSort }`
- VirtualList: `{ items, itemHeight, renderItem }`
- Pagination: `{ page, pageSize, total, onChange }`

Auth & Account
- AuthButtonGoogle: `{ size?, variant? }`
- AuthButtonX: `{ size?, variant? }`
- SignInDialog: `{ open, onOpenChange }`
- UserAvatarMenu: `{ user, onSignOut }`
- RequireAuth: gate for children; `{ fallback? }`
- ConsentBanner: `{ onAccept }`

Networking & Providers
- MCPProvider: base URLs, feature flags; `{ baseUrl, streamTransport }`
- StreamProvider: SSE/WS connection; `{ symbol, interval, enabled }`
- QueryProvider: wraps TanStack Query client; `{}`
- AnalyticsProvider: Plausible/PostHog; `{}`
- SentryBoundary: error boundary with Sentry; `{ children }`

Status & Telemetry
- StreamStatusBar: `{ connected, lagMs, region? }`
- LatencyMeter: `{ pingMs }`
- ConnectionIndicator: `{ status:'online'|'reconnecting'|'offline' }`
- ReconnectButton: `{ onClick, disabled? }`

Search & Symbol
- SymbolSearch (CmdK): `{ onSelect(SymbolRef) }`
- SymbolBadge: `{ symbol, exchange? }`
- TimeframeSwitch: `{ value, onChange, options }`
- MarketFilterBar: `{ query, onQuery, filters, onChange }`

Markets & Watchlists
- WatchlistPanel: `{ lists, activeListId, onSelectList }`
- Watchlist: `{ symbols:SymbolRef[], onAdd, onRemove, onReorder }`
- WatchlistItem: `{ symbol, last, changePct, sparkline }`
- MarketOverviewTable: `{ rows, onSort, onSelectSymbol }`
- Sparkline: `{ data:number[]|Kline[], color? }`
- AddSymbolDialog: `{ open, onAdd }`

Charting — Containers
- ChartWorkspace: orchestrates panes, overlays; `{ symbol, interval }`
- ChartContainer: main LW-Chart wrapper; `{ series, options }`
- Pane: resizable pane; `{ height, onResize }`
- PaneResizer: `{ onResize }`
- Toolbar: `{ left?, center?, right? }`
- ScreenshotButton: `{ targetRef }`
- LayoutManager: `{ layouts, onSave, onLoad }`
- SaveLayoutDialog: `{ open, onSave }`
- LoadLayoutDialog: `{ open, layouts, onLoad }`
- OverlayManager: `{ overlays, onToggle }`
- IndicatorConfigPanel: `{ configs, onChange }`
- IndicatorLegend: `{ items }`

Charting — Series (visual primitives)
- PriceSeries: candles; `{ data:Kline[], colorScheme? }`
- VolumeSeries: columns; `{ data:Kline[], color? }`
- EmaSeries: `{ data:IndicatorPoint[], period, color }`
- SmaSeries: `{ data:IndicatorPoint[], period, color }`
- RsiSeries: `{ data:IndicatorPoint[], overbought?, oversold?, color }`
- PpoSeries: `{ data:IndicatorPoint[], fast, slow, color }`
- PvoSeries: `{ data:IndicatorPoint[], fast, slow, color }`
- MacdSeries: `{ macd:IndicatorPoint[], signal:IndicatorPoint[], hist:IndicatorPoint[] }`
- VwapSeries: `{ data:IndicatorPoint[], color }`
- StochasticSeries: `%K/%D`; `{ k:IndicatorPoint[], d:IndicatorPoint[] }`
- AtrSeries: `{ data:IndicatorPoint[], color }`
- BollingerBandsSeries: `{ upper:IndicatorPoint[], mid:IndicatorPoint[], lower:IndicatorPoint[] }`
- IchimokuSeries: `{ tenkan, kijun, spanA, spanB, chikou }`
- CustomSeries: adapter for any series; `{ name, data, style }`

Charting — Controls & UX
- CrosshairTooltip: `{ dataPoint, seriesValues }`
- CursorSyncToggle: `{ enabled, onToggle }`
- GridToggle: `{ enabled, onToggle }`
- ScaleOptions: `{ mode, onChange }`
- ThemeToggle: `{ theme, onChange }`
- PaneVisibilityToggle: `{ paneId, visible, onToggle }`

Indicators — Config & Presets
- IndicatorsCatalog: `{ items, onAdd }`
- IndicatorItemCard: `{ name, tags, onSelect }`
- IndicatorParamsForm: generic; `{ schema, values, onChange }`
- IndicatorPresetList: `{ presets, onApply }`
- ColorTokenPicker: `{ value, onChange }`

Scanner (Screener)
- ScannerView: page container; `{}`
- RuleBuilder: `{ rules, onChange }`
- RuleRow: `{ left, operator, right, onChange, onDelete }`
- ConditionEditor: `{ field, comparator, value, onChange }`
- IndicatorSelector: `{ value, onChange }`
- UniverseSelector: `{ symbols, lists, onChange }`
- RunScanButton: `{ onRun, loading }`
- ResultsTable: virtualized results; `{ rows, columns }`
- SavePresetDialog: `{ open, onSave }`
- LoadPresetDialog: `{ open, presets, onLoad }`

Playground (Indicators & Parity)
- PlaygroundView: `{}`
- PlaygroundChart: `{ klines, overlays }`
- SeriesSelector: `{ series, onToggle }`
- ParamsForm: `{ schema, values, onChange }`
- CSVExportButton: `{ data, filename }`
- ParityStatusBadge: `{ status:'match'|'drift'|'error' }`
- ComputeModeSwitch: `{ mode:'client'|'server', onChange }`

Portfolio & Marketing
- HeroSection: `{ headline, subcopy, cta }`
- HeroChart: live mini-chart; `{ symbol, interval }`
- FeatureCard: `{ title, description, media }`
- BadgeBar: CI/build/coverage badges; `{ items }`
- RepoCard: `{ name, url, stars, lastUpdated }`
- PortfolioGrid: `{ items }`
- HowItWorksDiagram: `{}`
- CTASection: `{ title, action }`
- FooterLinks: `{ links }`

Docs & Blog
- DocCard: `{ title, excerpt, link }`
- MDXRenderer: `{ content }`
- CodeSnippet: `{ code, language }`
- ApiDemo: interactive fetch; `{ endpoint, payload }`
- BlogList: `{ posts }`
- BlogPost: `{ post }`

Settings
- SettingsView: `{}`
- ProfileForm: `{ user, onSave }`
- PreferencesForm: `{ values, onSave }`
- ThemeSwitcher: `{ value, onChange }`
- ApiKeysPanel (future): `{ keys, onRotate }`
- DataExportImport: `{ onExport, onImport }`

Legal & Misc Pages
- PrivacyPolicyPage, TermsPage: static content.
- NotFoundPage: `{}`

Hooks (key)
- useKlines: fetch/paginate klines; `(symbol, interval, range)`
- useIndicators: batch compute via MCP; `(symbol, interval, configs)`
- useStream: subscribe to SSE/WS; `(symbol, interval)`
- useMergedSeries: merge REST seed + stream deltas; `(klines, deltas)`
- useLatency: measure round-trip/lag; `()`
- useWatchlists: CRUD for watchlists; `()`
- useLayouts: CRUD for layouts; `()`
- useScanner: compile and run rules; `(rules, universe)`
- useAuth: session/user helpers; `()`

Routing Pages (Next.js suggested)
- HomePage `/`
- FeaturesPage `/features`
- DocsHub `/docs`
- PortfolioPage `/portfolio`
- PricingPage `/pricing` (stub)
- BlogIndex `/blog` (optional)
- BlogPostPage `/blog/[slug]`
- AppShellPage `/app`
- MarketsPage `/app/markets`
- ChartPage `/app/chart/[symbol]`
- ScannerPage `/app/scanner`
- PlaygroundPage `/app/playground`
- IndicatorsCatalogPage `/app/indicators`
- SettingsPage `/app/settings`
- Legal pages `/legal/terms`, `/legal/privacy`
- NotFound `/404`

Data Contracts (component-level expectations)
- Series components expect de-duped, time-ordered arrays; timestamps in ms.
- Stream merges are idempotent; late data patches update in place.
- All async components expose loading/empty/error states via Common UI.

Performance & Accessibility Notes
- Chart updates batched with requestAnimationFrame; limit reflows.
- Long lists virtualized; offscreen rendering minimized.
- Keyboard-first: Cmd+K search, focus management, ARIA roles.

Testing Strategy
- Unit: rendering/props for primitives and forms.
- Integration: chart container merges, stream handling, scanner rules.
- E2E (Playwright): load home with live mini-chart; `/app/chart` streaming.

Initial Component Scopes by Milestone
- M0: AppShell, HeaderBar, SidebarNav, HomePage, HeroChart, ChartWorkspace (basic), ChartContainer, PriceSeries, VolumeSeries, EmaSeries, RsiSeries, PpoSeries, Watchlist, SymbolSearch, TimeframeSwitch, StreamStatusBar, AuthButtons, UserAvatarMenu.
- M1: IndicatorConfigPanel, IndicatorLegend, LayoutManager, Save/Load dialogs, Playground core (PlaygroundChart, ParamsForm, ParityStatusBadge), more series (MacdSeries, PvoSeries, BollingerBandsSeries, VwapSeries, StochasticSeries, AtrSeries).
- M2: ScannerView + RuleBuilder suite, ResultsTable, PortfolioGrid enhancements, analytics and Sentry wrappers.
- M3: Settings forms, SEO polish components, error/empty states, performance passes.

Notes
- Keep visualization series thin wrappers over LW-Chart series; business logic stays in containers/hooks.
- Prefer generic forms with Zod schemas for indicator params to avoid one-off UIs.
- Co-locate feature components under `features/{feature}/` with index exports from `components/`.
