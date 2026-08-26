import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Garde-fous', description: 'Ce qui filtre les requêtes avant et après l’appel au modèle, sur toutes les clés de l’organisation.' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
