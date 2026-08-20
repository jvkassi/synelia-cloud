/**
 * Contenu de la vitrine publique (spécification Partie 2).
 * Tarifs indicatifs, TVA 18 %, montants en FCFA.
 */

// ─── Mégamenu Produits — quatre colonnes (§2.1) ───────────────────────

export interface EntreeMegamenu {
  nom: string
  slug: string
  resume: string
}

export const MEGAMENU: Array<{ colonne: string; entrees: EntreeMegamenu[] }> = [
  {
    colonne: 'Calcul & réseau',
    entrees: [
      { nom: 'Espace Cloud (VDC)', slug: 'espace-cloud', resume: 'Une enveloppe de capacité, vos ressources dedans.' },
      { nom: 'Machines virtuelles', slug: 'machines-virtuelles', resume: 'Linux et Windows, du gabarit standard au sur-mesure.' },
      { nom: 'Kubernetes managé', slug: 'kubernetes', resume: 'Control plane opéré, pools autoscalés.' },
      { nom: 'Load balancer', slug: 'load-balancer', resume: 'L4 et L7, WAF OWASP, health checks.' },
      { nom: 'Réseau privé & VPN', slug: 'reseau-vpn', resume: 'Segmentation, IPsec site-à-site, accès SSL.' },
      { nom: 'IP & anti-DDoS', slug: 'ip-antiddos', resume: 'Adresses publiques, PTR, filtrage volumétrique.' },
    ],
  },
  {
    colonne: 'Stockage & protection',
    entrees: [
      { nom: 'Volumes', slug: 'volumes', resume: 'NVMe, SSD, HDD, archive. Extension à chaud.' },
      { nom: 'Stockage objet S3', slug: 'stockage-objet', resume: 'Compatible S3, versioning, WORM anti-rançongiciel.' },
      { nom: 'Bases managées', slug: 'bases-managees', resume: 'PostgreSQL, MySQL, MariaDB, MongoDB, Redis.' },
      { nom: 'Cloud Backup', slug: 'cloud-backup', resume: 'Plans immuables, restauration granulaire, 3-2-1.' },
      { nom: 'PRA / DRaaS', slug: 'pra', resume: 'RPO et RTO constatés, bascule testée.' },
    ],
  },
  {
    colonne: 'Applications',
    entrees: [
      { nom: 'Marketplace', slug: 'marketplace', resume: 'Solutions open source opérées par Synelia.' },
      { nom: 'Drive Pro', slug: 'drive-pro', resume: 'Partage de fichiers et édition collaborative.' },
      { nom: 'Email Pro', slug: 'email-pro', resume: 'Messagerie, agenda et contacts partagés.' },
      { nom: 'GED', slug: 'ged', resume: 'Indexation, OCR, workflows, coffre réglementaire.' },
      { nom: 'Visio & chat', slug: 'visio', resume: 'Réunions et fils de discussion persistants.' },
      { nom: 'ERP / CRM', slug: 'erp', resume: 'Gestion intégrée et relation client.' },
    ],
  },
  {
    colonne: 'Web',
    entrees: [
      { nom: 'Hébergement web', slug: 'hebergement-web', resume: 'Mutualisé PHP et Node, certificats inclus.' },
      { nom: 'WordPress managé', slug: 'wordpress', resume: 'Mises à jour maîtrisées, cache, WAF, staging.' },
      { nom: 'PrestaShop managé', slug: 'prestashop', resume: 'Boutique avec paiements mobile money.' },
      { nom: 'Noms de domaine', slug: 'domaines', resume: 'Enregistrement, transfert, WHOIS protégé.' },
      { nom: 'DNS managé', slug: 'dns', resume: 'Zones, DNSSEC, DNS secondaire.' },
      { nom: 'Relais SMTP', slug: 'smtp', resume: 'Envoi transactionnel, SPF/DKIM/DMARC, réputation.' },
    ],
  },
]

// ─── Indicateurs du héros (§2.2) ──────────────────────────────────────

export const INDICATEURS_HERO = [
  { valeur: '99,98 %', libelle: 'disponibilité constatée sur 30 jours' },
  { valeur: '< 30 min', libelle: 'délai de première réponse en critique' },
  { valeur: '2 sites', libelle: 'Abidjan et Grand-Bassam' },
]

export const BANDEAU_CONFIANCE = [
  { valeur: '40+', libelle: 'organisations clientes' },
  { valeur: '2', libelle: 'sites en Côte d’Ivoire' },
  { valeur: '24/7', libelle: 'supervision NOC avec astreinte' },
  { valeur: 'ISO 27001', libelle: 'démarche de certification en cours' },
]

// ─── Deux portes d'entrée (§2.2 §3) ───────────────────────────────────

export const PORTES_ENTREE = [
  {
    titre: 'Je veux de l’infrastructure',
    accroche: 'Capacité, machines, réseau, stockage et plan de reprise. Vous pilotez, nous opérons le socle.',
    items: ['Espace Cloud (VDC)', 'Machines virtuelles', 'Kubernetes managé', 'Stockage bloc et objet', 'PRA / DRaaS'],
    cta: { libelle: 'Explorer l’infrastructure', href: '/offres/espace-cloud' },
    prix: 'À partir de 25 000 FCFA/mois',
  },
  {
    titre: 'Je veux des outils de travail',
    accroche: 'Drive, messagerie, visio, GED, ERP. Vous utilisez, nous provisionnons, sauvegardons et supervisons.',
    items: ['Drive Pro', 'Email Pro', 'Visio & Chat', 'GED', 'ERP / CRM'],
    cta: { libelle: 'Explorer le marketplace', href: '/marketplace' },
    prix: 'À partir de 700 FCFA/siège/mois',
  },
]

// ─── Catalogue par besoin — cartes d'accueil (§2.2 §4) ────────────────

export const CARTES_PRODUIT = [
  { nom: 'Espace Cloud', slug: 'espace-cloud', phrase: 'Votre enveloppe de capacité, isolée et dimensionnable.', prix: 25000, unite: '/mois', famille: 'Calcul' },
  { nom: 'Machines virtuelles', slug: 'machines-virtuelles', phrase: 'Linux ou Windows, du 2 vCPU au 64 vCPU.', prix: 4200, unite: '/mois', famille: 'Calcul' },
  { nom: 'Kubernetes managé', slug: 'kubernetes', phrase: 'Control plane opéré, pools autoscalés, modules prêts.', prix: 45000, unite: '/mois', famille: 'Calcul' },
  { nom: 'Stockage objet S3', slug: 'stockage-objet', phrase: 'Compatible S3, versioning, verrouillage WORM.', prix: 1500, unite: '/To/mois', famille: 'Stockage' },
  { nom: 'Cloud Backup', slug: 'cloud-backup', phrase: 'Sauvegarde immuable, restauration au fichier près.', prix: 2800, unite: '/To/mois', famille: 'Protection' },
  { nom: 'PRA / DRaaS', slug: 'pra', phrase: 'Bascule inter-site testée, RPO et RTO constatés.', prix: 96000, unite: '/mois', famille: 'Protection' },
  { nom: 'Drive Pro', slug: 'drive-pro', phrase: 'Fichiers partagés et documents collaboratifs.', prix: 2200, unite: '/siège/mois', famille: 'Applications' },
  { nom: 'WordPress managé', slug: 'wordpress', phrase: 'Votre site opéré, mis à jour et protégé.', prix: 14000, unite: '/mois', famille: 'Web' },
]

// ─── Bloc PRA (§2.2 §5) ───────────────────────────────────────────────

export const BLOC_PRA = {
  titre: 'Votre plan de reprise, testé et prouvé.',
  texte:
    'Un plan de reprise qui n’a jamais été exercé n’est pas un plan, c’est une intention. Nous exerçons le vôtre trimestriellement, en réseau isolé, et nous vous remettons le rapport avec le temps de reprise réellement constaté.',
  indicateurs: [
    { valeur: '11 min', libelle: 'RPO constaté médian', cible: 'cible 15 min' },
    { valeur: '3 h 12', libelle: 'RTO constaté médian', cible: 'cible 4 h' },
    { valeur: '12/07/2026', libelle: 'dernier exercice réussi', cible: 'prochain : 15/10/2026' },
  ],
  cta: 'Demander une évaluation PRA',
}

// ─── Bloc souveraineté (§2.2 §6 · §2.7) ───────────────────────────────

export const BLOC_SOUVERAINETE = [
  {
    titre: 'Où sont vos données',
    texte:
      'Sur deux sites nommés, en Côte d’Ivoire : Synertech Vallon à Cocody (Abidjan) et le parc VITIB à Grand-Bassam. Aucune réplication hors du territoire, sauf demande écrite de votre part.',
    lien: { libelle: 'Voir les datacenters', href: '/datacenters' },
  },
  {
    titre: 'Qui peut y accéder',
    texte:
      'Un modèle de droits explicite — onze rôles, une matrice publiée — et un journal d’audit qui enregistre aussi les refus. Les accès de nos ingénieurs sont nominatifs, élevés temporairement et justifiés.',
    lien: { libelle: 'Voir la matrice des rôles', href: '/souverainete#acces' },
  },
  {
    titre: 'Comment vous repartez',
    texte:
      'Chaque service documente son format d’export et son délai. Nous testons la réversibilité, comme nous testons les restaurations. Partir doit être possible pour que rester soit un choix.',
    lien: { libelle: 'Lire la procédure', href: '/souverainete#reversibilite' },
  },
]

