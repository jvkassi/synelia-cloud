import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type Tone = 'neutral' | 'violet' | 'accent' | 'ok' | 'warn' | 'err' | 'info'

const TONES: Record<Tone, string> = {
  neutral: 'bg-g-100 text-g-700 border-g-300',
  violet: 'bg-p-100 text-p-700 border-p-300',
  accent: 'bg-m-050 text-m-600 border-m-600/25',
  ok: 'bg-ok-bg text-ok border-ok/25',
  warn: 'bg-warn-bg text-warn border-warn/25',
  err: 'bg-err-bg text-err border-err/25',
  info: 'bg-info-bg text-info border-info/25',
}

const DOTS: Record<Tone, string> = {
  neutral: 'bg-g-500',
  violet: 'bg-p-600',
  accent: 'bg-m-600',
  ok: 'bg-ok',
  warn: 'bg-warn',
  err: 'bg-err',
  info: 'bg-info',
}

export function Badge({
  tone = 'neutral',
  children,
  dot,
  className,
  size = 'md',
}: {
  tone?: Tone
  children: ReactNode
  dot?: boolean
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2.5 py-[3px] text-[12px]',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', DOTS[tone])} />}
      {children}
    </span>
  )
}

/** Pastille d'état, éventuellement pulsante pour les états transitoires. */
export function StatusDot({
  tone = 'neutral',
  pulse,
  className,
  label,
}: {
  tone?: Tone
  pulse?: boolean
  className?: string
  label?: string
}) {
  return (
    <span
      className={cn('relative inline-flex h-2 w-2 shrink-0', className)}
      title={label}
      aria-label={label}
    >
      {pulse && (
        <span
          className={cn('absolute inset-0 rounded-full animate-pulse-dot opacity-60', DOTS[tone])}
        />
      )}
      <span className={cn('relative h-2 w-2 rounded-full', DOTS[tone])} />
    </span>
  )
}

/** Étiquette de section en micro-typographie. */
export function MicroLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <p className={cn('type-micro text-g-500', className)}>{children}</p>
}
