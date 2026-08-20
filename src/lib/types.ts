/**
 * Modèle de données — Synelia Cloud (spécification Partie 9).
 * Toutes les données de l'application sont fictives (Partie 11).
 */

export type Site = 'ABJ' | 'GBM'

export const SITE_LABEL: Record<Site, string> = {
  ABJ: 'Abidjan · Synertech Vallon',
  GBM: 'Grand-Bassam · VITIB',
}

export const SITE_COURT: Record<Site, string> = {
  ABJ: 'Abidjan',
  GBM: 'Grand-Bassam',
}

// ─── Tenancy & identité ───────────────────────────────────────────────

export type OrgType = 'direct' | 'revendeur' | 'client_revendeur'

export interface Organisation {
  id: string
  nom: string
  pays: string
  secteur?: string
  tva?: string
  type: OrgType
  resellerId?: string
  statut: 'active' | 'suspendue' | 'fermee'
  logoUrl?: string
  createdAt: string
  /** Champs de démonstration côté fournisseur. */
  espaces?: number
  utilisateurs?: number
  caMensuel?: number
  consommationVcpu?: number
  tenantPlan?: string
  domaine?: string
}

export interface Reseller {
  id: string
  orgId: string
  nom: string
  theme: { logoUrl: string; primary: string; accent: string; domaine: string }
  grille: Array<{ offerId: string; prixAchat: number; prixVente: number }>
  catalogue: string[]
  revsharePct: number
  clientsFinaux: string[]
  caGenere: number
  marge: number
  statut: 'actif' | 'suspendu' | 'onboarding'
}

export interface User {
  id: string
  email: string
  nom: string
  mfaEnabled: boolean
  idpSource: 'local' | 'oidc' | 'saml' | 'ldap'
  lastLoginAt?: string
  orgId?: string
  fonction?: string
  statut?: 'actif' | 'invite' | 'suspendu'
}

export type Role =
  | 'provider_admin'
  | 'provider_operator'
  | 'reseller_admin'
  | 'org_admin'
  | 'espace_admin'
  | 'project_owner'
  | 'operator'
  | 'service_admin'
  | 'billing_manager'
  | 'compliance'
  | 'read_only'

export const ROLE_LABEL: Record<Role, string> = {
  provider_admin: 'Provider Admin',
  provider_operator: 'Provider Operator',
  reseller_admin: 'Reseller Admin',
  org_admin: 'Org Admin',
  espace_admin: 'Espace Cloud Admin',
  project_owner: 'Project Owner',
  operator: 'Operator',
  service_admin: 'Service Admin',
  billing_manager: 'Billing Manager',
  compliance: 'Compliance',
  read_only: 'Read-Only',
}

export type ScopeType = 'org' | 'espace' | 'application' | 'service'

export interface Membership {
  id: string
  userId: string
  orgId: string
  role: Role
  scopeType: ScopeType
  scopeId?: string
  scopeLabel?: string
}

// ─── IaaS ─────────────────────────────────────────────────────────────

export interface Quota {
  vcpu: number
  ramGo: number
  stockageTo: number
}

export interface EspaceCloud {
  id: string
  orgId: string
  code: string
  offerId: string
  offreNom: string
  site: Site
  cidr: string
  quota: Quota
  usage: Quota
  projets: number
  statut: 'active' | 'suspendue' | 'provisioning'
  createdAt: string
  dnsInterne?: string
}

export type BackendType = 'openstack' | 'proxmox' | 'cloudstack' | 'vsphere' | 'hyperv'

export const BACKEND_LABEL: Record<BackendType, string> = {
  openstack: 'OpenStack',
  proxmox: 'Proxmox VE',
  cloudstack: 'Apache CloudStack',
  vsphere: 'VMware vSphere',
  hyperv: 'Microsoft Hyper-V',
}

export interface Backend {
  id: string
  code: string
  type: BackendType
  site: Site
  hosts: number
  statut: 'en_ligne' | 'maintenance' | 'degrade'
  usage: { vcpuPct: number; ramPct: number; stockagePct: number }
  capacite: Quota
  /** Arbitrage §12.1 — trajectoire assumée : backend propriétaire en sortie. */
  enSortie?: { actif: boolean; cibleMigration: string }
  souverain: boolean
  saturation?: { j30: number; j60: number; j90: number }
}

export interface Placement {
  espaceId: string
  backendId: string
  percent: number
}

