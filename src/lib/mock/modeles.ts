/**
 * Bibliothèque de modèles applicatifs (§5, §6).
 *
 * Un modèle décrit une solution open source prête à déployer dans un projet :
 * son image, ses volumes, ses variables, ses dépendances. Déployer un modèle
 * crée un service dédié — une instance qui n'appartient qu'au client, par
 * opposition aux services partagés du Web Cloud, mutualisés et fixés au domaine.
 *
 * Le socle d'exécution est le Kubernetes managé de la plateforme : un espace de
 * noms par projet, les volumes sur Cinder, l'entrée par l'Ingress. Le modèle
 * porte donc un chart, et non un fichier de composition.
 *
 * Toutes les valeurs sont fictives.
 */

export type CategorieModele =
  | 'collaboration'
  | 'communication'
  | 'metier'
  | 'donnees'
  | 'developpement'
  | 'observabilite'
  | 'automatisation'
  | 'web'

export interface ModeleApplicatif {
  slug: string
  nom: string
  solution: string
  categorie: CategorieModele
  phrase: string
  description: string
  logoInitiales: string
  logoTeinte: string
  /** Version qualifiée par Synelia — jamais « latest ». */
  version: string
  chart: string
  /** Ressources demandées par défaut, ajustables au déploiement. */
  ressources: { cpu: number; ramMo: number; diskGo: number }
  /** Services que le modèle amène avec lui dans le projet. */
  dependances: Array<{ nom: string; type: 'base' | 'cache' | 'file' | 'stockage'; detail: string }>
  variables: Array<{ cle: string; valeur?: string; secret: boolean; obligatoire: boolean; aide?: string }>
  volumes: Array<{ chemin: string; tailleGo: number; role: string }>
  ports: Array<{ conteneur: number; protocole: 'http' | 'tcp'; role: string }>
  /** Sous-domaine proposé sur la zone applicative de l'organisation. */
  sousDomaine: string
  /** Reprend le slug de configuration quand le service en possède une (§6.1). */
  configuration?: string
  /** Sauvegarde proposée dès le déploiement, comme pour toute ressource. */
  sauvegardeParDefaut: { frequence: string; retentionJours: number; inclut: string[] }
  prixIndicatif: number
  certifie: boolean
  populaire?: boolean
  /** Ce que le portail ne fera pas : le produit garde son interface (§0.2). */
  horsPerimetre: string
}

