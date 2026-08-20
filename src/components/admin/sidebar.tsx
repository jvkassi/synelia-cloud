'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  ArrowLeftRight,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  Gauge,
  Globe2,
  LayoutDashboard,
  LifeBuoy,
  Percent,
  ScrollText,
  Server,
  ShoppingBag,
  Store,
  Tags,
  Users,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { pct } from '@/lib/format'
import { SYNTHESE_PLATEFORME } from '@/lib/mock'

const GROUPES = [
  {
    titre: 'Pilotage',
    entrees: [
      { nom: 'Vue plateforme', href: '/admin', icone: <LayoutDashboard size={15} /> },
      { nom: 'Santé du parc', href: '/admin/sante', icone: <Activity size={15} /> },
    ],
  },
  {
    titre: 'Clients',
    entrees: [
      { nom: 'Organisations', href: '/admin/organisations', icone: <Building2 size={15} /> },
      { nom: 'Revendeurs', href: '/admin/revendeurs', icone: <Store size={15} /> },
    ],
  },
  {
    titre: 'Infrastructure',
    entrees: [
      { nom: 'Capacité & backends', href: '/admin/capacite', icone: <Server size={15} /> },
      { nom: 'Sites & zones', href: '/admin/sites', icone: <Globe2 size={15} /> },
      { nom: 'Migration inter-backend', href: '/admin/migration', icone: <ArrowLeftRight size={15} /> },
    ],
  },
  {
    titre: 'Produit',
    entrees: [
      { nom: "Catalogue d'offres", href: '/admin/catalogue', icone: <Tags size={15} /> },
      { nom: 'Marketplace', href: '/admin/marketplace', icone: <ShoppingBag size={15} /> },
    ],
  },
  {
    titre: 'Finance',
    entrees: [
      { nom: 'Facturation & marge', href: '/admin/facturation', icone: <Wallet size={15} /> },
      { nom: 'Revshare partenaires', href: '/admin/revshare', icone: <Percent size={15} /> },
    ],
  },
  {
    titre: 'Exploitation',
    entrees: [
      { nom: 'Tickets', href: '/admin/tickets', icone: <LifeBuoy size={15} /> },
      { nom: 'Audit', href: '/admin/audit', icone: <ScrollText size={15} /> },
      { nom: 'Conformité', href: '/admin/conformite', icone: <ClipboardCheck size={15} /> },
      { nom: 'Équipe & rôles', href: '/admin/equipe', icone: <Users size={15} /> },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const actif = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`)

  const chargeVcpu = Math.round(
    (SYNTHESE_PLATEFORME.vcpuUtilise / SYNTHESE_PLATEFORME.vcpuTotal) * 100,
  )

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 flex-col border-r border-white/10 bg-p-900 lg:flex">
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {GROUPES.map((g) => (
          <div key={g.titre} className="mb-4 last:mb-0">
            <p className="type-micro px-2 pb-1.5 text-p-400">{g.titre}</p>
            <ul className="space-y-0.5">
              {g.entrees.map((e) => (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-[6px] px-2 py-[7px] text-[12.5px] font-medium transition-colors',
                      actif(e.href)
                        ? 'bg-white/12 text-white'
                        : 'text-p-300 hover:bg-white/8 hover:text-white',
                    )}
                  >
                    <span className="shrink-0">{e.icone}</span>
                    <span className="truncate">{e.nom}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <div className="flex items-center justify-between">
          <span className="type-micro text-p-400">Charge plateforme</span>
          <span className="tnum text-[12px] font-bold text-white">{pct(chargeVcpu)}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/12">
          <div
            className={cn(
              'h-full rounded-full',
              chargeVcpu > 85 ? 'bg-err' : chargeVcpu > 70 ? 'bg-warn' : 'bg-ok',
            )}
            style={{ width: `${chargeVcpu}%` }}
          />
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-[11px] text-p-300">
          <Gauge size={12} />
          {SYNTHESE_PLATEFORME.backendsEnLigne}/{SYNTHESE_PLATEFORME.backendsTotal} backends en ligne
        </div>
        <Link
          href="/app"
          className="mt-2.5 flex items-center gap-1.5 border-t border-white/10 pt-2.5 text-[11.5px] font-semibold text-p-300 transition-colors hover:text-white"
        >
          <BadgeCheck size={12} />
          Basculer vers l’espace client
        </Link>
      </div>
    </aside>
  )
}

export function AdminMobileNav() {
  const pathname = usePathname()
  const entrees = [
    { nom: 'Plateforme', href: '/admin', icone: <LayoutDashboard size={17} /> },
    { nom: 'Clients', href: '/admin/organisations', icone: <Building2 size={17} /> },
    { nom: 'Capacité', href: '/admin/capacite', icone: <Server size={17} /> },
    { nom: 'Produit', href: '/admin/catalogue', icone: <Tags size={17} /> },
    { nom: 'Finance', href: '/admin/facturation', icone: <Wallet size={17} /> },
    { nom: 'Audit', href: '/admin/audit', icone: <ScrollText size={17} /> },
  ]
  return (
    <nav className="sticky bottom-0 z-30 flex border-t border-white/10 bg-p-900 lg:hidden">
      {entrees.map((e) => {
        const actif = e.href === '/admin' ? pathname === '/admin' : pathname.startsWith(e.href)
        return (
          <Link
            key={e.href}
            href={e.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors',
              actif ? 'text-white' : 'text-p-400',
            )}
          >
            {e.icone}
            {e.nom}
          </Link>
        )
      })}
    </nav>
  )
}
