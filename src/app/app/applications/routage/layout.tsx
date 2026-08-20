import type { Metadata } from 'next'
import { CadreProjet } from '@/components/app/cadre-projet'

export const metadata: Metadata = {
  title: 'Domaines & routage',
  description:
    'Les hôtes qui mènent aux services d’un projet, leur vérification DNS et leur certificat.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreProjet base="/app/applications/routage">{children}</CadreProjet>
}
