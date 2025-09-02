"use client"
import React, { useState } from 'react'
import { ContextMenu, MenuItem, MenuSep } from '@/components/canvas/ContextMenu'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useMcpConfig } from '@/lib/config'
import { GlassButton } from './GlassCard'
import { useToast } from './Toast'

function GearIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z" />
      <path d="M19.4 15.5a7.97 7.97 0 0 0 .1-1.5 7.97 7.97 0 0 0-.1-1.5l2.1-1.6a.7.7 0 0 0 .2-.9l-2-3.5a.7.7 0 0 0-.8-.3l-2.5 1a7.74 7.74 0 0 0-2.6-1.5l-.4-2.6a.7.7 0 0 0-.7-.6H9.3a.7.7 0 0 0-.7.6l-.4 2.6a7.74 7.74 0 0 0-2.6 1.5l-2.5-1a.7.7 0 0 0-.8.3l-2 3.5a.7.7 0 0 0 .2.9l2.1 1.6c-.1.5-.1 1-.1 1.5s0 1 .1 1.5L.6 17.1a.7.7 0 0 0-.2.9l2 3.5c.2.3.5.4.8.3l2.5-1c.8.6 1.7 1.1 2.6 1.5l.4 2.6c.1.3.3.6.7.6h3.4c.4 0 .6-.3.7-.6l.4-2.6c.9-.4 1.8-.9 2.6-1.5l2.5 1c.3.1.6 0 .8-.3l2-3.5a.7.7 0 0 0-.2-.9l-2.1-1.6z" strokeLinejoin="round" />
    </svg>
  )
}

export function EndpointControl() {
  const [open, setOpen] = useState<null | { anchorEl: HTMLElement }>(null)
  const { baseUrl, setBaseUrl } = useMcpConfig()
  const [val, setVal] = useState(baseUrl)
  const toast = useToast()
  const [confirmReset, setConfirmReset] = useState(false)
  return (
    <>
      <button
        aria-label="Open Settings"
        title="Settings"
        className="rounded-xl bg-white/10 p-2 text-white/80 hover:bg-white/15"
        onClick={(e) => {
          setVal(baseUrl)
          setOpen({ anchorEl: e.currentTarget as HTMLElement })
        }}
      >
        <GearIcon className="h-4 w-4" />
      </button>
      {open && (
        <ContextMenu anchorEl={open.anchorEl} placement="below-center" onClose={() => setOpen(null)} className="w-80 p-2">
          <div className="px-2 py-1 text-xs uppercase tracking-wide text-white/60">Settings</div>
          <div className="px-2 pt-2 text-[11px] text-white/60">MCP Base URL</div>
          <div className="flex items-center gap-2 px-2 pb-2">
            <input
              className="mt-2 w-full rounded-lg border border-white/20 bg-base-800/80 px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
              placeholder="http://localhost:62007"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setBaseUrl(val.trim()); setOpen(null); toast.push('Endpoint saved') } }}
            />
            <GlassButton className="mt-2 bg-white/10" onClick={() => { setBaseUrl(val.trim()); setOpen(null); toast.push('Endpoint saved') }}>Save</GlassButton>
          </div>
          <MenuSep />
          <div className="px-2 py-1 text-xs uppercase tracking-wide text-white/60">Layout Utils</div>
          <MenuItem onClick={() => setConfirmReset(true)}>Reset Landing Layout…</MenuItem>
        </ContextMenu>
      )}
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset Landing Layout?"
        message="This clears the saved Landing layout and reloads the app."
        confirmLabel="Reset"
        onConfirm={() => {
          try {
            localStorage.removeItem('traide.landing.tiles.v1')
            localStorage.removeItem('traide.landing.tiles.v1.layouts')
            toast.push('Landing layout reset. Reloading…')
            setTimeout(() => window.location.reload(), 400)
          } catch {}
        }}
      />
    </>
  )
}
