/**
 * Données de démonstration — hébergement web, domaines, DNS, relais SMTP.
 */

import type { Domaine, DnsZone, WebHosting } from '../types'

export const HEBERGEMENTS: WebHosting[] = [
  {
    id: 'web-1',
    orgId: 'org-dba',
    type: 'prestashop',
    domaine: 'boutique.dba.africa',
    palier: 'Business',
    runtime: { php: '8.2' },
    staging: true,
    espaceUtiliseGo: 28.4,
    espaceTotalGo: 50,
    versions: { coeur: '8.1.7', majAuto: false },
    securite: { waf: true, scanMalware: true, bruteForce: true },
    statut: 'en_ligne',
    certificat: { expire: '2026-11-02', auto: true },
    bases: 2,
  },
  {
    id: 'web-2',
    orgId: 'org-dba',
    type: 'wordpress',
    domaine: 'blog.dba.africa',
    palier: 'Business',
    runtime: { php: '8.3' },
    staging: false,
    espaceUtiliseGo: 12.1,
    espaceTotalGo: 100,
    versions: { coeur: '6.6.2', majAuto: true, extensionsAMettreAJour: 3 },
    securite: { waf: true, scanMalware: true, bruteForce: true },
    statut: 'en_ligne',
    certificat: { expire: '2026-10-19', auto: true },
    bases: 1,
  },
  {
    id: 'web-3',
    orgId: 'org-dba',
    type: 'mutualise',
    domaine: 'carrieres.dba.africa',
    palier: 'Essentiel',
    runtime: { php: '8.1', node: '20' },
    staging: false,
    espaceUtiliseGo: 1.8,
    espaceTotalGo: 10,
    securite: { waf: false, scanMalware: false },
    statut: 'en_ligne',
    certificat: { expire: '2026-09-30', auto: true },
    bases: 1,
  },
]

export const DOMAINES: Domaine[] = [
  { id: 'dom-1', orgId: 'org-dba', nom: 'dba.africa', extension: '.africa', expiration: '2027-03-11', renouvellementAuto: true, whoisProtege: true, verrouTransfert: true, zoneId: 'zone-1' },
  { id: 'dom-2', orgId: 'org-dba', nom: 'digitalbusinessafrica.ci', extension: '.ci', expiration: '2026-12-04', renouvellementAuto: true, whoisProtege: true, verrouTransfert: true, zoneId: 'zone-2' },
  { id: 'dom-3', orgId: 'org-dba', nom: 'dba-boutique.ci', extension: '.ci', expiration: '2026-10-22', renouvellementAuto: false, whoisProtege: false, verrouTransfert: false, zoneId: 'zone-3' },
  { id: 'dom-4', orgId: 'org-dba', nom: 'dba.tech', extension: '.tech', expiration: '2028-01-18', renouvellementAuto: true, whoisProtege: true, verrouTransfert: true },
]

