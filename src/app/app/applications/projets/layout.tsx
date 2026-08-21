import type { Metadata } from 'next'
import { CadreProjet } from '@/components/app/cadre-projet'

export const metadata: Metadata = {
  title: 'Projets',
  description:
    'Les services qui forment chaque système : applications, bases, tâches planifiées et workers.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreProjet base="/app/applications/projets">{children}</CadreProjet>
}
