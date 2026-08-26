import type { Metadata } from 'next'
import { CadreModeles } from './cadre'

export const metadata: Metadata = {
  title: 'Modèles',
  description:
    'Modèles souverains et externes : résidence du calcul, tarif au million de jetons, latence et disponibilité.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreModeles>{children}</CadreModeles>
}
