'use client'

import { sauvegardesWebDeLOrg } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-webcloud'

/** Panneau de la section — liste les sauvegardes de l'organisation. */
export function CadreBackup({ children }: { children: React.ReactNode }) {
  const entrees = sauvegardesWebDeLOrg().map((s) => {
    const dernier = s.executions[0]
    return {
      id: s.id,
      nom: s.nomServi,
      sousTitre: `${s.serveur} · ${s.frequence} à ${s.heure}`,
      etat: dernier?.statut === 'ok' ? 'OK' : dernier?.statut === 'partielle' ? 'Partielle' : 'Échec',
      ton: (dernier?.statut === 'ok' ? 'ok' : dernier?.statut === 'partielle' ? 'warn' : 'err') as Tone,
      href: `/app/web/backup/${s.id}`,
      motsCles: [s.destination, s.serveur],
    }
  })

  return (
    <CadreSection
      titre="Sauvegardes"
      base="/app/web/backup"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Ajouter un plan', href: '/app/web/backup' }}
      placeholderRecherche="Rechercher un plan…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} plan${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
    >
      {children}
    </CadreSection>
  )
}
