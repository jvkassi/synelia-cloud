'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UNIVERS_CLIENT, gabarit } from '@/lib/navigation'

/**
 * Conteneur de contenu de l'espace client.
 *
 * Trois univers sont bâtis en maître-détail — Infrastructure, Applications,
 * Web Cloud — et occupent toute la largeur : leur panneau de sélection doit
 * toucher le bord de l'écran, comme dans une console d'exploitation, et leurs
 * tableaux ont besoin de la place. Sur ces routes le panneau porte lui-même la
 * marge du contenu, d'où l'absence de conteneur ; les écrans transverses de ces
 * univers, qui n'ont pas de panneau, gardent une marge et s'arrêtent à 1600 px.
 *
 * Le reste de l'espace reste borné à 1400 px : ce sont des écrans de lecture,
 * et un paragraphe de 1900 px de large ne se lit pas.
 *
 * Le découpage n'est pas décidé ici : il est déclaré une fois pour toutes dans
 * `lib/navigation.ts`, à côté des sections auxquelles il s'applique.
 */
export function Conteneur({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const forme = gabarit(UNIVERS_CLIENT, pathname)

  if (forme === 'plein') return <>{children}</>

  return (
    <div
      className={cn(
        'mx-auto px-4 py-6 sm:px-6 sm:py-7',
        forme === 'large' ? 'max-w-[1600px]' : 'max-w-[1400px]',
      )}
    >
      {children}
    </div>
  )
}
