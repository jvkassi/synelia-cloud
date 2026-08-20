'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  Clock,
  Database,
  Eye,
  EyeOff,
  FileCode2,
  Globe,
  Plus,
  Rocket,
  Trash2,
  Workflow,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateCourte, money, relatif } from '@/lib/format'
import type { MoteurBase, TypeServiceProjet } from '@/lib/types'
import {
  DOMAINES_APPLICATIFS,
  MOTEURS_DISPONIBLES,
  MOTEUR_LABEL,
  TYPE_SERVICE_LABEL,
  ZONE_APPLICATIVE,
  projetById,
  servicesDuProjet,
  syntheseProjet,
} from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink, IconButton } from '@/components/ui/button'
import { CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { ConfirmDialog, Drawer, Popover } from '@/components/ui/overlay'
import { CostPreview } from '@/components/composition/flow'
import { CarteService, ICONE_TYPE } from '@/components/business/projets'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'services', label: 'Services' },
  { id: 'variables', label: 'Variables partagées' },
  { id: 'domaines', label: 'Domaines' },
  { id: 'parametres', label: 'Paramètres' },
]

export function VueProjet({ id }: { id: string }) {
  const projet = projetById(id)!
  const services = servicesDuProjet(id)
  const synthese = syntheseProjet(id)
  const { autorise, refus } = useApp()

  const [onglet, setOnglet] = useState('services')
  const [env, setEnv] = useState(projet.environnements[0])
  const [creation, setCreation] = useState<TypeServiceProjet | null>(null)

  const servicesEnv = useMemo(
    () => services.filter((s) => s.environnement === env),
    [services, env],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Projets', href: '/app/projets' },
          { label: projet.nom },
        ]}
        titre={projet.nom}
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

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'services' && (
        <>
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
              action={{ libelle: 'Déployer une application', href: '/app/projets/nouveau' }}
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
        </>
      )}

      {onglet === 'variables' && <OngletVariables projet={projet} />}
      {onglet === 'domaines' && <OngletDomaines projetId={id} />}
      {onglet === 'parametres' && <OngletParametres projet={projet} />}

      <TiroirCreation
        type={creation}
        projet={projet}
        env={env}
        onClose={() => setCreation(null)}
      />
    </div>
  )
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
}: {
  type: TypeServiceProjet | null
  projet: NonNullable<ReturnType<typeof projetById>>
  env: string
  onClose: () => void
}) {
  const [nom, setNom] = useState('')
  const [moteur, setMoteur] = useState<MoteurBase>('postgresql')
  const choix = MOTEURS_DISPONIBLES.find((m) => m.moteur === moteur)!

  if (!type) return null

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
            <ButtonLink href="/app/projets/nouveau">Ouvrir l’assistant complet</ButtonLink>
          ) : (
            <Button onClick={onClose}>Créer le service</Button>
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
              <Select defaultValue={choix.versions[0]}>
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
              <Input defaultValue="0 2 * * *" className="font-mono" />
            </Field>
            <Field label="Commande" hint="Exécutée dans l’image du service, avec ses variables.">
              <Input placeholder="node scripts/cloture.js" className="font-mono" />
            </Field>
          </>
        )}

        {type === 'worker' && (
          <>
            <Field label="Nom de la file" hint="La file que ce worker consomme.">
              <Input placeholder="rapprochement" className="font-mono" />
            </Field>
            <Field
              label="Concurrence"
              hint="Nombre de tâches traitées en parallèle par instance du worker."
            >
              <Input type="number" defaultValue={4} />
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

// ─── Variables partagées ──────────────────────────────────────────────

function OngletVariables({ projet }: { projet: NonNullable<ReturnType<typeof projetById>> }) {
  const { autorise, refus } = useApp()
  const [reveles, setReveles] = useState<Record<string, boolean>>({})

  return (
    <div className="space-y-4">
      <Callout ton="violet" titre="Héritées par tous les services du projet">
        Une variable définie ici est injectée dans chaque service de l’environnement concerné. Un
        service peut la redéfinir pour lui seul ; la valeur du service gagne toujours.
      </Callout>

      <Card>
        <CardHeader
          titre="Variables et secrets du projet"
          sousTitre="Les valeurs secrètes ne sont jamais affichées par défaut, et leur révélation est journalisée."
          actions={
            <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
              <Button size="sm" iconBefore={<Plus size={13} />}>
                Ajouter une variable
              </Button>
            </GatedAction>
          }
        />
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-max border-collapse">
            <thead>
              <tr className="border-b border-g-300 bg-g-050">
                {['Clé', 'Valeur', 'Portée', 'Environnements', ''].map((h) => (
                  <th
                    key={h}
                    className="type-micro px-3 py-2 text-left font-semibold text-g-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projet.variables.map((v, i) => (
                <tr key={`${v.cle}-${i}`} className="border-b border-g-100 last:border-0">
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[12.5px] font-semibold text-ink">{v.cle}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    {v.secret ? (
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[12px] text-g-700">
                          {reveles[`${v.cle}-${i}`] ? 'postgresql://app_metier:…' : '••••••••••••'}
                        </span>
                        <IconButton
                          label={
                            reveles[`${v.cle}-${i}`] ? 'Masquer la valeur' : 'Révéler la valeur'
                          }
                          size="sm"
                          onClick={() =>
                            setReveles((r) => ({ ...r, [`${v.cle}-${i}`]: !r[`${v.cle}-${i}`] }))
                          }
                        >
                          {reveles[`${v.cle}-${i}`] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </IconButton>
                      </span>
                    ) : (
                      <span className="font-mono text-[12px] text-g-700">{v.valeur}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={v.portee === 'build' ? 'info' : 'neutral'} size="sm">
                      {v.portee === 'build' ? 'Build' : 'Exécution'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex flex-wrap gap-1">
                      {v.environnements.map((e) => (
                        <Badge key={e} tone="neutral" size="sm">
                          {e}
                        </Badge>
                      ))}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-[11.5px] text-g-500">
                      {v.secret ? 'coffre de secrets' : 'clair'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader
          titre="Où vivent les secrets"
          sousTitre="Ce que le portail garantit, et ce qu'il ne fait pas."
        />
        <KeyValueList
          colonnes={2}
          items={[
            {
              cle: 'Stockage',
              valeur:
                'Chiffré au repos dans le coffre de l’organisation, jamais dans l’image construite.',
            },
            {
              cle: 'Injection',
              valeur:
                'Au démarrage du conteneur pour la portée exécution, au moment du build sinon.',
            },
            {
              cle: 'Révélation',
              valeur:
                'Journalisée dans l’audit avec l’auteur, l’heure et la variable concernée.',
            },
            {
              cle: 'Rotation',
              valeur:
                'Changer une valeur exige un redéploiement pour prendre effet — le portail le propose.',
            },
          ]}
        />
      </Card>
    </div>
  )
}

// ─── Domaines du projet ───────────────────────────────────────────────

function OngletDomaines({ projetId }: { projetId: string }) {
  const services = servicesDuProjet(projetId)
  const ids = new Set(services.map((s) => s.id))
  const domaines = DOMAINES_APPLICATIFS.filter((d) => ids.has(d.serviceId))

  return (
    <div className="space-y-4">
      <Callout ton="info" titre="Un domaine appartient à un service, pas au projet">
        Le projet n’est qu’un regroupement : chaque adresse pointe vers un service précis et un port
        précis. La vue complète, avec les adresses d’entrée et la vérification DNS, est dans{' '}
        <Link href="/app/routage" className="font-semibold text-p-700 hover:text-m-600">
          Domaines &amp; routage
        </Link>
        .
      </Callout>

      {domaines.length === 0 ? (
        <EmptyState
          titre="Aucun domaine sur ce projet"
          phrase="Les services de ce projet ne sont pas exposés sur le web : une base, une tâche planifiée ou un worker n’ont pas d’adresse publique."
          icone={<Globe size={22} />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {domaines.map((d) => {
            const svc = services.find((s) => s.id === d.serviceId)!
            return (
              <Card key={d.id}>
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <a
                      href={`https://${d.hote}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate font-mono text-[13px] font-bold text-ink hover:text-p-700"
                    >
                      {d.hote}
                      {d.chemin !== '/' && <span className="text-g-500">{d.chemin}</span>}
                    </a>
                    <span className="block text-[11px] text-g-500">
                      {svc.nom} · {svc.environnement} · port {d.portConteneur}
                    </span>
                  </span>
                  <Badge tone={d.origine === 'genere' ? 'violet' : 'neutral'} size="sm">
                    {d.origine === 'genere' ? 'Offert' : 'Votre domaine'}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-g-100 pt-3">
                  <Badge
                    tone={
                      d.certificat.etat === 'actif'
                        ? 'ok'
                        : d.certificat.etat === 'en_emission'
                          ? 'info'
                          : d.certificat.etat === 'echec'
                            ? 'err'
                            : 'neutral'
                    }
                    size="sm"
                  >
                    {
                      {
                        actif: 'Certificat actif',
                        en_emission: 'Certificat en émission',
                        echec: 'Certificat en échec',
                        aucun: 'Sans certificat',
                      }[d.certificat.etat]
                    }
                  </Badge>
                  {d.certificat.expire && (
                    <span className="text-[11.5px] text-g-500">
                      renouvellement le {dateCourte(d.certificat.expire)}
                    </span>
                  )}
                  {d.verification && d.verification.etat !== 'ok' && (
                    <Badge tone={d.verification.etat === 'echec' ? 'err' : 'warn'} size="sm">
                      {d.verification.etat === 'echec'
                        ? 'Vérification en échec'
                        : 'Vérification en attente'}
                    </Badge>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Paramètres du projet ─────────────────────────────────────────────

function OngletParametres({ projet }: { projet: NonNullable<ReturnType<typeof projetById>> }) {
  const { autorise, refus } = useApp()
  const services = servicesDuProjet(projet.id)
  const [suppression, setSuppression] = useState(false)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader
          titre="Identité du projet"
          sousTitre="Le nom apparaît dans les journaux, la facturation et le showback."
        />
        <div className="space-y-3.5">
          <Field label="Nom">
            <Input defaultValue={projet.nom} />
          </Field>
          <Field label="Description">
            <Textarea rows={3} defaultValue={projet.description} />
          </Field>
          <Field
            label="Espace Cloud de rattachement"
            hint="Détermine le quota consommé et le site physique par défaut des services."
          >
            <Select defaultValue={projet.espaceId}>
              <option value={projet.espaceId}>{projet.espaceId.toUpperCase()}</option>
            </Select>
          </Field>
        </div>
        <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
          <Button size="sm" className="mt-4">
            Enregistrer
          </Button>
        </GatedAction>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader
            titre="Environnements"
            sousTitre="Ajouter un environnement ne déploie rien : il naît vide."
          />
          <div className="space-y-2">
            {projet.environnements.map((e) => (
              <div
                key={e}
                className="flex items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-semibold text-ink">{e}</span>
                  <span className="block text-[11px] text-g-500">
                    {services.filter((s) => s.environnement === e).length} service(s) ·{' '}
                    {money(
                      services
                        .filter((s) => s.environnement === e)
                        .reduce((a, s) => a + s.coutMensuel, 0),
                    )}
                    /mois
                  </span>
                </span>
                {e === 'Production' ? (
                  <Badge tone="violet" size="sm">
                    Protégé
                  </Badge>
                ) : (
                  <Switch
                    checked={false}
                    onChange={() => {}}
                    label="Approbation requise"
                  />
                )}
              </div>
            ))}
          </div>
          <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
            <Button size="sm" variant="secondary" className="mt-3" iconBefore={<Plus size={13} />}>
              Ajouter un environnement
            </Button>
          </GatedAction>
        </Card>

        <Card className="border-err/40">
          <CardHeader
            titre="Supprimer le projet"
            sousTitre="Irréversible. Les services, leurs volumes et leurs sauvegardes sont détruits."
          />
          <ul className="mb-3 space-y-1 text-[12px] text-g-700">
            <li>
              {services.length} service{services.length > 1 ? 's' : ''} arrêté
              {services.length > 1 ? 's' : ''} puis supprimé{services.length > 1 ? 's' : ''}
            </li>
            <li>
              {services.filter((s) => s.type === 'base').length} base(s) de données et leurs volumes
            </li>
            <li>Les domaines rattachés cessent de répondre immédiatement</li>
          </ul>
          <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
            <Button
              variant="danger"
              size="sm"
              iconBefore={<Trash2 size={13} />}
              onClick={() => setSuppression(true)}
            >
              Supprimer ce projet
            </Button>
          </GatedAction>
        </Card>
      </div>

      <ConfirmDialog
        open={suppression}
        onClose={() => setSuppression(false)}
        onConfirm={() => setSuppression(false)}
        titre="Supprimer le projet"
        ressource={projet.nom}
        pertes={[
          `${services.length} service(s) en cours d'exécution`,
          `${services.filter((s) => s.type === 'base').length} base(s) de données et leurs volumes`,
          'Les sauvegardes associées, au-delà de la rétention légale',
          'Les domaines rattachés, qui cesseront de répondre',
        ]}
        libelleAction="Supprimer définitivement"
      />
    </div>
  )
}
