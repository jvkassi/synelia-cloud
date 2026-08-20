import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowUpRight, CalendarClock, FileText, LifeBuoy, Plus } from 'lucide-react'
import { dateHeure, money, num, pct, relatif, toHumain } from '@/lib/format'
import { trendSeries } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/button'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Card, CardHeader, Section, PageHeader } from '@/components/composition/card'
import { GaugeCircle, QuotaBar, StatTile } from '@/components/composition/metrics'
import { Sparkline } from '@/components/composition/metrics'
import { Timeline } from '@/components/composition/flow'
import { EventList } from '@/components/business/observabilite'
import { ServiceCard } from '@/components/business/service-card'
import { PanneauOnboarding } from '@/components/app/onboarding'
import {
  AUDIT,
  CATALOGUE,
  EVENEMENTS_SUPERVISION,
  FACTURES,
  ORG_COURANTE,
  SERVICES_MANAGES,
  SYNTHESE_CLIENT,
  TICKETS,
  serviceCatalogue,
} from '@/lib/mock'

export const metadata: Metadata = {
  title: 'Tableau de bord',
  description:
    'Capacité souscrite contre consommée, disponibilité, services managés, santé de l’infrastructure et activité récente.',
}

const LIBELLES_ACTION: Record<string, string> = {
  'project.scale': 'a redimensionné',
  'capacity.rebalance': 'a rééquilibré la capacité',
  'auth.login': 's’est connecté à',
  'lb.rule.create': 'a créé une règle sur',
  'app.deploy': 'a déployé',
  'vm.delete': 'a tenté de supprimer',
  'invoice.download': 'a téléchargé',
  'backup.run': 'a exécuté',
  'member.invite': 'a invité des membres sur',
  'service.seats.extend': 'a étendu les sièges de',
  'compliance.export': 'a exporté',
  'backend.maintenance.start': 'a démarré la maintenance de',
  'espace.create': 'a créé',
}