export const ZONES_DNS: DnsZone[] = [
  {
    id: 'zone-1',
    orgId: 'org-dba',
    domaine: 'dba.africa',
    dnssec: true,
    ns: ['ns1.synelia.cloud', 'ns2.synelia.cloud', 'ns3.synelia.cloud'],
    enregistrements: [
      { id: 'rr-1', type: 'A', nom: '@', valeur: '102.176.20.13', ttl: 3600 },
      { id: 'rr-2', type: 'A', nom: 'www', valeur: '102.176.20.13', ttl: 3600 },
      { id: 'rr-3', type: 'A', nom: 'api', valeur: '102.176.20.12', ttl: 300 },
      { id: 'rr-4', type: 'CNAME', nom: 'drive', valeur: 'drive-dba.synelia.cloud.', ttl: 3600 },
      { id: 'rr-5', type: 'CNAME', nom: 'mail', valeur: 'mail-dba.synelia.cloud.', ttl: 3600 },
      { id: 'rr-6', type: 'CNAME', nom: 'visio', valeur: 'visio-mut-abj.synelia.cloud.', ttl: 3600 },
      { id: 'rr-7', type: 'CNAME', nom: 'erp', valeur: 'erp-dba.synelia.cloud.', ttl: 3600 },
      { id: 'rr-8', type: 'MX', nom: '@', valeur: 'mx1.synelia.cloud.', ttl: 3600, priorite: 10 },
      { id: 'rr-9', type: 'MX', nom: '@', valeur: 'mx2.synelia.cloud.', ttl: 3600, priorite: 20 },
      { id: 'rr-10', type: 'TXT', nom: '@', valeur: 'v=spf1 include:spf.synelia.cloud -all', ttl: 3600 },
      { id: 'rr-11', type: 'TXT', nom: '_dmarc', valeur: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@dba.africa', ttl: 3600 },
      { id: 'rr-12', type: 'TXT', nom: 'synelia._domainkey', valeur: 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQ…', ttl: 3600 },
      { id: 'rr-13', type: 'CAA', nom: '@', valeur: '0 issue "letsencrypt.org"', ttl: 3600 },
      { id: 'rr-14', type: 'A', nom: 'blog', valeur: '102.176.28.44', ttl: 3600 },
      { id: 'rr-15', type: 'A', nom: 'boutique', valeur: '102.176.28.45', ttl: 3600 },
      { id: 'rr-16', type: 'A', nom: 'analytics', valeur: '102.176.20.13', ttl: 3600 },
      { id: 'rr-17', type: 'A', nom: 'staging', valeur: '102.176.34.7', ttl: 300 },
    ],
  },
  {
    id: 'zone-2',
    orgId: 'org-dba',
    domaine: 'digitalbusinessafrica.ci',
    dnssec: false,
    ns: ['ns1.synelia.cloud', 'ns2.synelia.cloud'],
    enregistrements: [
      { id: 'rr-1', type: 'CNAME', nom: '@', valeur: 'dba.africa.', ttl: 3600 },
      { id: 'rr-2', type: 'MX', nom: '@', valeur: 'mx1.synelia.cloud.', ttl: 3600, priorite: 10 },
      { id: 'rr-3', type: 'TXT', nom: '@', valeur: 'v=spf1 include:spf.synelia.cloud -all', ttl: 3600 },
    ],
  },
  {
    id: 'zone-3',
    orgId: 'org-dba',
    domaine: 'dba-boutique.ci',
    dnssec: false,
    ns: ['ns1.synelia.cloud', 'ns2.synelia.cloud'],
    enregistrements: [
      { id: 'rr-1', type: 'A', nom: '@', valeur: '102.176.28.45', ttl: 3600 },
      { id: 'rr-2', type: 'A', nom: 'www', valeur: '102.176.28.45', ttl: 3600 },
    ],
  },
]

/** Modèles rapides de l'éditeur de zone (§6.9). */
export const MODELES_DNS = [
  {
    id: 'mod-espace',
    nom: 'Pointer vers un Espace Cloud',
    description: 'Crée les enregistrements A pour @ et www vers une IP publique de l’espace.',
    enregistrements: ['A @ → <IP publique>', 'A www → <IP publique>'],
  },
  {
    id: 'mod-mail',
    nom: 'Configurer la messagerie',
    description: 'MX, SPF, DKIM et DMARC pour Email Pro.',
    enregistrements: [
      'MX @ → mx1.synelia.cloud (10)',
      'MX @ → mx2.synelia.cloud (20)',
      'TXT @ → v=spf1 include:spf.synelia.cloud -all',
      'TXT synelia._domainkey → v=DKIM1; …',
      'TXT _dmarc → v=DMARC1; p=quarantine; …',
    ],
  },
  {
    id: 'mod-service',
    nom: 'Valider un domaine de service',
    description: 'CNAME de vérification pour rattacher un domaine client à un service managé.',
    enregistrements: ['CNAME <sous-domaine> → <cible>.synelia.cloud'],
  },
  {
    id: 'mod-caa',
    nom: 'Restreindre l’émission de certificats',
    description: 'CAA limitant l’émission à Let’s Encrypt.',
    enregistrements: ['CAA @ → 0 issue "letsencrypt.org"'],
  },
]

/** Relais SMTP (§6.8). */
export const SMTP = {
  cles: [
    { id: 'sk-1', nom: 'app-metier · transactionnel', creee: '2025-04-12', derniereUtilisation: '2026-08-19T15:19:00Z', quotaJour: 20000, envoyesJour: 4182 },
    { id: 'sk-2', nom: 'blog.dba.africa · notifications', creee: '2025-06-11', derniereUtilisation: '2026-08-19T09:04:00Z', quotaJour: 2000, envoyesJour: 118 },
    { id: 'sk-3', nom: 'boutique · commandes', creee: '2025-10-04', derniereUtilisation: '2026-08-19T14:41:00Z', quotaJour: 10000, envoyesJour: 942 },
  ],
  quotas: { parJour: 32000, parHeure: 4000, parMinute: 120, envoyesJour: 5242 },
  authentification: { spf: 'valide', dkim: 'valide', dmarc: 'p=quarantine' },
  reputation: { score: 94, ip: '102.176.20.60', dediee: true, listesNoires: 0 },
  livraison: [
    { statut: 'delivre', nombre: 4964, pct: 94.7 },
    { statut: 'differe', nombre: 172, pct: 3.3 },
    { statut: 'rejete', nombre: 88, pct: 1.7 },
    { statut: 'plainte', nombre: 18, pct: 0.3 },
  ],
  journal: [
    { ts: '2026-08-19T15:19:41Z', destinataire: 'client-4821@gmail.com', sujet: 'Votre facture INV-2091', statut: 'delivre' as const, detail: '250 2.0.0 OK' },
    { ts: '2026-08-19T15:18:02Z', destinataire: 'contact@partenaire-abj.ci', sujet: 'Confirmation de commande #8814', statut: 'delivre' as const, detail: '250 2.0.0 OK' },
    { ts: '2026-08-19T15:16:44Z', destinataire: 'ancienne-adresse@yahoo.fr', sujet: 'Newsletter août', statut: 'rejete' as const, detail: '550 5.1.1 User unknown' },
    { ts: '2026-08-19T15:14:11Z', destinataire: 'dsi@grand-compte.ci', sujet: 'Rapport hebdomadaire', statut: 'differe' as const, detail: '451 4.7.1 Greylisted, retry in 300s' },
    { ts: '2026-08-19T15:11:38Z', destinataire: 'abonne@orange.ci', sujet: 'Nouveau document partagé', statut: 'delivre' as const, detail: '250 2.0.0 OK' },
    { ts: '2026-08-19T15:08:02Z', destinataire: 'plaignant@hotmail.com', sujet: 'Newsletter août', statut: 'plainte' as const, detail: 'FBL Microsoft — désabonnement automatique' },
  ],
  webhooks: [
    { id: 'wh-1', url: 'https://api.dba.africa/hooks/smtp', evenements: ['delivre', 'rejete', 'plainte'], actif: true },
    { id: 'wh-2', url: 'https://boutique.dba.africa/hooks/mail', evenements: ['rejete'], actif: false },
  ],
}

export const hebergementById = (id: string) => HEBERGEMENTS.find((h) => h.id === id)
export const zoneById = (id: string) =>
  ZONES_DNS.find((z) => z.id === id || z.domaine === id)
export const domaineById = (id: string) => DOMAINES.find((d) => d.id === id)
