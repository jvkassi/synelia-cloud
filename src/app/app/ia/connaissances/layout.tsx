import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bases de connaissances',
  description:
    'Collections vectorielles alimentées depuis vos sources : documents indexés, fraîcheur, modèle de vectorisation et accès.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