export interface VM {
  id: string
  espaceId: string
  nom: string
  os: string
  vcpu: number
  ramGo: number
  diskGo: number
  ips: Array<{ adresse: string; type: 'privee' | 'publique'; ptr?: string }>
  statut: 'running' | 'stopped' | 'creating' | 'error' | 'migrating'
  applicationId?: string
  applicationNom?: string
  hardware: {
    scsiControllers: number
    nics: number
    usb: boolean
    secureBoot: boolean
    videoMo?: number
    vtpm?: boolean
  }
  backupPlanId?: string
  derniereSauvegarde?: string
  site: Site
  tags?: string[]
  flavor?: string
}

export interface K8sCluster {
  id: string
  espaceId: string
  nom: string
  version: string
  controlPlane: { mode: 'single' | 'ha'; nodes: number }
  pools: Array<{
    nom: string
    nodes: number
    flavor: string
    diskGo?: number
    autoscale?: { min: number; max: number }
    type: 'standard' | 'gpu' | 'memory' | 'preemptible'
    labels?: string[]
    taints?: string[]
  }>
  modules: string[]
  statut: 'running' | 'degraded' | 'provisioning' | 'updating'
  site: Site
  applicationId?: string
}

export interface Network {
  id: string
  espaceId: string
  nom: string
  cidr: string
  dnsInterne: boolean
  workloads: number
  vlan?: number
}

export interface PublicIP {
  id: string
  espaceId: string
  adresse: string
  ptr?: string
  attachedTo?: string
  attachedLabel?: string
  antiDdos?: boolean
}

export interface SecurityGroup {
  id: string
  espaceId: string
  nom: string
  description?: string
  defaultPolicy: { ingress: 'deny' | 'allow'; egress: 'deny' | 'allow' }
  rules: Array<{
    id: string
    direction: 'in' | 'out'
    protocole: 'tcp' | 'udp' | 'icmp' | 'any'
    ports?: string
    cible: string
    description?: string
  }>
  attaches: number
}

export interface VpnTunnel {
  id: string
  espaceId: string
  nom: string
  type: 'ipsec' | 'ssl'
  passerelleDistante?: string
  reseauxAnnonces?: string[]
  statut: 'up' | 'down' | 'negociation'
  derniereNegociation?: string
  profils?: Array<{ nom: string; utilisateur: string; cree: string; revoque?: boolean }>
}

export interface LoadBalancer {
  id: string
  espaceId: string
  nom: string
  layer: 'l4' | 'l7'
  exposure: 'public' | 'interne'
  vip: string
  algo: 'round_robin' | 'least_conn' | 'source_hash' | 'weighted'
  sticky?: 'cookie' | 'ip'
  listeners: Array<{ protocole: string; port: number; certId?: string; tlsMin?: string }>
  pool: Array<{
    targetId: string
    targetLabel: string
    poids: number
    sante: 'ok' | 'ko' | 'drain'
  }>
  healthCheck: {
    protocole: string
    chemin?: string
    codeAttendu?: number
    intervalleS: number
    seuilKo: number
    seuilOk: number
  }
  waf?: { actif: boolean; ruleset: string }
  rateLimit?: { requetesParMin: number }
  metriques: {
    rps: number
    p50: number
    p95: number
    p99: number
    taux4xx: number
    taux5xx: number
    connexions: number
  }
  reglesL7?: Array<{ hote?: string; chemin?: string; entete?: string; cible: string }>
}

export interface Volume {
  id: string
  espaceId: string
  nom: string
  tailleGo: number
  classe: 'nvme' | 'ssd' | 'hdd' | 'archive'
  chiffre: boolean
  attachedTo?: string
  attachedLabel?: string
  ephemere: boolean
  iops: number
  montage?: string
}

export interface Bucket {
  id: string
  orgId: string
  nom: string
  region: Site
  classe: 'chaud' | 'froid'
  tailleGo: number
  objets: number
  versioning: boolean
  objectLock?: { actif: boolean; retentionJours: number }
  replication?: { cible: Site }
  accessLogs: boolean
  policy: 'prive' | 'lecture_publique' | 'json'
}

export interface ManagedDatabase {
  id: string
  espaceId: string
  nom: string
  moteur: 'postgresql' | 'mysql' | 'mariadb' | 'mongodb' | 'redis'
  version: string
  palier: string
  ha: boolean
  tailleGo: number
  connexions: { actives: number; max: number }
  replicas: number
  statut: 'running' | 'degraded' | 'maintenance'
  pitr: boolean
  host: string
}

