'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Boxes, Globe, Layers, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAINTENANT, money, relatif } from '@/lib/format'
import type { K8sCluster, Projet, ServiceProjet, TypeServiceProjet } from '@/lib/types'
import {
  ESPACES,
  K8S_CLUSTERS,
  PROJETS,
  SERVICES_PROJET,
  TYPE_SERVICE_LABEL,
  ZONE_APPLICATIVE,
  syntheseDeServices,
} from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { CopyField, GatedAction } from '@/components/ui/display'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { Card, CardHeader, Callout, PageHeader } from '@/components/composition/card'
import { CostPreview } from '@/components/composition/flow'
import { StatTile } from '@/components/composition/metrics'
import { Drawer } from '@/components/ui/overlay'
import { ICONE_TYPE } from '@/components/business/projets'
import { useApp, useEspace } from '@/components/app/contexte'
import { useAtelier, useCollection } from '@/components/app/atelier'
import { useOperation } from '@/components/app/actions'

/** Un projet naît toujours avec un cluster Kubernetes dédié — trois tailles suffisent au départ, ajustables ensuite depuis Kubernetes. */
const TAILLES_CLUSTER = [
  { id: 'petit', label: 'Petit', detail: '3 nœuds · 4 vCPU · 8 Go', flavor: '4 vCPU · 8 Go', nodes: 3, prixNoeud: 7800 },
  { id: 'moyen', label: 'Moyen', detail: '3 nœuds · 8 vCPU · 16 Go', flavor: '8 vCPU · 16 Go', nodes: 3, prixNoeud: 15600 },
  { id: 'grand', label: 'Grand', detail: '5 nœuds · 8 vCPU · 32 Go', flavor: '8 vCPU · 32 Go', nodes: 5, prixNoeud: 24800 },
] as const

export default function Projets() {
  return (
    <Suspense fallback={null}>
      <ProjetsInterne />
    </Suspense>
  )
}

