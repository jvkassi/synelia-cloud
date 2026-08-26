'use client'

import { BASES_CONNAISSANCE } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { num } from '@/lib/format'
import { CadreSection } from '@/components/app/cadre-section'
import { useEspace } from '@/components/app/contexte'

const TON: Record<string, Tone> = {
  a_jour: 'ok',
  indexation: 'info',
  erreur: 'err',
  jamais_indexee: 'neutral',
}

const ETAT: Record<string, string> = {
  a_jour: 'À jour',
  indexation: 'Indexation',
  erreur: 'Partiel',
  jamais_indexee: 'Jamais indexée',
}

/** Panneau de la section — les bases de connaissances de l'Espace. */
export function CadreConnaissances({ children }: { children: React.ReactNode }) {
  const espace = useEspace()
  const entrees = BASES_CONNAISSANCE.filter((b) => b.espaceId === espace.id).map((b) => ({
    id: b.id,
    nom: b.nom,
    sousTitre: `${num(b.documents)} documents`,
    etat: ETAT[b.statut],
    ton: TON[b.statut],
    href: `/app/ia/connaissances/${b.id}`,
    motsCles: [b.source.libelle, b.modeleEmbedding],
  }))

  return (
    <CadreSection
      titre="Bases"
      base="/app/ia/connaissances"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Créer une base', href: '/app/ia/connaissances' }}
      placeholderRecherche="Rechercher une base, une source…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} base${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
    >
      {children}
    </CadreSection>
  )
}
