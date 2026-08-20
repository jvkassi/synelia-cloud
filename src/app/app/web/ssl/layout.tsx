import type { Metadata } from 'next'
import { CadreSsl } from './cadre'

export const metadata: Metadata = {
  title: 'SSL',
  description: 'Certificats émis, échéances, renouvellement automatique, et commande de certificats à validation d\'organisation ou joker.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreSsl>{children}</CadreSsl>
}
