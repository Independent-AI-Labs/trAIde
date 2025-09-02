"use client"
import React, { useState } from 'react'
import { LayoutsMenu } from './LayoutsMenu'

function LayoutsIcon({ className = 'h-4 w-4' }: { className?: string }) {
  // simple 3x3 grid icon
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <rect x="3" y="3" width="6" height="6" rx="1" opacity="0.9" />
      <rect x="9" y="3" width="6" height="6" rx="1" opacity="0.75" />
      <rect x="15" y="3" width="6" height="6" rx="1" opacity="0.6" />
      <rect x="3" y="9" width="6" height="6" rx="1" opacity="0.75" />
      <rect x="9" y="9" width="6" height="6" rx="1" opacity="0.9" />
      <rect x="15" y="9" width="6" height="6" rx="1" opacity="0.75" />
      <rect x="3" y="15" width="6" height="6" rx="1" opacity="0.6" />
      <rect x="9" y="15" width="6" height="6" rx="1" opacity="0.75" />
      <rect x="15" y="15" width="6" height="6" rx="1" opacity="0.9" />
    </svg>
  )
}

export function LayoutsButton() {
  const [open, setOpen] = useState<null | { anchorEl: HTMLElement }>(null)
  return (
    <>
      <button
        aria-label="Open Layouts"
        title="Layouts"
        className="rounded-xl bg-white/10 p-2 text-white/80 hover:bg-white/15"
        onClick={(e) => {
          setOpen({ anchorEl: e.currentTarget as HTMLElement })
        }}
      >
        <LayoutsIcon className="h-4 w-4" />
      </button>
      {open && <LayoutsMenu anchorEl={open.anchorEl} onClose={() => setOpen(null)} />}
    </>
  )
}
