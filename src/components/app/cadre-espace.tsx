'use client'

import { pct } from '@/lib/format'
import { SITE_COURT } from '@/lib/types'
import { ESPACES, ORG_COURANTE } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { SelecteurRessource } from '@/components/composition/selecteur-ressource'
import { CoquillePanneau } from './cadre-section'
import { useApp } from './contexte'

/**
 * Sélecteur d'Espace Cloud d'un univers — un contexte, pas une navigation.
 *
 * Le même panneau sur toutes les sections d'Infrastructure et d'Applications :
 * on choisit une fois où l'on travaille, et cela vaut pour les machines, les
 * clusters, le réseau, les volumes, les projets. Choisir n'ouvre donc aucune
 * page — on reste sur l'onglet courant, qui se relit dans le nouvel Espace.
 *
 * Il est monté par `Conteneur`, dans le layout de l'espace client : changer de
 * section ne le reconstruit pas, et la recherche saisie survit au changement
 * d'onglet.
 *
 * L'état affiché est le poste le plus rempli du quota, pas le statut : « active »
 * partout n'apprend rien, alors qu'un Espace à 91 % appelle une décision.
 */
export function CadreEspace({ children }: { children: React.ReactNode }) {
  const { espaceId, setEspaceId } = useApp()

  const entrees = ESPACES.filter((e) => e.orgId === ORG_COURANTE.id).map((e) => {
    const remplissage = Math.max(
      e.usage.vcpu / e.quota.vcpu,
      e.usage.ramGo / e.quota.ramGo,
      e.usage.stockageTo / e.quota.stockageTo,
    )
    return {
      id: e.id,
      nom: e.code,
      sousTitre: `${e.offreNom} · ${SITE_COURT[e.site]}`,
      etat: e.statut === 'active' ? pct(remplissage * 100) : 'Suspendu',
      ton: (e.statut !== 'active'
        ? 'neutral'
        : remplissage >= 0.9
          ? 'err'
          : remplissage >= 0.8
            ? 'warn'
            : 'ok') as Tone,
      motsCles: [e.offreNom, e.site, e.cidr, e.dnsInterne ?? ''],
    }
  })

  const actif = entrees.find((e) => e.id === espaceId)

  return (
    <CoquillePanneau
      titre="Espace Cloud"
      nomActif={actif?.nom}
      panneau={
        <SelecteurRessource
          titre="Espace Cloud"
          entrees={entrees}
          actifId={espaceId}
          onChoisir={setEspaceId}
          placeholderRecherche="Rechercher un Espace…"
          compteur={(visibles, total) =>
            visibles === total
              ? `${total} Espace${total > 1 ? 's' : ''}`
              : `${visibles} sur ${total}`
          }
          lienBas={{ libelle: 'Quotas et création', href: '/app/espaces' }}
        />
      }
    >
      {children}
    </CoquillePanneau>
  )
}
