import { describe, it, expect } from 'vitest'
import { compactVertical, moveElement, ensureNoOverlap } from '@/components/canvas/engine'

type T = { id: string; x: number; y: number; w: number; h: number; kind: any }

const cols = 2

function mk(id: string, x: number, y: number, w = 1, h = 1): T {
  return { id, x, y, w, h, kind: 'k' }
}

describe('layout engine', () => {
  it('compacts vertically to close gaps', () => {
    const layout: T[] = [mk('a', 0, 3), mk('b', 1, 2)]
    const out = compactVertical(layout, cols)
    // b should move up to y=0 or y=0 if free, a should also move up
    expect(out.find(i => i.id === 'b')!.y).toBe(0)
    expect(out.find(i => i.id === 'a')!.y).toBe(0)
  })

  it('pushes colliding tiles down on move', () => {
    // a at (0,0), b at (0,1). Move a to (0,1) should push b to (0,2)
    const layout: T[] = [mk('a', 0, 0), mk('b', 0, 1)]
    const moved = moveElement(layout, 'a', 0, 1, cols)
    expect(moved.find(i => i.id === 'a')!.y).toBe(1)
    expect(moved.find(i => i.id === 'b')!.y).toBe(2)
  })

  it('handles multisize collisions', () => {
    // c is 2x1 at top, a wants to sit under c on left, b under on right; ensure cascade maintains structure
    const layout: T[] = [mk('c', 0, 0, 2, 1), mk('a', 0, 2), mk('b', 1, 2)]
    const moved = moveElement(layout, 'a', 0, 1, cols)
    // a should land at y=1, b remain at y=2
    expect(moved.find(i => i.id === 'a')!.y).toBe(1)
    expect(moved.find(i => i.id === 'b')!.y).toBe(2)
    const compacted = compactVertical(moved, cols)
    // compacting keeps them packed without overlap
    expect(compacted.find(i => i.id === 'a')!.y).toBe(1)
    expect(compacted.find(i => i.id === 'b')!.y).toBe(1) // under c, same row but different column
  })

  it('ensureNoOverlap resolves after resize growth', () => {
    // a grows to h=2 overlapping b; ensureNoOverlap should push b down
    let layout: T[] = [mk('a', 0, 0, 1, 1), mk('b', 0, 1, 1, 1)]
    layout = layout.map(l => l.id === 'a' ? { ...l, h: 2 } : l)
    const resolved = ensureNoOverlap(layout, 'a')
    expect(resolved.find(i => i.id === 'b')!.y).toBe(2)
  })
})
