import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Résidence des données', description: 'Où chaque classe de données a le droit d’être traitée. Cette politique prime sur les règles de routage.' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
