"use client"
import { useMcpConfig } from '@/lib/config'
import { useEffect, useRef, useState } from 'react'
import { GlassButton } from './GlassCard'
import React from 'react'

function GearIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z" />
      <path d="M19.4 15.5a7.97 7.97 0 0 0 .1-1.5 7.97 7.97 0 0 0-.1-1.5l2.1-1.6a.7.7 0 0 0 .2-.9l-2-3.5a.7.7 0 0 0-.8-.3l-2.5 1a7.74 7.74 0 0 0-2.6-1.5l-.4-2.6a.7.7 0 0 0-.7-.6H9.3a.7.7 0 0 0-.7.6l-.4 2.6a7.74 7.74 0 0 0-2.6 1.5l-2.5-1a.7.7 0 0 0-.8.3l-2 3.5a.7.7 0 0 0 .2.9l2.1 1.6c-.1.5-.1 1-.1 1.5s0 1 .1 1.5L.6 17.1a.7.7 0 0 0-.2.9l2 3.5c.2.3.5.4.8.3l2.5-1c.8.6 1.7 1.1 2.6 1.5l.4 2.6c.1.3.3.6.7.6h3.4c.4 0 .6-.3.7-.6l.4-2.6c.9-.4 1.8-.9 2.6-1.5l2.5 1c.3.1.6 0 .8-.3l2-3.5a.7.7 0 0 0-.2-.9l-2.1-1.6z" strokeLinejoin="round" />
    </svg>
  )
}

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

  // Keep input value in sync with current base when dialog opens or base changes
  useEffect(() => {
    if (open) setVal(baseUrl)
  }, [baseUrl, open])
  return (
    <div className="relative ui-overlay" data-ui-overlay="1" onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}>
      {!open ? (
        <button aria-label="Open Settings" title="Settings" className="rounded-xl bg-white/10 p-2 text-white/80 hover:bg-white/15" onClick={() => setOpen(true)}>
          <GearIcon className="h-4 w-4" />
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
