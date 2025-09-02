import { describe, it, expect } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { TickConfigProvider, TileConfigProvider, useTickMs } from '../src/lib/tickConfig'
import type { Tile } from '../src/components/canvas/types'

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

function Reader({ onValue }: { onValue: (n: number) => void }) {
  const v = useTickMs()
  onValue(v)
  return null
}

describe('useTickMs precedence', () => {
  it('falls back to app default', async () => {
    let got = 0
    const el = document.createElement('div')
    document.body.appendChild(el)
    const root = createRoot(el)
    root.render(
      <TickConfigProvider defaults={{ tickMs: 1000 }} layout={{}}>
        <Reader onValue={(n) => { got = n }} />
      </TickConfigProvider>
    )
    await sleep(5)
    expect(got).toBe(1000)
  })

  it('uses layout.tickMs', async () => {
    let got = 0
    const el = document.createElement('div')
    document.body.appendChild(el)
    const root = createRoot(el)
    root.render(
      <TickConfigProvider defaults={{ tickMs: 1000 }} layout={{ tickMs: 500 }}>
        <Reader onValue={(n) => { got = n }} />
      </TickConfigProvider>
    )
    await sleep(5)
    expect(got).toBe(500)
  })

  it('uses layout.panelTickMs by kind', async () => {
    let got = 0
    const tile: Tile = { id: 't1', kind: 'watchlist', x: 0, y: 0, w: 1, h: 1 }
    const el = document.createElement('div')
    document.body.appendChild(el)
    const root = createRoot(el)
    root.render(
      <TickConfigProvider defaults={{ tickMs: 1000 }} layout={{ tickMs: 1000, panelTickMs: { watchlist: 250 } }}>
        <TileConfigProvider tile={tile}>
          <Reader onValue={(n) => { got = n }} />
        </TileConfigProvider>
      </TickConfigProvider>
    )
    await sleep(5)
    expect(got).toBe(250)
  })

  it('uses tile.settings.tickMs', async () => {
    let got = 0
    const tile: Tile = { id: 't1', kind: 'watchlist', x: 0, y: 0, w: 1, h: 1, settings: { tickMs: 2000 } }
    const el = document.createElement('div')
    document.body.appendChild(el)
    const root = createRoot(el)
    root.render(
      <TickConfigProvider defaults={{ tickMs: 1000 }} layout={{ tickMs: 500, panelTickMs: { watchlist: 250 } }}>
        <TileConfigProvider tile={tile}>
          <Reader onValue={(n) => { got = n }} />
        </TileConfigProvider>
      </TickConfigProvider>
    )
    await sleep(5)
    expect(got).toBe(2000)
  })

  it('component override wins', async () => {
    function ReaderOverride({ onValue }: { onValue: (n: number) => void }) {
      const v = useTickMs(123)
      onValue(v)
      return null
    }
    let got = 0
    const el = document.createElement('div')
    document.body.appendChild(el)
    const root = createRoot(el)
    root.render(
      <TickConfigProvider defaults={{ tickMs: 1000 }} layout={{ tickMs: 500 }}>
        <ReaderOverride onValue={(n) => { got = n }} />
      </TickConfigProvider>
    )
    await sleep(5)
    expect(got).toBe(123)
  })
})

