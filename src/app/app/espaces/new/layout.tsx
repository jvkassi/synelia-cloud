import type { Metadata } from 'next'

/**
 * Une page « use client » ne peut pas exporter `metadata`. Ce layout minimal
 * n'existe que pour nommer l'onglet du navigateur — il n'ajoute aucun rendu.
 */
export const metadata: Metadata = {
  title: 'Nouvel Espace Cloud',
  description: 'Offre, site physique, plage réseau et estimation du coût.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
