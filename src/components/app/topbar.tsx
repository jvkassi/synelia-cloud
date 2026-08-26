'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  Building2,
  ChevronDown,
  CircleUser,
  CloudCog,
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
import { ESPACES } from '@/lib/mock/iaas'
import { JOBS, JOBS_PLATEFORME } from '@/lib/mock/ops'
import { LIBELLE_STATUT, TON_STATUT, porteeDuJob } from '@/lib/workflows'
import {
  UNIVERS_CLIENT,
  UNIVERS_FOURNISSEUR,
  sectionActive,
  universActif,
  type UniversNav,
} from '@/lib/navigation'
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

/**
 * Navigation du portail, en deux barres (§4.1).
 *
 * La première porte les univers, la seconde les sections de l'univers courant.
 * Il n'y a plus de barre latérale : un seul chemin mène à un écran, et le
 * contenu occupe toute la largeur disponible.
 */
export function TopBar({ portee = 'client' }: { portee?: 'client' | 'fournisseur' }) {
  const pathname = usePathname()
  const univers = portee === 'client' ? UNIVERS_CLIENT : UNIVERS_FOURNISSEUR
  const courant = universActif(univers, pathname)

  return (
    <div className="sticky top-0 z-30">
      <BarreUnivers portee={portee} univers={univers} courant={courant} />
      <BarreSections portee={portee} univers={courant} />
    </div>
  )
}

// ─── Barre 1 : les univers ─────────────────────────────────────────────

