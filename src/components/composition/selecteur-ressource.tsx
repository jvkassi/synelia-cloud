'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronDown, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge, type Tone } from '@/components/ui/badge'

export interface EntreeSelecteur {
  id: string
  nom: string
  sousTitre?: string
  /** Court libellé d'état, aligné à droite. */
  etat?: string
  ton?: Tone
  href: string
  /** Termes supplémentaires pris en compte par la recherche. */
  motsCles?: string[]
}

export interface FiltreSelecteur {
  id: string
  libelle: string
  /** Prédicat appliqué à la liste. `undefined` pour « tout ». */
  test?: (entree: EntreeSelecteur) => boolean
}

/**
 * Panneau de sélection de ressource — le patron maître-détail.
 *
 * Il vit dans un `layout`, jamais dans une page : c'est ce qui fait qu'il ne se
 * recharge pas quand on change de ressource ou d'onglet, et donc que passer
 * d'un domaine à l'autre est instantané. Sélectionner et agir deviennent deux
 * gestes distincts, sans repasser par une liste.
 *
 * Volontairement sans pagination : une liste qui défile déjà et qu'on pagine en
 * plus oblige à chercher un contrôle après la trentième ligne. On charge tout,
 * et la recherche fait le tri.
 */
export function SelecteurRessource({
  titre,
  actionPrincipale,
  entrees,
  actifId,
  filtres,
  placeholderRecherche = 'Rechercher…',
  compteur,
  lienBas,
  className,
}: {
  titre: string
  actionPrincipale?: { libelle: string; href: string }
  entrees: EntreeSelecteur[]
  actifId?: string
  filtres?: FiltreSelecteur[]
  placeholderRecherche?: string
  /** Formate le pied du panneau. Par défaut : « n éléments ». */
  compteur?: (visibles: number, total: number) => string
  lienBas?: { libelle: string; href: string }
  className?: string
}) {
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState(filtres?.[0]?.id ?? 'tous')

  const visibles = useMemo(() => {
    const test = filtres?.find((f) => f.id === filtre)?.test
    const terme = q.trim().toLowerCase()
    return entrees.filter((e) => {
      if (test && !test(e)) return false
      if (!terme) return true
      const champs = [e.nom, e.sousTitre ?? '', ...(e.motsCles ?? [])]
      return champs.some((c) => c.toLowerCase().includes(terme))
    })
  }, [entrees, filtres, filtre, q])

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {actionPrincipale && (
        <div className="px-3 pb-3">
          <Link
            href={actionPrincipale.href}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[6px] bg-p-700 text-[13px] font-semibold text-white transition-colors hover:bg-p-600"
          >
            <Plus size={14} />
            {actionPrincipale.libelle}
          </Link>
        </div>
      )}

      {filtres && filtres.length > 1 && (
        <div
          role="tablist"
          aria-label={`Filtrer ${titre.toLowerCase()}`}
          className="mx-3 mb-2.5 flex rounded-[6px] bg-g-100 p-0.5"
        >
          {filtres.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={f.id === filtre}
              onClick={() => setFiltre(f.id)}
              className={cn(
                'flex-1 rounded-[5px] px-2 py-1 text-[11.5px] font-semibold transition-colors',
                f.id === filtre
                  ? 'bg-white text-p-700 shadow-[0_1px_2px_rgba(43,27,77,.06)]'
                  : 'text-g-500 hover:text-g-700',
              )}
            >
              {f.libelle}
            </button>
          ))}
        </div>
      )}

      <div className="relative mx-3 mb-2">
        <Search
          size={13}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-g-500"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholderRecherche}
          aria-label={placeholderRecherche}
          className="h-8 w-full rounded-[6px] border border-g-300 bg-white pl-7 pr-2 text-[12.5px] text-ink outline-none transition-colors placeholder:text-g-500 focus:border-p-400"
        />
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
        {visibles.length === 0 ? (
          <li className="px-2 py-6 text-center text-[12px] text-g-500">
            Aucune entrée ne correspond.
          </li>
        ) : (
          visibles.map((e) => {
            const actif = e.id === actifId
            return (
              <li key={e.id}>
                <Link
                  href={e.href}
                  aria-current={actif ? 'page' : undefined}
                  className={cn(
                    'flex items-start gap-2 rounded-[6px] px-2 py-2 transition-colors',
                    actif ? 'bg-white shadow-[0_1px_2px_rgba(43,27,77,.08)]' : 'hover:bg-white/70',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'mt-0.5 h-8 w-[2px] shrink-0 rounded-full',
                      actif ? 'bg-p-700' : 'bg-transparent',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate text-[12.5px]',
                        actif ? 'font-bold text-p-700' : 'font-semibold text-ink',
                      )}
                    >
                      {e.nom}
                    </span>
                    {e.sousTitre && (
                      <span className="block truncate text-[11px] leading-snug text-g-500">
                        {e.sousTitre}
                      </span>
                    )}
                  </span>
                  {e.etat && (
                    <Badge tone={e.ton ?? 'neutral'} size="sm" className="mt-0.5 shrink-0">
                      {e.etat}
                    </Badge>
                  )}
                </Link>
              </li>
            )
          })
        )}
      </ul>

      <div className="border-t border-g-300 px-3 py-2">
        <p className="tnum text-[11px] text-g-500">
          {compteur
            ? compteur(visibles.length, entrees.length)
            : `${visibles.length} sur ${entrees.length}`}
        </p>
        {lienBas && (
          <Link
            href={lienBas.href}
            className="mt-0.5 block text-[11.5px] font-semibold text-p-700 hover:text-m-600"
          >
            {lienBas.libelle} →
          </Link>
        )}
      </div>
    </div>
  )
}

/**
 * Version repliable du panneau, pour les écrans étroits : le sélecteur devient
 * un bandeau dépliant au-dessus du contenu plutôt qu'une colonne.
 */
export function SelecteurRepliable({
  titre,
  nomActif,
  children,
}: {
  titre: string
  nomActif?: string
  children: React.ReactNode
}) {
  const [ouvert, setOuvert] = useState(false)
  return (
    <div className="border-b border-g-300 bg-p-050 lg:hidden">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left"
      >
        <span className="min-w-0">
          <span className="type-micro block text-g-500">{titre}</span>
          <span className="block truncate text-[13px] font-bold text-ink">
            {nomActif ?? 'Choisir'}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-g-500 transition-transform', ouvert && 'rotate-180')}
        />
      </button>
      {ouvert && <div className="max-h-[60vh] border-t border-g-300 pt-3">{children}</div>}
    </div>
  )
}
