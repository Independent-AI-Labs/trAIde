import { loadConfig } from './config.js';
import { logger } from './logger.js';
import { BinanceProvider } from './providers/binance.js';
import { startHttpServer } from './http.js';

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

  // Start MCP stdio server (dynamically import to avoid hard build-time dep)
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const mod: any = await (new Function('p', 'return import(p)'))('./mcp.js')
    if (mod && typeof mod.createMcpServer === 'function') {
      const server = mod.createMcpServer(provider)
      await server.start()
      logger.info('MCP stdio server started')
    }
  } catch (e) {
    logger.warn('MCP stdio not started', { err: (e as Error).message })
  }
}

// Only run if executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    logger.error('Fatal error', { err: String(err) });
    process.exit(1);
  });
}

export {}; // keep as module
