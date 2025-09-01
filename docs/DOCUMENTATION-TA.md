# trAIde Technical Analysis Engine — Technical Notes

This document captures technical details for the trAIde core engine: indicator semantics, parity with Python `ta`, streaming calculators, and performance.

## Semantics & Parity
- EMA/EWM parity: indicators using EMA align with Pandas `adjust=false` semantics. Signals (MACD/PPO/PVO) use seeded EMA via an "EMA-from" warm‑start to match warm‑up.
- Warm‑up policy: functions return `NaN` until the window is satisfied; streaming calculators match batch warm‑ups.
- Wilder smoothing: RSI and ATR use RMA/Wilder’s smoothing (initial SMA, then recursive smoothing) matching `ta`.
- Rolling windows: Bollinger/Donchian/Ulcer use windowed statistics; deques used for rolling min/max in streaming versions.

## Indicator Surface (selected)
- Trend: SMA, EMA, MACD (+signal/diff), TRIX, Mass Index, Ichimoku (+display helpers), STC, DPO, KST, Aroon, Vortex, PSAR
- Momentum: RSI, Stochastic, StochRSI (+%K/%D), KAMA, TSI, Ultimate Osc, Williams %R, Awesome Osc, PPO/PVO
- Volatility: ATR, Bollinger (mavg/high/low/width/%B + cross indicators), Keltner (original + EMA/ATR), Donchian, Ulcer Index
- Volume: OBV, ADL, CMF, Force Index, Ease of Movement (+SMA), VPT (+smoothed), NVI, MFI, VWAP, Chaikin Oscillator
- Others: Daily/Log/Cumulative Returns

## Streaming Calculators
Real‑time calculators produce the same sequences as batch functions while operating O(1)/tick.
- Implemented: EMA, RSI, MACD, ATR, Stochastic, VWAP, PPO, PVO (see `src/calculators.ts`).
- Notes: seeded EMA (“EmaFrom”) ensures MACD/PPO/PVO signal parity; RSI uses equivalent alpha to Pandas EWM.
- Potential: incremental Ichimoku/PSAR for enhanced live overlays.

## Performance
- Rolling extremes via deques (highest/lowest) for O(n) windows.
- NaN warm‑ups avoid incorrect early values; downstream consumers can choose fill‑na strategies.
- Browser‑friendly: pure TypeScript, no native addons.

## Testing & Coverage
- Fixture parity: CSVs from Python `ta` for indicator parity (selected indicators); additional fixtures planned.
- Unit/property tests: percentage bounds, monotonicity, internal consistency, and math utility edge cases.
- Coverage: high coverage with Vitest + c8; CI enforces thresholds at the repo level.
