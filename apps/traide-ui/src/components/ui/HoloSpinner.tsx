import { clsx } from 'clsx'

type Props = {
  size?: number
  className?: string
  label?: string
}

export function HoloSpinner({ size = 56, className, label }: Props) {
  const s = `${size}px`
  return (
    <div className={clsx('relative inline-flex flex-col items-center justify-center', className)}>
      <div className="relative" style={{ width: s, height: s }}>
        <div className="absolute inset-0 rounded-full border-t-2 border-accent-teal/70 animate-spinFancy" />
        <div className="absolute inset-0 rounded-full border-b-2 border-accent-purple/70 animate-spinFancy" style={{ animationDelay: '0.2s' }} />
        <div className="absolute inset-2 rounded-full bg-white/5 backdrop-blur-xs shadow-inner" />
        <div className="absolute inset-0 rounded-full opacity-50 blur-md" style={{ background: 'conic-gradient(from 0deg, rgba(45,212,191,0.0), rgba(45,212,191,0.35), rgba(128,90,213,0.35), rgba(255,106,213,0.25), rgba(45,212,191,0.0))' }} />
      </div>
      {label && <div className="mt-3 text-sm text-white/80">{label}</div>}
    </div>
  )
}

