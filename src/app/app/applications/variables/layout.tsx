import type { Metadata } from 'next'
import { CadreProjet } from '@/components/app/cadre-projet'

export const metadata: Metadata = {
  title: 'Variables & secrets',
  description:
    'Les variables partagées d’un projet, par environnement et par portée : construction ou exécution.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreProjet base="/app/applications/variables">{children}</CadreProjet>
}
