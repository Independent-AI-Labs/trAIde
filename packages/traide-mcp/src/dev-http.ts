import { loadConfig } from './config.js'
import { BinanceProvider } from './providers/binance.js'
import { startHttpServer } from './http.js'
import { logger } from './logger.js'

async function main() {
  const cfg = loadConfig()
  const provider = new BinanceProvider(cfg.binanceRestUrl, cfg.binanceWsUrl, {
    replayCandles: cfg.wsReplayCandles,
    backoffBaseMs: cfg.backoffBaseMs,
    backoffMaxMs: cfg.backoffMaxMs,
    heartbeatMs: cfg.heartbeatMs,
  })
  startHttpServer(provider)
  logger.info(`HTTP only server started on :${cfg.port}`)
}

main().catch((err) => {
  logger.error('Fatal', { err: String(err) })
  process.exit(1)
})

