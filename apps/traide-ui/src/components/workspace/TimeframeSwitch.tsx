"use client"
import { clsx } from 'clsx'

const TF = ['1m', '5m', '15m', '1h', '4h', '1d'] as const
type TFVal = typeof TF[number]

export function TimeframeSwitch({ value, onChange }: { value: TFVal; onChange: (v: TFVal) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-white/5 p-1">
      {TF.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={clsx(
            'rounded-lg px-2.5 py-1.5 text-xs transition-colors',
            value === t ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10',
          )}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

