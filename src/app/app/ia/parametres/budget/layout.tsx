import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Budget & alertes', description: 'Plafond mensuel, quotas par direction et seuils d’alerte de l’univers IA.' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
