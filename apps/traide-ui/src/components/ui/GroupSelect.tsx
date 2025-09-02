"use client"
import { GROUPS } from '@/lib/symbols'
import { Field } from './Field'

export function GroupSelect({ value, onChange, label, className }: { value: string; onChange: (v: string) => void; label?: string; className?: string }) {
  const select = (
    <select
      className={(className || 'rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/90 outline-none hover:bg-white/10')}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {GROUPS.map((g) => (
        <option key={g.id} value={g.id} className="bg-neutral-900 text-white">
          {g.name}
        </option>
      ))}
    </select>
  )
  return label ? <Field label={label}>{select}</Field> : select
}
