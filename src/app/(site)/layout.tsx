import { SiteHeader } from '@/components/site/header'
import { SiteFooter } from '@/components/site/footer'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/*
        Le header de la vitrine porte un mégamenu de quatre colonnes : au clavier,
        atteindre le contenu demandait une trentaine de tabulations. Le lien reste
        hors écran jusqu'à ce qu'il reçoive le focus.
      */}
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[6px] focus:bg-p-700 focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-white"
      >
        Aller au contenu principal
      </a>
      <SiteHeader />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