/** Les trois niveaux de souveraineté et la position de Synelia (§2.7). */
export const NIVEAUX_SOUVERAINETE = [
  {
    niveau: 'Souveraineté des données',
    question: 'Où vos données sont-elles physiquement stockées ?',
    position: 'Atteinte',
    detail:
      'Abidjan et Grand-Bassam. Nous fournissons sur demande une attestation de résidence des données, ressource par ressource, avec l’identifiant du site.',
    statut: 'ok' as const,
  },
  {
    niveau: 'Souveraineté opérationnelle',
    question: 'Qui exploite la plateforme, et depuis où ?',
    position: 'Atteinte',
    detail:
      'Équipe basée à Abidjan, NOC 24/7 avec astreinte. Aucune administration déléguée hors du continent. Les accès privilégiés sont journalisés et soumis à élévation temporaire justifiée.',
    statut: 'ok' as const,
  },
  {
    niveau: 'Souveraineté logicielle',
    question: 'La pile technique dépend-elle d’un éditeur étranger ?',
    position: 'En transition assumée',
    detail:
      'Nos offres Cloud Souverain reposent exclusivement sur OpenStack, Proxmox VE et Apache CloudStack. Nous exploitons encore de la capacité VMware vSphere et Microsoft Hyper-V, héritée de reprises de parcs clients : ces backends sont marqués « en sortie » avec une date cible de migration (juin 2027 pour vSphere, mars 2027 pour Hyper-V). Nous préférons l’afficher que le taire.',
    statut: 'transition' as const,
  },
]

/** Trajectoire de sortie des backends propriétaires — arbitrage §12.1. */
export const TRAJECTOIRE_SORTIE = [
  { backend: 'VMware vSphere · CL-GRA-01', part: '38 % de la capacité', cible: 'Juin 2027', avancement: 22 },
  { backend: 'Microsoft Hyper-V · HV-RBX-01', part: '12 % de la capacité', cible: 'Mars 2027', avancement: 41 },
  { backend: 'OpenStack, Proxmox, CloudStack', part: '50 % de la capacité', cible: 'Socle cible', avancement: 100 },
]

// ─── Preuve — études de cas (§2.2 §8) ─────────────────────────────────

export const ETUDES_CAS = [
  {
    client: 'Institution de microfinance · 14 filiales',
    secteur: 'Finance',
    chiffre: '−41 %',
    chiffreLibelle: 'de coût d’infrastructure la première année',
    texte:
      'Sortie d’un contrat de licences propriétaires vers un Espace Cloud Pro réparti sur deux sites, avec PRA inter-site et messagerie Email Pro pour 240 collaborateurs.',
  },
  {
    client: 'Opérateur de transport urbain',
    secteur: 'Mobilité',
    chiffre: '3 h 12',
    chiffreLibelle: 'de temps de reprise constaté, pour 4 h engagées',
    texte:
      'Mise en place d’un plan de reprise avec exercices trimestriels. Le dernier exercice de bascule a été mené en réseau isolé, sans impact sur la production.',
  },
  {
    client: 'Institution publique · registre national',
    secteur: 'Secteur public',
    chiffre: '400',
    chiffreLibelle: 'sièges Drive et messagerie migrés en six semaines',
    texte:
      'Migration depuis Microsoft 365, avec conservation de l’historique des boîtes et bascule MX en une nuit après pré-synchronisation.',
  },
]

// ─── FAQ d'accueil (§2.2 §9) ──────────────────────────────────────────

export const FAQ_ACCUEIL = [
  {
    question: 'Où mes données sont-elles hébergées ?',
    reponse:
      'Sur nos deux sites en Côte d’Ivoire : Synertech Vallon à Cocody (Abidjan) et le parc technologique VITIB à Grand-Bassam. Vous choisissez le site à la création de chaque Espace Cloud, et l’emplacement physique de chaque ressource reste visible partout dans le portail.',
  },
  {
    question: 'Que se passe-t-il si je veux partir ?',
    reponse:
      'Chaque service du marketplace documente son format d’export et le délai associé — cinq jours pour un Drive, sept pour une messagerie, dix pour une GED. Nous testons ces exports comme nous testons les restaurations. Vous repartez avec vos données dans un format standard, pas dans un format maison.',
  },
  {
    question: 'Le portail réimplémente-t-il Nextcloud, Odoo ou WordPress ?',
    reponse:
      'Non, et c’est délibéré. Le portail provisionne, dimensionne, gère les sièges, sauvegarde, supervise et facture. Pour utiliser le service, un bouton « Ouvrir » vous redirige en SSO vers son interface d’origine. Vous bénéficiez de l’écosystème complet de la solution, pas d’une pâle copie.',
  },
  {
    question: 'Comment puis-je payer ?',
    reponse:
      'Carte bancaire, virement, et mobile money : Orange Money, MTN MoMo et Wave, au même niveau que les autres moyens. Un porte-monnaie prépayé est également disponible pour les organisations qui préfèrent provisionner à l’avance.',
  },
  {
    question: 'Quel est le niveau de service garanti ?',
    reponse:
      'De 99,9 % à 99,99 % selon l’offre et le composant, avec un délai de première réponse de 30 minutes en gravité critique. Les manquements génèrent automatiquement des crédits SLA, visibles dans votre espace client sans que vous ayez à les réclamer.',
  },
  {
    question: 'Puis-je récupérer un seul fichier depuis une sauvegarde ?',
    reponse:
      'Oui. L’assistant de restauration descend jusqu’au fichier, au dossier, à la boîte aux lettres ou à la base, et permet de restaurer au même endroit, dans un autre Espace Cloud, sur l’autre site, ou en téléchargement local.',
  },
]

// ─── Tarifs (§2.4) ────────────────────────────────────────────────────

export interface FamilleTarif {
  id: string
  nom: string
  note?: string
  colonnes: Array<{ nom: string; prix: number | null; surDevis?: boolean; recommande?: boolean; unite: string }>
  lignes: Array<{ caracteristique: string; valeurs: Array<string | boolean> }>
}

