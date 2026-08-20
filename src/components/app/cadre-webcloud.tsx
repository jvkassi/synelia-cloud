'use client'

import { usePathname } from 'next/navigation'
import { entreesWebCloud } from '@/lib/mock'
import {
  SelecteurRepliable,
  SelecteurRessource,
  type EntreeSelecteur,
  type FiltreSelecteur,
} from '@/components/composition/selecteur-ressource'

const FILTRES: FiltreSelecteur[] = [
  { id: 'tous', libelle: 'Tous' },
  { id: 'heberges', libelle: 'Hébergés', test: (e) => e.motsCles?.includes('heberge') ?? false },
  { id: 'noms', libelle: 'Noms seuls', test: (e) => e.motsCles?.includes('sans-hebergement') ?? false },
]

/**
 * Coquille maître-détail de Web Cloud.
 *
 * Le panneau est ici, dans le cadre, et non dans les pages : changer de domaine
 * ou d'onglet ne le reconstruit pas. C'est aussi ce qui garantit qu'il n'existe
 * qu'un seul endroit où l'on choisit un domaine — contrairement aux portails qui
 * font apparaître le même nom dans la liste des domaines, dans celle des
 * hébergements et dans celle des messageries.
 */
export function CadreWebCloud({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const entrees = entreesWebCloud()

  // `/app/web/dba.africa` → `dba.africa`. La racine ne sélectionne rien.
  const segment = pathname.startsWith('/app/web/')
    ? decodeURIComponent(pathname.slice('/app/web/'.length).split('/')[0])
    : undefined
  const actif = entrees.find((e) => e.id === segment)

  const liste: EntreeSelecteur[] = entrees.map((e) => ({
    id: e.id,
    nom: e.nom,
    sousTitre: e.sousTitre,
    etat: e.etat,
    ton: e.ton,
    href: `/app/web/${encodeURIComponent(e.id)}`,
    motsCles: [
      e.hebergement ? 'heberge' : 'sans-hebergement',
      e.hebergement?.serveur.nom ?? '',
      e.hebergement?.palier ?? '',
      e.provisoire ? 'provisoire' : '',
    ].filter(Boolean),
  }))

  const panneau = (
    <SelecteurRessource
      titre="Domaines"
      actionPrincipale={{ libelle: 'Commander', href: '/app/web' }}
      entrees={liste}
      actifId={actif?.id}
      filtres={FILTRES}
      placeholderRecherche="Rechercher un domaine…"
      compteur={(visibles, total) =>
        visibles === total
          ? `${total} domaine${total > 1 ? 's' : ''}`
          : `${visibles} sur ${total} domaines`
      }
      lienBas={{ libelle: 'Vue d’ensemble du portefeuille', href: '/app/web' }}
    />
  )

  return (
    /**
     * Les marges négatives annulent exactement le rembourrage du conteneur de
     * l'espace client : le panneau doit toucher le bord gauche de la zone de
     * contenu, aligné sur la barre des sections, pas flotter dans une carte.
     */
    <div className="-mx-4 -my-6 sm:-mx-6 sm:-my-7">
      <SelecteurRepliable titre="Domaine" nomActif={actif?.nom}>
        {panneau}
      </SelecteurRepliable>

      <div className="flex">
        <aside
          aria-label="Sélection du domaine"
          className="sticky top-[97px] hidden h-[calc(100vh-97px)] w-72 shrink-0 flex-col border-r border-g-300 bg-p-050 pt-3 lg:flex"
        >
          {panneau}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="px-4 py-6 sm:px-6 sm:py-7">{children}</div>
        </div>
      </div>
    </div>
  )
}
