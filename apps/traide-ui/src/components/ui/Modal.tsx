"use client"
import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export type ModalButton = {
  label: string
  intent?: 'primary' | 'secondary' | 'danger' | 'ghost'
  onClick?: () => void
  autoFocus?: boolean
  disabled?: boolean
}

export function Modal({ open, onClose, title, children, buttons = [] }: { open: boolean; onClose: () => void; title?: React.ReactNode; children?: React.ReactNode; buttons?: ModalButton[] }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const firstBtnRef = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    if (open) {
      document.addEventListener('keydown', onEsc)
      // focus first autofocus button or first button/input
      setTimeout(() => {
        const auto = ref.current?.querySelector('[data-autofocus="1"]') as HTMLElement | null
        if (auto) auto.focus()
        else firstBtnRef.current?.focus()
      }, 0)
    }
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open) return null
  const body = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm ui-overlay" onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}>
      <div ref={ref} className="w-[min(92vw,520px)] rounded-xl border border-white/10 bg-base-900/90 p-4 text-sm text-white shadow-2xl">
        {title && <div className="mb-3 text-base font-medium text-white/90">{title}</div>}
        {children && <div className="mb-4 text-white/80">{children}</div>}
        {buttons.length > 0 && (
          <div className="flex items-center justify-end gap-2">
            {buttons.map((b, i) => {
              const cls =
                b.intent === 'primary' ? 'bg-white/20 hover:bg-white/25' :
                b.intent === 'danger' ? 'bg-rose-500/20 hover:bg-rose-500/25 text-rose-200' :
                b.intent === 'ghost' ? 'bg-white/0 hover:bg-white/10' :
                'bg-white/10 hover:bg-white/15'
              return (
                <button
                  key={i}
                  ref={i === 0 ? firstBtnRef : undefined}
                  data-autofocus={b.autoFocus ? '1' : undefined}
                  className={`rounded-lg px-3 py-1.5 text-sm ${cls} disabled:opacity-50`}
                  onClick={b.onClick}
                  disabled={!!b.disabled}
                >
                  {b.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <button aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
    </div>
  )
  return createPortal(body, document.body)
}

export function ConfirmDialog({ open, onClose, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', intent = 'danger', onConfirm }: { open: boolean; onClose: () => void; title?: React.ReactNode; message?: React.ReactNode; confirmLabel?: string; cancelLabel?: string; intent?: 'primary'|'danger'|'secondary'; onConfirm: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      buttons={[
        { label: cancelLabel, intent: 'secondary', onClick: onClose },
        { label: confirmLabel, intent: intent === 'danger' ? 'danger' : 'primary', onClick: () => { onConfirm(); onClose() }, autoFocus: true },
      ]}
    >
      {message}
    </Modal>
  )
}

export function PromptDialog({ open, onClose, title, placeholder = 'Enter value…', initial = '', confirmLabel = 'Save', cancelLabel = 'Cancel', onSubmit, showCancel = true, buttonPlacement = 'footer' }: { open: boolean; onClose: () => void; title?: React.ReactNode; placeholder?: string; initial?: string; confirmLabel?: string; cancelLabel?: string; onSubmit: (value: string) => void; showCancel?: boolean; buttonPlacement?: 'footer' | 'inline' }) {
  const [val, setVal] = React.useState(initial)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  useEffect(() => { if (open) setVal(initial) }, [open, initial])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 0) }, [open])
  const doSubmit = () => { const v = val.trim(); if (v) { onSubmit(v); onClose() } }
  if (buttonPlacement === 'inline') {
    return (
      <Modal open={open} onClose={onClose} title={title}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            className="mt-1 w-full rounded-lg border border-white/20 bg-base-800/80 px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
            placeholder={placeholder}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') doSubmit() }}
          />
          <button
            className="mt-1 shrink-0 rounded-lg bg-white/20 px-3 py-2 text-sm hover:bg-white/25 disabled:opacity-50"
            onClick={doSubmit}
            disabled={!val.trim()}
          >
            {confirmLabel}
          </button>
        </div>
      </Modal>
    )
  }
  // footer placement (default)
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      buttons={[
        ...(showCancel ? [{ label: cancelLabel, intent: 'secondary', onClick: onClose } as const] : []),
        { label: confirmLabel, intent: 'primary', onClick: doSubmit, autoFocus: true, disabled: !val.trim() },
      ]}
    >
      <input
        ref={inputRef}
        className="mt-1 w-full rounded-lg border border-white/20 bg-base-800/80 px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') doSubmit() }}
      />
    </Modal>
  )
}
