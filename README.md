# TATS — Technical Analysis for TypeScript

TypeScript-first technical analysis indicators, a faithful port of Python `ta` with modern DX for Node.js and browsers. Pure functions, strict types, tree-shakable, with streaming calculators for real-time apps.

Highlights
- Pure, array-in/array-out APIs with `NaN` warmups, matching Python `ta` semantics
- ESM + CJS + types, zero runtime deps, tree-shakable
- Parity-verified against Python `ta` CSV fixtures (98%+ coverage)
- Streaming calculators for EMA/RSI/MACD/ATR/Stochastic/VWAP
- Ichimoku display helpers (forward spans, chikou) and Bollinger cross indicators

Install
```bash
npm install tats
```

Quickstart
```ts
import { trend, momentum, volatility, volume, returns, calculators } from 'tats';

const close = [/* numbers */];
const high = [/* numbers */];
const low  = [/* numbers */];
const vol  = [/* numbers */];

// Trend
const macd   = trend.macd(close, 26, 12);
const signal = trend.macdSignal(close, 26, 12, 9);
const diff   = trend.macdDiff(close, 26, 12, 9);

// Momentum
const rsi14 = momentum.rsi(close, 14);
const stoch = momentum.stochastic(high, low, close, 14, 3);
const kRSI  = momentum.stochRsiK(close, 14, 3);
const dRSI  = momentum.stochRsiD(close, 14, 3, 3);

// Volatility
const { m: kcM, h: kcH, l: kcL } = volatility.keltnerChannel(high, low, close, 20, 10);
const ui14 = volatility.ulcerIndex(close, 14);
const bbUp = volatility.bollingerHbandIndicator(close, 20, 2); // 1 when > upper band

// Volume
const obv  = volume.onBalanceVolume(close, vol);
const cmf  = volume.chaikinMoneyFlow(high, low, close, vol, 20);
const cho  = volume.chaikinOscillator(high, low, close, vol, 3, 10);

// Returns
const ret  = returns.dailyReturn(close);

// Streaming (EMA example)
const ema = new calculators.EmaCalc(12);
const emaSeq = close.map(c => ema.update(c));
```

Coverage & Parity
- Tests mirror Python `ta` fixtures where available; tolerances are tight.
- Coverage: ~98% statements/lines, 100% functions, branches ~89%.
- See docs/API.md for the full surface and examples.

Indicator Coverage (selected)
- Trend: SMA, EMA, MACD (+signal/diff), TRIX, Mass Index, Ichimoku (+display helpers), STC, DPO, KST, Aroon, Vortex, PSAR
- Momentum: RSI, Stochastic, StochRSI (+%K/%D), KAMA, TSI, Ultimate Oscillator, Williams %R, Awesome Osc, PPO/PVO
- Volatility: ATR, Bollinger (mavg/high/low/width/%B + cross indicators), Keltner (original + EMA/ATR), Donchian, Ulcer Index
- Volume: OBV, ADL, CMF, Force Index, Ease of Movement (+SMA), VPT (+smoothed), NVI, MFI, VWAP, Chaikin Oscillator
- Others: Daily/Log/Cumulative Returns

Design Notes
- Pure functions; no hidden state. Warmup regions return `NaN` to maintain alignment.
- EMA/EWM semantics match pandas (adjust=false) where applicable.
- Fast rolling min/max via deque-based `highest/lowest` utilities.

Docs
- API Reference: see docs/API.md

Roadmap
- Parity sweep to lock signatures/defaults vs Python `ta`
- Streaming calculators for additional indicators as needed
- Typedoc site with examples and cookbook
- Interactive React demo (historical + live Binance data)

Contributing
- Run lint, typecheck, tests:
  ```bash
  npm run lint && npm run typecheck && npm test
  ```
- PRs welcome for additional fixtures, indicators, and docs.

License
- MIT