export const FAMILLES_TARIFS: FamilleTarif[] = [
  {
    id: 'espace-cloud',
    nom: 'Espace Cloud',
    note: 'Une enveloppe de capacité par Espace Cloud. Les ressources créées dedans consomment ce quota.',
    colonnes: [
      { nom: 'Cloud Flex', prix: 25000, unite: '/mois' },
      { nom: 'Cloud Souverain', prix: 62000, unite: '/mois' },
      { nom: 'Cloud Pro', prix: 85000, unite: '/mois', recommande: true },
      { nom: 'Cloud Enterprise', prix: null, surDevis: true, unite: '' },
    ],
    lignes: [
      { caracteristique: 'vCPU inclus', valeurs: ['12', '24', '48', 'Sur mesure'] },
      { caracteristique: 'Mémoire', valeurs: ['48 Go', '96 Go', '192 Go', 'Sur mesure'] },
      { caracteristique: 'Stockage', valeurs: ['2 To SSD', '4 To NVMe', '6 To NVMe', 'Sur mesure'] },
      { caracteristique: 'IP publiques incluses', valeurs: ['1', '2', '4', 'Illimité'] },
      { caracteristique: 'Socle 100 % open source', valeurs: [false, true, false, true] },
      { caracteristique: 'Sauvegarde incluse', valeurs: ['14 j', '35 j immuable', '35 j immuable', 'Sur mesure'] },
      { caracteristique: 'Réseau privé et VPN', valeurs: [false, true, true, true] },
      { caracteristique: 'PRA inter-site', valeurs: [false, false, 'Option', true] },
      { caracteristique: 'SLA', valeurs: ['99,9 %', '99,95 %', '99,95 %', '99,99 %'] },
      { caracteristique: 'Astreinte 24/7', valeurs: [false, true, true, 'Nominative'] },
    ],
  },
  {
    id: 'kubernetes',
    nom: 'Kubernetes',
    colonnes: [
      { nom: 'K8S Starter', prix: 45000, unite: '/mois' },
      { nom: 'K8S HA', prix: 148000, unite: '/mois', recommande: true },
      { nom: 'K8S Managé+', prix: 265000, unite: '/mois' },
    ],
    lignes: [
      { caracteristique: 'Control plane', valeurs: ['1 master', '3 masters HA', '3 masters HA'] },
      { caracteristique: 'Workers inclus', valeurs: ['3 × 4 vCPU', '5 × 8 vCPU', '5 × 8 vCPU'] },
      { caracteristique: 'Autoscaling des pools', valeurs: [false, true, true] },
      { caracteristique: 'Registre d’images', valeurs: ['50 Go', '250 Go', '1 To'] },
      { caracteristique: 'Modules préinstallés', valeurs: ['Ingress, cert-manager', '+ Argo CD, DNS, Rook', 'Catalogue complet'] },
      { caracteristique: 'Sauvegarde de cluster', valeurs: [false, true, true] },
      { caracteristique: 'Exploitation déléguée', valeurs: [false, false, true] },
      { caracteristique: 'SLA', valeurs: ['99,9 %', '99,95 %', '99,99 %'] },
    ],
  },
  {
    id: 'stockage',
    nom: 'Stockage',
    note: 'Facturation au To alloué et par mois, au prorata journalier.',
    colonnes: [
      { nom: 'Volume SSD', prix: 3200, unite: '/To/mois' },
      { nom: 'Volume NVMe', prix: 5400, unite: '/To/mois', recommande: true },
      { nom: 'Objet S3 chaud', prix: 1500, unite: '/To/mois' },
      { nom: 'Objet S3 froid', prix: 620, unite: '/To/mois' },
    ],
    lignes: [
      { caracteristique: 'IOPS garantis', valeurs: ['6 000', '12 000', '—', '—'] },
      { caracteristique: 'Chiffrement au repos', valeurs: [true, true, true, true] },
      { caracteristique: 'Extension à chaud', valeurs: [true, true, '—', '—'] },
      { caracteristique: 'Versioning', valeurs: [false, false, true, true] },
      { caracteristique: 'Verrouillage WORM', valeurs: [false, false, true, true] },
      { caracteristique: 'Réplication inter-site', valeurs: ['Option', 'Option', true, true] },
      { caracteristique: 'Trafic sortant inclus', valeurs: ['—', '—', '1 To/mois', '200 Go/mois'] },
    ],
  },
  {
    id: 'marketplace',
    nom: 'Marketplace (par siège)',
    note: 'Prix par siège et par mois, palier Business. Le mode dédié majore de 20 % le prix du siège.',
    colonnes: [
      { nom: 'Coffre', prix: 1100, unite: '/siège/mois' },
      { nom: 'Visio & Chat', prix: 1600, unite: '/siège/mois' },
      { nom: 'Email Pro', prix: 2900, unite: '/siège/mois', recommande: true },
      { nom: 'Drive Pro', prix: 3400, unite: '/siège/mois' },
    ],
    lignes: [
      { caracteristique: 'Quota par siège', valeurs: ['Illimité', '—', '50 Go', '500 Go'] },
      { caracteristique: 'SSO Keycloak inclus', valeurs: [true, true, true, true] },
      { caracteristique: 'Sauvegarde incluse', valeurs: ['90 j immuable', '30 j', '35 j immuable', '30 j'] },
      { caracteristique: 'Restauration granulaire', valeurs: ['Élément', 'Canal', 'Message', 'Fichier'] },
      { caracteristique: 'Mode dédié disponible', valeurs: [true, true, true, true] },
      { caracteristique: 'Réversibilité testée', valeurs: ['1 j', '3 j', '7 j', '5 j'] },
      { caracteristique: 'SLA', valeurs: ['99,95 %', '99,9 %', '99,95 %', '99,9 %'] },
    ],
  },
  {
    id: 'web',
    nom: 'Web',
    colonnes: [
      { nom: 'Mutualisé', prix: 6500, unite: '/mois' },
      { nom: 'WordPress managé', prix: 38000, unite: '/mois', recommande: true },
      { nom: 'PrestaShop managé', prix: 52000, unite: '/mois' },
    ],
    lignes: [
      { caracteristique: 'Espace disque', valeurs: ['10 Go', '100 Go', '50 Go'] },
      { caracteristique: 'Sites inclus', valeurs: ['5', '5', '1 boutique'] },
      { caracteristique: 'Runtime', valeurs: ['PHP 8.1–8.3, Node 20', 'PHP 8.3 optimisé', 'PHP 8.2 optimisé'] },
      { caracteristique: 'Cache Redis + Varnish', valeurs: [false, true, true] },
      { caracteristique: 'WAF OWASP', valeurs: [false, true, true] },
      { caracteristique: 'Préproduction (staging)', valeurs: [false, true, true] },
      { caracteristique: 'Paiement mobile money', valeurs: [false, false, true] },
      { caracteristique: 'Certificat automatique', valeurs: [true, true, true] },
    ],
  },
]

// ─── Fiches produit (§2.3) ────────────────────────────────────────────

export interface FicheProduit {
  slug: string
  nom: string
  surtitre: string
  accroche: string
  resume: string
  puces: string[]
  paliers: Array<{ nom: string; specs: string; prix: number | null; surDevis?: boolean; recommande?: boolean; unite: string }>
  caracteristiques: Array<{ theme: string; items: Array<{ libelle: string; valeur: string }> }>
  sla: { dispo: string; reponse: string; resolution: string; credits: string }
  architecture: { titre: string; couches: Array<{ nom: string; elements: string[] }> }
  faq: Array<{ question: string; reponse: string }>
}

