'use client'

import { usePathname } from 'next/navigation'
import {
  SelecteurRepliable,
  SelecteurRessource,
  type EntreeSelecteur,
} from '@/components/composition/selecteur-ressource'

/**
 * Coquille maître-détail d'une section de Web Cloud.
 *
 * Chaque section de la barre — domaines, hébergements, bases, messageries,
 * drives, applications, certificats, sauvegardes — liste ses propres ressources
 * dans le panneau et ouvre la fiche correspondante à droite. Seul « Accueil »
 * n'en a pas : c'est un tableau de bord, il ne porte pas sur une ressource.
 *
 * Le panneau vit dans le `layout` de la section, pas dans ses pages : changer de
 * ressource ou d'onglet ne le reconstruit pas, et la sélection reste visible.
 */
export function CadreSection({
  titre,
  base,
  entrees,
  actionPrincipale,
  placeholderRecherche,
  compteur,
  lienBas,
  children,
}: {
  /** Nom de la ressource listée, au pluriel. */
  titre: string
  /** Préfixe des routes de la section, par exemple `/app/web/domaines`. */
  base: string
  entrees: EntreeSelecteur[]
  actionPrincipale?: { libelle: string; href: string }
  placeholderRecherche?: string
  compteur?: (visibles: number, total: number) => string
  lienBas?: { libelle: string; href: string }
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // `/app/web/domaines/dba.africa` → `dba.africa`. La racine ne sélectionne rien.
  const segment = pathname.startsWith(`${base}/`)
    ? decodeURIComponent(pathname.slice(base.length + 1).split('/')[0])
    : undefined
  const actif = entrees.find((e) => e.id === segment)

  const panneau = (
    <SelecteurRessource
      titre={titre}
      actionPrincipale={actionPrincipale}
      entrees={entrees}
      actifId={actif?.id}
      placeholderRecherche={placeholderRecherche ?? `Rechercher…`}
      compteur={compteur}
      lienBas={lienBas}
    />
  )

  return (
    <>
      <SelecteurRepliable titre={titre} nomActif={actif?.nom}>
        {panneau}
      </SelecteurRepliable>

      <div className="flex">
        <aside
          aria-label={`Sélection — ${titre}`}
          className="sticky top-[97px] hidden h-[calc(100vh-97px)] w-72 shrink-0 flex-col border-r border-g-300 bg-p-050 pt-3 lg:flex"
        >
          {panneau}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="px-4 py-6 sm:px-6 sm:py-7">{children}</div>
        </div>
      </div>
    </>
  )
}
