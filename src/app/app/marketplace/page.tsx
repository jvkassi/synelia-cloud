'use client'

import { useMemo, useState } from 'react'
import { ExternalLink, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORIE_LABEL, type CategorieService } from '@/lib/types'
import { CATALOGUE, CONTRAT_INTEGRATION, SERVICES_MANAGES } from '@/lib/mock'
import { PageHeader, Card, Callout } from '@/components/composition/card'
import { EmptyState } from '@/components/composition/states'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { SearchInput, SegmentedControl } from '@/components/ui/field'
import { CatalogCard } from '@/components/business/service-card'

const CATEGORIES = Object.keys(CATEGORIE_LABEL) as CategorieService[]

export default function MarketplaceClient() {
  const [q, setQ] = useState('')
  const [categorie, setCategorie] = useState<CategorieService | 'toutes'>('toutes')
  const [mode, setMode] = useState<'tous' | 'dedie' | 'mutualise'>('tous')

  const dejaSouscrits = useMemo(
    () => new Set(SERVICES_MANAGES.map((s) => s.catalogSlug)),
    [],
  )

  const resultats = useMemo(
    () =>
      CATALOGUE.filter((s) => {
        if (categorie !== 'toutes' && s.categorie !== categorie) return false
        if (mode !== 'tous' && !s.modes.includes(mode)) return false
        if (q.trim()) {
          const n = q.trim().toLowerCase()
          return (
            s.nom.toLowerCase().includes(n) ||
            s.solutionOSS.toLowerCase().includes(n) ||
            s.pitch.toLowerCase().includes(n) ||
            s.description.toLowerCase().includes(n)
          )
        }
        return true
      }),
    [q, categorie, mode],
  )

  const parCategorie = useMemo(() => {
    const map = new Map<CategorieService, typeof CATALOGUE>()
    for (const s of resultats) {
      const arr = map.get(s.categorie) ?? []
      arr.push(s)
      map.set(s.categorie, arr)
    }
    return Array.from(map.entries())
  }, [resultats])

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Marketplace' }]}
        titre="Marketplace"
        sousTitre="Des solutions open source éprouvées, provisionnées, dimensionnées, sauvegardées, supervisées et facturées par Synelia. Vous utilisez leur interface d’origine ; nous opérons tout le reste."
        meta={
          <>
            <Badge tone="violet">{CATALOGUE.length} services au catalogue</Badge>
            <Badge tone="ok">{CATALOGUE.filter((s) => s.certifie).length} certifiés Synelia</Badge>
            <Badge tone="neutral">{dejaSouscrits.size} déjà souscrits par votre organisation</Badge>
          </>
        }
      />

      <Card className="border-p-300 bg-p-050">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Promesse
            titre="Souveraineté du socle"
            texte="Chaque instance tourne sur nos sites d’Abidjan ou de Grand-Bassam. Vous choisissez le site à la souscription."
          />
          <Promesse
            titre="SSO inclus"
            texte="Vos utilisateurs se connectent avec leur identité d’entreprise. Le mapping groupes → rôles applicatifs est fourni."
          />
          <Promesse
            titre="Sauvegarde et restauration granulaire"
            texte="Un plan par défaut est appliqué dès le provisioning, avec restauration jusqu’au fichier ou à la boîte aux lettres."
          />
          <Promesse
            titre="Réversibilité documentée"
            texte="Chaque service publie son format d’export et son délai. Nous testons ces exports comme nous testons les restaurations."
          />
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            placeholder="Rechercher un service ou une solution…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-72"
          />
          <SegmentedControl
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'tous', label: 'Tous les modes' },
              { value: 'dedie', label: 'Dédié' },
              { value: 'mutualise', label: 'Mutualisé' },
            ]}
          />
        </div>
        <p className="tnum text-[12px] text-g-500">
          {resultats.length} service{resultats.length > 1 ? 's' : ''} affiché
          {resultats.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Puce actif={categorie === 'toutes'} onClick={() => setCategorie('toutes')}>
          Toutes les catégories
        </Puce>
        {CATEGORIES.map((c) => (
          <Puce key={c} actif={categorie === c} onClick={() => setCategorie(c)}>
            {CATEGORIE_LABEL[c]}
            <span className="ml-1.5 text-[10px] opacity-70">
              {CATALOGUE.filter((s) => s.categorie === c).length}
            </span>
          </Puce>
        ))}
      </div>

      {resultats.length === 0 ? (
        <EmptyState
          titre="Aucun service ne correspond"
          phrase="Élargissez les critères, ou dites-nous quelle solution open source vous aimeriez voir opérée par Synelia — nous instruisons chaque demande."
          action={{ libelle: 'Proposer un service', href: '/app/support' }}
        />
      ) : (
        <div className="space-y-7">
          {parCategorie.map(([cat, services]) => (
            <section key={cat}>
              <div className="mb-3 flex items-baseline gap-2">
                <h2 className="type-h2">{CATEGORIE_LABEL[cat]}</h2>
                <span className="tnum text-[12px] text-g-500">{services.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {services.map((s) => (
                  <div key={s.slug} className="relative">
                    {dejaSouscrits.has(s.slug) && (
                      <span className="absolute right-3 top-3 z-10">
                        <Badge tone="ok" size="sm">
                          Souscrit
                        </Badge>
                      </span>
                    )}
                    <CatalogCard service={s} href={`/app/marketplace/${s.slug}`} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Card>
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div>
            <h2 className="type-h2">Le contrat d’intégration : neuf capacités, pour chaque service</h2>
            <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-g-700">
              Tout service ajouté au catalogue est livré avec ces neuf capacités. L’écran
              d’administration d’un service est exactement la matérialisation de cette liste — c’est
              ce qui rend le catalogue extensible sans nouveau développement d’interface, et ce qui
              justifie le prix face à une installation faite soi-même.
            </p>
          </div>
        </div>
        <ol className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {CONTRAT_INTEGRATION.map((c) => (
            <li key={c.num} className="flex items-start gap-2.5">
              <span className="tnum mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-p-100 text-[10.5px] font-bold text-p-700">
                {c.num}
              </span>
              <span className="min-w-0">
                <span className="block text-[12.5px] font-medium leading-snug text-ink">
                  {c.capacite}
                </span>
                <span className="block text-[11px] text-g-500">{c.ecran}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Callout
        ton="violet"
        titre="Ce que le portail ne fait pas — et pourquoi c’est un choix"
        action={
          <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-p-700">
            <ExternalLink size={12} />
            Interface d’origine
          </span>
        }
      >
        Nous ne réimplémentons aucun de ces produits. Pas d’explorateur de fichiers maison, pas de
        webmail maison, pas d’écran métier ERP maison. Le bouton{' '}
        <span className="font-semibold text-m-600">Ouvrir</span> vous redirige en SSO vers
        l’interface d’origine de la solution — vous bénéficiez de son écosystème complet, de ses
        applications mobiles et de sa documentation, pas d’une copie appauvrie.
      </Callout>
    </div>
  )
}

function Promesse({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="flex gap-2.5">
      <ShieldCheck size={15} className="mt-0.5 shrink-0 text-p-700" />
      <div>
        <p className="text-[12.5px] font-semibold text-ink">{titre}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-g-700">{texte}</p>
      </div>
    </div>
  )
}

function Puce({
  actif,
  onClick,
  children,
}: {
  actif: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors',
        actif
          ? 'border-p-700 bg-p-700 text-white'
          : 'border-g-300 bg-white text-g-700 hover:border-p-400 hover:bg-p-050',
      )}
    >
      {children}
    </button>
  )
}