export const FICHES_PRODUIT: FicheProduit[] = [
  {
    slug: 'espace-cloud',
    nom: 'Espace Cloud (VDC)',
    surtitre: 'Calcul & réseau',
    accroche: 'Une enveloppe de capacité, vos ressources dedans.',
    resume:
      'Un Espace Cloud est un datacenter virtuel : un quota de vCPU, de mémoire et de stockage, une plage réseau qui vous est propre, et un site physique que vous choisissez. Vous créez ensuite librement machines, clusters et volumes dans cette enveloppe.',
    puces: [
      'Un quota que vous étendez à chaud, sans recréer quoi que ce soit',
      'Une plage réseau privée et un DNS interne dédiés',
      'Le placement technique est notre affaire, pas la vôtre',
    ],
    paliers: [
      { nom: 'Cloud Flex', specs: '12 vCPU · 48 Go · 2 To SSD', prix: 25000, unite: '/mois' },
      { nom: 'Cloud Souverain', specs: '24 vCPU · 96 Go · 4 To NVMe · 100 % open source', prix: 62000, unite: '/mois' },
      { nom: 'Cloud Pro', specs: '48 vCPU · 192 Go · 6 To NVMe', prix: 85000, unite: '/mois', recommande: true },
      { nom: 'Cloud Enterprise', specs: 'Sur mesure · SLA 99,99 % · PRA inclus', prix: null, surDevis: true, unite: '' },
    ],
    caracteristiques: [
      {
        theme: 'Capacité',
        items: [
          { libelle: 'Extension du quota', valeur: 'À chaud, effet immédiat, facturation au prorata' },
          { libelle: 'Changement d’offre', valeur: 'Sans interruption, du Flex à l’Enterprise' },
          { libelle: 'Sur-engagement', valeur: 'Aucun sur les offres Pro, Souverain et Enterprise' },
        ],
      },
      {
        theme: 'Réseau',
        items: [
          { libelle: 'Plage CIDR', valeur: 'Proposée automatiquement, modifiable à la création' },
          { libelle: 'Réseaux privés', valeur: 'Illimités dans la plage allouée, VLAN dédiés' },
          { libelle: 'Peering inter-espaces', valeur: 'Disponible entre deux Espaces Cloud de la même organisation' },
          { libelle: 'DNS interne', valeur: 'Zone privée résolue depuis l’espace' },
        ],
      },
      {
        theme: 'Localisation',
        items: [
          { libelle: 'Sites disponibles', valeur: 'Abidjan (Synertech Vallon) · Grand-Bassam (VITIB)' },
          { libelle: 'Latence inter-site', valeur: '4 à 6 ms mesurés' },
          { libelle: 'Résidence des données', valeur: 'Attestation générable à tout moment' },
        ],
      },
      {
        theme: 'Exploitation',
        items: [
          { libelle: 'Supervision', valeur: 'Incluse — sondes posées automatiquement à la création' },
          { libelle: 'Sauvegarde par défaut', valeur: 'Proposée à la création, applicable par étiquette' },
          { libelle: 'Journal d’audit', valeur: 'Toutes les actions, y compris les refus de droits' },
        ],
      },
    ],
    sla: {
      dispo: '99,9 % (Flex) à 99,99 % (Enterprise)',
      reponse: '30 min en gravité critique',
      resolution: '4 h en gravité critique',
      credits: 'Crédits calculés et appliqués automatiquement, sans réclamation',
    },
    architecture: {
      titre: 'Architecture typique d’un Espace Cloud Pro',
      couches: [
        { nom: 'Exposition', elements: ['IP publique + anti-DDoS', 'Load balancer L7 avec WAF'] },
        { nom: 'Applicatif', elements: ['2 machines web', 'Cluster Kubernetes 5 nœuds'] },
        { nom: 'Données', elements: ['Base managée PostgreSQL HA', 'Cache Redis', 'Volumes NVMe chiffrés'] },
        { nom: 'Protection', elements: ['Plan de sauvegarde immuable', 'Réplication vers le second site'] },
      ],
    },
    faq: [
      { question: 'Puis-je avoir plusieurs Espaces Cloud ?', reponse: 'Oui, autant que nécessaire. C’est la façon habituelle de séparer production, préproduction et site de repli, chacun avec son quota et sa plage réseau.' },
      { question: 'Comment sont réparties mes ressources en interne ?', reponse: 'Le placement sur nos hyperviseurs est décidé de notre côté et n’apparaît pas dans votre interface. Cela nous permet de rééquilibrer la charge sans vous impliquer. Sur l’offre Cloud Souverain, ce placement est contractuellement limité aux socles open source.' },
      { question: 'Que se passe-t-il si je dépasse mon quota ?', reponse: 'La création de nouvelles ressources est refusée avec un message explicite, et une alerte est envoyée. Rien n’est arrêté ni supprimé. Vous étendez le quota quand vous le décidez.' },
    ],
  },
  {
    slug: 'machines-virtuelles',
    nom: 'Machines virtuelles',
    surtitre: 'Calcul & réseau',
    accroche: 'Linux et Windows, du gabarit standard au sur-mesure.',
    resume:
      'Des machines virtuelles créées en quelques minutes depuis notre bibliothèque d’images ou depuis vos propres images, avec accès console, snapshots, redimensionnement et plan de sauvegarde applicable en un clic.',
    puces: [
      'Création unitaire ou par lot, gabarit identique ou machines différenciées',
      'Console KVM intégrée, sans client lourd à installer',
      'Matériel virtuel modifiable : contrôleurs, cartes réseau, Secure Boot, vTPM',
    ],
    paliers: [
      { nom: 'c1.small', specs: '2 vCPU · 8 Go · 40 Go SSD', prix: 4200, unite: '/mois' },
      { nom: 'c2.medium', specs: '4 vCPU · 8 Go · 120 Go SSD', prix: 7800, unite: '/mois' },
      { nom: 'c2.large', specs: '8 vCPU · 16 Go · 200 Go NVMe', prix: 15600, unite: '/mois', recommande: true },
      { nom: 'r2.large', specs: '8 vCPU · 32 Go · 500 Go NVMe', prix: 24800, unite: '/mois' },
      { nom: 'g2.medium', specs: '4 vCPU · 16 Go · vGPU 8 Go', prix: 62000, unite: '/mois' },
    ],
    caracteristiques: [
      {
        theme: 'Images',
        items: [
          { libelle: 'Bibliothèque Synelia', valeur: 'Ubuntu 24.04, Debian 12, Rocky 9, Windows Server 2022' },
          { libelle: 'Images privées', valeur: 'Import qcow2, vmdk, vhdx' },
          { libelle: 'Images capturées', valeur: 'Depuis n’importe quelle machine existante' },
          { libelle: 'Durcissement', valeur: 'CIS niveau 1 appliqué sur les images Linux' },
        ],
      },
      {
        theme: 'Configuration',
        items: [
          { libelle: 'cloud-init / user-data', valeur: 'Éditeur intégré, validation de syntaxe' },
          { libelle: 'Clés SSH', valeur: 'Trousseau de l’organisation, injection à la création' },
          { libelle: 'Anti-affinité', valeur: 'Groupes garantissant la séparation physique' },
          { libelle: 'Marche/arrêt planifié', valeur: 'Calendrier hebdomadaire, économie sur les environnements de test' },
        ],
      },
      {
        theme: 'Exploitation',
        items: [
          { libelle: 'Snapshots', valeur: 'À chaud, restauration ou clonage' },
          { libelle: 'Redimensionnement', valeur: 'vCPU et mémoire à chaud sur les images compatibles' },
          { libelle: 'Migration', valeur: 'À chaud entre hôtes, à froid entre sites' },
          { libelle: 'Actions groupées', valeur: 'Démarrer, arrêter, snapshot, étiqueter sur sélection multiple' },
        ],
      },
    ],
    sla: {
      dispo: '99,95 % par machine sur socle Pro',
      reponse: '30 min en gravité critique',
      resolution: '4 h en gravité critique',
      credits: 'Appliqués automatiquement au mois suivant',
    },
    architecture: {
      titre: 'Machine en production, configuration recommandée',
      couches: [
        { nom: 'Exposition', elements: ['Groupe de sécurité en refus par défaut', 'Accès SSH via VPN uniquement'] },
        { nom: 'Machine', elements: ['Secure Boot activé', 'vTPM pour le chiffrement de disque'] },
        { nom: 'Stockage', elements: ['Volume système NVMe', 'Volume de données séparé et chiffré'] },
        { nom: 'Protection', elements: ['Plan de sauvegarde par étiquette', 'Snapshot avant toute mise à jour'] },
      ],
    },
    faq: [
      { question: 'La console nécessite-t-elle un logiciel ?', reponse: 'Non. La console KVM s’ouvre dans un panneau du portail. Nous encapsulons le protocole, nous ne le réimplémentons pas.' },
      { question: 'Puis-je créer vingt machines d’un coup ?', reponse: 'Oui. L’assistant propose deux modes : un gabarit identique appliqué à N machines, ou un tableau où chaque ligne a ses propres caractéristiques.' },
      { question: 'Les licences Windows sont-elles incluses ?', reponse: 'Elles sont refacturées au vCPU, ligne distincte sur la facture. Le montant apparaît dans l’aperçu de coût avant validation.' },
    ],
  },
  {
    slug: 'kubernetes',
    nom: 'Kubernetes managé',
    surtitre: 'Calcul & réseau',
    accroche: 'Control plane opéré, pools autoscalés, modules prêts.',
    resume:
      'Un cluster Kubernetes dont nous exploitons le control plane, mettons à jour les versions et surveillons la santé. Vous gardez la main sur vos pools de workers, vos namespaces et vos déploiements.',
    puces: [
      'Control plane mono-master économique ou trois masters en haute disponibilité',
      'Pools hétérogènes : standard, mémoire, GPU, préemptible, avec autoscaling',
      'Marketplace de modules Helm préqualifiés',
    ],
    paliers: [
      { nom: 'K8S Starter', specs: '1 master · 3 workers 4 vCPU · registre 50 Go', prix: 45000, unite: '/mois' },
      { nom: 'K8S HA', specs: '3 masters · 5 workers 8 vCPU · registre 250 Go', prix: 148000, unite: '/mois', recommande: true },
      { nom: 'K8S Managé+', specs: 'HA · exploitation déléguée 24/7', prix: 265000, unite: '/mois' },
    ],
    caracteristiques: [
      {
        theme: 'Cluster',
        items: [
          { libelle: 'Versions disponibles', valeur: '1.29, 1.30, 1.31 — trois versions maintenues' },
          { libelle: 'Mise à jour', valeur: 'Progressive, nœud par nœud, avec drainage' },
          { libelle: 'kubeconfig', valeur: 'Téléchargeable, portée par rôle Synelia' },
          { libelle: 'etcd', valeur: 'Sauvegardé toutes les heures, restauration ponctuelle' },
        ],
      },
      {
        theme: 'Pools de workers',
        items: [
          { libelle: 'Autoscaling', valeur: 'Min/max par pool, réaction en moins de 90 s' },
          { libelle: 'Étiquettes et taints', valeur: 'Configurables par pool' },
          { libelle: 'Préemptible', valeur: '−60 % sur le prix, préavis de 30 s' },
          { libelle: 'GPU / vGPU', valeur: 'Pools dédiés, partage temporel disponible' },
        ],
      },
      {
        theme: 'Modules',
        items: [
          { libelle: 'Réseau et exposition', valeur: 'Ingress NGINX, cert-manager, External-DNS' },
          { libelle: 'Livraison continue', valeur: 'Argo CD, Helm' },
          { libelle: 'Stockage', valeur: 'Rook/Ceph, CSI bloc et objet' },
          { libelle: 'Protection', valeur: 'Velero pour la sauvegarde de cluster' },
          { libelle: 'Observabilité', valeur: 'Traçage OpenTelemetry, export vers Grafana' },
        ],
      },
      {
        theme: 'Registre d’images',
        items: [
          { libelle: 'Dépôts', valeur: 'Illimités dans le quota de stockage' },
          { libelle: 'Scan de vulnérabilités', valeur: 'À chaque poussée, résultats hiérarchisés' },
          { libelle: 'Rétention', valeur: 'Règles de purge par âge et par nombre d’étiquettes' },
        ],
      },
    ],
    sla: {
      dispo: '99,9 % (Starter) à 99,99 % (Managé+)',
      reponse: '30 min en gravité critique',
      resolution: '4 h en gravité critique',
      credits: 'Appliqués automatiquement',
    },
    architecture: {
      titre: 'Cluster HA de production',
      couches: [
        { nom: 'Exposition', elements: ['Load balancer L7 + WAF', 'Ingress NGINX, cert-manager'] },
        { nom: 'Control plane', elements: ['3 masters répartis sur 3 hôtes', 'etcd sauvegardé à l’heure'] },
        { nom: 'Workers', elements: ['Pool général autoscalé 3→9', 'Pool mémoire pour les caches', 'Pool préemptible pour les batchs'] },
        { nom: 'Données & protection', elements: ['Rook/Ceph pour le stockage persistant', 'Velero vers bucket immuable'] },
      ],
    },
    faq: [
      { question: 'Puis-je utiliser mes propres manifestes et Helm charts ?', reponse: 'Oui, sans restriction. Nous exploitons le cluster, nous ne dictons pas ce que vous y déployez.' },
      { question: 'Que couvre exactement l’offre Managé+ ?', reponse: 'L’exploitation quotidienne : réponse aux incidents 24/7, pilotage des montées de version, revue de sécurité mensuelle. Vos développeurs gardent l’accès complet à l’API Kubernetes.' },
      { question: 'Les nœuds préemptibles sont-ils utilisables en production ?', reponse: 'Pour des charges tolérantes à l’interruption — traitements par lots, jobs CI, workers de file — oui, avec un préavis de 30 secondes. Pas pour des services synchrones.' },
    ],
  },
  {
    slug: 'pra',
    nom: 'PRA / DRaaS',
    surtitre: 'Stockage & protection',
    accroche: 'Votre plan de reprise, testé et prouvé.',
    resume:
      'Un plan de reprise complet : réplication vers le second site, ordre de redémarrage avec dépendances, adressage de repli, et surtout des exercices trimestriels qui produisent un temps de reprise réellement constaté.',
    puces: [
      'RPO et RTO affichés en cible et en constaté, côte à côte',
      'Bascule de test en réseau isolé, sans impact sur la production',
      'Rapport d’exercice téléchargeable, opposable à un auditeur',
    ],
    paliers: [
      { nom: 'PRA Essentiel', specs: 'Réplication planifiée · RPO 60 min · RTO 8 h', prix: 96000, unite: '/mois' },
      { nom: 'PRA Business', specs: 'Réplication continue · RPO 15 min · RTO 4 h', prix: 184000, unite: '/mois', recommande: true },
      { nom: 'PRA Critique', specs: 'Réplication continue · RPO 5 min · RTO 1 h', prix: null, surDevis: true, unite: '' },
    ],
    caracteristiques: [
      {
        theme: 'Réplication',
        items: [
          { libelle: 'Modes', valeur: 'Continue (journalisation) ou planifiée (snapshots)' },
          { libelle: 'Retard affiché', valeur: 'En secondes, par ressource, en temps réel' },
          { libelle: 'Portée', valeur: 'Machines, volumes, bases managées, services managés' },
        ],
      },
      {
        theme: 'Composition du plan',
        items: [
          { libelle: 'Groupes de démarrage', valeur: 'Ordonnés, avec dépendances explicites' },
          { libelle: 'Adressage de repli', valeur: 'Table de correspondance IP source → IP cible' },
          { libelle: 'Bascule DNS', valeur: 'Automatisable sur les zones que nous hébergeons' },
        ],
      },
      {
        theme: 'Exercices',
        items: [
          { libelle: 'Bascule de test', valeur: 'Réseau isolé, production intacte, à volonté' },
          { libelle: 'Bascule réelle', valeur: 'Double confirmation, retour arrière disponible' },
          { libelle: 'Fréquence recommandée', valeur: 'Trimestrielle, incluse dans le palier Business' },
          { libelle: 'Rapport', valeur: 'Durée, RTO constaté, incidents relevés, plan d’action' },
        ],
      },
    ],
    sla: {
      dispo: '99,95 % sur la chaîne de réplication',
      reponse: '15 min en cas de sinistre déclaré',
      resolution: 'RTO contractuel du palier souscrit',
      credits: 'Crédits majorés en cas de dépassement du RTO engagé',
    },
    architecture: {
      titre: 'Bascule Abidjan → Grand-Bassam',
      couches: [
        { nom: 'Groupe 1 — Socle', elements: ['Annuaire', 'DNS interne', 'Passerelle VPN'] },
        { nom: 'Groupe 2 — Données', elements: ['Base PostgreSQL répliquée', 'Volumes de données'] },
        { nom: 'Groupe 3 — Applications', elements: ['Machines web', 'Cache'] },
        { nom: 'Groupe 4 — Exposition', elements: ['Load balancer de repli', 'IP publique de repli', 'Bascule DNS'] },
      ],
    },
    faq: [
      { question: 'Un exercice de test perturbe-t-il la production ?', reponse: 'Non. La bascule de test démarre les ressources répliquées dans un réseau isolé, sans conflit d’adressage et sans toucher au DNS public. C’est précisément ce qui permet de l’exercer souvent.' },
      { question: 'Que vaut un RTO annoncé mais jamais mesuré ?', reponse: 'Rien, et c’est notre position. Nous affichons systématiquement cible et constaté côte à côte. Si l’écart se creuse, c’est visible avant le sinistre, pas pendant.' },
      { question: 'Le PRA couvre-t-il les services managés du marketplace ?', reponse: 'Oui. Une instance Drive ou une messagerie entre dans un groupe de démarrage comme n’importe quelle autre ressource.' },
    ],
  },
  {
    slug: 'cloud-backup',
    nom: 'Cloud Backup',
    surtitre: 'Stockage & protection',
    accroche: 'Sauvegarde immuable, restauration au fichier près.',
    resume:
      'Des plans de sauvegarde réutilisables applicables par étiquette, par Espace Cloud ou par ressource, avec immuabilité, copie hors site, et un assistant de restauration qui descend jusqu’au fichier ou à la boîte aux lettres.',
    puces: [
      'Immuabilité réelle : un point de restauration sous rétention ne peut pas être supprimé',
      'Conformité 3-2-1 matérialisée par trois pastilles, ressource par ressource',
      'Tests de restauration automatisés, avec résultat daté',
    ],
    paliers: [
      { nom: 'Standard', specs: 'Quotidien · rétention 14 j · local', prix: 2800, unite: '/To/mois' },
      { nom: 'Immuable', specs: 'Quotidien · rétention 35 j · copie hors site', prix: 4600, unite: '/To/mois', recommande: true },
      { nom: 'Archivage long', specs: 'Hebdomadaire · rétention 10 ans · WORM', prix: 1200, unite: '/To/mois' },
    ],
    caracteristiques: [
      {
        theme: 'Plans',
        items: [
          { libelle: 'Portée', valeur: 'Par étiquette, par Espace Cloud, par ressource, par service managé' },
          { libelle: 'Fréquence', valeur: 'Horaire, quotidienne, hebdomadaire, ou journalisation continue' },
          { libelle: 'Mode', valeur: 'Incrémentale avec complète hebdomadaire, ou complète' },
          { libelle: 'Chiffrement', valeur: 'Clés gérées par Synelia, ou vos propres clés (BYOK)' },
        ],
      },
      {
        theme: 'Restauration',
        items: [
          { libelle: 'Granularité', valeur: 'Machine, volume, fichier, base, boîte aux lettres, dossier de service' },
          { libelle: 'Instant précis', valeur: 'Curseur PITR sur les bases managées' },
          { libelle: 'Destination', valeur: 'Même emplacement, autre espace, autre site, téléchargement local' },
          { libelle: 'Durée estimée', valeur: 'Affichée avant validation' },
        ],
      },
      {
        theme: 'Conformité',
        items: [
          { libelle: 'Règle 3-2-1', valeur: 'Trois copies, deux supports, une hors site — état par ressource' },
          { libelle: 'RPO constaté', valeur: 'Calculé en continu, comparé à la cible' },
          { libelle: 'Tests automatisés', valeur: 'Échantillon mensuel restauré et vérifié' },
          { libelle: 'Rapport', valeur: 'Exportable en un clic pour un auditeur' },
        ],
      },
    ],
    sla: {
      dispo: '99,99 % sur le dépôt de sauvegarde',
      reponse: '30 min pour une demande de restauration critique',
      resolution: 'Selon le volume, estimation affichée avant lancement',
      credits: 'Crédits en cas d’échec de restauration imputable à Synelia',
    },
    architecture: {
      titre: 'Chaîne de protection 3-2-1',
      couches: [
        { nom: 'Copie 1 — production', elements: ['Volume NVMe chiffré, site Abidjan'] },
        { nom: 'Copie 2 — locale', elements: ['Bucket S3 chaud, site Abidjan, versioning actif'] },
        { nom: 'Copie 3 — hors site immuable', elements: ['Bucket S3 froid, site Grand-Bassam, verrouillage WORM 35 j'] },
      ],
    },
    faq: [
      { question: 'Qu’est-ce que l’immuabilité change en cas de rançongiciel ?', reponse: 'Tout. Un point de restauration sous rétention WORM ne peut être supprimé par personne — ni par un attaquant ayant obtenu vos droits, ni par nous. C’est la seule protection qui résiste à une compromission d’administrateur.' },
      { question: 'Puis-je restaurer un seul e-mail ?', reponse: 'Oui, si la sauvegarde couvre une instance Email Pro. L’assistant descend jusqu’au message.' },
      { question: 'Les tests de restauration sont-ils facturés ?', reponse: 'Non. Un test mensuel sur échantillon est inclus dans le plan Immuable. Une restauration de test à votre initiative consomme du calcul temporaire, affiché avant lancement.' },
    ],
  },
  {
    slug: 'stockage-objet',
    nom: 'Stockage objet S3',
    surtitre: 'Stockage & protection',
    accroche: 'Compatible S3, versioning, verrouillage WORM.',
    resume:
      'Un stockage objet compatible avec l’API S3, décliné en classe chaude et froide, avec versioning, cycle de vie, réplication inter-site et verrouillage d’objet présenté pour ce qu’il est : une protection anti-rançongiciel.',
    puces: [
      'Compatibilité S3 : vos outils existants fonctionnent sans modification',
      'Verrouillage d’objet WORM avec durée de rétention imposée',
      'Réplication vers le second site en une case à cocher',
    ],
    paliers: [
      { nom: 'Classe chaude', specs: 'Accès fréquent · 1 To de trafic sortant inclus', prix: 1500, unite: '/To/mois', recommande: true },
      { nom: 'Classe froide', specs: 'Accès rare · 200 Go de trafic sortant inclus', prix: 620, unite: '/To/mois' },
    ],
    caracteristiques: [
      {
        theme: 'Accès',
        items: [
          { libelle: 'API', valeur: 'Compatible S3 — aws-cli, rclone, MinIO Client, SDK' },
          { libelle: 'Clés d’accès', valeur: 'Portée par bucket, rotation et révocation, valeur affichée une seule fois' },
          { libelle: 'Politique', valeur: 'Privé, lecture publique, ou politique JSON' },
          { libelle: 'Journaux d’accès', valeur: 'Activables par bucket' },
        ],
      },
      {
        theme: 'Protection',
        items: [
          { libelle: 'Versioning', valeur: 'Conserve chaque version d’un objet' },
          { libelle: 'Verrouillage d’objet', valeur: 'WORM avec rétention en jours, non contournable' },
          { libelle: 'Réplication', valeur: 'Vers l’autre site, asynchrone' },
          { libelle: 'Chiffrement', valeur: 'Au repos systématique, en transit obligatoire' },
        ],
      },
      {
        theme: 'Cycle de vie',
        items: [
          { libelle: 'Transition', valeur: 'Règles chaud → froid par âge ou par préfixe' },
          { libelle: 'Expiration', valeur: 'Suppression automatique des objets et des versions anciennes' },
          { libelle: 'Nettoyage', valeur: 'Purge des téléversements multipartites incomplets' },
        ],
      },
    ],
    sla: {
      dispo: '99,9 % sur l’API, durabilité 99,999999999 %',
      reponse: '60 min en gravité critique',
      resolution: '8 h en gravité critique',
      credits: 'Appliqués automatiquement',
    },
    architecture: {
      titre: 'Bucket de sauvegarde protégé',
      couches: [
        { nom: 'Écriture', elements: ['Clé d’accès à portée d’écriture seule', 'Chiffrement en transit obligatoire'] },
        { nom: 'Conservation', elements: ['Versioning actif', 'Verrouillage WORM 35 jours'] },
        { nom: 'Résilience', elements: ['Réplication vers Grand-Bassam', 'Cycle de vie chaud → froid à 30 jours'] },
        { nom: 'Traçabilité', elements: ['Journaux d’accès activés', 'Audit des rotations de clés'] },
      ],
    },
    faq: [
      { question: 'Mes scripts AWS fonctionnent-ils tels quels ?', reponse: 'Oui, en changeant l’endpoint. La compatibilité couvre les opérations courantes sur les objets, le versioning, le cycle de vie et le verrouillage d’objet.' },
      { question: 'Le trafic sortant est-il facturé ?', reponse: 'Un quota est inclus par To stocké — 1 To en classe chaude, 200 Go en classe froide. Au-delà, le trafic sortant est facturé à 850 FCFA par Go.' },
      { question: 'Puis-je désactiver un verrouillage WORM par erreur ?', reponse: 'Non, c’est le principe. Une fois la rétention posée sur un objet, ni vous ni nous ne pouvons la raccourcir. Ce n’est pas une limitation, c’est la garantie.' },
    ],
  },
  {
    slug: 'load-balancer',
    nom: 'Load balancer',
    surtitre: 'Calcul & réseau',
    accroche: 'L4 et L7, WAF OWASP, health checks.',
    resume:
      'Répartition de charge en couche 4 ou 7, publique ou interne, avec terminaison TLS automatique, règles de routage L7, pare-feu applicatif OWASP et limitation de débit.',
    puces: [
      'Certificat Let’s Encrypt automatique ou téléversement du vôtre',
      'Mode drain pour retirer une cible sans couper les connexions en cours',
      'Latences P50, P95, P99 et taux d’erreur visibles en continu',
    ],
    paliers: [
      { nom: 'LB Standard', specs: 'L4 ou L7 · 5 000 req/s · 10 backends', prix: 18000, unite: '/mois', recommande: true },
      { nom: 'LB Performance', specs: 'L7 · 50 000 req/s · WAF · 50 backends', prix: 52000, unite: '/mois' },
    ],
    caracteristiques: [
      {
        theme: 'Écouteurs et TLS',
        items: [
          { libelle: 'Protocoles', valeur: 'TCP, UDP, HTTP, HTTPS' },
          { libelle: 'Certificats', valeur: 'Let’s Encrypt automatique ou téléversement' },
          { libelle: 'Version TLS minimale', valeur: 'Configurable, TLS 1.2 par défaut' },
          { libelle: 'Redirection HTTP→HTTPS', valeur: 'Case à cocher' },
        ],
      },
      {
        theme: 'Répartition',
        items: [
          { libelle: 'Algorithmes', valeur: 'Round-robin, moindre connexion, hash IP source, pondéré' },
          { libelle: 'Sessions persistantes', valeur: 'Par cookie ou par IP' },
          { libelle: 'Cibles', valeur: 'Machines virtuelles ou workloads Kubernetes' },
          { libelle: 'Mode drain', valeur: 'Retire une cible en laissant finir les connexions' },
        ],
      },
      {
        theme: 'Règles L7',
        items: [
          { libelle: 'Routage', valeur: 'Par hôte, par chemin, par en-tête' },
          { libelle: 'Réécriture d’URL', valeur: 'Expressions de substitution' },
          { libelle: 'Pages d’erreur', valeur: 'Personnalisables par code' },
        ],
      },
      {
        theme: 'Protection',
        items: [
          { libelle: 'WAF', valeur: 'Jeu de règles OWASP CRS 4.3, exceptions par URL' },
          { libelle: 'Limitation de débit', valeur: 'Par IP, par minute' },
          { libelle: 'Journaux d’accès', valeur: 'Consultables et exportables' },
        ],
      },
    ],
    sla: {
      dispo: '99,99 %',
      reponse: '30 min en gravité critique',
      resolution: '3 h en gravité critique',
      credits: 'Appliqués automatiquement',
    },
    architecture: {
      titre: 'Exposition d’une API en production',
      couches: [
        { nom: 'Entrée', elements: ['IP publique + anti-DDoS volumétrique'] },
        { nom: 'Load balancer L7', elements: ['TLS 1.2 minimum, certificat automatique', 'WAF OWASP CRS 4.3', 'Limitation 1 200 req/min par IP'] },
        { nom: 'Pool', elements: ['2 machines web pondérées à 50/50', 'Health check HTTPS /healthz toutes les 10 s'] },
      ],
    },
    faq: [
      { question: 'Le WAF peut-il bloquer du trafic légitime ?', reponse: 'C’est le risque de tout WAF. Vous démarrez en mode détection, examinez les journaux, posez vos exceptions par URL, puis passez en blocage. Nous accompagnons ce réglage.' },
      { question: 'Puis-je mélanger machines et pods dans un même pool ?', reponse: 'Oui. Un pool accepte des machines virtuelles et des workloads Kubernetes simultanément — utile pendant une migration.' },
      { question: 'Que se passe-t-il si toutes les cibles sont en échec ?', reponse: 'Le load balancer sert votre page d’erreur personnalisée et déclenche une alerte. Il ne renvoie pas de réponse vide.' },
    ],
  },
  {
    slug: 'wordpress',
    nom: 'WordPress managé',
    surtitre: 'Web',
    accroche: 'Votre site opéré, mis à jour et protégé.',
    resume:
      'Un hébergement WordPress dont nous gérons le socle : cache, pare-feu applicatif, mises à jour du cœur et des extensions, préproduction, sauvegardes. Le contenu s’édite dans WordPress, jamais dans notre portail.',
    puces: [
      'Mises à jour automatiques ou soumises à votre validation, au choix',
      'Préproduction clonable, comparable, publiable en un clic',
      'WAF OWASP, anti-force brute et scan de malware quotidien',
    ],
    paliers: [
      { nom: 'Essentiel', specs: '1 site · 20 Go · 50 k visites/mois', prix: 14000, unite: '/mois' },
      { nom: 'Business', specs: '5 sites · 100 Go · 500 k visites/mois', prix: 38000, unite: '/mois', recommande: true },
      { nom: 'Entreprise', specs: '20 sites · 500 Go · trafic illimité', prix: 96000, unite: '/mois' },
    ],
    caracteristiques: [
      {
        theme: 'Performance',
        items: [
          { libelle: 'Cache objet', valeur: 'Redis dédié' },
          { libelle: 'Cache page', valeur: 'Varnish avec purge sélective' },
          { libelle: 'CDN', valeur: 'Inclus à partir du palier Business' },
          { libelle: 'Images', valeur: 'Conversion WebP et redimensionnement automatiques' },
        ],
      },
      {
        theme: 'Sécurité',
        items: [
          { libelle: 'WAF', valeur: 'Règles OWASP adaptées à WordPress' },
          { libelle: 'Anti-force brute', valeur: 'Sur wp-login et XML-RPC' },
          { libelle: 'Scan de malware', valeur: 'Quotidien, avec mise en quarantaine' },
          { libelle: 'Verrouillage des fichiers', valeur: 'Cœur en lecture seule hors fenêtre de mise à jour' },
        ],
      },
      {
        theme: 'Exploitation',
        items: [
          { libelle: 'Préproduction', valeur: 'Clone de la production, comparaison, publication, retour arrière' },
          { libelle: 'Versions', valeur: 'Cœur, thèmes, extensions — état et mise à jour pilotée' },
          { libelle: 'Sauvegardes', valeur: 'Quotidiennes, plus une avant chaque mise à jour' },
          { libelle: 'Accès fichiers', valeur: 'SFTP et clés SSH' },
        ],
      },
    ],
    sla: {
      dispo: '99,9 %',
      reponse: '60 min en gravité critique',
      resolution: '8 h en gravité critique',
      credits: 'Appliqués automatiquement',
    },
    architecture: {
      titre: 'Site WordPress en production',
      couches: [
        { nom: 'Exposition', elements: ['CDN', 'WAF OWASP', 'Certificat automatique'] },
        { nom: 'Service', elements: ['Varnish (cache page)', 'PHP 8.3 en pool dédié', 'Redis (cache objet)'] },
        { nom: 'Données', elements: ['MariaDB 11.4', 'Volume médias SSD'] },
        { nom: 'Cycle de vie', elements: ['Préproduction isolée', 'Sauvegarde avant mise à jour'] },
      ],
    },
    faq: [
      { question: 'Puis-je installer les extensions que je veux ?', reponse: 'Oui. Nous n’imposons pas de liste blanche. Nous signalons en revanche les extensions connues pour dégrader les performances ou présenter des vulnérabilités ouvertes.' },
      { question: 'Qui applique les mises à jour ?', reponse: 'Vous choisissez : automatique après sauvegarde, ou soumis à votre validation avec un rapport de ce qui va changer. Dans les deux cas un retour arrière est disponible.' },
      { question: 'Le portail contient-il un éditeur de contenu ?', reponse: 'Non, délibérément. Vous éditez dans WordPress, dont l’écosystème est incomparablement plus riche que ce que nous pourrions reconstruire.' },
    ],
  },
]

