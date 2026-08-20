import type { Metadata } from 'next'
import { CadreHebergement } from './cadre'

export const metadata: Metadata = {
  title: 'Hébergement Web',
  description: 'Le serveur d\'un domaine : PHP, accès fichiers, tâches planifiées, ressources et journaux.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreHebergement>{children}</CadreHebergement>
}
