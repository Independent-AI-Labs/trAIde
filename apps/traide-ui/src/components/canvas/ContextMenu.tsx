"use client"
import React, { useEffect, useRef } from 'react'

export function ContextMenu({ x, y, onClose, children }: { x: number; y: number; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) onClose()
    }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc) }
  }, [onClose])
  return (
    <div
      ref={ref}
      className="fixed z-50 w-56 rounded-lg border border-white/10 bg-black/80 p-1 text-sm shadow-xl backdrop-blur ui-overlay"
      style={{ left: x, top: y }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}
    >
      {children}
    </div>
  )
}

export function MenuItem({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-white/90 hover:bg-white/10">
      {children}
    </button>
  )
}

export function MenuSep() {
  return <div className="my-1 h-px w-full bg-white/10" />
}
