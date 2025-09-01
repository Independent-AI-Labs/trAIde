"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { RegistryItem, TileKind } from './types'

export function ComponentPalette({ items, open, onClose, onSelect }: { items: RegistryItem[]; open: boolean; onClose: () => void; onSelect: (k: TileKind) => void }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => items.filter(i => i.title.toLowerCase().includes(q.toLowerCase()) || i.id.includes(q.toLowerCase())), [q, items])
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-8 backdrop-blur-sm ui-overlay" onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}>
      <div ref={ref} className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/90 shadow-2xl">
        <div className="border-b border-white/10 p-3">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search components…" className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none placeholder:text-white/40" />
        </div>
        <div className="max-h-96 overflow-auto p-2">
          {filtered.map(item => (
            <button key={item.id} onClick={() => onSelect(item.id)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-white/10">
              <div>
                <div className="font-medium text-white/90">{item.title}</div>
                {item.description && <div className="text-xs text-white/60">{item.description}</div>}
              </div>
              <div className="text-xs text-white/40">{item.id}</div>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-white/10 p-3 text-sm">
          <button className="rounded-md px-3 py-1 text-white/80 hover:bg-white/10" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
