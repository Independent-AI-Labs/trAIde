# trAIder Technical Analysis Engine — Technical Notes

This document captures technical details for the trAIder core engine: indicator semantics, parity with Python `ta`, streaming calculators, and performance.

## Semantics & Parity
- Pandas EWM parity: indicators using EMA/EWM align with `adjust=false` semantics. Signals (e.g., MACD/PPO/PVO) use seeded EMA via `emaFrom` to match warm‑up.
- Warm‑up policy: functions return `NaN` until the window is satisfied; tests assert this alignment against fixtures.
- Wilder smoothing: RSI/ATR/ADX use RMA/Wilder’s smoothing (initial SMA, then recursive smoothing) matching `ta`.
- Rolling windows: Bollinger/Donchian/Ulcer use windowed statistics; performance‑optimized via deque helpers where applicable.

## Indicator Surface (selected)
- Trend: SMA, EMA, MACD (+signal/diff), TRIX, Mass Index, Ichimoku (+display helpers), STC, DPO, KST, Aroon, Vortex, PSAR
- Momentum: RSI, Stochastic, StochRSI (+%K/%D), KAMA, TSI, Ultimate Osc, Williams %R, Awesome Osc, PPO/PVO
- Volatility: ATR, Bollinger (mavg/high/low/width/%B + cross indicators), Keltner (original + EMA/ATR), Donchian, Ulcer Index
- Volume: OBV, ADL, CMF, Force Index, Ease of Movement (+SMA), VPT (+smoothed), NVI, MFI, VWAP, Chaikin Oscillator
- Others: Daily/Log/Cumulative Returns

## Streaming Calculators
Real‑time calculators produce the same sequences as batch functions while operating O(1)/tick.
- EMA/RSI/MACD/ATR/Stochastic/VWAP calculators: stateful classes mirroring batch warm‑up & smoothing.
- Incremental Ichimoku/PSAR can be added for live updates in UI.

## Performance
- Rolling extremes via deques (highest/lowest) for O(n) windows.
- NaN warm‑ups avoid incorrect early values; downstream consumers can choose fill‑na strategies.
- Browser‑friendly: pure TypeScript, no native addons.

## Testing & Coverage
- Fixture parity: CSVs from Python `ta` for indicator parity.
- Internal sanity/property tests: percentage bounds, monotonicity, internal consistency.
- Coverage: ~98% statements/lines, 100% functions, ~89% branches; gates enforced by CI.

