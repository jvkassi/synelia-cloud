'use client'

import Link from 'next/link'
import { ExternalLink, Plus, Power, RotateCw, Stethoscope } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pct, relatif } from '@/lib/format'
import { APPLICATIONS, ANOMALIES, DEPLOIEMENTS, ENVIRONNEMENTS, envsDeLApp } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { PageHeader, Card, Callout } from '@/components/composition/card'
import { HealthBadge, StatTile } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { AnomalieCard } from '@/components/business/paas'
import { useApp } from '@/components/app/contexte'

export default function Applications() {
  const { autorise, refus, pousser } = useApp()

  const enLigne = ENVIRONNEMENTS.filter((e) => e.statut === 'running').length
  const enEchec = DEPLOIEMENTS.filter((d) => d.statut === 'failed').length
  const alertes = ENVIRONNEMENTS.filter(
    (e) => e.statut === 'degraded' || e.statut === 'failed',
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Applications' }]}
        titre="Applications"
        sousTitre="Du dépôt Git au domaine en production : build, analyse DevSecOps, provisioning et déploiement sans coupure. Chaque composant affiche son emplacement réel d’exécution — quelles machines, ou quel namespace et quels pods."
        actions={
          <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
            <ButtonLink href="/app/apps/new" iconBefore={<Plus size={14} />}>
              Nouveau déploiement
            </ButtonLink>
          </GatedAction>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          libelle="Applications en ligne"
          valeur={APPLICATIONS.filter((a) => a.sante === 'sain').length}
          detail={`sur ${APPLICATIONS.length} applications`}
          ton="ok"
        />
        <StatTile
          libelle="Déploiements en échec"
          valeur={enEchec}
          ton={enEchec > 0 ? 'err' : 'ok'}
          detail={enEchec > 0 ? 'batch-worker · Production' : 'Aucun échec'}
        />
        <StatTile
          libelle="Environnements"
          valeur={ENVIRONNEMENTS.length}
          detail={`${enLigne} en marche`}
        />
        <StatTile
          libelle="Alertes"
          valeur={alertes}
          ton={alertes > 0 ? 'warn' : 'ok'}
          detail={alertes > 0 ? 'analytics dégradé, batch-worker en échec' : 'Tout est sain'}
        />
      </div>

      {ANOMALIES.length > 0 && (
        <section className="space-y-3">
          <MicroLabel className="text-m-600">Détection d’anomalie</MicroLabel>
          <div className="grid gap-4 lg:grid-cols-2">
            {ANOMALIES.map((a) => (
              <AnomalieCard key={a.id} anomalie={a} />
            ))}
          </div>
        </section>
      )}

      {APPLICATIONS.length === 0 ? (
        <EmptyState
          titre="Aucune application"
          phrase="Une application regroupe des composants, des environnements et un pipeline de déploiement. Connectez un dépôt Git, choisissez une image Docker, ou composez librement depuis le canvas."
          action={{ libelle: 'Créer une application', href: '/app/apps/new' }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {APPLICATIONS.map((app) => {
            const envs = envsDeLApp(app.id)
            const prod = envs.find((e) => e.nom === 'Production')
            const dernier = DEPLOIEMENTS.filter((d) => d.appId === app.id).sort((a, b) =>
              b.startedAt.localeCompare(a.startedAt),
            )[0]

            return (
              <Card key={app.id} className="flex flex-col" hover>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/app/apps/${app.id}`}
                      className="block truncate font-mono text-[14px] font-bold text-ink hover:text-p-700"
                    >
                      {app.nom}
                    </Link>
                    {app.domainePrincipal !== '—' ? (
                      <a
                        href={`https://${app.domainePrincipal}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-p-700 hover:text-m-600"
                      >
                        {app.domainePrincipal}
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="mt-0.5 block text-[11.5px] text-g-500">
                        Aucun domaine exposé
                      </span>
                    )}
                  </div>
                  <HealthBadge etat={app.sante} size="sm" />
                </div>

                <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-g-700">
                  {app.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {app.stack.slice(0, 4).map((s) => (
                    <Badge key={s} tone="neutral" size="sm">
                      {s}
                    </Badge>
                  ))}
                  {app.stack.length > 4 && (
                    <Badge tone="neutral" size="sm">
                      +{app.stack.length - 4}
                    </Badge>
                  )}
                </div>

                <dl className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-g-100 pt-3">
                  <Meta cle="Cible" valeur={app.cible === 'k8s' ? 'Kubernetes' : 'Machines'} />
                  <Meta
                    cle="Source"
                    valeur={
                      app.source === 'git'
                        ? `Git · ${app.repo?.branche}`
                        : app.source === 'image'
                          ? 'Image Docker'
                          : 'Canvas'
                    }
                  />
                  <Meta cle="Environnements" valeur={`${envs.length}`} />
                  <Meta cle="Dernier déploiement" valeur={relatif(app.dernierDeploiement)} />
                </dl>

                {prod && (
                  <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-[6px] bg-g-050 px-2.5 py-2">
                    <Sante libelle="CPU" valeur={prod.sante.cpu} unite="%" seuil={80} />
                    <Sante libelle="RAM" valeur={prod.sante.ram} unite="%" seuil={85} />
                    <Sante libelle="Latence" valeur={prod.sante.latenceMs} unite="ms" seuil={200} />
                    <Sante libelle="Erreurs" valeur={prod.sante.erreursPct} unite="%" seuil={1} />
                  </div>
                )}

                {dernier && (
                  <p className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-g-500">
                    <span className="font-mono">{dernier.version}</span>
                    {dernier.commit && <span className="font-mono">· {dernier.commit}</span>}
                    <Badge
                      tone={
                        dernier.statut === 'live'
                          ? 'ok'
                          : dernier.statut === 'failed'
                            ? 'err'
                            : dernier.statut === 'rolled_back'
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
                        }[dernier.statut]
                      }
                    </Badge>
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-g-100 pt-3.5">
                  <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
                    <Button
                      size="sm"
                      variant="secondary"
                      iconBefore={<RotateCw size={12} />}
                      onClick={() =>
                        pousser({
                          ton: 'info',
                          titre: `Redéploiement de ${app.nom}`,
                          detail: 'L’artefact existant est rejoué, sans rebuild.',
                        })
                      }
                    >
                      Redéployer
                    </Button>
                  </GatedAction>
                  <GatedAction
                    autorise={autorise('component.restart')}
                    message={refus('component.restart')}
                  >
                    <Button size="sm" variant="ghost" iconBefore={<Power size={12} />}>
                      {app.sante === 'arrete' ? 'Démarrer' : 'Arrêter'}
                    </Button>
                  </GatedAction>
                  {(app.sante === 'degrade' || app.sante === 'echec') && (
                    <Button size="sm" variant="ghost" iconBefore={<Stethoscope size={12} />}>
                      Diagnostiquer
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Callout ton="violet" titre="L’emplacement réel d’exécution, exposé">
          Peu de plateformes vous disent sur quelles machines ou dans quels pods tourne réellement
          votre composant. Nous l’affichons, parce qu’un incident de production commence toujours par
          la question « où ça tourne, exactement ? ». Vous le trouverez dans le détail de chaque
          composant.
        </Callout>
        <Callout ton="info" titre="Le faisceau de preuves, plutôt qu’une alerte sèche">
          Quand nous détectons une anomalie, nous ne nous contentons pas de l’annoncer : nous listons
          les faits corrélés qui nous y conduisent — un déploiement une minute avant le pic, absence
          de pic de trafic, cycles de ramasse-miettes en hausse. C’est ce qui permet de valider ou
          d’écarter le diagnostic plutôt que de le croire.
        </Callout>
      </div>
    </div>
  )
}

function Meta({ cle, valeur }: { cle: string; valeur: string }) {
  return (
    <div className="min-w-0">
      <dt className="type-micro text-g-500">{cle}</dt>
      <dd className="mt-0.5 truncate text-[12px] text-ink">{valeur}</dd>
    </div>
  )
}

function Sante({
  libelle,
  valeur,
  unite,
  seuil,
}: {
  libelle: string
  valeur: number
  unite: string
  seuil: number
}) {
  const alerte = valeur > seuil
  return (
    <div className="text-center">
      <p className="type-micro text-g-500">{libelle}</p>
      <p
        className={cn(
          'tnum mt-0.5 text-[12.5px] font-bold',
          alerte ? 'text-err' : valeur === 0 ? 'text-g-300' : 'text-ink',
        )}
      >
        {valeur}
        <span className="text-[9px] font-semibold text-g-500">{unite}</span>
      </p>
    </div>
  )
}
