import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Catalogue de modèles',
  description:
    'Modèles souverains et externes : résidence du calcul, tarif au million de jetons, latence et disponibilité.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
