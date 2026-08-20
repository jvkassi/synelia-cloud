'use client'

import { usePathname } from 'next/navigation'

/**
 * Conteneur de contenu de l'espace client.
 *
 * Web Cloud fait exception : son panneau de sélection doit toucher le bord de
 * l'écran, comme dans une console d'exploitation, et ses tableaux ont besoin de
 * toute la largeur. Le reste de l'espace garde une largeur de lecture bornée —
 * un texte de 1900 px de large ne se lit pas.
 */
export function Conteneur({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname.startsWith('/app/web')) return <>{children}</>
  return <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-7">{children}</div>
}
