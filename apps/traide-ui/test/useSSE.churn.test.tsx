import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useSSE } from '../src/lib/useSSE'

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

class FakeEventSource {
  static instances: FakeEventSource[] = []
  static reset() { FakeEventSource.instances = [] }
  onopen: ((this: EventSource, ev: Event) => any) | null = null
  onerror: ((this: EventSource, ev: Event) => any) | null = null
  onmessage: ((this: EventSource, ev: MessageEvent) => any) | null = null
  url: string
  closed = false
  constructor(url: string) {
    this.url = url
    FakeEventSource.instances.push(this)
    // auto-open on next tick
    setTimeout(() => { if (!this.closed && this.onopen) this.onopen.call(this as any, new Event('open')) }, 0)
  }
  close() { this.closed = true }
}

describe('useSSE churn guard', () => {
  const OLD_ES = (globalThis as any).EventSource
  beforeEach(() => {
    ;(globalThis as any).EventSource = FakeEventSource as any
    FakeEventSource.reset()
  })
  afterEach(() => {
    ;(globalThis as any).EventSource = OLD_ES
    FakeEventSource.reset()
  })

  it('coalesces rapid URL flips into a single connect within window', async () => {
    function Reader({ url }: { url?: string }) {
      // small window to keep test fast
      useSSE(url, { minOpenIntervalMs: 200, backoffBaseMs: 10, backoffMaxMs: 20, pauseWhenHidden: false })
      return null
    }
    const el = document.createElement('div')
    document.body.appendChild(el)
    const root = createRoot(el)
    function Wrapper() {
      const [u, setU] = useState<string | undefined>(`/api/mcp/stream/klines?symbol=AAA`)
      useEffect(() => {
        // flip URLs rapidly
        setTimeout(() => setU(`/api/mcp/stream/klines?symbol=BBB`), 10)
        setTimeout(() => setU(`/api/mcp/stream/klines?symbol=CCC`), 20)
        setTimeout(() => setU(`/api/mcp/stream/klines?symbol=DDD`), 30)
      }, [])
      return <Reader url={u} />
    }
    root.render(<Wrapper />)

    // Immediately after flips, only the initial open should occur
    await sleep(50)
    const firstCount = FakeEventSource.instances.length
    expect(firstCount).toBe(1)

    // Still within 150ms (< 200ms window), should not have opened another
    await sleep(100)
    const midCount = FakeEventSource.instances.length
    expect(midCount).toBe(1)

    // After window, a single reopen may occur with the last URL
    await sleep(200)
    const finalCount = FakeEventSource.instances.length
    expect(finalCount === 1 || finalCount === 2).toBe(true)
  })
})

