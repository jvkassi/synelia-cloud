/**
 * Modèle de navigation à deux barres.
 *
 * Barre 1 : les univers — de grands domaines fonctionnels, stables, peu nombreux.
 * Barre 2 : les sections de l'univers courant.
 *
 * Ce découpage remplace la barre latérale unique qui alignait trente entrées :
 * un portail dont on ne voit que la moitié des entrées à la fois n'aide personne
 * à trouver la bonne. Chaque univers tient ici entre deux et huit sections.
 */

export interface SectionNav {
  nom: string
  href: string
  /**
   * Préfixes d'URL supplémentaires rattachés à cette section, pour les écrans
   * qui n'ont pas d'onglet propre — la zone DNS ouverte depuis un domaine, le
   * détail d'une tâche du centre de tâches. Sans cela, ces pages n'allumeraient
   * aucun onglet et le lecteur perdrait son repère.
   */
  aussi?: string[]
  /**
   * Préfixes de routes dont le `layout` monte un panneau de sélection
   * persistant. Le contenu y touche le bord de l'écran : c'est le panneau qui
   * porte la marge, pas le conteneur de page.
   */
  panneau?: string[]
}

export interface UniversNav {
  id: string
  nom: string
  /**
   * L'univers occupe toute la largeur de l'écran. Réservé aux univers bâtis en
   * maître-détail : leurs panneaux doivent toucher le bord et leurs tableaux
   * ont besoin de la place. Les univers de lecture gardent une largeur bornée.
   */
  pleineLargeur?: boolean
  sections: SectionNav[]
}

/** Espace client (§4 à §9). */
export const UNIVERS_CLIENT: UniversNav[] = [
  {
    id: 'global',
    nom: 'Global',
    sections: [
      { nom: 'Tableau de bord', href: '/app', aussi: ['/app/taches'] },
      { nom: 'Supervision', href: '/app/observabilite' },
      { nom: "Lanceur d'applications", href: '/app/lanceur' },
      { nom: 'Facturation', href: '/app/facturation' },
      { nom: 'Support & SLA', href: '/app/support' },
      { nom: 'Documentation', href: '/app/docs' },
      { nom: 'Paramètres', href: '/app/parametres' },
    ],
  },
  {
    id: 'infrastructure',
    nom: 'Infrastructure',
    pleineLargeur: true,
    sections: [
      { nom: 'Espaces Cloud', href: '/app/espaces', panneau: ['/app/espaces'] },
      { nom: 'Machines virtuelles', href: '/app/vms', panneau: ['/app/vms'] },
      { nom: 'Kubernetes', href: '/app/kubernetes', panneau: ['/app/kubernetes'] },
      { nom: 'Load balancers', href: '/app/reseau/lb', panneau: ['/app/reseau/lb'] },
      // Réseaux privés, adresses publiques, VPN et filtrage se lisent ensemble
      // par Espace Cloud : il n'y a pas une ressource à choisir avant d'entrer.
      { nom: 'Réseau & IP', href: '/app/reseau' },
      { nom: 'Stockage bloc', href: '/app/stockage' },
      { nom: 'Stockage objet S3', href: '/app/objet', panneau: ['/app/objet'] },
      { nom: 'Bases managées', href: '/app/bases' },
      // Les sauvegardes se règlent aussi ressource par ressource ; cette
      // section porte les plans réutilisables, la restauration granulaire, la
      // reprise d'activité et le tableau de conformité qu'on montre à un auditeur.
      // Seule la reprise d'activité se choisit plan par plan.
      { nom: 'Sauvegardes & PRA', href: '/app/sauvegarde', aussi: ['/app/pra'], panneau: ['/app/pra'] },
    ],
  },
  {
    id: 'applications',
    nom: 'Applications',
    pleineLargeur: true,
    sections: [
      { nom: 'Projets', href: '/app/projets', aussi: ['/app/routage'], panneau: ['/app/projets'] },
      { nom: 'Bibliothèque de modèles', href: '/app/modeles', panneau: ['/app/modeles'] },
      // Deux journaux transverses : ils croisent tous les projets à la fois,
      // il n'y a rien à sélectionner avant de les lire.
      { nom: 'Déploiements', href: '/app/deploiements' },
      { nom: "Registre d'images", href: '/app/registre' },
    ],
  },
  {
    id: 'web',
    nom: 'Web Cloud',
    pleineLargeur: true,
    sections: [
      // « Accueil » est un tableau de bord : il ne porte pas sur une ressource
      // en particulier, donc pas de panneau. Toutes les autres sections, sauf
      // le relais SMTP qui est un service unique, suivent le maître-détail.
      { nom: 'Accueil', href: '/app/web' },
      { nom: 'Domaines', href: '/app/web/domaines', panneau: ['/app/web/domaines'] },
      { nom: 'Hébergement Web', href: '/app/web/hebergement', panneau: ['/app/web/hebergement'] },
      { nom: 'Databases', href: '/app/web/bases', panneau: ['/app/web/bases'] },
      { nom: 'Emails', href: '/app/web/emails', panneau: ['/app/web/emails'] },
      { nom: 'Drive', href: '/app/web/drive', panneau: ['/app/web/drive'] },
      { nom: 'Applications', href: '/app/web/applications', panneau: ['/app/web/applications'] },
      { nom: 'SSL', href: '/app/web/ssl', panneau: ['/app/web/ssl'] },
      { nom: 'Backup', href: '/app/web/backup', panneau: ['/app/web/backup'] },
      { nom: 'Relais SMTP', href: '/app/smtp' },
    ],
  },
  {
    id: 'iam',
    nom: 'IAM & sécurité',
    sections: [
      { nom: 'Utilisateurs & rôles', href: '/app/membres' },
      { nom: "Fédération d'identité", href: '/app/sso' },
      { nom: 'Sécurité & audit', href: '/app/securite' },
    ],
  },
]

