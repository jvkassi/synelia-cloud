'use client'

import { useState } from 'react'
import { Download, Plus, ShieldAlert, Trash2 } from 'lucide-react'
import { cn, seededSeries } from '@/lib/utils'
import { dateCourte, goHumain, num, pct } from '@/lib/format'
import { SITE_LABEL, ROLE_LABEL, type Role } from '@/lib/types'
import { K8S_CLUSTERS, espaceById } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { CodeBlock, CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { HealthBadge, QuotaBar, StatTile } from '@/components/composition/metrics'
import { GrilleSparkCharts } from '@/components/business/observabilite'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'apercu', label: 'Vue d’ensemble' },
  { id: 'noeuds', label: 'Nœuds' },
  { id: 'pools', label: 'Pools' },
  { id: 'modules', label: 'Modules installés' },
  { id: 'registre', label: 'Registre d’images' },
  { id: 'acces', label: 'Accès' },
]

const IMAGES_REGISTRE = [
  { depot: 'dba/app-metier', etiquettes: 24, taille: 1840, cveElevees: 0, cveMoyennes: 3, derniere: '2026-08-19' },
  { depot: 'dba/analytics', etiquettes: 18, taille: 2610, cveElevees: 1, cveMoyennes: 7, derniere: '2026-08-18' },
  { depot: 'dba/batch-worker', etiquettes: 11, taille: 940, cveElevees: 2, cveMoyennes: 9, derniere: '2026-08-19' },
  { depot: 'dba/site-vitrine', etiquettes: 32, taille: 210, cveElevees: 0, cveMoyennes: 1, derniere: '2026-08-17' },
]

const MAPPING_ROLES: Array<{ role: Role; k8s: string; namespaces: string }> = [
  { role: 'org_admin', k8s: 'cluster-admin', namespaces: 'tous' },
  { role: 'espace_admin', k8s: 'admin', namespaces: 'tous' },
  { role: 'project_owner', k8s: 'edit', namespaces: 'ceux de son application' },
  { role: 'operator', k8s: 'view + exec sur les pods', namespaces: 'ceux de son application' },
  { role: 'read_only', k8s: 'view', namespaces: 'tous' },
]

