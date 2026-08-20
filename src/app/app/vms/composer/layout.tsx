import type { Metadata } from 'next'

/**
 * Une page « use client » ne peut pas exporter `metadata`. Ce layout minimal
 * n'existe que pour nommer l'onglet du navigateur — il n'ajoute aucun rendu.
 */
export const metadata: Metadata = {
  title: 'Composer un lot de serveurs',
  description:
    'Décrire une architecture par glisser-déposer, puis livrer toutes les machines d’un coup.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