// ─── Datacenters (§2.7) ───────────────────────────────────────────────

export const DATACENTERS = [
  {
    code: 'ABJ',
    nom: 'Synertech Vallon',
    ville: 'Cocody, Abidjan',
    pays: "Côte d'Ivoire",
    ouverture: '2019',
    alimentation: 'Double arrivée CIE · 2 groupes électrogènes 1 250 kVA en N+1 · onduleurs redondants 2N · autonomie carburant 72 h',
    refroidissement: 'Free-cooling indirect avec appoint eau glacée · redondance N+1 · confinement des allées froides',
    connectivite: '4 opérateurs · 2 chemins de fibre distincts · 40 Gbit/s de capacité de sortie · peering IXP local',
    securite: 'Contrôle d’accès biométrique à 3 facteurs · vidéosurveillance 90 jours · gardiennage 24/7 · détection très haute sensibilité',
    certifications: ['Tier III (conception)', 'Démarche ISO 27001', 'PCI-DSS (zone dédiée)'],
    surface: '640 m² de salle blanche',
    puissance: '1,2 MW installés',
    services: ['Espace Cloud', 'Kubernetes', 'Stockage bloc et objet', 'Services managés', 'Web'],
  },
  {
    code: 'GBM',
    nom: 'VITIB — Village des Technologies',
    ville: 'Grand-Bassam',
    pays: "Côte d'Ivoire",
    ouverture: '2022',
    alimentation: 'Double arrivée dédiée zone franche · 2 groupes 1 000 kVA en N+1 · onduleurs 2N · autonomie carburant 48 h',
    refroidissement: 'Eau glacée en boucle redondante N+1 · confinement des allées chaudes',
    connectivite: '3 opérateurs · 2 chemins distincts · 20 Gbit/s de capacité de sortie · liaison dédiée vers Abidjan (4–6 ms)',
    securite: 'Contrôle d’accès biométrique · vidéosurveillance 90 jours · gardiennage 24/7 · zone franche technologique',
    certifications: ['Tier III (conception)', 'Démarche ISO 27001'],
    surface: '420 m² de salle blanche',
    puissance: '800 kW installés',
    services: ['Espace Cloud', 'Site de repli PRA', 'Stockage objet froid et immuable', 'Services managés'],
  },
]

