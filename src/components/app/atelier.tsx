'use client'

/**
 * L'atelier — l'état mutable du back-office.
 *
 * `src/lib/mock/` est figé, et doit l'être : c'est ce qui garantit qu'un rendu
 * serveur et le premier rendu client donnent le même HTML. Mais une maquette
 * dont les boutons ne font qu'afficher un message ne se laisse pas éprouver :
 * on ne voit jamais ce que devient une liste après une création, ni ce qu'un
 * changement de statut déplace ailleurs dans l'écran.
 *
 * L'atelier prend donc une copie du jeu figé au montage, et porte pour la durée
 * de la session ce que l'opérateur crée, modifie et supprime. Rien n'est
 * persisté : recharger revient au jeu d'origine. C'est voulu — une maquette qui
 * accumule les essais de la veille devient illisible en démonstration.
 *
 * Ce que l'atelier ne fait pas : appeler un réseau, valider métier côté
 * serveur, gérer des conflits d'écriture concurrents. Ces trois-là appartiennent
 * à l'implémentation, pas à la maquette.
 */

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
import {
  ALERTES_PLATEFORME,
  AUDIT,
  BACKENDS,
  CAMPAGNES_MAJ,
  CATALOGUE,
  CONFORMITE_PLATEFORME,
  EQUIPE_SYNELIA,
  FACTURES,
  IMPAYES,
  INCIDENTS,
  JOBS_PLATEFORME,
  MEMBERSHIPS,
  OFFRES,
  ORGANISATIONS,
  PARC_INSTANCES,
  PLACEMENTS,
  RELEVES_REVSHARE,
  RESELLERS,
  SOUSCRIPTIONS,
  TICKETS_PLATEFORME,
  USERS,
  type CampagneMaj,
  type InstanceParc,
  type MembreEquipe,
} from '@/lib/mock'
import type {
  AuditEvent,
  Backend,
  CatalogService,
  EvenementSupervision,
  Incident,
  Invoice,
  Membership,
  Offer,
  Organisation,
  Placement,
  ProvisioningJob,
  Reseller,
  Role,
  Subscription,
  Ticket,
  User,
} from '@/lib/types'
import { useApp, type Toast } from './contexte'

// ─── Formes des collections déclarées en littéral dans le jeu de données ──

export type Impaye = (typeof IMPAYES)[number]
export type ReleveRevshare = (typeof RELEVES_REVSHARE)[number]
export type TestRestauration = (typeof CONFORMITE_PLATEFORME.testsRestauration)[number]
export type FenetrePatching = (typeof CONFORMITE_PLATEFORME.fenetresPatching)[number]
export type AuditConformite = (typeof CONFORMITE_PLATEFORME.audits)[number]

// ─── Registre ─────────────────────────────────────────────────────────

export interface Registre<T> {
  liste: T[]
  parId: (id: string) => T | undefined
  /** Ajoute en tête — une création doit se voir sans avoir à paginer. */
  ajouter: (item: T) => void
  ajouterEnFin: (item: T) => void
  /** Fusionne un correctif, ou le résultat d'une fonction sur l'élément courant. */
  modifier: (id: string, patch: Partial<T> | ((item: T) => Partial<T>)) => void
  supprimer: (id: string) => void
  /** Remplace la liste entière — réordonnancements, tris persistés. */
  remplacer: (liste: T[]) => void
  reinitialiser: () => void
}

/** `id` sert de clé pour presque tout le modèle. */
const parIdentifiant = (x: { id: string }) => x.id

function useRegistre<T>(origine: T[], cle: (item: T) => string): Registre<T> {
  const [liste, setListe] = useState<T[]>(origine)

  return useMemo<Registre<T>>(
    () => ({
      liste,
      parId: (id) => liste.find((x) => cle(x) === id),
      ajouter: (item) => setListe((l) => [item, ...l]),
      ajouterEnFin: (item) => setListe((l) => [...l, item]),
      modifier: (id, patch) =>
        setListe((l) =>
          l.map((x) =>
            cle(x) === id ? { ...x, ...(typeof patch === 'function' ? patch(x) : patch) } : x,
          ),
        ),
      supprimer: (id) => setListe((l) => l.filter((x) => cle(x) !== id)),
      remplacer: (nouvelle) => setListe(nouvelle),
      reinitialiser: () => setListe(origine),
    }),
    [liste, cle, origine],
  )
}

// ─── Journal ──────────────────────────────────────────────────────────

/**
 * Ce qu'un appelant a besoin de fournir pour consigner un acte. L'horodatage,
 * l'auteur et le rôle sont déduits : les oublier serait la première cause de
 * trous dans un journal d'audit.
 */
