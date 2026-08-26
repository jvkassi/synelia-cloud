'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ProvisioningJob, Role, TacheSimulee } from '@/lib/types'
import { can, messageRefus, type Permission } from '@/lib/rbac'
import { ESPACES, ESPACE_DEFAUT } from '@/lib/mock/iaas'
import { ROLE_COURANT_DEFAUT } from '@/lib/mock/orgs'
import { workflowById } from '@/lib/mock/workflows'
import {
  CADENCE_MS,
  jobDepuisTache,
  libelleWorkflow,
  tacheActive,
} from '@/lib/workflows'

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
  /** Tâches lancées pendant la session, la plus récente d'abord. */
  taches: TacheSimulee[]
  /** Jobs dérivés des tâches, prêts à afficher. */
  jobs: ProvisioningJob[]
  /** Lance un workflow du catalogue sur une ressource. Renvoie l'identifiant. */
  lancer: (workflowId: string, cible: string, href?: string) => string
  /** Reprend une tâche échouée : la reprise aboutit, les choix sont conservés. */
  relancer: (id: string) => void
  /** Retire une tâche terminée du centre de tâches. */
  oublier: (id: string) => void
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

  // ─── Moteur des workflows simulés ───────────────────────────────────
  // Une trentaine d'écrans annoncent un « suivi dans le centre de tâches ».
  // Sans moteur, cette promesse s'arrêtait à la notification : l'utilisateur ne
  // voyait ni la file, ni les étapes, ni le diagnostic d'un échec.
  const [taches, setTaches] = useState<TacheSimulee[]>([])
  const compteur = useRef(0)
  const notifiees = useRef(new Set<string>())

  const lancer = useCallback(
    (workflowId: string, cible: string, href?: string) => {
      const def = workflowById(workflowId)
      compteur.current += 1
      const id = `wf-${compteur.current}`
      setTaches((p) => [
        { id, workflowId, cible, ecoule: 0, essai: 0, href: href ?? def?.href },
        ...p,
      ])
      if (def) {
        pousser({
          ton: 'info',
          titre: libelleWorkflow(def, cible),
          detail: `${def.lancement} Suivi dans le centre de tâches.`,
        })
      }
      return id
    },
    [pousser],
  )

  const relancer = useCallback(
    (id: string) => {
      setTaches((p) =>
        p.map((t) => (t.id === id ? { ...t, ecoule: 0, essai: t.essai + 1 } : t)),
      )
      const t = taches.find((x) => x.id === id)
      const def = t && workflowById(t.workflowId)
      if (def && t) {
        pousser({
          ton: 'info',
          titre: `Reprise · ${libelleWorkflow(def, t.cible)}`,
          detail:
            'Le job repart de l’étape échouée. Vos choix de configuration sont conservés.',
        })
      }
    },
    [taches, pousser],
  )

  const oublier = useCallback((id: string) => {
    setTaches((p) => p.filter((t) => t.id !== id))
  }, [])

  // L'horloge ne tourne que s'il reste quelque chose à faire avancer.
  const actif = taches.some(tacheActive)
  useEffect(() => {
    if (!actif) return
    const horloge = window.setInterval(() => {
      setTaches((p) =>
        p.map((t) => (tacheActive(t) ? { ...t, ecoule: t.ecoule + CADENCE_MS } : t)),
      )
    }, CADENCE_MS)
    return () => window.clearInterval(horloge)
  }, [actif])

  const jobs = useMemo(() => taches.map(jobDepuisTache), [taches])

  // Notification de fin — une seule par essai, y compris après une reprise.
  useEffect(() => {
    for (const t of taches) {
      const cle = `${t.id}-${t.essai}`
      if (tacheActive(t) || notifiees.current.has(cle)) continue
      notifiees.current.add(cle)
      const job = jobDepuisTache(t)
      const def = workflowById(t.workflowId)
      if (job.statut === 'done') {
        pousser({ ton: 'ok', titre: job.label, detail: def?.fin })
      } else {
        const ratee = job.taches.find((x) => x.statut === 'failed')
        pousser({
          ton: 'err',
          titre: `Échec · ${job.label}`,
          detail: `${ratee ? `Étape « ${ratee.nom} ». ` : ''}Diagnostic et reprise dans le centre de tâches.`,
        })
      }
    }
  }, [taches, pousser])

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
      taches,
      jobs,
      lancer,
      relancer,
      oublier,
    }),
    [role, espaceId, toasts, pousser, retirer, taches, jobs, lancer, relancer, oublier],
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
