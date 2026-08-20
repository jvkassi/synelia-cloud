'use client'

import { usePathname } from 'next/navigation'
import { PROJETS, servicesDuProjet, syntheseProjet } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import {
  SelecteurRepliable,
  SelecteurRessource,
  type EntreeSelecteur,
} from '@/components/composition/selecteur-ressource'

/**
 * Coquille maître-détail des sections de l'univers Applications.
 *
 * Web Cloud donne à chaque section son propre panneau : une section liste des
 * domaines, une autre des certificats, une autre des boîtes aux lettres. Ici
 * c'est l'inverse — un seul panneau, le même partout : le projet. Toutes les
 * sections répondent à une question sur le *même* objet (que déploie-t-il ?
 * comment se porte-t-il ? qu'est-ce qui le sauvegarde ?), donc changer d'onglet
 * ne doit jamais redemander de quel projet on parle.
 *
 * Comme dans Web Cloud, le panneau vit dans le `layout` de la section et non
 * dans sa page : passer d'un projet à l'autre ne le reconstruit pas.
 */
export function CadreProjet({
  base,
  children,
}: {
  /** Préfixe des routes de la section, par exemple `/app/applications/backup`. */
  base: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // `/app/applications/backup/prj-metier` → `prj-metier`. La racine de la
  // section ne sélectionne rien : elle montre la vue tous projets confondus.
  const segment = pathname.startsWith(`${base}/`)
    ? decodeURIComponent(pathname.slice(base.length + 1).split('/')[0])
    : undefined

  const entrees: EntreeSelecteur[] = PROJETS.map((p) => {
    const s = syntheseProjet(p.id)
    const etat =
      s.enEchec > 0
        ? { texte: `${s.enEchec} en échec`, ton: 'err' as Tone }
        : s.degrades > 0
          ? { texte: `${s.degrades} dégradé${s.degrades > 1 ? 's' : ''}`, ton: 'warn' as Tone }
          : s.arretes > 0
            ? { texte: `${s.arretes} arrêté${s.arretes > 1 ? 's' : ''}`, ton: 'neutral' as Tone }
            : { texte: 'Sain', ton: 'ok' as Tone }

    return {
      id: p.id,
      nom: p.nom,
      sousTitre: `${s.services} service${s.services > 1 ? 's' : ''} · ${p.environnements.length} env.`,
      etat: etat.texte,
      ton: etat.ton,
      href: `${base}/${p.id}`,
      motsCles: [
        p.espaceId,
        ...p.environnements,
        ...servicesDuProjet(p.id).map((s) => s.nom),
      ],
    }
  })

  const actif = entrees.find((e) => e.id === segment)

  const panneau = (
    <SelecteurRessource
      titre="Projets"
      actionPrincipale={{ libelle: 'Nouveau projet', href: '/app/applications/nouveau' }}
      entrees={entrees}
      actifId={actif?.id}
      placeholderRecherche="Rechercher un projet, un service…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} projet${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
      lienBas={{ libelle: 'Vue d’ensemble', href: '/app/applications' }}
    />
  )

  return (
    <>
      <SelecteurRepliable titre="Projet" nomActif={actif?.nom}>
        {panneau}
      </SelecteurRepliable>

      <div className="flex">
        <aside
          aria-label="Sélection — projets"
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
