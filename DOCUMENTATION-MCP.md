# trAIde MCP Server — Technical Notes

The Model Context Protocol (MCP) server exposes trAIde’s indicators and market data as structured tools for AI agents and services.

## Goals
- Expose historical computations and live streams via typed tools
- Provide stable schemas for candles, indicators, and signals
- Support low‑latency incremental updates for live trading contexts

## Core Tools (proposed)
- `compute_indicators`:
  - Input: `{ symbol, interval, start?, end?, windows: { macd?: {...}, rsi?: {...}, ... } }`
  - Output: `{ candles, series: { macd, signal, diff, rsi, ... } }`
- `stream_klines`:
  - Input: `{ symbol, interval }`
  - Output: streaming events `{ candle, indicators? }` (opt‑in incremental compute)
- `list_symbols`:
  - Output: `{ symbols: string[] }`

## Data Sources
- Binance REST: `GET /api/v3/klines` for historical candles
- Binance WS: `wss://stream.binance.com/ws/{symbol}@kline_{interval}` for live updates

## Schemas (sketch)
- Candle: `{ t:number, o:number, h:number, l:number, c:number, v:number }`
- Series: arrays aligned to candle indices, `NaN` for warm‑ups
- Errors: typed codes + messages; partial results permitted

## Incremental Compute
- Maintain per‑symbol state for streaming calculators (EMA/RSI/MACD/ATR/Stoch/VWAP)
- On each kline close, update calculators and publish deltas

## Security & Ops
- Rate limiting/throttling; configurable concurrency
- Health endpoints and basic telemetry
- Deployment: Node server or serverless functions
