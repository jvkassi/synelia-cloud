import type { Metadata } from 'next'
import { AppProvider } from '@/components/app/contexte'
import { TopBar } from '@/components/app/topbar'
import { ToastHost } from '@/components/app/toasts'

export const metadata: Metadata = {
  title: { default: 'Espace client', template: '%s · Espace client Synelia Cloud' },
  description:
    'Pilotez vos Espaces Cloud, vos applications, vos services managés, vos sauvegardes et votre facturation.',
}

export default function EspaceClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="min-h-screen bg-white">
        <TopBar portee="client" />
        <main className="bg-g-050">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-7">{children}</div>
        </main>
        <ToastHost />
      </div>
    </AppProvider>
  )
}
