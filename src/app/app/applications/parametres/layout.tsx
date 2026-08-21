import type { Metadata } from 'next'
import { CadreProjet } from '@/components/app/cadre-projet'

export const metadata: Metadata = {
  title: 'Paramètres',
  description:
    'Environnements, rattachement à l’Espace Cloud et suppression d’un projet.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreProjet base="/app/applications/parametres">{children}</CadreProjet>
}
