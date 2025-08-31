import { loadConfig } from './config.js';
import { logger } from './logger.js';
import { BinanceProvider } from './providers/binance.js';
import { startHttpServer } from './http.js';
import { createMcpServer } from './mcp.js';

async function main() {
  const cfg = loadConfig();
  const provider = new BinanceProvider(cfg.binanceRestUrl, cfg.binanceWsUrl, {
    replayCandles: cfg.wsReplayCandles,
    backoffBaseMs: cfg.backoffBaseMs,
    backoffMaxMs: cfg.backoffMaxMs,
    heartbeatMs: cfg.heartbeatMs,
  });

  // Start HTTP if enabled
  startHttpServer(provider);

  // Start MCP stdio server
  const server = createMcpServer(provider);
  await server.start();
  logger.info('MCP stdio server started');
}

// Only run if executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    logger.error('Fatal error', { err: String(err) });
    process.exit(1);
  });
}

export {}; // keep as module
