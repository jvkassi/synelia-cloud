'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Boxes,
  Check,
  Container as ContainerIcon,
  FileCode2,
  GitBranch,
  Info,
  LayoutTemplate,
  Plus,
  Server,
  TriangleAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAINTENANT, money } from '@/lib/format'
import {
  ANALYSE_DEPOT,
  ESPACES,
  K8S_CLUSTERS,
  PROJETS,
  SERVICES_PROJET,
  VMS,
} from '@/lib/mock'
import { CATEGORIE_MODELE_LABEL, MODELES, modeleBySlug } from '@/lib/mock/modeles'
import type { Projet, ServiceProjet } from '@/lib/types'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Checkbox, Field, Input, Select, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList } from '@/components/composition/card'
import { CostPreview, WizardShell } from '@/components/composition/flow'
import { TopologyCanvas } from '@/components/business/rbac-canvas'
import { useApp, useEspace } from '@/components/app/contexte'
import { useAtelier, useCollection } from '@/components/app/atelier'

const ETAPES = [
  { numero: 1, titre: 'Source' },
  { numero: 2, titre: 'Analyse du dépôt' },
  { numero: 3, titre: 'Architecture' },
  { numero: 4, titre: 'Cible & ressources' },
  { numero: 5, titre: 'Environnements' },
]

const DEPOTS = [
  { url: 'github.com/dba-africa/app-metier', branches: ['main', 'develop', 'release/2.8'] },
  { url: 'github.com/dba-africa/batch-worker', branches: ['main', 'develop'] },
  { url: 'git.dba.africa/data/analytics', branches: ['main', 'feature/streaming'] },
  { url: 'github.com/dba-africa/portail-client', branches: ['main'] },
]

const ENVIRONNEMENTS_MODELE = [
  { nom: 'Production', couleur: '#1B8F62', domaine: 'api', actif: true, protection: true },
  { nom: 'Préproduction', couleur: '#B8690B', domaine: 'preprod-api', actif: true, protection: false },
  { nom: 'Développement', couleur: '#2563A8', domaine: 'dev-api', actif: true, protection: false },
  { nom: 'Recette', couleur: '#6B3FA0', domaine: 'recette-api', actif: false, protection: false },
]

