/**
 * Point d'entrée unique du jeu de données de démonstration.
 * Toutes les données sont fictives (spécification Partie 11).
 */

export * from './orgs'
export * from './iaas'
export * from './protection'
export * from './paas'
export * from './projets'
export * from './marketplace'
export * from './commerce'
export * from './web'
export * from './ops'
export * from './vitrine'

import { ESPACES, BACKENDS, VMS, K8S_CLUSTERS } from './iaas'
import { APPLICATIONS, ENVIRONNEMENTS } from './paas'
import { SERVICES_MANAGES, SIEGES } from './marketplace'
import { ORGANISATIONS } from './orgs'
import { FACTURES } from './commerce'

/** Agrégats du tableau de bord client (§4.2 bande 1). */
export const SYNTHESE_CLIENT = {
  espaces: ESPACES.length,
  vms: VMS.length,
  clusters: K8S_CLUSTERS.length,
  servicesManages: SERVICES_MANAGES.length,
  applications: APPLICATIONS.length,
  environnements: ENVIRONNEMENTS.length,
  siegesUtilises: SERVICES_MANAGES.reduce((a, s) => a + s.siegesUtilises, 0),
  siegesSouscrits: SERVICES_MANAGES.reduce((a, s) => a + s.siegesSouscrits, 0),
  quota: {
    vcpu: ESPACES.reduce((a, e) => a + e.quota.vcpu, 0),
    ramGo: ESPACES.reduce((a, e) => a + e.quota.ramGo, 0),
    stockageTo: ESPACES.reduce((a, e) => a + e.quota.stockageTo, 0),
  },
  usage: {
    vcpu: ESPACES.reduce((a, e) => a + e.usage.vcpu, 0),
    ramGo: ESPACES.reduce((a, e) => a + e.usage.ramGo, 0),
    stockageTo:
      Math.round(ESPACES.reduce((a, e) => a + e.usage.stockageTo, 0) * 10) / 10,
  },
  uptime30j: 99.94,
  slaContractuel: 99.9,
  depenseMois: 214500,
  previsionMois: 268000,
  depenseMoisPrecedent: 179360,
  facturesEnAttente: FACTURES.filter((f) => f.statut === 'impayee').length,
  ticketsOuverts: 4,
  prochainRdv: '2026-08-26T10:00:00Z',
}

/** Agrégats du tableau de bord fournisseur (§8.2). */
export const SYNTHESE_PLATEFORME = {
  vcpuTotal: BACKENDS.reduce((a, b) => a + b.capacite.vcpu, 0),
  vcpuUtilise: Math.round(
    BACKENDS.reduce((a, b) => a + (b.capacite.vcpu * b.usage.vcpuPct) / 100, 0),
  ),
  ramTotalGo: BACKENDS.reduce((a, b) => a + b.capacite.ramGo, 0),
  stockageTotalTo: BACKENDS.reduce((a, b) => a + b.capacite.stockageTo, 0),
  tenantsActifs: ORGANISATIONS.filter((o) => o.statut === 'active').length,
  espacesTotal: ORGANISATIONS.reduce((a, o) => a + (o.espaces ?? 0), 0),
  projetsTotal: 24,
  backendsEnLigne: BACKENDS.filter((b) => b.statut === 'en_ligne').length,
  backendsTotal: BACKENDS.length,
  accesRefuses24h: 2,
  jobsEnEchec: 2,
  ticketsSlaRisque: 3,
  caMensuel: ORGANISATIONS.reduce((a, o) => a + (o.caMensuel ?? 0), 0),
}

/** Dix organisations les plus consommatrices (§8.2). */
export const TOP_ORGANISATIONS = [...ORGANISATIONS]
  .filter((o) => (o.consommationVcpu ?? 0) > 0)
  .sort((a, b) => (b.consommationVcpu ?? 0) - (a.consommationVcpu ?? 0))
  .slice(0, 10)

/** Ventilation de la dépense du mois par famille (§7.4). */
export const VENTILATION_DEPENSE = [
  { famille: 'Espaces Cloud (calcul)', montant: 135000, pct: 50.4 },
  { famille: 'Services managés', montant: 62710, pct: 23.4 },
  { famille: 'Hébergement web', montant: 38000, pct: 14.2 },
  { famille: 'Stockage objet', montant: 14200, pct: 5.3 },
  { famille: 'Réseau & IP', montant: 11400, pct: 4.3 },
  { famille: 'Sauvegarde hors site', montant: 6690, pct: 2.4 },
]

