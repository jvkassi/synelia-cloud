/**
 * Données de démonstration — tenancy & identité (spécification Partie 11).
 * Tout est fictif. Ancrage ouest-africain assumé.
 */

import type { Membership, Organisation, Reseller, Role, User } from '../types'

export const ORGANISATIONS: Organisation[] = [
  {
    id: 'org-dba',
    nom: 'Digital Business Africa',
    pays: "Côte d'Ivoire",
    secteur: 'Services numériques',
    tva: 'CI-2019-4472-B',
    type: 'direct',
    statut: 'active',
    createdAt: '2024-03-11',
    espaces: 3,
    utilisateurs: 6,
    caMensuel: 214500,
    consommationVcpu: 66,
    tenantPlan: 'Business',
    domaine: 'dba.africa',
  },
  {
    id: 'org-cofina',
    nom: 'Cofina Digital',
    pays: "Côte d'Ivoire",
    secteur: 'Microfinance',
    tva: 'CI-2016-1180-A',
    type: 'direct',
    statut: 'active',
    createdAt: '2023-09-02',
    espaces: 2,
    utilisateurs: 24,
    caMensuel: 486000,
    consommationVcpu: 112,
    tenantPlan: 'Enterprise',
    domaine: 'cofina-digital.ci',
  },
  {
    id: 'org-amuga',
    nom: 'AMUGA',
    pays: "Côte d'Ivoire",
    secteur: 'Assurance mutualiste',
    tva: 'CI-2020-7731-C',
    type: 'direct',
    statut: 'active',
    createdAt: '2025-01-20',
    espaces: 1,
    utilisateurs: 11,
    caMensuel: 129000,
    consommationVcpu: 28,
    tenantPlan: 'Business',
    domaine: 'amuga.ci',
  },
  {
    id: 'org-oneci',
    nom: 'ONECI',
    pays: "Côte d'Ivoire",
    secteur: 'Institution publique',
    tva: 'CI-PUB-0031',
    type: 'direct',
    statut: 'active',
    createdAt: '2024-11-04',
    espaces: 2,
    utilisateurs: 38,
    caMensuel: 742000,
    consommationVcpu: 184,
    tenantPlan: 'Enterprise',
    domaine: 'oneci.ci',
  },
  {
    id: 'org-oc2s',
    nom: 'OC²S — Orange Cloud & Cyber Solutions',
    pays: "Côte d'Ivoire",
    secteur: 'Opérateur télécom',
    tva: 'CI-2012-0001-T',
    type: 'revendeur',
    statut: 'active',
    createdAt: '2025-06-16',
    espaces: 0,
    utilisateurs: 9,
    caMensuel: 1240000,
    consommationVcpu: 0,
    tenantPlan: 'Marque blanche',
    domaine: 'cloud.oc2s.ci',
  },
  {
    id: 'org-sotra',
    nom: 'SOTRA Mobilité',
    pays: "Côte d'Ivoire",
    secteur: 'Transport urbain',
    type: 'client_revendeur',
    resellerId: 'res-oc2s',
    statut: 'active',
    createdAt: '2025-07-28',
    espaces: 1,
    utilisateurs: 14,
    caMensuel: 318000,
    consommationVcpu: 44,
    tenantPlan: 'Business',
    domaine: 'sotra-mobilite.ci',
  },
  {
    id: 'org-ivoire-agro',
    nom: 'Ivoire Agro Négoce',
    pays: "Côte d'Ivoire",
    secteur: 'Agro-industrie',
    type: 'client_revendeur',
    resellerId: 'res-oc2s',
    statut: 'active',
    createdAt: '2026-02-09',
    espaces: 1,
    utilisateurs: 7,
    caMensuel: 96000,
    consommationVcpu: 16,
    tenantPlan: 'Flex',
    domaine: 'ivoire-agro.ci',
  },
  {
    id: 'org-bicici-lab',
    nom: 'BICICI Lab',
    pays: "Côte d'Ivoire",
    secteur: 'Banque',
    type: 'direct',
    statut: 'suspendue',
    createdAt: '2025-04-15',
    espaces: 1,
    utilisateurs: 4,
    caMensuel: 0,
    consommationVcpu: 8,
    tenantPlan: 'Flex',
    domaine: 'bicici-lab.ci',
  },
]

