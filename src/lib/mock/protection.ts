/**
 * Données de démonstration — sauvegarde et restauration (Partie 11).
 */

import type { AgentSauvegarde, BackupPlan, CapaciteSauvegarde, ConformiteLigne, RestorePoint } from '../types'

export const BACKUP_PLANS: BackupPlan[] = [
  {
    id: 'bp-prod-quotidien',
    orgId: 'org-dba',
    nom: 'Production · quotidien immuable',
    scope: { type: 'tag', valeur: 'production' },
    frequence: 'quotidien',
    mode: 'incrementale_complete_hebdo',
    retentionJours: 35,
    immutable: true,
    destinations: [
      { type: 'local', bucketId: 'bkt-1' },
      { type: 'autre_site', bucketId: 'bkt-2' },
      { type: 'immuable', bucketId: 'bkt-2' },
    ],
    prochaineExecution: '2026-08-20T02:00:00Z',
    chiffrement: { mode: 'synelia' },
    ressourcesProtegees: 9,
    dernierResultat: 'ok',
  },
  {
    id: 'bp-bases-continu',
    orgId: 'org-dba',
    nom: 'Bases de données · journalisation continue',
    scope: { type: 'ressource', valeur: 'metier-postgres, sessions-redis' },
    frequence: 'continu',
    mode: 'incrementale_complete_hebdo',
    retentionJours: 14,
    immutable: true,
    destinations: [
      { type: 'local', bucketId: 'bkt-1' },
      { type: 'immuable', bucketId: 'bkt-2' },
    ],
    prochaineExecution: '2026-08-19T16:00:00Z',
    chiffrement: { mode: 'byok', kmsRef: 'kms://dba/prod-2026' },
    ressourcesProtegees: 3,
    dernierResultat: 'ok',
  },
  {
    id: 'bp-services',
    orgId: 'org-dba',
    nom: 'Services managés · quotidien',
    scope: { type: 'service', valeur: 'Tous les services managés' },
    frequence: 'quotidien',
    mode: 'complete',
    retentionJours: 30,
    immutable: false,
    destinations: [{ type: 'local', bucketId: 'bkt-1' }],
    prochaineExecution: '2026-08-20T01:00:00Z',
    chiffrement: { mode: 'synelia' },
    ressourcesProtegees: 5,
    dernierResultat: 'partiel',
  },
  {
    id: 'bp-preprod',
    orgId: 'org-dba',
    nom: 'Préproduction · hebdomadaire',
    scope: { type: 'espace', valeur: 'EC-DBA-02' },
    frequence: 'hebdo',
    mode: 'complete',
    retentionJours: 21,
    immutable: false,
    destinations: [{ type: 'local', bucketId: 'bkt-1' }],
    prochaineExecution: '2026-08-24T03:00:00Z',
    chiffrement: { mode: 'synelia' },
    ressourcesProtegees: 2,
    dernierResultat: 'ok',
  },
  {
    id: 'bp-archives',
    orgId: 'org-dba',
    nom: 'Archives réglementaires · mensuel WORM',
    scope: { type: 'tag', valeur: 'archives' },
    frequence: 'hebdo',
    mode: 'complete',
    retentionJours: 3650,
    immutable: true,
    destinations: [{ type: 'immuable', bucketId: 'bkt-2' }],
    prochaineExecution: '2026-08-31T04:00:00Z',
    chiffrement: { mode: 'byok', kmsRef: 'kms://dba/archives' },
    ressourcesProtegees: 1,
    dernierResultat: 'ok',
  },
]

