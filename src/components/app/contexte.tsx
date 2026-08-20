'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Role } from '@/lib/types'
import { can, messageRefus, type Permission } from '@/lib/rbac'
import { ESPACES, ESPACE_DEFAUT } from '@/lib/mock/iaas'
import { ROLE_COURANT_DEFAUT } from '@/lib/mock/orgs'

export interface Toast {
  id: string
  titre: string
  detail?: string
  ton: 'ok' | 'info' | 'warn' | 'err'
}

interface CtxValeur {
  /** Rôle simulé — sélecteur précieux en démonstration (§4.1). */
  role: Role
  setRole: (r: Role) => void
  /** Espace Cloud sélectionné, contexte du groupe Infrastructure (§4.1). */
  espaceId: string
  setEspaceId: (id: string) => void
  perm: (actionId: string) => Permission
  autorise: (actionId: string) => boolean
  refus: (actionId: string) => string
  toasts: Toast[]
  pousser: (t: Omit<Toast, 'id'>) => void
  retirer: (id: string) => void
}

const Ctx = createContext<CtxValeur | null>(null)

export function AppProvider({
  children,
  roleInitial = ROLE_COURANT_DEFAUT,
}: {
  children: ReactNode
  roleInitial?: Role
}) {
  const [role, setRole] = useState<Role>(roleInitial)
  const [espaceId, setEspaceId] = useState(ESPACE_DEFAUT.id)
  const [toasts, setToasts] = useState<Toast[]>([])

  const pousser = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `t-${Math.round(performance.now() * 1000)}`
    setToasts((p) => [...p, { ...t, id }])
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 5200)
  }, [])

  const retirer = useCallback((id: string) => {
    setToasts((p) => p.filter((x) => x.id !== id))
  }, [])

  const valeur = useMemo<CtxValeur>(
    () => ({
      role,
      setRole,
      espaceId,
      setEspaceId,
      perm: (a) => can(role, a),
      autorise: (a) => can(role, a) === 'full',
      refus: (a) => messageRefus(a),
      toasts,
      pousser,
      retirer,
    }),
    [role, espaceId, toasts, pousser, retirer],
  )

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>
}

export function useApp(): CtxValeur {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp doit être utilisé dans un AppProvider')
  return v
}

/** Espace Cloud actuellement sélectionné. */
export function useEspace() {
  const { espaceId } = useApp()
  return ESPACES.find((e) => e.id === espaceId) ?? ESPACE_DEFAUT
}
