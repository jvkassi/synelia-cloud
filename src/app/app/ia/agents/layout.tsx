import type { Metadata } from 'next'
import { CadreAgents } from './cadre'

export const metadata: Metadata = {
  title: 'Agents',
  description:
    'Rôle, consigne, variables, modèle, outils, connaissances, garde-fous, versions et traces d’exécution de chaque agent.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreAgents>{children}</CadreAgents>
}
