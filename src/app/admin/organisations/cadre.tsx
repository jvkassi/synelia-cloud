'use client'

import { ORGANISATIONS } from '@/lib/mock/orgs'
import { CadreSection } from '@/components/app/cadre-section'
import { money } from '@/lib/format'

/**
 * Panneau de sélection de l'univers Clients.
 *
 * Un exploitant passe sa journée d'une organisation à l'autre — un ticket ici,
 * un dépassement de quota là. Sans panneau persistant, chaque saut repasse par
 * la liste : deux clics et une recherche pour un aller-retour qui devrait en
 * coûter un. Le panneau est monté par le `layout` de la section, donc il ne se
 * reconstruit pas quand la fiche de droite change.
 *
 * Toutes les organisations sont clientes en direct : il n'y a pas de niveau
 * revendeur à distinguer dans la liste, seulement l'état du compte.
 */
export function CadreOrganisations({ children }: { children: React.ReactNode }) {
  const entrees = ORGANISATIONS.map((o) => ({
    id: o.id,
    nom: o.nom,
    // Sans « /mois » : la colonne est étroite et le suffixe suffit à faire
    // tronquer le secteur, qui est l'information de repérage la plus utile.
    sousTitre: `${o.secteur ?? o.pays} · ${money(o.caMensuel ?? 0)}`,
    etat:
      o.statut === 'active' ? o.tenantPlan : o.statut === 'suspendue' ? 'Suspendue' : 'Fermée',
    ton:
      o.statut === 'active'
        ? ('neutral' as const)
        : o.statut === 'suspendue'
          ? ('warn' as const)
          : ('err' as const),
    href: `/admin/organisations/${o.id}`,
    motsCles: [o.pays, o.domaine ?? '', o.tva ?? '', o.tenantPlan ?? ''],
  }))

  return (
    <CadreSection
      titre="Organisations"
      base="/admin/organisations"
      entrees={entrees}
      placeholderRecherche="Rechercher un client…"
      compteur={(visibles, total) =>
        visibles === total
          ? `${total} organisation${total > 1 ? 's' : ''} cliente${total > 1 ? 's' : ''}`
          : `${visibles} sur ${total}`
      }
      lienBas={{ libelle: 'Vue d’ensemble du parc client', href: '/admin/organisations' }}
    >
      {children}
    </CadreSection>
  )
}
