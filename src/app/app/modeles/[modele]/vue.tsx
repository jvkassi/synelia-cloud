'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Database,
  ExternalLink,
  HardDrive,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { cn, surfaceMarque } from '@/lib/utils'
import { money } from '@/lib/format'
import { SITE_LABEL, type Site } from '@/lib/types'
import { PROJETS, ZONE_APPLICATIVE, modeleBySlug } from '@/lib/mock'
import { configurationDuService } from '@/lib/configurations'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { CopyField, GatedAction } from '@/components/ui/display'
import { Field, Input, SegmentedControl, Select, Switch } from '@/components/ui/field'
import { PageHeader, Card, CardHeader, Callout, KeyValueList } from '@/components/composition/card'
import { CostPreview, Stepper, Timeline } from '@/components/composition/flow'
import { useApp } from '@/components/app/contexte'

const ETAPES = [
  { numero: 1, titre: 'Projet' },
  { numero: 2, titre: 'Dimensionnement' },
  { numero: 3, titre: 'Domaine' },
  { numero: 4, titre: 'SSO & sauvegarde' },
  { numero: 5, titre: 'Récapitulatif' },
]

/** Les sept tâches de l'orchestrateur (§6.4), rejouées à chaque déploiement. */
const TACHES_DEPLOIEMENT = [
  'Allouer la capacité dans l’Espace Cloud',
  'Déployer l’instance et ses dépendances',
  'Configurer le domaine et le certificat',
  'Déclarer le client OIDC dans Keycloak',
  'Appliquer le plan de sauvegarde',
  'Enregistrer les sondes de supervision',
  'Créer la souscription facturable',
]

