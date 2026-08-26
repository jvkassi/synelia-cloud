import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Orchestration',
  description:
    'Flux multi-agents : enchaînement, branches conditionnelles, exécution parallèle, reprise sur erreur et validation humaine.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
