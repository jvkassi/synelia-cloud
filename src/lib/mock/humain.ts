/**
 * Le versant humain de la vitrine.
 *
 * Le reste du site parle capacité, disponibilité et réversibilité — et le fait
 * bien. Il ne dit jamais qui décroche à deux heures du matin, pourquoi cette
 * plateforme existe, ni ce que les clients en disent avec leurs propres mots.
 * Ces quatre jeux de données portent ces pages.
 *
 * Comme partout ailleurs dans la maquette, personnes, citations et dates sont
 * fictives. Les portraits sont des monogrammes, jamais des photographies de
 * banque d'images : un visage acheté au kilo réchauffe moins qu'un nom, un
 * poste et une phrase qui dit ce que la personne fait vraiment.
 */

// ─── L'équipe ─────────────────────────────────────────────────────────

export interface Membre {
  nom: string
  initiales: string
  role: string
  site: 'Abidjan' | 'Grand-Bassam'
  depuis: string
  /** Ce que la personne fait concrètement, pas son intitulé de poste. */
  texte: string
  langues: string[]
}

export const EQUIPE: Membre[] = [
  {
    nom: 'Aminata Koné',
    initiales: 'AK',
    role: 'Responsable de l’exploitation',
    site: 'Abidjan',
    depuis: '2019',
    texte:
      'Décide de la bascule quand un site décroche, et tient le registre des exercices de reprise. C’est elle qui signe les rapports que vous montrez à un auditeur.',
    langues: ['Français', 'Anglais', 'Baoulé'],
  },
  {
    nom: 'Yao Serge Kouassi',
    initiales: 'YK',
    role: 'Architecte infrastructure',
    site: 'Abidjan',
    depuis: '2018',
    texte:
      'Mène les ateliers de cadrage. Dimensionne, puis dit non quand la demande est surdimensionnée — un Espace Cloud trop grand se paie tous les mois.',
    langues: ['Français', 'Anglais'],
  },
  {
    nom: 'Fatou Diallo',
    initiales: 'FD',
    role: 'Ingénieure de garde · NOC',
    site: 'Abidjan',
    depuis: '2021',
    texte:
      'Une semaine d’astreinte sur quatre. Reçoit l’alerte, la qualifie, et vous appelle avant que vous ne l’ayez vue. Les nuits calmes servent à relire les seuils.',
    langues: ['Français', 'Anglais', 'Peul'],
  },
  {
    nom: 'Jean-Marc Tanoh',
    initiales: 'JT',
    role: 'Ingénieur migrations',
    site: 'Grand-Bassam',
    depuis: '2020',
    texte:
      'Reprend les parcs existants : vSphere, Hyper-V, hébergements mutualisés vieillissants. Répète chaque bascule à blanc avant la vraie.',
    langues: ['Français', 'Anglais'],
  },
  {
    nom: 'Awa Traoré',
    initiales: 'AT',
    role: 'Responsable sécurité et conformité',
    site: 'Abidjan',
    depuis: '2022',
    texte:
      'Tient la matrice des rôles et le journal d’audit. Instruit les demandes d’élévation de privilège de nos propres ingénieurs, et en refuse.',
    langues: ['Français', 'Anglais'],
  },
  {
    nom: 'Ibrahim Sangaré',
    initiales: 'IS',
    role: 'Ingénieur services managés',
    site: 'Abidjan',
    depuis: '2021',
    texte:
      'Opère les briques open source du marketplace — Nextcloud, Zimbra, Odoo. Suit les versions amont et teste les exports de réversibilité.',
    langues: ['Français', 'Anglais', 'Dioula'],
  },
  {
    nom: 'Marie-Louise Gbagbo',
    initiales: 'MG',
    role: 'Chargée de la relation client',
    site: 'Abidjan',
    depuis: '2020',
    texte:
      'Premier interlocuteur sur les tickets non critiques. Traduit une demande floue en demande instruisable, et vous dit quand la réponse prendra du temps.',
    langues: ['Français', 'Anglais'],
  },
  {
    nom: 'Kevin N’Guessan',
    initiales: 'KN',
    role: 'Ingénieur réseau',
    site: 'Grand-Bassam',
    depuis: '2019',
    texte:
      'Tient les deux chemins de fibre et le peering local. Surveille la latence inter-site comme d’autres surveillent la météo.',
    langues: ['Français', 'Anglais'],
  },
]

