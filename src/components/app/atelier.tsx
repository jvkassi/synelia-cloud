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
import { correlationId } from '@/lib/utils'
import type { AuditEvent, DefinitionWorkflow, ProvisioningJob } from '@/lib/types'
import { AUDIT, JOBS, JOBS_PLATEFORME } from '@/lib/mock/ops'
import {
  etapeEnEchec,
  libelleWorkflow,
  planifier,
  workflowById,
} from '@/lib/workflows'

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
  /**
   * Identifiant d'un workflow du catalogue. Quand il est fourni, le libellé,
   * les étapes, leurs durées annoncées et l'échec éventuel viennent de là —
   * c'est la forme à préférer : deux écrans qui lancent la même opération
   * racontent alors la même chose.
   */
  workflow?: string
  /** Ressource concernée, substituée à `{cible}` dans le libellé du catalogue. */
  cible?: string
  /** Type technique, par exemple `vm.create` — sert au regroupement. */
  type?: string
  label?: string
  /** Libellés des étapes, dans l'ordre. Ignoré si `workflow` est fourni. */
  etapes?: string[]
  /** Durée simulée d'une étape, pour la forme sans catalogue. */
  dureeEtapeMs?: number
  /** Appelé une fois la dernière étape terminée : bascule d'état, toast… */
  alFin?: () => void
  /** Appelé si l'étape écrite comme échouée interrompt la séquence. */
  alEchec?: (etape: string) => void
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
   * Reprend un job échoué à son étape échouée. La collection se déduit de la
   * portée du workflow : le site d'appel n'a pas à savoir dans laquelle des deux
   * le job est rangé. Faux si le job est inconnu ou si son type n'est pas au
   * catalogue — auquel cas le bouton de reprise ne doit pas être proposé.
   */
  reprendreJob: (id: string) => boolean
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
const NOM_JOBS_PLATEFORME = 'jobs-plateforme'
const NOM_AUDIT = 'audit'

/**
 * Où ranger le job d'un workflow. Les deux espaces ont leur propre collection —
 * le centre de tâches du client lit `jobs`, celui du fournisseur
 * `jobs-plateforme`. La portée déclarée au catalogue tranche, sans que chaque
 * site d'appel ait à le redire : un rééquilibrage de capacité lancé depuis
 * l'espace fournisseur atterrissait sinon dans le centre de tâches du client,
 * invisible là où on venait de le déclencher.
 */
