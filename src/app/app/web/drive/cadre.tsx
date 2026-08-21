'use client'

import { drivesDeLOrg } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-section'

/** Panneau de la section — liste les drives de l'organisation. */
export function CadreDrive({ children }: { children: React.ReactNode }) {
  const entrees = drivesDeLOrg().map((d) => ({
    id: d.id,
    nom: d.domaine,
    sousTitre: d.actif
      ? `${d.sieges.attribues}/${d.sieges.souscrits} sièges · ${d.palier}`
      : 'Drive non activé',
    etat: d.actif ? 'Actif' : 'À activer',
    ton: (d.actif ? 'ok' : 'neutral') as Tone,
    href: `/app/web/drive/${d.id}`,
    motsCles: [d.solutionOSS, d.hote],
  }))

  return (
    <CadreSection
      titre="Drives"
      base="/app/web/drive"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Activer un drive', href: '/app/web/drive' }}
      placeholderRecherche="Rechercher un domaine…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} domaine${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
    >
      {children}
    </CadreSection>
  )
}
