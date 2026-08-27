'use client'

import { DOMAINES, HEBERGEMENTS, entreesWebCloud } from '@/lib/mock'
import type { Domaine, WebHosting } from '@/lib/types'
import { CadreSection } from '@/components/app/cadre-section'
import { useCollection } from '@/components/app/atelier'

/**
 * Panneau de la section — liste les domaines de l'organisation, composés depuis
 * l'atelier : un domaine commandé pendant la session doit apparaître ici, sinon
 * on ne peut pas ouvrir sa fiche.
 */
export function CadreDomaines({ children }: { children: React.ReactNode }) {
  const domaines = useCollection<Domaine>('domaines', DOMAINES)
  const hebergements = useCollection<WebHosting>('hebergements', HEBERGEMENTS)

  const entrees = entreesWebCloud(undefined, {
    domaines: domaines.items,
    hebergements: hebergements.items,
  }).map((e) => ({
    id: e.id,
    nom: e.nom,
    sousTitre: e.sousTitre,
    etat: e.etat,
    ton: e.ton,
    href: `/app/web/domaines/${encodeURIComponent(e.id)}`,
    motsCles: [e.hebergement?.serveur.nom ?? '', e.hebergement?.palier ?? ''],
  }))

  return (
    <CadreSection
      titre="Domaines"
      base="/app/web/domaines"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Commander', href: '/app/web/domaines' }}
      placeholderRecherche="Rechercher un domaine…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} domaine${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
    >
      {children}
    </CadreSection>
  )
}
