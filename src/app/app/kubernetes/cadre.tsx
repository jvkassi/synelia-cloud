'use client'

import { K8S_CLUSTERS } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-section'
import { useEspace } from '@/components/app/contexte'

const ETAT: Record<string, { libelle: string; ton: Tone }> = {
  running: { libelle: 'Sain', ton: 'ok' },
  degraded: { libelle: 'Dégradé', ton: 'warn' },
  updating: { libelle: 'Mise à jour', ton: 'info' },
  provisioning: { libelle: 'Création', ton: 'info' },
}

/** Panneau de la section — les clusters de l'Espace Cloud courant. */
export function CadreKubernetes({ children }: { children: React.ReactNode }) {
  const espace = useEspace()
  const entrees = K8S_CLUSTERS.filter((c) => c.espaceId === espace.id).map((c) => {
    const etat = ETAT[c.statut] ?? { libelle: c.statut, ton: 'neutral' as Tone }
    const noeuds = c.controlPlane.nodes + c.pools.reduce((a, p) => a + p.nodes, 0)
    return {
      id: c.id,
      nom: c.nom,
      sousTitre: `${c.version} · ${noeuds} nœuds · ${c.controlPlane.mode === 'ha' ? 'HA' : 'mono'}`,
      etat: etat.libelle,
      ton: etat.ton,
      href: `/app/kubernetes/${c.id}`,
      motsCles: [c.version, ...c.modules, ...c.pools.map((p) => p.nom)],
    }
  })

  return (
    <CadreSection
      titre="Clusters"
      base="/app/kubernetes"
      entrees={entrees}
      // L'assistant de création n'existe pas encore : le bouton renvoie à la
      // liste, qui porte la commande. Mieux vaut cela qu'un lien vers un 404.
      actionPrincipale={{ libelle: 'Créer un cluster', href: '/app/kubernetes' }}
      placeholderRecherche="Rechercher un cluster…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} cluster${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
    >
      {children}
    </CadreSection>
  )
}
