import type { Metadata } from 'next'

/**
 * Une page « use client » ne peut pas exporter `metadata`. Ce layout minimal
 * n'existe que pour nommer l'onglet du navigateur — il n'ajoute aucun rendu.
 */
export const metadata: Metadata = {
  title: 'Centre de tâches',
  description:
    'Suivi des opérations de provisionnement : machines, souscriptions, restaurations, bascules.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