/** Espace fournisseur (§11). */
export const UNIVERS_FOURNISSEUR: UniversNav[] = [
  {
    id: 'pilotage',
    nom: 'Pilotage',
    sections: [
      { nom: 'Vue plateforme', href: '/admin' },
      { nom: 'Santé du parc', href: '/admin/sante' },
    ],
  },
  {
    id: 'clients',
    nom: 'Clients',
    sections: [
      { nom: 'Organisations', href: '/admin/organisations' },
      { nom: 'Revendeurs', href: '/admin/revendeurs' },
    ],
  },
  {
    id: 'infrastructure',
    nom: 'Infrastructure',
    sections: [
      { nom: 'Capacité & backends', href: '/admin/capacite' },
      { nom: 'Sites & zones', href: '/admin/sites' },
      { nom: 'Migration inter-backend', href: '/admin/migration' },
    ],
  },
  {
    id: 'produit',
    nom: 'Produit',
    sections: [
      { nom: "Catalogue d'offres", href: '/admin/catalogue' },
      { nom: 'Marketplace', href: '/admin/marketplace' },
    ],
  },
  {
    id: 'finance',
    nom: 'Finance',
    sections: [
      { nom: 'Facturation & marge', href: '/admin/facturation' },
      { nom: 'Revshare partenaires', href: '/admin/revshare' },
    ],
  },
  {
    id: 'exploitation',
    nom: 'Exploitation',
    sections: [
      { nom: 'Tickets', href: '/admin/tickets' },
      { nom: 'Audit', href: '/admin/audit' },
      { nom: 'Conformité', href: '/admin/conformite' },
      { nom: 'Équipe & rôles', href: '/admin/equipe' },
    ],
  },
]

/** Racine de l'espace — `/app` ou `/admin`, jamais préfixe d'une section. */
function racine(univers: UniversNav[]): string {
  return univers[0].sections[0].href
}

function correspond(chemin: string, href: string, base: string): boolean {
  // La racine de l'espace ne s'active qu'en correspondance exacte : sinon elle
  // serait préfixe de toutes les autres routes et gagnerait toujours.
  if (href === base) return chemin === base
  return chemin === href || chemin.startsWith(`${href}/`)
}

/**
 * Section active pour un chemin donné, au préfixe le plus long : `/app/reseau/lb`
 * doit désigner les load balancers, pas le réseau.
 */
export function sectionActive(
  univers: UniversNav[],
  chemin: string,
): { univers: UniversNav; section: SectionNav } | null {
  const base = racine(univers)
  let meilleur: { univers: UniversNav; section: SectionNav; longueur: number } | null = null

  for (const u of univers) {
    for (const s of u.sections) {
      for (const href of [s.href, ...(s.aussi ?? [])]) {
        if (!correspond(chemin, href, base)) continue
        if (!meilleur || href.length > meilleur.longueur) {
          meilleur = { univers: u, section: s, longueur: href.length }
        }
      }
    }
  }
  return meilleur ? { univers: meilleur.univers, section: meilleur.section } : null
}

/** Univers actif, avec repli sur le premier — jamais de barre 2 vide. */
export function universActif(univers: UniversNav[], chemin: string): UniversNav {
  return sectionActive(univers, chemin)?.univers ?? univers[0]
}

/**
 * Gabarit de contenu d'une route.
 *
 * `plein` — la section monte un panneau de sélection : il doit toucher le bord
 * de l'écran, et c'est lui qui porte la marge du contenu.
 * `large` — univers en pleine largeur, écran sans panneau : les tableaux
 * respirent jusqu'à 1600 px.
 * `borne` — tout le reste, borné à 1400 px. Un paragraphe de 1900 px ne se lit
 * pas, et la moitié des écrans de l'espace client sont faits de phrases.
 */
export type Gabarit = 'borne' | 'large' | 'plein'

export function gabarit(univers: UniversNav[], chemin: string): Gabarit {
  const trouve = sectionActive(univers, chemin)
  if (!trouve?.univers.pleineLargeur) return 'borne'
  const sousPanneau = (trouve.section.panneau ?? []).some(
    (base) => chemin === base || chemin.startsWith(`${base}/`),
  )
  return sousPanneau ? 'plein' : 'large'
}
