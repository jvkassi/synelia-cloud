'use client'

import { MESSAGERIES, messageriesDeLOrg, type MessagerieDomaine } from '@/lib/mock'

import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-section'
import { useCollection } from '@/components/app/atelier'

/**
 * Panneau de la section — liste les messageries de l'organisation. Le sélecteur
 * donne le périmètre, l'atelier donne l'état : une messagerie activée pendant la
 * session ne doit plus s'afficher « À activer ».
 */
export function CadreEmails({ children }: { children: React.ReactNode }) {
  const messageries = useCollection<MessagerieDomaine>('messageries', MESSAGERIES)
  const perimetre = new Set(messageriesDeLOrg().map((m) => m.id))

  const entrees = messageries.items
    .filter((m) => perimetre.has(m.id))
    .map((m) => ({
      id: m.id,
      nom: m.domaine,
      sousTitre: m.actif
        ? `${m.boites.length}/${m.boitesIncluses} boîtes · ${m.palier}`
        : 'Messagerie non activée',
      etat: m.actif ? 'Active' : 'À activer',
      ton: (m.actif ? 'ok' : 'neutral') as Tone,
      href: `/app/web/emails/${m.id}`,
      motsCles: [m.solutionOSS, m.hoteWebmail],
    }))

  return (
    <CadreSection
      titre="Messageries"
      base="/app/web/emails"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Activer une messagerie', href: '/app/web/emails' }}
      placeholderRecherche="Rechercher un domaine…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} domaine${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
    >
      {children}
    </CadreSection>
  )
}
