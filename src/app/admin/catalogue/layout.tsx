import type { Metadata } from 'next'

/**
 * Une page « use client » ne peut pas exporter `metadata`. Ce layout minimal
 * n'existe que pour nommer l'onglet du navigateur — il n'ajoute aucun rendu.
 */
export const metadata: Metadata = {
  title: 'Catalogue et tarifs',
  description: 'Offres, paliers et prix publics — un seul prix par offre, celui de la vitrine.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
