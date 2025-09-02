import type { Tile } from './types'

export type Layout = Tile[]

export function cloneLayout(layout: Layout): Layout {
  return layout.map((l) => ({ ...l }))
}

export function sortByTopLeft(a: Tile, b: Tile) {
  return (a.y - b.y) || (a.x - b.x)
}

export function collides(a: Tile, b: Tile): boolean {
  if (a.id === b.id) return false
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y)
}

export function getAllCollisions(layout: Layout, item: Tile): Tile[] {
  const out: Tile[] = []
  for (const l of layout) if (collides(item, l)) out.push(l)
  return out
}

export function clampX(x: number, w: number, cols: number): number {
  return Math.max(0, Math.min(cols - w, x))
}

// Moves an element to (x,y) with collision cascade (push-down strategy). Returns a new layout.
export function moveElement(layout: Layout, id: string, toX: number, toY: number, cols: number): Layout {
  const out = cloneLayout(layout)
  const it = out.find((i) => i.id === id)
  if (!it) return out
  it.x = clampX(toX, it.w, cols)
  it.y = Math.max(0, toY)
  // Resolve collisions via BFS push-down
  const q: Tile[] = [it]
  const seen = new Set<string>([it.id])
  while (q.length) {
    const cur = q.shift()!
    let collisions = getAllCollisions(out, cur)
    for (const c of collisions) {
      // push collided item down just below cur
      if (seen.has(c.id)) continue
      c.y = cur.y + cur.h
      seen.add(c.id)
      q.push(c)
    }
  }
  return out
}

// Compacts vertically: each item is moved up as far as possible without collisions.
export function compactVertical(layout: Layout, cols: number): Layout {
  const out = cloneLayout(layout)
  const items = out.sort(sortByTopLeft)
  for (const it of items) {
    // clamp x within bounds first
    it.x = clampX(it.x, it.w, cols)
    let targetY = it.y
    // move up while no collisions
    while (targetY > 0) {
      const test: Tile = { ...it, y: targetY - 1 }
      if (getAllCollisions(out, test).length === 0) targetY--
      else break
    }
    it.y = targetY
  }
  return out
}

// Ensures no overlaps for a changed element (e.g., after resize). Uses push-down like moveElement.
export function ensureNoOverlap(layout: Layout, id: string): Layout {
  const out = cloneLayout(layout)
  const it = out.find((i) => i.id === id)
  if (!it) return out
  const q: Tile[] = [it]
  const seen = new Set<string>([it.id])
  while (q.length) {
    const cur = q.shift()!
    const collisions = getAllCollisions(out, cur)
    for (const c of collisions) {
      if (seen.has(c.id)) continue
      c.y = cur.y + cur.h
      seen.add(c.id)
      q.push(c)
    }
  }
  return out
}

// Arrange all items with vertical compaction while keeping a moved item
// pinned and placed first. Mirrors React-Grid-Layout-like behavior for multisize tiles.
export function autoArrange(afterMove: Layout, movedId?: string, cols = 1): Layout {
  const items = cloneLayout(afterMove)
  const moved = movedId ? items.find((t) => t.id === movedId) : undefined
  const occ: boolean[][] = []
  const mark = (x: number, y: number, w: number, h: number, val: boolean) => {
    for (let yy = y; yy < y + h; yy++) {
      if (!occ[yy]) occ[yy] = Array(cols).fill(false)
      for (let xx = x; xx < x + w; xx++) occ[yy][xx] = val
    }
  }
  const fits = (x: number, y: number, w: number, h: number) => {
    if (x < 0 || x + w > cols || y < 0) return false
    for (let yy = y; yy < y + h; yy++) {
      const row = occ[yy]
      for (let xx = x; xx < x + w; xx++) if (row && row[xx]) return false
    }
    return true
  }
  const placeAt = (t: Tile, x: number, y: number) => { t.x = clampX(x, t.w, cols); t.y = Math.max(0, y); mark(t.x, t.y, t.w, t.h, true) }
  const out: Tile[] = []
  if (moved) {
    moved.x = clampX(moved.x, moved.w, cols)
    moved.y = Math.max(0, moved.y)
    let gy = moved.y
    while (!fits(moved.x, gy, moved.w, moved.h)) gy++
    placeAt(moved, moved.x, gy); out.push(moved)
  }
  const rest = items.filter((t) => !moved || t.id !== moved.id).sort(sortByTopLeft)
  for (const t of rest) {
    let placed = false
    for (let gy = 0; !placed; gy++) {
      const startX = Math.max(0, Math.min(cols - t.w, t.x))
      for (let gx = startX; gx <= cols - t.w; gx++) {
        if (fits(gx, gy, t.w, t.h)) { placeAt(t, gx, gy); out.push(t); placed = true; break }
      }
      if (placed) break
      for (let gx = 0; gx < startX; gx++) {
        if (fits(gx, gy, t.w, t.h)) { placeAt(t, gx, gy); out.push(t); placed = true; break }
      }
    }
  }
  return out
}