export interface ActeAJournaliser {
  action: string
  cible: string
  detail?: string
  orgId?: string
  orgNom?: string
  resultat?: AuditEvent['result']
  portee?: AuditEvent['scope']
}

const OPERATEUR = {
  id: 'syn-1',
  nom: 'Jean-Vincent Kassi',
  email: 'jv.kassi@synelia.tech',
  type: 'user' as const,
}

// ─── Contexte ─────────────────────────────────────────────────────────

export interface AtelierValeur {
  organisations: Registre<Organisation>
  revendeurs: Registre<Reseller>
  utilisateurs: Registre<User>
  adhesions: Registre<Membership>
  equipe: Registre<MembreEquipe>
  offres: Registre<Offer>
  souscriptions: Registre<Subscription>
  factures: Registre<Invoice>
  impayes: Registre<Impaye>
  revshare: Registre<ReleveRevshare>
  tickets: Registre<Ticket>
  backends: Registre<Backend>
  placements: Registre<Placement>
  incidents: Registre<Incident>
  alertes: Registre<EvenementSupervision>
  jobs: Registre<ProvisioningJob>
  catalogue: Registre<CatalogService>
  parc: Registre<InstanceParc>
  campagnes: Registre<CampagneMaj>
  testsRestauration: Registre<TestRestauration>
  fenetresPatching: Registre<FenetrePatching>
  auditsConformite: Registre<AuditConformite>
  journal: Registre<AuditEvent>
  /** Consigne un acte au journal d'audit, horodaté et attribué. */
  consigner: (acte: ActeAJournaliser) => void
  /**
   * Identifiant lisible et reproductible : pas de `Math.random()`, le rendu
   * serveur et le rendu client doivent rester identiques.
   */
  nouvelId: (prefixe: string) => string
  /** Horodatage strictement croissant, ancré sur la date figée de la maquette. */
  horodatage: () => string
  /** Nombre d'actes posés depuis le chargement — sert au bandeau de session. */
  actesPoses: number
  /** Rend au jeu de données d'origine, sans recharger la page. */
  reinitialiserTout: () => void
}

const Ctx = createContext<AtelierValeur | null>(null)

const CLE_SLUG = (s: CatalogService) => s.slug
const CLE_FACTURE = (i: Impaye) => i.facture
const CLE_PERIODE = (r: ReleveRevshare) => `${r.reseller}·${r.periode}`
const CLE_PLACEMENT = (p: Placement) => `${p.espaceId}·${p.backendId}`

