'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { MAINTENANT } from '@/lib/format'
import type { AuditEvent, ProvisioningJob } from '@/lib/types'
import { AUDIT, JOBS } from '@/lib/mock/ops'

/**
 * Atelier — couche d'état mutable posée par-dessus le jeu de données fictif.
 *
 * La maquette n'a ni base ni API : `src/lib/mock/` est figé et importé
 * directement par les écrans. Un bouton « Supprimer » ne pouvait donc que
 * pousser une notification, et la ressource restait dans la liste juste
 * derrière — ce qui se voit immédiatement en démonstration.
 *
 * L'atelier garde, le temps de la session, les collections qui ont été
 * touchées. Une collection jamais modifiée n'existe pas dans l'état : la
 * lecture retombe sur la graine importée du jeu de données, si bien que le
 * rendu serveur et le premier rendu client restent identiques et que
 * l'hydratation ne diverge pas. Un rechargement complet remet la
 * démonstration à son état d'origine, ce qui est le comportement attendu.
 */

export interface Entite {
  id: string
}

type Patch<T> = Partial<T> | ((item: T) => Partial<T>)

export interface SpecJob {
  /** Type technique, par exemple `vm.create` — sert au regroupement. */
  type: string
  label: string
  /** Libellés des étapes, dans l'ordre. */
  etapes: string[]
  /** Durée simulée d'une étape. Une démonstration ne doit pas s'endormir. */
  dureeEtapeMs?: number
  /** Appelé une fois la dernière étape terminée : bascule d'état, toast… */
  alFin?: () => void
}

interface CtxAtelier {
  lire: <T extends Entite>(nom: string, graine: readonly T[]) => T[]
  creer: <T extends Entite>(
    nom: string,
    graine: readonly T[],
    item: T | T[],
    ou?: 'debut' | 'fin',
  ) => void
  modifier: <T extends Entite>(
    nom: string,
    graine: readonly T[],
    id: string,
    patch: Patch<T>,
  ) => void
  /** Applique le même correctif à plusieurs entités — actions groupées. */
  modifierPlusieurs: <T extends Entite>(
    nom: string,
    graine: readonly T[],
    ids: string[],
    patch: Patch<T>,
  ) => void
  supprimer: (nom: string, graine: readonly Entite[], id: string | string[]) => void
  /** Identifiant séquentiel — jamais `Math.random()`, jamais `Date.now()`. */
  identifiant: (prefixe: string) => string
  jobs: ProvisioningJob[]
  lancerJob: (spec: SpecJob) => string
  /**
   * Écrit une entrée au journal d'audit. La vitrine promet un journal « qui
   * enregistre aussi les refus » : c'est ici que la promesse se tient, y compris
   * quand le RBAC refuse l'action.
   */
  journaliser: (ev: Omit<AuditEvent, 'id' | 'ts'> & { ts?: string }) => void
  journal: AuditEvent[]
  /** Nombre de collections modifiées depuis le chargement de la page. */
  collectionsModifiees: number
  reinitialiser: () => void
}

const Ctx = createContext<CtxAtelier | null>(null)

const NOM_JOBS = 'jobs'
const NOM_AUDIT = 'audit'

