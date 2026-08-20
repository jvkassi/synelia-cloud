'use client'

import { PROJETS, syntheseProjet } from '@/lib/mock'
import type { Tone } from '@/components/ui/badge'
import { CadreSection } from '@/components/app/cadre-section'

/**
 * Panneau de la section — les projets de l'organisation.
 *
 * Les projets ne sont pas filtrés par Espace Cloud, contrairement aux
 * ressources d'infrastructure : un projet est une unité de travail, et on veut
 * pouvoir passer de l'un à l'autre sans se demander où il est hébergé.
 */
export function CadreProjets({ children }: { children: React.ReactNode }) {
  const entrees = PROJETS.map((p) => {
    const s = syntheseProjet(p.id)
    return {
      id: p.id,
      nom: p.nom,
      sousTitre: `${s.services} service${s.services > 1 ? 's' : ''} · ${p.environnements.length} environnement${p.environnements.length > 1 ? 's' : ''}`,
      etat:
        s.enEchec > 0
          ? `${s.enEchec} échec${s.enEchec > 1 ? 's' : ''}`
          : s.degrades > 0
            ? `${s.degrades} dégradé${s.degrades > 1 ? 's' : ''}`
            : 'Sain',
      ton: (s.enEchec > 0 ? 'err' : s.degrades > 0 ? 'warn' : 'ok') as Tone,
      href: `/app/projets/${p.id}`,
      motsCles: [p.description, ...p.environnements],
    }
  })

  return (
    <CadreSection
      titre="Projets"
      base="/app/projets"
      entrees={entrees}
      actionPrincipale={{ libelle: 'Créer un projet', href: '/app/projets/nouveau' }}
      placeholderRecherche="Rechercher un projet…"
      compteur={(visibles, total) =>
        visibles === total ? `${total} projet${total > 1 ? 's' : ''}` : `${visibles} sur ${total}`
      }
      lienBas={{ libelle: 'Routage des domaines', href: '/app/routage' }}
    >
      {children}
    </CadreSection>
  )
}
