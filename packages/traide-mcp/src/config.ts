export type AppConfig = {
  port: number;
  enableHttp: boolean;
  enableWs: boolean;
  enableSse: boolean;
  httpToken?: string;
  provider: 'binance';
  binanceRestUrl: string;
  binanceWsUrl: string;
  wsReplayCandles: number;
  backoffBaseMs: number;
  backoffMaxMs: number;
  heartbeatMs: number;
};

export function loadConfig(env = process.env): AppConfig {
  return {
    port: +(env.PORT ?? 8080),
    enableHttp: (env.MCP_ENABLE_HTTP ?? 'true') === 'true',
    enableWs: (env.MCP_ENABLE_WS ?? 'false') === 'true',
    enableSse: (env.MCP_ENABLE_SSE ?? 'true') === 'true',
    httpToken: env.MCP_HTTP_TOKEN,
    provider: 'binance',
    binanceRestUrl: env.BINANCE_REST_URL ?? 'https://api.binance.com',
    binanceWsUrl: env.BINANCE_WS_URL ?? 'wss://stream.binance.com/ws',
    wsReplayCandles: +(env.MCP_WS_REPLAY_CANDLES ?? 5),
    backoffBaseMs: +(env.MCP_BACKOFF_BASE_MS ?? 500),
    backoffMaxMs: +(env.MCP_BACKOFF_MAX_MS ?? 30000),
    heartbeatMs: +(env.MCP_HEARTBEAT_MS ?? 15000),
  };
}
