'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Input } from './field'

/** Infobulle au survol — sert notamment à nommer le rôle requis (§10). */
export function Tooltip({
  content,
  children,
  side = 'top',
  className,
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}) {
  const pos = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side]
  return (
    <span className={cn('group/tt relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 hidden w-max max-w-64 rounded-[6px] bg-p-900 px-2.5 py-1.5 text-[11.5px] font-medium leading-snug text-white shadow-[0_4px_16px_rgba(43,27,77,.28)] group-hover/tt:block',
          pos,
        )}
      >
        {content}
      </span>
    </span>
  )
}

/** Panneau flottant déclenché au clic. */
export function Popover({
  trigger,
  children,
  align = 'right',
  width = 'w-72',
  className,
}: {
  trigger: (open: boolean) => ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'left' | 'right'
  width?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="block">
        {trigger(open)}
      </button>
      {open && (
        <div
          className={cn(
            'absolute z-40 mt-2 animate-fade-in rounded-[10px] border border-g-300 bg-white shadow-[0_12px_36px_rgba(43,27,77,.16)]',
            width,
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open) return null
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div
        className="fixed inset-0 bg-p-900/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        className={cn(
          'relative z-10 my-auto w-full animate-scale-in rounded-[14px] bg-white shadow-[0_24px_64px_rgba(43,27,77,.18)]',
          w,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-g-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="type-h2">{title}</h2>
            {description && <p className="mt-1 text-[13px] text-g-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-1 -mt-1 rounded-[6px] p-1.5 text-g-500 transition-colors hover:bg-g-100 hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
        {children && <div className="px-5 py-4">{children}</div>}
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-g-100 bg-g-050 px-5 py-3.5 rounded-b-[14px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/** Panneau latéral. `size="full"` sert par exemple à la console KVM. */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
}) {
  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open) return null
  const w = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    full: 'max-w-none w-screen',
  }[size]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-p-900/35 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal
        aria-label={title}
        className={cn(
          'relative z-10 flex h-full w-full animate-slide-in-right flex-col bg-white shadow-[0_0_64px_rgba(43,27,77,.24)]',
          w,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-g-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="type-h2">{title}</h2>
            {description && <p className="mt-1 text-[13px] text-g-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-1 -mt-1 rounded-[6px] p-1.5 text-g-500 transition-colors hover:bg-g-100 hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-g-100 bg-g-050 px-5 py-3.5">
            {footer}
          </div>
        )}
      </aside>
    </div>
  )
}

/**
 * Confirmation d'action destructive : exige la saisie du nom exact de la
 * ressource et rappelle ce qui sera perdu (§1.6).
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  titre,
  ressource,
  pertes,
  libelleAction = 'Supprimer définitivement',
}: {
  open: boolean
  onClose: () => void
  onConfirm?: () => void
  titre: string
  ressource: string
  pertes: string[]
  libelleAction?: string
}) {
  const [saisie, setSaisie] = useState('')
  const valide = saisie.trim() === ressource

  return (
    <Modal
      open={open}
      onClose={() => {
        setSaisie('')
        onClose()
      }}
      title={titre}
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              setSaisie('')
              onClose()
            }}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            disabled={!valide}
            onClick={() => {
              setSaisie('')
              onConfirm?.()
              onClose()
            }}
          >
            {libelleAction}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-3 rounded-[8px] border-l-4 border-err bg-err-bg px-3.5 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-err" />
          <div>
            <p className="text-[13px] font-semibold text-ink">Cette action est irréversible.</p>
            <ul className="mt-1.5 space-y-1">
              {pertes.map((p) => (
                <li key={p} className="text-[12.5px] text-g-700">
                  · {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[12.5px] text-g-700">
            Saisissez{' '}
            <code className="rounded bg-g-100 px-1.5 py-0.5 font-mono text-[12px] font-semibold text-ink">
              {ressource}
            </code>{' '}
            pour confirmer.
          </p>
          <Input
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder={ressource}
            autoFocus
          />
        </div>
      </div>
    </Modal>
  )
}