// ─── Protection ───────────────────────────────────────────────────────

export interface BackupPlan {
  id: string
  orgId: string
  nom: string
  scope: { type: 'tag' | 'espace' | 'ressource' | 'service'; valeur: string }
  frequence: 'horaire' | 'quotidien' | 'hebdo' | 'continu'
  mode: 'incrementale_complete_hebdo' | 'complete'
  retentionJours: number
  immutable: boolean
  destinations: Array<{ type: 'local' | 'autre_site' | 'immuable'; bucketId?: string }>
  prochaineExecution: string
  chiffrement: { mode: 'synelia' | 'byok'; kmsRef?: string }
  ressourcesProtegees: number
  dernierResultat: 'ok' | 'echec' | 'partiel'
}

export interface RestorePoint {
  id: string
  planId: string
  planNom: string
  resourceId: string
  resourceNom: string
  resourceType: string
  date: string
  tailleGo: number
  type: 'complete' | 'incrementale' | 'snapshot'
  immuableJusquau?: string
  verifie: boolean
  destination: string
  expiration: string
}

export interface ConformiteLigne {
  ressourceId: string
  ressourceNom: string
  type: string
  protection: 'protegee' | 'non_protegee' | 'echec'
  dernierSucces?: string
  rpoConstateMin?: number
  regle321: { copies: boolean; supports: boolean; horsSite: boolean }
  dernierTestRestauration?: { date: string; succes: boolean; dureeMin: number }
}

export interface DRPlan {
  id: string
  orgId: string
  nom: string
  siteSource: Site
  siteRepli: Site
  rpoCibleMin: number
  rpoConstateMin: number
  rtoCibleMin: number
  rtoConstateMin: number
  groupes: Array<{
    ordre: number
    nom: string
    ressources: string[]
    dependances: string[]
    ipRepli?: Record<string, string>
  }>
  replication: { mode: 'continu' | 'planifie'; retardS: number }
  exercices: Array<{
    date: string
    type: 'test' | 'reel'
    dureeMin: number
    rtoConstateMin: number
    succes: boolean
    rapportUrl: string
    incidents?: string[]
  }>
  statut: 'operationnel' | 'degrade' | 'jamais_teste'
}

// ─── PaaS ─────────────────────────────────────────────────────────────

export interface Application {
  id: string
  espaceId: string
  nom: string
  source: 'git' | 'image' | 'canvas'
  repo?: { provider: 'github' | 'gitlab'; url: string; branche: string }
  builder?: 'nixpacks' | 'dockerfile' | 'image'
  cible: 'vm' | 'k8s'
  domainePrincipal: string
  sante: 'sain' | 'degrade' | 'arrete' | 'echec'
  stack: string[]
  dernierDeploiement: string
  environnements: number
  description?: string
}

export interface Environment {
  id: string
  appId: string
  nom: string
  domaines: string[]
  couleur: string
  statut: 'running' | 'degraded' | 'stopped' | 'building' | 'failed'
  autoDeploy?: { branche: string; previewParPR: boolean }
  protection?: { approbationRequise: boolean; gelJusquau?: string; motDePasse?: boolean }
  sante: { cpu: number; ram: number; latenceMs: number; erreursPct: number }
  strategie?: 'rolling' | 'canari' | 'blue_green'
  canari?: { pct: number; seuil5xx: number; fenetreS: number }
}

export interface Component {
  id: string
  envId: string
  nom: string
  kind: 'vm' | 'k8s'
  role: 'web' | 'api' | 'db' | 'cache' | 'proxy' | 'worker' | 'cron' | 'observabilite'
  image: string
  version: string
  ressources: { cpu: number; ramMo: number; diskGo: number }
  ports: Array<{ interne: number; expose?: number; type: 'ClusterIP' | 'LoadBalancer' }>
  envVars: Array<{ cle: string; secret: boolean; scope: 'build' | 'runtime'; valeur?: string }>
  storage?: Array<{ chemin: string; tailleGo: number; classe: string }>
  emplacement: { vms?: string[]; namespace?: string; pods?: string[] }
  statut: 'deployed' | 'degraded' | 'stopped' | 'failed'
  dependances?: string[]
}

