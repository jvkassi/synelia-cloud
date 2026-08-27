'use client'

import { MOTEUR_WEB_LABEL, SERVEURS_BASES, serveursBasesDeLOrg, type ServeurBases } from '@/lib/mock'

import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-section'
import { useCollection } from '@/components/app/atelier'

/**
 * Panneau de la section — liste les serveurs de bases de l'organisation. Le
 * sélecteur donne le périmètre, l'atelier donne l'état : un moteur activé ou une
 * base créée pendant la session se lisent ici aussi.
 */
export function CadreBases({ children }: { children: React.ReactNode }) {
  const serveurs = useCollection<ServeurBases>('serveurs-bases', SERVEURS_BASES)
  const perimetre = new Set(serveursBasesDeLOrg().map((s) => s.id))

  const entrees = serveurs.items
    .filter((s) => perimetre.has(s.id))
    .map((s) => ({
      id: s.id,
      nom: `${MOTEUR_WEB_LABEL[s.moteur]} ${s.version}`,
      sousTitre: `${s.serveur} · ${s.bases.length} base${s.bases.length > 1 ? 's' : ''}`,
      etat: s.actif ? 'Actif' : 'À activer',
      ton: (s.actif ? 'ok' : 'neutral') as Tone,
      href: `/app/web/bases/${s.id}`,
      motsCles: [s.moteur, s.serveur],
    }))

  return (
    <CadreSection
      titre="Serveurs de bases"
      base="/app/web/bases"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Activer un moteur', href: '/app/web/bases' }}
      placeholderRecherche="Rechercher un moteur…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} moteur${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
    >
      {children}
    </CadreSection>
  )
}
