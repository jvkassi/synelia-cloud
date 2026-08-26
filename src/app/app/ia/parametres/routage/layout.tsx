import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Règles de routage', description: 'Quel modèle répond à quelle requête, et vers quoi basculer quand il ne répond plus.' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
