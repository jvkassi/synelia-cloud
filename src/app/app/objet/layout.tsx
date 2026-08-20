import type { Metadata } from 'next'
import { CadreObjet } from './cadre'

/**
 * Le panneau de sélection de la section vit ici, et non dans les pages : c'est
 * ce qui fait qu'il ne se reconstruit pas quand on change de ressource ou
 * d'onglet. Ce layout nomme aussi l'onglet du navigateur, qu'une page
 * « use client » ne peut pas exporter elle-même.
 */
export const metadata: Metadata = {
  title: 'Stockage objet',
  description: 'Compartiments S3, versioning, verrouillage WORM et clés d’accès.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreObjet>{children}</CadreObjet>
}
