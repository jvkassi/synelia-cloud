import type { Metadata } from 'next'
import { CadreParametres } from './cadre'

export const metadata: Metadata = {
  title: 'Paramètres IA',
  description:
    'Passerelle, coffre-fort des clés fournisseurs, règles de routage, garde-fous, résidence des données et budget de l’univers IA & Agents.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreParametres>{children}</CadreParametres>
}