function BarreUnivers({
  portee,
  univers,
  courant,
}: {
  portee: 'client' | 'fournisseur'
  univers: UniversNav[]
  courant: UniversNav
}) {
  const fournisseur = portee === 'fournisseur'
  const racine = fournisseur ? '/admin' : '/app'

  return (
    <header className="flex h-14 items-center gap-2 border-b border-white/10 bg-p-900 px-3 sm:px-4">
      <Link href={racine} className="flex shrink-0 items-center gap-2">
        <Logo variante="sombre" size={26} compact />
        {fournisseur && <BadgeFournisseur />}
      </Link>

      {/* Univers — bande déroulante sur grand écran, liste dépliante en dessous */}
      <nav
        aria-label="Univers"
        className="no-scrollbar hidden min-w-0 flex-1 self-stretch overflow-x-auto lg:block"
      >
        <ul className="flex h-full min-w-max items-stretch">
          {univers.map((u) => (
            <li key={u.id} className="flex">
              <Link
                href={u.sections[0].href}
                className={cn(
                  'flex items-center whitespace-nowrap px-3.5 text-[13px] font-semibold transition-colors',
                  u.id === courant.id
                    ? 'bg-white text-p-900'
                    : 'text-p-300 hover:bg-white/10 hover:text-white',
                )}
              >
                {u.nom}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 flex-1 lg:hidden">
        <Popover
          align="left"
          width="w-64"
          label="Changer d’univers"
          trigger={() => (
            <span className="flex max-w-full items-center gap-1.5 rounded-[6px] bg-white/10 px-2.5 py-1.5 text-[12.5px] font-semibold text-white">
              <span className="truncate">{courant.nom}</span>
              <ChevronDown size={13} className="shrink-0 text-p-300" />
            </span>
          )}
        >
          {(close) => (
            <div className="p-2">
              <p className="type-micro px-2 py-1.5 text-g-500">Univers</p>
              {univers.map((u) => (
                <Link
                  key={u.id}
                  href={u.sections[0].href}
                  onClick={close}
                  className={cn(
                    'block rounded-[6px] px-2 py-2 text-[13px] transition-colors hover:bg-p-050',
                    u.id === courant.id ? 'bg-p-050 font-semibold text-p-700' : 'text-ink',
                  )}
                >
                  {u.nom}
                  <span className="ml-1.5 text-[11px] text-g-500">
                    {u.sections.length} section{u.sections.length > 1 ? 's' : ''}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Popover>
      </div>

      {!fournisseur && <SelecteurContexte />}

      <RechercheGlobale portee={portee} />

      <CentreDeTaches fournisseur={fournisseur} />

      <NotificationsPopover />

      <MenuCompte fournisseur={fournisseur} />
    </header>
  )
}

// ─── Barre 2 : les sections de l'univers courant ───────────────────────

function BarreSections({
  portee,
  univers,
}: {
  portee: 'client' | 'fournisseur'
  univers: UniversNav
}) {
  const pathname = usePathname()
  const active = sectionActive(
    portee === 'client' ? UNIVERS_CLIENT : UNIVERS_FOURNISSEUR,
    pathname,
  )?.section

  return (
    <nav
      aria-label={`Sections — ${univers.nom}`}
      className={cn(
        'no-scrollbar overflow-x-auto border-b border-g-300',
        // Fond légèrement teinté côté fournisseur : les deux espaces partagent
        // désormais la même barre supérieure, il faut un repère de plus.
        portee === 'fournisseur' ? 'bg-p-050' : 'bg-white',
      )}
    >
      <ul className="mx-auto flex min-w-max max-w-[1400px] items-stretch px-2 sm:px-4">
        {univers.sections.map((s) => (
          <li key={s.href} className="flex">
            <Link
              href={s.href}
              className={cn(
                'relative flex items-center whitespace-nowrap px-3 py-2.5 text-[12.5px] font-semibold transition-colors',
                s.href === active?.href
                  ? 'text-p-700 after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:bg-p-700'
                  : 'text-g-500 hover:text-g-700',
              )}
            >
              {s.nom}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ─── Contexte client : organisation et Espace Cloud ────────────────────

/**
 * Un seul contrôle pour les deux dimensions du contexte client. Deux
 * sélecteurs séparés tenaient trop de place dans la barre et posaient la même
 * question deux fois : « où suis-je ? ».
 */
function SelecteurContexte() {
  const { espaceId, setEspaceId } = useApp()
  const espace = ESPACES.find((e) => e.id === espaceId) ?? ESPACES[0]

  return (
    <Popover
      width="w-72"
      label="Changer d’organisation ou d’Espace Cloud"
      trigger={() => (
        <span
          className="flex shrink-0 items-center gap-1.5 rounded-[6px] border border-white/15 bg-white/10 px-2 py-1.5 text-[11.5px] font-semibold text-p-300 transition-colors hover:bg-white/15"
          title={`${ORG_COURANTE.nom} · ${espace.code}`}
        >
          <Building2 size={12} className="shrink-0" />
          {/* Le nom de l'organisation n'apparaît qu'au-delà de 1536 px : entre
              1280 et 1536, la bande des univers a besoin de cette place et le
              code de l'Espace Cloud est la moitié la plus utile du contexte. */}
          <span className="hidden max-w-28 truncate 2xl:inline">{ORG_COURANTE.nom}</span>
          <span className="hidden text-p-400 2xl:inline">·</span>
          <span className="hidden font-mono xl:inline">{espace.code}</span>
          <ChevronDown size={12} className="shrink-0 text-p-400" />
        </span>
      )}
    >
      {(close) => (
        <div className="p-2">
          <p className="type-micro px-2 py-1.5 text-g-500">Organisation</p>
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

          <p className="type-micro mt-2 border-t border-g-100 px-2 pb-1 pt-2 text-g-500">
            Espace Cloud
          </p>
          {ESPACES.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                setEspaceId(e.id)
                close()
              }}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-[6px] px-2 py-1.5 text-left transition-colors hover:bg-p-050',
                e.id === espace.id && 'bg-p-050',
              )}
            >
              <span className="font-mono text-[12.5px] font-semibold text-ink">{e.code}</span>
              <span className="text-[11.5px] text-g-500">{e.site}</span>
            </button>
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
  )
}

// ─── Contrôles de droite ───────────────────────────────────────────────

/**
 * Les tâches lancées pendant la session passent devant les jobs du jeu de
 * démonstration : ce sont les seules qui avancent, et donc les seules qu'on
 * revient consulter.
 */
function CentreDeTaches({ fournisseur }: { fournisseur: boolean }) {
  const { jobs } = useApp()
  const portee = fournisseur ? 'fournisseur' : 'client'
  const miennes = jobs.filter((j) => porteeDuJob(j) === portee)
  const centre = fournisseur ? '/admin/taches' : '/app/taches'
  const listee = [...miennes, ...(fournisseur ? JOBS_PLATEFORME : JOBS)]
  const enCours = listee.filter((j) => j.statut === 'running' || j.statut === 'queued')
  const echecs = listee.filter((j) => j.statut === 'failed' || j.statut === 'rolled_back')

  return (
    <Popover
      width="w-80"
      label="Centre de tâches"
      trigger={() => (
        <span
          className="relative flex h-8 w-8 items-center justify-center rounded-[6px] text-p-300 transition-colors hover:bg-white/10"
          title="Centre de tâches"
        >
          <ListChecks size={16} />
          {enCours.length > 0 && (
            <span className="tnum absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-m-600 px-1 text-[9.5px] font-bold text-white">
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
            {listee.slice(0, 6).map((j, i) => {
              const faites = j.taches.filter((t) => t.statut === 'ok').length
              const mienne = i < miennes.length
              // Une tâche de la session n'a pas de page dédiée : elle vit dans
              // l'état du navigateur, un lien profond n'y mènerait à rien.
              const href = mienne || fournisseur ? centre : `/app/taches/${j.id}`
              return (
                <Link
                  key={j.id}
                  href={href}
                  onClick={close}
                  className="block px-3 py-2 transition-colors hover:bg-p-050"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">
                      {j.label}
                    </p>
                    <Badge size="sm" tone={TON_STATUT[j.statut]}>
                      {LIBELLE_STATUT[j.statut]}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-g-100">
                      <div
                        className={cn(
                          'h-full rounded-full transition-[width] duration-300',
                          j.statut === 'failed' || j.statut === 'rolled_back'
                            ? 'bg-err'
                            : 'bg-p-600',
                        )}
                        style={{ width: `${Math.round((faites / j.taches.length) * 100)}%` }}
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
          <div className="border-t border-g-100 px-3 py-2">
            <Link
              href={centre}
              onClick={close}
              className="text-[12px] font-semibold text-p-700 hover:underline"
            >
              Ouvrir le centre de tâches
            </Link>
          </div>
        </div>
      )}
    </Popover>
  )
}

function NotificationsPopover() {
  return (
    <Popover
      width="w-80"
      label="Notifications"
      trigger={() => (
        <span
          className="relative flex h-8 w-8 items-center justify-center rounded-[6px] text-p-300 transition-colors hover:bg-white/10"
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
        <div className="max-h-80 divide-y divide-g-100 overflow-y-auto">
          {NOTIFICATIONS.map((n) => (
            <div key={n.id} className="px-3 py-2.5">
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                    { ok: 'bg-ok', warn: 'bg-warn', err: 'bg-err', accent: 'bg-m-600' }[n.ton],
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
  )
}

/**
 * Compte, préférences et rôle simulé. Le sélecteur de rôle a rejoint ce menu :
 * c'est un réglage de session, pas une destination, et la barre n'a pas la
 * place d'un troisième contrôle de contexte.
 */
function MenuCompte({ fournisseur }: { fournisseur: boolean }) {
  const { role, setRole } = useApp()
  const roles = fournisseur ? ROLES_FOURNISSEUR : ROLES_CLIENT

  return (
    <Popover
      width="w-72"
      label="Mon compte et rôle simulé"
      trigger={() => (
        <span className="flex items-center gap-1.5">
          <Avatar nom={UTILISATEUR_COURANT.nom} size="sm" />
          <ChevronDown size={12} className="hidden text-p-300 sm:block" />
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

          <div className="border-b border-g-100 py-2">
            <p className="type-micro px-2 pb-1 text-g-500">Rôle simulé</p>
            <p className="px-2 pb-1.5 text-[11px] leading-snug text-g-500">
              Change les droits appliqués à l’interface. Les actions interdites restent visibles,
              désactivées, avec le rôle requis en infobulle.
            </p>
            <div className="max-h-52 overflow-y-auto">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r as Role)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[12.5px] transition-colors hover:bg-p-050',
                    r === role ? 'bg-p-050 font-semibold text-p-700' : 'text-ink',
                  )}
                >
                  <ShieldCheck
                    size={12}
                    className={r === role ? 'text-p-700' : 'text-g-500'}
                  />
                  {ROLE_LABEL[r as Role]}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1.5">
            {fournisseur ? (
              <MenuLien href="/app" onClick={close} icone={<CloudCog size={13} />}>
                Basculer vers l’espace client
              </MenuLien>
            ) : (
              <MenuLien href="/app/lanceur" onClick={close} icone={<CircleUser size={13} />}>
                Lanceur d’applications
              </MenuLien>
            )}
            {fournisseur ? (
              <MenuLien href="/admin/equipe" onClick={close} icone={<Settings size={13} />}>
                Équipe & rôles
              </MenuLien>
            ) : (
              <>
                <MenuLien href="/app/parametres" onClick={close} icone={<Settings size={13} />}>
                  Préférences
                </MenuLien>
                <MenuLien href="/app/securite" onClick={close} icone={<ShieldCheck size={13} />}>
                  Sécurité & sessions
                </MenuLien>
              </>
            )}
            <MenuLien href="/login" onClick={close} icone={<LogOut size={13} />}>
              Se déconnecter
            </MenuLien>
          </div>
        </div>
      )}
    </Popover>
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
