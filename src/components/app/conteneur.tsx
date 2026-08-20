'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UNIVERS_CLIENT, gabarit, panneauEspaceActif } from '@/lib/navigation'
import { CadreEspace } from './cadre-espace'

/**
 * Coquille de contenu de l'espace client.
 *
 * Trois univers occupent toute la largeur, pour deux raisons différentes :
 *
 * - **Infrastructure** et **Applications** portent un sélecteur d'Espace Cloud
 *   unique, monté ici et donc identique sur toutes leurs sections. Le monter au
 *   niveau du layout est ce qui garantit qu'il ne se reconstruit pas d'un onglet
 *   à l'autre : c'est un contexte, il doit survivre à la navigation.
 * - **Web Cloud** monte, lui, un panneau différent par section, depuis le
 *   `layout.tsx` de chaque section. Ici, rien à ajouter.
 *
 * Les écrans sans panneau de ces univers — l'accueil d'Infrastructure, celui de
 * Web Cloud, le relais SMTP — gardent une marge et s'arrêtent à 1600 px. Le
 * reste de l'espace client reste borné à 1400 px : ce sont des écrans de
 * lecture, et un paragraphe de 1900 px de large ne se lit pas.
 *
 * Le découpage n'est pas décidé ici : il est déclaré dans `lib/navigation.ts`,
 * à côté des sections auxquelles il s'applique.
 */
export function Conteneur({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (panneauEspaceActif(UNIVERS_CLIENT, pathname)) {
    return <CadreEspace>{children}</CadreEspace>
  }

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