export function VueModele({ slug }: { slug: string }) {
  const { autorise, refus, pousser } = useApp()
  const m = modeleBySlug(slug)

  const [etape, setEtape] = useState(1)
  const [projetId, setProjetId] = useState(PROJETS[0].id)
  const [environnement, setEnvironnement] = useState(PROJETS[0].environnements[0])
  const [nom, setNom] = useState(slug)
  const [site, setSite] = useState<Site>('ABJ')
  const [palier, setPalier] = useState<'petit' | 'standard' | 'large'>('standard')
  const [origineDomaine, setOrigineDomaine] = useState<'genere' | 'personnalise'>('genere')
  const [domainePerso, setDomainePerso] = useState('')
  const [sso, setSso] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(true)
  const [lance, setLance] = useState(false)

  const projet = PROJETS.find((p) => p.id === projetId) ?? PROJETS[0]
  const config = m?.configuration ? configurationDuService(m.configuration) : undefined

  const facteur = palier === 'petit' ? 0.5 : palier === 'large' ? 2 : 1
  const ressources = useMemo(() => {
    if (!m) return { cpu: 0, ramMo: 0, diskGo: 0 }
    return {
      cpu: Math.max(1, Math.round(m.ressources.cpu * facteur)),
      ramMo: Math.round(m.ressources.ramMo * facteur),
      diskGo: Math.round(m.ressources.diskGo * facteur),
    }
  }, [m, facteur])

  if (!m) return null

  const surface = surfaceMarque(m.logoTeinte)
  const hote =
    origineDomaine === 'genere'
      ? `${nom || m.sousDomaine}.${ZONE_APPLICATIVE.zone}`
      : domainePerso || `${m.sousDomaine}.votredomaine.ci`
  const prix = Math.round(m.prixIndicatif * facteur)
  const ingress = ZONE_APPLICATIVE.ingress.find((i) => i.site === site) ?? ZONE_APPLICATIVE.ingress[0]

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Bibliothèque de modèles', href: '/app/modeles' },
          { label: m.nom },
        ]}
        titre={
          <span className="flex flex-wrap items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] text-[13px] font-bold [font-family:var(--font-display)]"
              style={{ background: surface.fond, color: surface.texte }}
              aria-hidden
            >
              {m.logoInitiales}
            </span>
            {m.nom}
          </span>
        }
        sousTitre={m.phrase}
        meta={
          <>
            <Badge tone="neutral">
              {m.solution} {m.version}
            </Badge>
            {m.certifie ? (
              <Badge tone="ok">
                <ShieldCheck size={10} className="mr-1 inline" />
                Certifié Synelia
              </Badge>
            ) : (
              <Badge tone="neutral">Communauté</Badge>
            )}
            <Badge tone="violet">Instance dédiée</Badge>
            <Badge tone="neutral">
              {m.ressources.cpu} vCPU · {(m.ressources.ramMo / 1024).toFixed(0)} Go ·{' '}
              {m.ressources.diskGo} Go
            </Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Colonne de gauche : ce que c'est, ce que Synelia opère */}
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader titre="Ce que fait cette solution" />
            <p className="text-[13.5px] leading-relaxed text-g-700">{m.description}</p>
            <Callout ton="info" className="mt-4" titre="Ce que le portail ne fera pas">
              {m.horsPerimetre}
            </Callout>
          </Card>

          <Card>
            <CardHeader
              titre="Ce que le déploiement met en place"
              sousTitre="Un modèle n’installe pas qu’un conteneur : il amène ses dépendances, ses volumes et son entrée réseau."
            />
            <div className="space-y-4">
              {m.dependances.length > 0 && (
                <div>
                  <MicroLabel className="flex items-center gap-1.5">
                    <Database size={11} /> Services créés dans le projet
                  </MicroLabel>
                  <ul className="mt-2 space-y-1.5">
                    {m.dependances.map((d) => (
                      <li
                        key={d.nom}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-g-300 px-2.5 py-1.5"
                      >
                        <span className="text-[12.5px] font-semibold text-ink">{d.nom}</span>
                        <span className="flex items-center gap-2">
                          <Badge tone="neutral" size="sm">
                            {
                              {
                                base: 'Base de données',
                                cache: 'Cache',
                                file: 'File de traitement',
                                stockage: 'Stockage',
                              }[d.type]
                            }
                          </Badge>
                          <span className="text-[11px] text-g-500">{d.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <MicroLabel className="flex items-center gap-1.5">
                    <HardDrive size={11} /> Volumes persistants
                  </MicroLabel>
                  <ul className="mt-2 space-y-1.5">
                    {m.volumes.map((v) => (
                      <li key={v.chemin} className="rounded-[6px] border border-g-300 px-2.5 py-1.5">
                        <span className="block font-mono text-[11.5px] font-semibold text-ink">
                          {v.chemin}
                        </span>
                        <span className="block text-[11px] text-g-500">
                          {v.tailleGo} Go · {v.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <MicroLabel className="flex items-center gap-1.5">
                    <Network size={11} /> Ports exposés
                  </MicroLabel>
                  <ul className="mt-2 space-y-1.5">
                    {m.ports.map((p) => (
                      <li
                        key={`${p.conteneur}-${p.protocole}`}
                        className="flex items-center justify-between gap-2 rounded-[6px] border border-g-300 px-2.5 py-1.5"
                      >
                        <span className="font-mono text-[11.5px] font-semibold text-ink">
                          {p.conteneur}/{p.protocole === 'http' ? 'HTTP' : 'TCP'}
                        </span>
                        <span className="text-[11px] text-g-500">{p.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <MicroLabel>Variables d’environnement</MicroLabel>
                <ul className="mt-2 space-y-1.5">
                  {m.variables.map((v) => (
                    <li
                      key={v.cle}
                      className="rounded-[6px] border border-g-300 px-2.5 py-1.5"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11.5px] font-semibold text-ink">
                          {v.cle}
                        </span>
                        {v.obligatoire && (
                          <Badge tone="warn" size="sm">
                            Obligatoire
                          </Badge>
                        )}
                        {v.secret && (
                          <Badge tone="violet" size="sm">
                            Secret
                          </Badge>
                        )}
                        {v.valeur && (
                          <span className="font-mono text-[11px] text-g-500">= {v.valeur}</span>
                        )}
                      </span>
                      {v.aide && (
                        <span className="mt-0.5 block text-[11px] leading-snug text-g-500">
                          {v.aide}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              titre="Sauvegarde par défaut"
              sousTitre="Appliquée dès le déploiement. Modifiable ensuite depuis l’onglet Sauvegardes du service."
            />
            <KeyValueList
              items={[
                { cle: 'Fréquence', valeur: m.sauvegardeParDefaut.frequence },
                { cle: 'Rétention', valeur: `${m.sauvegardeParDefaut.retentionJours} jours` },
                { cle: 'Destination', valeur: 'Bucket immuable, sur l’autre site' },
                {
                  cle: 'Contenu sauvegardé',
                  valeur: m.sauvegardeParDefaut.inclut.join(' · '),
                },
              ]}
            />
          </Card>

          {config && (
            <Card>
              <CardHeader
                titre="Ce qui se configure depuis le portail"
                sousTitre={`${config.sections.length} sections de réglages propres à ${config.solution}, disponibles dès la mise en service.`}
              />
              <div className="flex flex-wrap gap-1.5">
                {config.sections.map((s) => (
                  <Badge key={s.titre} tone="neutral" size="sm">
                    {s.titre}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-g-700">{config.intro}</p>
            </Card>
          )}

          <Card>
            <CardHeader
              titre="Réversibilité"
              sousTitre="Une instance qu’on ne peut pas quitter est une instance qu’on ne devrait pas prendre."
            />
            <p className="text-[13px] leading-relaxed text-g-700">
              L’export se fait dans le format natif de {m.solution}, documenté et testé. Nous
              vérifions la restauration de cet export comme nous vérifions nos sauvegardes : à
              intervalle régulier, avec un résultat daté. Vous pouvez déclencher un export complet à
              tout moment depuis l’onglet Réversibilité du service.
            </p>
          </Card>
        </div>

        {/* Colonne de droite : l'assistant */}
        <div className="min-w-0">
          <div className="lg:sticky lg:top-[7.5rem]">
            <Card>
              {lance ? (
                <>
                  <CardHeader
                    titre="Déploiement lancé"
                    sousTitre={`${m.nom} arrive dans ${projet.nom}. Vous pouvez quitter cette page : le centre de tâches garde le suivi.`}
                  />
                  <Timeline
                    evenements={TACHES_DEPLOIEMENT.map((t, i) => ({
                      id: `tache-${i}`,
                      titre: t,
                      detail:
                        i === 0
                          ? 'Terminé en 12 s'
                          : i === 1
                            ? 'Récupération de l’image'
                            : 'En attente',
                      horodatage: i === 0 ? 'terminé' : i === 1 ? 'en cours' : '—',
                      ton: i === 0 ? ('ok' as const) : i === 1 ? ('info' as const) : ('neutral' as const),
                    }))}
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ButtonLink href={`/app/projets/${projet.id}`} variant="secondary" size="sm">
                      Voir le projet
                    </ButtonLink>
                    <Button variant="ghost" size="sm" onClick={() => setLance(false)}>
                      Déployer un autre exemplaire
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <CardHeader
                    titre="Déployer ce modèle"
                    sousTitre="Cinq étapes, les mêmes pour tous les modèles."
                  />
                  <Stepper etapes={ETAPES} courante={etape} onChange={setEtape} className="mb-4" />

                  {etape === 1 && (
                    <div className="space-y-3">
                      <Field
                        label="Projet de destination"
                        hint="Le service partagera les variables et le réseau interne du projet."
                      >
                        <Select
                          value={projetId}
                          onChange={(e) => {
                            const p = PROJETS.find((x) => x.id === e.target.value)
                            setProjetId(e.target.value)
                            if (p) setEnvironnement(p.environnements[0])
                          }}
                        >
                          {PROJETS.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nom}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Environnement">
                        <Select
                          value={environnement}
                          onChange={(e) => setEnvironnement(e.target.value)}
                        >
                          {projet.environnements.map((e) => (
                            <option key={e} value={e}>
                              {e}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field
                        label="Nom du service"
                        hint="Sert de nom d’hôte interne et de préfixe du sous-domaine."
                      >
                        <Input value={nom} onChange={(e) => setNom(e.target.value)} />
                      </Field>
                      <Callout ton="info" titre="Pourquoi un projet et pas un serveur">
                        Le projet regroupe ce qui se déploie et se sauvegarde ensemble. Les services
                        d’un même projet se parlent par leur nom, sans passer par Internet.
                      </Callout>
                    </div>
                  )}

                  {etape === 2 && (
                    <div className="space-y-3">
                      <Field label="Palier" hint="Ajustable à chaud après le déploiement.">
                        <SegmentedControl
                          options={[
                            { value: 'petit', label: 'Petit' },
                            { value: 'standard', label: 'Standard' },
                            { value: 'large', label: 'Large' },
                          ]}
                          value={palier}
                          onChange={setPalier}
                        />
                      </Field>
                      <KeyValueList
                        colonnes={1}
                        items={[
                          { cle: 'Processeur', valeur: `${ressources.cpu} vCPU` },
                          { cle: 'Mémoire', valeur: `${(ressources.ramMo / 1024).toFixed(1)} Go` },
                          { cle: 'Disque', valeur: `${ressources.diskGo} Go` },
                        ]}
                      />
                      <Field
                        label="Site physique"
                        hint="Une seule règle : les données restent là où vous les mettez."
                      >
                        <SegmentedControl
                          options={[
                            { value: 'ABJ', label: 'Abidjan' },
                            { value: 'GBM', label: 'Grand-Bassam' },
                          ]}
                          value={site}
                          onChange={setSite}
                        />
                      </Field>
                      <Callout ton="info" titre="Socle d’exécution">
                        Le service tourne dans l’espace de noms Kubernetes du projet, sur le socle
                        managé de {SITE_LABEL[site]}. Les volumes sont des disques Cinder chiffrés,
                        l’entrée passe par l’Ingress de la plateforme.
                      </Callout>
                    </div>
                  )}

                  {etape === 3 && (
                    <div className="space-y-3">
                      <Field label="Origine du domaine">
                        <SegmentedControl
                          options={[
                            { value: 'genere', label: 'Sous-domaine Synelia' },
                            { value: 'personnalise', label: 'Mon domaine' },
                          ]}
                          value={origineDomaine}
                          onChange={setOrigineDomaine}
                        />
                      </Field>
                      {origineDomaine === 'genere' ? (
                        <>
                          <CopyField label="Adresse du service" value={hote} mono />
                          <Callout ton="ok" titre="Rien à configurer">
                            Votre organisation dispose de la zone{' '}
                            <span className="font-mono">{ZONE_APPLICATIVE.zone}</span> avec un
                            certificat générique. Le service est joignable dès la fin du
                            déploiement — {ZONE_APPLICATIVE.quotaDomaines.utilises} sous-domaines
                            utilisés sur {ZONE_APPLICATIVE.quotaDomaines.total}.
                          </Callout>
                        </>
                      ) : (
                        <>
                          <Field
                            label="Domaine à utiliser"
                            hint="Nous vérifions le DNS puis émettons le certificat."
                          >
                            <Input
                              value={domainePerso}
                              onChange={(e) => setDomainePerso(e.target.value)}
                              placeholder={`${m.sousDomaine}.votredomaine.ci`}
                            />
                          </Field>
                          <Callout ton="warn" titre="Enregistrement à créer">
                            Créez un <span className="font-mono">A</span> vers{' '}
                            <span className="font-mono">{ingress.ip}</span> — ou un{' '}
                            <span className="font-mono">CNAME</span> vers{' '}
                            <span className="font-mono">{ZONE_APPLICATIVE.zone}</span>. Si votre zone
                            est gérée chez nous, nous le faisons pour vous.
                          </Callout>
                        </>
                      )}
                    </div>
                  )}

                  {etape === 4 && (
                    <div className="space-y-3">
                      <Switch
                        checked={sso}
                        onChange={setSso}
                        label="Connexion par la fédération Synelia"
                        description="Un client OIDC est déclaré dans Keycloak, les comptes sont créés à la première connexion, et vos groupes d’annuaire alimentent les rôles applicatifs."
                      />
                      <Switch
                        checked={sauvegarde}
                        onChange={setSauvegarde}
                        label="Appliquer le plan de sauvegarde par défaut"
                        description={`${m.sauvegardeParDefaut.frequence}, rétention ${m.sauvegardeParDefaut.retentionJours} jours, copie immuable sur l’autre site.`}
                      />
                      {!sauvegarde && (
                        <Callout ton="warn" titre="Sans plan de sauvegarde">
                          Aucune copie ne sera prise. Vous pourrez en ajouter un plus tard, mais les
                          données produites d’ici là ne seront pas récupérables.
                        </Callout>
                      )}
                      <Callout ton="info" titre="Supervision">
                        Les sondes sont posées automatiquement : disponibilité, temps de réponse,
                        mémoire, saturation des volumes. Elles alimentent votre engagement de
                        service, sans réglage de votre part.
                      </Callout>
                    </div>
                  )}

                  {etape === 5 && (
                    <div className="space-y-3">
                      <KeyValueList
                        colonnes={1}
                        items={[
                          { cle: 'Modèle', valeur: `${m.nom} — ${m.solution} ${m.version}` },
                          { cle: 'Projet', valeur: `${projet.nom} · ${environnement}` },
                          { cle: 'Nom du service', valeur: <span className="font-mono">{nom}</span> },
                          {
                            cle: 'Dimensionnement',
                            valeur: `${ressources.cpu} vCPU · ${(ressources.ramMo / 1024).toFixed(1)} Go · ${ressources.diskGo} Go`,
                          },
                          { cle: 'Site', valeur: SITE_LABEL[site] },
                          { cle: 'Adresse', valeur: <span className="font-mono text-[12px]">{hote}</span> },
                          { cle: 'Fédération', valeur: sso ? 'Activée' : 'Désactivée' },
                          {
                            cle: 'Sauvegarde',
                            valeur: sauvegarde
                              ? `${m.sauvegardeParDefaut.frequence}, ${m.sauvegardeParDefaut.retentionJours} j`
                              : 'Aucune',
                          },
                        ]}
                      />
                      <CostPreview
                        lignes={[
                          { libelle: `${m.nom} — palier ${palier}`, montant: prix },
                          ...(m.dependances.some((d) => d.type === 'base')
                            ? [{ libelle: 'Base de données du projet', detail: 'petit gabarit', montant: 12000 }]
                            : []),
                          ...(sauvegarde
                            ? [
                                {
                                  libelle: 'Sauvegarde immuable',
                                  detail: `${m.sauvegardeParDefaut.retentionJours} jours de rétention`,
                                  montant: Math.round(prix * 0.12),
                                },
                              ]
                            : []),
                        ]}
                        jourDuMois={19}
                      />
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-g-100 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={etape === 1}
                      onClick={() => setEtape((e) => Math.max(1, e - 1))}
                      iconBefore={<ArrowLeft size={13} />}
                    >
                      Précédent
                    </Button>
                    {etape < 5 ? (
                      <Button
                        size="sm"
                        onClick={() => setEtape((e) => Math.min(5, e + 1))}
                        iconAfter={<ArrowRight size={13} />}
                      >
                        Continuer
                      </Button>
                    ) : (
                      <GatedAction
                        autorise={autorise('marketplace.subscribe')}
                        message={refus('marketplace.subscribe')}
                      >
                        <Button
                          size="sm"
                          iconBefore={<Rocket size={13} />}
                          onClick={() => {
                            setLance(true)
                            pousser({
                              ton: 'info',
                              titre: `Déploiement de ${m.nom}`,
                              detail: `Dans ${projet.nom} · ${environnement} — sept tâches, suivi dans le centre de tâches.`,
                            })
                          }}
                        >
                          Déployer
                        </Button>
                      </GatedAction>
                    )}
                  </div>
                </>
              )}
            </Card>

            <Card className="mt-4">
              <CardHeader titre="Le même besoin en partagé ?" />
              <p className="text-[12.5px] leading-relaxed text-g-700">
                {['zimbra', 'nextcloud', 'jitsi'].includes(m.slug)
                  ? 'Ce besoin existe aussi en version partagée, rattachée à un domaine : moins cher, réglé au niveau du domaine, sur une instance mutualisée.'
                  : 'Ce modèle n’a pas d’équivalent partagé : il demande une instance isolée pour fonctionner correctement.'}
              </p>
              <ButtonLink
                href="/app/web/services"
                variant="ghost"
                size="sm"
                className="mt-2"
                iconAfter={<ExternalLink size={12} />}
              >
                Voir les services partagés
              </ButtonLink>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