export default function TableauDeBord() {
  const s = SYNTHESE_CLIENT
  const margeVcpu = s.quota.vcpu - s.usage.vcpu
  const servicesVedette = SERVICES_MANAGES.filter((x) => x.statut !== 'provisioning').slice(0, 4)
  const factureEnCours = FACTURES.find((f) => f.statut === 'brouillon')
  const ticketsOuverts = TICKETS.filter((t) => t.statut !== 'resolu' && t.statut !== 'ferme')
  const attenteClient = TICKETS.filter((t) => t.statut === 'attente_client')

  return (
    <div className="space-y-6">
      <PageHeader
        titre={`Bonjour, voici l’état de ${ORG_COURANTE.nom}`}
        sousTitre={`Organisation ${ORG_COURANTE.tenantPlan} · ${ORG_COURANTE.pays} · TVA ${ORG_COURANTE.tva} · données hébergées à Abidjan et Grand-Bassam.`}
        actions={
          <>
            <ButtonLink href="/app/espaces/new" variant="secondary" iconBefore={<Plus size={14} />}>
              Nouvel Espace Cloud
            </ButtonLink>
            <ButtonLink href="/app/marketplace" iconBefore={<Plus size={14} />}>
              Souscrire un service
            </ButtonLink>
          </>
        }
      />

      <PanneauOnboarding />

      {/* ─── Bande 1 : chiffres clés ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          libelle="Espaces Cloud"
          valeur={s.espaces}
          detail="2 sites · 3 offres souscrites"
          serie={trendSeries('espaces', 24, 2, 3, 0)}
        />
        <StatTile
          libelle="Machines virtuelles"
          valeur={s.vms}
          detail={`${s.clusters} clusters Kubernetes`}
          variation={2}
          variationUnite="ce mois"
          serie={trendSeries('vms', 24, 11, 14, 1)}
        />
        <StatTile
          libelle="Services managés"
          valeur={s.servicesManages}
          detail="1 en provisioning · 1 mise à jour disponible"
          ton="accent"
          serie={trendSeries('svc', 24, 4, 6, 0)}
        />
        <StatTile
          libelle="Applications déployées"
          valeur={s.applications}
          detail={`${s.environnements} environnements`}
          serie={trendSeries('apps', 24, 5, 6, 0)}
        />
        <StatTile
          libelle="Sièges utilisés"
          valeur={`${s.siegesUtilises}/${s.siegesSouscrits}`}
          detail={`${pct(Math.round((s.siegesUtilises / s.siegesSouscrits) * 100))} des sièges souscrits`}
          ton="ok"
          serie={trendSeries('sieges', 24, 58, 67, 2)}
        />
      </div>

      {/* ─── Bande 2 : capacité et disponibilité ─────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            titre="Capacité souscrite contre consommée"
            sousTitre="Somme des trois Espaces Cloud. Le placement technique sur nos hyperviseurs reste de notre responsabilité."
            actions={
              <Link
                href="/app/espaces"
                className="text-[12px] font-semibold text-p-700 hover:text-m-600"
              >
                Détail par espace →
              </Link>
            }
          />
          <div className="space-y-3.5">
            <QuotaBar
              libelle="vCPU"
              utilise={s.usage.vcpu}
              total={s.quota.vcpu}
              formateur={(v) => num(v)}
            />
            <QuotaBar
              libelle="Mémoire"
              utilise={s.usage.ramGo}
              total={s.quota.ramGo}
              unite="Go"
              formateur={(v) => num(v)}
            />
            <QuotaBar
              libelle="Stockage"
              utilise={s.usage.stockageTo}
              total={s.quota.stockageTo}
              formateur={(v) => toHumain(v)}
              seuil={85}
            />
          </div>

          <div className="mt-4 rounded-[8px] border-l-4 border-p-600 bg-p-050 px-3.5 py-2.5">
            <p className="text-[12.5px] leading-relaxed text-g-700">
              Marge disponible : <span className="tnum font-semibold text-ink">{margeVcpu} vCPU</span>{' '}
              et <span className="tnum font-semibold text-ink">{s.quota.ramGo - s.usage.ramGo} Go</span>{' '}
              — de quoi accueillir environ{' '}
              <span className="font-semibold text-ink">2 applications supplémentaires</span> sans
              extension. Le stockage, à {pct(Math.round((s.usage.stockageTo / s.quota.stockageTo) * 100))},
              sera le premier facteur limitant : un devis d’extension à 12 To est en attente de votre
              validation.
            </p>
          </div>

          <div className="mt-4 border-t border-g-100 pt-3.5">
            <div className="mb-2 flex items-baseline justify-between">
              <MicroLabel>Consommation vCPU sur 30 jours</MicroLabel>
              <span className="tnum text-[12px] font-semibold text-ink">
                {s.usage.vcpu} / {s.quota.vcpu} vCPU
              </span>
            </div>
            <Sparkline
              serie={trendSeries('conso-30j', 30, 44, 66, 4)}
              hauteur={64}
              couleur="var(--color-p-600)"
            />
            <div className="mt-1 flex justify-between text-[10.5px] text-g-500">
              <span>-30 j</span>
              <span>-20 j</span>
              <span>-10 j</span>
              <span>aujourd’hui</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            titre="Disponibilité"
            sousTitre="Moyenne pondérée sur 30 jours"
          />
          <GaugeCircle
            valeur={s.uptime30j}
            cible={s.slaContractuel}
            min={99}
            libelle="Face à un engagement contractuel de 99,9 %"
            taille={148}
            className="mx-auto"
          />
          <dl className="mt-4 space-y-2 border-t border-g-100 pt-3.5">
            <Ligne cle="Applications à surveiller" valeur="2 sur 6" ton="warn" />
            <Ligne cle="Incidents ouverts" valeur="1 critique · 2 majeurs" ton="err" />
            <Ligne cle="Crédit SLA en cours de calcul" valeur={money(12200)} ton="ok" />
          </dl>
          <Link
            href="/app/support"
            className="mt-3 inline-flex items-center gap-1 border-t border-g-100 pt-3 text-[12px] font-semibold text-p-700 hover:text-m-600"
          >
            Voir les engagements SLA
            <ArrowUpRight size={12} />
          </Link>
        </Card>
      </div>

      {/* ─── Bande 3 : services, santé, facturation ──────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Section
          titre="Mes services managés"
          actions={
            <Link
              href="/app/services"
              className="text-[12px] font-semibold text-p-700 hover:text-m-600"
            >
              Tous les services →
            </Link>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {servicesVedette.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                catalogue={serviceCatalogue(svc.catalogSlug)}
                compact
              />
            ))}
          </div>
        </Section>

        <Card>
          <CardHeader
            titre="Santé de l’infrastructure"
            sousTitre="Six derniers événements de supervision"
          />
          <EventList evenements={EVENEMENTS_SUPERVISION} max={6} />
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader titre="Facturation" />
            <dl className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-[12.5px] text-g-500">Dépense du mois en cours</dt>
                <dd className="tnum text-[16px] font-bold [font-family:var(--font-display)] text-ink">
                  {money(s.depenseMois)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-[12.5px] text-g-500">Prévision de fin de mois</dt>
                <dd className="tnum text-[13px] font-semibold text-warn">
                  {money(s.previsionMois)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-[12.5px] text-g-500">Mois précédent</dt>
                <dd className="tnum text-[13px] text-g-700">{money(s.depenseMoisPrecedent)}</dd>
              </div>
            </dl>
            <div className="mt-3 border-t border-g-100 pt-3">
              <QuotaBar
                utilise={s.depenseMois}
                total={s.previsionMois}
                seuil={90}
                compact
                formateur={(v) => money(v)}
              />
              <p className="mt-1.5 text-[11px] text-g-500">
                Hausse de {pct(Math.round(((s.previsionMois - s.depenseMoisPrecedent) / s.depenseMoisPrecedent) * 100))}{' '}
                attendue : souscription GED au prorata et troisième Espace Cloud.
              </p>
            </div>
            {factureEnCours && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-[6px] bg-g-050 px-2.5 py-2">
                <span className="flex items-center gap-1.5 text-[12px] text-g-700">
                  <FileText size={13} className="text-g-500" />
                  {factureEnCours.numero} · brouillon
                </span>
                <Link
                  href="/app/facturation"
                  className="text-[11.5px] font-semibold text-p-700 hover:text-m-600"
                >
                  Ouvrir
                </Link>
              </div>
            )}
            {s.facturesEnAttente > 0 && (
              <p className="mt-2 rounded-[6px] bg-err-bg px-2.5 py-2 text-[11.5px] text-err">
                {s.facturesEnAttente} facture impayée · INV-1962, échue depuis le 10 juin
              </p>
            )}
          </Card>

          <Card>
            <CardHeader titre="Support" />
            <div className="grid grid-cols-3 gap-2">
              <Compteur libelle="Ouverts" valeur={ticketsOuverts.length} ton="warn" />
              <Compteur libelle="Vous attendent" valeur={attenteClient.length} ton="err" />
              <Compteur libelle="Résolus ce mois" valeur={2} ton="ok" />
            </div>
            <ul className="mt-3 space-y-2 border-t border-g-100 pt-3">
              {ticketsOuverts.slice(0, 3).map((t) => (
                <li key={t.id}>
                  <Link href={`/app/support/${t.id}`} className="group block">
                    <div className="flex items-start gap-2">
                      <Badge
                        size="sm"
                        tone={
                          t.gravite === 'critique'
                            ? 'err'
                            : t.gravite === 'majeure'
                              ? 'warn'
                              : 'neutral'
                        }
                        className="mt-0.5 shrink-0"
                      >
                        {t.numero}
                      </Badge>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] text-ink group-hover:text-p-700">
                          {t.sujet}
                        </span>
                        {t.slaRestantMin !== undefined && (
                          <span className="tnum block text-[10.5px] text-g-500">
                            SLA restant : {Math.floor(t.slaRestantMin / 60)} h{' '}
                            {String(t.slaRestantMin % 60).padStart(2, '0')}
                          </span>
                        )}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center gap-2 border-t border-g-100 pt-3 text-[11.5px] text-g-700">
              <CalendarClock size={13} className="shrink-0 text-p-700" />
              Prochain point d’exploitation : {dateHeure(s.prochainRdv)}
            </div>
            <Link
              href="/app/support"
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-p-700 hover:text-m-600"
            >
              <LifeBuoy size={12} />
              Ouvrir un ticket
            </Link>
          </Card>
        </div>
      </div>

      {/* ─── Bande 4 : activité récente ──────────────────────────────── */}
      <Card>
        <CardHeader
          titre="Activité récente"
          sousTitre="Huit derniers événements, refus de droits inclus"
          actions={
            <Link
              href="/app/securite"
              className="text-[12px] font-semibold text-p-700 hover:text-m-600"
            >
              Journal d’audit complet →
            </Link>
          }
        />
        <Timeline
          evenements={AUDIT.filter((e) => e.orgId === ORG_COURANTE.id || !e.orgId)
            .slice(0, 8)
            .map((e) => ({
              id: e.id,
              ton:
                e.result === 'refuse'
                  ? ('err' as const)
                  : e.result === 'erreur'
                    ? ('warn' as const)
                    : ('ok' as const),
              titre: (
                <>
                  <span className="font-semibold">{e.actor.nom}</span>{' '}
                  {LIBELLES_ACTION[e.action] ?? e.action}{' '}
                  <span className="font-mono text-[12px]">{e.target}</span>{' '}
                  <span className="text-g-500">· {e.scope.label}</span>
                  {e.result === 'refuse' && (
                    <Badge tone="err" size="sm" className="ml-1.5">
                      Refusé
                    </Badge>
                  )}
                </>
              ),
              detail: e.detail,
              horodatage: relatif(e.ts),
            }))}
        />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATALOGUE.slice(0, 4).map((c) => (
          <Link
            key={c.slug}
            href={`/app/marketplace/${c.slug}`}
            className="group rounded-[10px] border border-dashed border-g-300 bg-white p-3.5 transition-colors hover:border-p-400 hover:bg-p-050"
          >
            <MicroLabel>Suggestion</MicroLabel>
            <p className="mt-1.5 text-[13px] font-semibold text-ink group-hover:text-p-700">
              {c.nom}
            </p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-g-500">{c.pitch}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Ligne({
  cle,
  valeur,
  ton,
}: {
  cle: string
  valeur: string
  ton?: 'ok' | 'warn' | 'err'
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-[12px] text-g-500">{cle}</dt>
      <dd
        className={
          ton === 'err'
            ? 'tnum text-[12.5px] font-semibold text-err'
            : ton === 'warn'
              ? 'tnum text-[12.5px] font-semibold text-warn'
              : ton === 'ok'
                ? 'tnum text-[12.5px] font-semibold text-ok'
                : 'tnum text-[12.5px] font-semibold text-ink'
        }
      >
        {valeur}
      </dd>
    </div>
  )
}

function Compteur({
  libelle,
  valeur,
  ton,
}: {
  libelle: string
  valeur: number
  ton: 'ok' | 'warn' | 'err'
}) {
  const couleurs = { ok: 'text-ok', warn: 'text-warn', err: 'text-err' }[ton]
  return (
    <div className="rounded-[6px] bg-g-050 px-2 py-2 text-center">
      <p className={`tnum text-[18px] font-bold leading-none [font-family:var(--font-display)] ${couleurs}`}>
        {valeur}
      </p>
      <p className="mt-1 text-[10.5px] leading-tight text-g-500">{libelle}</p>
    </div>
  )
}
