import type { Metadata } from 'next'
import { AppProvider } from '@/components/app/contexte'
import { TopBar } from '@/components/app/topbar'
import { ToastHost } from '@/components/app/toasts'

export const metadata: Metadata = {
  // `default` ne s'applique plus qu'à /admin lui-même : chaque sous-segment
  // nomme son propre onglet, la page cliente racine ne pouvant pas le faire.
  title: { default: 'Vue plateforme · Espace fournisseur', template: '%s · Espace fournisseur Synelia Cloud' },
  description:
    'Pilotage de la plateforme : organisations, revendeurs, capacité et backends, catalogue, marketplace, finance, audit et conformité.',
}

export default function EspaceFournisseurLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider roleInitial="provider_admin">
      <div className="min-h-screen bg-white">
        <TopBar portee="fournisseur" />
        <main className="bg-g-050">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-7">{children}</div>
        </main>
        <ToastHost />
      </div>
    </AppProvider>
  )
}
