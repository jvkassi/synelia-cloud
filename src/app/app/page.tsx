import type { Metadata } from 'next'
import TableauDeBord from './tableau-de-bord'

// `TableauDeBord` est un composant client : il lit l'atelier et l'API pour
// afficher des données réelles (`useCollection`, `useAtelier`), ce qu'un
// composant serveur ne peut pas faire. `metadata` ne se déclare que depuis un
// composant serveur — cette page reste donc un simple relais, plutôt qu'un
// layout.tsx voisin : `src/app/app/layout.tsx` existe déjà à ce niveau et sert
// tout l'espace client, on ne peut pas lui en ajouter un second.
export const metadata: Metadata = {
  title: 'Tableau de bord',
  description:
    'Capacité souscrite contre consommée, disponibilité, services managés, santé de l’infrastructure et activité récente.',
}

export default function Page() {
  return <TableauDeBord />
}
