'use client'

import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
} from 'lucide-react'
import { cn, seededSeries } from '@/lib/utils'
import { dateHeure, duree, pct, relatif } from '@/lib/format'
import {
  ANOMALIES,
  APPLICATIONS,
  COMPOSANTS,
  DEPLOIEMENTS,
  LOGS_BUILD,
  LOGS_EXECUTION,
  envsDeLApp,
  espaceById,
} from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink, IconButton } from '@/components/ui/button'
import { GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, SegmentedControl, Select, Slider, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { HealthBadge, StatTile } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { GrilleSparkCharts, LogPeek } from '@/components/business/observabilite'
import {
  AnomalieCard,
  BuildDiagnostic,
  ComponentCard,
  DeploymentPipeline,
  PreviewLink,
  SecurityFindings,
} from '@/components/business/paas'
import { Copilote, TopologyCanvas } from '@/components/business/rbac-canvas'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'composants', label: 'Composants' },
  { id: 'deploiements', label: 'Déploiements' },
  { id: 'journaux', label: 'Journaux' },
  { id: 'variables', label: 'Variables & secrets' },
  { id: 'domaines', label: 'Domaines' },
  { id: 'progressif', label: 'Déploiement progressif' },
  { id: 'protection', label: 'Protection' },
  { id: 'taches', label: 'Tâches & workers' },
  { id: 'observabilite', label: 'Observabilité' },
]

