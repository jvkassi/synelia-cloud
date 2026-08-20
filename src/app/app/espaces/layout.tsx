import type { Metadata } from 'next'
import { CadreEspaces } from './cadre'

/**
 * Le panneau de sélection de la section vit ici, et non dans les pages : c'est
 * ce qui fait qu'il ne se reconstruit pas quand on change de ressource ou
 * d'onglet. Ce layout nomme aussi l'onglet du navigateur, qu'une page
 * « use client » ne peut pas exporter elle-même.
 */
export const metadata: Metadata = {
  title: 'Espaces Cloud',
  description: 'Vos enveloppes de capacité, leur quota et leur site physique.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreEspaces>{children}</CadreEspaces>
}