// ─── Partenaires / revendeurs (§2.7) ──────────────────────────────────

export const MODELE_PARTENAIRE = [
  {
    niveau: 'Revendeur',
    description: 'Vous vendez nos offres sous votre marque commerciale, nous facturons votre client ou vous, à votre choix.',
    remise: '25 à 35 % sur le tarif public',
    engagement: 'Aucun volume minimum la première année',
    inclus: ['Grille d’achat dédiée', 'Support niveau 2 dédié', 'Formation technique et commerciale', 'Environnement de démonstration'],
  },
  {
    niveau: 'Marque blanche',
    description: 'Le portail porte votre identité : logo, palette, domaine, modèles d’e-mails, en-tête de factures. Vos clients ne voient jamais Synelia.',
    remise: '35 à 45 % sur le tarif public',
    engagement: 'Volume annuel négocié',
    inclus: ['Thématisation complète du portail', 'Tarification à deux étages', 'Cloisonnement strict de vos clients', 'API et webhooks vers votre SI'],
  },
  {
    niveau: 'Opérateur',
    description: 'Intégration au niveau de votre catalogue et de votre facturation. Vous restez l’unique interlocuteur commercial et contractuel.',
    remise: 'Sur négociation',
    engagement: 'Contrat cadre pluriannuel',
    inclus: ['Revshare mensuel calculé automatiquement', 'Capacité réservée', 'Feuille de route produit partagée', 'Marque blanche incluse'],
  },
]