export default function NouvelleApplication() {
  const router = useRouter()
  const { pousser } = useApp()
  const espaceCourant = useEspace()
  const projets = useCollection<Projet>('projets', PROJETS)
  const services = useCollection<ServiceProjet>('services-projet', SERVICES_PROJET)
  const { lancerJob } = useAtelier()

  const [etape, setEtape] = useState(1)
  const [source, setSource] = useState<'git' | 'image' | 'canvas' | 'modele'>('git')
  const [modeleSlug, setModeleSlug] = useState(MODELES[0].slug)
  const [depot, setDepot] = useState(DEPOTS[0].url)
  const [branche, setBranche] = useState('main')
  const [nomApp, setNomApp] = useState('portail-client')
  const [image, setImage] = useState('registry.synelia.cloud/dba/portail-client')
  const [etiquette, setEtiquette] = useState('v1.0.0')
  const [builder, setBuilder] = useState<'nixpacks' | 'dockerfile' | 'image'>('nixpacks')

  const [cible, setCible] = useState<'vm' | 'k8s'>('k8s')
  const [espaceId, setEspaceId] = useState(espaceCourant.id)
  const [ressourcesNeuves, setRessourcesNeuves] = useState(true)
  const [clusterId, setClusterId] = useState(K8S_CLUSTERS[0]?.id ?? '')

  const [envs, setEnvs] = useState(ENVIRONNEMENTS_MODELE)
  const [domaineBase, setDomaineBase] = useState('dba.africa')
  const [previewPr, setPreviewPr] = useState(true)
  const [conditions, setConditions] = useState(false)

  const depotChoisi = DEPOTS.find((d) => d.url === depot)!
  const modeleChoisi = modeleBySlug(modeleSlug)!
  const envsActifs = envs.filter((e) => e.actif)

  const lignesCout = [
    {
      libelle: `Composants ${cible === 'k8s' ? 'Kubernetes' : 'sur machines virtuelles'}`,
      detail: `${envsActifs.length} environnement(s) · 4 composants par environnement`,
      montant: envsActifs.length * (cible === 'k8s' ? 14000 : 22000),
    },
    ...(ressourcesNeuves && cible === 'vm'
      ? [{ libelle: 'Nouvelles machines virtuelles', detail: '2 × c2.medium', montant: 15600 }]
      : []),
    { libelle: 'Base managée PostgreSQL 16', detail: 'Palier Flex, détectée dans le dépôt', montant: 28000 },
    { libelle: 'Cache Redis 7.2', detail: 'Palier Flex', montant: 9000 },
    ...(envsActifs.some((e) => e.nom === 'Production')
      ? [{ libelle: 'Load balancer L7 + certificat', detail: 'Exposition publique', montant: 18000 }]
      : []),
  ]

  const peutContinuer = etape === 5 ? conditions && envsActifs.length > 0 : true

  return (
    <WizardShell
      etapes={source === 'git' ? ETAPES : ETAPES.filter((e) => e.numero !== 2)}
      courante={etape}
      onChange={setEtape}
      titre={ETAPES[etape - 1].titre}
      panneau={
        <>
          <Card>
            <MicroLabel>Application</MicroLabel>
            <dl className="mt-2.5 space-y-1.5">
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
              <Petit cle="Cible" valeur={cible === 'k8s' ? 'Kubernetes' : 'Machines virtuelles'} />
              <Petit cle="Espace Cloud" valeur={ESPACES.find((e) => e.id === espaceId)?.code ?? ''} mono />
              <Petit cle="Environnements" valeur={String(envsActifs.length)} />
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
              if (etape === 1) return router.push('/app/applications/projets')
              setEtape(source === 'git' || etape !== 3 ? etape - 1 : 1)
            }}
          >
            {etape === 1 ? 'Annuler' : 'Précédent'}
          </Button>
          {etape < 5 ? (
            <Button
              onClick={() => setEtape(source === 'git' || etape !== 1 ? etape + 1 : 3)}
            >
              Continuer
            </Button>
          ) : (
            <Button
              disabled={!peutContinuer}
              onClick={() => {
                const idProjet = projets.identifiant('prj')
                const environnements = envsActifs.map((e) => e.nom)
                projets.creer({
                  id: idProjet,
                  nom: nomApp,
                  description:
                    source === 'git'
                      ? `Déployé depuis ${depot} (${branche}), construit avec ${builder}.`
                      : source === 'image'
                        ? `Déployé depuis l’image ${image}:${etiquette}.`
                        : 'Créé depuis le canvas.',
                  espaceId,
                  cree: MAINTENANT.slice(0, 10),
                  environnements,
                  variables: [],
                })
                services.creer(
                  environnements.map((env) => ({
                    id: services.identifiant('svc'),
                    projetId: idProjet,
                    nom: nomApp,
                    type: 'application' as const,
                    environnement: env,
                    statut: 'building' as const,
                    ressources: { cpu: 1, ramMo: 1024, diskGo: 20 },
                    emplacement: {
                      site: ESPACES.find((e) => e.id === espaceId)?.site ?? 'ABJ',
                      backend: cible === 'k8s' ? 'OpenStack Magnum' : 'OpenStack Nova',
                      namespace: cible === 'k8s' ? `${nomApp}-${env.toLowerCase()}` : undefined,
                    },
                    derniereMaj: MAINTENANT,
                    coutMensuel: 8600,
                    appId: nomApp,
                    source:
                      source === 'image'
                        ? { type: 'image' as const, ref: `${image}:${etiquette}` }
                        : { type: 'git' as const, ref: depot, branche },
                    portConteneur: 3000,
                  })),
                )
                pousser({
                  ton: 'info',
                  titre: `Création de ${nomApp} lancée`,
                  detail: 'Build, analyse DevSecOps, provisioning puis déploiement. Suivi dans le centre de tâches.',
                })
                lancerJob({
                  type: 'projet.create',
                  label: `Création et déploiement de ${nomApp}`,
                  etapes: [
                    'Créer le projet et ses environnements',
                    source === 'git' ? 'Construire l’image depuis la source' : 'Récupérer l’image',
                    'Analyse DevSecOps de l’image',
                    cible === 'k8s' ? 'Créer les namespaces' : 'Provisionner les machines',
                    'Déployer les environnements',
                    'Publier les adresses offertes',
                  ],
                  alFin: () => {
                    services
                      .items.filter((x) => x.projetId === idProjet)
                      .forEach((x) => services.modifier(x.id, { statut: 'running' }))
                    pousser({
                      ton: 'ok',
                      titre: `${nomApp} est déployé`,
                      detail: `${environnements.length} environnement(s) en marche.`,
                    })
                  },
                })
                router.push('/app/applications/projets')
              }}
            >
              Créer et déployer
            </Button>
          )}
        </>
      }
    >
      {/* Étape 1 — Source */}
      {etape === 1 && (
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
                <Field label="Branche de production">
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

      {/* Étape 2 — Analyse du dépôt */}
      {etape === 2 && source === 'git' && (
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
              sousTitre="Lues dans .env.example. Les valeurs seront à renseigner par environnement."
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

      {/* Étape 3 — Architecture */}
      {etape === 3 && (
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

      {/* Étape 4 — Cible & ressources */}
      {etape === 4 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                ['k8s', 'Kubernetes', 'Chaque composant devient un déploiement dans un namespace dédié. Autoscaling horizontal, mise à jour progressive, isolation réseau par NetworkPolicy.'],
                ['vm', 'Machines virtuelles', 'Chaque composant tourne sur une ou plusieurs machines. Plus simple à diagnostiquer, plus prévisible en performances, moins élastique.'],
              ] as const
            ).map(([v, t, d]) => (
              <button
                key={v}
                type="button"
                onClick={() => setCible(v)}
                className={cn(
                  'rounded-[10px] border-2 bg-white p-4 text-left transition-colors',
                  cible === v ? 'border-p-700' : 'border-g-300 hover:border-p-400',
                )}
              >
                <span className="flex items-center gap-2">
                  {v === 'k8s' ? (
                    <ContainerIcon size={16} className="text-p-700" />
                  ) : (
                    <Server size={16} className="text-p-700" />
                  )}
                  <span className="type-h3">{t}</span>
                </span>
                <span className="mt-2 block text-[12.5px] leading-relaxed text-g-700">{d}</span>
              </button>
            ))}
          </div>

          <Card>
            <CardHeader titre="Emplacement" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Espace Cloud">
                <Select value={espaceId} onChange={(e) => setEspaceId(e.target.value)}>
                  {ESPACES.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.code} · {e.site} · {e.quota.vcpu - e.usage.vcpu} vCPU libres
                    </option>
                  ))}
                </Select>
              </Field>
              {cible === 'k8s' && (
                <Field label="Cluster">
                  <Select value={clusterId} onChange={(e) => setClusterId(e.target.value)}>
                    {K8S_CLUSTERS.filter((c) => c.espaceId === espaceId).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom} · v{c.version}
                      </option>
                    ))}
                    <option value="nouveau">Créer un nouveau cluster</option>
                  </Select>
                </Field>
              )}
            </div>
            <div className="mt-3.5">
              <Switch
                checked={ressourcesNeuves}
                onChange={setRessourcesNeuves}
                label="Provisionner de nouvelles ressources"
                description={
                  cible === 'k8s'
                    ? 'Un namespace dédié par environnement, avec quotas et NetworkPolicy. Sinon, réutilise un namespace existant.'
                    : 'Crée les machines nécessaires. Sinon, réutilise des machines existantes de l’espace.'
                }
              />
            </div>
            {!ressourcesNeuves && cible === 'vm' && (
              <div className="mt-3.5 space-y-2 border-t border-g-100 pt-3.5">
                <MicroLabel>Machines existantes à réutiliser</MicroLabel>
                {VMS.filter((v) => v.espaceId === espaceId && !v.applicationId).map((v) => (
                  <label
                    key={v.id}
                    className="flex cursor-pointer items-center gap-3 rounded-[6px] border border-g-300 px-3 py-2 hover:bg-g-050"
                  >
                    <input type="checkbox" className="h-3.5 w-3.5 accent-[#4B2882]" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[12.5px] text-ink">{v.nom}</span>
                      <span className="block text-[11px] text-g-500">
                        {v.vcpu} vCPU · {v.ramGo} Go · {v.os}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </Card>

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
                  {[
                    { nom: 'traefik', role: 'Proxy d’entrée', cpu: 1, ram: 512, disk: 5, rep: 2 },
                    { nom: 'api', role: 'Service applicatif', cpu: 2, ram: 2048, disk: 20, rep: 2 },
                    { nom: 'postgres', role: 'Base de données managée', cpu: 4, ram: 16384, disk: 500, rep: 1 },
                    { nom: 'redis', role: 'Cache', cpu: 1, ram: 4096, disk: 10, rep: 1 },
                  ].map((c) => (
                    <tr key={c.nom} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2 font-mono text-[12.5px] text-ink">{c.nom}</td>
                      <td className="px-3 py-2 text-[12px] text-g-700">{c.role}</td>
                      {([c.cpu, c.ram, c.disk, c.rep] as const).map((v, i) => (
                        <td key={i} className="px-3 py-2">
                          <Input type="number" defaultValue={v} className="w-24" aria-label="valeur" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Étape 5 — Environnements */}
      {etape === 5 && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Environnements à créer"
              sousTitre="Chaque environnement a ses composants, ses variables, son domaine et son historique de déploiements."
            />
            <div className="mb-4">
              <Field label="Domaine de base" hint="les sous-domaines en découlent">
                <Input
                  value={domaineBase}
                  onChange={(e) => setDomaineBase(e.target.value)}
                  className="font-mono"
                />
              </Field>
            </div>
            <div className="space-y-2">
              {envs.map((e, i) => (
                <div
                  key={e.nom}
                  className={cn(
                    'rounded-[8px] border px-3.5 py-3 transition-colors',
                    e.actif ? 'border-g-300' : 'border-g-300 bg-g-050 opacity-70',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={e.actif}
                        onChange={() =>
                          setEnvs((p) =>
                            p.map((x, k) => (k === i ? { ...x, actif: !x.actif } : x)),
                          )
                        }
                        className="h-3.5 w-3.5 accent-[#4B2882]"
                      />
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: e.couleur }}
                        aria-hidden
                      />
                      <span className="text-[13px] font-semibold text-ink">{e.nom}</span>
                    </label>
                    {e.actif && (
                      <span className="flex flex-wrap items-center gap-2">
                        <Input
                          defaultValue={e.domaine}
                          className="w-40 font-mono"
                          aria-label="Sous-domaine"
                        />
                        <span className="font-mono text-[12px] text-g-500">.{domaineBase}</span>
                      </span>
                    )}
                  </div>
                  {e.actif && (
                    <div className="mt-3 flex flex-wrap gap-4 border-t border-g-100 pt-2.5">
                      <label className="flex items-center gap-2 text-[11.5px] text-g-700">
                        <input
                          type="checkbox"
                          defaultChecked={e.protection}
                          className="h-3 w-3 accent-[#4B2882]"
                        />
                        Approbation requise avant mise en production
                      </label>
                      <label className="flex items-center gap-2 text-[11.5px] text-g-700">
                        <input
                          type="checkbox"
                          defaultChecked={e.nom !== 'Production'}
                          className="h-3 w-3 accent-[#4B2882]"
                        />
                        Déploiement automatique sur poussée
                      </label>
                      {e.nom !== 'Production' && (
                        <label className="flex items-center gap-2 text-[11.5px] text-g-700">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="h-3 w-3 accent-[#4B2882]"
                          />
                          Protégé par mot de passe
                        </label>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

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
                { cle: 'Cible', valeur: cible === 'k8s' ? 'Kubernetes' : 'Machines virtuelles' },
                { cle: 'Espace Cloud', valeur: ESPACES.find((e) => e.id === espaceId)?.code ?? '' },
                {
                  cle: 'Environnements',
                  valeur: envsActifs.map((e) => e.nom).join(', ') || 'Aucun',
                },
                { cle: 'Domaines', valeur: envsActifs.map((e) => `${e.domaine}.${domaineBase}`).join(', ') },
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
              label="Je confirme la création de cette application"
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