export const RESTORE_POINTS: RestorePoint[] = [
  { id: 'rp-1', planId: 'bp-prod-quotidien', planNom: 'Production · quotidien immuable', resourceId: 'vm-web-01', resourceNom: 'web-prod-01', resourceType: 'Machine virtuelle', date: '2026-08-19T02:14:00Z', tailleGo: 41.2, type: 'incrementale', immuableJusquau: '2026-09-23', verifie: true, destination: 'dba-sauvegardes-abj', expiration: '2026-09-23' },
  { id: 'rp-2', planId: 'bp-prod-quotidien', planNom: 'Production · quotidien immuable', resourceId: 'vm-web-02', resourceNom: 'web-prod-02', resourceType: 'Machine virtuelle', date: '2026-08-19T02:16:00Z', tailleGo: 40.8, type: 'incrementale', immuableJusquau: '2026-09-23', verifie: true, destination: 'dba-sauvegardes-abj', expiration: '2026-09-23' },
  { id: 'rp-3', planId: 'bp-bases-continu', planNom: 'Bases de données · journalisation continue', resourceId: 'db-1', resourceNom: 'metier-postgres', resourceType: 'Base managée', date: '2026-08-19T14:00:00Z', tailleGo: 118.4, type: 'incrementale', immuableJusquau: '2026-09-02', verifie: true, destination: 'dba-sauvegardes-gbm', expiration: '2026-09-02' },
  { id: 'rp-4', planId: 'bp-prod-quotidien', planNom: 'Production · quotidien immuable', resourceId: 'vm-db-01', resourceNom: 'db-prod-01', resourceType: 'Machine virtuelle', date: '2026-08-18T02:11:00Z', tailleGo: 302.6, type: 'complete', immuableJusquau: '2026-09-22', verifie: true, destination: 'dba-sauvegardes-abj', expiration: '2026-09-22' },
  { id: 'rp-5', planId: 'bp-services', planNom: 'Services managés · quotidien', resourceId: 'svc-drive', resourceNom: 'Drive Pro · Nextcloud', resourceType: 'Service managé', date: '2026-08-19T01:22:00Z', tailleGo: 684.1, type: 'incrementale', verifie: true, destination: 'dba-sauvegardes-abj', expiration: '2026-09-18' },
  { id: 'rp-6', planId: 'bp-services', planNom: 'Services managés · quotidien', resourceId: 'svc-mail', resourceNom: 'Email Pro · Grommunio', resourceType: 'Service managé', date: '2026-08-19T01:38:00Z', tailleGo: 214.7, type: 'incrementale', verifie: true, destination: 'dba-sauvegardes-abj', expiration: '2026-09-18' },
  { id: 'rp-7', planId: 'bp-services', planNom: 'Services managés · quotidien', resourceId: 'svc-ged', resourceNom: 'GED · Mayan', resourceType: 'Service managé', date: '2026-08-18T01:41:00Z', tailleGo: 0, type: 'incrementale', verifie: false, destination: '—', expiration: '2026-09-17' },
  { id: 'rp-8', planId: 'bp-prod-quotidien', planNom: 'Production · quotidien immuable', resourceId: 'vm-analytics-01', resourceNom: 'analytics-prod-01', resourceType: 'Machine virtuelle', date: '2026-08-18T02:22:00Z', tailleGo: 188.9, type: 'incrementale', immuableJusquau: '2026-09-22', verifie: true, destination: 'dba-sauvegardes-abj', expiration: '2026-09-22' },
  { id: 'rp-9', planId: 'bp-preprod', planNom: 'Préproduction · hebdomadaire', resourceId: 'vm-staging-01', resourceNom: 'staging-app-01', resourceType: 'Machine virtuelle', date: '2026-08-17T03:04:00Z', tailleGo: 22.4, type: 'complete', verifie: false, destination: 'dba-sauvegardes-abj', expiration: '2026-09-07' },
  { id: 'rp-10', planId: 'bp-prod-quotidien', planNom: 'Production · quotidien immuable', resourceId: 'vm-win-01', resourceNom: 'ad-win-01', resourceType: 'Machine virtuelle', date: '2026-08-19T02:41:00Z', tailleGo: 96.2, type: 'incrementale', immuableJusquau: '2026-09-23', verifie: true, destination: 'dba-sauvegardes-abj', expiration: '2026-09-23' },
  { id: 'rp-11', planId: 'bp-archives', planNom: 'Archives réglementaires · mensuel WORM', resourceId: 'vol-5', resourceNom: 'archives-2024', resourceType: 'Volume', date: '2026-07-31T04:00:00Z', tailleGo: 3820.0, type: 'complete', immuableJusquau: '2036-07-31', verifie: true, destination: 'dba-sauvegardes-gbm', expiration: '2036-07-31' },
  { id: 'rp-12', planId: 'bp-bases-continu', planNom: 'Bases de données · journalisation continue', resourceId: 'db-1', resourceNom: 'metier-postgres', resourceType: 'Base managée', date: '2026-08-19T08:00:00Z', tailleGo: 116.1, type: 'incrementale', immuableJusquau: '2026-09-02', verifie: true, destination: 'dba-sauvegardes-gbm', expiration: '2026-09-02' },
]