export function VueApplication({ id }: { id: string }) {
  const app = APPLICATIONS.find((a) => a.id === id)!
  const espace = espaceById(app.espaceId)
  const envs = envsDeLApp(id)
  const { autorise, refus, pousser } = useApp()

  const [envId, setEnvId] = useState(envs[0]?.id ?? '')
  const [onglet, setOnglet] = useState('composants')
  const env = envs.find((e) => e.id === envId) ?? envs[0]
  const composants = COMPOSANTS.filter((c) => c.envId === env?.id)
  const deploiements = DEPLOIEMENTS.filter((d) => d.appId === id)
  const deploiementsEnv = deploiements.filter((d) => d.envId === env?.id)
  const anomalies = ANOMALIES.filter((a) => a.appId === id)

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Applications', href: '/app/apps' },
          { label: app.nom },
        ]}
        titre={<span className="font-mono">{app.nom}</span>}
        sousTitre={app.description}
        meta={
          <>
            <HealthBadge etat={app.sante} />
            <Badge tone="neutral">{app.cible === 'k8s' ? 'Kubernetes' : 'Machines virtuelles'}</Badge>
            {app.repo && (
              <span className="font-mono text-[12px] text-g-500">
                {app.repo.url} · {app.repo.branche}
              </span>
            )}
            {app.domainePrincipal !== '—' && (
              <a
                href={`https://${app.domainePrincipal}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-p-700 hover:text-m-600"
              >
                {app.domainePrincipal}
                <ExternalLink size={11} />
              </a>
            )}
            <span className="text-[12px] text-g-500">{espace?.code}</span>
          </>
        }
        actions={
          <>
            <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
              <Button
                iconBefore={<RotateCw size={14} />}
                onClick={() =>
                  pousser({
                    ton: 'info',
                    titre: `Redéploiement de ${app.nom} · ${env?.nom}`,
                    detail: 'L’artefact existant est rejoué, sans rebuild.',
                  })
                }
              >
                Redéployer
              </Button>
            </GatedAction>
            <ButtonLink href="/app/deploiements" variant="secondary">
              Tous les déploiements
            </ButtonLink>
          </>
        }
      />

      {/* Sélecteur d'environnement */}
      <div className="flex flex-wrap items-center gap-2">
        <MicroLabel className="mr-1">Environnement</MicroLabel>
        {envs.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setEnvId(e.id)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
              envId === e.id
                ? 'border-p-700 bg-p-700 text-white'
                : 'border-g-300 bg-white text-g-700 hover:border-p-400',
            )}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: envId === e.id ? '#fff' : e.couleur }}
            />
            {e.nom}
            <Badge
              tone={
                e.statut === 'running'
                  ? 'ok'
                  : e.statut === 'degraded'
                    ? 'warn'
                    : e.statut === 'failed'
                      ? 'err'
                      : 'neutral'
              }
              size="sm"
            >
              {
                {
                  running: 'en marche',
                  degraded: 'dégradé',
                  stopped: 'arrêté',
                  building: 'build',
                  failed: 'échec',
                }[e.statut]
              }
            </Badge>
          </button>
        ))}
      </div>

      {env && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            libelle="CPU"
            valeur={env.sante.cpu}
            unite="%"
            ton={env.sante.cpu > 80 ? 'err' : 'violet'}
            serie={seededSeries(`${env.id}-cpu`, 24, env.sante.cpu * 0.7, env.sante.cpu * 1.2)}
          />
          <StatTile
            libelle="Mémoire"
            valeur={env.sante.ram}
            unite="%"
            ton={env.sante.ram > 85 ? 'err' : 'violet'}
            serie={seededSeries(`${env.id}-ram`, 24, env.sante.ram * 0.7, Math.min(100, env.sante.ram * 1.1))}
          />
          <StatTile
            libelle="Latence"
            valeur={env.sante.latenceMs}
            unite="ms"
            ton={env.sante.latenceMs > 200 ? 'warn' : 'violet'}
            serie={seededSeries(`${env.id}-lat`, 24, env.sante.latenceMs * 0.6, env.sante.latenceMs * 1.4)}
          />
          <StatTile
            libelle="Taux d’erreur"
            valeur={pct(env.sante.erreursPct, 2)}
            ton={env.sante.erreursPct > 1 ? 'err' : 'ok'}
            serie={seededSeries(`${env.id}-err`, 24, 0, Math.max(0.4, env.sante.erreursPct * 2))}
          />
        </div>
      )}

      {app.sante === 'echec' && (
        <BuildDiagnostic
          erreur="pip: ResolutionImpossible — psycopg2 2.9.9 incompatible avec Python 3.12"
          traduction="L’installation des dépendances échoue parce que psycopg2 dans sa version 2.9.9 ne publie pas de distribution compatible avec CPython 3.12. La cause racine est le commit 2e8cd41, qui a fait passer le runtime de Python 3.11 à 3.12 sans migrer le pilote PostgreSQL. Ce n’est pas une erreur de configuration de la plateforme : le même build échouerait à l’identique sur votre poste."
          correctifs={[
            'Migrer vers psycopg[binary] 3.2, qui publie des roues pour CPython 3.12 et reste compatible avec l’API 2.x pour l’essentiel',
            'Épingler le runtime à Python 3.11 dans le fichier .python-version, le temps de préparer la migration du pilote',
            'Compiler psycopg2 depuis les sources en ajoutant libpq-dev aux paquets système du build — solution la moins recommandée, elle rallonge chaque build',
          ]}
        />
      )}

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {/* Composants */}
      {onglet === 'composants' && env && (
        <div className="space-y-4">
          {composants.length === 0 ? (
            <EmptyState
              titre="Aucun composant déployé"
              phrase={`L’environnement ${env.nom} n’a pas encore de composant. Lancez un déploiement pour le peupler.`}
              action={{ libelle: 'Redéployer', href: '#' }}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {composants.map((c) => (
                  <ComponentCard key={c.id} composant={c} />
                ))}
              </div>
              <Card>
                <CardHeader
                  titre="Topologie de l’environnement"
                  sousTitre="Composition actuelle et dépendances déclarées."
                />
                <TopologyCanvas />
              </Card>
            </>
          )}
        </div>
      )}

      {/* Déploiements */}
      {onglet === 'deploiements' && env && (
        <div className="space-y-4">
          {deploiementsEnv.length === 0 ? (
            <EmptyState
              titre="Aucun déploiement sur cet environnement"
              phrase="L’historique des déploiements est immuable : chaque artefact construit reste disponible pour un rollback instantané ou une promotion."
            />
          ) : (
            <>
              {deploiementsEnv
                .filter((d) => d.statut !== 'live' || d === deploiementsEnv[0])
                .slice(0, 1)
                .map((d) => (
                  <Card key={d.id}>
                    <CardHeader
                      titre={
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-mono">{d.version}</span>
                          <Badge
                            tone={
                              d.statut === 'live'
                                ? 'ok'
                                : d.statut === 'failed'
                                  ? 'err'
                                  : d.statut === 'rolled_back'
                                    ? 'warn'
                                    : 'info'
                            }
                            dot
                          >
                            {
                              {
                                queued: 'En file',
                                building: 'Build en cours',
                                scanning: 'Analyse en cours',
                                provisioning: 'Provisioning',
                                deploying: 'Déploiement en cours',
                                live: 'En ligne',
                                failed: 'Échec',
                                rolled_back: 'Annulé et restauré',
                              }[d.statut]
                            }
                          </Badge>
                          {d.previewUrl && <PreviewLink url={d.previewUrl} pr={d.pr} branche={d.branche} />}
                        </span>
                      }
                      sousTitre={`${d.commitMessage ?? ''} · ${d.auteur} · ${relatif(d.startedAt)}${d.dureeS ? ` · ${duree(d.dureeS)}` : ''}`}
                    />
                    <DeploymentPipeline deploiement={d} />
                    {d.findings.length > 0 && (
                      <div className="mt-4 border-t border-g-100 pt-4">
                        <MicroLabel className="mb-2.5">Constats de l’analyse DevSecOps</MicroLabel>
                        <SecurityFindings findings={d.findings} />
                      </div>
                    )}
                  </Card>
                ))}

              <Card>
                <CardHeader
                  titre="Historique immuable"
                  sousTitre="Chaque artefact reste disponible : un rollback instantané rejoue l’image déjà construite, sans rebuild."
                />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max border-collapse">
                    <thead>
                      <tr className="border-b border-g-300 bg-g-050">
                        {['Version', 'Commit', 'Auteur', 'Démarré', 'Durée', 'État', 'Actions'].map(
                          (h) => (
                            <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {deploiementsEnv.map((d) => (
                        <tr key={d.id} className="border-b border-g-100 last:border-0">
                          <td className="px-3 py-2.5">
                            <span className="flex items-center gap-1.5">
                              <span className="font-mono text-[12.5px] font-semibold text-ink">
                                {d.version}
                              </span>
                              {d.pr && <Badge tone="violet" size="sm">PR #{d.pr}</Badge>}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="block font-mono text-[12px] text-ink">{d.commit}</span>
                            <span className="block max-w-56 truncate text-[11px] text-g-500">
                              {d.commitMessage}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[12.5px] text-g-700">{d.auteur}</td>
                          <td className="px-3 py-2.5 text-[12px] text-g-700">
                            {dateHeure(d.startedAt)}
                          </td>
                          <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                            {d.dureeS ? duree(d.dureeS) : '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge
                              tone={
                                d.statut === 'live'
                                  ? 'ok'
                                  : d.statut === 'failed'
                                    ? 'err'
                                    : d.statut === 'rolled_back'
                                      ? 'warn'
                                      : 'info'
                              }
                              size="sm"
                            >
                              {
                                {
                                  queued: 'En file',
                                  building: 'Build',
                                  scanning: 'Analyse',
                                  provisioning: 'Provisioning',
                                  deploying: 'Déploiement',
                                  live: 'En ligne',
                                  failed: 'Échec',
                                  rolled_back: 'Annulé',
                                }[d.statut]
                              }
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="flex flex-wrap gap-1.5">
                              <GatedAction
                                autorise={autorise('app.rollback')}
                                message={refus('app.rollback')}
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  iconBefore={<RotateCcw size={12} />}
                                  disabled={d.statut === 'failed'}
                                  onClick={() =>
                                    pousser({
                                      ton: 'info',
                                      titre: `Rollback vers ${d.version}`,
                                      detail: 'Bascule sur l’artefact existant, sans rebuild. Effectif en moins d’une minute.',
                                    })
                                  }
                                >
                                  Rollback instantané
                                </Button>
                              </GatedAction>
                              <GatedAction
                                autorise={autorise('app.deploy')}
                                message={refus('app.deploy')}
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  iconBefore={<ArrowUpRight size={12} />}
                                  disabled={d.statut !== 'live' || env.nom === 'Production'}
                                >
                                  Promouvoir
                                </Button>
                              </GatedAction>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Callout ton="violet" className="mt-4" titre="Rollback et promotion, sans rebuild">
                  Un rollback bascule vers un artefact déjà construit et validé : pas de nouveau
                  build, donc aucun risque qu’une dépendance ait changé entre-temps. Une promotion
                  rejoue exactement le même artefact dans l’environnement supérieur — ce qui garantit
                  que ce que vous avez testé est bien ce qui part en production.
                </Callout>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Journaux */}
      {onglet === 'journaux' && env && <OngletJournaux />}

      {/* Variables & secrets */}
      {onglet === 'variables' && env && (
        <OngletVariables composants={composants} envNom={env.nom} />
      )}

      {/* Domaines */}
      {onglet === 'domaines' && env && <OngletDomaines env={env} appNom={app.nom} />}

      {/* Déploiement progressif */}
      {onglet === 'progressif' && env && <OngletProgressif env={env} />}

      {/* Protection */}
      {onglet === 'protection' && env && <OngletProtection env={env} />}

      {/* Tâches & workers */}
      {onglet === 'taches' && env && <OngletTaches composants={composants} />}

      {/* Observabilité */}
      {onglet === 'observabilite' && env && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {envs.map((e) => (
              <Card key={e.id}>
                <CardHeader
                  titre={
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: e.couleur }}
                      />
                      {e.nom}
                    </span>
                  }
                  actions={<HealthBadge etat={e.statut} size="sm" />}
                />
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { l: 'CPU', v: e.sante.cpu, u: '%', s: 80 },
                    { l: 'RAM', v: e.sante.ram, u: '%', s: 85 },
                    { l: 'Latence', v: e.sante.latenceMs, u: 'ms', s: 200 },
                    { l: 'Erreurs', v: e.sante.erreursPct, u: '%', s: 1 },
                  ].map((m) => (
                    <div key={m.l} className="rounded-[6px] bg-g-050 px-2 py-2 text-center">
                      <p className="type-micro text-g-500">{m.l}</p>
                      <p
                        className={cn(
                          'tnum mt-0.5 text-[14px] font-bold',
                          m.v > m.s ? 'text-err' : m.v === 0 ? 'text-g-500' : 'text-ink',
                        )}
                      >
                        {m.v}
                        <span className="text-[9.5px] font-semibold text-g-500">{m.u}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {anomalies.length > 0 && (
            <div className="space-y-4">
              {anomalies.map((a) => (
                <AnomalieCard key={a.id} anomalie={a} />
              ))}
            </div>
          )}

          <GrilleSparkCharts
            seed={`app-${id}-${env.id}`}
            metriques={[
              { titre: 'CPU', unite: '%', min: env.sante.cpu * 0.6, max: Math.min(100, env.sante.cpu * 1.3), seuil: 80 },
              { titre: 'Mémoire', unite: '%', min: env.sante.ram * 0.7, max: Math.min(100, env.sante.ram * 1.1), seuil: 90 },
              { titre: 'Latence P95', unite: 'ms', min: env.sante.latenceMs * 0.6, max: env.sante.latenceMs * 1.5, seuil: 200 },
              { titre: 'Taux d’erreur', unite: '%', min: 0, max: Math.max(0.5, env.sante.erreursPct * 2), seuil: 1, couleur: 'var(--color-err)' },
            ]}
          />

          <Copilote />
        </div>
      )}
    </div>
  )
}

// ─── Journaux ─────────────────────────────────────────────────────────

function OngletJournaux() {
  const [flux, setFlux] = useState<'build' | 'execution'>('execution')
  const [pause, setPause] = useState(false)
  const [composant, setComposant] = useState('tous')

  return (
    <Card>
      <CardHeader
        titre="Journaux"
        sousTitre="Flux temps réel, police monospace, filtre texte. Le portail n’embarque pas de constructeur de requêtes LogsQL."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              size="sm"
              value={flux}
              onChange={setFlux}
              options={[
                { value: 'build', label: 'Build' },
                { value: 'execution', label: 'Exécution' },
              ]}
            />
            <Select
              value={composant}
              onChange={(e) => setComposant(e.target.value)}
              className="w-auto min-w-32"
              aria-label="Composant"
            >
              <option value="tous">Tous les composants</option>
              <option value="api">api</option>
              <option value="traefik">traefik</option>
              <option value="postgres">postgres</option>
              <option value="redis">redis</option>
            </Select>
            <Button
              size="sm"
              variant={pause ? 'primary' : 'secondary'}
              onClick={() => setPause((p) => !p)}
            >
              {pause ? 'Reprendre le flux' : 'Mettre en pause'}
            </Button>
          </div>
        }
      />
      <LogPeek
        lignes={flux === 'build' ? LOGS_BUILD : LOGS_EXECUTION}
        max={20}
        titre={flux === 'build' ? 'Journal de build' : 'Journal d’exécution'}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-g-100 pt-3">
        <p className="text-[11.5px] text-g-500">
          Rétention : 30 jours sur le palier Business, 7 jours sur le palier Essentiel. Les journaux
          complets sont interrogeables dans VictoriaLogs.
        </p>
        <Button size="sm" variant="ghost">
          Télécharger l’intégralité
        </Button>
      </div>
    </Card>
  )
}

// ─── Variables & secrets ──────────────────────────────────────────────

function OngletVariables({
  composants,
  envNom,
}: {
  composants: (typeof COMPOSANTS)[number][]
  envNom: string
}) {
  const { autorise, refus } = useApp()
  const [reveles, setReveles] = useState<string[]>([])

  const variables = useMemo(
    () =>
      composants.flatMap((c) =>
        c.envVars.map((v) => ({ ...v, composant: c.nom, id: `${c.id}-${v.cle}` })),
      ),
    [composants],
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          titre={`Variables de l’environnement ${envNom}`}
          sousTitre="Les valeurs secrètes sont masquées et journalisées à chaque révélation."
          actions={
            <GatedAction autorise={autorise('secrets.update')} message={refus('secrets.update')}>
              <Button size="sm" iconBefore={<Plus size={13} />}>
                Ajouter une variable
              </Button>
            </GatedAction>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse">
            <thead>
              <tr className="border-b border-g-300 bg-g-050">
                {['Clé', 'Composant', 'Portée', 'Valeur', 'Source', ''].map((h) => (
                  <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variables.map((v) => {
                const revele = reveles.includes(v.id)
                return (
                  <tr key={v.id} className="border-b border-g-100 last:border-0">
                    <td className="px-3 py-2.5 font-mono text-[12.5px] font-semibold text-ink">
                      {v.cle}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-g-700">{v.composant}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={v.scope === 'build' ? 'info' : 'neutral'} size="sm">
                        {v.scope === 'build' ? 'Build' : 'Exécution'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-ink">
                      {v.secret ? (
                        revele ? (
                          <span className="text-err">valeur-secrete-revelee</span>
                        ) : (
                          '••••••••••••'
                        )
                      ) : (
                        (v.valeur ?? '—')
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {v.secret ? (
                        <Badge tone="violet" size="sm">
                          Coffre de secrets
                        </Badge>
                      ) : (
                        <Badge tone="neutral" size="sm">
                          Définie ici
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="flex justify-end gap-1">
                        {v.secret && (
                          <GatedAction
                            autorise={autorise('secrets.update')}
                            message={refus('secrets.update')}
                          >
                            <IconButton
                              label={revele ? 'Masquer' : 'Révéler la valeur'}
                              size="sm"
                              onClick={() =>
                                setReveles((p) =>
                                  p.includes(v.id) ? p.filter((x) => x !== v.id) : [...p, v.id],
                                )
                              }
                            >
                              {revele ? <EyeOff size={13} /> : <Eye size={13} />}
                            </IconButton>
                          </GatedAction>
                        )}
                        <GatedAction
                          autorise={autorise('secrets.update')}
                          message={refus('secrets.update')}
                        >
                          <IconButton label="Supprimer la variable" size="sm">
                            <Trash2 size={13} className="text-err" />
                          </IconButton>
                        </GatedAction>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader titre="Héritage depuis l’organisation" />
          <div className="space-y-2">
            {[
              { cle: 'SYNELIA_REGION', valeur: 'ABJ', portee: 'Toutes les applications' },
              { cle: 'SMTP_URL', valeur: '••••••••', portee: 'Toutes les applications' },
              { cle: 'OTEL_ENDPOINT', valeur: 'https://otel.synelia.cloud', portee: 'Toutes les applications' },
            ].map((v) => (
              <div
                key={v.cle}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-g-300 px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block font-mono text-[12px] font-semibold text-ink">{v.cle}</span>
                  <span className="block text-[11px] text-g-500">{v.portee}</span>
                </span>
                <span className="font-mono text-[11.5px] text-g-700">{v.valeur}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-g-500">
            Une variable définie au niveau de l’environnement prime sur celle de l’organisation. Cela
            permet de fixer un défaut global tout en autorisant une exception locale.
          </p>
        </Card>

        <Card>
          <CardHeader titre="Historique des modifications" />
          <div className="space-y-2.5">
            {[
              { qui: 'Fatou Diallo', quoi: 'CACHE_MAX_MB', ts: '2026-08-18T18:36:00Z', action: 'modifiée' },
              { qui: 'Adama Sangaré', quoi: 'SENTRY_DSN', ts: '2026-08-14T10:58:00Z', action: 'ajoutée' },
              { qui: 'Yao Kouassi', quoi: 'BROKER_URL', ts: '2026-08-12T09:22:00Z', action: 'révélée' },
              { qui: 'Léa Konan', quoi: 'JWT_SECRET', ts: '2026-08-04T14:11:00Z', action: 'rotation' },
            ].map((h) => (
              <div key={`${h.quoi}-${h.ts}`} className="border-l-2 border-g-300 pl-3">
                <p className="text-[12.5px] text-ink">
                  <span className="font-semibold">{h.qui}</span> a {h.action}{' '}
                  <span className="font-mono text-[12px]">{h.quoi}</span>
                </p>
                <p className="text-[11px] text-g-500">{dateHeure(h.ts)}</p>
              </div>
            ))}
          </div>
          <Callout ton="info" className="mt-3.5" titre="Toute révélation est tracée">
            Afficher la valeur d’un secret est une action journalisée dans l’audit de l’organisation,
            au même titre qu’une modification. C’est ce qui permet, après un incident, de savoir qui
            a eu accès à quoi.
          </Callout>
        </Card>
      </div>
    </div>
  )
}

// ─── Domaines ─────────────────────────────────────────────────────────

function OngletDomaines({
  env,
  appNom,
}: {
  env: (typeof COMPOSANTS)[number] extends never ? never : { nom: string; domaines: string[] }
  appNom: string
}) {
  const [verifie, setVerifie] = useState(true)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          titre={`Domaines de l’environnement ${env.nom}`}
          actions={
            <Button size="sm" iconBefore={<Plus size={13} />}>
              Ajouter un domaine
            </Button>
          }
        />
        {env.domaines.length === 0 ? (
          <EmptyState
            titre="Aucun domaine"
            phrase="Cet environnement n’expose aucun service sur Internet. C’est le cas normal pour un worker de file ou un traitement par lots."
          />
        ) : (
          <div className="space-y-2">
            {env.domaines.map((d) => (
              <div
                key={d}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Globe size={14} className="shrink-0 text-p-700" />
                  <span className="min-w-0">
                    <a
                      href={`https://${d}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate font-mono text-[12.5px] font-semibold text-ink hover:text-p-700"
                    >
                      {d}
                    </a>
                    <span className="block text-[11px] text-g-500">
                      Certificat Let’s Encrypt · renouvellement automatique
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone="ok" dot size="sm">
                    Vérifié
                  </Badge>
                  <Badge tone="neutral" size="sm">
                    TLS 1.2+
                  </Badge>
                  <IconButton label="Retirer le domaine" size="sm">
                    <Trash2 size={13} className="text-err" />
                  </IconButton>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          titre="Vérification DNS guidée"
          sousTitre="Les enregistrements exacts à créer, et un bouton pour vérifier la propagation."
        />
        <div className="overflow-x-auto rounded-[6px] border border-g-300">
          <table className="w-full min-w-max border-collapse font-mono text-[12px]">
            <thead>
              <tr className="border-b border-g-300 bg-g-050 text-g-500">
                {['Type', 'Nom', 'Valeur', 'TTL', 'État'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { t: 'CNAME', n: env.domaines[0]?.split('.')[0] ?? 'api', v: `${appNom}.lb.abj.synelia.cloud.`, ttl: 300 },
                { t: 'CAA', n: '@', v: '0 issue "letsencrypt.org"', ttl: 3600 },
              ].map((r) => (
                <tr key={r.t} className="border-b border-g-100 last:border-0">
                  <td className="px-3 py-2 text-ink">{r.t}</td>
                  <td className="px-3 py-2 text-ink">{r.n}</td>
                  <td className="px-3 py-2 text-ink">{r.v}</td>
                  <td className="px-3 py-2 text-g-700">{r.ttl}</td>
                  <td className="px-3 py-2">
                    {verifie ? (
                      <span className="text-ok">propagé</span>
                    ) : (
                      <span className="text-warn">en attente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setVerifie(true)}>
            Vérifier la propagation
          </Button>
          <span className="text-[11.5px] text-g-500">
            La zone dba.africa est hébergée chez Synelia : nous pouvons créer ces enregistrements
            pour vous.
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader titre="Redirections" />
          <div className="space-y-2">
            {[
              { de: 'www.dba.africa', vers: 'dba.africa', code: 301 },
              { de: 'dba.africa/api/*', vers: 'api.dba.africa/*', code: 308 },
            ].map((r) => (
              <div
                key={r.de}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-g-300 px-3 py-2"
              >
                <span className="font-mono text-[11.5px] text-ink">
                  {r.de} → {r.vers}
                </span>
                <Badge tone="neutral" size="sm">
                  HTTP {r.code}
                </Badge>
              </div>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="mt-2.5" iconBefore={<Plus size={12} />}>
            Ajouter une redirection
          </Button>
        </Card>

        <Card>
          <CardHeader titre="Apex et wildcard" />
          <div className="space-y-3.5">
            <Switch
              checked
              label="Domaine apex (dba.africa sans sous-domaine)"
              description="Nous utilisons un enregistrement ALIAS plutôt qu’un CNAME, interdit à l’apex par la norme DNS. Cela fonctionne sur nos zones ; sur une zone externe, un A avec IP fixe est nécessaire."
            />
            <Switch
              checked={false}
              label="Certificat wildcard (*.dba.africa)"
              description="Émission par challenge DNS-01, qui exige que nous puissions écrire un enregistrement TXT dans la zone. Automatique sur nos zones, à déléguer sur une zone externe."
            />
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Déploiement progressif ───────────────────────────────────────────

function OngletProgressif({
  env,
}: {
  env: { nom: string; strategie?: string; canari?: { pct: number; seuil5xx: number; fenetreS: number } }
}) {
  const [strategie, setStrategie] = useState(env.strategie ?? 'rolling')
  const [pctCanari, setPctCanari] = useState(env.canari?.pct ?? 10)
  const [seuil, setSeuil] = useState(env.canari?.seuil5xx ?? 2)
  const [fenetre, setFenetre] = useState(env.canari?.fenetreS ?? 120)
  const [rollbackAuto, setRollbackAuto] = useState(true)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          titre="Stratégie de déploiement"
          sousTitre={`Appliquée à l’environnement ${env.nom}.`}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(
            [
              ['rolling', 'Rolling', 'Remplace les instances une par une. Simple, sans ressources supplémentaires, mais les deux versions coexistent quelques instants.'],
              ['canari', 'Canari', 'Envoie une fraction du trafic vers la nouvelle version, mesure, puis promeut ou revient en arrière. La méthode la plus sûre.'],
              ['blue_green', 'Blue / green', 'Déploie l’intégralité de la nouvelle version en parallèle, puis bascule le trafic d’un coup. Rollback immédiat, mais double les ressources le temps de la bascule.'],
            ] as const
          ).map(([v, t, d]) => (
            <button
              key={v}
              type="button"
              onClick={() => setStrategie(v)}
              className={cn(
                'rounded-[8px] border-2 bg-white p-3.5 text-left transition-colors',
                strategie === v ? 'border-p-700 bg-p-050' : 'border-g-300 hover:border-p-400',
              )}
            >
              <span className="block text-[13px] font-semibold text-ink">{t}</span>
              <span className="mt-1 block text-[12px] leading-snug text-g-700">{d}</span>
            </button>
          ))}
        </div>
      </Card>

      {strategie === 'canari' && (
        <Card>
          <CardHeader titre="Paramètres du canari" />
          <div className="space-y-5">
            <Slider
              label="Part de trafic initiale"
              value={pctCanari}
              onChange={setPctCanari}
              min={1}
              max={50}
              unite="%"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Seuil de taux 5xx" hint="au-delà, rollback">
                <Input
                  type="number"
                  step={0.1}
                  value={seuil}
                  onChange={(e) => setSeuil(Number(e.target.value))}
                  suffix="%"
                />
              </Field>
              <Field label="Fenêtre d’observation">
                <Input
                  type="number"
                  value={fenetre}
                  onChange={(e) => setFenetre(Number(e.target.value))}
                  suffix="s"
                />
              </Field>
            </div>
            <Switch
              checked={rollbackAuto}
              onChange={setRollbackAuto}
              label="Rollback automatique sur dépassement de seuil"
              description={`Si le taux de réponses 5xx dépasse ${seuil} % pendant ${fenetre} secondes, la plateforme revient automatiquement à la version précédente sans intervention humaine.`}
            />
          </div>

          <div className="mt-4 rounded-[8px] border-l-4 border-p-600 bg-p-050 px-3.5 py-3">
            <p className="text-[12.5px] leading-relaxed text-g-700">
              <span className="font-semibold text-ink">La règle appliquée : </span>
              on envoie {pctCanari} % du trafic vers la nouvelle version. Si le taux 5xx dépasse{' '}
              {seuil} % pendant {fenetre} secondes, on revient en arrière. Sinon, on promeut par
              paliers jusqu’à 100 %. C’est exactement ce mécanisme qui a évité un incident le 8 août :
              le déploiement v2.6.4 est monté à 4,2 % de 5xx et a été annulé automatiquement en deux
              minutes.
            </p>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader
          titre="Historique des rollbacks automatiques"
          sousTitre="Chaque annulation automatique est journalisée avec la métrique qui l’a déclenchée."
        />
        <div className="space-y-2.5">
          {[
            {
              v: 'v2.6.4',
              date: '2026-08-08T14:33:00Z',
              raison: 'Taux 5xx à 4,2 % pendant 120 s (seuil 2 %)',
              duree: '1 min 58 s',
            },
            {
              v: 'v2.4.1',
              date: '2026-06-19T11:02:00Z',
              raison: 'Health check en échec sur 3 sondes consécutives',
              duree: '46 s',
            },
          ].map((r) => (
            <div key={r.v} className="border-l-2 border-warn pl-3.5">
              <p className="flex flex-wrap items-center gap-2 text-[12.5px]">
                <span className="font-mono font-semibold text-ink">{r.v}</span>
                <Badge tone="warn" size="sm">
                  Annulé automatiquement
                </Badge>
                <span className="text-g-500">{dateHeure(r.date)}</span>
              </p>
              <p className="mt-0.5 text-[12px] text-g-700">{r.raison}</p>
              <p className="text-[11px] text-g-500">Retour à la version précédente en {r.duree}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Protection ───────────────────────────────────────────────────────

function OngletProtection({
  env,
}: {
  env: { nom: string; protection?: { approbationRequise: boolean; gelJusquau?: string; motDePasse?: boolean } }
}) {
  const [approbation, setApprobation] = useState(env.protection?.approbationRequise ?? false)
  const [gel, setGel] = useState(Boolean(env.protection?.gelJusquau))
  const [motDePasse, setMotDePasse] = useState(env.protection?.motDePasse ?? false)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          titre={`Protection de l’environnement ${env.nom}`}
          sousTitre="Ces garde-fous s’appliquent à tous les déploiements, y compris automatiques."
        />
        <div className="space-y-4">
          <Switch
            checked={approbation}
            onChange={setApprobation}
            label="Approbation obligatoire avant mise en production"
            description="Le déploiement s’arrête après l’analyse DevSecOps et attend la validation d’un Org Admin ou d’un Espace Cloud Admin. La demande apparaît dans le centre de tâches et par notification."
          />
          {approbation && (
            <div className="ml-6 rounded-[6px] border border-g-300 bg-g-050 px-3 py-2.5">
              <MicroLabel className="mb-1.5">Approbateurs habilités</MicroLabel>
              <div className="flex flex-wrap gap-1.5">
                {['Léa Konan · Espace Cloud Admin', 'Fatou Diallo · Project Owner'].map((a) => (
                  <Badge key={a} tone="violet" size="sm">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Switch
            checked={gel}
            onChange={setGel}
            label="Gel de déploiement"
            description="Interdit tout déploiement sur une plage donnée. Utile en période de clôture comptable, pendant une campagne commerciale, ou autour des jours fériés."
          />
          {gel && (
            <div className="ml-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Début du gel">
                <Input type="datetime-local" defaultValue="2026-08-28T18:00" />
              </Field>
              <Field label="Fin du gel">
                <Input type="datetime-local" defaultValue="2026-09-02T08:00" />
              </Field>
            </div>
          )}

          <Switch
            checked={motDePasse}
            onChange={setMotDePasse}
            label="Protéger l’accès par mot de passe"
            description="Une authentification HTTP simple protège l’environnement, en plus de l’application elle-même. À réserver aux environnements de préproduction et de recette — jamais à la production."
          />
          {motDePasse && (
            <div className="ml-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Identifiant">
                <Input defaultValue="preprod" />
              </Field>
              <Field label="Mot de passe">
                <Input type="password" defaultValue="••••••••••" />
              </Field>
            </div>
          )}
        </div>
      </Card>

      {env.nom === 'Production' && !approbation && (
        <Callout ton="warn" titre="Production sans approbation obligatoire">
          Tout déploiement part directement en production. Sur une application exposée à des clients,
          l’approbation obligatoire est le garde-fou le moins coûteux : elle n’ajoute que quelques
          minutes, et elle force une relecture de l’analyse DevSecOps avant la bascule.
        </Callout>
      )}

      <Card>
        <CardHeader titre="Journal des approbations" />
        <div className="space-y-2.5">
          {[
            { v: 'v2.7.1', qui: 'Léa Konan', ts: '2026-08-19T15:06:00Z', decision: 'approuvé' },
            { v: 'v2.7.0', qui: 'Léa Konan', ts: '2026-08-14T10:58:00Z', decision: 'approuvé' },
            { v: 'v2.6.9', qui: 'Fatou Diallo', ts: '2026-08-06T09:14:00Z', decision: 'refusé' },
          ].map((a) => (
            <div key={a.v} className="flex flex-wrap items-center gap-2 border-l-2 border-g-300 pl-3">
              <span className="font-mono text-[12.5px] font-semibold text-ink">{a.v}</span>
              <Badge tone={a.decision === 'approuvé' ? 'ok' : 'err'} size="sm">
                {a.decision}
              </Badge>
              <span className="text-[12px] text-g-700">par {a.qui}</span>
              <span className="text-[11px] text-g-500">{dateHeure(a.ts)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-g-100 pt-3 text-[11.5px] leading-relaxed text-g-500">
          Le refus du 6 août portait sur un constat de sécurité élevé — un secret exposé dans l’image
          — corrigé avant la reprise du déploiement. C’est exactement ce que l’approbation est censée
          attraper.
        </p>
      </Card>
    </div>
  )
}

// ─── Tâches & workers ─────────────────────────────────────────────────

function OngletTaches({ composants }: { composants: (typeof COMPOSANTS)[number][] }) {
  const crons = composants.filter((c) => c.role === 'cron')
  const workers = composants.filter((c) => c.role === 'worker')

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          titre="Tâches planifiées"
          sousTitre="Composants de premier rang, avec leur propre historique d’exécution et leurs journaux."
          actions={
            <Button size="sm" iconBefore={<Plus size={13} />}>
              Ajouter une tâche
            </Button>
          }
        />
        {crons.length === 0 ? (
          <EmptyState
            titre="Aucune tâche planifiée"
            phrase="Une tâche planifiée est un composant à part entière : elle a son image, ses ressources, ses variables et son historique d’exécution — contrairement à un cron caché dans une machine."
          />
        ) : (
          <div className="space-y-3">
            {crons.map((c) => (
              <div key={c.id} className="rounded-[8px] border border-g-300 px-3.5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block font-mono text-[12.5px] font-semibold text-ink">
                      {c.nom}
                    </span>
                    <span className="block text-[11px] text-g-500">
                      {c.envVars.find((v) => v.cle === 'CRON_SCHEDULE')?.valeur ?? '—'} ·{' '}
                      {c.ressources.cpu} vCPU / {c.ressources.ramMo} Mo
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <HealthBadge etat={c.statut} size="sm" />
                    <Button size="sm" variant="ghost">
                      Exécuter maintenant
                    </Button>
                  </span>
                </div>
                <div className="mt-3 overflow-x-auto rounded-[6px] border border-g-300">
                  <table className="w-full min-w-max border-collapse">
                    <thead>
                      <tr className="border-b border-g-300 bg-g-050">
                        {['Exécution', 'Démarrée', 'Durée', 'Code de sortie', 'Journal'].map((h) => (
                          <th key={h} className="type-micro px-3 py-1.5 text-left text-g-500">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { n: 412, ts: '2026-08-19T02:00:04Z', d: 184, code: 0 },
                        { n: 411, ts: '2026-08-18T02:00:03Z', d: 176, code: 0 },
                        { n: 410, ts: '2026-08-17T02:00:05Z', d: 621, code: 1 },
                      ].map((e) => (
                        <tr key={e.n} className="border-b border-g-100 last:border-0">
                          <td className="tnum px-3 py-1.5 text-[12px] text-ink">#{e.n}</td>
                          <td className="px-3 py-1.5 text-[12px] text-g-700">{dateHeure(e.ts)}</td>
                          <td className="tnum px-3 py-1.5 text-[12px] text-g-700">{duree(e.d)}</td>
                          <td className="px-3 py-1.5">
                            <Badge tone={e.code === 0 ? 'ok' : 'err'} size="sm">
                              {e.code}
                            </Badge>
                          </td>
                          <td className="px-3 py-1.5">
                            <Button size="sm" variant="ghost">
                              Voir
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          titre="Workers de file"
          sousTitre="Consommateurs de file d’attente, dimensionnés indépendamment du service web."
          actions={
            <Button size="sm" iconBefore={<Plus size={13} />}>
              Ajouter un worker
            </Button>
          }
        />
        {workers.length === 0 ? (
          <EmptyState
            titre="Aucun worker de file"
            phrase="Un worker consomme une file d’attente en arrière-plan. Le séparer du service web permet de le dimensionner selon la profondeur de la file, pas selon le trafic HTTP."
          />
        ) : (
          <div className="space-y-3">
            {workers.map((w) => (
              <div key={w.id} className="rounded-[8px] border border-g-300 px-3.5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block font-mono text-[12.5px] font-semibold text-ink">
                      {w.nom}
                    </span>
                    <span className="block text-[11px] text-g-500">
                      {w.image}:{w.version} · {w.ressources.cpu} vCPU / {w.ressources.ramMo} Mo
                    </span>
                  </span>
                  <HealthBadge etat={w.statut} size="sm" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-[6px] bg-g-050 px-2.5 py-2">
                    <p className="type-micro text-g-500">Messages en file</p>
                    <p className="tnum mt-0.5 text-[14px] font-bold text-warn">1 284</p>
                  </div>
                  <div className="rounded-[6px] bg-g-050 px-2.5 py-2">
                    <p className="type-micro text-g-500">Débit</p>
                    <p className="tnum mt-0.5 text-[14px] font-bold text-g-500">0 msg/s</p>
                  </div>
                  <div className="rounded-[6px] bg-g-050 px-2.5 py-2">
                    <p className="type-micro text-g-500">Échecs 24 h</p>
                    <p className="tnum mt-0.5 text-[14px] font-bold text-err">42</p>
                  </div>
                </div>
                {w.statut === 'failed' && (
                  <Callout ton="err" className="mt-3" titre="Worker arrêté, file en croissance">
                    Le worker ne démarre plus depuis l’échec de build du 19 août. La file compte 1 284
                    messages non traités ; ils ne sont pas perdus, mais le rapprochement bancaire
                    quotidien ne s’exécute plus. Corrigez le build en priorité.
                  </Callout>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