// ─── Ressources & documentation (§2.7) ────────────────────────────────

export const RESSOURCES = [
  { type: 'Livre blanc', titre: 'Sortir de VMware sans casser la production', duree: '24 pages', theme: 'Migration', extrait: 'Inventaire, lots, fenêtres, retour arrière : la méthode que nous appliquons chez nos clients depuis 2024.' },
  { type: 'Livre blanc', titre: 'Souveraineté numérique en Afrique de l’Ouest : trois niveaux, une trajectoire', duree: '18 pages', theme: 'Souveraineté', extrait: 'Données, opérations, logiciel : ce que chaque niveau exige réellement, et où se situent les acteurs du marché.' },
  { type: 'Guide', titre: 'Construire un PRA opposable à un auditeur', duree: '32 pages', theme: 'PRA', extrait: 'Du RPO théorique au RTO constaté : comment produire des preuves plutôt que des promesses.' },
  { type: 'Guide', titre: 'Protéger ses sauvegardes contre les rançongiciels', duree: '16 pages', theme: 'Protection', extrait: 'Pourquoi la règle 3-2-1 ne suffit plus, et ce que l’immuabilité change concrètement.' },
  { type: 'Webinaire', titre: 'Migrer 400 boîtes Microsoft 365 vers une messagerie souveraine', duree: '52 min', theme: 'Migration', extrait: 'Retour d’expérience détaillé, avec les chiffres et les difficultés rencontrées.' },
  { type: 'Webinaire', titre: 'Déployer une application Node.js en dix minutes', duree: '28 min', theme: 'Applications', extrait: 'Du dépôt Git au domaine en production, avec analyse DevSecOps.' },
  { type: 'Étude', titre: 'Coût réel d’un cloud public sur trois ans pour une ESN ivoirienne', duree: '12 pages', theme: 'Économie', extrait: 'Comparaison chiffrée, hypothèses affichées, trafic sortant inclus.' },
  { type: 'Modèle', titre: 'Trame de cahier des charges cloud pour appel d’offres', duree: 'Document éditable', theme: 'Achat', extrait: 'Les exigences à formuler pour comparer des offres réellement comparables.' },
]

export const SECTIONS_DOCS = [
  {
    titre: 'Prise en main',
    articles: [
      'Créer votre organisation et inviter votre équipe',
      'Comprendre les Espaces Cloud, projets et ressources',
      'Choisir entre Abidjan et Grand-Bassam',
      'Lire votre première facture',
    ],
  },
  {
    titre: 'Infrastructure',
    articles: [
      'Créer et dimensionner un Espace Cloud',
      'Créer des machines virtuelles par lot',
      'Configurer un réseau privé et un VPN site-à-site',
      'Mettre en place un load balancer L7 avec WAF',
      'Déployer un cluster Kubernetes HA',
    ],
  },
  {
    titre: 'Protection',
    articles: [
      'Concevoir un plan de sauvegarde immuable',
      'Restaurer un fichier, une base, une boîte aux lettres',
      'Lire le rapport de conformité 3-2-1',
      'Préparer et exécuter un exercice de bascule PRA',
    ],
  },
  {
    titre: 'Applications',
    articles: [
      'Connecter un dépôt GitHub ou GitLab',
      'Comprendre l’analyse automatique de votre dépôt',
      'Composer une architecture dans le canvas',
      'Traiter les constats DevSecOps d’un déploiement',
      'Configurer un déploiement canari avec rollback automatique',
    ],
  },
  {
    titre: 'Services managés',
    articles: [
      'Souscrire un service en six étapes',
      'Rattacher votre propre domaine à un service',
      'Mapper vos groupes d’annuaire vers les rôles applicatifs',
      'Attribuer et retirer des sièges',
      'Générer un export de réversibilité',
    ],
  },
  {
    titre: 'API & automatisation',
    articles: [
      'Authentification par clé d’API',
      'Provisionner un Espace Cloud par API',
      'Webhooks d’événements',
      'Fournisseur Terraform Synelia Cloud',
    ],
  },
]

// ─── Simulateur (§2.6) ────────────────────────────────────────────────

export const TARIFS_UNITAIRES = {
  vcpu: 1400,
  ramGo: 480,
  stockageGoSsd: 3.2,
  stockageGoNvme: 5.4,
  ipPublique: 3500,
  antiDdos: 2000,
  loadBalancer: 18000,
  sauvegardeGo: 4.6,
  objetGoChaud: 1.5,
  objetGoFroid: 0.62,
  k8sControlPlaneHa: 62000,
  k8sControlPlaneSingle: 18000,
  siegeDrive: 3400,
  siegeMail: 2900,
  siegeVisio: 1600,
  siegeCoffre: 1100,
  siegeErp: 9400,
  webMutualise: 6500,
  webWordpress: 38000,
  webPrestashop: 52000,
  majorationDedie: 1.2,
  remiseAnnuelle: 0.15,
}

