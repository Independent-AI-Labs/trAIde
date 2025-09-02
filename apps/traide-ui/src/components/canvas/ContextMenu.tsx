"use client"
import React, { useEffect, useLayoutEffect, useRef } from 'react'

type Placement = 'point' | 'below-center'

type ContextMenuProps = {
  // Point anchor (canvas, generic usage)
  x?: number
  y?: number
  // Element anchor (preferred for UI controls like header buttons)
  anchorEl?: HTMLElement | null
  placement?: Placement
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function ContextMenu({ x, y, anchorEl, onClose, children, className = 'w-56', placement = 'point' }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const pos = useRef<{ x: number; y: number }>({ x: x ?? 0, y: y ?? 0 })
  useEffect(() => { if (typeof x === 'number' && typeof y === 'number') pos.current = { x, y } }, [x, y])
  useLayoutEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) onClose()
    }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    function clamp() {
      const el = ref.current; if (!el) return
      el.style.visibility = 'hidden'
      // Measure menu size (unclipped). Use scrollWidth/Height as a fallback for reliability.
      const rect = el.getBoundingClientRect()
      const menuW = Math.max(rect.width, el.scrollWidth)
      const menuH = Math.max(rect.height, el.scrollHeight)

      const vv: any = (window as any).visualViewport
      const doc = document.documentElement
      const vw = (vv?.width as number | undefined) || doc?.clientWidth || window.innerWidth
      const vh = (vv?.height as number | undefined) || doc?.clientHeight || window.innerHeight
      const margin = 24

      // Determine anchor point
      let ax = pos.current.x
      let ay = pos.current.y
      if (anchorEl && placement === 'below-center') {
        const a = anchorEl.getBoundingClientRect()
        ax = Math.round(a.left + a.width / 2)
        ay = Math.round(a.bottom + 8)
      }
      let left: number
      let top: number
      if (placement === 'below-center') {
        // x is anchor center; prefer below, flip above if overflow
        left = ax - menuW / 2
        top = ay
        // Clamp horizontally within viewport
        left = Math.min(Math.max(margin, left), vw - menuW - margin)
        // Flip vertically if it would overflow bottom
        const wouldOverflowBottom = top + menuH + margin > vh
        if (wouldOverflowBottom) top = Math.max(margin, ay - 8 - menuH)
        // Final vertical clamp
        top = Math.min(Math.max(margin, top), vh - menuH - margin)
      } else {
        // point: choose side based on available space, then clamp
        const rightSpace = vw - ax - margin
        const leftSpace = ax - margin
        const bottomSpace = vh - ay - margin
        const topSpace = ay - margin
        const preferRight = menuW <= rightSpace || rightSpace >= leftSpace
        const preferBottom = menuH <= bottomSpace || bottomSpace >= topSpace
        const horiz = preferRight ? 'right' : 'left'
        const vert = preferBottom ? 'bottom' : 'top'
        left = horiz === 'right' ? ax : ax - menuW
        top = vert === 'bottom' ? ay : ay - menuH
        left = Math.min(Math.max(margin, left), vw - menuW - margin)
        top = Math.min(Math.max(margin, top), vh - menuH - margin)
      }
      el.style.left = `${Math.round(left)}px`
      el.style.top = `${Math.round(top)}px`
      el.style.right = 'auto'
      el.style.bottom = 'auto'
      el.style.maxWidth = `${vw - margin * 2}px`
      el.style.maxHeight = `${vh - margin * 2}px`
      el.style.visibility = 'visible'
    }
    clamp()
    const ro = new ResizeObserver(() => clamp())
    if (ref.current) ro.observe(ref.current)
    window.addEventListener('resize', clamp)
    window.addEventListener('scroll', clamp, true)
    try { (window as any).visualViewport?.addEventListener('resize', clamp) } catch {}
    try { (window as any).visualViewport?.addEventListener('scroll', clamp) } catch {}
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      window.removeEventListener('resize', clamp)
      window.removeEventListener('scroll', clamp, true)
      try { (window as any).visualViewport?.removeEventListener('resize', clamp) } catch {}
      try { (window as any).visualViewport?.removeEventListener('scroll', clamp) } catch {}
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
      try { ro.disconnect() } catch {}
    }
  }, [onClose, anchorEl, placement])
  return (
    <div
      ref={ref}
      className={`fixed z-50 overflow-auto rounded-lg border border-white/10 bg-black/80 p-1 text-sm shadow-xl backdrop-blur ui-overlay ${className}`}
      style={{ left: x, top: y, visibility: 'hidden' }}
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
