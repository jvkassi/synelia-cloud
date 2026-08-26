'use client'

import { MODELES_IA, POINTS_INFERENCE } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { SITE_LABEL } from '@/lib/types'
import { CadreSection } from '@/components/app/cadre-section'
import { useEspace } from '@/components/app/contexte'

const TON: Record<string, Tone> = {
  en_ligne: 'ok',
  demarrage: 'info',
  en_veille: 'neutral',
  erreur: 'err',
}

const ETAT: Record<string, string> = {
  en_ligne: 'En ligne',
  demarrage: 'Démarrage',
  en_veille: 'En veille',
  erreur: 'Erreur',
}

/** Panneau de la section — les points d'inférence réservés de l'Espace. */
export function CadreInference({ children }: { children: React.ReactNode }) {
  const espace = useEspace()
  const entrees = POINTS_INFERENCE.filter((p) => p.espaceId === espace.id).map((p) => ({
    id: p.id,
    nom: p.nom,
    sousTitre: `${p.gpu} ×${p.gpuParReplica * p.replicas} · ${SITE_LABEL[p.site]}`,
    etat: ETAT[p.statut],
    ton: TON[p.statut],
    href: `/app/ia/inference/${p.id}`,
    motsCles: [MODELES_IA.find((m) => m.id === p.modeleId)?.nom ?? ''],
  }))

  return (
    <CadreSection
      titre="Points de service"
      base="/app/ia/inference"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Réserver des GPU', href: '/app/ia/inference' }}
      placeholderRecherche="Rechercher un point, un modèle…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} point${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
    >
      {children}
    </CadreSection>
  )
}
