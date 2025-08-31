import { clsx } from 'clsx'
import type { PropsWithChildren, ReactNode, ButtonHTMLAttributes } from 'react'

type Props = PropsWithChildren<{
  title?: ReactNode
  subtitle?: ReactNode
  className?: string
  floating?: boolean
}>

export function GlassCard({ title, subtitle, children, className, floating }: Props) {
  return (
    <div className={clsx('group relative glass inner-border overflow-hidden', floating && 'animate-float', className)}>
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-accent-teal/10 via-transparent to-accent-purple/10" />
      <div className="relative p-6">
        {(title || subtitle) && (
          <div className="mb-4">
            {title && <h3 className="text-lg font-semibold text-glow">{title}</h3>}
            {subtitle && <p className="text-sm text-white/70">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
      <div className="sheen" />
    </div>
  )
}

export function GlassButton({ children, className, ...rest }: PropsWithChildren<{ className?: string } & ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      {...rest}
      type={rest.type || 'button'}
      className={clsx('relative inline-flex items-center gap-2 rounded-xl px-4 py-2 glass-soft inner-border transition-colors hover:bg-white/10 active:scale-[0.99]', className)}
    >
      <span className="absolute inset-0 rounded-xl ring-1 ring-white/10" />
      <span className="relative">{children}</span>
    </button>
  )
}
