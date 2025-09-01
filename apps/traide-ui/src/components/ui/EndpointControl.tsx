"use client"
import { useMcpConfig } from '@/lib/config'
import { useEffect, useRef, useState } from 'react'
import { GlassButton } from './GlassCard'

export function EndpointControl() {
  const { baseUrl, setBaseUrl } = useMcpConfig()
  const [val, setVal] = useState(baseUrl)
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      const el = boxRef.current
      if (!el) return
      if (!el.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onEsc) }
  }, [open])
  return (
    <div className="relative ui-overlay" data-ui-overlay="1" onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}>
      {!open ? (
        <button aria-label="Open Settings" className="rounded-xl bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/15" onClick={() => setOpen(true)}>
          Settings
        </button>
      ) : (
        <div ref={boxRef} className="absolute right-0 z-20 w-[380px] rounded-2xl border border-white/10 bg-base-900/95 p-3 shadow-depth backdrop-blur-md" onMouseDown={(e) => e.stopPropagation()}>
          <div className="text-xs text-white/80">Settings</div>
          <div className="mt-2 text-[11px] text-white/60">MCP Base URL</div>
          <input
            className="mt-2 w-full rounded-lg border border-white/20 bg-base-800/80 px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
            placeholder="http://localhost:62007"
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <GlassButton className="bg-white/5" onClick={() => { setOpen(false); setVal(baseUrl) }}>Cancel</GlassButton>
            <GlassButton className="bg-white/10" onClick={() => { setBaseUrl(val.trim()); setOpen(false) }}>Save</GlassButton>
          </div>
        </div>
      )}
    </div>
  )
}
