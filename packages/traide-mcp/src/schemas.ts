import type { JSONSchemaType } from 'ajv'
import type { ComputeIndicatorsRequest, StreamKlinesRequest } from './types.js'

// Binance-like candle intervals
export const allowedIntervals = new Set([
  '1m','3m','5m','15m','30m',
  '1h','2h','4h','6h','8h','12h',
  '1d','3d','1w','1M'
])

const positiveInt: JSONSchemaType<number> = {
  type: 'integer', minimum: 1
}

const windowsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    macd: {
      type: 'object',
      additionalProperties: false,
      nullable: true,
      properties: {
        fast: { ...positiveInt, nullable: true },
        slow: { ...positiveInt, nullable: true },
        signal: { ...positiveInt, nullable: true }
      }
    },
    rsi: {
      type: 'object',
      additionalProperties: false,
      nullable: true,
      properties: { period: { ...positiveInt, nullable: true } }
    },
    atr: {
      type: 'object',
      additionalProperties: false,
      nullable: true,
      properties: { period: { ...positiveInt, nullable: true } }
    },
    stoch: {
      type: 'object',
      additionalProperties: false,
      nullable: true,
      properties: {
        k: { ...positiveInt, nullable: true },
        d: { ...positiveInt, nullable: true },
        smooth: { ...positiveInt, nullable: true }
      }
    },
    stochRsi: {
      type: 'object',
      additionalProperties: false,
      nullable: true,
      properties: {
        rsi: { ...positiveInt, nullable: true },
        k: { ...positiveInt, nullable: true },
        d: { ...positiveInt, nullable: true }
      }
    },
    bollinger: {
      type: 'object',
      additionalProperties: false,
      nullable: true,
      properties: {
        period: { ...positiveInt, nullable: true },
        stdev: { type: 'number', exclusiveMinimum: 0, nullable: true }
      }
    },
    ppo: {
      type: 'object',
      additionalProperties: false,
      nullable: true,
      properties: {
        fast: { ...positiveInt, nullable: true },
        slow: { ...positiveInt, nullable: true },
        signal: { ...positiveInt, nullable: true }
      }
    },
    pvo: {
      type: 'object',
      additionalProperties: false,
      nullable: true,
      properties: {
        fast: { ...positiveInt, nullable: true },
        slow: { ...positiveInt, nullable: true },
        signal: { ...positiveInt, nullable: true }
      }
    },
    vwap: {
      type: 'object',
      additionalProperties: false,
      nullable: true,
      properties: {
        session: { type: 'string', enum: ['day','continuous'], nullable: true }
      }
    }
  }
} as const

export const computeIndicatorsSchema: JSONSchemaType<ComputeIndicatorsRequest> = {
  type: 'object',
  additionalProperties: false,
  required: ['symbol','interval'],
  properties: {
    symbol: { type: 'string', minLength: 1 },
    interval: { type: 'string', minLength: 1 },
    start: { type: 'integer', nullable: true },
    end: { type: 'integer', nullable: true },
    limit: { type: 'integer', minimum: 1, maximum: 2000, nullable: true },
    windows: { ...windowsSchema, nullable: true } as any,
    includeCandles: { type: 'boolean', nullable: true },
    schemaVersion: { type: 'string', nullable: true }
  }
}

export const streamKlinesSchema: JSONSchemaType<StreamKlinesRequest> = {
  type: 'object',
  additionalProperties: false,
  required: ['symbol','interval'],
  properties: {
    symbol: { type: 'string', minLength: 1 },
    interval: { type: 'string', minLength: 1 },
    indicators: { ...windowsSchema, nullable: true } as any,
    closedOnly: { type: 'boolean', nullable: true },
    heartbeatMs: { type: 'integer', minimum: 100, maximum: 60000, nullable: true },
    schemaVersion: { type: 'string', nullable: true }
  }
}

export type KlinesQuery = { symbol: string; interval: string; start?: number; end?: number; limit?: number }
export const klinesQuerySchema: JSONSchemaType<KlinesQuery> = {
  type: 'object',
  additionalProperties: false,
  required: ['symbol','interval'],
  properties: {
    symbol: { type: 'string', minLength: 1 },
    interval: { type: 'string', minLength: 1 },
    start: { type: 'integer', nullable: true },
    end: { type: 'integer', nullable: true },
    limit: { type: 'integer', minimum: 1, maximum: 2000, nullable: true }
  }
}