export const CONFORMITE: ConformiteLigne[] = [
  { ressourceId: 'vm-web-01', ressourceNom: 'web-prod-01', type: 'Machine virtuelle', protection: 'protegee', dernierSucces: '2026-08-19T02:14:00Z', rpoConstateMin: 13, regle321: { copies: true, supports: true, horsSite: true }, dernierTestRestauration: { date: '2026-08-02', succes: true, dureeMin: 18 } },
  { ressourceId: 'vm-web-02', ressourceNom: 'web-prod-02', type: 'Machine virtuelle', protection: 'protegee', dernierSucces: '2026-08-19T02:16:00Z', rpoConstateMin: 13, regle321: { copies: true, supports: true, horsSite: true }, dernierTestRestauration: { date: '2026-08-02', succes: true, dureeMin: 17 } },
  { ressourceId: 'vm-db-01', ressourceNom: 'db-prod-01', type: 'Machine virtuelle', protection: 'protegee', dernierSucces: '2026-08-18T02:11:00Z', rpoConstateMin: 11, regle321: { copies: true, supports: true, horsSite: true }, dernierTestRestauration: { date: '2026-08-02', succes: true, dureeMin: 42 } },
  { ressourceId: 'db-1', ressourceNom: 'metier-postgres', type: 'Base managée', protection: 'protegee', dernierSucces: '2026-08-19T14:00:00Z', rpoConstateMin: 4, regle321: { copies: true, supports: true, horsSite: true }, dernierTestRestauration: { date: '2026-08-09', succes: true, dureeMin: 26 } },
  { ressourceId: 'vm-analytics-01', ressourceNom: 'analytics-prod-01', type: 'Machine virtuelle', protection: 'protegee', dernierSucces: '2026-08-18T02:22:00Z', rpoConstateMin: 37, regle321: { copies: true, supports: true, horsSite: true }, dernierTestRestauration: { date: '2026-07-19', succes: true, dureeMin: 31 } },
  { ressourceId: 'vm-win-01', ressourceNom: 'ad-win-01', type: 'Machine virtuelle', protection: 'protegee', dernierSucces: '2026-08-19T02:41:00Z', rpoConstateMin: 13, regle321: { copies: true, supports: true, horsSite: true }, dernierTestRestauration: { date: '2026-08-02', succes: true, dureeMin: 24 } },
  { ressourceId: 'svc-drive', ressourceNom: 'Drive Pro · Nextcloud', type: 'Service managé', protection: 'protegee', dernierSucces: '2026-08-19T01:22:00Z', rpoConstateMin: 14, regle321: { copies: true, supports: true, horsSite: false }, dernierTestRestauration: { date: '2026-08-05', succes: true, dureeMin: 12 } },
  { ressourceId: 'svc-mail', ressourceNom: 'Email Pro · Grommunio', type: 'Service managé', protection: 'protegee', dernierSucces: '2026-08-19T01:38:00Z', rpoConstateMin: 14, regle321: { copies: true, supports: true, horsSite: false }, dernierTestRestauration: { date: '2026-08-05', succes: true, dureeMin: 21 } },
  { ressourceId: 'svc-ged', ressourceNom: 'GED · Mayan', type: 'Service managé', protection: 'echec', dernierSucces: '2026-08-17T01:41:00Z', rpoConstateMin: 2260, regle321: { copies: false, supports: false, horsSite: false } },
  { ressourceId: 'vm-batch-01', ressourceNom: 'batch-worker-01', type: 'Machine virtuelle', protection: 'non_protegee', regle321: { copies: false, supports: false, horsSite: false } },
  { ressourceId: 'vm-ci-01', ressourceNom: 'ci-runner-01', type: 'Machine virtuelle', protection: 'non_protegee', regle321: { copies: false, supports: false, horsSite: false } },
  { ressourceId: 'vm-staging-01', ressourceNom: 'staging-app-01', type: 'Machine virtuelle', protection: 'protegee', dernierSucces: '2026-08-17T03:04:00Z', rpoConstateMin: 3496, regle321: { copies: true, supports: false, horsSite: false } },
  { ressourceId: 'vol-5', ressourceNom: 'archives-2024', type: 'Volume', protection: 'protegee', dernierSucces: '2026-07-31T04:00:00Z', rpoConstateMin: 28_400, regle321: { copies: true, supports: true, horsSite: true }, dernierTestRestauration: { date: '2026-06-14', succes: true, dureeMin: 96 } },
  { ressourceId: 'svc-erp', ressourceNom: 'ERP · Odoo', type: 'Service managé', protection: 'protegee', dernierSucces: '2026-08-19T01:52:00Z', rpoConstateMin: 14, regle321: { copies: true, supports: true, horsSite: false }, dernierTestRestauration: { date: '2026-08-05', succes: false, dureeMin: 0 } },
]

