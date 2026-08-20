import type { Metadata } from 'next'

/**
 * Racine de Web Cloud — sans panneau de sélection.
 *
 * « Accueil » est un tableau de bord : il ne porte pas sur une ressource, donc
 * rien à sélectionner. Chaque autre section apporte son propre panneau via son
 * layout, ce qui évite d'en afficher un vide ici.
 */
export const metadata: Metadata = {
  title: { default: 'Web Cloud', template: '%s · Web Cloud Synelia' },
  description:
    'Domaines, hébergement mutualisé, bases de données, messagerie, drive, applications, certificats et sauvegardes.',
}

export default function LayoutWebCloud({ children }: { children: React.ReactNode }) {
  return children
}
