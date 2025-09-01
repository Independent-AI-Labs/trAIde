"use client"
import React from 'react'

export function TilePanel({ title, onClose, children }: { title: string; onClose?: () => void; children: React.ReactNode }) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-sm">
        <div className="font-medium text-white/90">{title}</div>
        {onClose && (
          <button aria-label="Close panel" className="rounded-md px-2 py-1 text-white/70 hover:bg-white/10" onClick={onClose}>
            ✕
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 p-3">{children}</div>
    </div>
  )
}

