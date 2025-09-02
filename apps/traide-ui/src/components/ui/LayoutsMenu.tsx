"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { ContextMenu, MenuItem, MenuSep } from '@/components/canvas/ContextMenu'
import type { Tile, TileKind } from '@/components/canvas/types'
import { PANEL_REGISTRY } from '@/components/canvas/types'
import { TickSelect } from '@/components/ui/TickSelect'
import { loadLayouts, saveLayouts, loadTiles, DEFAULT_TILES_KEY, getLayoutTickMs, setLayoutTickMs, getPanelTickMs, setPanelTickMs } from '@/lib/layoutsStore'

import { ConfirmDialog, PromptDialog } from '@/components/ui/Modal'

export function LayoutsMenu({ x, y, anchorEl, onClose }: { x?: number; y?: number; anchorEl?: HTMLElement | null; onClose: () => void }) {
  const storageKey = (typeof window !== 'undefined' ? (window as any).__traide_layoutKey : DEFAULT_TILES_KEY) as string
  const [layouts, setLayouts] = useState<Record<string, Tile[]>>({})
  const [askDelete, setAskDelete] = useState<string | null>(null)
  const [askSave, setAskSave] = useState(false)
  const [layoutTick, setLayoutTick] = useState<number>(getLayoutTickMs(storageKey) ?? 1000)
  const [panelTick, setPanelTick] = useState<Partial<Record<TileKind, number>>>(getPanelTickMs(storageKey))
  const [askResetPanels, setAskResetPanels] = useState(false)

  useEffect(() => { setLayouts(loadLayouts(storageKey)) }, [storageKey])

  const kindsInUse = useMemo(() => {
    const tiles = loadTiles(storageKey) || []
    const set = new Set<TileKind>()
    for (const t of tiles) set.add(t.kind)
    return Array.from(set)
  }, [storageKey, layouts])

  const labelForKind = (kind: TileKind) => PANEL_REGISTRY.find(r => r.id === kind)?.title || (kind.charAt(0).toUpperCase() + kind.slice(1).replace(/-/g, ' '))

  return (
    <>
    <ContextMenu x={x as any} y={y as any} anchorEl={anchorEl as any} placement="below-center" onClose={onClose} className="w-80 p-2">
      <div className="px-2 py-1 text-xs uppercase tracking-wide text-white/60">Saved Layouts</div>
      <div className="max-h-48 space-y-1 overflow-auto px-1">
        {Object.keys(layouts).length === 0 && <div className="px-2 py-1 text-white/50">No saved layouts</div>}
        {Object.entries(layouts).map(([name, tiles]) => (
          <div key={name} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-white/10">
            <button className="truncate" onClick={() => { window.dispatchEvent(new CustomEvent('traide:apply-layout', { detail: { tiles } } as any)); onClose() }}>{name}</button>
            <button aria-label="Delete layout" title="Delete" className="rounded p-1 text-white/50 hover:text-rose-300" onClick={() => setAskDelete(name)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
                <path d="M9 3h6m-7 3h8m-8 0l-.8 13a2 2 0 0 0 2 2h5.6a2 2 0 0 0 2-2L16 6M10 10v7m4-7v7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <MenuSep />
      <MenuItem onClick={() => setAskSave(true)}>Save As…</MenuItem>
      <div className="mt-3 border-t border-white/10 px-2 pt-3">
        <div className="mb-1 text-xs uppercase tracking-wide text-white/60">Layout Settings</div>
        <label className="mb-2 flex items-center justify-between gap-2 text-xs">
          <span>Tick</span>
          <TickSelect value={layoutTick} onChange={(v) => { const ms = Math.max(0, v ?? 1000); setLayoutTick(ms); setLayoutTickMs(ms, storageKey); window.dispatchEvent(new CustomEvent('traide:set-layout-tick', { detail: { ms } } as any)) }} />
        </label>
        {kindsInUse.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-white/60">Per‑Panel Tick</div>
            {kindsInUse.map((kind) => (
              <label key={kind} className="flex items-center justify-between gap-2 text-xs">
                <span>{labelForKind(kind)}</span>
                <TickSelect
                  allowInherit
                  inheritLabel="Layout"
                  value={panelTick[kind]}
                  onChange={(v) => {
                    const ms = v == null ? null : Math.max(0, v)
                    const next = { ...panelTick }
                    if (ms == null) delete (next as any)[kind]
                    else (next as any)[kind] = ms
                    setPanelTick(next)
                    setPanelTickMs(next, storageKey)
                    window.dispatchEvent(new CustomEvent('traide:set-panel-tick', { detail: { kind, ms } } as any))
                  }}
                />
              </label>
            ))}
            {null}
          </div>
        )}
      </div>
      <MenuSep />
      <MenuItem onClick={() => setAskResetPanels(true)}>Reset Per‑Panel Tick…</MenuItem>
    </ContextMenu>
    <ConfirmDialog
      open={askDelete != null}
      onClose={() => setAskDelete(null)}
      title="Delete layout?"
      message={<span>Delete layout “{askDelete}”? This cannot be undone.</span>}
      confirmLabel="Delete"
      onConfirm={() => {
        if (!askDelete) return
        const next = { ...layouts }
        delete next[askDelete]
        setLayouts(next)
        saveLayouts(next, storageKey)
      }}
    />
    <PromptDialog
      open={askSave}
      onClose={() => setAskSave(false)}
      title="Save Current Layout As…"
      placeholder="Layout name"
      confirmLabel="Save"
      onSubmit={(name) => {
        const tiles = loadTiles(storageKey) || []
        const next = { ...layouts, [name]: tiles }
        setLayouts(next)
        saveLayouts(next, storageKey)
      }}
    />
    <ConfirmDialog
      open={askResetPanels}
      onClose={() => setAskResetPanels(false)}
      title="Reset Per‑Panel Tick?"
      message="Clear all per‑panel tick overrides and fall back to the Layout tick."
      confirmLabel="Reset"
      onConfirm={() => {
        setPanelTick({})
        setPanelTickMs({}, storageKey)
        window.dispatchEvent(new CustomEvent('traide:reset-panel-tick'))
      }}
    />
    </>
  )
}