/** Comment l'astreinte fonctionne réellement — la question qu'on nous pose. */
export const ASTREINTE = [
  {
    titre: 'Personne ne décroche depuis un autre continent',
    texte:
      'L’ingénieur de garde est à Abidjan, sur le même fuseau que vous. Il connaît le parc et il a les droits pour agir, pas seulement pour ouvrir un ticket.',
  },
  {
    titre: 'Une semaine sur quatre, jamais deux d’affilée',
    texte:
      'Quatre ingénieurs se relaient. Une astreinte enchaînée fabrique des erreurs de jugement à trois heures du matin, et nous en avons fait l’expérience.',
  },
  {
    titre: 'L’alerte arrive avant votre appel',
    texte:
      'Les sondes déclenchent, l’ingénieur qualifie, et c’est nous qui vous appelons. Si vous nous apprenez la panne, nous avons manqué quelque chose.',
  },
  {
    titre: 'Ce que nous ne faisons pas',
    texte:
      'Nous n’externalisons pas le premier niveau à un centre d’appels payé au ticket fermé, et nous n’exploitons pas vos applications à votre place. Le socle est à nous ; ce qui tourne dessus reste à vous.',
  },
]

// ─── L'histoire ───────────────────────────────────────────────────────

export const HISTOIRE = [
  {
    annee: '2016',
    titre: 'Une intégration, pas un hébergeur',
    texte:
      'Synelia Group Afrique intègre des systèmes pour des banques et des institutions publiques ivoiriennes. L’hébergement, on l’achète ailleurs — en Europe, le plus souvent.',
  },
  {
    annee: '2017',
    titre: 'Les trois jours',
    texte:
      'Un client perd l’accès à son ERP pendant trois jours. La cause est dans un datacenter à 5 000 km, le support répond en anglais sur un autre fuseau, et nous n’avons rien d’autre à offrir que de la patience. C’est le moment déclencheur.',
  },
  {
    annee: '2019',
    titre: 'Premier site, Synertech Vallon',
    texte:
      'Ouverture de la salle de Cocody. Six baies, deux clients, un onduleur. Nous reprenons les charges que nous connaissons le mieux : les nôtres et celles de trois clients qui acceptent le risque.',
  },
  {
    annee: '2021',
    titre: 'Second site, VITIB',
    texte:
      'Grand-Bassam ouvre. Deux sites changent la nature de l’offre : la réplication devient possible, et le plan de reprise cesse d’être un document pour devenir un exercice.',
  },
  {
    annee: '2023',
    titre: 'Le marketplace, et une décision',
    texte:
      'Les clients demandent une messagerie et un Drive, pas seulement des machines. Nous choisissons d’opérer des solutions open source existantes plutôt que d’écrire les nôtres — et de ne jamais réimplémenter leur interface.',
  },
  {
    annee: '2025',
    titre: 'La sortie du propriétaire',
    texte:
      'La moitié de notre capacité tourne encore sur VMware et Hyper-V, héritée de reprises de parcs. Nous datons publiquement la trajectoire de sortie au lieu de la taire.',
  },
  {
    annee: '2026',
    titre: 'Le portail unique',
    texte:
      'Infrastructure, applications et web dans le même portail, avec la même facturation, les mêmes rôles et la même sauvegarde. Ce que vous regardez en est la maquette.',
  },
]

export const VALEURS = [
  {
    titre: 'Dire le défaut avant qu’on le trouve',
    texte:
      'La page souveraineté publie ce qui n’est pas encore atteint. La page d’état affiche le service dégradé au lieu d’une moyenne flatteuse. Un client qui découvre un problème par lui-même a déjà cessé de nous croire.',
    lien: { libelle: 'Voir notre position sur la souveraineté', href: '/souverainete' },
  },
  {
    titre: 'Prouver plutôt qu’engager',
    texte:
      'Une rétention de sauvegarde annoncée ne vaut rien sans un test qui restaure et redémarre réellement la donnée. Nous testons, nous datons, et nous remettons le rapport — y compris quand il est mauvais.',
    lien: { libelle: 'Lire la fiche Cloud Backup', href: '/offres/cloud-backup' },
  },
  {
    titre: 'Rendre le départ possible',
    texte:
      'Chaque service documente son format d’export et son délai, et nous testons ces exports. Un client qui reste parce qu’il ne peut pas partir n’est pas un client satisfait, c’est un client captif.',
    lien: { libelle: 'Lire la procédure de réversibilité', href: '/souverainete#reversibilite' },
  },
  {
    titre: 'Employer et former ici',
    texte:
      'Toute l’équipe d’exploitation vit en Côte d’Ivoire. Ce n’est pas un argument commercial : c’est la seule manière d’avoir quelqu’un qui comprend le contexte, sur le bon fuseau, avec les bons droits.',
    lien: { libelle: 'Voir nos actions locales', href: '/communaute' },
  },
]