/** Isolé pour `useSearchParams`, qui exige un contour de Suspense. */
function ProjetsInterne() {
  const { autorise, refus } = useApp()
  const espace = useEspace()
  const searchParams = useSearchParams()
  const lesProjets = useCollection<Projet>('projets', PROJETS)
  const lesServices = useCollection<ServiceProjet>('services-projet', SERVICES_PROJET)
  const grappes = useCollection<K8sCluster>('clusters', K8S_CLUSTERS)
  const { lancerJob } = useAtelier()
  const executer = useOperation()
  const [creation, setCreation] = useState(searchParams.get('creer') === '1')
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [espaceId, setEspaceId] = useState(espace.id)
  const [modeCluster, setModeCluster] = useState<'nouveau' | 'existant'>('nouveau')
  const [tailleId, setTailleId] = useState<(typeof TAILLES_CLUSTER)[number]['id']>('moyen')
  const [clusterExistantId, setClusterExistantId] = useState('')

  const servicesDe = (projetId: string) =>
    lesServices.items.filter((x) => x.projetId === projetId)

  // Le panneau de gauche choisit l'Espace Cloud : cette liste doit s'y tenir,
  // sinon le sélecteur ne dit pas la vérité. Les agrégats se recalculent donc
  // sur les projets visibles, et non sur tout le parc.
  const projets = lesProjets.items.filter((p) => p.espaceId === espace.id)

  const espaceCible = ESPACES.find((e) => e.id === espaceId) ?? espace
  const clustersDisponibles = grappes.items.filter((c) => c.espaceId === espaceCible.id)
  const modeClusterEffectif = clustersDisponibles.length === 0 ? 'nouveau' : modeCluster
  const clusterExistantEffectif =
    clusterExistantId && clustersDisponibles.some((c) => c.id === clusterExistantId)
      ? clusterExistantId
      : (clustersDisponibles[0]?.id ?? '')
  const taille = TAILLES_CLUSTER.find((t) => t.id === tailleId)!

  const creerProjet = () => {
    const idProjet = lesProjets.identifiant('prj')
    let clusterId = clusterExistantEffectif

    if (modeClusterEffectif === 'nouveau') {
      const cluster: K8sCluster = {
        id: grappes.identifiant('k8s'),
        espaceId: espaceCible.id,
        nom: `${nom.trim()}-k8s`,
        version: '1.31.2',
        controlPlane: { mode: 'ha', nodes: 3 },
        pools: [
          { nom: 'pool-defaut', nodes: taille.nodes, flavor: taille.flavor, diskGo: 100, type: 'standard' },
        ],
        modules: ['ingress-nginx 4.11.2', 'cert-manager 1.15.3', 'velero 1.14.1'],
        statut: 'provisioning',
        site: espaceCible.site,
      }
      grappes.creer(cluster)
      clusterId = cluster.id
      lancerJob({
        workflow: 'k8s.create',
        cible: `${cluster.nom} · ${espaceCible.site}`,
        alFin: () => grappes.modifier(cluster.id, { statut: 'running' }),
      })
    }

    executer({
      action: 'app.deploy',
      titre: `Projet « ${nom.trim()} » créé`,
      detail:
        modeClusterEffectif === 'nouveau'
          ? 'Cluster Kubernetes dédié en cours de provisionnement. Aucun service : la facturation du projet commence au premier déploiement.'
          : 'Rattaché à un cluster existant. Aucun service : la facturation du projet commence au premier déploiement.',
      effet: () =>
        lesProjets.creer({
          id: idProjet,
          nom: nom.trim(),
          description: description.trim(),
          espaceId: espaceCible.id,
          clusterId,
          cree: MAINTENANT,
          environnements: ['Production'],
          variables: [],
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      job: { workflow: 'projet.create', cible: nom.trim() },
    })
    setNom('')
    setDescription('')
    setTags('')
    setEspaceId(espace.id)
    setModeCluster('nouveau')
    setTailleId('moyen')
    setClusterExistantId('')
    setCreation(false)
  }

  const bilan = projets.reduce(
    (a, p) => {
      const s = syntheseDeServices(servicesDe(p.id))
      return {
        services: a.services + s.services,
        enEchec: a.enEchec + s.enEchec,
        coutMensuel: a.coutMensuel + s.coutMensuel,
      }
    },
    { services: 0, enEchec: 0, coutMensuel: 0 },
  )

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Projets' }]}
        titre="Projets"
        sousTitre="Un projet regroupe les services qui forment un même système : l’application, sa base, son cache, ses tâches de fond. C’est la maille qui répond à « qu’est-ce qui casse si j’arrête ça ? »."
        actions={
          <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
            <Button iconBefore={<Plus size={14} />} onClick={() => setCreation(true)}>
              Créer un projet
            </Button>
          </GatedAction>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile libelle="Projets" valeur={projets.length} detail={espace.code} />
        <StatTile
          libelle="Services déployés"
          valeur={bilan.services}
          detail="applications, bases, tâches"
        />
        <StatTile
          libelle="Services en échec"
          valeur={bilan.enEchec}
          ton={bilan.enEchec > 0 ? 'err' : 'ok'}
          detail={bilan.enEchec > 0 ? 'à traiter' : 'rien à signaler'}
        />
        <StatTile
          libelle="Coût mensuel"
          valeur={money(bilan.coutMensuel).replace(' FCFA', '')}
          unite="FCFA"
        />
      </div>

      <Callout ton="violet" titre={`Votre zone offerte : ${ZONE_APPLICATIVE.zone}`}>
        Chaque service déployé reçoit une adresse en{' '}
        <span className="font-mono text-[12px]">{ZONE_APPLICATIVE.wildcard}</span>, certificat
        compris. Votre première mise en ligne ne dépend donc d’aucun achat de domaine. Vous
        brancherez le vôtre quand vous voudrez, depuis{' '}
        <Link href="/app/applications/routage" className="font-semibold text-p-700 hover:text-m-600">
          Domaines &amp; routage
        </Link>
        .
      </Callout>

      {projets.length === 0 && (
        <Card>
          <CardHeader
            titre={`Aucun projet dans ${espace.code}`}
            sousTitre="Un projet regroupe les services qui forment un même système : l’application, sa base, son cache, ses tâches de fond. Créez le premier ici, ou changez d’Espace Cloud dans le panneau de gauche."
            actions={
              <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
                <Button iconBefore={<Plus size={14} />} onClick={() => setCreation(true)}>
                  Créer un projet
                </Button>
              </GatedAction>
            }
          />
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {projets.map((p) => {
          const s = syntheseDeServices(servicesDe(p.id))
          const services = servicesDe(p.id)
          const alerte = s.enEchec > 0 ? 'err' : s.degrades > 0 ? 'warn' : 'ok'

          return (
            <Card key={p.id} hover className="flex flex-col">
              <CardHeader
                titre={
                  <Link href={`/app/applications/projets/${p.id}`} className="hover:text-p-700">
                    {p.nom}
                  </Link>
                }
                sousTitre={p.description}
                actions={
                  <Badge tone={alerte} dot size="sm">
                    {s.enEchec > 0
                      ? `${s.enEchec} en échec`
                      : s.degrades > 0
                        ? `${s.degrades} dégradé${s.degrades > 1 ? 's' : ''}`
                        : 'Nominal'}
                  </Badge>
                }
              />

              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(TYPE_SERVICE_LABEL) as TypeServiceProjet[])
                  .filter((t) => s.parType[t])
                  .map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 rounded-[6px] border border-g-300 bg-g-050 px-2 py-1 text-[11.5px] font-semibold text-g-700"
                    >
                      <span className="text-p-700">{ICONE_TYPE[t]}</span>
                      {s.parType[t]} {TYPE_SERVICE_LABEL[t].toLowerCase()}
                      {s.parType[t] > 1 && t !== 'base' ? 's' : ''}
                    </span>
                  ))}
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                <MicroLabel className="mr-1">Environnements</MicroLabel>
                {p.environnements.map((e) => (
                  <Badge key={e} tone="neutral" size="sm">
                    {e}
                  </Badge>
                ))}
              </div>

              {(p.tags ?? []).length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <MicroLabel className="mr-1">Étiquettes</MicroLabel>
                  {(p.tags ?? []).map((t) => (
                    <Badge key={t} tone="violet" size="sm">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}

              <ul className="mt-3.5 space-y-1 border-t border-g-100 pt-3">
                {services.slice(0, 4).map((svc) => (
                  <li key={svc.id} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/app/applications/projets/${p.id}/${svc.id}`}
                      className="flex min-w-0 items-center gap-2 hover:text-p-700"
                    >
                      <span
                        className={cn(
                          'shrink-0',
                          svc.statut === 'failed'
                            ? 'text-err'
                            : svc.statut === 'degraded'
                              ? 'text-warn'
                              : svc.statut === 'stopped'
                                ? 'text-g-500'
                                : 'text-ok',
                        )}
                      >
                        {ICONE_TYPE[svc.type]}
                      </span>
                      <span className="truncate font-mono text-[12px] font-semibold text-ink">
                        {svc.nom}
                      </span>
                      <span className="shrink-0 text-[11px] text-g-500">{svc.environnement}</span>
                    </Link>
                    <span className="shrink-0 text-[11px] text-g-500">
                      {relatif(svc.derniereMaj)}
                    </span>
                  </li>
                ))}
                {services.length > 4 && (
                  <li className="pt-0.5 text-[11.5px] text-g-500">
                    et {services.length - 4} autre{services.length - 4 > 1 ? 's' : ''} service
                    {services.length - 4 > 1 ? 's' : ''}
                  </li>
                )}
              </ul>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-g-100 pt-3">
                <span className="flex items-center gap-3 text-[11.5px] text-g-500">
                  <span className="inline-flex items-center gap-1">
                    <Globe size={12} />
                    {s.domaines} domaine{s.domaines > 1 ? 's' : ''}
                  </span>
                  <span className="tnum font-semibold text-ink">{money(s.coutMensuel)}/mois</span>
                </span>
                <ButtonLink href={`/app/applications/projets/${p.id}`} variant="secondary" size="sm">
                  Ouvrir le projet
                </ButtonLink>
              </div>
            </Card>
          )
        })}
      </div>

      <Drawer
        open={creation}
        onClose={() => setCreation(false)}
        title="Créer un projet"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreation(false)}>
              Annuler
            </Button>
            <Button disabled={nom.trim().length === 0} onClick={creerProjet}>
              Créer le projet
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Callout ton="info" titre="Un projet ne consomme rien par lui-même">
            Créer un projet ne facture rien : c’est un contenant. La facturation commence au premier
            service déployé, au prorata journalier.
          </Callout>
          <Field
            label="Nom du projet"
            hint="Visible par tous les membres qui ont accès au projet."
            required
          >
            <Input
              placeholder="Plateforme de facturation"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </Field>
          <Field
            label="Description"
            hint="Une phrase suffit. Elle répond à « à quoi sert ce système ? » pour la personne qui prendra l’astreinte."
          >
            <Textarea
              rows={3}
              placeholder="API de facturation, sa base et ses relances par lot."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field
            label="Étiquettes"
            hint="Séparées par une virgule. Servent à ventiler la dépense et à retrouver le projet dans la recherche."
          >
            <Input
              placeholder="facturation, critique"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </Field>
          <Field label="Espace Cloud">
            <Select value={espaceId} onChange={(e) => setEspaceId(e.target.value)}>
              {ESPACES.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.code} · {e.site} · {e.quota.vcpu - e.usage.vcpu} vCPU libres
                </option>
              ))}
            </Select>
          </Field>

          <div>
            <MicroLabel className="mb-2">Cluster Kubernetes</MicroLabel>
            <p className="mb-2 text-[11.5px] leading-relaxed text-g-500">
              Un projet est toujours servi par un cluster Kubernetes dédié — jamais par des machines
              virtuelles choisies à la main.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setModeCluster('nouveau')}
                className={cn(
                  'rounded-[8px] border-2 bg-white p-3 text-left transition-colors',
                  modeClusterEffectif === 'nouveau' ? 'border-p-700' : 'border-g-300 hover:border-p-400',
                )}
              >
                <span className="block text-[12.5px] font-semibold text-ink">Nouveau cluster</span>
                <span className="mt-1 block text-[11.5px] text-g-500">
                  Provisionné à la création, rien que pour ce projet.
                </span>
              </button>
              <button
                type="button"
                disabled={clustersDisponibles.length === 0}
                onClick={() => setModeCluster('existant')}
                className={cn(
                  'rounded-[8px] border-2 bg-white p-3 text-left transition-colors',
                  clustersDisponibles.length === 0
                    ? 'cursor-not-allowed opacity-50'
                    : modeClusterEffectif === 'existant'
                      ? 'border-p-700'
                      : 'border-g-300 hover:border-p-400',
                )}
              >
                <span className="block text-[12.5px] font-semibold text-ink">Cluster existant</span>
                <span className="mt-1 block text-[11.5px] text-g-500">
                  {clustersDisponibles.length === 0
                    ? `Aucun cluster dans ${espaceCible.code}`
                    : 'Partagé avec d’autres projets de cet Espace.'}
                </span>
              </button>
            </div>
          </div>

          {modeClusterEffectif === 'nouveau' ? (
            <Field label="Taille du cluster" hint="Ajustable ensuite — pools, autoscaling — depuis Kubernetes.">
              <Select
                value={tailleId}
                onChange={(e) => setTailleId(e.target.value as (typeof TAILLES_CLUSTER)[number]['id'])}
              >
                {TAILLES_CLUSTER.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} · {t.detail}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Cluster">
              <Select value={clusterExistantEffectif} onChange={(e) => setClusterExistantId(e.target.value)}>
                {clustersDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} · v{c.version}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <CostPreview
            lignes={
              modeClusterEffectif === 'nouveau'
                ? [
                    {
                      libelle: 'Control plane haute disponibilité',
                      detail: '3 masters répartis · SLA 99,95 %',
                      montant: 42000,
                    },
                    {
                      libelle: `Nœuds workers · ${taille.nodes} nœuds`,
                      detail: taille.detail,
                      montant: taille.nodes * taille.prixNoeud,
                    },
                  ]
                : [{ libelle: 'Cluster existant', detail: 'Aucun coût additionnel de cluster', montant: 0 }]
            }
          />

          <div className="rounded-[8px] border border-g-300 bg-g-050 p-3">
            <MicroLabel>Adresse offerte pour ce projet</MicroLabel>
            <CopyField value={`<service>-<env>.${ZONE_APPLICATIVE.zone}`} className="mt-1.5" />
            <p className="mt-2 text-[11.5px] leading-relaxed text-g-500">
              Chaque service recevra son adresse dans cette zone, avec certificat automatique. Rien
              à acheter, rien à configurer.
            </p>
          </div>
        </div>
      </Drawer>

      <Card>
        <CardHeader
          titre="Ce que contient un projet"
          sousTitre="Cinq types de services, tous facturés au prorata journalier."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              type: 'application' as const,
              phrase:
                'Dépôt Git ou image Docker, construite puis déployée avec journal de build, analyse de sécurité et bascule sans coupure.',
            },
            {
              type: 'base' as const,
              phrase:
                'PostgreSQL, MySQL, MariaDB, MongoDB, Redis ou ClickHouse, avec URI de connexion interne, sauvegarde et restauration.',
            },
            {
              type: 'statique' as const,
              phrase:
                'Sortie de build servie par un cache en bordure. Pas de processus applicatif, donc rien à surveiller côté mémoire.',
            },
            {
              type: 'cron' as const,
              phrase:
                'Commande exécutée selon une expression cron, avec historique daté, durée et journal de chaque exécution.',
            },
            {
              type: 'worker' as const,
              phrase:
                'Processus de file sans port exposé : profondeur de file, débit, échecs et concurrence réglable.',
            },
          ].map((t) => (
            <div key={t.type} className="rounded-[8px] border border-g-300 p-3">
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-p-050 text-p-700">
                  {ICONE_TYPE[t.type]}
                </span>
                <span className="text-[12.5px] font-bold text-ink">
                  {TYPE_SERVICE_LABEL[t.type]}
                </span>
              </span>
              <p className="mt-2 text-[11.5px] leading-relaxed text-g-700">{t.phrase}</p>
            </div>
          ))}
          <div className="flex flex-col justify-center rounded-[8px] border border-dashed border-p-300 bg-p-050 p-3">
            <span className="flex items-center gap-2 text-[12.5px] font-bold text-p-700">
              <Layers size={14} />
              Composer plusieurs briques
            </span>
            <p className="mt-2 text-[11.5px] leading-relaxed text-g-700">
              L’assistant de création propose aussi un canvas : on pose les briques, on relie les
              dépendances, la plateforme génère le tout.
            </p>
            <ButtonLink href="/app/applications/nouveau" variant="ghost" size="sm" className="mt-2 self-start">
              Ouvrir l’assistant
              <Boxes size={13} />
            </ButtonLink>
          </div>
        </div>
      </Card>
    </div>
  )
}
