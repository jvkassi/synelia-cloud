'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MEGAMENU } from '@/lib/mock/vitrine'
import { Logo } from '@/components/brand/logo'
import { ButtonLink } from '@/components/ui/button'

const RESSOURCES = [
  { nom: 'Ressources', href: '/ressources', resume: 'Livres blancs, guides, webinaires, études.' },
  { nom: 'Documentation', href: '/docs', resume: 'Documentation technique et utilisateur, en français.' },
  { nom: 'Datacenters', href: '/datacenters', resume: 'Fiche par site : alimentation, refroidissement, connectivité.' },
  { nom: 'Souveraineté', href: '/souverainete', resume: 'Les trois niveaux, et notre position sur chacun.' },
  { nom: 'État des services', href: '/statut', resume: 'Disponibilité par service et par site, incidents en cours.' },
  { nom: 'Simulateur', href: '/simulateur', resume: 'Estimez votre budget, comparez à votre facture actuelle.' },
]

export function SiteHeader() {
  const [defile, setDefile] = useState(false)
  const [menu, setMenu] = useState<'produits' | 'ressources' | null>(null)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const onScroll = () => setDefile(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b bg-white transition-shadow',
        defile ? 'border-g-300 shadow-[0_1px_12px_rgba(43,27,77,.08)]' : 'border-transparent',
      )}
      onMouseLeave={() => setMenu(null)}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          <button
            type="button"
            onMouseEnter={() => setMenu('produits')}
            onClick={() => setMenu((m) => (m === 'produits' ? null : 'produits'))}
            className={cn(
              'flex items-center gap-1 rounded-[6px] px-3 py-2 text-[13.5px] font-semibold transition-colors',
              menu === 'produits' ? 'bg-p-050 text-p-700' : 'text-g-700 hover:text-p-700',
            )}
          >
            Produits
            <ChevronDown size={13} className={cn('transition-transform', menu === 'produits' && 'rotate-180')} />
          </button>
          <LienNav href="/marketplace">Marketplace</LienNav>
          <LienNav href="/tarifs">Tarifs</LienNav>
          <LienNav href="/entreprises">Entreprises</LienNav>
          <button
            type="button"
            onMouseEnter={() => setMenu('ressources')}
            onClick={() => setMenu((m) => (m === 'ressources' ? null : 'ressources'))}
            className={cn(
              'flex items-center gap-1 rounded-[6px] px-3 py-2 text-[13.5px] font-semibold transition-colors',
              menu === 'ressources' ? 'bg-p-050 text-p-700' : 'text-g-700 hover:text-p-700',
            )}
          >
            Ressources
            <ChevronDown size={13} className={cn('transition-transform', menu === 'ressources' && 'rotate-180')} />
          </button>
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
          <ButtonLink href="/login" variant="secondary" size="md">
            Se connecter
          </ButtonLink>
          <ButtonLink href="/signup" size="md">
            Créer un compte
          </ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setMobile((v) => !v)}
          aria-label="Ouvrir le menu"
          className="ml-auto rounded-[6px] p-2 text-g-700 lg:hidden"
        >
          {mobile ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mégamenu Produits — quatre colonnes (§2.1) */}
      {menu === 'produits' && (
        <div className="absolute inset-x-0 top-full hidden animate-fade-in border-b border-g-300 bg-white shadow-[0_16px_40px_rgba(43,27,77,.12)] lg:block">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 py-7 md:grid-cols-4">
            {MEGAMENU.map((col) => (
              <div key={col.colonne}>
                <p className="type-micro mb-3 text-m-600">{col.colonne}</p>
                <ul className="space-y-2.5">
                  {col.entrees.map((e) => (
                    <li key={e.slug}>
                      <Link
                        href={`/offres/${e.slug}`}
                        onClick={() => setMenu(null)}
                        className="group block"
                      >
                        <span className="block text-[13px] font-semibold text-ink group-hover:text-p-700">
                          {e.nom}
                        </span>
                        <span className="block text-[11.5px] leading-snug text-g-500">
                          {e.resume}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-g-100 bg-g-050">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
              <p className="text-[12.5px] text-g-700">
                Solutions open source, opérées par Synelia, réversibles. Hébergées à Abidjan et
                Grand-Bassam.
              </p>
              <Link
                href="/simulateur"
                onClick={() => setMenu(null)}
                className="whitespace-nowrap text-[12.5px] font-semibold text-p-700 hover:text-m-600"
              >
                Estimer mon budget →
              </Link>
            </div>
          </div>
        </div>
      )}

      {menu === 'ressources' && (
        <div className="absolute inset-x-0 top-full hidden animate-fade-in border-b border-g-300 bg-white shadow-[0_16px_40px_rgba(43,27,77,.12)] lg:block">
          <div className="mx-auto grid max-w-4xl gap-x-8 gap-y-3.5 px-6 py-7 md:grid-cols-2">
            {RESSOURCES.map((r) => (
              <Link key={r.href} href={r.href} onClick={() => setMenu(null)} className="group block">
                <span className="block text-[13px] font-semibold text-ink group-hover:text-p-700">
                  {r.nom}
                </span>
                <span className="block text-[11.5px] leading-snug text-g-500">{r.resume}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Navigation mobile */}
      {mobile && (
        <div className="max-h-[calc(100vh-72px)] overflow-y-auto border-t border-g-300 bg-white px-4 py-4 lg:hidden">
          <div className="space-y-4">
            {MEGAMENU.map((col) => (
              <div key={col.colonne}>
                <p className="type-micro mb-1.5 text-m-600">{col.colonne}</p>
                <ul className="space-y-1">
                  {col.entrees.map((e) => (
                    <li key={e.slug}>
                      <Link
                        href={`/offres/${e.slug}`}
                        onClick={() => setMobile(false)}
                        className="block py-1 text-[13px] text-ink"
                      >
                        {e.nom}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="border-t border-g-100 pt-3">
              <p className="type-micro mb-1.5 text-m-600">Explorer</p>
              <ul className="space-y-1">
                {[
                  { nom: 'Marketplace', href: '/marketplace' },
                  { nom: 'Tarifs', href: '/tarifs' },
                  { nom: 'Entreprises', href: '/entreprises' },
                  ...RESSOURCES,
                ].map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      onClick={() => setMobile(false)}
                      className="block py-1 text-[13px] text-ink"
                    >
                      {r.nom}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2 border-t border-g-100 pt-4">
              <ButtonLink href="/login" variant="secondary" fullWidth>
                Se connecter
              </ButtonLink>
              <ButtonLink href="/signup" fullWidth>
                Créer un compte
              </ButtonLink>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function LienNav({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="rounded-[6px] px-3 py-2 text-[13.5px] font-semibold text-g-700 transition-colors hover:text-p-700"
    >
      {children}
    </Link>
  )
}
