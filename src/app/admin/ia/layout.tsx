import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Parc GPU & IA',
  description:
    'Cartes installées par site, modèles servis, contrats d’achat chez les fournisseurs externes et marge à la revente.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
