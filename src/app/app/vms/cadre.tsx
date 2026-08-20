'use client'

import { SITE_COURT } from '@/lib/types'
import { VMS } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-section'
import { useEspace } from '@/components/app/contexte'

const ETAT: Record<string, { libelle: string; ton: Tone }> = {
  running: { libelle: 'Active', ton: 'ok' },
  stopped: { libelle: 'Arrêtée', ton: 'neutral' },
  creating: { libelle: 'Création', ton: 'info' },
  migrating: { libelle: 'Migration', ton: 'info' },
  error: { libelle: 'Erreur', ton: 'err' },
}

/**
 * Panneau de la section — les machines de l'Espace Cloud courant.
 *
 * La liste suit le sélecteur d'Espace de la barre supérieure : une machine
 * appartient à un Espace, et mélanger deux Espaces dans le même panneau
 * ferait perdre le fil du quota qu'on est en train de remplir.
 */
export function CadreVms({ children }: { children: React.ReactNode }) {
  const espace = useEspace()
  const entrees = VMS.filter((v) => v.espaceId === espace.id).map((v) => {
    const etat = ETAT[v.statut] ?? { libelle: v.statut, ton: 'neutral' as Tone }
    return {
      id: v.id,
      nom: v.nom,
      sousTitre: `${v.vcpu} vCPU · ${v.ramGo} Go · ${SITE_COURT[v.site]}`,
      etat: etat.libelle,
      ton: etat.ton,
      href: `/app/vms/${v.id}`,
      motsCles: [
        v.os,
        v.flavor ?? '',
        v.applicationNom ?? '',
        ...v.ips.map((i) => i.adresse),
        ...(v.tags ?? []),
      ],
    }
  })

  return (
    <CadreSection
      titre="Machines"
      base="/app/vms"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Créer une machine', href: '/app/vms/new' }}
      placeholderRecherche="Rechercher une machine…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} machine${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
      lienBas={{ libelle: 'Déployer plusieurs machines', href: '/app/vms/composer' }}
    >
      {children}
    </CadreSection>
  )
}
