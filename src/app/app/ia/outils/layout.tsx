import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Outils & canaux',
  description:
    'Ce qu’un agent peut appeler — API internes, schémas OpenAPI, serveurs MCP — et par où les gens l’atteignent.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