/** Un seul palier souscrit par organisation, façon OVH Backup Storage. */
export const CAPACITE_SAUVEGARDE: CapaciteSauvegarde[] = [
  { id: 'cap-org-dba', orgId: 'org-dba', palier: '500go', quotaGo: 500, utiliseGo: 341 },
]

/** Sauvegarde complète d'un serveur, politique fixe — pas de plan à composer. */
export const AGENTS_SAUVEGARDE: AgentSauvegarde[] = [
  { id: 'ag-vm-web-01', orgId: 'org-dba', resourceId: 'vm-web-01', resourceNom: 'web-prod-01', installe: true, politique: '14j', dernierPassage: '2026-08-19T23:10:00Z' },
  { id: 'ag-vm-web-02', orgId: 'org-dba', resourceId: 'vm-web-02', resourceNom: 'web-prod-02', installe: true, politique: '14j', dernierPassage: '2026-08-19T23:14:00Z' },
  { id: 'ag-vm-db-01', orgId: 'org-dba', resourceId: 'vm-db-01', resourceNom: 'db-prod-01', installe: true, politique: '30j', dernierPassage: '2026-08-18T23:40:00Z' },
  { id: 'ag-vm-win-01', orgId: 'org-dba', resourceId: 'vm-win-01', resourceNom: 'ad-win-01', installe: true, politique: '14j', dernierPassage: '2026-08-19T23:52:00Z' },
  { id: 'ag-vm-analytics-01', orgId: 'org-dba', resourceId: 'vm-analytics-01', resourceNom: 'analytics-prod-01', installe: false, politique: '14j' },
  { id: 'ag-vm-batch-01', orgId: 'org-dba', resourceId: 'vm-batch-01', resourceNom: 'batch-worker-01', installe: false, politique: '14j' },
  { id: 'ag-vm-ci-01', orgId: 'org-dba', resourceId: 'vm-ci-01', resourceNom: 'ci-runner-01', installe: false, politique: '14j' },
]

export const planById = (id: string) => BACKUP_PLANS.find((p) => p.id === id)
