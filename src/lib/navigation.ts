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
}

export interface UniversNav {
  id: string
  nom: string
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
      { nom: 'Facturation', href: '/app/facturation' },
      { nom: 'Support & SLA', href: '/app/support' },
      { nom: 'Documentation', href: '/app/docs' },
      { nom: 'Paramètres', href: '/app/parametres' },
    ],
  },
  {
    id: 'infrastructure',
    nom: 'Infrastructure',
    sections: [
      { nom: 'Espaces Cloud', href: '/app/espaces' },
      { nom: 'Machines virtuelles', href: '/app/vms' },
      { nom: 'Kubernetes', href: '/app/kubernetes' },
      { nom: 'Load balancers', href: '/app/reseau/lb' },
      { nom: 'Réseau & IP', href: '/app/reseau' },
      { nom: 'Stockage bloc', href: '/app/stockage' },
      { nom: 'Stockage objet S3', href: '/app/objet' },
      { nom: 'Bases managées', href: '/app/bases' },
    ],
  },
  {
    id: 'applications',
    nom: 'Applications',
    sections: [
      { nom: 'Projets', href: '/app/projets' },
      { nom: 'Applications', href: '/app/apps' },
      { nom: 'Domaines & routage', href: '/app/routage' },
      { nom: 'Déploiements', href: '/app/deploiements' },
      { nom: "Registre d'images", href: '/app/registre' },
    ],
  },
  {
    id: 'web',
    nom: 'Web Cloud',
    sections: [
      { nom: 'Hébergements web', href: '/app/web' },
      { nom: 'Domaines & DNS', href: '/app/domaines', aussi: ['/app/dns'] },
      { nom: 'Relais SMTP', href: '/app/smtp' },
    ],
  },
  {
    id: 'marketplace',
    nom: 'Marketplace',
    sections: [
      { nom: 'Catalogue', href: '/app/marketplace' },
      { nom: 'Mes services', href: '/app/services' },
      { nom: "Lanceur d'applications", href: '/app/lanceur' },
    ],
  },
  {
    id: 'protection',
    nom: 'Protection',
    sections: [
      { nom: 'Sauvegardes', href: '/app/sauvegarde' },
      { nom: 'Plan de reprise (PRA)', href: '/app/pra' },
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
