'use client'

import { CATEGORIE_MODELE_LABEL, MODELES } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-section'

/**
 * Panneau de la section — le catalogue des modèles déployables.
 *
 * Ici la liste n'est pas un parc mais un catalogue : rien à créer, seulement à
 * choisir. Le panneau n'a donc pas d'action principale, et la marque de
 * qualification Synelia tient la place de l'état.
 */
export function CadreModeles({ children }: { children: React.ReactNode }) {
  const entrees = MODELES.map((m) => ({
    id: m.slug,
    nom: m.nom,
    sousTitre: `${CATEGORIE_MODELE_LABEL[m.categorie]} · ${m.solution} ${m.version}`,
    etat: m.certifie ? 'Certifié' : 'Communauté',
    ton: (m.certifie ? 'ok' : 'neutral') as Tone,
    href: `/app/modeles/${m.slug}`,
    motsCles: [m.solution, m.categorie, m.phrase, m.chart],
  }))

  return (
    <CadreSection
      titre="Modèles"
      base="/app/modeles"
      entrees={entrees}
      placeholderRecherche="Rechercher un modèle…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} modèle${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
      lienBas={{ libelle: 'Où les déployer : mes projets', href: '/app/projets' }}
    >
      {children}
    </CadreSection>
  )
}
