import type { Metadata } from 'next'
import { CadreVms } from './cadre'

/**
 * Le panneau de sélection de la section vit ici, et non dans les pages : c'est
 * ce qui fait qu'il ne se reconstruit pas quand on change de ressource ou
 * d'onglet. Ce layout nomme aussi l'onglet du navigateur, qu'une page
 * « use client » ne peut pas exporter elle-même.
 */
export const metadata: Metadata = {
  title: 'Machines virtuelles',
  description: 'Vos machines, leur état, leur site et leurs sauvegardes.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreVms>{children}</CadreVms>
}
