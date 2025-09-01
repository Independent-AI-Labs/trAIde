import { describe, it, expect } from 'vitest'
import { createLimiter } from '../src/lib/net/concurrency'

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

describe('createLimiter', () => {
  it('limits concurrency and resolves all', async () => {
    const lim = createLimiter(2)
    let running = 0
    let peak = 0
    const tasks = Array.from({ length: 6 }, (_, i) => lim.schedule(async () => {
      running++; peak = Math.max(peak, running)
      await sleep(50)
      running--
      return i
    }))
    const results = await Promise.all(tasks)
    expect(peak).toBeLessThanOrEqual(2)
    expect(results.length).toBe(6)
    expect(results[0]).toBe(0)
  })
})

