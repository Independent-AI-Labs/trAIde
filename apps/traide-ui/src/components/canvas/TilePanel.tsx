"use client"
import React, { useEffect, useRef, useState } from 'react'

export function TilePanel({ title, titleEditable, onTitleChange, onClose, onDragStart, headerRight, children }: { title: string; titleEditable?: boolean; onTitleChange?: (v: string) => void; onClose?: () => void; onDragStart?: (e: React.MouseEvent) => void; headerRight?: React.ReactNode; children: React.ReactNode }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const inputRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => { setDraft(title) }, [title])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div
        className="flex cursor-move items-center justify-between border-b border-white/10 px-3 py-2 text-sm"
        data-draggable-header="1"
        onMouseDown={(e) => {
          if (e.button !== 0) return
          onDragStart?.(e)
        }}
      >
        <div className="font-medium text-white/90">
          {titleEditable && onTitleChange ? (
            editing ? (
              <input
                ref={inputRef}
                className="rounded-md border border-white/20 bg-base-800/90 px-2 py-0.5 text-xs text-white outline-none focus:ring-1 focus:ring-white/30"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => { setEditing(false); onTitleChange(draft.trim() || title) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { setEditing(false); onTitleChange(draft.trim() || title) }
                  else if (e.key === 'Escape') { setEditing(false); setDraft(title) }
                }}
              />
            ) : (
              <button className="rounded px-1 hover:bg-white/10" onClick={(e) => { e.stopPropagation(); setEditing(true) }} title="Rename">
                {title}
              </button>
            )
          ) : (
            <span>{title}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {headerRight}
          {onClose && (
            <button
              aria-label="Close panel"
              className="rounded-md px-2 py-1 text-white/70 hover:bg-white/10"
              onMouseDown={(e) => { e.stopPropagation() }}
              onClick={(e) => { e.stopPropagation(); onClose() }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 p-3">{children}</div>
    </div>
  )
}
