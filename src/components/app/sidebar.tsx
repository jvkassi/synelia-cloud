'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Activity,
  AppWindow,
  Archive,
  BarChart3,
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CloudCog,
  Container,
  CreditCard,
  Database,
  FileText,
  Globe,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Network,
  Rocket,
  Scale,
  Server,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { money } from '@/lib/format'
import { ESPACES } from '@/lib/mock/iaas'
import { SYNTHESE_CLIENT } from '@/lib/mock'
import { QuotaBar } from '@/components/composition/metrics'
import { useApp } from './contexte'

interface Entree {
  nom: string
  href: string
  icone: React.ReactNode
}

const GROUPES: Array<{ titre: string; contexteEspace?: boolean; entrees: Entree[] }> = [
  {
    titre: "Vue d'ensemble",
    entrees: [{ nom: 'Tableau de bord', href: '/app', icone: <LayoutDashboard size={15} /> }],
  },
  {
    titre: 'Infrastructure',
    contexteEspace: true,
    entrees: [
      { nom: 'Espaces Cloud', href: '/app/espaces', icone: <CloudCog size={15} /> },
      { nom: 'Machines virtuelles', href: '/app/vms', icone: <Server size={15} /> },
      { nom: 'Kubernetes', href: '/app/kubernetes', icone: <Container size={15} /> },
      { nom: 'Réseau & IP', href: '/app/reseau', icone: <Network size={15} /> },
      { nom: 'Load balancers', href: '/app/reseau/lb', icone: <Scale size={15} /> },
      { nom: 'Stockage', href: '/app/stockage', icone: <HardDrive size={15} /> },
      { nom: 'Stockage objet S3', href: '/app/objet', icone: <Archive size={15} /> },
      { nom: 'Bases managées', href: '/app/bases', icone: <Database size={15} /> },
      { nom: 'Sauvegardes', href: '/app/sauvegarde', icone: <Boxes size={15} /> },
      { nom: 'Plan de reprise (PRA)', href: '/app/pra', icone: <ShieldCheck size={15} /> },
      { nom: 'Supervision', href: '/app/observabilite', icone: <Activity size={15} /> },
    ],
  },
  {
    titre: 'Plateforme applicative',
    entrees: [
      { nom: 'Applications', href: '/app/apps', icone: <Rocket size={15} /> },
      { nom: 'Déploiements', href: '/app/deploiements', icone: <Sparkles size={15} /> },
      { nom: "Registre d'images", href: '/app/registre', icone: <Boxes size={15} /> },
    ],
  },
  {
    titre: 'Services & web',
    entrees: [
      { nom: 'Marketplace', href: '/app/marketplace', icone: <ShoppingBag size={15} /> },
      { nom: 'Mes services', href: '/app/services', icone: <AppWindow size={15} /> },
      { nom: "Lanceur d'applications", href: '/app/lanceur', icone: <Sparkles size={15} /> },
      { nom: 'Hébergements web', href: '/app/web', icone: <Globe size={15} /> },
      { nom: 'Domaines & DNS', href: '/app/domaines', icone: <Globe size={15} /> },
      { nom: 'Relais SMTP', href: '/app/smtp', icone: <Mail size={15} /> },
    ],
  },
  {
    titre: 'Organisation',
    entrees: [
      { nom: 'Utilisateurs & rôles', href: '/app/membres', icone: <Users size={15} /> },
      { nom: "Fédération d'identité", href: '/app/sso', icone: <KeyRound size={15} /> },
      { nom: 'Sécurité & audit', href: '/app/securite', icone: <ShieldCheck size={15} /> },
      { nom: 'Facturation', href: '/app/facturation', icone: <CreditCard size={15} /> },
      { nom: 'Support & SLA', href: '/app/support', icone: <LifeBuoy size={15} /> },
      { nom: 'Documentation', href: '/app/docs', icone: <BookOpen size={15} /> },
      { nom: 'Paramètres', href: '/app/parametres', icone: <Settings size={15} /> },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [replie, setReplie] = useState(false)
  const { espaceId, setEspaceId } = useApp()

  const actif = (href: string) =>
    href === '/app' ? pathname === '/app' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <aside
      className={cn(
        'sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col border-r border-g-300 bg-p-050 transition-[width] duration-200 lg:flex',
        replie ? 'w-16' : 'w-64',
      )}
    >
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {GROUPES.map((g) => (
          <div key={g.titre} className="mb-4 last:mb-0">
            {!replie && (
              <p className="type-micro px-2 pb-1.5 text-g-500">{g.titre}</p>
            )}
            {replie && <div className="mx-2 mb-2 border-t border-g-300" />}

            {/* Sélecteur d'Espace Cloud épinglé en tête du groupe (§4.1) */}
            {g.contexteEspace && !replie && (
              <div className="mb-1.5 px-1">
                <div className="relative">
                  <select
                    aria-label="Espace Cloud"
                    value={espaceId}
                    onChange={(e) => setEspaceId(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-[6px] border border-p-300 bg-white px-2.5 py-1.5 pr-7 font-mono text-[12px] font-semibold text-p-700 outline-none transition-colors hover:border-p-600"
                  >
                    {ESPACES.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.code} · {e.site}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-p-600"
                  />
                </div>
              </div>
            )}

            <ul className="space-y-0.5">
              {g.entrees.map((e) => (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    title={replie ? e.nom : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-[6px] px-2 py-[7px] text-[12.5px] font-medium transition-colors',
                      actif(e.href)
                        ? 'bg-p-700 text-white'
                        : 'text-g-700 hover:bg-white hover:text-p-700',
                      replie && 'justify-center',
                    )}
                  >
                    <span className="shrink-0">{e.icone}</span>
                    {!replie && <span className="truncate">{e.nom}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pied de barre : consommation du mois (§4.1) */}
      <div className="border-t border-g-300 bg-white px-3 py-3">
        {replie ? (
          <button
            type="button"
            onClick={() => setReplie(false)}
            aria-label="Déplier la barre latérale"
            className="flex w-full items-center justify-center rounded-[6px] py-1.5 text-g-500 hover:bg-g-100"
          >
            <ChevronsRight size={15} />
          </button>
        ) : (
          <>
            <QuotaBar
              libelle="Consommation du mois"
              utilise={SYNTHESE_CLIENT.depenseMois}
              total={SYNTHESE_CLIENT.previsionMois}
              seuil={90}
              compact
              formateur={(v) => money(v)}
            />
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <Link
                href="/app/facturation"
                className="text-[11.5px] font-semibold text-p-700 hover:text-m-600"
              >
                Voir la facturation →
              </Link>
              <button
                type="button"
                onClick={() => setReplie(true)}
                aria-label="Replier la barre latérale"
                className="rounded p-1 text-g-500 hover:bg-g-100"
              >
                <ChevronsLeft size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

/** Navigation mobile compacte pour l'espace client. */
export function MobileNav() {
  const pathname = usePathname()
  const entrees = [
    { nom: 'Bord', href: '/app', icone: <LayoutDashboard size={17} /> },
    { nom: 'Infra', href: '/app/espaces', icone: <CloudCog size={17} /> },
    { nom: 'Apps', href: '/app/apps', icone: <Rocket size={17} /> },
    { nom: 'Services', href: '/app/services', icone: <AppWindow size={17} /> },
    { nom: 'Factures', href: '/app/facturation', icone: <BarChart3 size={17} /> },
    { nom: 'Support', href: '/app/support', icone: <FileText size={17} /> },
  ]
  return (
    <nav className="sticky bottom-0 z-30 flex border-t border-g-300 bg-white lg:hidden">
      {entrees.map((e) => {
        const actif = e.href === '/app' ? pathname === '/app' : pathname.startsWith(e.href)
        return (
          <Link
            key={e.href}
            href={e.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors',
              actif ? 'text-p-700' : 'text-g-500',
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
