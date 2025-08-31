# trAIder — AI‑Ready Technical Analysis Toolkit

![trAIder banner](trAIde.png)

![CI](https://github.com/Independent-AI-Labs/trAIde/actions/workflows/ci.yml/badge.svg)
![coverage](https://img.shields.io/badge/coverage-98%25-brightgreen)
![types](https://img.shields.io/badge/types-TypeScript-blue)

TypeScript-first technical analysis indicators, a faithful port of Python `ta` with modern DX for Node.js and browsers. Pure functions, strict types, tree-shakable, with streaming calculators for real-time apps.

What is trAIder?
- An enterprise‑grade, TypeScript technical analysis toolkit built for AI workflows, modern web apps, and trading automation.
- Combines a comprehensive indicator engine, real‑time streaming calculators, React UI components (up next), and an MCP Server (up next) to plug indicators into LLM‑powered agents.

Business‑Ready Features
- Complete indicator coverage: trend, momentum, volatility, and volume signals with Python ta parity
- React UI components (incoming): chart overlays/panes (BB, Ichimoku, PSAR, RSI, MACD, PPO/PVO, MFI/CMF) for fast dashboards
- MCP Server (incoming): Model Context Protocol tools to expose indicators and data feeds to AI agents
- Real‑time: streaming calculators for low‑latency updates (EMA/RSI/MACD/ATR/Stochastic/VWAP)
- Proven parity + quality: fixture‑tested, ~98% coverage, strict types, tree‑shakable ESM/CJS builds
- Designed for the browser and Node: zero native deps, robust performance with deque‑based rolling windows

Install (Core)
```bash
npm install tats
```

Quickstart (Core Engine)
```ts
// Core package name is currently `tats` while the repo is trAIde.
// We’ll publish under the trAIder scope when packaging is finalized.
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

Quality & Parity
- Tests mirror Python `ta` fixtures where available; tolerances are tight
- Coverage: ~98% statements/lines, 100% functions, branches ~89%
- See docs/API.md for the full surface and examples

Indicator Coverage (selected)
- Trend: SMA, EMA, MACD (+signal/diff), TRIX, Mass Index, Ichimoku (+display helpers), STC, DPO, KST, Aroon, Vortex, PSAR
- Momentum: RSI, Stochastic, StochRSI (+%K/%D), KAMA, TSI, Ultimate Oscillator, Williams %R, Awesome Osc, PPO/PVO
- Volatility: ATR, Bollinger (mavg/high/low/width/%B + cross indicators), Keltner (original + EMA/ATR), Donchian, Ulcer Index
- Volume: OBV, ADL, CMF, Force Index, Ease of Movement (+SMA), VPT (+smoothed), NVI, MFI, VWAP, Chaikin Oscillator
- Others: Daily/Log/Cumulative Returns

Architecture Notes
- Core engine: pure, deterministic functions; warmup regions return `NaN` for alignment
- EWM/EMA semantics match pandas (adjust=false) to align with Python ta
- Performance: O(n) rolling min/max (deques), streaming calculators to avoid array churn

React UI Components (incoming)
- Headless hooks and presentational components for overlays/panes
- Built‑ins: BBands, Ichimoku Cloud (display helpers included), PSAR, RSI, MACD/PPO/PVO, ADX, MFI/CMF, OBV, VWAP
- Works with popular charting libs (e.g., lightweight‑charts) or custom canvas/SVG

MCP Server (incoming)
- Model Context Protocol server to expose trAIder indicators and market data as agent tools
- Example tools: compute indicators over historical klines, stream live updates, evaluate signals
- Enables LLM agents to reason over real‑time markets with structured, typed data

Docs
- API Reference: see docs/API.md

Roadmap (Near‑Term)
- Finalize parity sweep and defaults vs Python `ta`
- React UI component library for overlays/panes (hooks + components)
- MCP Server to integrate indicators into AI agents
- Demo app: historical + live Binance data (REST + WebSocket)
- Typedoc site, examples, and strategy cookbook

Contributing
- Run lint, typecheck, tests:
  ```bash
  npm run lint && npm run typecheck && npm test
  ```
- PRs welcome for additional fixtures, indicators, and docs.

License
- MIT
