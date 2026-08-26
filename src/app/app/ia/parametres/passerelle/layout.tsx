import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Passerelle & clés', description: 'Point d’entrée compatible OpenAI, clés d’accès par application, quotas et plafonds réglés sur la clé.' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
