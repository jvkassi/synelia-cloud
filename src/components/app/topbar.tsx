'use client'

import Link from 'next/link'
import {
  Bell,
  Building2,
  CircleUser,
  ListChecks,
  LogOut,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { relatif } from '@/lib/format'
import { ROLE_LABEL, type Role } from '@/lib/types'
import { ROLES_CLIENT, ROLES_FOURNISSEUR } from '@/lib/rbac'
import { MES_ORGANISATIONS, ORG_COURANTE, UTILISATEUR_COURANT } from '@/lib/mock/orgs'
import { JOBS, JOBS_PLATEFORME } from '@/lib/mock/ops'
import { Avatar } from '@/components/ui/display'
import { Badge } from '@/components/ui/badge'
import { Popover } from '@/components/ui/overlay'
import { Logo, BadgeFournisseur } from '@/components/brand/logo'
import { RechercheGlobale } from './recherche'
import { useApp } from './contexte'

const NOTIFICATIONS = [
  {
    id: 'n1',
    titre: 'Certificat TLS expiré sur api.dba.africa',
    detail: 'Ticket TCK-4471 ouvert en gravité critique',
    ts: '2026-08-19T13:12:00Z',
    ton: 'err' as const,
  },
  {
    id: 'n2',
    titre: 'Mise à jour Grommunio 2026.02.1 disponible',
    detail: 'Email Pro · fenêtre proposée le 24/08 à 22:00',
    ts: '2026-08-19T09:04:00Z',
    ton: 'accent' as const,
  },
  {
    id: 'n3',
    titre: 'Sauvegarde échouée sur GED · Mayan',
    detail: 'Instance en cours de provisioning',
    ts: '2026-08-19T08:02:00Z',
    ton: 'warn' as const,
  },
  {
    id: 'n4',
    titre: 'Quota stockage à 89 % sur EC-DBA-01',
    detail: '7,1 To sur 8 To — devis DEV-0418 en attente',
    ts: '2026-08-19T07:40:00Z',
    ton: 'warn' as const,
  },
  {
    id: 'n5',
    titre: 'Déploiement réussi · app-metier v2.7.1',
    detail: 'Production · canari 10 % → 100 %',
    ts: '2026-08-19T15:08:00Z',
    ton: 'ok' as const,
  },
]

export function TopBar({ portee = 'client' }: { portee?: 'client' | 'fournisseur' }) {
  const { role, setRole } = useApp()
  const sombre = portee === 'fournisseur'
  const jobs = sombre ? JOBS_PLATEFORME : JOBS
  const enCours = jobs.filter((j) => j.statut === 'running' || j.statut === 'queued')
  const echecs = jobs.filter((j) => j.statut === 'failed')
  const roles = sombre ? ROLES_FOURNISSEUR : ROLES_CLIENT

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-3 sm:px-4',
        sombre ? 'border-white/10 bg-p-900' : 'border-g-300 bg-white',
      )}
    >
      <Link href={sombre ? '/admin' : '/app'} className="flex shrink-0 items-center gap-2">
        <Logo variante={sombre ? 'sombre' : 'clair'} size={26} />
        {sombre && <BadgeFournisseur />}
      </Link>

      {!sombre && (
        <Popover
          align="left"
          width="w-72"
          trigger={() => (
            <span className="hidden items-center gap-2 rounded-[6px] border border-g-300 px-2.5 py-1.5 text-[12.5px] font-semibold text-g-700 transition-colors hover:border-p-400 hover:bg-p-050 md:flex">
              <Building2 size={13} className="text-p-700" />
              <span className="max-w-40 truncate">{ORG_COURANTE.nom}</span>
            </span>
          )}
        >
          {(close) => (
            <div className="p-2">
              <p className="type-micro px-2 py-1.5 text-g-500">Mes organisations</p>
              {MES_ORGANISATIONS.map((m) => (
                <Link
                  key={m.org.id}
                  href="/app"
                  onClick={close}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-[6px] px-2 py-2 transition-colors hover:bg-p-050',
                    m.org.id === ORG_COURANTE.id && 'bg-p-050',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-ink">
                      {m.org.nom}
                    </span>
                    <span className="block text-[11.5px] text-g-500">{ROLE_LABEL[m.role]}</span>
                  </span>
                  {m.org.id === ORG_COURANTE.id && (
                    <Badge tone="violet" size="sm">
                      Actuelle
                    </Badge>
                  )}
                </Link>
              ))}
              <Link
                href="/select-organisation"
                onClick={close}
                className="mt-1 block border-t border-g-100 px-2 pt-2 text-[12px] font-semibold text-p-700 hover:text-m-600"
              >
                Voir toutes les organisations →
              </Link>
            </div>
          )}
        </Popover>
      )}

      <div className="flex flex-1 justify-center">
        <RechercheGlobale portee={portee} />
      </div>

      {/* Centre de tâches (§1.6) */}
      <Popover
        width="w-80"
        trigger={() => (
          <span
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-[6px] transition-colors',
              sombre ? 'text-p-300 hover:bg-white/10' : 'text-g-500 hover:bg-g-100',
            )}
            title="Centre de tâches"
          >
            <ListChecks size={16} />
            {enCours.length > 0 && (
              <span className="tnum absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-p-600 px-1 text-[9.5px] font-bold text-white">
                {enCours.length}
              </span>
            )}
          </span>
        )}
      >
        {(close) => (
          <div>
            <div className="flex items-center justify-between border-b border-g-100 px-3 py-2.5">
              <p className="text-[13px] font-bold text-ink">Centre de tâches</p>
              <span className="tnum text-[11.5px] text-g-500">
                {enCours.length} en cours · {echecs.length} en échec
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {jobs.slice(0, 6).map((j) => {
                const faites = j.taches.filter((t) => t.statut === 'ok').length
                return (
                  <Link
                    key={j.id}
                    href={sombre ? '/admin' : `/app/taches/${j.id}`}
                    onClick={close}
                    className="block px-3 py-2 transition-colors hover:bg-p-050"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">
                        {j.label}
                      </p>
                      <Badge
                        size="sm"
                        tone={
                          j.statut === 'done'
                            ? 'ok'
                            : j.statut === 'failed'
                              ? 'err'
                              : j.statut === 'rolled_back'
                                ? 'warn'
                                : 'info'
                        }
                      >
                        {
                          {
                            queued: 'En file',
                            running: 'En cours',
                            done: 'Prêt',
                            failed: 'Échec',
                            rolled_back: 'Restauré',
                          }[j.statut]
                        }
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-g-100">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            j.statut === 'failed' ? 'bg-err' : 'bg-p-600',
                          )}
                          style={{ width: `${(faites / j.taches.length) * 100}%` }}
                        />
                      </div>
                      <span className="tnum shrink-0 text-[10.5px] text-g-500">
                        {faites}/{j.taches.length}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </Popover>

      {/* Notifications */}
      <Popover
        width="w-80"
        trigger={() => (
          <span
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-[6px] transition-colors',
              sombre ? 'text-p-300 hover:bg-white/10' : 'text-g-500 hover:bg-g-100',
            )}
            title="Notifications"
          >
            <Bell size={16} />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-m-600" />
          </span>
        )}
      >
        <div>
          <div className="border-b border-g-100 px-3 py-2.5">
            <p className="text-[13px] font-bold text-ink">Notifications</p>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-g-100">
            {NOTIFICATIONS.map((n) => (
              <div key={n.id} className="px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                      {
                        ok: 'bg-ok',
                        warn: 'bg-warn',
                        err: 'bg-err',
                        accent: 'bg-m-600',
                      }[n.ton],
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium leading-snug text-ink">{n.titre}</p>
                    <p className="mt-0.5 text-[11.5px] text-g-500">{n.detail}</p>
                    <p className="mt-0.5 text-[10.5px] text-g-500">{relatif(n.ts)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Popover>

      {/* Sélecteur de rôle simulé (§4.1) */}
      <Popover
        width="w-64"
        trigger={() => (
          <span
            className={cn(
              'hidden items-center gap-1.5 rounded-[6px] border px-2 py-1.5 text-[11.5px] font-semibold transition-colors sm:flex',
              sombre
                ? 'border-white/15 bg-white/10 text-p-300 hover:bg-white/15'
                : 'border-g-300 text-g-700 hover:border-p-400 hover:bg-p-050',
            )}
            title="Rôle simulé"
          >
            <ShieldCheck size={12} />
            <span className="max-w-32 truncate">{ROLE_LABEL[role]}</span>
          </span>
        )}
      >
        {(close) => (
          <div className="p-2">
            <p className="type-micro px-2 py-1.5 text-g-500">Rôle simulé</p>
            <p className="px-2 pb-2 text-[11.5px] leading-snug text-g-500">
              Change les droits appliqués à l’interface. Les actions interdites restent visibles,
              désactivées, avec le rôle requis en infobulle.
            </p>
            <div className="max-h-64 overflow-y-auto">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r as Role)
                    close()
                  }}
                  className={cn(
                    'block w-full rounded-[6px] px-2 py-1.5 text-left text-[12.5px] transition-colors hover:bg-p-050',
                    r === role ? 'bg-p-050 font-semibold text-p-700' : 'text-ink',
                  )}
                >
                  {ROLE_LABEL[r as Role]}
                </button>
              ))}
            </div>
          </div>
        )}
      </Popover>

      {/* Avatar et menu */}
      <Popover
        width="w-64"
        trigger={() => (
          <span className="block">
            <Avatar nom={UTILISATEUR_COURANT.nom} size="sm" />
          </span>
        )}
      >
        {(close) => (
          <div className="p-2">
            <div className="flex items-center gap-2.5 border-b border-g-100 px-2 pb-2.5">
              <Avatar nom={UTILISATEUR_COURANT.nom} size="md" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">
                  {UTILISATEUR_COURANT.nom}
                </p>
                <p className="truncate text-[11.5px] text-g-500">{UTILISATEUR_COURANT.email}</p>
              </div>
            </div>
            <div className="pt-1.5">
              <MenuLien href="/app/lanceur" onClick={close} icone={<CircleUser size={13} />}>
                Lanceur d’applications
              </MenuLien>
              <MenuLien href="/app/parametres" onClick={close} icone={<Settings size={13} />}>
                Préférences
              </MenuLien>
              <MenuLien href="/app/securite" onClick={close} icone={<ShieldCheck size={13} />}>
                Sécurité & sessions
              </MenuLien>
              <MenuLien href="/login" onClick={close} icone={<LogOut size={13} />}>
                Se déconnecter
              </MenuLien>
            </div>
          </div>
        )}
      </Popover>
    </header>
  )
}

function MenuLien({
  href,
  children,
  icone,
  onClick,
}: {
  href: string
  children: string
  icone: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[12.5px] text-ink transition-colors hover:bg-p-050"
    >
      <span className="text-g-500">{icone}</span>
      {children}
    </Link>
  )
}
