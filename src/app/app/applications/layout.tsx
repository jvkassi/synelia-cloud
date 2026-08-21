import type { Metadata } from 'next'

/**
 * Racine de l'univers Applications — sans panneau de sélection.
 *
 * « Accueil » est un tableau de bord : il ne porte sur aucun projet, donc rien
 * à sélectionner. Chaque autre section monte le panneau des projets depuis son
 * propre layout, ce qui évite d'en afficher un vide ici et garde la sélection
 * intacte quand on change d'onglet.
 */
export const metadata: Metadata = {
  title: { default: 'Applications', template: '%s · Applications Synelia' },
  description:
    'Projets applicatifs : services, déploiements, observabilité, sauvegardes, domaines, variables et paramètres.',
}

export default function LayoutApplications({ children }: { children: React.ReactNode }) {
  return children
}