export function VueCluster({ id }: { id: string }) {
  const cluster = K8S_CLUSTERS.find((c) => c.id === id)!
  const espace = espaceById(cluster.espaceId)
  const { autorise, refus, pousser, lancer } = useApp()
  const [onglet, setOnglet] = useState('apercu')

  const noeudsTotal = cluster.pools.reduce((a, p) => a + p.nodes, 0)
  const vcpuTotal = cluster.pools.reduce((a, p) => {
    const v = Number(p.flavor.match(/(\d+) vCPU/)?.[1] ?? 4)
    return a + v * p.nodes
  }, 0)
  const ramTotal = cluster.pools.reduce((a, p) => {
    const r = Number(p.flavor.match(/(\d+) Go/)?.[1] ?? 8)
    return a + r * p.nodes
  }, 0)

  const kubeconfig = `apiVersion: v1
kind: Config
clusters:
  - name: ${cluster.nom}
    cluster:
      server: https://${cluster.nom}.k8s.${cluster.site.toLowerCase()}.synelia.cloud:6443
      certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t…
contexts:
  - name: ${cluster.nom}
    context:
      cluster: ${cluster.nom}
      user: oidc-synelia
      namespace: default
current-context: ${cluster.nom}
users:
  - name: oidc-synelia
    user:
      exec:
        apiVersion: client.authentication.k8s.io/v1
        command: kubectl-synelia-auth
        args: ["--realm", "dba-africa", "--cluster", "${cluster.nom}"]`

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: espace?.code ?? '', href: `/app/espaces/${cluster.espaceId}` },
          { label: 'Kubernetes', href: '/app/kubernetes' },
          { label: cluster.nom },
        ]}
        titre={<span className="font-mono">{cluster.nom}</span>}
        sousTitre={`Kubernetes ${cluster.version} · control plane ${cluster.controlPlane.mode === 'ha' ? `haute disponibilité (${cluster.controlPlane.nodes} masters)` : 'mono-master'} · ${noeudsTotal} nœuds workers · ${SITE_LABEL[cluster.site]}`}
        meta={
          <>
            <HealthBadge etat={cluster.statut} />
            <Badge tone="neutral">v{cluster.version}</Badge>
            <Badge tone={cluster.controlPlane.mode === 'ha' ? 'ok' : 'neutral'}>
              {cluster.controlPlane.mode === 'ha' ? 'HA' : 'Mono-master'}
            </Badge>
            <Badge tone="violet">{cluster.modules.length} modules</Badge>
          </>
        }
        actions={
          <>
            <Button
              variant="secondary"
              iconBefore={<Download size={14} />}
              onClick={() =>
                pousser({
                  ton: 'ok',
                  titre: 'kubeconfig téléchargé',
                  detail: 'L’authentification passe par votre identité Synelia, pas par un jeton statique.',
                })
              }
            >
              Télécharger le kubeconfig
            </Button>
            <GatedAction autorise={autorise('espace.quota.update')} message={refus('espace.quota.update')}>
              <Button variant="ghost" onClick={() => lancer('k8s.upgrade', cluster.nom)}>
                Mettre à jour la version
              </Button>
            </GatedAction>
          </>
        }
      />

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {/* Vue d'ensemble */}
      {onglet === 'apercu' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile libelle="Nœuds" valeur={noeudsTotal} detail={`${cluster.pools.length} pools`} />
            <StatTile
              libelle="vCPU du cluster"
              valeur={vcpuTotal}
              detail="Consommés sur le quota de l’espace"
            />
            <StatTile libelle="Mémoire" valeur={`${num(ramTotal)}`} unite="Go" />
            <StatTile
              libelle="Pods en exécution"
              valeur={num(noeudsTotal * 14)}
              serie={seededSeries(`${id}-pods`, 24, noeudsTotal * 11, noeudsTotal * 17)}
            />
            <StatTile
              libelle="Namespaces"
              valeur={cluster.applicationId ? 4 : 2}
              detail="Un par environnement"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                titre="Accès au cluster"
                sousTitre="L’authentification passe par votre identité Synelia via OIDC — aucun jeton statique à faire circuler."
              />
              <div className="space-y-3">
                <CopyField
                  label="Endpoint de l’API"
                  value={`https://${cluster.nom}.k8s.${cluster.site.toLowerCase()}.synelia.cloud:6443`}
                />
                <CopyField
                  label="Commande de connexion"
                  value={`kubectl --context ${cluster.nom} get nodes`}
                />
              </div>
              <div className="mt-4">
                <MicroLabel className="mb-2">kubeconfig</MicroLabel>
                <CodeBlock code={kubeconfig} langue="yaml" />
              </div>
            </Card>

            <Card>
              <CardHeader titre="Control plane" />
              <KeyValueList
                colonnes={1}
                items={[
                  {
                    cle: 'Mode',
                    valeur:
                      cluster.controlPlane.mode === 'ha'
                        ? `Haute disponibilité · ${cluster.controlPlane.nodes} masters`
                        : 'Mono-master',
                  },
                  { cle: 'Version', valeur: cluster.version },
                  { cle: 'Exploitation', valeur: 'Assurée par Synelia' },
                  { cle: 'Sauvegarde etcd', valeur: 'Toutes les heures, rétention 7 jours' },
                  { cle: 'Site', valeur: SITE_LABEL[cluster.site] },
                ]}
              />
              {cluster.controlPlane.mode === 'single' && (
                <Callout ton="warn" className="mt-3.5" titre="Control plane non redondant">
                  Pendant une maintenance du master, l’API Kubernetes est momentanément
                  indisponible. Les pods déjà en exécution continuent de tourner, mais l’autoscaling
                  et les déploiements sont suspendus. Acceptable en recette, à reconsidérer en
                  production.
                </Callout>
              )}
            </Card>
          </div>

          <GrilleSparkCharts
            seed={`k8s-${id}`}
            metriques={[
              { titre: 'CPU du cluster', unite: '%', min: 28, max: 64 },
              { titre: 'Mémoire du cluster', unite: '%', min: 44, max: 78, seuil: 90 },
              { titre: 'Pods en exécution', unite: '', min: noeudsTotal * 11, max: noeudsTotal * 17, couleur: 'var(--color-m-600)' },
              { titre: 'Latence de l’API', unite: 'ms', min: 8, max: 42, seuil: 200 },
            ]}
          />
        </div>
      )}

      {/* Nœuds */}
      {onglet === 'noeuds' && (
        <Card>
          <CardHeader
            titre="Nœuds du cluster"
            sousTitre="Les nœuds sont gérés par leur pool : ne les modifiez pas individuellement, ajustez le pool."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr className="border-b border-g-300 bg-g-050">
                  {['Nœud', 'Pool', 'Gabarit', 'CPU', 'Mémoire', 'Pods', 'État', ''].map((h) => (
                    <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cluster.pools.flatMap((p) =>
                  Array.from({ length: p.nodes }, (_, i) => {
                    const cpu = seededSeries(`${id}-${p.nom}-${i}-cpu`, 1, 22, 68)[0]
                    const mem = seededSeries(`${id}-${p.nom}-${i}-mem`, 1, 38, 82)[0]
                    return (
                      <tr
                        key={`${p.nom}-${i}`}
                        className="border-b border-g-100 last:border-0 hover:bg-p-050/60"
                      >
                        <td className="px-3 py-2.5 font-mono text-[12px] text-ink">
                          {cluster.nom}-{p.nom}-{String(i + 1).padStart(2, '0')}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            tone={
                              p.type === 'gpu'
                                ? 'accent'
                                : p.type === 'preemptible'
                                  ? 'warn'
                                  : p.type === 'memory'
                                    ? 'violet'
                                    : 'neutral'
                            }
                            size="sm"
                          >
                            {p.nom}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-[12px] text-g-700">{p.flavor}</td>
                        <td className="px-3 py-2.5">
                          <span className="block w-24">
                            <QuotaBar utilise={cpu} total={100} compact formateur={(v) => `${v}%`} />
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="block w-24">
                            <QuotaBar
                              utilise={mem}
                              total={100}
                              compact
                              seuil={85}
                              formateur={(v) => `${v}%`}
                            />
                          </span>
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                          {12 + ((i * 3) % 8)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone="ok" dot size="sm">
                            Ready
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button size="sm" variant="ghost">
                            Drainer
                          </Button>
                        </td>
                      </tr>
                    )
                  }),
                )}
              </tbody>
            </table>
          </div>
          <Callout ton="info" className="mt-4" titre="Drainer un nœud">
            Le drainage évacue proprement les pods vers les autres nœuds en respectant les budgets de
            perturbation (PodDisruptionBudget) que vous avez déclarés. C’est l’opération à faire
            avant toute intervention sur un nœud. Si un budget bloque le drainage, nous ne le forçons
            pas : c’est à vous de décider.
          </Callout>
        </Card>
      )}

      {/* Pools */}
      {onglet === 'pools' && (
        <div className="space-y-4">
          {cluster.pools.map((p) => (
            <Card key={p.nom}>
              <CardHeader
                titre={<span className="font-mono">{p.nom}</span>}
                sousTitre={`${p.flavor} · disque ${p.diskGo ?? 100} Go`}
                actions={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      tone={
                        p.type === 'gpu'
                          ? 'accent'
                          : p.type === 'preemptible'
                            ? 'warn'
                            : p.type === 'memory'
                              ? 'violet'
                              : 'neutral'
                      }
                    >
                      {{
                        standard: 'Usage général',
                        memory: 'Optimisé mémoire',
                        gpu: 'GPU / vGPU',
                        preemptible: 'Préemptible · −60 %',
                      }[p.type]}
                    </Badge>
                    {p.autoscale && <Badge tone="ok">Autoscaling</Badge>}
                  </div>
                }
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Nombre de nœuds">
                  <Input type="number" defaultValue={p.nodes} min={0} max={40} />
                </Field>
                {p.autoscale && (
                  <>
                    <Field label="Minimum">
                      <Input type="number" defaultValue={p.autoscale.min} min={0} />
                    </Field>
                    <Field label="Maximum">
                      <Input type="number" defaultValue={p.autoscale.max} min={1} />
                    </Field>
                  </>
                )}
                <Field label="Disque par nœud">
                  <Input type="number" defaultValue={p.diskGo ?? 100} suffix="Go" />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-g-100 pt-4 sm:grid-cols-2">
                <div>
                  <MicroLabel className="mb-1.5">Étiquettes</MicroLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {(p.labels ?? []).length > 0 ? (
                      (p.labels ?? []).map((l) => (
                        <Badge key={l} tone="neutral" size="sm">
                          <span className="font-mono">{l}</span>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[12px] text-g-500">Aucune</span>
                    )}
                  </div>
                </div>
                <div>
                  <MicroLabel className="mb-1.5">Taints</MicroLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {(p.taints ?? []).length > 0 ? (
                      (p.taints ?? []).map((t) => (
                        <Badge key={t} tone="warn" size="sm">
                          <span className="font-mono">{t}</span>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[12px] text-g-500">Aucun</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-g-100 pt-3.5">
                <GatedAction
                  autorise={autorise('espace.quota.update')}
                  message={refus('espace.quota.update')}
                >
                  <Button size="sm" onClick={() => lancer('k8s.pool.scale', `${cluster.nom} · ${p.nom}`)}>
                    Appliquer
                  </Button>
                </GatedAction>
                <GatedAction
                  autorise={autorise('espace.quota.update')}
                  message={refus('espace.quota.update')}
                >
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => lancer('k8s.pool.roll', `${cluster.nom} · ${p.nom}`)}
                  >
                    Mise à jour progressive
                  </Button>
                </GatedAction>
                <IconButton label="Supprimer le pool" size="sm">
                  <Trash2 size={13} className="text-err" />
                </IconButton>
              </div>

              {p.type === 'preemptible' && (
                <Callout ton="warn" className="mt-3.5" titre="Nœuds préemptibles">
                  Ces nœuds peuvent être récupérés par la plateforme avec un préavis de trente
                  secondes. Réservez-les aux charges tolérantes à l’interruption, et déclarez un
                  taint pour éviter qu’un service synchrone n’y soit placé par erreur.
                </Callout>
              )}
            </Card>
          ))}
          <Button variant="secondary" iconBefore={<Plus size={14} />}>
            Ajouter un pool
          </Button>
        </div>
      )}

      {/* Modules */}
      {onglet === 'modules' && (
        <Card>
          <CardHeader
            titre="Modules installés"
            sousTitre="Charts Helm préqualifiés par nos équipes. Vous restez libre d’installer vos propres charts en parallèle."
            actions={
              <Button size="sm" variant="secondary" iconBefore={<Plus size={13} />}>
                Installer un module
              </Button>
            }
          />
          <div className="space-y-2">
            {cluster.modules.map((m) => {
              const [nom, version] = m.split(' ')
              return (
                <div
                  key={m}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-[12.5px] font-semibold text-ink">
                      {nom}
                    </span>
                    <span className="block text-[11px] text-g-500">
                      {{
                        'ingress-nginx': 'Contrôleur d’entrée HTTP/HTTPS',
                        'cert-manager': 'Émission et renouvellement automatiques des certificats',
                        argocd: 'Livraison continue en GitOps',
                        'external-dns': 'Synchronisation automatique des enregistrements DNS',
                        'rook-ceph': 'Stockage persistant distribué',
                        velero: 'Sauvegarde et restauration du cluster',
                      }[nom] ?? 'Module Kubernetes'}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge tone="neutral" size="sm">
                      <span className="font-mono">{version}</span>
                    </Badge>
                    <Badge tone="ok" dot size="sm">
                      Sain
                    </Badge>
                    <GatedAction
                      autorise={autorise('espace.quota.update')}
                      message={refus('espace.quota.update')}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => lancer('k8s.module.update', `${nom} · ${cluster.nom}`)}
                      >
                        Mettre à jour
                      </Button>
                    </GatedAction>
                  </span>
                </div>
              )
            })}
          </div>
          <Callout ton="violet" className="mt-4" titre="Ce que « préqualifié » signifie">
            Nous testons chaque version de ces modules sur un cluster de référence avant de la
            proposer, et nous nous engageons sur leur bon fonctionnement. Un chart que vous
            installez vous-même reste sous votre responsabilité — nous vous aiderons à diagnostiquer,
            sans engagement de service dessus.
          </Callout>
        </Card>
      )}

      {/* Registre */}
      {onglet === 'registre' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <StatTile libelle="Dépôts" valeur={IMAGES_REGISTRE.length} />
            <StatTile
              libelle="Étiquettes"
              valeur={IMAGES_REGISTRE.reduce((a, i) => a + i.etiquettes, 0)}
            />
            <StatTile
              libelle="Volume"
              valeur={goHumain(IMAGES_REGISTRE.reduce((a, i) => a + i.taille, 0))}
            />
            <StatTile
              libelle="CVE élevées ouvertes"
              valeur={IMAGES_REGISTRE.reduce((a, i) => a + i.cveElevees, 0)}
              ton="err"
            />
          </div>

          <Card>
            <CardHeader
              titre="Dépôts d’images"
              sousTitre="Chaque poussée déclenche un scan de vulnérabilités."
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Dépôt', 'Étiquettes', 'Volume', 'CVE élevées', 'CVE moyennes', 'Dernière poussée'].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {IMAGES_REGISTRE.map((i) => (
                    <tr key={i.depot} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5 font-mono text-[12.5px] text-ink">{i.depot}</td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">{i.etiquettes}</td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">
                        {goHumain(i.taille)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={i.cveElevees > 0 ? 'err' : 'ok'} size="sm">
                          {i.cveElevees}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={i.cveMoyennes > 5 ? 'warn' : 'neutral'} size="sm">
                          {i.cveMoyennes}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-g-700">
                        {dateCourte(i.derniere)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 border-t border-g-100 pt-4">
              <MicroLabel className="mb-2">Rétention des étiquettes</MicroLabel>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Conserver au minimum">
                  <Input type="number" defaultValue={10} suffix="étiquettes" />
                </Field>
                <Field label="Purger au-delà de">
                  <Input type="number" defaultValue={90} suffix="jours" />
                </Field>
                <Field label="Étiquettes protégées" hint="jamais purgées">
                  <Input defaultValue="v*, latest, stable" className="font-mono" />
                </Field>
              </div>
            </div>
          </Card>

          {IMAGES_REGISTRE.some((i) => i.cveElevees > 0) && (
            <Callout ton="err" titre="Des CVE de gravité élevée sont ouvertes">
              <span className="font-mono text-[12px]">dba/batch-worker</span> porte deux
              vulnérabilités élevées, et <span className="font-mono text-[12px]">dba/analytics</span>{' '}
              une. Nous n’interdisons pas leur déploiement — ce serait vous bloquer sans vous aider —
              mais l’étape d’analyse DevSecOps du pipeline les signale à chaque déploiement, avec le
              correctif à appliquer.
            </Callout>
          )}
        </div>
      )}

      {/* Accès */}
      {onglet === 'acces' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Correspondance des rôles Synelia vers les rôles Kubernetes"
              sousTitre="L’authentification passe par OIDC : vos utilisateurs se connectent avec leur identité Synelia, et leurs droits Kubernetes en découlent."
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Rôle Synelia', 'ClusterRole Kubernetes', 'Namespaces accessibles'].map((h) => (
                      <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MAPPING_ROLES.map((m) => (
                    <tr key={m.role} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5">
                        <Badge tone="violet" size="sm">
                          {ROLE_LABEL[m.role]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-ink">{m.k8s}</td>
                      <td className="px-3 py-2.5 text-[12.5px] text-g-700">{m.namespaces}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader
              titre="Namespaces par environnement"
              sousTitre="Un namespace par environnement applicatif, avec quotas et politiques réseau."
            />
            <div className="space-y-2">
              {(cluster.applicationId
                ? ['analytics-prod', 'analytics-preprod', 'analytics-dev', 'kube-system']
                : ['default', 'kube-system']
              ).map((ns) => (
                <div
                  key={ns}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-[12.5px] font-semibold text-ink">
                      {ns}
                    </span>
                    <span className="block text-[11px] text-g-500">
                      {ns === 'kube-system'
                        ? 'Système — géré par Synelia, non modifiable'
                        : `Quota : 8 vCPU · 32 Go · 20 pods`}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {ns === 'kube-system' ? (
                      <Badge tone="neutral" size="sm">
                        Réservé
                      </Badge>
                    ) : (
                      <>
                        <Badge tone="ok" size="sm">
                          NetworkPolicy active
                        </Badge>
                        <Button size="sm" variant="ghost">
                          Quotas
                        </Button>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <Callout ton="info" className="mt-4" titre="Isolation réseau entre namespaces">
              Une NetworkPolicy par défaut refuse le trafic entrant inter-namespace. Vos
              environnements sont donc isolés les uns des autres, même sur un cluster partagé — un
              pod de développement ne peut pas joindre la base de production.
            </Callout>
          </Card>

          <Card>
            <CardHeader titre="Options d’accès" />
            <div className="space-y-3.5">
              <Switch
                checked
                label="Authentification OIDC obligatoire"
                description="Aucun jeton de compte de service statique n’est distribué. Les accès expirent avec la session Synelia."
              />
              <Switch
                checked
                label="Journaliser les accès à l’API dans l’audit"
                description="Chaque appel modifiant une ressource apparaît dans votre journal d’audit, avec l’acteur et l’objet visé."
              />
              <Switch
                checked={false}
                label="Exposer l’API sur Internet"
                description="Par défaut, l’API n’est joignable que depuis vos réseaux privés et le pool VPN. L’exposition publique élargit fortement la surface d’attaque."
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
