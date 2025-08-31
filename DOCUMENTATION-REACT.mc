# trAIde React UI — Technical Notes

Incoming headless hooks and components for building trading dashboards quickly.

## Components (planned)
- ChartProvider: context for data + indicator params
- Overlays: BollingerBands, IchimokuCloud, PSAR, Donchian, Keltner
- Panes: RSI, MACD/PPO/PVO, ADX, MFI/CMF, OBV, TSI, StochRSI
- Widgets: ParameterPanel, SymbolSelector, IntervalSelector

## Hooks (planned)
- useKlines({ symbol, interval, lookback }): historical candles
- useLiveKline({ symbol, interval }): WebSocket live updates
- useIndicators({ close, high, low, volume, params }): compute series (batch or incremental)
- useStreamingCalculators(): wrapper over engine calculators for low‑latency updates

## Rendering
- Works with lightweight‑charts or custom canvas/SVG renderers
- Emphasis on performance: memoized series, off‑main‑thread options (e.g., web workers)

## Theming & State
- Theme‑ready components; controlled/ uncontrolled props
- Persist UI params to URL for shareable links
