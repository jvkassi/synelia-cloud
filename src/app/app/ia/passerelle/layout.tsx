import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Passerelle & clés',
  description:
    'Point d’entrée unique compatible OpenAI, clés d’accès par application, quotas de jetons et plafonds de dépense.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
