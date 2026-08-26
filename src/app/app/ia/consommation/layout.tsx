import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Consommation & coûts',
  description:
    'Jetons et FCFA par modèle, par clé et par jour, plafond mensuel et comparaison avec un scénario tout externe.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
