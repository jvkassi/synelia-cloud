import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IA & Modèles',
  description:
    'Passerelle d’inférence unique devant des modèles hébergés à Abidjan et des modèles de fournisseurs externes.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