/** Hypothèses affichées du calculateur comparatif (§2.6). */
export const HYPOTHESES_COMPARATEUR = [
  'Les prix Synelia retenus sont les tarifs publics mensuels, hors remise annuelle et hors remise de volume.',
  'Le trafic sortant est estimé à 15 % du volume stocké par mois — l’écart réel dépend de votre usage.',
  'Pour VMware, nous comparons le coût de licence VCF par cœur annoncé publiquement plus le coût du matériel amorti sur cinq ans.',
  'Pour AWS, nous prenons les tarifs à la demande de la région eu-west-3 (Paris), sans instances réservées ni Savings Plans.',
  'Pour Microsoft 365, nous comparons le plan Business Standard par utilisateur et par mois, au tarif public.',
  'Les coûts de migration ne sont pas inclus dans la comparaison — ils font l’objet d’un devis distinct.',
  'La TVA de 18 % s’applique dans les deux colonnes et n’influe donc pas sur l’écart relatif.',
]

export const REFERENCES_COMPARATEUR = [
  { id: 'vmware', nom: 'VMware / Broadcom (VCF)', unite: 'cœurs sous licence', prixUnitaireIndicatif: 235000, note: 'Licence VCF par cœur, minimum 16 cœurs par hôte, plus matériel amorti.' },
  { id: 'aws', nom: 'AWS (à la demande)', unite: 'vCPU équivalents', prixUnitaireIndicatif: 24000, note: 'Instances m6i à la demande, région Paris, plus trafic sortant.' },
  { id: 'm365', nom: 'Microsoft 365 Business Standard', unite: 'utilisateurs', prixUnitaireIndicatif: 8600, note: 'Comparé au couple Drive Pro + Email Pro + Visio.' },
  { id: 'azure', nom: 'Azure (paiement à l’usage)', unite: 'vCPU équivalents', prixUnitaireIndicatif: 26000, note: 'Séries D à la demande, région France Centre.' },
]

// ─── Formulaires entreprises (§2.7) ───────────────────────────────────

export const OFFRES_ENTREPRISE = [
  {
    titre: 'Datacenter virtuel dédié',
    texte: 'Capacité réservée sur hôtes dédiés, plage réseau étendue, engagement pluriannuel avec révision annuelle.',
    points: ['Hôtes dédiés ou capacité réservée', 'SLA 99,99 % avec crédits majorés', 'Revue d’architecture trimestrielle'],
  },
  {
    titre: 'Plan de reprise et continuité',
    texte: 'Conception du plan, réplication inter-site, exercices trimestriels et rapports opposables à un auditeur.',
    points: ['Atelier de définition RPO/RTO', 'Exercices de bascule planifiés', 'Rapport d’exercice signé'],
  },
  {
    titre: 'Migration et sortie de VMware',
    texte: 'Inventaire, lotissement, fenêtres de migration, retour arrière garanti à chaque lot.',
    points: ['Inventaire outillé de votre parc', 'Migration par lots avec rollback', 'Trajectoire de sortie contractualisée'],
  },
  {
    titre: 'Infogérance',
    texte: 'Exploitation déléguée de tout ou partie de votre plateforme, avec astreinte nominative.',
    points: ['NOC 24/7 basé à Abidjan', 'Astreinte nominative', 'Comité d’exploitation mensuel'],
  },
]

export const SECTEURS = [
  'Banque & finance',
  'Microfinance',
  'Assurance',
  'Télécommunications',
  'Secteur public',
  'Santé',
  'Industrie',
  'Agro-industrie',
  'Distribution & e-commerce',
  'Transport & logistique',
  'Éducation',
  'ESN & éditeurs',
  'ONG & organisations internationales',
  'Autre',
]

export const TAILLES_ORG = [
  '1 à 10 collaborateurs',
  '11 à 50 collaborateurs',
  '51 à 200 collaborateurs',
  '201 à 1 000 collaborateurs',
  'Plus de 1 000 collaborateurs',
]

export const PAYS = [
  "Côte d'Ivoire",
  'Sénégal',
  'Bénin',
  'Burkina Faso',
  'Mali',
  'Togo',
  'Niger',
  'Guinée',
  'Cameroun',
  'Ghana',
  'France',
  'Autre',
]

// ─── Pages légales (§2.7) ─────────────────────────────────────────────

export const PAGES_LEGALES = [
  {
    slug: 'mentions-legales',
    titre: 'Mentions légales',
    sections: [
      { titre: 'Éditeur du service', texte: 'Synelia Group Afrique — société de droit ivoirien, siège social à Cocody, Abidjan, Côte d’Ivoire. Registre du commerce : CI-ABJ-2012-B-00000 (donnée de démonstration). Directeur de la publication : le représentant légal.' },
      { titre: 'Hébergement', texte: 'Les services Synelia Cloud sont hébergés dans les datacenters de Synertech Vallon (Cocody, Abidjan) et du parc VITIB (Grand-Bassam), tous deux situés en Côte d’Ivoire.' },
      { titre: 'Propriété intellectuelle', texte: 'Les marques, logos et contenus de ce site sont la propriété de Synelia Group Afrique. Les solutions open source proposées au marketplace restent la propriété de leurs auteurs respectifs et sont distribuées sous leurs licences d’origine.' },
      { titre: 'Nature de cette instance', texte: 'Cette instance est une maquette de démonstration. Les organisations, utilisateurs, ressources, factures et incidents présentés sont entièrement fictifs.' },
    ],
  },
  {
    slug: 'cgv',
    titre: 'Conditions générales de vente',
    sections: [
      { titre: 'Objet', texte: 'Les présentes conditions régissent la fourniture des services d’infrastructure, de plateforme et de logiciels opérés décrits au catalogue Synelia Cloud.' },
      { titre: 'Durée et résiliation', texte: 'Les souscriptions mensuelles sont sans engagement et résiliables à tout moment avec effet à la fin du mois en cours. Les souscriptions annuelles bénéficient d’une remise de 15 % et sont résiliables à l’échéance avec un préavis de trente jours.' },
      { titre: 'Prix et facturation', texte: 'Les prix sont exprimés en francs CFA (XOF), hors taxes. La TVA au taux en vigueur de 18 % s’ajoute au montant hors taxes. La facturation est mensuelle, à terme échu, avec application d’un prorata journalier pour toute ressource créée ou supprimée en cours de mois.' },
      { titre: 'Moyens de paiement', texte: 'Carte bancaire, virement, Orange Money, MTN MoMo, Wave, ou porte-monnaie prépayé. Les échéances de paiement sont fixées à trente jours date de facture.' },
      { titre: 'Niveaux de service', texte: 'Les engagements de disponibilité et de délai figurent à l’annexe SLA de chaque offre. Les manquements constatés donnent lieu à des crédits calculés et appliqués automatiquement, sans réclamation du client.' },
      { titre: 'Réversibilité', texte: 'À la résiliation, le client dispose de trente jours pour récupérer ses données dans les formats documentés au catalogue. Synelia fournit l’assistance nécessaire à l’export et procède à l’effacement sécurisé après confirmation écrite.' },
    ],
  },
  {
    slug: 'confidentialite',
    titre: 'Politique de confidentialité',
    sections: [
      { titre: 'Données traitées', texte: 'Synelia traite les données d’identification des utilisateurs du portail, les données de facturation de l’organisation, et les métadonnées techniques nécessaires à l’exploitation. Le contenu hébergé par le client reste sous sa seule responsabilité éditoriale.' },
      { titre: 'Localisation', texte: 'Les données sont stockées exclusivement sur les sites d’Abidjan et de Grand-Bassam, en Côte d’Ivoire. Aucun transfert hors du territoire n’a lieu sans demande écrite du client.' },
      { titre: 'Accès des équipes Synelia', texte: 'Les accès de nos ingénieurs sont nominatifs, journalisés, et soumis à une élévation temporaire justifiée par un ticket. Le journal d’audit du client mentionne toute intervention.' },
      { titre: 'Conservation', texte: 'Les journaux d’audit sont conservés douze mois. Les sauvegardes suivent la rétention du plan souscrit. Les données de facturation sont conservées dix ans conformément aux obligations comptables.' },
      { titre: 'Sous-traitants', texte: 'La liste des sous-traitants techniques et leur localisation sont communiquées sur demande et mises à jour à chaque évolution.' },
    ],
  },
  {
    slug: 'sla',
    titre: 'Annexe SLA',
    sections: [
      { titre: 'Périmètre', texte: 'Le niveau de service s’applique par composant : calcul, stockage bloc, stockage objet, réseau, Kubernetes, services managés, hébergement web. Chaque composant a son propre engagement.' },
      { titre: 'Mesure', texte: 'La disponibilité est mesurée par nos sondes de supervision, avec un pas d’une minute, et publiée mensuellement dans l’espace client. Les fenêtres de maintenance annoncées au moins sept jours à l’avance sont exclues du calcul.' },
      { titre: 'Délais de réponse', texte: 'Gravité critique : première réponse sous 30 minutes, résolution visée sous 4 heures. Gravité majeure : 1 heure et 24 heures. Gravité mineure : 4 heures et 48 heures. Question : 8 heures et 72 heures.' },
      { titre: 'Crédits', texte: 'Un manquement à l’engagement de disponibilité génère un crédit proportionnel à l’écart constaté, plafonné à 30 % de la facture mensuelle du composant concerné. Le crédit est calculé et appliqué automatiquement sur la facture suivante.' },
      { titre: 'Escalade', texte: 'Trois niveaux : ingénieur de permanence, responsable d’exploitation, direction technique. Les coordonnées et les délais de bascule figurent dans l’espace client, onglet Assistance & SLA.' },
    ],
  },
]
