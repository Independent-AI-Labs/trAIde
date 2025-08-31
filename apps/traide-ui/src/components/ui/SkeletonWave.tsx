import { clsx } from 'clsx'

type Props = {
  className?: string
  rows?: number
}

export function SkeletonWave({ className, rows = 3 }: Props) {
  return (
    <div className={clsx('relative overflow-hidden rounded-xl glass-soft p-4', className)}>
      <div className="absolute -left-1/2 top-0 h-full w-[200%] -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-wave" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 w-full rounded bg-white/10" style={{ width: `${80 - i * 10}%` }} />
        ))}
      </div>
    </div>
  )
}

