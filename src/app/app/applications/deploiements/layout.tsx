import type { Metadata } from 'next'
import { CadreProjet } from '@/components/app/cadre-projet'

export const metadata: Metadata = {
  title: 'Déploiements',
  description:
    'L’historique immuable des déploiements, projet par projet : commit, artefact, analyse DevSecOps et auteur.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreProjet base="/app/applications/deploiements">{children}</CadreProjet>
}
