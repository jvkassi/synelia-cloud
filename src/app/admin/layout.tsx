import type { Metadata } from 'next'
import { AppProvider } from '@/components/app/contexte'
import { TopBar } from '@/components/app/topbar'
import { ToastHost } from '@/components/app/toasts'
import { AdminMobileNav, AdminSidebar } from '@/components/admin/sidebar'

export const metadata: Metadata = {
  title: { default: 'Espace fournisseur', template: '%s · Espace fournisseur Synelia Cloud' },
  description:
    'Pilotage de la plateforme : organisations, revendeurs, capacité et backends, catalogue, marketplace, finance, audit et conformité.',
}

export default function EspaceFournisseurLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider roleInitial="provider_admin">
      <div className="min-h-screen bg-white">
        <TopBar portee="fournisseur" />
        <div className="flex">
          <AdminSidebar />
          <main className="min-w-0 flex-1 bg-g-050">
            <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-7">{children}</div>
          </main>
        </div>
        <AdminMobileNav />
        <ToastHost />
      </div>
    </AppProvider>
  )
}
