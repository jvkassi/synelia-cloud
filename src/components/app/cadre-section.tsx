'use client'

import { usePathname } from 'next/navigation'
import {
  SelecteurRepliable,
  SelecteurRessource,
  type EntreeSelecteur,
} from '@/components/composition/selecteur-ressource'

/**
 * Coquille maître-détail d'une section, commune à Infrastructure, Applications
 * et Web Cloud.
 *
 * Une section qui porte sur une ressource — un Espace Cloud, une machine, un
 * cluster, un projet, un domaine — liste les siennes dans le panneau et ouvre
 * la fiche correspondante à droite. Sélectionner et agir deviennent deux gestes
 * distincts : passer d'une ressource à l'autre ne repasse plus par une liste.
 * Les écrans transverses (tableaux de bord, journaux, réseau d'un Espace) n'en
 * ont pas : il n'y a rien à choisir avant d'entrer.
 *
 * Le panneau vit dans le `layout` de la section, pas dans ses pages : changer de
 * ressource ou d'onglet ne le reconstruit pas, et la sélection reste visible.
 * Les routes concernées sont déclarées par `panneau` dans `lib/navigation.ts` —
 * c'est ce qui dit au conteneur de page de ne pas ajouter sa propre marge.
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

  return (
    <CoquillePanneau
      titre={titre}
      nomActif={actif?.nom}
      panneau={
        <SelecteurRessource
          titre={titre}
          actionPrincipale={actionPrincipale}
          entrees={entrees}
          actifId={actif?.id}
          placeholderRecherche={placeholderRecherche ?? `Rechercher…`}
          compteur={compteur}
          lienBas={lienBas}
        />
      }
    >
      {children}
    </CoquillePanneau>
  )
}

/**
 * Les deux colonnes : le panneau collé au bord gauche, le contenu à droite.
 *
 * Le panneau est rendu deux fois — en colonne au-delà de 1024 px, en bandeau
 * dépliant en dessous. C'est le même arbre React : dupliquer le balisage coûte
 * moins qu'un panneau qui change de nature selon la largeur.
 *
 * Le contenu porte ici sa marge, et non dans un conteneur de page : c'est ce qui
 * permet au panneau de toucher le bord de l'écran.
 */
export function CoquillePanneau({
  titre,
  nomActif,
  panneau,
  children,
}: {
  titre: string
  nomActif?: string
  panneau: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <SelecteurRepliable titre={titre} nomActif={nomActif}>
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
