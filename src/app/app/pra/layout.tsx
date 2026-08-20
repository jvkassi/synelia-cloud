import { CadrePra } from './cadre'

/**
 * Le panneau de sélection des plans de reprise vit ici, pas dans les pages :
 * passer d'un plan à l'autre ne le reconstruit pas. Le titre d'onglet reste
 * porté par les pages, qui sont rendues sur le serveur.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadrePra>{children}</CadrePra>
}
