'use client'

import {
  HEBERGEMENTS,
  ORG_COURANTE,
  SITES_WEB,
  TYPE_SITE_LABEL,
} from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-webcloud'

/** Panneau de la section — liste les applications de l'organisation. */
export function CadreApplications({ children }: { children: React.ReactNode }) {
  const miens = new Set(
    HEBERGEMENTS.filter((h) => h.orgId === ORG_COURANTE.id).map((h) => h.id),
  )
  const entrees = SITES_WEB.filter((s) => miens.has(s.hebergementId)).map((s) => ({
    id: s.id,
    nom: s.hote,
    sousTitre: `${TYPE_SITE_LABEL[s.type]}${s.version ? ` ${s.version}` : ''} · PHP ${s.phpVersion}`,
    etat: s.majEnAttente ? `${s.majEnAttente} MAJ` : s.statut === 'en_ligne' ? 'En ligne' : 'Arrêté',
    ton: (s.majEnAttente ? 'warn' : s.statut === 'en_ligne' ? 'ok' : 'neutral') as Tone,
    href: `/app/web/applications/${s.id}`,
    motsCles: [s.type, s.racine],
  }))

  return (
    <CadreSection
      titre="Applications"
      base="/app/web/applications"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Installer une application', href: '/app/web/applications' }}
      placeholderRecherche="Rechercher une application…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} application${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
    >
      {children}
    </CadreSection>
  )
}