export interface Deployment {
  id: string
  envId: string
  envNom: string
  appId: string
  version: string
  commit?: string
  commitMessage?: string
  auteur: string
  statut:
    | 'queued'
    | 'building'
    | 'scanning'
    | 'provisioning'
    | 'deploying'
    | 'live'
    | 'failed'
    | 'rolled_back'
  etapes: Array<{
    nom: 'build' | 'scan' | 'provision' | 'deploy'
    statut: 'pending' | 'running' | 'ok' | 'failed'
    dureeS?: number
    logRef: string
    detail?: string
  }>
  findings: Array<{
    severite: 'eleve' | 'moyen' | 'faible'
    titre: string
    detail: string
    correctif?: { libelle: string; action: string }
  }>
  previewUrl?: string
  startedAt: string
  dureeS?: number
  branche?: string
  pr?: number
}

// ─── Projets applicatifs ──────────────────────────────────────────────

/**
 * Un projet regroupe les services qui forment un même système : l'application,
 * sa base, son cache, ses tâches de fond. Le regroupement est la seule façon de
 * répondre à « qu'est-ce qui casse si j'arrête ça ? » sans lire une liste plate.
 */
export interface Projet {
  id: string
  nom: string
  description: string
  espaceId: string
  cree: string
  /** Un même projet se décline par environnement, chacun avec ses services. */
  environnements: string[]
  /** Variables partagées par tous les services du projet, par environnement. */
  variables: Array<{
    cle: string
    valeur?: string
    secret: boolean
    portee: 'build' | 'runtime'
    environnements: string[]
  }>
}

export type TypeServiceProjet = 'application' | 'base' | 'statique' | 'cron' | 'worker'

export type MoteurBase = 'postgresql' | 'mysql' | 'mariadb' | 'mongodb' | 'redis' | 'clickhouse'

export interface ServiceProjet {
  id: string
  projetId: string
  nom: string
  type: TypeServiceProjet
  environnement: string
  statut: 'running' | 'building' | 'stopped' | 'degraded' | 'failed'
  ressources: { cpu: number; ramMo: number; diskGo: number }
  /**
   * Emplacement réel d'exécution — rare chez les concurrents et volontairement
   * exposé ici (§5.4) : on ne demande pas au client de faire confiance à vide.
   */
  emplacement: { site: Site; backend: string; vms?: string[]; namespace?: string }
  derniereMaj: string
  coutMensuel: number

  /** Applications, sites statiques et workers : l'entrée qui porte les déploiements. */
  appId?: string
  source?: { type: 'git' | 'image'; ref: string; branche?: string }
  portConteneur?: number

  /** Base de données managée par la plateforme applicative. */
  moteur?: MoteurBase
  version?: string
  base?: {
    nom: string
    utilisateur: string
    motDePasse: string
    hoteInterne: string
    port: number
  }
  exposeExterne?: { actif: boolean; port?: number; sourcesAutorisees?: string[] }
  sauvegarde?: {
    plan: string
    cron: string
    destination: string
    dernier: string
    retentionJours: number
    taille: string
  }

  /** Tâche planifiée. */
  cron?: {
    expression: string
    lisible: string
    commande: string
    derniereExecution: string
    dureeS: number
    statut: 'ok' | 'echec'
    prochaine: string
  }

  /** Worker de file. */
  file?: {
    nom: string
    enAttente: number
    traitesJour: number
    echecsJour: number
    concurrence: number
  }
}

/**
 * Zone applicative offerte à l'organisation. Elle existe pour que la première
 * mise en ligne ne dépende pas d'un achat de domaine : on déploie, on obtient
 * une URL qui fonctionne, on branche son domaine plus tard.
 */
export interface ZoneApplicative {
  zone: string
  wildcard: string
  /** Adresses d'entrée à viser depuis un DNS externe, par site. */
  ingress: Array<{ site: Site; ip: string; ipv6: string }>
  certificat: { emetteur: string; renouvellementAuto: boolean; expire: string }
  quotaDomaines: { utilises: number; total: number }
}