export const MODELES: ModeleApplicatif[] = [
  {
    slug: 'zimbra',
    nom: 'Messagerie dédiée',
    solution: 'Zimbra',
    categorie: 'communication',
    phrase: 'Une instance de messagerie qui n’appartient qu’à vous.',
    description:
      'Messagerie, agenda et carnet d’adresses sur une instance isolée, dimensionnée pour votre organisation. À préférer à la messagerie partagée dès que le nombre de boîtes dépasse la centaine, ou qu’une contrainte de rétention réglementaire impose une instance séparée.',
    logoInitiales: 'ZM',
    logoTeinte: '#0E7BC0',
    version: '10.1.4',
    chart: 'synelia/zimbra:2.3.1',
    ressources: { cpu: 4, ramMo: 16384, diskGo: 500 },
    dependances: [
      { nom: 'Base LDAP interne', type: 'base', detail: 'OpenLDAP, embarqué par le chart' },
      { nom: 'Stockage des boîtes', type: 'stockage', detail: 'Volume Cinder chiffré' },
    ],
    variables: [
      { cle: 'ZIMBRA_DOMAIN', obligatoire: true, secret: false, aide: 'Le domaine des adresses, par exemple dba.africa.' },
      { cle: 'ZIMBRA_ADMIN_PASSWORD', obligatoire: true, secret: true },
      { cle: 'ZIMBRA_SMTP_RELAY', valeur: 'smtp.synelia.cloud', obligatoire: false, secret: false, aide: 'Le relais Synelia protège la réputation d’expédition.' },
    ],
    volumes: [{ chemin: '/opt/zimbra/store', tailleGo: 500, role: 'Boîtes aux lettres' }],
    ports: [
      { conteneur: 443, protocole: 'http', role: 'Webmail et administration' },
      { conteneur: 25, protocole: 'tcp', role: 'SMTP entrant' },
      { conteneur: 993, protocole: 'tcp', role: 'IMAPS' },
    ],
    sousDomaine: 'mail',
    configuration: 'email-pro',
    sauvegardeParDefaut: {
      frequence: 'Quotidienne à 01:00',
      retentionJours: 30,
      inclut: ['Boîtes aux lettres', 'Annuaire LDAP', 'Configuration du domaine'],
    },
    prixIndicatif: 78000,
    certifie: true,
    populaire: true,
    horsPerimetre: 'Lire et écrire des messages se fait dans Zimbra, jamais dans le portail.',
  },
  {
    slug: 'odoo',
    nom: 'ERP dédié',
    solution: 'Odoo',
    categorie: 'metier',
    phrase: 'Gestion intégrée, sur une instance qui vous est propre.',
    description:
      'Comptabilité, ventes, achats, stock et paie sur une instance isolée. Le portail provisionne, sauvegarde et met à jour ; la configuration métier — plan comptable, journaux, exercices — se fait dans Odoo, par vos équipes ou par un intégrateur.',
    logoInitiales: 'OD',
    logoTeinte: '#714B67',
    version: '18.0',
    chart: 'synelia/odoo:4.1.0',
    ressources: { cpu: 4, ramMo: 8192, diskGo: 200 },
    dependances: [
      { nom: 'PostgreSQL 16', type: 'base', detail: 'Service dédié dans le même projet' },
      { nom: 'Stockage des pièces jointes', type: 'stockage', detail: 'Volume Cinder' },
    ],
    variables: [
      { cle: 'ODOO_ADMIN_PASSWORD', obligatoire: true, secret: true },
      { cle: 'ODOO_MODULES', valeur: 'base,account,sale,stock', obligatoire: false, secret: false, aide: 'Modules installés au premier démarrage.' },
      { cle: 'ODOO_LANG', valeur: 'fr_FR', obligatoire: false, secret: false },
    ],
    volumes: [{ chemin: '/var/lib/odoo', tailleGo: 200, role: 'Pièces jointes et sessions' }],
    ports: [{ conteneur: 8069, protocole: 'http', role: 'Interface web' }],
    sousDomaine: 'erp',
    configuration: 'erp',
    sauvegardeParDefaut: {
      frequence: 'Quotidienne à 01:30',
      retentionJours: 90,
      inclut: ['Base PostgreSQL', 'Pièces jointes', 'Modules installés'],
    },
    prixIndicatif: 96000,
    certifie: true,
    populaire: true,
    horsPerimetre: 'Aucun écran comptable dans le portail : la saisie et les états sont dans Odoo.',
  },
  {
    slug: 'nextcloud',
    nom: 'Drive dédié',
    solution: 'Nextcloud',
    categorie: 'collaboration',
    phrase: 'Vos fichiers, sur votre instance, avec votre quota.',
    description:
      'Partage de fichiers, édition collaborative et synchronisation de postes sur une instance isolée. Le drive partagé du Web Cloud suffit à une petite équipe ; l’instance dédiée devient nécessaire dès qu’il faut un quota important, un chiffrement propre ou une intégration à l’annuaire.',
    logoInitiales: 'NC',
    logoTeinte: '#0082C9',
    version: '29.0.4',
    chart: 'synelia/nextcloud:5.2.0',
    ressources: { cpu: 2, ramMo: 4096, diskGo: 1000 },
    dependances: [
      { nom: 'MariaDB 11.4', type: 'base', detail: 'Service dédié dans le même projet' },
      { nom: 'Redis', type: 'cache', detail: 'Verrous de fichiers et cache objet' },
    ],
    variables: [
      { cle: 'NEXTCLOUD_ADMIN_USER', valeur: 'admin', obligatoire: true, secret: false },
      { cle: 'NEXTCLOUD_ADMIN_PASSWORD', obligatoire: true, secret: true },
      { cle: 'NEXTCLOUD_TRUSTED_DOMAINS', obligatoire: true, secret: false, aide: 'Renseigné automatiquement avec le domaine choisi.' },
    ],
    volumes: [{ chemin: '/var/www/html/data', tailleGo: 1000, role: 'Fichiers des utilisateurs' }],
    ports: [{ conteneur: 80, protocole: 'http', role: 'Interface web et WebDAV' }],
    sousDomaine: 'drive',
    configuration: 'drive-pro',
    sauvegardeParDefaut: {
      frequence: 'Quotidienne à 02:00',
      retentionJours: 30,
      inclut: ['Fichiers', 'Base MariaDB', 'Configuration'],
    },
    prixIndicatif: 42000,
    certifie: true,
    horsPerimetre: 'Pas d’explorateur de fichiers dans le portail : Nextcloud fait cela mieux.',
  },
  {
    slug: 'mayan',
    nom: 'GED dédiée',
    solution: 'Mayan EDMS',
    categorie: 'metier',
    phrase: 'Indexation, OCR et coffre réglementaire.',
    description:
      'Gestion électronique de documents avec reconnaissance de texte, métadonnées, workflows de validation et rétention réglementaire. L’instance est isolée par construction : une GED mutualisée n’aurait pas de sens pour des pièces à valeur probante.',
    logoInitiales: 'MY',
    logoTeinte: '#B7472A',
    version: '4.8.3',
    chart: 'synelia/mayan:3.4.2',
    ressources: { cpu: 4, ramMo: 8192, diskGo: 500 },
    dependances: [
      { nom: 'PostgreSQL 16', type: 'base', detail: 'Service dédié' },
      { nom: 'Redis', type: 'cache', detail: 'File de tâches OCR' },
      { nom: 'Workers OCR', type: 'file', detail: 'Deux répliques par défaut' },
    ],
    variables: [
      { cle: 'MAYAN_OCR_LANGUAGES', valeur: 'fra+eng', obligatoire: false, secret: false },
      { cle: 'MAYAN_ADMIN_PASSWORD', obligatoire: true, secret: true },
    ],
    volumes: [{ chemin: '/var/lib/mayan', tailleGo: 500, role: 'Documents et index' }],
    ports: [{ conteneur: 8000, protocole: 'http', role: 'Interface web' }],
    sousDomaine: 'ged',
    configuration: 'ged',
    sauvegardeParDefaut: {
      frequence: 'Quotidienne à 01:00',
      retentionJours: 365,
      inclut: ['Documents', 'Index', 'Base PostgreSQL', 'Journal de rétention'],
    },
    prixIndicatif: 68000,
    certifie: true,
    horsPerimetre: 'La consultation et l’indexation des documents se font dans Mayan.',
  },
  {
    slug: 'jitsi',
    nom: 'Visioconférence dédiée',
    solution: 'Jitsi Meet',
    categorie: 'communication',
    phrase: 'Vos réunions, sur vos serveurs, sans limite de durée.',
    description:
      'Salles de réunion illimitées, partage d’écran, enregistrement local. L’instance dédiée retire la limite de participants de l’offre partagée et garde les flux à l’intérieur de votre infrastructure.',
    logoInitiales: 'JI',
    logoTeinte: '#1B5DAB',
    version: '2.0.9955',
    chart: 'synelia/jitsi:2.1.4',
    ressources: { cpu: 8, ramMo: 8192, diskGo: 100 },
    dependances: [
      { nom: 'Vidéobridge', type: 'file', detail: 'Deux répliques, autoscalées selon les salles' },
    ],
    variables: [
      { cle: 'JITSI_ENABLE_AUTH', valeur: 'true', obligatoire: false, secret: false, aide: 'Restreint la création de salles aux comptes fédérés.' },
      { cle: 'JITSI_MAX_PARTICIPANTS', valeur: '100', obligatoire: false, secret: false },
    ],
    volumes: [{ chemin: '/config', tailleGo: 20, role: 'Configuration et enregistrements' }],
    ports: [
      { conteneur: 443, protocole: 'http', role: 'Interface web' },
      { conteneur: 10000, protocole: 'tcp', role: 'Média UDP' },
    ],
    sousDomaine: 'visio',
    configuration: 'visio',
    sauvegardeParDefaut: {
      frequence: 'Hebdomadaire, dimanche 03:00',
      retentionJours: 14,
      inclut: ['Configuration'],
    },
    prixIndicatif: 36000,
    certifie: true,
    horsPerimetre: 'Rejoindre une réunion se fait dans Jitsi, depuis le navigateur.',
  },
  {
    slug: 'gitlab',
    nom: 'Forge logicielle',
    solution: 'GitLab CE',
    categorie: 'developpement',
    phrase: 'Dépôts, revues et intégration continue chez vous.',
    description:
      'Hébergement de code, demandes de fusion, registre d’images et intégration continue. Les exécutants de tâches se déclarent dans le projet et consomment la capacité de votre Espace Cloud.',
    logoInitiales: 'GL',
    logoTeinte: '#E24329',
    version: '17.3.2',
    chart: 'synelia/gitlab:6.0.1',
    ressources: { cpu: 8, ramMo: 16384, diskGo: 500 },
    dependances: [
      { nom: 'PostgreSQL 16', type: 'base', detail: 'Service dédié' },
      { nom: 'Redis', type: 'cache', detail: 'Files de tâches' },
      { nom: 'Stockage objet', type: 'stockage', detail: 'Artefacts et registre, sur un bucket S3' },
    ],
    variables: [
      { cle: 'GITLAB_ROOT_PASSWORD', obligatoire: true, secret: true },
      { cle: 'GITLAB_OMNIBUS_CONFIG', obligatoire: false, secret: false, aide: 'Réglages avancés, appliqués au démarrage.' },
    ],
    volumes: [{ chemin: '/var/opt/gitlab', tailleGo: 500, role: 'Dépôts et artefacts' }],
    ports: [
      { conteneur: 80, protocole: 'http', role: 'Interface web' },
      { conteneur: 22, protocole: 'tcp', role: 'SSH Git' },
    ],
    sousDomaine: 'git',
    configuration: 'forge',
    sauvegardeParDefaut: {
      frequence: 'Quotidienne à 00:30',
      retentionJours: 30,
      inclut: ['Dépôts', 'Base PostgreSQL', 'Registre d’images', 'Artefacts'],
    },
    prixIndicatif: 84000,
    certifie: true,
    horsPerimetre: 'Le code, les revues et les pipelines se pilotent dans GitLab.',
  },
  {
    slug: 'vaultwarden',
    nom: 'Coffre de mots de passe',
    solution: 'Vaultwarden',
    categorie: 'developpement',
    phrase: 'Les secrets de l’équipe, chiffrés de bout en bout.',
    description:
      'Coffre compatible avec les clients Bitwarden, chiffrement côté client, partage par collections. Léger : deux vCPU suffisent pour une organisation entière.',
    logoInitiales: 'VW',
    logoTeinte: '#175DDC',
    version: '1.32.1',
    chart: 'synelia/vaultwarden:1.4.0',
    ressources: { cpu: 1, ramMo: 1024, diskGo: 20 },
    dependances: [{ nom: 'PostgreSQL 16', type: 'base', detail: 'Service dédié, petit gabarit' }],
    variables: [
      { cle: 'ADMIN_TOKEN', obligatoire: true, secret: true },
      { cle: 'SIGNUPS_ALLOWED', valeur: 'false', obligatoire: false, secret: false, aide: 'Fermé par défaut : les comptes viennent de l’annuaire.' },
    ],
    volumes: [{ chemin: '/data', tailleGo: 20, role: 'Coffres chiffrés' }],
    ports: [{ conteneur: 80, protocole: 'http', role: 'Interface web et API' }],
    sousDomaine: 'coffre',
    configuration: 'coffre',
    sauvegardeParDefaut: {
      frequence: 'Quotidienne à 02:30',
      retentionJours: 90,
      inclut: ['Coffres chiffrés', 'Base PostgreSQL'],
    },
    prixIndicatif: 14000,
    certifie: true,
    horsPerimetre: 'Les secrets se consultent dans le client Bitwarden, jamais dans le portail.',
  },
  {
    slug: 'n8n',
    nom: 'Automatisation',
    solution: 'n8n',
    categorie: 'automatisation',
    phrase: 'Relier vos outils sans écrire de code.',
    description:
      'Scénarios déclenchés par un événement, un appel HTTP ou un horaire, avec des centaines de connecteurs. Utile pour relier l’ERP, la boutique et la messagerie sans développement spécifique.',
    logoInitiales: 'N8',
    logoTeinte: '#C4432B',
    version: '1.58.2',
    chart: 'synelia/n8n:2.2.0',
    ressources: { cpu: 2, ramMo: 4096, diskGo: 50 },
    dependances: [
      { nom: 'PostgreSQL 16', type: 'base', detail: 'Service dédié' },
      { nom: 'Workers', type: 'file', detail: 'Exécution des scénarios, deux répliques' },
    ],
    variables: [
      { cle: 'N8N_ENCRYPTION_KEY', obligatoire: true, secret: true },
      { cle: 'N8N_BASIC_AUTH_ACTIVE', valeur: 'false', obligatoire: false, secret: false, aide: 'Laissé à false : l’accès passe par la fédération.' },
    ],
    volumes: [{ chemin: '/home/node/.n8n', tailleGo: 50, role: 'Scénarios et identifiants' }],
    ports: [{ conteneur: 5678, protocole: 'http', role: 'Interface web et webhooks' }],
    sousDomaine: 'flux',
    configuration: 'automatisation',
    sauvegardeParDefaut: {
      frequence: 'Quotidienne à 03:00',
      retentionJours: 30,
      inclut: ['Scénarios', 'Identifiants chiffrés', 'Historique d’exécution'],
    },
    prixIndicatif: 24000,
    certifie: true,
    horsPerimetre: 'Les scénarios se construisent dans n8n, sur sa toile de connexion.',
  },
  {
    slug: 'metabase',
    nom: 'Informatique décisionnelle',
    solution: 'Metabase',
    categorie: 'donnees',
    phrase: 'Interroger vos données sans savoir écrire du SQL.',
    description:
      'Questions, tableaux de bord et envois périodiques sur vos bases. Se branche sur les bases managées de vos projets comme sur celles de vos hébergements.',
    logoInitiales: 'MB',
    logoTeinte: '#509EE3',
    version: '0.50.21',
    chart: 'synelia/metabase:2.0.3',
    ressources: { cpu: 2, ramMo: 4096, diskGo: 50 },
    dependances: [{ nom: 'PostgreSQL 16', type: 'base', detail: 'Métadonnées de Metabase' }],
    variables: [
      { cle: 'MB_ENCRYPTION_SECRET_KEY', obligatoire: true, secret: true },
      { cle: 'MB_SITE_LOCALE', valeur: 'fr', obligatoire: false, secret: false },
    ],
    volumes: [{ chemin: '/metabase-data', tailleGo: 50, role: 'Cache de requêtes' }],
    ports: [{ conteneur: 3000, protocole: 'http', role: 'Interface web' }],
    sousDomaine: 'bi',
    configuration: 'bi',
    sauvegardeParDefaut: {
      frequence: 'Quotidienne à 03:30',
      retentionJours: 30,
      inclut: ['Questions et tableaux de bord', 'Base de métadonnées'],
    },
    prixIndicatif: 32000,
    certifie: true,
    horsPerimetre: 'Les tableaux de bord se construisent et se lisent dans Metabase.',
  },
  {
    slug: 'matomo',
    nom: 'Mesure d’audience',
    solution: 'Matomo',
    categorie: 'donnees',
    phrase: 'Vos statistiques de visite, sans les céder à un tiers.',
    description:
      'Mesure d’audience hébergée chez vous, avec suivi sans cookie possible et anonymisation configurable. Les données restent sur le site que vous avez choisi.',
    logoInitiales: 'MT',
    logoTeinte: '#3450A1',
    version: '5.1.2',
    chart: 'synelia/matomo:1.8.0',
    ressources: { cpu: 2, ramMo: 4096, diskGo: 100 },
    dependances: [
      { nom: 'MariaDB 11.4', type: 'base', detail: 'Service dédié' },
      { nom: 'Worker d’archivage', type: 'file', detail: 'Agrégation horaire' },
    ],
    variables: [
      { cle: 'MATOMO_DATABASE_PASSWORD', obligatoire: true, secret: true },
      { cle: 'MATOMO_ANONYMIZE_IP', valeur: '2', obligatoire: false, secret: false, aide: 'Nombre d’octets masqués dans l’adresse IP.' },
    ],
    volumes: [{ chemin: '/var/www/html/config', tailleGo: 10, role: 'Configuration' }],
    ports: [{ conteneur: 80, protocole: 'http', role: 'Interface web et point de collecte' }],
    sousDomaine: 'audience',
    configuration: 'analytics-web',
    sauvegardeParDefaut: {
      frequence: 'Quotidienne à 04:00',
      retentionJours: 30,
      inclut: ['Base MariaDB', 'Configuration'],
    },
    prixIndicatif: 18000,
    certifie: true,
    horsPerimetre: 'Les rapports de fréquentation se lisent dans Matomo.',
  },
  {
    slug: 'grafana',
    nom: 'Tableaux de bord de métriques',
    solution: 'Grafana',
    categorie: 'observabilite',
    phrase: 'Vos propres tableaux de bord, sur vos propres sources.',
    description:
      'Instance dédiée pour vos tableaux de bord métier, branchée sur la métrologie de la plateforme ou sur vos bases. La supervision contractuelle reste opérée par Synelia dans Centreon ; ceci s’ajoute, ne remplace pas.',
    logoInitiales: 'GR',
    logoTeinte: '#F46800',
    version: '11.2.0',
    chart: 'synelia/grafana:3.1.0',
    ressources: { cpu: 2, ramMo: 2048, diskGo: 20 },
    dependances: [{ nom: 'PostgreSQL 16', type: 'base', detail: 'Configuration et tableaux' }],
    variables: [
      { cle: 'GF_SECURITY_ADMIN_PASSWORD', obligatoire: true, secret: true },
      { cle: 'GF_AUTH_GENERIC_OAUTH_ENABLED', valeur: 'true', obligatoire: false, secret: false, aide: 'Connexion par la fédération Synelia.' },
    ],
    volumes: [{ chemin: '/var/lib/grafana', tailleGo: 20, role: 'Tableaux de bord' }],
    ports: [{ conteneur: 3000, protocole: 'http', role: 'Interface web' }],
    sousDomaine: 'metriques',
    sauvegardeParDefaut: {
      frequence: 'Hebdomadaire, dimanche 04:30',
      retentionJours: 30,
      inclut: ['Tableaux de bord', 'Sources de données'],
    },
    prixIndicatif: 16000,
    certifie: true,
    horsPerimetre: 'La construction des tableaux de bord se fait dans Grafana.',
  },
  {
    slug: 'ghost',
    nom: 'Publication éditoriale',
    solution: 'Ghost',
    categorie: 'web',
    phrase: 'Un média ou un blog professionnel, sans PHP.',
    description:
      'Publication en Node, abonnements et lettres d’information intégrées. Alternative à WordPress quand la rédaction primaire est éditoriale et que l’écosystème d’extensions n’est pas nécessaire.',
    logoInitiales: 'GH',
    logoTeinte: '#15171A',
    version: '5.95.0',
    chart: 'synelia/ghost:2.4.0',
    ressources: { cpu: 1, ramMo: 2048, diskGo: 50 },
    dependances: [{ nom: 'MariaDB 11.4', type: 'base', detail: 'Service dédié, petit gabarit' }],
    variables: [
      { cle: 'url', obligatoire: true, secret: false, aide: 'Renseigné automatiquement avec le domaine choisi.' },
      { cle: 'mail__options__auth__pass', obligatoire: false, secret: true, aide: 'Clé du relais SMTP Synelia.' },
    ],
    volumes: [{ chemin: '/var/lib/ghost/content', tailleGo: 50, role: 'Médias et thèmes' }],
    ports: [{ conteneur: 2368, protocole: 'http', role: 'Interface web et administration' }],
    sousDomaine: 'journal',
    sauvegardeParDefaut: {
      frequence: 'Quotidienne à 02:00',
      retentionJours: 30,
      inclut: ['Contenus', 'Médias', 'Base MariaDB'],
    },
    prixIndicatif: 12000,
    certifie: false,
    horsPerimetre: 'La rédaction et la publication se font dans Ghost.',
  },
]

export const CATEGORIE_MODELE_LABEL: Record<CategorieModele, string> = {
  collaboration: 'Collaboration',
  communication: 'Communication',
  metier: 'Métier',
  donnees: 'Données',
  developpement: 'Outils de développement',
  observabilite: 'Observabilité',
  automatisation: 'Automatisation',
  web: 'Web & publication',
}

/** Ordre d'affichage des catégories dans la bibliothèque. */
export const CATEGORIES_MODELES: CategorieModele[] = [
  'communication',
  'collaboration',
  'metier',
  'donnees',
  'developpement',
  'automatisation',
  'observabilite',
  'web',
]

export const modeleBySlug = (slug: string) => MODELES.find((m) => m.slug === slug)
export const modelesDeCategorie = (c: CategorieModele) => MODELES.filter((m) => m.categorie === c)
