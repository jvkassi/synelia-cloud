'use client'

import { FLUX_ORCHESTRATION } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-section'
import { useEspace } from '@/components/app/contexte'

/** Panneau de la section — les flux d'orchestration de l'Espace. */
export function CadreFlux({ children }: { children: React.ReactNode }) {
  const espace = useEspace()
  const entrees = FLUX_ORCHESTRATION.filter((f) => f.espaceId === espace.id).map((f) => ({
    id: f.id,
    nom: f.nom,
    sousTitre: `${f.declencheur.libelle} · ${f.version}`,
    etat: f.statut === 'publie' ? 'Publié' : f.statut === 'suspendu' ? 'Suspendu' : 'Brouillon',
    ton: (f.statut === 'publie' ? 'ok' : f.statut === 'suspendu' ? 'warn' : 'neutral') as Tone,
    href: `/app/ia/orchestration/${f.id}`,
    motsCles: [f.declencheur.detail],
  }))

  return (
    <CadreSection
      titre="Flux"
      base="/app/ia/orchestration"
      entrees={entrees}
      placeholderRecherche="Rechercher un flux, un déclencheur…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} flux` : `${visibles} sur ${total}`
      }
    >
      {children}
    </CadreSection>
  )
}
