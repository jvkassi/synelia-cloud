import type { Metadata } from 'next'
import { AppProvider } from '@/components/app/contexte'
import { TopBar } from '@/components/app/topbar'
import { ToastHost } from '@/components/app/toasts'
import { Conteneur } from '@/components/app/conteneur'

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
          <Conteneur>{children}</Conteneur>
        </main>
        <ToastHost />
      </div>
    </AppProvider>
  )
}
