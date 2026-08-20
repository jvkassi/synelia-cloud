'use client'

import { LOAD_BALANCERS } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-section'
import { useEspace } from '@/components/app/contexte'

/**
 * Panneau de la section — les répartiteurs de l'Espace Cloud courant.
 *
 * L'état résume la santé du pool, pas celle du répartiteur : un load balancer
 * « en marche » qui n'a plus de cible saine ne sert plus rien, et c'est
 * précisément ce qu'on veut voir sans ouvrir la fiche.
 */
export function CadreLb({ children }: { children: React.ReactNode }) {
  const espace = useEspace()
  const entrees = LOAD_BALANCERS.filter((l) => l.espaceId === espace.id).map((l) => {
    const ko = l.pool.filter((c) => c.sante === 'ko').length
    const drain = l.pool.filter((c) => c.sante === 'drain').length
    return {
      id: l.id,
      nom: l.nom,
      sousTitre: `${l.layer.toUpperCase()} · ${l.exposure === 'public' ? 'public' : 'interne'} · ${l.vip}`,
      etat: ko > 0 ? `${ko} KO` : drain > 0 ? `${drain} drain` : 'Sain',
      ton: (ko > 0 ? 'err' : drain > 0 ? 'warn' : 'ok') as Tone,
      href: `/app/reseau/lb/${l.id}`,
      motsCles: [l.vip, l.layer, l.exposure, ...l.pool.map((c) => c.targetLabel)],
    }
  })

  return (
    <CadreSection
      titre="Load balancers"
      base="/app/reseau/lb"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Créer un répartiteur', href: '/app/reseau/lb' }}
      placeholderRecherche="Rechercher un répartiteur…"
      compteur={(visibles, total) =>
        visibles === total
          ? `${total} répartiteur${total > 1 ? 's' : ''}`
          : `${visibles} sur ${total}`
      }
      lienBas={{ libelle: 'Réseaux, IP et filtrage', href: '/app/reseau' }}
    >
      {children}
    </CadreSection>
  )
}