export interface DomaineApplicatif {
  id: string
  hote: string
  origine: 'genere' | 'personnalise'
  serviceId: string
  chemin: string
  portConteneur: number
  https: boolean
  certificat: {
    etat: 'actif' | 'en_emission' | 'echec' | 'aucun'
    emetteur?: string
    expire?: string
  }
  /** Vérification DNS guidée : l'enregistrement exact à créer, et son état. */
  verification?: {
    etat: 'ok' | 'attente' | 'echec'
    enregistrement: { type: 'A' | 'CNAME'; nom: string; valeur: string }
    verifieLe?: string
    detail?: string
    correlationId?: string
  }
  redirections?: Array<{ de: string; vers: string; code: 301 | 302 }>
}

// ─── Marketplace ──────────────────────────────────────────────────────

export type CategorieService =
  | 'collaboration'
  | 'communication'
  | 'metier'
  | 'web'
  | 'donnees'
  | 'technique'

export const CATEGORIE_LABEL: Record<CategorieService, string> = {
  collaboration: 'Collaboration',
  communication: 'Communication',
  metier: 'Métier',
  web: 'Web & e-commerce',
  donnees: 'Données',
  technique: 'Outils techniques',
}

export interface CatalogService {
  slug: string
  nom: string
  solutionOSS: string
  categorie: CategorieService
  logoUrl: string
  /** Couleur d'accent du logo de la solution, pour la vignette. */
  logoTeinte: string
  logoInitiales: string
  description: string
  pitch: string
  modes: Array<'dedie' | 'mutualise'>
  paliers: Array<{
    code: string
    nom: string
    specs: string
    prixSiege?: number
    prixMois?: number
    limites: string[]
    recommande?: boolean
  }>
  sla: string
  backupPolicyDefault: string
  reversibilite: { formats: string[]; delaiJours: number; docUrl: string }
  migrationEntrante: string[]
  migrationDelais?: string
  versionsSupportees: string[]
  certifie: boolean
  /** Lien vers l'interface native de la solution — externe au portail. */
  urlDemo: string
  captures: string[]
  parametresSpecifiques: Array<{ titre: string; description: string }>
  granulariteRestauration: string[]
}

export interface ManagedService {
  id: string
  orgId: string
  catalogSlug: string
  nom: string
  mode: 'dedie' | 'mutualise'
  site: Site
  palier: string
  version: string
  versionDisponible?: string
  domaine: string
  urlNative: string
  statut:
    | 'provisioning'
    | 'operationnel'
    | 'degrade'
    | 'maintenance'
    | 'maj_disponible'
    | 'erreur'
  siegesSouscrits: number
  siegesUtilises: number
  sso: {
    actif: boolean
    clientId: string
    groupMappings: Array<{ groupe: string; roleApp: string }>
  }
  backupPlanId?: string
  derniereSauvegarde?: string
  uptime30j: number
  parametres: Record<string, unknown>
  coutMensuel: number
  createdAt: string
  certificat?: { expire: string; auto: boolean }
}

export interface Seat {
  id: string
  managedServiceId: string
  userId: string
  statut: 'actif' | 'suspendu'
  quotaUtilise?: number
  quotaTotal?: number
  derniereActivite?: string
}

export interface WebHosting {
  id: string
  orgId: string
  type: 'mutualise' | 'wordpress' | 'prestashop'
  domaine: string
  palier: string
  runtime: { php?: string; node?: string }
  staging: boolean
  espaceUtiliseGo: number
  espaceTotalGo: number
  versions?: { coeur: string; majAuto: boolean; extensionsAMettreAJour?: number }
  securite: { waf: boolean; scanMalware: boolean; bruteForce?: boolean }
  statut: 'en_ligne' | 'maintenance' | 'suspendu'
  certificat: { expire: string; auto: boolean }
  bases: number
}

export interface DnsZone {
  id: string
  orgId: string
  domaine: string
  dnssec: boolean
  ns: string[]
  enregistrements: Array<{
    id: string
    type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'SRV' | 'CAA' | 'NS'
    nom: string
    valeur: string
    ttl: number
    priorite?: number
  }>
}

export interface Domaine {
  id: string
  orgId: string
  nom: string
  extension: string
  expiration: string
  renouvellementAuto: boolean
  whoisProtege: boolean
  verrouTransfert: boolean
  zoneId?: string
}

// ─── Commerce & exploitation ──────────────────────────────────────────

export interface Offer {
  id: string
  code: string
  nom: string
  categorie: 'espace_cloud' | 'image_vm' | 'k8s' | 'stack' | 'web'
  specs: string
  caracteristiques: string[]
  prix: { direct: number; revendeur: number; operateur: number }
  populaire?: boolean
  statut: 'brouillon' | 'publiee' | 'depreciee'
  souscriptionsActives: number
  sla?: string
  surDevis?: boolean
}

