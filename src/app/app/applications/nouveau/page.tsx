'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import {
  Boxes,
  Check,
  Container as ContainerIcon,
  FolderPlus,
  GitBranch,
  Info,
  LayoutTemplate,
  TriangleAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAINTENANT, money, num } from '@/lib/format'
import { ANALYSE_DEPOT, ESPACES, PROJETS, SERVICES_PROJET } from '@/lib/mock'
import { CATEGORIE_MODELE_LABEL, MODELES, modeleBySlug } from '@/lib/mock/modeles'
import type { Projet, ServiceProjet } from '@/lib/types'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input, Select, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList } from '@/components/composition/card'
import { CostPreview, WizardShell } from '@/components/composition/flow'
import { EmptyState } from '@/components/composition/states'
import { TopologyCanvas } from '@/components/business/rbac-canvas'
import { useApp } from '@/components/app/contexte'
import { useAtelier, useCollection } from '@/components/app/atelier'

/**
 * Assistant de déploiement — pas de création de projet ici.
 *
 * Un projet est toujours un cluster Kubernetes dédié : il naît depuis
 * « Créer un projet » dans Projets, avec son Espace Cloud et son cluster
 * (neuf ou existant). Cet assistant part donc d'un projet déjà là, et
 * n'a plus jamais à demander Kubernetes ou des machines virtuelles — c'est
 * déjà tranché. Il ne déploie que dans **un seul** environnement à la fois :
 * dupliquer vers un autre environnement se fait en relançant l'assistant.
 */
const ETAPES = [
  { numero: 1, titre: 'Projet' },
  { numero: 2, titre: 'Source' },
  { numero: 3, titre: 'Analyse du dépôt' },
  { numero: 4, titre: 'Architecture' },
  { numero: 5, titre: 'Ressources' },
  { numero: 6, titre: 'Environnement' },
]

const DEPOTS = [
  { url: 'github.com/dba-africa/app-metier', branches: ['main', 'develop', 'release/2.8'] },
  { url: 'github.com/dba-africa/batch-worker', branches: ['main', 'develop'] },
  { url: 'git.dba.africa/data/analytics', branches: ['main', 'feature/streaming'] },
  { url: 'github.com/dba-africa/portail-client', branches: ['main'] },
]

/** Composition de départ du canvas, ajustable à l'étape « Ressources ». */
const COMPOSANTS_CANVAS = [
  { nom: 'traefik', role: 'Proxy d’entrée', cpu: 1, ram: 512, disk: 5, rep: 2 },
  { nom: 'api', role: 'Service applicatif', cpu: 2, ram: 2048, disk: 20, rep: 2 },
  { nom: 'postgres', role: 'Base de données managée', cpu: 4, ram: 16384, disk: 500, rep: 1 },
  { nom: 'redis', role: 'Cache', cpu: 1, ram: 4096, disk: 10, rep: 1 },
]

export default function NouvelleApplication() {
  return (
    <Suspense fallback={null}>
      <NouvelleApplicationInterne />
    </Suspense>
  )
}

