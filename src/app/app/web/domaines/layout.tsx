import type { Metadata } from 'next'
import { CadreDomaines } from './cadre'

export const metadata: Metadata = {
  title: 'Domaines',
  description: 'Un domaine, un serveur : sites, bases, accès fichiers, PHP, zone DNS et sauvegardes au même endroit.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreDomaines>{children}</CadreDomaines>
}
