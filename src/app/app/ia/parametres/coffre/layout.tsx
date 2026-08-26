import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Coffre-fort fournisseurs', description: 'Les clés des éditeurs étrangers, détenues par Synelia et jamais exposées à vos applications.' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
