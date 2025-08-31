"use client"
import { useState } from 'react'

export function SymbolInput({ value, onChange, onEnter, placeholder = 'SYMBOL', className }: { value: string; onChange: (v: string) => void; onEnter?: () => void; placeholder?: string; className?: string }) {
  const [val, setVal] = useState(value)
  return (
    <input
      className={className || 'w-40 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm uppercase tracking-wide text-white placeholder-white/50 outline-none focus:border-white/30'}
      value={val}
      placeholder={placeholder}
      onChange={(e) => { const v = e.target.value.toUpperCase(); setVal(v); onChange(v) }}
      onKeyDown={(e) => { if (e.key === 'Enter') onEnter?.() }}
    />
  )
}

