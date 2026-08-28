'use client'

import { joursAvant, CERTIFICATS, TYPE_CERTIFICAT_LABEL, type Certificat } from '@/lib/mock'

import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-section'
import { useCollection } from '@/components/app/atelier'

/**
 * Panneau de la section — liste les certificats de l'organisation, depuis
 * l'atelier : un renouvellement lancé depuis la fiche doit passer le badge à
 * « Émission » ici aussi, et un certificat commandé doit apparaître.
 */
export function CadreSsl({ children }: { children: React.ReactNode }) {
  const certificats = useCollection<Certificat>('certificats', CERTIFICATS)

  const entrees = certificats.items.map((c) => {
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
