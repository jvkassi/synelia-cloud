import type { Metadata } from 'next'
import { CadreInference } from './cadre'

export const metadata: Metadata = {
  title: 'Inférence dédiée',
  description:
    'GPU réservés pour un seul client : modèle servi, réplicas, mise en veille, latence garantie et coût horaire.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreInference>{children}</CadreInference>
}
