// Minimal HTTP + SSE server for live klines using Binance WS (CommonJS)
const http = require('http')
const { WebSocket } = require('ws')

const BINANCE_REST = process.env.BINANCE_REST_URL || 'https://api.binance.com/api/v3'

const PORT = Number(process.env.PORT || 62007)
const CORS = (process.env.MCP_CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)

function allowOrigin(origin) {
  if (!origin) return false
  if (CORS.length === 0) return true
  if (CORS.includes('*')) return true
  return CORS.includes(origin)
}

function sse(res, corsValue) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  }
  if (corsValue) headers['Access-Control-Allow-Origin'] = corsValue
  res.writeHead(200, headers)
  res.write('\n')
}

function streamKlines(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const symbol = (url.searchParams.get('symbol') || 'BTCUSDT').toLowerCase()
  const interval = url.searchParams.get('interval') || '1m'
  const topic = `${symbol}@kline_${interval}`
  const wsUrl = (process.env.BINANCE_WS_URL || 'wss://stream.binance.com/ws') + `/${topic}`
  const ws = new WebSocket(wsUrl)
  let alive = true
  // structured log: stream start
  console.log(JSON.stringify({ level: 'info', msg: 'sse_open', symbol, interval, topic }))
  ws.on('message', (buf) => {
    try {
      const msg = JSON.parse(buf.toString('utf8'))
      const k = msg.k
      if (!k) return
      // shape to match our MCP stream format
      const evt = {
        type: 'kline',
        symbol: msg.s || symbol.toUpperCase(),
        interval: k.i || interval,
        candle: { t: k.t, o: Number(k.o), h: Number(k.h), l: Number(k.l), c: Number(k.c), v: Number(k.v) },
        closed: Boolean(k.x),
      }
      res.write(`data: ${JSON.stringify(evt)}\n\n`)
    } catch {}
  })
  ws.on('close', () => { if (alive) { console.log(JSON.stringify({ level: 'info', msg: 'ws_close', symbol, interval })); res.end() } })
  ws.on('error', (e) => { if (alive) { console.log(JSON.stringify({ level: 'error', msg: 'ws_error', symbol, interval })); res.end() } })
  req.on('close', () => { alive = false; try { ws.close() } catch {} })
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const origin = req.headers.origin
  const allowAll = CORS.length === 0 || CORS.includes('*')
  if (allowAll) {
    res.setHeader('Access-Control-Allow-Origin', '*')
  } else if (origin && allowOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  }
  if (req.method === 'OPTIONS') { res.writeHead(204); return void res.end() }

  if (req.method === 'GET' && url.pathname === '/health') {
    // ensure CORS header set for /health too
    if (allowAll) res.setHeader('Access-Control-Allow-Origin', '*')
    else if (origin && allowOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin)
    res.writeHead(200, { 'content-type': 'application/json' })
    return void res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), version: 'mini-0.1.0', provider: 'binance' }))
  }
  if (req.method === 'GET' && url.pathname === '/stream/klines') {
    // include CORS header directly on SSE response
    const corsVal = allowAll ? '*' : (origin && allowOrigin(origin) ? origin : undefined)
    sse(res, corsVal)
    return void streamKlines(req, res)
  }
  if (req.method === 'GET' && url.pathname === '/klines') {
    const symbol = (url.searchParams.get('symbol') || 'BTCUSDT').toUpperCase()
    const interval = url.searchParams.get('interval') || '1m'
    const limit = Math.max(1, Math.min(1000, Number(url.searchParams.get('limit') || 200)))
    const qs = new URLSearchParams({ symbol, interval, limit: String(limit) }).toString()
    const restUrl = `${BINANCE_REST}/klines?${qs}`
    ;(async () => {
      try {
        const t0 = Date.now()
        const r = await fetch(restUrl, { cache: 'no-store' })
        if (!r.ok) throw new Error('upstream_error')
        const rows = await r.json()
        const candles = Array.isArray(rows)
          ? rows.map((row) => ({
              t: row[0],
              o: Number(row[1]),
              h: Number(row[2]),
              l: Number(row[3]),
              c: Number(row[4]),
              v: Number(row[5]),
            }))
          : []
        const body = { symbol, interval, limit: candles.length, latencyMs: Date.now() - t0, candles }
        console.log(JSON.stringify({ level: 'info', msg: 'klines_fetch', symbol, interval, limit: candles.length, ms: Date.now() - t0 }))
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(body))
      } catch (e) {
        console.log(JSON.stringify({ level: 'error', msg: 'klines_error', symbol, interval }))
        res.writeHead(502, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: 'binance_fetch_failed' }))
      }
    })()
    return
  }
  res.writeHead(404, { 'content-type': 'application/json' })
  res.end(JSON.stringify({ error: 'not_found' }))
})

server.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`Mini MCP HTTP listening on :${PORT}`)
})
