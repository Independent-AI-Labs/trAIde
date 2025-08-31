# trAIde — AI‑Ready Technical Analysis Toolkit

![trAIde banner](trAIde.png)

![CI](https://github.com/Independent-AI-Labs/trAIde/actions/workflows/ci.yml/badge.svg)
![coverage](https://img.shields.io/badge/coverage-98%25-brightgreen)
![types](https://img.shields.io/badge/types-TypeScript-blue)

TypeScript-first technical analysis indicators, a faithful port of Python `ta` with modern DX for Node.js and browsers. Pure functions, strict types, tree-shakable, with streaming calculators for real-time apps.

What is trAIde?
- 🚀 Enterprise‑grade technical analysis for TypeScript — built for AI workflows, modern web apps, and trading automation.
- 🧠 Combines a comprehensive indicator engine, real‑time streaming calculators, React UI components (incoming), and an MCP Server (incoming) to power LLM‑driven agents and dashboards.

Why teams choose trAIde
- 📦 Comprehensive indicators: trend, momentum, volatility, volume — aligned with Python ta
- ⚡ Real‑time: streaming calculators for low‑latency updates
- 🧩 React UI (incoming): drop‑in overlays/panes for rapid dashboards
- 🤖 MCP Server (incoming): Model Context Protocol to expose tools to AI agents
- ✅ Quality: parity‑tested vs fixtures, ~98% coverage, strict types, tree‑shakable builds
- 🌐 Browser + Node: zero native deps; fast deque‑based rolling windows

Install (Core)
```bash
npm install traide
```

Links & Technical Docs
- 📘 Technical Analysis Engine: DOCUMENTATION-TA.md
- 🧩 React UI Components: DOCUMENTATION-REACT.mc
- 🤝 MCP Server (Model Context Protocol): DOCUMENTATION-MCP.md
Core package name is currently `tats` while the repo is trAIde. We’ll publish under the trAIde scope when packaging is finalized.

Quality & Parity
- 🧪 Tests mirror Python `ta` fixtures; tight tolerances
- 📈 Coverage: ~98% statements/lines, 100% functions, ~89% branches
- 📚 Full surface and examples: docs/API.md

Indicator Coverage (selected)
- Trend: SMA, EMA, MACD (+signal/diff), TRIX, Mass Index, Ichimoku (+display helpers), STC, DPO, KST, Aroon, Vortex, PSAR
- Momentum: RSI, Stochastic, StochRSI (+%K/%D), KAMA, TSI, Ultimate Oscillator, Williams %R, Awesome Osc, PPO/PVO
- Volatility: ATR, Bollinger (mavg/high/low/width/%B + cross indicators), Keltner (original + EMA/ATR), Donchian, Ulcer Index
- Volume: OBV, ADL, CMF, Force Index, Ease of Movement (+SMA), VPT (+smoothed), NVI, MFI, VWAP, Chaikin Oscillator
- Others: Daily/Log/Cumulative Returns

Architecture at a glance

```mermaid
graph LR
  B1[Binance REST] --> E[Core Engine]
  B2[Binance WS] --> E
  O[Other Feeds] --> E
  E --> UI[React UI incoming]
  E --> APPS[Dashboards and Apps]
  B1 --> MCP[MCP Server incoming]
  B2 --> MCP
  MCP --> AGENTS[AI Agents and LLMs]
```

MCP Server interaction

```mermaid
sequenceDiagram
  participant APP as App/Agent
  participant MCP as trAIde MCP
  participant DATA as Data Source
  participant CORE as Indicator Engine

  APP->>MCP: compute_indicators(symbol, interval, windows)
  MCP->>DATA: fetch klines
  DATA-->>MCP: candles
  MCP->>CORE: run indicators
  CORE-->>MCP: results
  MCP-->>APP: structured signals/series

  APP->>MCP: stream_klines(symbol@interval)
  MCP->>DATA: subscribe WS
  DATA-->>MCP: live updates
  MCP->>CORE: incremental compute
  MCP-->>APP: live signals
```

Docs
- 📘 API reference: docs/API.md
- 🔬 Engine details: DOCUMENTATION-TA.md
- 🧩 React library: DOCUMENTATION-REACT.mc
- 🤝 MCP server: DOCUMENTATION-MCP.md

Roadmap (Near‑Term)
- ✅ Finalize parity sweep and defaults vs Python `ta`
- 🧩 React UI component library (overlays/panes, hooks)
- 🤝 MCP Server to integrate indicators with AI agents
- 📊 Demo app: historical + live Binance (REST + WebSocket)
- 📚 Typedoc site, examples, strategy cookbook

Contributing
- Run lint, typecheck, tests:
  ```bash
  npm run lint && npm run typecheck && npm test
  ```
- PRs welcome for additional fixtures, indicators, and docs.

License
- MIT

Stargazers over time

[![Star History Chart](https://api.star-history.com/svg?repos=Independent-AI-Labs/trAIde&type=Date)](https://star-history.com/#Independent-AI-Labs/trAIde&Date)
