'use client'

import { joursAvant } from '@/lib/mock'
import { CERTIFICATS, TYPE_CERTIFICAT_LABEL } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-section'

/** Panneau de la section — liste les certificats de l'organisation. */
export function CadreSsl({ children }: { children: React.ReactNode }) {
  const entrees = CERTIFICATS.map((c) => {
    const jours = joursAvant(c.expire)
    return {
      id: c.id,
      nom: c.hote,
      sousTitre: `${TYPE_CERTIFICAT_LABEL[c.type]} · ${c.emetteur}`,
      etat: c.etat === 'en_emission' ? 'Émission' : `${jours} j`,
      ton: (c.etat === 'en_emission'
        ? 'info'
        : jours <= 14
          ? 'err'
          : jours <= 30 || !c.renouvellementAuto
            ? 'warn'
            : 'ok') as Tone,
      href: `/app/web/ssl/${c.id}`,
      motsCles: [c.type, c.emetteur],
    }
  })

  return (
    <CadreSection
      titre="Certificats"
      base="/app/web/ssl"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Commander un certificat', href: '/app/web/ssl' }}
      placeholderRecherche="Rechercher un hôte…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} certificat${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
    >
      {children}
    </CadreSection>
  )
}
