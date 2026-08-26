import type { Metadata } from 'next'
import { CadreFlux } from './cadre'

export const metadata: Metadata = {
  title: 'Orchestration',
  description:
    'Flux multi-agents : enchaînement, branches conditionnelles, boucles, reprise sur erreur et validation humaine.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreFlux>{children}</CadreFlux>
}