/** Organisation active dans la démonstration de l'espace client. */
export const ORG_COURANTE = ORGANISATIONS[0]

export const RESELLERS: Reseller[] = [
  {
    id: 'res-oc2s',
    orgId: 'org-oc2s',
    nom: 'OC²S — Orange Cloud & Cyber Solutions',
    theme: {
      logoUrl: '/logos/oc2s.svg',
      primary: '#FF7900',
      accent: '#4B2882',
      domaine: 'cloud.oc2s.ci',
    },
    grille: [
      { offerId: 'off-flex', prixAchat: 18000, prixVente: 29000 },
      { offerId: 'off-pro', prixAchat: 61000, prixVente: 98000 },
      { offerId: 'off-ent', prixAchat: 180000, prixVente: 275000 },
      { offerId: 'off-k8s-starter', prixAchat: 32000, prixVente: 52000 },
    ],
    catalogue: ['drive-pro', 'email-pro', 'visio', 'wordpress', 'erp'],
    revsharePct: 22,
    clientsFinaux: ['org-sotra', 'org-ivoire-agro'],
    caGenere: 1240000,
    marge: 412000,
    statut: 'actif',
  },
  {
    id: 'res-technipole',
    orgId: 'org-technipole',
    nom: 'Technipôle Sahel',
    theme: {
      logoUrl: '/logos/technipole.svg',
      primary: '#0F766E',
      accent: '#C0297A',
      domaine: 'portail.technipole-sahel.bf',
    },
    grille: [
      { offerId: 'off-flex', prixAchat: 19000, prixVente: 31000 },
      { offerId: 'off-pro', prixAchat: 64000, prixVente: 105000 },
    ],
    catalogue: ['drive-pro', 'email-pro', 'ged'],
    revsharePct: 18,
    clientsFinaux: [],
    caGenere: 0,
    marge: 0,
    statut: 'onboarding',
  },
]

export const USERS: User[] = [
  {
    id: 'usr-fatou',
    email: 'fatou.diallo@dba.africa',
    nom: 'Fatou Diallo',
    mfaEnabled: true,
    idpSource: 'oidc',
    lastLoginAt: '2026-08-19T14:52:00Z',
    orgId: 'org-dba',
    fonction: 'Responsable produit',
    statut: 'actif',
  },
  {
    id: 'usr-lea',
    email: 'lea.konan@dba.africa',
    nom: 'Léa Konan',
    mfaEnabled: true,
    idpSource: 'oidc',
    lastLoginAt: '2026-08-19T15:04:00Z',
    orgId: 'org-dba',
    fonction: "Architecte d'infrastructure",
    statut: 'actif',
  },
  {
    id: 'usr-yao',
    email: 'yao.kouassi@dba.africa',
    nom: 'Yao Kouassi',
    mfaEnabled: false,
    idpSource: 'oidc',
    lastLoginAt: '2026-08-19T09:31:00Z',
    orgId: 'org-dba',
    fonction: "Ingénieur d'exploitation",
    statut: 'actif',
  },
  {
    id: 'usr-aicha',
    email: 'aicha.kone@dba.africa',
    nom: 'Aïcha Koné',
    mfaEnabled: true,
    idpSource: 'local',
    lastLoginAt: '2026-08-18T16:12:00Z',
    orgId: 'org-dba',
    fonction: 'Responsable administrative et financière',
    statut: 'actif',
  },
  {
    id: 'usr-adama',
    email: 'adama.sangare@dba.africa',
    nom: 'Adama Sangaré',
    mfaEnabled: false,
    idpSource: 'oidc',
    lastLoginAt: '2026-08-15T11:47:00Z',
    orgId: 'org-dba',
    fonction: 'Développeur',
    statut: 'actif',
  },
  {
    id: 'usr-audit',
    email: 'audit@partenaire.com',
    nom: 'Cabinet Kouadio & Associés',
    mfaEnabled: true,
    idpSource: 'local',
    lastLoginAt: '2026-08-19T08:04:00Z',
    orgId: 'org-dba',
    fonction: 'Auditeur externe',
    statut: 'actif',
  },
  {
    id: 'usr-ibrahim',
    email: 'ibrahim.bamba@cofina-digital.ci',
    nom: 'Ibrahim Bamba',
    mfaEnabled: true,
    idpSource: 'saml',
    lastLoginAt: '2026-08-19T13:22:00Z',
    orgId: 'org-cofina',
    fonction: 'DSI',
    statut: 'actif',
  },
  {
    id: 'usr-moussa',
    email: 'moussa.toure@oneci.ci',
    nom: 'Moussa Touré',
    mfaEnabled: true,
    idpSource: 'saml',
    lastLoginAt: '2026-08-19T10:08:00Z',
    orgId: 'org-oneci',
    fonction: 'Directeur des systèmes',
    statut: 'actif',
  },
  {
    id: 'usr-nadia',
    email: 'nadia.traore@dba.africa',
    nom: 'Nadia Traoré',
    mfaEnabled: false,
    idpSource: 'oidc',
    orgId: 'org-dba',
    fonction: 'Chargée de communication',
    statut: 'invite',
  },
]

