'use client'

import { AGENTS_IA } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { TYPE_AGENT_LABEL } from '@/lib/types'
import { CadreSection } from '@/components/app/cadre-section'
import { useEspace } from '@/components/app/contexte'

/** Panneau de la section — les agents de l'Espace, publiés d'abord. */
export function CadreAgents({ children }: { children: React.ReactNode }) {
  const espace = useEspace()
  const entrees = AGENTS_IA.filter((a) => a.espaceId === espace.id)
    // Les brouillons descendent en bas : on ouvre bien plus souvent un agent en
    // production qu'un agent dont les épreuves ne passent pas encore.
    .sort((a, b) => Number(b.statut === 'publie') - Number(a.statut === 'publie'))
    .map((a) => ({
      id: a.id,
      nom: a.nom,
      sousTitre: TYPE_AGENT_LABEL[a.type],
      etat: a.statut === 'publie' ? 'Publié' : a.statut === 'suspendu' ? 'Suspendu' : 'Brouillon',
      ton: (a.statut === 'publie' ? 'ok' : a.statut === 'suspendu' ? 'warn' : 'neutral') as Tone,
      href: `/app/ia/agents/${a.id}`,
      motsCles: [a.slug, a.role],
    }))

  return (
    <CadreSection
      titre="Agents"
      base="/app/ia/agents"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Créer un agent', href: '/app/ia/nouveau' }}
      placeholderRecherche="Rechercher un agent, un rôle…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} agent${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
    >
      {children}
    </CadreSection>
  )
}
