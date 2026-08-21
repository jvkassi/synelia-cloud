import type { Metadata } from 'next'
import { CadreOrganisations } from './cadre'

export const metadata: Metadata = {
  title: 'Organisations',
  description:
    'Les organisations clientes de la plateforme : consommation, ressources, facturation, tickets et audit.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreOrganisations>{children}</CadreOrganisations>
}
