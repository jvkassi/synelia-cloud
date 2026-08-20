'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Boxes, Search, ShieldCheck } from 'lucide-react'
import { cn, surfaceMarque } from '@/lib/utils'
import { money } from '@/lib/format'
import {
  CATEGORIES_MODELES,
  CATEGORIE_MODELE_LABEL,
  MODELES,
  PROJETS,
  type CategorieModele,
} from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/field'
import { PageHeader, Card, CardHeader, Callout } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'

export default function BibliothequeModeles() {
  const [q, setQ] = useState('')
  const [categorie, setCategorie] = useState<CategorieModele | 'toutes'>('toutes')

  const resultats = useMemo(() => {
    const n = q.trim().toLowerCase()
    return MODELES.filter((m) => {
      if (categorie !== 'toutes' && m.categorie !== categorie) return false
      if (!n) return true
      return (
        m.nom.toLowerCase().includes(n) ||
        m.solution.toLowerCase().includes(n) ||
        m.phrase.toLowerCase().includes(n)
      )
    })
  }, [q, categorie])

  const groupes = CATEGORIES_MODELES.map((c) => ({
    categorie: c,
    modeles: resultats.filter((m) => m.categorie === c),
  })).filter((g) => g.modeles.length > 0)

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Bibliothèque de modèles' }]}
        titre="Bibliothèque de modèles"
        sousTitre="Des solutions open source prêtes à déployer dans un projet. Déployer un modèle crée une instance qui n’appartient qu’à vous : ses ressources, sa version, son plan de sauvegarde. C’est ce qui la distingue d’un service partagé, rattaché à un domaine. Le catalogue est le même pour tous vos Espaces Cloud : celui du panneau de gauche est celui où le déploiement se fera."
        meta={
          <>
            <Badge tone="neutral">{MODELES.length} modèles</Badge>
            <Badge tone="ok">{MODELES.filter((m) => m.certifie).length} certifiés Synelia</Badge>
            <Badge tone="neutral">{PROJETS.length} projets où déployer</Badge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile libelle="Modèles au catalogue" valeur={MODELES.length} detail="tous versionnés" />
        <StatTile
          libelle="Certifiés Synelia"
          valeur={MODELES.filter((m) => m.certifie).length}
          ton="ok"
          detail="qualifiés, sauvegardés, supervisés"
        />
        <StatTile libelle="Catégories" valeur={CATEGORIES_MODELES.length} />
        <StatTile
          libelle="Socle d’exécution"
          valeur="Kubernetes"
          detail="un espace de noms par projet"
        />
      </div>

      <Callout ton="info" titre="Ce que Synelia opère, et ce qui reste à vous">
        Nous provisionnons l’instance, l’exposons sur le domaine choisi, déclarons son client OIDC,
        appliquons un plan de sauvegarde, posons les sondes de supervision et qualifions les
        versions avant de vous les proposer. Le produit lui-même garde son interface : on ne
        reconstruit ni le webmail, ni l’explorateur de fichiers, ni les écrans comptables.
      </Callout>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          placeholder="Rechercher un modèle, une solution…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full sm:w-80"
        />
        <div className="no-scrollbar -mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1">
          <button
            type="button"
            onClick={() => setCategorie('toutes')}
            className={cn(
              'whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors',
              categorie === 'toutes'
                ? 'border-p-700 bg-p-700 text-white'
                : 'border-g-300 text-g-700 hover:border-p-400 hover:bg-p-050',
            )}
          >
            Toutes
          </button>
          {CATEGORIES_MODELES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategorie(c)}
              className={cn(
                'whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors',
                categorie === c
                  ? 'border-p-700 bg-p-700 text-white'
                  : 'border-g-300 text-g-700 hover:border-p-400 hover:bg-p-050',
              )}
            >
              {CATEGORIE_MODELE_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      {groupes.length === 0 ? (
        <EmptyState
          titre="Aucun modèle ne correspond"
          phrase="Reformulez votre recherche, ou dites-nous ce qui vous manque : nous ajoutons des modèles à partir des demandes reçues, en les qualifiant d’abord."
          action={{ libelle: 'Ouvrir un ticket', href: '/app/support' }}
        />
      ) : (
        <div className="space-y-7">
          {groupes.map(({ categorie: c, modeles }) => (
            <section key={c} className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="type-h2">{CATEGORIE_MODELE_LABEL[c]}</h2>
                <span className="text-[12px] text-g-500">
                  {modeles.length} modèle{modeles.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {modeles.map((m) => {
                  const surface = surfaceMarque(m.logoTeinte)
                  return (
                    <Link
                      key={m.slug}
                      href={`/app/modeles/${m.slug}`}
                      className="group flex flex-col rounded-[10px] border border-g-300 bg-white p-4 transition-all hover:border-p-400 hover:shadow-[0_4px_16px_rgba(43,27,77,.10)]"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] text-[14px] font-bold [font-family:var(--font-display)]"
                          style={{ background: surface.fond, color: surface.texte }}
                          aria-hidden
                        >
                          {m.logoInitiales}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-[14px] font-bold text-ink group-hover:text-p-700">
                              {m.nom}
                            </p>
                            {m.populaire && (
                              <Badge tone="violet" size="sm">
                                Populaire
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11.5px] text-g-500">
                            {m.solution} {m.version}
                          </p>
                        </div>
                      </div>

                      <p className="mt-2.5 flex-1 text-[12.5px] leading-relaxed text-g-700">
                        {m.phrase}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {m.certifie ? (
                          <Badge tone="ok" size="sm">
                            <ShieldCheck size={10} className="mr-1 inline" />
                            Certifié Synelia
                          </Badge>
                        ) : (
                          <Badge tone="neutral" size="sm">
                            Communauté
                          </Badge>
                        )}
                        <Badge tone="neutral" size="sm">
                          {m.ressources.cpu} vCPU · {(m.ressources.ramMo / 1024).toFixed(0)} Go
                        </Badge>
                        {m.dependances.length > 0 && (
                          <Badge tone="neutral" size="sm">
                            +{m.dependances.length} service
                            {m.dependances.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 flex items-end justify-between gap-2 border-t border-g-100 pt-2.5">
                        <span className="tnum text-[15px] font-bold text-p-700">
                          {money(m.prixIndicatif)}
                          <span className="text-[10.5px] font-semibold text-g-500">/mois</span>
                        </span>
                        <span className="text-[12px] font-semibold text-p-700 group-hover:text-m-600">
                          Déployer →
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <Card>
        <CardHeader
          titre="Un modèle qui vous manque ?"
          sousTitre="Nous ajoutons des modèles à la demande, mais nous ne publions rien sans l’avoir qualifié."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              t: 'Ce que nous vérifions',
              d: 'Que la solution se met à jour sans casser, qu’elle sait s’intégrer à un annuaire, et que ses données s’exportent dans un format documenté.',
            },
            {
              t: 'Ce que nous refusons',
              d: 'Les projets sans publication de correctifs de sécurité, ceux dont la licence interdit l’hébergement pour un tiers, et ceux dont la sauvegarde n’est pas restaurable de façon fiable.',
            },
            {
              t: 'Ce que vous obtenez',
              d: 'Une image qualifiée, une version figée, un plan de sauvegarde par défaut, des sondes de supervision, et une procédure de réversibilité testée.',
            },
          ].map((b) => (
            <div key={b.t}>
              <MicroLabel>{b.t}</MicroLabel>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-g-700">{b.d}</p>
            </div>
          ))}
        </div>
        <ButtonLink
          href="/app/support"
          variant="secondary"
          size="sm"
          className="mt-4"
          iconBefore={<Boxes size={13} />}
        >
          Proposer un modèle
        </ButtonLink>
      </Card>
    </div>
  )
}
