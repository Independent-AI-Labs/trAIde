/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv from 'ajv';
import { computeIndicatorsSchema, streamKlinesSchema, klinesQuerySchema, allowedIntervals, type KlinesQuery } from './schemas.js';
import type { ComputeIndicatorsRequest, StreamKlinesRequest } from './types.js';

const ajv = new Ajv({ allErrors: true, coerceTypes: true, removeAdditional: true })
const validateCompute = ajv.compile<ComputeIndicatorsRequest>(computeIndicatorsSchema)
const validateStream = ajv.compile<StreamKlinesRequest>(streamKlinesSchema)
const validateKlines = ajv.compile<KlinesQuery>(klinesQuerySchema)

export function validateComputeRequest(input: unknown): asserts input is ComputeIndicatorsRequest {
  if (!validateCompute(input)) {
    const code = 'invalid_compute_request'
    const details = validateCompute.errors?.map(e => `${e.instancePath} ${e.message}`).join('; ')
    const err = new Error(code)
    ;(err as any).code = code
    ;(err as any).details = details
    throw err
  }
  const i = input as ComputeIndicatorsRequest
  if (i.interval && !allowedIntervals.has(i.interval)) {
    const err = new Error('invalid_interval') as any
    err.code = 'invalid_interval'; err.details = `interval '${i.interval}' not in allowlist`
    throw err
  }
}

export function validateStreamRequest(input: unknown): asserts input is StreamKlinesRequest {
  if (!validateStream(input)) {
    const code = 'invalid_stream_request'
    const details = validateStream.errors?.map(e => `${e.instancePath} ${e.message}`).join('; ')
    const err = new Error(code)
    ;(err as any).code = code
    ;(err as any).details = details
    throw err
  }
  const i = input as StreamKlinesRequest
  if (i.interval && !allowedIntervals.has(i.interval)) {
    const err = new Error('invalid_interval') as any
    err.code = 'invalid_interval'; err.details = `interval '${i.interval}' not in allowlist`
    throw err
  }
}

export function validateKlinesQuery(input: unknown): asserts input is KlinesQuery {
  if (!validateKlines(input)) {
    const code = 'invalid_klines_query'
    const details = validateKlines.errors?.map(e => `${e.instancePath} ${e.message}`).join('; ')
    const err = new Error(code)
    ;(err as any).code = code
    ;(err as any).details = details
    throw err
  }
  const q = input as KlinesQuery
  if (q.interval && !allowedIntervals.has(q.interval)) {
    const err = new Error('invalid_interval') as any
    err.code = 'invalid_interval'; err.details = `interval '${q.interval}' not in allowlist`
    throw err
  }
}

export function mapError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  const code = (err as any)?.code || message
  const details = (err as any)?.details
  return { error: code, details }
}