/** Isolé pour `useSearchParams`, qui exige un contour de Suspense. */
function NouvelleApplicationInterne() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { pousser } = useApp()
  const projets = useCollection<Projet>('projets', PROJETS)
  const services = useCollection<ServiceProjet>('services-projet', SERVICES_PROJET)
  const { lancerJob } = useAtelier()

  const [projetId, setProjetId] = useState(searchParams.get('projet') ?? projets.items[0]?.id ?? '')
  const [etape, setEtape] = useState(1)
  const [source, setSource] = useState<'git' | 'image' | 'canvas' | 'modele'>('git')
  const [modeleSlug, setModeleSlug] = useState(MODELES[0].slug)
  const [depot, setDepot] = useState(DEPOTS[0].url)
  const [branche, setBranche] = useState('main')
  const [nomApp, setNomApp] = useState('portail-client')
  const [image, setImage] = useState('registry.synelia.cloud/dba/portail-client')
  const [etiquette, setEtiquette] = useState('v1.0.0')
  const [builder, setBuilder] = useState<'nixpacks' | 'dockerfile' | 'image'>('nixpacks')
  const [previewPr, setPreviewPr] = useState(true)
  const [conditions, setConditions] = useState(false)
  const [composants, setComposants] = useState(COMPOSANTS_CANVAS)
  const [env, setEnv] = useState(searchParams.get('env') ?? '')

  const projet = projets.items.find((p) => p.id === projetId)
  const envActif = env && projet?.environnements.includes(env) ? env : (projet?.environnements[0] ?? '')
  const depotChoisi = DEPOTS.find((d) => d.url === depot)!
  const modeleChoisi = modeleBySlug(modeleSlug)!
  const espace = ESPACES.find((e) => e.id === projet?.espaceId)

  const lignesCout = [
    {
      libelle: 'Composants Kubernetes',
      detail: `Environnement ${envActif || '—'} · ${composants.length} composants`,
      montant: 14000,
    },
    { libelle: 'Base managée PostgreSQL 16', detail: 'Palier Flex, détectée dans le dépôt', montant: 28000 },
    { libelle: 'Cache Redis 7.2', detail: 'Palier Flex', montant: 9000 },
    ...(envActif === 'Production'
      ? [{ libelle: 'Load balancer L7 + certificat', detail: 'Exposition publique', montant: 18000 }]
      : []),
  ]

  const suivant = (n: number) => (n === 2 ? (source === 'git' ? 3 : 4) : n + 1)
  const precedent = (n: number) => (n === 4 ? (source === 'git' ? 3 : 2) : n - 1)

  const etapesVisibles = ETAPES.filter((e) => e.numero !== 3 || source === 'git')
  const peutContinuer = etape === 1 ? Boolean(projet) : etape === 6 ? conditions && Boolean(envActif) : true

  if (!projet) {
    return (
      <EmptyState
        titre="Aucun projet pour l’instant"
        phrase="Une application se déploie toujours dans un projet — le contenant qui porte l’Espace Cloud et le cluster Kubernetes. Créez-en un d’abord, ça ne facture rien tant qu’aucun service n’y tourne."
        icone={<FolderPlus size={22} />}
        action={{ libelle: 'Créer un projet', href: '/app/applications/projets?creer=1' }}
      />
    )
  }

  return (
    <WizardShell
      etapes={etapesVisibles}
      courante={etape}
      onChange={setEtape}
      titre={ETAPES[etape - 1].titre}
      panneau={
        <>
          <Card>
            <MicroLabel>Application</MicroLabel>
            <dl className="mt-2.5 space-y-1.5">
              <Petit cle="Projet" valeur={projet.nom} />
              <Petit cle="Nom" valeur={nomApp} mono />
              <Petit
                cle="Source"
                valeur={
                  {
                    git: 'Dépôt Git',
                    image: 'Image Docker',
                    canvas: 'Canvas',
                    modele: 'Solution du catalogue',
                  }[source]
                }
              />
              {source === 'git' && <Petit cle="Branche" valeur={branche} mono />}
              {source === 'modele' && (
                <Petit
                  cle="Solution"
                  valeur={`${modeleChoisi.solution} ${modeleChoisi.version}`}
                />
              )}
              <Petit cle="Constructeur" valeur={builder} />
              <Petit cle="Espace Cloud" valeur={espace?.code ?? ''} mono />
              <Petit cle="Environnement" valeur={envActif || '—'} />
            </dl>
          </Card>
          <CostPreview lignes={lignesCout} />
        </>
      }
      actions={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              if (etape === 1) return router.push(`/app/applications/projets/${projet.id}`)
              setEtape(precedent(etape))
            }}
          >
            {etape === 1 ? 'Annuler' : 'Précédent'}
          </Button>
          {etape < 6 ? (
            <Button onClick={() => setEtape(suivant(etape))}>Continuer</Button>
          ) : (
            <Button
              disabled={!peutContinuer}
              onClick={() => {
                const idService = services.identifiant('svc')
                services.creer({
                  id: idService,
                  projetId: projet.id,
                  nom: nomApp,
                  type: 'application',
                  environnement: envActif,
                  statut: 'building',
                  ressources: { cpu: 1, ramMo: 1024, diskGo: 20 },
                  emplacement: {
                    site: espace?.site ?? 'ABJ',
                    backend: 'OpenStack Magnum',
                    namespace: `${projet.id}-${envActif.toLowerCase()}`,
                  },
                  derniereMaj: MAINTENANT,
                  coutMensuel: 8600,
                  appId: nomApp,
                  source:
                    source === 'image'
                      ? { type: 'image' as const, ref: `${image}:${etiquette}` }
                      : { type: 'git' as const, ref: depot, branche },
                  portConteneur: 3000,
                })
                pousser({
                  ton: 'info',
                  titre: `Déploiement de ${nomApp} lancé`,
                  detail: `Build, analyse DevSecOps puis déploiement dans ${envActif}. Suivi dans le centre de tâches.`,
                })
                lancerJob({
                  workflow: 'app.deploy',
                  cible: `${nomApp} · ${envActif}`,
                  alFin: () => {
                    services.modifier(idService, { statut: 'running' })
                    pousser({
                      ton: 'ok',
                      titre: `${nomApp} est déployé`,
                      detail: `En ligne dans ${envActif}.`,
                    })
                  },
                })
                router.push(`/app/applications/projets/${projet.id}`)
              }}
            >
              Déployer
            </Button>
          )}
        </>
      }
    >
      {/* Étape 1 — Projet */}
      {etape === 1 && (
        <div className="space-y-4">
          <Field
            label="Projet"
            required
            hint="L’Espace Cloud et le cluster Kubernetes du projet sont hérités — rien à choisir ici."
          >
            <Select value={projetId} onChange={(e) => setProjetId(e.target.value)}>
              {projets.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} · {ESPACES.find((e) => e.id === p.espaceId)?.code ?? p.espaceId}
                </option>
              ))}
            </Select>
          </Field>
          <Callout ton="violet" titre="Pas de choix d’infrastructure">
            Ce projet tourne sur son propre cluster Kubernetes : chaque composant devient un
            déploiement dans un namespace dédié, avec autoscaling horizontal et isolation réseau par
            NetworkPolicy. Rien à choisir entre Kubernetes et des machines virtuelles — c’est tranché
            à la création du projet.
          </Callout>
        </div>
      )}

      {/* Étape 2 — Source */}
      {etape === 2 && (
        <div className="space-y-4">
          <Field label="Nom de l’application" required>
            <Input value={nomApp} onChange={(e) => setNomApp(e.target.value)} className="font-mono" />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                {
                  id: 'git' as const,
                  icone: <GitBranch size={18} />,
                  titre: 'Dépôt Git',
                  texte:
                    'Connectez GitHub ou GitLab. Nous lisons votre code pour détecter le langage, le gestionnaire de paquets, la source de données et les variables attendues.',
                },
                {
                  id: 'image' as const,
                  icone: <ContainerIcon size={18} />,
                  titre: 'Image Docker',
                  texte:
                    'Vous construisez ailleurs, nous déployons. Indiquez le registre, l’image et l’étiquette — le pipeline démarre directement à l’analyse de sécurité.',
                },
                {
                  id: 'canvas' as const,
                  icone: <LayoutTemplate size={18} />,
                  titre: 'Canvas',
                  texte:
                    'Composez librement depuis le catalogue de briques : serveurs web, bases, caches, proxys, observabilité. Utile pour une architecture sans code applicatif propre.',
                },
                {
                  id: 'modele' as const,
                  icone: <Boxes size={18} />,
                  titre: 'Solution du catalogue',
                  texte:
                    'Une solution prête à l’emploi — messagerie, ERP, GED — déployée dans une instance qui n’appartient qu’à vous, avec sa version qualifiée et son plan de sauvegarde.',
                },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSource(s.id)
                  if (s.id === 'image' || s.id === 'modele') setBuilder('image')
                  if (s.id === 'git') setBuilder('nixpacks')
                  if (s.id === 'modele') setNomApp(modeleChoisi.sousDomaine)
                }}
                className={cn(
                  'flex flex-col rounded-[10px] border-2 bg-white p-4 text-left transition-colors',
                  source === s.id ? 'border-p-700' : 'border-g-300 hover:border-p-400',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-p-700">{s.icone}</span>
                  <span className="type-h3">{s.titre}</span>
                </span>
                <span className="mt-2 text-[12.5px] leading-relaxed text-g-700">{s.texte}</span>
              </button>
            ))}
          </div>

          {source === 'git' && (
            <Card>
              <CardHeader titre="Dépôt et branche" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Dépôt">
                  <Select
                    value={depot}
                    onChange={(e) => {
                      setDepot(e.target.value)
                      const d = DEPOTS.find((x) => x.url === e.target.value)
                      if (d) setBranche(d.branches[0])
                    }}
                  >
                    {DEPOTS.map((d) => (
                      <option key={d.url} value={d.url}>
                        {d.url}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Branche">
                  <Select value={branche} onChange={(e) => setBranche(e.target.value)}>
                    {depotChoisi.branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-g-100 pt-3.5">
                <Badge tone="ok" dot size="sm">
                  Connexion GitHub active
                </Badge>
                <span className="text-[11.5px] text-g-500">
                  Accès en lecture aux dépôts de l’organisation dba-africa · révocable depuis les
                  paramètres
                </span>
              </div>
            </Card>
          )}

          {source === 'image' && (
            <Card>
              <CardHeader titre="Image du registre" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Image">
                  <Input value={image} onChange={(e) => setImage(e.target.value)} className="font-mono" />
                </Field>
                <Field label="Étiquette">
                  <Input
                    value={etiquette}
                    onChange={(e) => setEtiquette(e.target.value)}
                    className="font-mono"
                  />
                </Field>
              </div>
              <Callout ton="warn" className="mt-3.5" titre="Épinglez toujours l’étiquette">
                Déployer <span className="font-mono text-[12px]">latest</span> rend vos déploiements
                non reproductibles : deux déploiements successifs peuvent donner deux résultats
                différents. L’analyse DevSecOps signale les images non épinglées.
              </Callout>
            </Card>
          )}

          {source === 'modele' && (
            <Card>
              <CardHeader
                titre="Solutions qualifiées"
                sousTitre="Chaque solution est figée sur une version que nous suivons — jamais « latest ». Elle arrive avec ses dépendances, ses volumes et son plan de sauvegarde."
              />
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {MODELES.map((m) => (
                  <button
                    key={m.slug}
                    type="button"
                    onClick={() => {
                      setModeleSlug(m.slug)
                      setNomApp(m.sousDomaine)
                    }}
                    className={cn(
                      'flex items-start gap-2.5 rounded-[8px] border-2 bg-white p-3 text-left transition-colors',
                      modeleSlug === m.slug ? 'border-p-700' : 'border-g-300 hover:border-p-400',
                    )}
                  >
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[10px] font-bold text-white"
                      style={{ background: m.logoTeinte }}
                    >
                      {m.logoInitiales}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink">{m.nom}</span>
                      <span className="block truncate text-[11.5px] text-g-500">
                        {m.solution} {m.version} · {CATEGORIE_MODELE_LABEL[m.categorie]}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 border-t border-g-100 pt-4">
                <p className="text-[13px] font-bold text-ink">{modeleChoisi.nom}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-g-700">
                  {modeleChoisi.description}
                </p>
                <KeyValueList
                  className="mt-3"
                  items={[
                    {
                      cle: 'Version qualifiée',
                      valeur: <span className="font-mono text-[12.5px]">{modeleChoisi.version}</span>,
                    },
                    {
                      cle: 'Chart',
                      valeur: <span className="font-mono text-[12.5px]">{modeleChoisi.chart}</span>,
                    },
                    {
                      cle: 'Ressources',
                      valeur: `${modeleChoisi.ressources.cpu} vCPU · ${modeleChoisi.ressources.ramMo / 1024} Gio · ${modeleChoisi.ressources.diskGo} Go`,
                    },
                    {
                      cle: 'Sauvegarde',
                      valeur: `${modeleChoisi.sauvegardeParDefaut.frequence} · ${modeleChoisi.sauvegardeParDefaut.retentionJours} jours`,
                    },
                    {
                      cle: 'Amène avec lui',
                      valeur:
                        modeleChoisi.dependances.map((d) => d.nom).join(', ') || 'Rien de plus',
                    },
                    { cle: 'Prix indicatif', valeur: `${money(modeleChoisi.prixIndicatif)}/mois` },
                  ]}
                />
                <Callout ton="info" className="mt-3" titre="Ce que le portail ne fera pas">
                  {modeleChoisi.horsPerimetre} Le portail provisionne, dimensionne, sauvegarde,
                  supervise et ouvre la porte — l’écran métier reste celui du produit.
                </Callout>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Étape 3 — Analyse du dépôt */}
      {etape === 3 && source === 'git' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Lecture automatique du dépôt"
              sousTitre={`${ANALYSE_DEPOT.depot} · branche ${ANALYSE_DEPOT.branche} · commit ${ANALYSE_DEPOT.commit}`}
              actions={<Badge tone="ok" dot>Analyse terminée</Badge>}
            />
            <div className="space-y-3">
              {ANALYSE_DEPOT.constats.map((c) => (
                <div
                  key={`${c.fichier}-${c.titre}`}
                  className={cn(
                    'flex items-start gap-3 rounded-[8px] border-l-4 px-3.5 py-3',
                    c.niveau === 'ok'
                      ? 'border-ok bg-ok-bg'
                      : c.niveau === 'attention'
                        ? 'border-warn bg-warn-bg'
                        : 'border-info bg-info-bg',
                  )}
                >
                  <span className="mt-0.5 shrink-0">
                    {c.niveau === 'ok' ? (
                      <Check size={15} className="text-ok" />
                    ) : c.niveau === 'attention' ? (
                      <TriangleAlert size={15} className="text-warn" />
                    ) : (
                      <Info size={15} className="text-info" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink">{c.titre}</span>
                      <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10.5px] text-g-700">
                        {c.fichier}
                      </span>
                    </p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-g-700">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader titre="Constructeur" sousTitre="Déduit de l’analyse, modifiable." />
            <div className="space-y-2">
              {(
                [
                  ['nixpacks', 'Nixpacks (recommandé)', 'Détecte automatiquement le runtime et le gestionnaire de paquets. Aucun Dockerfile à maintenir, cache de build partagé entre déploiements.'],
                  ['dockerfile', 'Dockerfile', 'Votre Dockerfile, votre contrôle. Aucun Dockerfile n’a été détecté à la racine de ce dépôt.'],
                ] as const
              ).map(([v, t, d]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setBuilder(v)}
                  disabled={v === 'dockerfile'}
                  className={cn(
                    'w-full rounded-[8px] border-2 p-3.5 text-left transition-colors',
                    builder === v ? 'border-p-700 bg-p-050' : 'border-g-300',
                    v === 'dockerfile' && 'cursor-not-allowed opacity-55',
                  )}
                >
                  <span className="block text-[13px] font-semibold text-ink">{t}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-g-700">{d}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              titre="Variables d’environnement attendues"
              sousTitre="Lues dans .env.example. Les valeurs seront à renseigner pour cet environnement."
            />
            <div className="space-y-2">
              {[
                { cle: 'DATABASE_URL', secret: true, source: 'Base managée provisionnée automatiquement' },
                { cle: 'REDIS_URL', secret: true, source: 'Cache provisionné automatiquement' },
                { cle: 'JWT_SECRET', secret: true, source: 'À générer — coffre de secrets' },
                { cle: 'SENTRY_DSN', secret: true, source: 'À renseigner' },
                { cle: 'API_BASE_URL', secret: false, source: 'Déduit du domaine de l’environnement' },
                { cle: 'SMTP_URL', secret: true, source: 'Relais SMTP Synelia' },
              ].map((v) => (
                <div
                  key={v.cle}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[12.5px] font-semibold text-ink">{v.cle}</span>
                    {v.secret && (
                      <Badge tone="warn" size="sm">
                        Secret
                      </Badge>
                    )}
                  </span>
                  <span className="text-[11.5px] text-g-500">{v.source}</span>
                </div>
              ))}
            </div>
            <Callout ton="violet" className="mt-3.5" titre="Trois variables sont provisionnées pour vous">
              <span className="font-mono text-[12px]">DATABASE_URL</span>,{' '}
              <span className="font-mono text-[12px]">REDIS_URL</span> et{' '}
              <span className="font-mono text-[12px]">SMTP_URL</span> pointeront vers les ressources
              managées créées à l’étape suivante. Elles sont injectées au démarrage depuis le coffre
              de secrets, jamais écrites dans l’image.
            </Callout>
          </Card>
        </div>
      )}

      {/* Étape 4 — Architecture */}
      {etape === 4 && (
        <div className="space-y-4">
          <Callout ton="info" titre="Composition proposée">
            Nous avons prérempli le canvas d’après l’analyse du dépôt : un proxy en entrée, votre
            service applicatif, une base PostgreSQL et un cache Redis. Ajoutez, retirez ou reliez les
            composants — une dépendance se crée en cliquant deux composants en mode « Créer une
            dépendance ».
          </Callout>
          <TopologyCanvas />
        </div>
      )}

      {/* Étape 5 — Ressources */}
      {etape === 5 && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Ressources par composant"
              sousTitre="Valeurs de départ, ajustables après le premier déploiement en fonction des métriques réelles."
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Composant', 'Rôle', 'vCPU', 'Mémoire (Mo)', 'Disque (Go)', 'Réplicas'].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {composants.map((c, ligne) => (
                    <tr key={c.nom} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2 font-mono text-[12.5px] text-ink">{c.nom}</td>
                      <td className="px-3 py-2 text-[12px] text-g-700">{c.role}</td>
                      {(['cpu', 'ram', 'disk', 'rep'] as const).map((champ) => (
                        <td key={champ} className="px-3 py-2">
                          <Input
                            type="number"
                            min={champ === 'rep' ? 1 : 0}
                            value={c[champ]}
                            className="w-24"
                            aria-label={`${c.nom} — ${
                              { cpu: 'vCPU', ram: 'mémoire en Mo', disk: 'disque en Go', rep: 'réplicas' }[
                                champ
                              ]
                            }`}
                            onChange={(e) =>
                              setComposants((prev) =>
                                prev.map((x, j) =>
                                  j === ligne ? { ...x, [champ]: Number(e.target.value) } : x,
                                ),
                              )
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-g-300 bg-g-050">
                    <td className="px-3 py-2 text-[12px] font-semibold text-ink" colSpan={2}>
                      Total demandé
                    </td>
                    <td className="tnum px-3 py-2 text-[12px] font-semibold text-ink">
                      {composants.reduce((a, c) => a + c.cpu * c.rep, 0)}
                    </td>
                    <td className="tnum px-3 py-2 text-[12px] font-semibold text-ink">
                      {num(composants.reduce((a, c) => a + c.ram * c.rep, 0))}
                    </td>
                    <td className="tnum px-3 py-2 text-[12px] font-semibold text-ink">
                      {num(composants.reduce((a, c) => a + c.disk * c.rep, 0))}
                    </td>
                    <td className="px-3 py-2" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
          <Callout ton="violet" titre={`Namespace ${projet.id}-${envActif.toLowerCase() || '<env>'}`}>
            Déployé sur le cluster de <span className="font-mono text-[12px]">{projet.nom}</span>, dans
            l’Espace Cloud <span className="font-mono text-[12px]">{espace?.code}</span>. Aucune autre
            décision d’emplacement à prendre : c’est celle du projet.
          </Callout>
        </div>
      )}

      {/* Étape 6 — Environnement */}
      {etape === 6 && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Environnement de déploiement"
              sousTitre="Une application se déploie dans un seul environnement à la fois. Pour la retrouver ailleurs, relancez l’assistant."
            />
            <div className="space-y-2">
              {projet.environnements.map((e) => (
                <label
                  key={e}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-[8px] border px-3.5 py-3 transition-colors',
                    e === envActif ? 'border-p-700 bg-p-050' : 'border-g-300 hover:border-p-400',
                  )}
                >
                  <input
                    type="radio"
                    name="environnement"
                    checked={e === envActif}
                    onChange={() => setEnv(e)}
                    className="h-3.5 w-3.5 accent-[#4B2882]"
                  />
                  <span className="text-[13px] font-semibold text-ink">{e}</span>
                </label>
              ))}
            </div>
          </Card>

          <div className="rounded-[8px] border border-g-300 bg-g-050 p-3">
            <MicroLabel>Adresse attribuée automatiquement</MicroLabel>
            <p className="mt-1.5 font-mono text-[12px] text-g-700">
              {nomApp || '<service>'}-{envActif.toLowerCase().slice(0, 7) || '<env>'}.dba.synelia.app
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-g-500">
              Certificat émis dès le premier déploiement. Vous pourrez brancher votre propre domaine
              ensuite, sans changer cette adresse.
            </p>
          </div>

          {source === 'git' && (
            <Card>
              <CardHeader titre="Déploiements de prévisualisation" />
              <Switch
                checked={previewPr}
                onChange={setPreviewPr}
                label="Créer un environnement éphémère par pull request"
                description="Chaque pull request obtient sa propre URL de prévisualisation, détruite à la fermeture. Le coût est facturé à la durée de vie effective de l’environnement."
              />
              {previewPr && (
                <div className="mt-3 rounded-[6px] bg-g-050 px-3 py-2.5">
                  <p className="font-mono text-[11.5px] text-g-700">
                    https://pr-&lt;numéro&gt;-{nomApp}.preview.synelia.cloud
                  </p>
                </div>
              )}
            </Card>
          )}

          <Card>
            <CardHeader titre="Récapitulatif" />
            <KeyValueList
              colonnes={2}
              items={[
                { cle: 'Projet', valeur: projet.nom },
                { cle: 'Application', valeur: <span className="font-mono">{nomApp}</span> },
                {
                  cle: 'Source',
                  valeur:
                    source === 'git'
                      ? `${depot} · ${branche}`
                      : source === 'image'
                        ? `${image}:${etiquette}`
                        : 'Composition depuis le canvas',
                },
                { cle: 'Constructeur', valeur: builder },
                { cle: 'Espace Cloud', valeur: espace?.code ?? '' },
                { cle: 'Environnement', valeur: envActif || 'Aucun' },
                {
                  cle: 'Prévisualisation par PR',
                  valeur: previewPr && source === 'git' ? 'Activée' : 'Désactivée',
                },
              ]}
            />
          </Card>

          <CostPreview lignes={lignesCout} />

          <Card>
            <Checkbox
              checked={conditions}
              onChange={(e) => setConditions(e.target.checked)}
              label="Je confirme le déploiement de cette application"
              description="Le pipeline démarre immédiatement : build, analyse DevSecOps, provisioning des ressources, puis déploiement sans coupure. Montants hors taxes, TVA 18 % appliquée à la facturation."
            />
          </Card>
        </div>
      )}
    </WizardShell>
  )
}

function Petit({ cle, valeur, mono }: { cle: string; valeur: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="shrink-0 text-[11.5px] text-g-500">{cle}</dt>
      <dd
        className={cn('truncate text-right text-[11.5px] font-semibold text-ink', mono && 'font-mono')}
      >
        {valeur}
      </dd>
    </div>
  )
}
