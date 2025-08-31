# TATS — Technical Analysis for TypeScript

TATS is a TypeScript-first port of the popular Python `ta` library. It provides tree-shakable, pure functions for common indicators and is designed for modern TS/JS use in Node.js and the browser.

Status: Early MVP covering high-use indicators with tests mirroring Python `ta` fixtures.

## Install

```bash
npm install tats
```

## Usage

```ts
import { trend, momentum, volatility, volume } from 'tats';

const close = [/* numbers */];
const high = [/* numbers */];
const low = [/* numbers */];
const vol = [/* numbers */];

// Trend
const sma20 = trend.smaIndicator(close, 20);
const ema12 = trend.emaIndicator(close, 12);
const macdLine = trend.macd(close, 26, 12);
const macdSig = trend.macdSignal(close, 26, 12, 9);
const macdHist = trend.macdDiff(close, 26, 12, 9);
const cci20 = trend.cci(high, low, close, 20);

// Momentum
const rsi14 = momentum.rsi(close, 14);
const { k, d } = momentum.stochastic(high, low, close, 14, 3);

// Volatility
const atr14 = volatility.atr(high, low, close, 14);
const bbM = volatility.bollingerMavg(close, 20);
const bbH = volatility.bollingerHband(close, 20, 2);
const bbL = volatility.bollingerLband(close, 20, 2);

// Volume
const obv = volume.onBalanceVolume(close, vol);
```

## Design Notes

- Pure, array-in/array-out functions returning `NaN` for warmup periods.
- Wilder smoothing for RSI/ATR/ADX to match Python `ta` behavior.
- ESM + CJS exports with bundled type definitions.
- Tree-shakable and framework-agnostic; works in Node and browsers.

## Testing

The test suite uses CSV fixtures from Python `ta` and validates numeric parity within a small tolerance.

```bash
npm test
```

## Roadmap

- Add remaining indicators (PSAR, KST, TSI, MFI, etc.)
- Stream/stateful calculators for real-time updates
- Benchmarks and docs site

