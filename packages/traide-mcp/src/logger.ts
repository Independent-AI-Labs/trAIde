type Level = 'debug' | 'info' | 'warn' | 'error';

function ts() {
  return new Date().toISOString();
}

function log(level: Level, msg: string, meta?: Record<string, unknown>) {
  const entry = { t: ts(), level, msg, ...meta };
  console[level === 'debug' ? 'log' : level](JSON.stringify(entry));
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
};

