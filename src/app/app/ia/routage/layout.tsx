import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Routage & garde-fous',
  description:
    'Règles de choix de modèle, chaînes de repli, filtres appliqués aux requêtes et politique de résidence des données.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