/** Ce qui n'est pas fini — la page l'assume au lieu de conclure en fanfare. */
export const CHANTIERS_OUVERTS = [
  'La certification ISO 27001 est en démarche, pas obtenue. L’audit à blanc est passé, l’audit de certification est prévu.',
  'La moitié de la capacité tourne encore sur des hyperviseurs propriétaires. La sortie est datée et avance, lentement.',
  'Le portail n’existe qu’en français. La structure multilingue est prévue, la traduction ne l’est pas encore.',
  'Nous sommes quarante organisations clientes, pas quatre cents. À cette échelle, chaque incident se voit.',
]

// ─── Les témoignages ──────────────────────────────────────────────────

export interface Temoignage {
  slug: string
  citation: string
  auteur: string
  initiales: string
  role: string
  organisation: string
  secteur: string
  /** L'état des lieux avant la migration. */
  avant: string
  /** Ce qui a été fait. */
  apres: string
  /** Ce qui s'est mal passé — un témoignage sans accroc ne se lit pas. */
  accroc: string
  chiffre: string
  chiffreLibelle: string
  site: string
}

export const TEMOIGNAGES: Temoignage[] = [
  {
    slug: 'microfinance',
    citation:
      'Ce qui m’a décidé, ce n’est pas le prix. C’est qu’on m’a dit non sur le dimensionnement que j’avais demandé, chiffres à l’appui. Un fournisseur qui accepte de vendre moins, je l’écoute.',
    auteur: 'Directeur des systèmes d’information',
    initiales: 'DS',
    role: 'DSI',
    organisation: 'Institution de microfinance · 14 filiales',
    secteur: 'Finance',
    avant:
      'Un contrat de licences propriétaires arrivant à échéance, un hébergement européen facturé en euros, et un plan de reprise décrit dans un document que personne n’avait jamais exercé.',
    apres:
      'Un Espace Cloud Pro réparti sur les deux sites, un plan Cloud Backup immuable testé chaque mois, et la messagerie de 240 collaborateurs reprise avec l’historique.',
    accroc:
      'La bascule MX a pris six heures au lieu de deux : un enregistrement TTL laissé à 24 heures chez le registrar précédent. Personne ne l’avait vérifié, ni eux ni nous.',
    chiffre: '−41 %',
    chiffreLibelle: 'de coût d’infrastructure la première année',
    site: 'Abidjan et Grand-Bassam',
  },
  {
    slug: 'transport',
    citation:
      'On nous avait promis quatre heures de reprise pendant des années. La première fois qu’on a mesuré, on a eu trois heures douze — et le rapport qui explique où sont passées ces trois heures.',
    auteur: 'Responsable de l’exploitation informatique',
    initiales: 'RE',
    role: 'Responsable exploitation',
    organisation: 'Opérateur de transport urbain',
    secteur: 'Mobilité',
    avant:
      'Une billetterie et un système de gestion de flotte sur un seul site, sans réplication. Une coupure de courant prolongée arrêtait la vente de titres.',
    apres:
      'Réplication vers Grand-Bassam, plan de reprise avec exercices trimestriels en réseau isolé, et sauvegarde immuable des bases de billetterie.',
    accroc:
      'Le premier exercice a échoué : un service dépendait d’une adresse IP codée en dur, invisible dans la documentation. Il a fallu deux exercices de plus pour que la bascule soit propre.',
    chiffre: '3 h 12',
    chiffreLibelle: 'de reprise constatée, pour 4 h engagées',
    site: 'Abidjan → Grand-Bassam',
  },
  {
    slug: 'registre-public',
    citation:
      'La question qu’on nous posait en comité, ce n’était pas « combien ça coûte » mais « où sont les données, et qui peut les lire ». Pour la première fois, on avait une réponse écrite avec un nom de bâtiment.',
    auteur: 'Secrétaire général',
    initiales: 'SG',
    role: 'Secrétaire général',
    organisation: 'Institution publique · registre national',
    secteur: 'Secteur public',
    avant:
      'Microsoft 365 pour 400 agents, une facturation en devise étrangère, et aucune attestation de résidence des données à produire au régulateur.',
    apres:
      'Drive et messagerie repris sur le site d’Abidjan, avec conservation de l’historique des boîtes et attestation de résidence ressource par ressource.',
    accroc:
      'Six semaines annoncées, huit réellement. La reprise des boîtes partagées et des règles de délégation avait été sous-estimée — par nous.',
    chiffre: '400',
    chiffreLibelle: 'sièges migrés, historique conservé',
    site: 'Abidjan',
  },
  {
    slug: 'sante',
    citation:
      'J’ai appelé un dimanche à six heures. Quelqu’un a décroché, connaissait notre parc, et a corrigé en vingt minutes. Je n’ai pas eu à expliquer qui j’étais.',
    auteur: 'Responsable informatique',
    initiales: 'RI',
    role: 'Responsable informatique',
    organisation: 'Groupe de cliniques · 6 sites',
    secteur: 'Santé',
    avant:
      'Un dossier patient hébergé chez un prestataire local sans supervision, sauvegardé sur un disque externe changé à la main le vendredi.',
    apres:
      'Machines virtuelles supervisées, sauvegarde immuable quotidienne avec restauration au fichier près, et cloisonnement réseau entre l’administratif et le médical.',
    accroc:
      'La première restauration de test a mis onze heures : le plan avait été taillé pour le coût de stockage, pas pour le temps de reprise. Nous l’avons refait.',
    chiffre: '11 min',
    chiffreLibelle: 'de RPO constaté sur le dossier patient',
    site: 'Abidjan',
  },
]

