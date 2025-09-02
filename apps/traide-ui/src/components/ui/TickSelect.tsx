"use client"
import React from 'react'

type Props = {
  value?: number
  onChange: (v: number | undefined) => void
  allowInherit?: boolean
  inheritLabel?: string
  className?: string
  title?: string
}

const PRESETS = [100, 250, 500, 1000, 2000]

export function TickSelect({ value, onChange, allowInherit = false, inheritLabel = 'Inherit', className, title = 'Tick' }: Props) {
  return (
    <select
      title={title}
      className={
        "rounded-md border border-white/20 bg-base-800/90 px-2 py-0.5 text-xs text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-white/30 " +
        (className || '')
      }
      value={value == null ? '' : String(value)}
      onChange={(e) => {
        const val = e.target.value
        onChange(val === '' ? undefined : Number(val))
      }}
    >
      {allowInherit && <option value="">{inheritLabel}</option>}
      {PRESETS.map((ms) => (
        <option key={ms} value={ms}>{formatMs(ms)}</option>
      ))}
    </select>
  )
}

function formatMs(ms: number) {
  if (ms < 1000) return `${ms/1000}s`
  return `${Math.round(ms/1000)}s`
}

