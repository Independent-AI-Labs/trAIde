/* eslint-disable no-console */
// Benchmark Binance REST and WS (and compare MCP/UI proxy) for klines
// Usage examples:
//   node scripts/bench_binance.mjs --symbols BTCUSDT,ETHUSDT,SOLUSDT --interval 1m --limit 60 --rest --mcp --ui --reps 5 --concurrency 6
//   BINANCE_REST_URL=https://api.binance.com BINANCE_WS_URL=wss://stream.binance.com/ws node scripts/bench_binance.mjs --ws --symbols BTCUSDT --interval 1m --ws-connections 3

import { WebSocket } from 'ws'

const REST = process.env.BINANCE_REST_URL || 'https://api.binance.com'
const WS = process.env.BINANCE_WS_URL || 'wss://stream.binance.com/ws'
const MCP = process.env.MCP_URL || 'http://localhost:62007'
const UI = process.env.UI_URL || 'http://localhost:62008'

function parseArgs(argv) {
  const out = { _: [] , flags: {} }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const [k, vRaw] = a.slice(2).split('=');
      let v = vRaw
      if (v == null) { const next = argv[i+1]; if (next && !next.startsWith('-')) { v = next; i++; } else v = true }
      out.flags[k] = v
    } else { out._.push(a) }
  }
  return out
}

function nowMs() { return performance.now() }
function stats(samples) {
  const arr = samples.filter((x) => Number.isFinite(x)).slice().sort((a,b) => a-b)
  const n = arr.length; const sum = arr.reduce((a,b)=>a+b,0)
  const pick = (p) => arr[Math.min(n-1, Math.max(0, Math.floor((p/100)*n)))] ?? NaN
  return { n, min: arr[0] ?? NaN, p50: pick(50), p90: pick(90), p99: pick(99), max: arr[n-1] ?? NaN, avg: n? sum/n : NaN }
}

async function benchRest({ symbols, interval, limit, reps, concurrency, target }) {
  const makeUrl = (sym) => {
    if (target === 'binance') return `${REST}/api/v3/klines?symbol=${sym}&interval=${interval}&limit=${limit}`
    if (target === 'mcp') return `${MCP}/klines?symbol=${sym}&interval=${interval}&limit=${limit}`
    if (target === 'ui') return `${UI}/api/mcp/klines?symbol=${sym}&interval=${interval}&limit=${limit}`
    throw new Error('unknown_target')
  }
  const jobs = []
  const latencies = []
  const errs = []
  async function runOne(sym) {
    for (let i=0;i<reps;i++) {
      const t0 = nowMs()
      try {
        const r = await fetch(makeUrl(sym), { cache: 'no-store' })
        if (!r.ok) throw new Error(`HTTP_${r.status}`)
        await r.arrayBuffer() // consume
        latencies.push(nowMs() - t0)
      } catch (e) {
        errs.push(String(e && e.message || e))
      }
    }
  }
  // simple limiter
  const queue = symbols.slice()
  const run = async () => { const s = queue.shift(); if (!s) return; await runOne(s); return run() }
  const workers = Array.from({ length: Math.min(concurrency, symbols.length) }, () => run())
  await Promise.all(workers)
  return { target, latencies, errs }
}

async function benchWs({ symbols, interval, connections = 1, timeoutMs = 10000 }) {
  const results = []
  for (const sym of symbols) {
    for (let i=0;i<connections;i++) {
      const topic = `${sym.toLowerCase()}@kline_${interval}`
      const url = `${WS}/${topic}`
      const t0 = nowMs()
      const p = new Promise((resolve) => {
        const ws = new WebSocket(url)
        let settled = false
        const to = setTimeout(() => { if (!settled) { settled = true; try { ws.close() } catch {}; resolve({ sym, ttfbMs: NaN, error: 'timeout' }) } }, timeoutMs)
        ws.on('message', (buf) => {
          if (settled) return
          try {
            const j = JSON.parse(buf.toString('utf8'))
            if (j && j.k) {
              settled = true
              clearTimeout(to)
              const ttfbMs = nowMs() - t0
              try { ws.close() } catch {}
              resolve({ sym, ttfbMs, error: null })
            }
          } catch {}
        })
        ws.on('error', () => { if (!settled) { settled = true; clearTimeout(to); resolve({ sym, ttfbMs: NaN, error: 'ws_error' }) } })
        ws.on('close', () => { /* ignore */ })
      })
      results.push(await p)
    }
  }
  const times = results.map(r => r.ttfbMs).filter(Number.isFinite)
  return { results, stats: stats(times) }
}

async function main() {
  const argv = parseArgs(process.argv.slice(2))
  const symbols = (argv.flags.symbols ? String(argv.flags.symbols) : 'BTCUSDT,ETHUSDT,SOLUSDT,BNBUSDT,ADAUSDT').split(',').map(s=>s.trim().toUpperCase()).filter(Boolean)
  const interval = String(argv.flags.interval || '1m')
  const limit = Number(argv.flags.limit || 60)
  const reps = Number(argv.flags.reps || 3)
  const concurrency = Number(argv.flags.concurrency || 6)
  const doRest = Boolean(argv.flags.rest || argv.flags.binance)
  const doMcp = Boolean(argv.flags.mcp)
  const doUi = Boolean(argv.flags.ui)
  const doWs = Boolean(argv.flags.ws)
  const wsConn = Number(argv.flags['ws-connections'] || 1)

  const out = { env: { REST, WS, MCP, UI }, interval, limit, reps, concurrency, symbols }
  if (doRest) {
    const bin = await benchRest({ symbols, interval, limit, reps, concurrency, target: 'binance' })
    out['rest_binance'] = { stats: stats(bin.latencies), errors: bin.errs.slice(0,5), errorsCount: bin.errs.length }
  }
  if (doMcp) {
    const m = await benchRest({ symbols, interval, limit, reps, concurrency, target: 'mcp' })
    out['rest_mcp'] = { stats: stats(m.latencies), errors: m.errs.slice(0,5), errorsCount: m.errs.length }
  }
  if (doUi) {
    const u = await benchRest({ symbols, interval, limit, reps, concurrency, target: 'ui' })
    out['rest_ui_proxy'] = { stats: stats(u.latencies), errors: u.errs.slice(0,5), errorsCount: u.errs.length }
  }
  if (doWs) {
    const ws = await benchWs({ symbols: symbols.slice(0, Math.min(5, symbols.length)), interval, connections: wsConn })
    out['ws_ttfb'] = { stats: ws.stats }
  }
  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })

