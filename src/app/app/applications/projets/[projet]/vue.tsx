'use client'

import { useMemo, useState } from 'react'
import { Plus, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateCourte, MAINTENANT, money, relatif } from '@/lib/format'
import type { MoteurBase, Projet, ServiceProjet, TypeServiceProjet } from '@/lib/types'
import {
  MOTEURS_DISPONIBLES,
  MOTEUR_LABEL,
  PROJETS,
  SERVICES_PROJET,
  TYPE_SERVICE_LABEL,
  ZONE_APPLICATIVE,
  syntheseDeServices,
} from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { CopyField, GatedAction } from '@/components/ui/display'
import { Field, Input, Select } from '@/components/ui/field'
import { Card, CardHeader, Callout } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { Drawer, Popover } from '@/components/ui/overlay'
import { CostPreview } from '@/components/composition/flow'
import {
  CarteService,
  EnteteProjet,
  ICONE_TYPE,
  ProjetIntrouvable,
} from '@/components/business/projets'
import { useApp } from '@/components/app/contexte'
import { useCollection } from '@/components/app/atelier'
import { useOperation } from '@/components/app/actions'
import { creerRessource, estActif } from '@/lib/api/client'
import { useServicesProjet } from '@/lib/api/services-projet'

/**
 * Fiche d'un projet — ses services, environnement par environnement.
 *
 * Les variables, les domaines et les paramètres ne sont plus des onglets d'ici :
 * ce sont des sections de la barre, au même titre que les déploiements ou les
 * sauvegardes. Un onglet dans un onglet oblige à retenir deux niveaux de
 * position ; la barre en tient un seul, et le panneau garde le projet.
 */
export function VueProjet({ id }: { id: string }) {
  const lesProjets = useCollection<Projet>('projets', PROJETS)
  const lesServices = useCollection<ServiceProjet>('services-projet', SERVICES_PROJET)
  const { autorise, refus } = useApp()

  // Relu dans la collection : un service créé ici doit apparaître sans quitter
  // l'écran, et un projet né pendant la session n'existe pas dans le jeu figé.
  // Avec l’API, la liste vient de `GET /projets/{id}/services` (route nichée,
  // hors registre) ; en maquette, du filtre local.
  const projet = lesProjets.items.find((p) => p.id === id)
  const { distants: servicesDistants, rechargerServices } = useServicesProjet(id)
  const services = useMemo(
    () => servicesDistants ?? lesServices.items.filter((x) => x.projetId === id),
    [servicesDistants, lesServices.items, id],
  )
  const synthese = syntheseDeServices(services)

  const [env, setEnv] = useState(projet?.environnements[0] ?? '')
  const [creation, setCreation] = useState<TypeServiceProjet | null>(null)

  const servicesEnv = useMemo(
    () => services.filter((s) => s.environnement === env),
    [services, env],
  )

  if (!projet) return <ProjetIntrouvable />

  return (
    <div className="space-y-5">
      <EnteteProjet
        projet={projet}
        sousTitre={projet.description}
        meta={
          <>
            <Badge tone="neutral">
              {synthese.services} service{synthese.services > 1 ? 's' : ''}
            </Badge>
            <Badge tone="violet">{money(synthese.coutMensuel)}/mois</Badge>
            <Badge tone="neutral">
              Espace <span className="font-mono">{projet.espaceId.toUpperCase()}</span>
            </Badge>
            <span className="text-[11.5px] text-g-500">
              créé le {dateCourte(projet.cree)} · dernière activité {relatif(synthese.derniereMaj)}
            </span>
          </>
        }
        actions={
          <>
            <NouveauService
              autorise={autorise('app.deploy')}
              message={refus('app.deploy')}
              onChoix={setCreation}
            />
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <MicroLabel className="mr-1">Environnement</MicroLabel>
          {projet.environnements.map((e) => {
            const compte = services.filter((s) => s.environnement === e).length
            return (
              <button
                key={e}
                type="button"
                onClick={() => setEnv(e)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1.5 text-[12px] font-semibold transition-colors',
                  e === env
                    ? 'border-p-700 bg-p-700 text-white'
                    : 'border-g-300 text-g-700 hover:border-p-400 hover:bg-p-050',
                )}
              >
                {e}
                <span
                  className={cn(
                    'tnum rounded-full px-1.5 text-[10.5px]',
                    e === env ? 'bg-white/20' : 'bg-g-100 text-g-700',
                  )}
                >
                  {compte}
                </span>
              </button>
            )
          })}
        </div>
        <span className="text-[11.5px] text-g-500">
          Chaque environnement porte ses propres services et ses propres variables.
        </span>
      </div>

      {servicesEnv.length === 0 ? (
        <EmptyState
          titre={`Aucun service en ${env}`}
          phrase="Un environnement vide ne facture rien. Déployez une application, une base ou une tâche planifiée pour le peupler."
          icone={<Rocket size={22} />}
          action={{ libelle: 'Déployer une application', href: '/app/applications/nouveau' }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {servicesEnv.map((s) => (
            <CarteService key={s.id} service={s} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatTile
          libelle="Services de cet environnement"
          valeur={servicesEnv.length}
          detail={`sur ${synthese.services} au total`}
        />
        <StatTile
          libelle="Coût de cet environnement"
          valeur={money(servicesEnv.reduce((a, s) => a + s.coutMensuel, 0)).replace(
            ' FCFA',
            '',
          )}
          unite="FCFA"
          detail="par mois"
        />
        <StatTile
          libelle="Services en échec"
          valeur={servicesEnv.filter((s) => s.statut === 'failed').length}
          ton={servicesEnv.some((s) => s.statut === 'failed') ? 'err' : 'ok'}
        />
      </div>

      <TiroirCreation
        type={creation}
        projet={projet}
        env={env}
        onClose={() => setCreation(null)}
        onCree={rechargerServices}
      />
    </div>
  )
}

/** Port d'écoute d'usage de chaque moteur, pour l'URI interne affichée. */
const PORT_MOTEUR: Record<MoteurBase, number> = {
  postgresql: 5432,
  mysql: 3306,
  mariadb: 3306,
  mongodb: 27017,
  redis: 6379,
  clickhouse: 9000,
}

// ─── Créer un service ─────────────────────────────────────────────────

function NouveauService({
  autorise,
  message,
  onChoix,
}: {
  autorise: boolean
  message: string
  onChoix: (t: TypeServiceProjet) => void
}) {
  const TYPES: Array<{ type: TypeServiceProjet; phrase: string }> = [
    { type: 'application', phrase: 'Dépôt Git ou image Docker' },
    { type: 'base', phrase: 'PostgreSQL, MySQL, Redis, MongoDB…' },
    { type: 'statique', phrase: 'Sortie de build servie en bordure' },
    { type: 'cron', phrase: 'Commande exécutée selon un cron' },
    { type: 'worker', phrase: 'Processus de file, sans port exposé' },
  ]

  if (!autorise) {
    return (
      <GatedAction autorise={false} message={message}>
        <Button iconBefore={<Plus size={14} />}>Créer un service</Button>
      </GatedAction>
    )
  }

  return (
    <Popover
      width="w-80"
      label="Créer un service dans ce projet"
      trigger={() => (
        <span className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-p-700 px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-p-800">
          <Plus size={14} />
          Créer un service
        </span>
      )}
    >
      {(close) => (
        <div className="p-2">
          <p className="type-micro px-2 py-1.5 text-g-500">Type de service</p>
          {TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => {
                onChoix(t.type)
                close()
              }}
              className="flex w-full items-start gap-2.5 rounded-[6px] px-2 py-2 text-left transition-colors hover:bg-p-050"
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-p-050 text-p-700">
                {ICONE_TYPE[t.type]}
              </span>
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-ink">
                  {TYPE_SERVICE_LABEL[t.type]}
                </span>
                <span className="block text-[11px] leading-snug text-g-500">{t.phrase}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Popover>
  )
}

function TiroirCreation({
  type,
  projet,
  env,
  onClose,
  onCree,
}: {
  type: TypeServiceProjet | null
  projet: Projet
  env: string
  onClose: () => void
  onCree?: () => void
}) {
  const lesServices = useCollection<ServiceProjet>('services-projet', SERVICES_PROJET)
  const executer = useOperation()
  const [nom, setNom] = useState('')
  const [moteur, setMoteur] = useState<MoteurBase>('postgresql')
  const [version, setVersion] = useState('')
  const [cron, setCron] = useState('0 2 * * *')
  const [commande, setCommande] = useState('')
  const [file, setFile] = useState('')
  const [concurrence, setConcurrence] = useState(4)
  const choix = MOTEURS_DISPONIBLES.find((m) => m.moteur === moteur)!

  if (!type) return null

  /** Un service naît en construction, puis passe en marche à la fin du job. */
  const creerService = () => {
    const idService = lesServices.identifiant('svc')
    const ressources =
      type === 'base'
        ? { cpu: 2, ramMo: 4096, diskGo: 100 }
        : type === 'cron'
          ? { cpu: 1, ramMo: 1024, diskGo: 5 }
          : type === 'worker'
            ? { cpu: 2, ramMo: 4096, diskGo: 10 }
            : { cpu: 1, ramMo: 2048, diskGo: 10 }
    const cout =
      type === 'base' ? 24800 : type === 'cron' ? 3600 : type === 'worker' ? 14200 : 9400

    executer({
      action: 'app.deploy',
      titre: `${TYPE_SERVICE_LABEL[type]} « ${nom.trim()} » en création`,
      detail:
        type === 'base'
          ? `${MOTEUR_LABEL[moteur]} ${version || choix.versions[0]}, joint au réseau privé du projet — aucun port ouvert sur Internet.`
          : `Déployé dans ${env}, sur l’adresse offerte du projet.`,
      appel: () =>
        creerRessource(`/projets/${encodeURIComponent(projet.id)}/services`, {
          nom: nom.trim(),
          type,
          environnement: env,
          ressources,
          ...(type === 'base'
            ? { moteur, version: version || choix.versions[0] }
            : {}),
          ...(type === 'cron' ? { cron: { expression: cron, commande: commande.trim() } } : {}),
          ...(type === 'worker' ? { file: { nom: file.trim(), concurrence } } : {}),
        }),
      effet: () =>
        lesServices.creer({
          id: idService,
          projetId: projet.id,
          nom: nom.trim(),
          type,
          environnement: env,
          statut: 'building',
          ressources,
          emplacement: { site: 'ABJ', backend: 'os-abj-01', namespace: `${projet.id}-${env.toLowerCase()}` },
          derniereMaj: MAINTENANT,
          coutMensuel: cout,
          ...(type === 'base'
            ? {
                moteur,
                version: version || choix.versions[0],
                base: {
                  nom: nom.trim().replace(/-/g, '_'),
                  utilisateur: `${nom.trim().replace(/-/g, '_')}_app`,
                  // Le mot de passe n'est jamais affiché en clair ailleurs qu'au
                  // premier écran : la maquette n'en fabrique pas un crédible.
                  motDePasse: '••••••••••••',
                  hoteInterne: `${nom.trim()}.${projet.id}.interne`,
                  port: PORT_MOTEUR[moteur],
                },
              }
            : {}),
          ...(type === 'cron'
            ? {
                cron: {
                  expression: cron,
                  lisible: 'selon l’expression saisie',
                  commande: commande.trim(),
                  derniereExecution: MAINTENANT,
                  dureeS: 0,
                  statut: 'ok' as const,
                  prochaine: MAINTENANT,
                },
              }
            : {}),
          ...(type === 'worker'
            ? {
                file: {
                  nom: file.trim(),
                  enAttente: 0,
                  traitesJour: 0,
                  echecsJour: 0,
                  concurrence,
                },
              }
            : {}),
        }),
      job: {
        type: `service.${type}.create`,
        label: `Création de ${nom.trim()} · ${projet.nom} · ${env}`,
        etapes:
          type === 'base'
            ? [
                'Réserver le volume',
                `Installer ${MOTEUR_LABEL[moteur]}`,
                'Joindre le réseau privé du projet',
                'Appliquer le plan de sauvegarde',
              ]
            : [
                'Provisionner les ressources',
                'Injecter les variables du projet',
                'Démarrer le service',
                'Publier l’adresse offerte',
              ],
      },
      effetFinal: () => {
        if (estActif()) {
          onCree?.()
          return
        }
        lesServices.modifier(idService, { statut: 'running' })
      },
    })
    onClose()
  }

  const sousDomaine = `${nom || '<service>'}-${env.toLowerCase().slice(0, 7)}.${ZONE_APPLICATIVE.zone}`

  return (
    <Drawer
      open
      onClose={onClose}
      title={`${TYPE_SERVICE_LABEL[type]} · ${projet.nom} · ${env}`}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          {type === 'application' || type === 'statique' ? (
            <ButtonLink href="/app/applications/nouveau">Ouvrir l’assistant complet</ButtonLink>
          ) : (
            <Button disabled={nom.trim().length === 0} onClick={creerService}>
              Créer le service
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {(type === 'application' || type === 'statique') && (
          <Callout ton="info" titre="Cinq étapes, pas un formulaire">
            Déployer depuis un dépôt passe par l’assistant : lecture du code, architecture, cible et
            ressources, environnements. Il pré-remplit ce projet et cet environnement.
          </Callout>
        )}

        <Field
          label="Nom du service"
          hint="Sert de nom d’hôte interne et de préfixe d’adresse. Minuscules, chiffres et tirets."
        >
          <Input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder={type === 'base' ? 'postgres' : 'api'}
          />
        </Field>

        {type === 'base' && (
          <>
            <Field label="Moteur" hint={choix.usage}>
              <Select value={moteur} onChange={(e) => setMoteur(e.target.value as MoteurBase)}>
                {MOTEURS_DISPONIBLES.map((m) => (
                  <option key={m.moteur} value={m.moteur}>
                    {MOTEUR_LABEL[m.moteur]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Version" hint="Les versions mineures sont appliquées en fenêtre annoncée.">
              <Select
                value={version || choix.versions[0]}
                onChange={(e) => setVersion(e.target.value)}
              >
                {choix.versions.map((v) => (
                  <option key={v} value={v}>
                    {MOTEUR_LABEL[moteur]} {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Callout ton="violet" titre="Accessible depuis le projet uniquement">
              La base est jointe au réseau privé du projet. Aucun port n’est ouvert sur Internet
              tant que vous ne l’exposez pas explicitement, et cette exposition demande une liste
              d’adresses autorisées.
            </Callout>
          </>
        )}

        {type === 'cron' && (
          <>
            <Field
              label="Expression cron"
              hint="Cinq champs, en UTC. Le portail affiche toujours la traduction en clair à côté."
            >
              <Input
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                className="font-mono"
              />
            </Field>
            <Field label="Commande" hint="Exécutée dans l’image du service, avec ses variables.">
              <Input
                placeholder="node scripts/cloture.js"
                value={commande}
                onChange={(e) => setCommande(e.target.value)}
                className="font-mono"
              />
            </Field>
          </>
        )}

        {type === 'worker' && (
          <>
            <Field label="Nom de la file" hint="La file que ce worker consomme.">
              <Input
                placeholder="rapprochement"
                value={file}
                onChange={(e) => setFile(e.target.value)}
                className="font-mono"
              />
            </Field>
            <Field
              label="Concurrence"
              hint="Nombre de tâches traitées en parallèle par instance du worker."
            >
              <Input
                type="number"
                min={1}
                value={concurrence}
                onChange={(e) => setConcurrence(Number(e.target.value))}
              />
            </Field>
          </>
        )}

        {type !== 'base' && type !== 'cron' && type !== 'worker' && (
          <div className="rounded-[8px] border border-g-300 bg-g-050 p-3">
            <MicroLabel>Adresse attribuée automatiquement</MicroLabel>
            <CopyField value={sousDomaine} className="mt-1.5" />
            <p className="mt-2 text-[11.5px] leading-relaxed text-g-500">
              Certificat émis dès le premier déploiement. Vous pourrez brancher votre propre domaine
              ensuite, sans changer cette adresse.
            </p>
          </div>
        )}

        <CostPreview
          lignes={
            type === 'base'
              ? [
                  { libelle: `${MOTEUR_LABEL[moteur]} — 2 vCPU · 4 Go`, montant: 14800 },
                  { libelle: 'Volume 100 Go NVMe', montant: 70000 / 10 },
                  { libelle: 'Plan de sauvegarde quotidien', montant: 2800 },
                ]
              : type === 'cron'
                ? [{ libelle: '1 vCPU · 1 Go, facturé au temps d’exécution', montant: 3600 }]
                : type === 'worker'
                  ? [{ libelle: '2 vCPU · 4 Go en continu', montant: 14200 }]
                  : [{ libelle: '1 vCPU · 2 Go, extensible à chaud', montant: 9400 }]
          }
        />
      </div>
    </Drawer>
  )
}