export function AtelierProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<Record<string, Entite[]>>({})
  const compteur = useRef(0)

  const lire = useCallback(
    <T extends Entite>(nom: string, graine: readonly T[]): T[] =>
      (collections[nom] as T[] | undefined) ?? (graine as T[]),
    [collections],
  )

  const ecrire = useCallback(
    <T extends Entite>(nom: string, graine: readonly T[], f: (courant: T[]) => T[]) => {
      setCollections((p) => ({
        ...p,
        [nom]: f((p[nom] as T[] | undefined) ?? ([...graine] as T[])),
      }))
    },
    [],
  )

  const creer = useCallback<CtxAtelier['creer']>(
    (nom, graine, item, ou = 'debut') => {
      const ajouts = Array.isArray(item) ? item : [item]
      ecrire(nom, graine, (c) => (ou === 'debut' ? [...ajouts, ...c] : [...c, ...ajouts]))
    },
    [ecrire],
  )

  const appliquer = <T extends Entite>(item: T, patch: Patch<T>): T => ({
    ...item,
    ...(typeof patch === 'function' ? patch(item) : patch),
  })

  const modifier = useCallback<CtxAtelier['modifier']>(
    (nom, graine, id, patch) => {
      ecrire(nom, graine, (c) => c.map((x) => (x.id === id ? appliquer(x, patch) : x)))
    },
    [ecrire],
  )

  const modifierPlusieurs = useCallback<CtxAtelier['modifierPlusieurs']>(
    (nom, graine, ids, patch) => {
      ecrire(nom, graine, (c) => c.map((x) => (ids.includes(x.id) ? appliquer(x, patch) : x)))
    },
    [ecrire],
  )

  const supprimer = useCallback<CtxAtelier['supprimer']>(
    (nom, graine, id) => {
      const cibles = Array.isArray(id) ? id : [id]
      ecrire(nom, graine, (c) => c.filter((x) => !cibles.includes(x.id)))
    },
    [ecrire],
  )

  const identifiant = useCallback((prefixe: string) => {
    compteur.current += 1
    return `${prefixe}-s${compteur.current}`
  }, [])

  const jobs = lire<ProvisioningJob>(NOM_JOBS, JOBS)
  const journal = lire<AuditEvent>(NOM_AUDIT, AUDIT)

  /**
   * Les entrées ajoutées pendant la session portent `MAINTENANT` décalé d'une
   * seconde par événement : sans ce décalage elles partageraient toutes le même
   * horodatage et le tri antéchronologique du journal deviendrait arbitraire.
   * `Date.now()` reste exclu — il ferait diverger serveur et client.
   */
  const journaliser = useCallback<CtxAtelier['journaliser']>(
    (ev) => {
      compteur.current += 1
      const decale = new Date(new Date(MAINTENANT).getTime() + compteur.current * 1000)
      creer(NOM_AUDIT, AUDIT, {
        ...ev,
        id: `ev-s${compteur.current}`,
        ts: ev.ts ?? decale.toISOString().replace('.000', ''),
      } as AuditEvent)
    },
    [creer],
  )

  const lancerJob = useCallback<CtxAtelier['lancerJob']>(
    (spec) => {
      const id = identifiant('job')
      const pas = spec.dureeEtapeMs ?? 1400
      const dureeEtapeS = Math.max(1, Math.round(pas / 1000))

      creer(NOM_JOBS, JOBS, {
        id,
        orgId: 'org-dba',
        type: spec.type,
        label: spec.label,
        statut: 'running',
        startedAt: MAINTENANT,
        taches: spec.etapes.map((nom, i) => ({
          ordre: i + 1,
          nom,
          statut: i === 0 ? 'running' : 'pending',
        })),
      } satisfies ProvisioningJob)

      spec.etapes.forEach((_, i) => {
        const derniere = i === spec.etapes.length - 1
        setTimeout(
          () => {
            modifier<ProvisioningJob>(NOM_JOBS, JOBS, id, (job) => ({
              statut: derniere ? 'done' : 'running',
              dureeS: derniere ? dureeEtapeS * spec.etapes.length : undefined,
              taches: job.taches.map((t) =>
                t.ordre <= i + 1
                  ? { ...t, statut: 'ok', dureeS: dureeEtapeS }
                  : t.ordre === i + 2
                    ? { ...t, statut: 'running' }
                    : t,
              ),
            }))
            if (derniere) spec.alFin?.()
          },
          pas * (i + 1),
        )
      })

      return id
    },
    [creer, identifiant, modifier],
  )

  const valeur = useMemo<CtxAtelier>(
    () => ({
      lire,
      creer,
      modifier,
      modifierPlusieurs,
      supprimer,
      identifiant,
      jobs,
      lancerJob,
      journaliser,
      journal,
      collectionsModifiees: Object.keys(collections).length,
      reinitialiser: () => setCollections({}),
    }),
    [
      lire,
      creer,
      modifier,
      modifierPlusieurs,
      supprimer,
      identifiant,
      jobs,
      lancerJob,
      journaliser,
      journal,
      collections,
    ],
  )

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>
}

export function useAtelier(): CtxAtelier {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAtelier doit être utilisé dans un AtelierProvider')
  return v
}

/**
 * Collection modifiable. `nom` identifie la collection dans l'atelier,
 * `graine` est le tableau du jeu de données fictif qui sert d'état initial.
 */
export function useCollection<T extends Entite>(nom: string, graine: readonly T[]) {
  const a = useAtelier()
  return useMemo(
    () => ({
      items: a.lire<T>(nom, graine),
      creer: (item: T | T[], ou: 'debut' | 'fin' = 'debut') => a.creer(nom, graine, item, ou),
      modifier: (id: string, patch: Patch<T>) => a.modifier(nom, graine, id, patch),
      modifierPlusieurs: (ids: string[], patch: Patch<T>) =>
        a.modifierPlusieurs(nom, graine, ids, patch),
      supprimer: (id: string | string[]) => a.supprimer(nom, graine, id),
      identifiant: a.identifiant,
    }),
    [a, nom, graine],
  )
}

/** Une entité de la collection, par identifiant. */
export function useEntite<T extends Entite>(nom: string, graine: readonly T[], id: string) {
  const { items, modifier, supprimer } = useCollection<T>(nom, graine)
  return {
    entite: items.find((x) => x.id === id),
    modifier: (patch: Patch<T>) => modifier(id, patch),
    supprimer: () => supprimer(id),
  }
}