export function AtelierProvider({ children }: { children: ReactNode }) {
  const organisations = useRegistre(ORGANISATIONS, parIdentifiant)
  const revendeurs = useRegistre(RESELLERS, parIdentifiant)
  const utilisateurs = useRegistre(USERS, parIdentifiant)
  const adhesions = useRegistre(MEMBERSHIPS, parIdentifiant)
  const equipe = useRegistre(EQUIPE_SYNELIA, parIdentifiant)
  const offres = useRegistre(OFFRES, parIdentifiant)
  const souscriptions = useRegistre(SOUSCRIPTIONS, parIdentifiant)
  const factures = useRegistre(FACTURES, parIdentifiant)
  const impayes = useRegistre(IMPAYES, CLE_FACTURE)
  const revshare = useRegistre(RELEVES_REVSHARE, CLE_PERIODE)
  const tickets = useRegistre(TICKETS_PLATEFORME, parIdentifiant)
  const backends = useRegistre(BACKENDS, parIdentifiant)
  const placements = useRegistre(PLACEMENTS, CLE_PLACEMENT)
  const incidents = useRegistre(INCIDENTS, parIdentifiant)
  const alertes = useRegistre(ALERTES_PLATEFORME, parIdentifiant)
  const jobs = useRegistre(JOBS_PLATEFORME, parIdentifiant)
  const catalogue = useRegistre(CATALOGUE, CLE_SLUG)
  const parc = useRegistre(PARC_INSTANCES, parIdentifiant)
  const campagnes = useRegistre(CAMPAGNES_MAJ, parIdentifiant)
  const testsRestauration = useRegistre(CONFORMITE_PLATEFORME.testsRestauration, parIdentifiant)
  const fenetresPatching = useRegistre(CONFORMITE_PLATEFORME.fenetresPatching, parIdentifiant)
  const auditsConformite = useRegistre(CONFORMITE_PLATEFORME.audits, parIdentifiant)
  const journal = useRegistre(AUDIT, parIdentifiant)

  const compteur = useRef(0)
  const [actesPoses, setActesPoses] = useState(0)

  const suivant = useCallback(() => {
    compteur.current += 1
    return compteur.current
  }, [])

  const nouvelId = useCallback((prefixe: string) => `${prefixe}-${suivant()}`, [suivant])

  const horodatage = useCallback(() => {
    // Les actes de la session se placent juste après la date figée, dans
    // l'ordre où ils ont été posés : le journal reste lisible du plus récent
    // au plus ancien sans jamais dépendre de l'horloge du navigateur.
    const base = new Date(MAINTENANT).getTime()
    return new Date(base + suivant() * 1000).toISOString()
  }, [suivant])

  const consigner = useCallback(
    (acte: ActeAJournaliser) => {
      const evenement: AuditEvent = {
        id: `aud-session-${suivant()}`,
        ts: horodatage(),
        orgId: acte.orgId,
        orgNom: acte.orgNom,
        actor: OPERATEUR,
        role: 'provider_admin' as Role,
        scope: acte.portee ?? { type: 'plateforme', label: 'Plateforme Synelia Cloud' },
        action: acte.action,
        target: acte.cible,
        result: acte.resultat ?? 'ok',
        detail: acte.detail,
        ip: '196.170.4.18',
      }
      journal.ajouter(evenement)
      setActesPoses((n) => n + 1)
    },
    [journal, horodatage, suivant],
  )

  const registres = useMemo(
    () => [
      organisations,
      revendeurs,
      utilisateurs,
      adhesions,
      equipe,
      offres,
      souscriptions,
      factures,
      impayes,
      revshare,
      tickets,
      backends,
      placements,
      incidents,
      alertes,
      jobs,
      catalogue,
      parc,
      campagnes,
      testsRestauration,
      fenetresPatching,
      auditsConformite,
      journal,
    ],
    [
      organisations,
      revendeurs,
      utilisateurs,
      adhesions,
      equipe,
      offres,
      souscriptions,
      factures,
      impayes,
      revshare,
      tickets,
      backends,
      placements,
      incidents,
      alertes,
      jobs,
      catalogue,
      parc,
      campagnes,
      testsRestauration,
      fenetresPatching,
      auditsConformite,
      journal,
    ],
  )

  const reinitialiserTout = useCallback(() => {
    registres.forEach((r) => r.reinitialiser())
    setActesPoses(0)
    compteur.current = 0
  }, [registres])

  const valeur = useMemo<AtelierValeur>(
    () => ({
      organisations,
      revendeurs,
      utilisateurs,
      adhesions,
      equipe,
      offres,
      souscriptions,
      factures,
      impayes,
      revshare,
      tickets,
      backends,
      placements,
      incidents,
      alertes,
      jobs,
      catalogue,
      parc,
      campagnes,
      testsRestauration,
      fenetresPatching,
      auditsConformite,
      journal,
      consigner,
      nouvelId,
      horodatage,
      actesPoses,
      reinitialiserTout,
    }),
    [
      organisations,
      revendeurs,
      utilisateurs,
      adhesions,
      equipe,
      offres,
      souscriptions,
      factures,
      impayes,
      revshare,
      tickets,
      backends,
      placements,
      incidents,
      alertes,
      jobs,
      catalogue,
      parc,
      campagnes,
      testsRestauration,
      fenetresPatching,
      auditsConformite,
      journal,
      consigner,
      nouvelId,
      horodatage,
      actesPoses,
      reinitialiserTout,
    ],
  )

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>
}

export function useAtelier(): AtelierValeur {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAtelier doit être utilisé dans un AtelierProvider')
  return v
}

/**
 * Un acte du back-office se compose toujours de trois choses : la mutation,
 * le retour à l'écran, la trace au journal. Les séparer, c'est se garantir
 * qu'un jour l'une des trois manquera — en pratique, la trace.
 */
export function useActe() {
  const { pousser } = useApp()
  const { consigner } = useAtelier()

  return useCallback(
    (acte: {
      /** La mutation elle-même. */
      faire?: () => void
      titre: string
      detail?: string
      ton?: Toast['ton']
      /** Verbe du journal, en `objet.verbe` — `organisation.suspend`. */
      action: string
      cible: string
      orgId?: string
      orgNom?: string
      portee?: AuditEvent['scope']
      resultat?: AuditEvent['result']
    }) => {
      acte.faire?.()
      pousser({ ton: acte.ton ?? 'ok', titre: acte.titre, detail: acte.detail })
      consigner({
        action: acte.action,
        cible: acte.cible,
        detail: acte.detail,
        orgId: acte.orgId,
        orgNom: acte.orgNom,
        portee: acte.portee,
        resultat: acte.resultat,
      })
    },
    [pousser, consigner],
  )
}
