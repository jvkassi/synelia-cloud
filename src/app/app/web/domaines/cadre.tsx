'use client'

import { entreesWebCloud } from '@/lib/mock'
import { CadreSection } from '@/components/app/cadre-section'

/** Panneau de la section — liste les domaines de l'organisation. */
export function CadreDomaines({ children }: { children: React.ReactNode }) {
  const entrees = entreesWebCloud().map((e) => ({
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
