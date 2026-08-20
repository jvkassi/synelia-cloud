import type { Metadata } from 'next'

/**
 * Une page « use client » ne peut pas exporter `metadata`. Ce layout minimal
 * n'existe que pour nommer l'onglet du navigateur — il n'ajoute aucun rendu.
 */
export const metadata: Metadata = {
  title: 'Réseau',
  description: 'Réseaux privés, adresses publiques, VPN et règles de filtrage.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