function collectionDe(def: DefinitionWorkflow) {
  return def.portee === 'fournisseur'
    ? ([NOM_JOBS_PLATEFORME, JOBS_PLATEFORME] as const)
    : ([NOM_JOBS, JOBS] as const)
}

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

  /**
   * Effets à appliquer à la fin d'un job, gardés hors de l'état : un job qui
   * échoue ne doit pas muter les collections — la ressource ne doit pas
   * apparaître — mais sa reprise, elle, doit pouvoir le faire.
   */
  const effetsDiferes = useRef(new Map<string, () => void>())
  const alertesEchec = useRef(new Map<string, (etape: string) => void>())
  const essais = useRef(new Map<string, number>())

  /**
   * Joue une séquence d'étapes sur un job existant. `depuis` permet de
   * reprendre à l'étape échouée : les précédentes restent acquises.
   */
  const jouer = useCallback(
    (
      id: string,
      def: DefinitionWorkflow,
      essai: number,
      depuis: number,
      nom: string = NOM_JOBS,
      graine: readonly ProvisioningJob[] = JOBS,
    ) => {
      const rangEchec = etapeEnEchec(def, essai)
      const plan = planifier(def, { depuis, jusqua: rangEchec || def.etapes.length })
      const totalAnnonce = def.etapes.reduce((a, e) => a + e.dureeS, 0)

      plan.forEach((etape, i) => {
        const ordre = depuis + i + 1
        const derniere = i === plan.length - 1
        const ratee = derniere && rangEchec > 0
        const suivante = def.etapes[ordre]

        setTimeout(() => {
          modifier<ProvisioningJob>(nom, graine, id, (job) => ({
            statut: ratee
              ? def.echec?.rollback
                ? 'rolled_back'
                : 'failed'
              : derniere
                ? 'done'
                : 'running',
            dureeS: derniere
              ? ratee
                ? def.etapes.slice(0, ordre).reduce((a, e) => a + e.dureeS, 0)
                : totalAnnonce
              : undefined,
            erreur:
              ratee && def.echec
                ? {
                    message: def.echec.message,
                    correlationId: correlationId(`${def.id}-${job.label}`),
                    suggestion: def.echec.suggestion,
                  }
                : undefined,
            taches: job.taches.map((t) =>
              t.ordre === ordre
                ? ratee
                  ? {
                      ...t,
                      statut: 'failed',
                      dureeS: etape.dureeS,
                      message: 'Interrompue — voir le diagnostic',
                    }
                  : { ...t, statut: 'ok', dureeS: etape.dureeS, message: undefined }
                : t.ordre === ordre + 1 && !ratee
                  ? { ...t, statut: 'running', message: suivante?.message }
                  : t,
            ),
          }))
          if (derniere && !ratee) {
            effetsDiferes.current.get(id)?.()
            effetsDiferes.current.delete(id)
          }
          if (ratee) alertesEchec.current.get(id)?.(etape.nom)
        }, etape.aMs)
      })
    },
    [modifier],
  )

  const lancerJob = useCallback<CtxAtelier['lancerJob']>(
    (spec) => {
      const id = identifiant('job')
      const def = spec.workflow ? workflowById(spec.workflow) : undefined

      if (def) {
        const [nom, graine] = collectionDe(def)
        const label = spec.label ?? libelleWorkflow(def, spec.cible ?? '')
        creer(nom, graine, {
          id,
          orgId: 'org-dba',
          type: def.id,
          label,
          statut: 'running',
          startedAt: MAINTENANT,
          taches: def.etapes.map((e, i) => ({
            ordre: i + 1,
            nom: e.nom,
            statut: i === 0 ? 'running' : 'pending',
            message: i === 0 ? e.message : undefined,
          })),
        } satisfies ProvisioningJob)

        if (spec.alFin) effetsDiferes.current.set(id, spec.alFin)
        if (spec.alEchec) alertesEchec.current.set(id, spec.alEchec)
        essais.current.set(id, 0)
        jouer(id, def, 0, 0, nom, graine)
        return id
      }

      // Forme sans catalogue : étapes fournies au site d'appel, cadence fixe.
      const etapes = spec.etapes ?? []
      const pas = spec.dureeEtapeMs ?? 1400
      const dureeEtapeS = Math.max(1, Math.round(pas / 1000))

      creer(NOM_JOBS, JOBS, {
        id,
        orgId: 'org-dba',
        type: spec.type ?? 'ui.action',
        label: spec.label ?? 'Opération',
        statut: 'running',
        startedAt: MAINTENANT,
        taches: etapes.map((nom, i) => ({
          ordre: i + 1,
          nom,
          statut: i === 0 ? 'running' : 'pending',
        })),
      } satisfies ProvisioningJob)

      etapes.forEach((_, i) => {
        const derniere = i === etapes.length - 1
        setTimeout(
          () => {
            modifier<ProvisioningJob>(NOM_JOBS, JOBS, id, (job) => ({
              statut: derniere ? 'done' : 'running',
              dureeS: derniere ? dureeEtapeS * etapes.length : undefined,
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
    [creer, identifiant, jouer, modifier],
  )

  /**
   * Reprise d'un job échoué, sur le job lui-même : l'étape échouée repart, les
   * précédentes restent acquises, et l'essai suivant aboutit. Sans cela un
   * échec resterait un cul-de-sac, ou obligerait à lancer un second job qui
   * raconterait deux fois la même opération.
   *
   * Le jeu de données du fournisseur reprend celui du client (`JOBS_PLATEFORME`
   * commence par `...JOBS`) : une souscription en échec est donc visible des
   * deux côtés, et une reprise déclenchée d'un côté doit avancer de l'autre.
   * D'où l'avancement joué sur chaque collection qui porte ce job.
   */
  const reprendreJob = useCallback<CtxAtelier['reprendreJob']>(
    (id) => {
      const porteuses = (
        [
          [NOM_JOBS, JOBS],
          [NOM_JOBS_PLATEFORME, JOBS_PLATEFORME],
        ] as const
      )
        .map(([nom, graine]) => ({
          nom,
          graine,
          job: lire<ProvisioningJob>(nom, graine).find((j) => j.id === id),
        }))
        .filter((x) => x.job)

      const job = porteuses[0]?.job
      const def = job && workflowById(job.type)
      if (!job || !def) return false

      const ratee = job.taches.find((t) => t.statut === 'failed')
      const depuis = ratee ? ratee.ordre - 1 : 0
      const essai = (essais.current.get(id) ?? 0) + 1
      essais.current.set(id, essai)

      for (const { nom, graine } of porteuses) {
        modifier<ProvisioningJob>(nom, graine, id, (j) => ({
          statut: 'running',
          erreur: undefined,
          dureeS: undefined,
          taches: j.taches.map((t) =>
            t.ordre === depuis + 1 ? { ...t, statut: 'running', message: undefined } : t,
          ),
        }))
        jouer(id, def, essai, depuis, nom, graine)
      }
      return true
    },
    [jouer, lire, modifier],
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
      reprendreJob,
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
      reprendreJob,
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
