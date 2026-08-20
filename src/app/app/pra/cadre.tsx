'use client'

import { dureeMin } from '@/lib/format'
import { SITE_COURT } from '@/lib/types'
import { DR_PLANS, ORG_COURANTE } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-section'

const ETAT: Record<string, { libelle: string; ton: Tone }> = {
  operationnel: { libelle: 'Opérationnel', ton: 'ok' },
  degrade: { libelle: 'Dégradé', ton: 'warn' },
  jamais_teste: { libelle: 'Non testé', ton: 'err' },
}

/**
 * Panneau de la section — les plans de reprise de l'organisation.
 *
 * Un plan jamais testé est marqué en rouge, pas en gris : un plan de reprise
 * qu'on n'a jamais joué est une intention, pas une garantie.
 */
export function CadrePra({ children }: { children: React.ReactNode }) {
  const entrees = DR_PLANS.filter((p) => p.orgId === ORG_COURANTE.id).map((p) => {
    const etat = ETAT[p.statut] ?? { libelle: p.statut, ton: 'neutral' as Tone }
    return {
      id: p.id,
      nom: p.nom,
      sousTitre: `${p.siteSource} → ${p.siteRepli} · RTO ${dureeMin(p.rtoCibleMin)}`,
      etat: etat.libelle,
      ton: etat.ton,
      href: `/app/pra/${p.id}`,
      motsCles: [
        SITE_COURT[p.siteSource],
        SITE_COURT[p.siteRepli],
        ...p.groupes.map((g) => g.nom),
      ],
    }
  })

  return (
    <CadreSection
      titre="Plans de reprise"
      base="/app/pra"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Ajouter un plan', href: '/app/pra' }}
      placeholderRecherche="Rechercher un plan…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} plan${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
      lienBas={{ libelle: 'Sauvegardes & conformité', href: '/app/sauvegarde' }}
    >
      {children}
    </CadreSection>
  )
}
