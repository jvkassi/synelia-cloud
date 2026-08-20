import type { Metadata } from 'next'
import { CadreWebCloud } from '@/components/app/cadre-webcloud'

export const metadata: Metadata = {
  title: 'Domaines',
  description:
    'Un domaine, un serveur : sites, bases, accès fichiers, PHP, services partagés, zone DNS, certificats et sauvegardes au même endroit.',
}

export default function LayoutWebCloud({ children }: { children: React.ReactNode }) {
  return <CadreWebCloud>{children}</CadreWebCloud>
}
