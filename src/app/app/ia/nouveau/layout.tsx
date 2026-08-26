import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Créer un agent',
  description:
    'Assistant en quatre étapes : identité et rôle, modèle et consigne, outils et connaissances, garde-fous et publication.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