export const MEMBERSHIPS: Membership[] = [
  {
    id: 'mb-1',
    userId: 'usr-fatou',
    orgId: 'org-dba',
    role: 'project_owner',
    scopeType: 'application',
    scopeId: 'app-metier',
    scopeLabel: 'app-metier',
  },
  {
    id: 'mb-2',
    userId: 'usr-lea',
    orgId: 'org-dba',
    role: 'espace_admin',
    scopeType: 'espace',
    scopeId: 'ec-dba-01',
    scopeLabel: 'EC-DBA-01',
  },
  {
    id: 'mb-3',
    userId: 'usr-yao',
    orgId: 'org-dba',
    role: 'operator',
    scopeType: 'org',
    scopeLabel: 'Digital Business Africa',
  },
  {
    id: 'mb-4',
    userId: 'usr-aicha',
    orgId: 'org-dba',
    role: 'billing_manager',
    scopeType: 'org',
    scopeLabel: 'Digital Business Africa',
  },
  {
    id: 'mb-5',
    userId: 'usr-adama',
    orgId: 'org-dba',
    role: 'project_owner',
    scopeType: 'application',
    scopeId: 'app-site',
    scopeLabel: 'site-vitrine',
  },
  {
    id: 'mb-6',
    userId: 'usr-audit',
    orgId: 'org-dba',
    role: 'read_only',
    scopeType: 'org',
    scopeLabel: 'Digital Business Africa',
  },
  {
    id: 'mb-7',
    userId: 'usr-nadia',
    orgId: 'org-dba',
    role: 'service_admin',
    scopeType: 'service',
    scopeId: 'svc-drive',
    scopeLabel: 'Drive Pro',
  },
  {
    id: 'mb-8',
    userId: 'usr-ibrahim',
    orgId: 'org-cofina',
    role: 'org_admin',
    scopeType: 'org',
    scopeLabel: 'Cofina Digital',
  },
  {
    id: 'mb-9',
    userId: 'usr-moussa',
    orgId: 'org-oneci',
    role: 'org_admin',
    scopeType: 'org',
    scopeLabel: 'ONECI',
  },
]

/** Utilisateur connecté dans la démonstration de l'espace client. */
export const UTILISATEUR_COURANT = USERS[1]
export const ROLE_COURANT_DEFAUT: Role = 'org_admin'

/** Organisations auxquelles appartient l'utilisateur courant (§3.2 `/select-organisation`). */
export const MES_ORGANISATIONS = [
  { org: ORGANISATIONS[0], role: 'org_admin' as Role },
  { org: ORGANISATIONS[1], role: 'read_only' as Role },
  { org: ORGANISATIONS[5], role: 'espace_admin' as Role },
]