export interface Subscription {
  id: string
  orgId: string
  cible: { type: 'offer' | 'service'; ref: string; label: string }
  quantite: number
  prixApplique: number
  debut: string
  fin?: string
  periodicite: 'mensuelle' | 'annuelle'
}

export interface Invoice {
  id: string
  orgId: string
  numero: string
  periode: string
  lignes: Array<{ libelle: string; ref: string; quantite: number; pu: number; total: number }>
  sousTotal: number
  tvaPct: number
  total: number
  devise: Devise
  statut: 'brouillon' | 'emise' | 'payee' | 'impayee' | 'annulee'
  moyen?: MoyenPaiement
  pdfUrl: string
  echeance?: string
}

export type Devise = 'XOF' | 'EUR' | 'USD'

export type MoyenPaiement =
  | 'carte'
  | 'virement'
  | 'orange_money'
  | 'mtn_momo'
  | 'wave'
  | 'prepaye'

export const MOYEN_LABEL: Record<MoyenPaiement, string> = {
  carte: 'Carte bancaire',
  virement: 'Virement bancaire',
  orange_money: 'Orange Money',
  mtn_momo: 'MTN MoMo',
  wave: 'Wave',
  prepaye: 'Porte-monnaie prépayé',
}

export interface Devis {
  id: string
  orgId: string
  numero: string
  objet: string
  montant: number
  validite: string
  statut: 'envoye' | 'accepte' | 'refuse' | 'expire'
  createdAt: string
}

export interface Ticket {
  id: string
  orgId: string
  numero: string
  sujet: string
  gravite: 'critique' | 'majeure' | 'mineure' | 'question'
  statut: 'ouvert' | 'en_cours' | 'attente_client' | 'resolu' | 'ferme'
  slaCible: { premiereReponseMin: number; resolutionMin: number }
  slaRestantMin?: number
  ressourcesLiees: string[]
  service?: string
  assigneA?: string
  createdAt: string
  messages: Array<{
    auteur: string
    role: 'client' | 'synelia'
    date: string
    contenu: string
    pieces?: string[]
  }>
}

export interface AuditEvent {
  id: string
  ts: string
  orgId?: string
  orgNom?: string
  actor: { id: string; nom: string; email: string; type: 'user' | 'systeme' | 'api' }
  role: Role
  scope: {
    type: 'plateforme' | 'org' | 'espace' | 'application' | 'service'
    id?: string
    label: string
  }
  action: string
  target: string
  result: 'ok' | 'refuse' | 'erreur'
  detail?: string
  ip?: string
}

export interface ProvisioningJob {
  id: string
  orgId: string
  type: string
  label: string
  statut: 'queued' | 'running' | 'done' | 'failed' | 'rolled_back'
  taches: Array<{
    ordre: number
    nom: string
    statut: 'pending' | 'running' | 'ok' | 'failed'
    dureeS?: number
    message?: string
  }>
  erreur?: { message: string; correlationId: string; suggestion?: string }
  startedAt: string
  dureeS?: number
}

// ─── Observabilité (formats encadrés §0.3) ────────────────────────────

export interface EvenementSupervision {
  id: string
  ts: string
  gravite: 'critique' | 'majeure' | 'mineure' | 'info'
  ressource: string
  message: string
  site?: Site
}

export interface LigneLog {
  ts: string
  niveau: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  source: string
  message: string
}

export interface AlerteRegle {
  id: string
  cible: string
  metrique: string
  seuil: string
  canaux: Array<'email' | 'sms' | 'whatsapp' | 'webhook'>
  plage: string
  escalade?: string
  actif: boolean
}

// ─── Statut de plateforme (vitrine) ───────────────────────────────────

export interface StatutService {
  nom: string
  categorie: string
  etats: Record<Site, 'operationnel' | 'degrade' | 'panne' | 'maintenance'>
  uptime90j: number
}

export interface Incident {
  id: string
  titre: string
  gravite: 'majeur' | 'mineur' | 'maintenance'
  statut: 'en_cours' | 'surveille' | 'resolu'
  debut: string
  fin?: string
  services: string[]
  sites: Site[]
  mises_a_jour: Array<{ ts: string; texte: string }>
}
