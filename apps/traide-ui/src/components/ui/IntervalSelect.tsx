"use client"
const TF = ['1m', '5m', '15m', '1h', '4h', '1d'] as const
type TFVal = typeof TF[number]

export function IntervalSelect({ value, onChange }: { value: TFVal; onChange: (v: TFVal) => void }) {
  return (
    <select
      className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/90 outline-none hover:bg-white/10"
      value={value}
      onChange={(e) => onChange(e.target.value as TFVal)}
    >
      {TF.map((t) => (
        <option key={t} value={t} className="bg-neutral-900 text-white">
          {t}
        </option>
      ))}
    </select>
  )
}

