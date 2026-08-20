import type { Metadata } from 'next'
import { CadreDrive } from './cadre'

export const metadata: Metadata = {
  title: 'Drive',
  description: 'Espace de fichiers partagé, sièges, politique de partage externe et rétention des versions.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreDrive>{children}</CadreDrive>
}
