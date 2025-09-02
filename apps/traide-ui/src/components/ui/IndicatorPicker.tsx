"use client"
import React, { useMemo, useState } from 'react'

type Overlay = { type: 'sma' | 'ema'; period: number; color?: string }

export function IndicatorPicker({
  open,
  overlays,
  onClose,
  onChange,
}: {
  open: boolean
  overlays: Overlay[]
  onClose: () => void
  onChange: (next: Overlay[]) => void
}) {
  const [items, setItems] = useState<Overlay[]>(overlays)
  const add = (type: Overlay['type'], period: number, color?: string) => setItems((arr) => [...arr, { type, period, color }])
  const remove = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i))
  const update = (i: number, patch: Partial<Overlay>) => setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const presets = useMemo(
    () => [
      { label: 'EMA 20', value: { type: 'ema' as const, period: 20, color: 'rgba(99,102,241,1)' } },
      { label: 'EMA 50', value: { type: 'ema' as const, period: 50, color: 'rgba(59,130,246,1)' } },
      { label: 'SMA 50', value: { type: 'sma' as const, period: 50, color: 'rgba(251,191,36,1)' } },
      { label: 'SMA 200', value: { type: 'sma' as const, period: 200, color: 'rgba(74,222,128,1)' } },
    ],
    [],
  )
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-8 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/90 text-white shadow-2xl">
        <div className="border-b border-white/10 p-3 text-sm font-medium">Indicators</div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <div>
            <div className="mb-2 text-xs uppercase tracking-wide text-white/60">Presets</div>
            <div className="space-y-2">
              {presets.map((p) => (
                <button key={p.label} className="w-full rounded-md bg-white/10 px-3 py-2 text-left hover:bg-white/15" onClick={() => add(p.value.type, p.value.period, p.value.color)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs uppercase tracking-wide text-white/60">Active Overlays</div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md bg-white/5 p-2">
                  <span className="w-12 rounded bg-white/10 px-2 py-1 text-center text-xs uppercase">{it.type}</span>
                  <label className="flex items-center gap-2 text-xs">
                    <span>Period</span>
                    <input className="w-16 rounded border border-white/15 bg-black/40 px-2 py-1 text-xs outline-none" type="number" value={it.period} min={1} onChange={(e) => update(i, { period: Math.max(1, Number(e.target.value || 1)) })} />
                  </label>
                  <input className="h-7 w-12 cursor-pointer" type="color" value={toColorHex(it.color)} onChange={(e) => update(i, { color: e.target.value })} />
                  <button className="ml-auto rounded bg-rose-500/20 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/30" onClick={() => remove(i)}>
                    Remove
                  </button>
                </div>
              ))}
              {items.length === 0 && <div className="text-sm text-white/60">No overlays yet. Add from presets.</div>}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-white/10 p-3 text-sm">
          <button className="rounded px-3 py-1 text-white/80 hover:bg-white/10" onClick={onClose}>Cancel</button>
          <button
            className="rounded bg-white/10 px-3 py-1 text-white hover:bg-white/15"
            onClick={() => {
              onChange(items)
              onClose()
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

function toColorHex(c?: string) {
  if (!c) return '#ffffff'
  if (/^#/.test(c)) return c
  // very rough rgba to hex (ignores alpha)
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (m) {
    const r = clamp255(+m[1]!)
    const g = clamp255(+m[2]!)
    const b = clamp255(+m[3]!)
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
  }
  return '#ffffff'
}
function clamp255(n: number) { return Math.max(0, Math.min(255, Math.round(n))) }

export type { Overlay as IndicatorOverlay }

