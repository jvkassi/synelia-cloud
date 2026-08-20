'use client'

import { goHumain } from '@/lib/format'
import { SITE_COURT } from '@/lib/types'
import { BUCKETS, ORG_COURANTE } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-section'

/**
 * Panneau de la section — les compartiments S3 de l'organisation.
 *
 * L'état dit qui peut lire : c'est la propriété d'un bucket qu'on regrette de
 * ne pas avoir vue. Le verrouillage WORM passe devant le reste, parce qu'il
 * change ce qu'on peut encore supprimer.
 */
export function CadreObjet({ children }: { children: React.ReactNode }) {
  const entrees = BUCKETS.filter((b) => b.orgId === ORG_COURANTE.id).map((b) => ({
    id: b.id,
    nom: b.nom,
    sousTitre: `${SITE_COURT[b.region]} · ${goHumain(b.tailleGo)} · ${b.classe}`,
    etat:
      b.policy === 'lecture_publique'
        ? 'Public'
        : b.objectLock?.actif
          ? 'WORM'
          : b.policy === 'json'
            ? 'Politique'
            : 'Privé',
    ton: (b.policy === 'lecture_publique'
      ? 'warn'
      : b.objectLock?.actif
        ? 'violet'
        : 'neutral') as Tone,
    href: `/app/objet/${b.id}`,
    motsCles: [b.region, b.classe, b.policy],
  }))

  return (
    <CadreSection
      titre="Compartiments"
      base="/app/objet"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Créer un compartiment', href: '/app/objet' }}
      placeholderRecherche="Rechercher un compartiment…"
      compteur={(visibles, total) =>
        visibles === total
          ? `${total} compartiment${total > 1 ? 's' : ''}`
          : `${visibles} sur ${total}`
      }
    >
      {children}
    </CadreSection>
  )
}