// ─── La communauté ────────────────────────────────────────────────────

export const ACTIONS_COMMUNAUTE = [
  {
    titre: 'Bac à sable gratuit pour les écoles',
    texte:
      'Un Espace Cloud de démonstration, remis à zéro chaque nuit, ouvert aux établissements d’enseignement supérieur ivoiriens. Pas de carte bancaire, pas de conversion en offre payante à la fin du semestre.',
    chiffre: '9',
    libelle: 'établissements inscrits',
  },
  {
    titre: 'Rencontre mensuelle « Cloud & Souveraineté »',
    texte:
      'Le dernier jeudi du mois, à Cocody. Retours d’expérience, pannes racontées sans filtre, et un créneau pour les questions qu’on n’ose pas poser devant un commercial. Entrée libre.',
    chiffre: '11',
    libelle: 'éditions depuis 2025',
  },
  {
    titre: 'Alternance et premier poste',
    texte:
      'Six alternants par promotion sur l’exploitation et le réseau, avec astreinte accompagnée — jamais seuls. Quatre des huit personnes de l’équipe d’exploitation sont arrivées par cette voie.',
    chiffre: '4/8',
    libelle: 'de l’équipe issue de l’alternance',
  },
  {
    titre: 'Contributions renvoyées en amont',
    texte:
      'Nous opérons des logiciels que nous n’écrivons pas. Les correctifs que nous produisons pour nos besoins repartent chez leurs auteurs : c’est la contrepartie minimale d’une offre bâtie sur du commun.',
    chiffre: '23',
    libelle: 'correctifs acceptés en amont',
  },
]

export const CONTRIBUTIONS_OSS = [
  { projet: 'Nextcloud', apport: 'Correctifs sur la reprise d’un partage après restauration granulaire', etat: 'Fusionné' },
  { projet: 'OpenStack Magnum', apport: 'Documentation du provisioning multi-site et d’un cas de bascule', etat: 'Fusionné' },
  { projet: 'Zimbra', apport: 'Script de reprise d’historique depuis Exchange Online, publié tel quel', etat: 'Publié' },
  { projet: 'Proxmox VE', apport: 'Signalement et test de régression sur la réplication asynchrone', etat: 'Corrigé en amont' },
  { projet: 'VictoriaMetrics', apport: 'Tableaux de bord de supervision par site, versés au dépôt d’exemples', etat: 'Fusionné' },
  { projet: 'Restic', apport: 'Rapport de reproduction d’un défaut de verrouillage sur stockage objet', etat: 'En revue' },
]
