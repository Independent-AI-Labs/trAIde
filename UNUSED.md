UNUSED Components (WIP)

Purpose: Track components that appear unused or only referenced by other unused code, so we can safely remove, archive, or revive them with intent.

Methodology
- Heuristic grep for JSX tag/import usage across `apps/traide-ui/src`, excluding the component’s own file, followed by manual spot checks of pages (`app/**`) and tiles (`components/canvas/**`).
- This list is advisory. Confirm with product/UX before deletion.

Candidates
- apps/traide-ui/src/components/hero/HeroGlass.tsx
  - Not imported by pages or tiles.
- apps/traide-ui/src/components/hero/HeroChartLive.tsx
  - Only used by `HeroGlass`; therefore effectively unused.
- apps/traide-ui/src/components/landing/PlaygroundPanel.tsx
  - Not referenced in pages or tiles.
- apps/traide-ui/src/components/ui/SkeletonWave.tsx
  - No references across the app.
- apps/traide-ui/src/components/ui/HoloSpinner.tsx
  - No references across the app.
- apps/traide-ui/src/components/workspace/ChartWorkspace.tsx
  - Not used by pages or tile registry.
- apps/traide-ui/src/components/ui/SymbolInput.tsx (transitive)
  - Only referenced by `ChartWorkspace`; if that workspace remains unused, this becomes indirectly unused.

Notes
- Components under `components/canvas/**` (TileCanvas, ContextMenu, ComponentPalette, TilePanel) are used by landing/dashboard pages.
- Landing panels (Watchlist, StreamStatus, Scanner, Compare, Heatmap) are wired via TileCanvas.
- Core UI (FloatingHeader, LayoutsButton/Menu, EndpointControl, DataTable, Field, GroupSelect, IntervalSelect, IndicatorPicker, TickSelect, Toast, ChartModal, TickerModal, GlobalModalsHost, StatusPill) are referenced by pages or tiles and should be kept.

Proposed Actions
- Decide whether to remove or archive the above candidates. If keeping, add references (e.g., a demo route) or stories to prevent bit-rot.
- Optionally enable an advisory CI rule (`eslint-plugin-import/no-unused-modules`) to flag future unused exports.

Last reviewed: current commit.