/** Équipe Synelia — espace fournisseur (§8.8 `/admin/equipe`). */
export interface MembreEquipe {
  id: string
  nom: string
  email: string
  role: Role
  equipe: string
  dernierAcces: string
  privilegie: boolean
  elevation?: { active: boolean; jusqua?: string; justification?: string }
  /** Dernière revue trimestrielle du privilège — vide tant qu'elle n'a pas eu lieu. */
  revuLe?: string
}

export const EQUIPE_SYNELIA: MembreEquipe[] = [
  {
    id: 'syn-1',
    nom: 'Jean-Vincent Kassi',
    email: 'jv.kassi@synelia.tech',
    role: 'provider_admin',
    equipe: 'Direction Innovation & Expertise',
    dernierAcces: '2026-08-19T15:12:00Z',
    privilegie: true,
    elevation: {
      active: true,
      jusqua: '2026-08-19T17:00:00Z',
      justification: 'Rééquilibrage capacité OS-ABJ-01 — ticket #TCK-4471',
    },
  },
  {
    id: 'syn-2',
    nom: 'Stéphane Ouattara',
    email: 's.ouattara@synelia.tech',
    role: 'provider_admin',
    equipe: 'Sponsor stratégique',
    dernierAcces: '2026-08-18T09:40:00Z',
    privilegie: true,
  },
  {
    id: 'syn-3',
    nom: 'Marina Gbagbo',
    email: 'm.gbagbo@synelia.tech',
    role: 'provider_operator',
    equipe: 'NOC Abidjan',
    dernierAcces: '2026-08-19T15:18:00Z',
    privilegie: false,
  },
  {
    id: 'syn-4',
    nom: 'Cheick Coulibaly',
    email: 'c.coulibaly@synelia.tech',
    role: 'provider_operator',
    equipe: 'NOC Abidjan · astreinte',
    dernierAcces: '2026-08-19T06:02:00Z',
    privilegie: false,
  },
  {
    id: 'syn-5',
    nom: 'Awa Bakayoko',
    email: 'a.bakayoko@synelia.tech',
    role: 'billing_manager',
    equipe: 'Finance',
    dernierAcces: '2026-08-19T11:30:00Z',
    privilegie: false,
  },
  {
    id: 'syn-6',
    nom: 'Roland N’Guessan',
    email: 'r.nguessan@synelia.tech',
    role: 'compliance',
    equipe: 'Conformité & sécurité',
    dernierAcces: '2026-08-19T13:55:00Z',
    privilegie: false,
  },
  {
    id: 'syn-7',
    nom: 'Salif Dembélé',
    email: 's.dembele@synelia.tech',
    role: 'provider_operator',
    equipe: 'Support niveau 2',
    dernierAcces: '2026-08-19T14:47:00Z',
    privilegie: false,
  },
]

export function orgById(id: string): Organisation | undefined {
  return ORGANISATIONS.find((o) => o.id === id)
}

export function userById(id: string): User | undefined {
  return USERS.find((u) => u.id === id)
}

export function membresDeLOrg(orgId: string) {
  return MEMBERSHIPS.filter((m) => m.orgId === orgId).map((m) => ({
    membership: m,
    user: userById(m.userId)!,
  }))
}

export function resellerById(id: string): Reseller | undefined {
  return RESELLERS.find((r) => r.id === id)
}

/** Élévations de privilège sur une organisation — espace fournisseur (§11.4). */
export interface Elevation {
  id: string
  qui: string
  quand: string
  duree: string
  motif: string
  actif: boolean
}

export const ELEVATIONS: Elevation[] = [
  {
    id: 'elv-1',
    qui: 'Jean-Vincent Kassi',
    quand: '2026-08-19T13:00:00Z',
    duree: '4 h',
    motif: 'Ticket SYN-8814 — diagnostic de latence sur app-metier',
    actif: true,
  },
  {
    id: 'elv-2',
    qui: 'Aïcha Bamba',
    quand: '2026-08-12T09:20:00Z',
    duree: '2 h',
    motif: 'Ticket SYN-8702 — restauration accompagnée',
    actif: false,
  },
]
