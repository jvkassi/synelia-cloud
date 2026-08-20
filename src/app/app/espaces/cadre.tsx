'use client'

import { pct } from '@/lib/format'
import { SITE_COURT } from '@/lib/types'
import { ESPACES, ORG_COURANTE } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-section'

/**
 * Panneau de la section — les Espaces Cloud de l'organisation.
 *
 * L'état affiché n'est pas le statut, qui est « active » partout et n'apprend
 * rien : c'est le poste le plus rempli du quota. C'est la seule information de
 * cette liste qui appelle une décision — commander de la capacité avant de
 * buter dessus.
 */
export function CadreEspaces({ children }: { children: React.ReactNode }) {
  const entrees = ESPACES.filter((e) => e.orgId === ORG_COURANTE.id).map((e) => {
    const remplissage = Math.max(
      e.usage.vcpu / e.quota.vcpu,
      e.usage.ramGo / e.quota.ramGo,
      e.usage.stockageTo / e.quota.stockageTo,
    )
    return {
      id: e.id,
      nom: e.code,
      sousTitre: `${e.offreNom} · ${SITE_COURT[e.site]}`,
      etat:
        e.statut === 'active'
          ? pct(remplissage * 100)
          : e.statut === 'suspendue'
            ? 'Suspendu'
            : 'Création',
      ton: (e.statut !== 'active'
        ? 'neutral'
        : remplissage >= 0.9
          ? 'err'
          : remplissage >= 0.8
            ? 'warn'
            : 'ok') as Tone,
      href: `/app/espaces/${e.id}`,
      motsCles: [e.offreNom, e.site, e.cidr, e.dnsInterne ?? ''],
    }
  })

  return (
    <CadreSection
      titre="Espaces Cloud"
      base="/app/espaces"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Créer un Espace', href: '/app/espaces/new' }}
      placeholderRecherche="Rechercher un Espace…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} Espace${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
    >
      {children}
    </CadreSection>
  )
}
