import type { Metadata } from 'next'
import { CadreProjet } from '@/components/app/cadre-projet'

export const metadata: Metadata = {
  title: 'Observabilité',
  description:
    'Métriques, événements et journal récent d’un projet. L’analyse détaillée reste dans Grafana, Centreon et VictoriaLogs.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreProjet base="/app/applications/observabilite">{children}</CadreProjet>
}