/** Showback interne — par Espace Cloud puis par application (§7.4). */
export const SHOWBACK_ESPACES = [
  { label: 'EC-DBA-01', montant: 148600, pct: 55.4 },
  { label: 'EC-DBA-02', montant: 32800, pct: 12.2 },
  { label: 'EC-DBA-03', montant: 28900, pct: 10.8 },
  { label: 'Hors espace (web, S3, domaines)', montant: 57700, pct: 21.6 },
]

export const SHOWBACK_APPLICATIONS = [
  { label: 'app-metier', montant: 74200, pct: 27.7 },
  { label: 'analytics', montant: 51800, pct: 19.3 },
  { label: 'site-vitrine', montant: 12400, pct: 4.6 },
  { label: 'batch-worker', montant: 9800, pct: 3.7 },
  { label: 'ci-runners', montant: 18600, pct: 6.9 },
  { label: 'Services managés et web', montant: 101200, pct: 37.8 },
]

/** Consommation détaillée par jour — onglet Consommation (§7.4). */
export const CONSOMMATION_JOURS = Array.from({ length: 19 }, (_, i) => {
  const jour = i + 1
  const base = 6800 + ((jour * 137) % 900)
  return {
    date: `2026-08-${String(jour).padStart(2, '0')}`,
    vcpuHeures: 1272 + ((jour * 31) % 120),
    ramGoHeures: 5232 + ((jour * 77) % 480),
    stockageToJour: 8.9 + ((jour * 3) % 7) / 10,
    egressGo: 42 + ((jour * 11) % 38),
    montant: base + (jour > 18 ? 1900 : 0),
  }
})

/** Marge par backend — vue fournisseur (§8.8). */
export const MARGE_BACKENDS = [
  { backend: 'CL-GRA-01', type: 'VMware vSphere', coutInfra: 2_840_000, revenu: 4_120_000, marge: 31.1 },
  { backend: 'OS-GRA-02', type: 'OpenStack', coutInfra: 1_180_000, revenu: 2_640_000, marge: 55.3 },
  { backend: 'PVE-PAR-01', type: 'Proxmox VE', coutInfra: 720_000, revenu: 1_680_000, marge: 57.1 },
  { backend: 'HV-RBX-01', type: 'Microsoft Hyper-V', coutInfra: 1_020_000, revenu: 1_340_000, marge: 23.9 },
  { backend: 'OS-ABJ-01', type: 'OpenStack', coutInfra: 480_000, revenu: 940_000, marge: 48.9 },
  { backend: 'CS-ABJ-03', type: 'Apache CloudStack', coutInfra: 640_000, revenu: 1_120_000, marge: 42.9 },
]

/** Relevés de revshare partenaires (§8.7). */
export const RELEVES_REVSHARE = [
  { periode: 'Juillet 2026', reseller: 'OC²S', caGenere: 1_240_000, revsharePct: 22, montant: 272_800, statut: 'réglé' },
  { periode: 'Juin 2026', reseller: 'OC²S', caGenere: 1_104_000, revsharePct: 22, montant: 242_880, statut: 'réglé' },
  { periode: 'Mai 2026', reseller: 'OC²S', caGenere: 968_000, revsharePct: 22, montant: 212_960, statut: 'réglé' },
  { periode: 'Août 2026', reseller: 'OC²S', caGenere: 1_318_000, revsharePct: 22, montant: 289_960, statut: 'en cours' },
]

/** Impayés et relances (§8.8). */
export const IMPAYES = [
  { org: 'Digital Business Africa', facture: 'INV-1962', montant: 124_365, echeance: '2026-06-10', retardJours: 70, relances: 3 },
  { org: 'BICICI Lab', facture: 'INV-1877', montant: 48_200, echeance: '2026-05-10', retardJours: 101, relances: 4 },
  { org: 'AMUGA', facture: 'INV-2062', montant: 152_220, echeance: '2026-08-10', retardJours: 9, relances: 1 },
]

/** Sièges disponibles par service pour l'utilisateur courant — lanceur (§6.7). */
export function servicesAvecSiege(userId: string) {
  const ids = new Set(
    SIEGES.filter((s) => s.userId === userId && s.statut === 'actif').map(
      (s) => s.managedServiceId,
    ),
  )
  return SERVICES_MANAGES.filter((s) => ids.has(s.id))
}
