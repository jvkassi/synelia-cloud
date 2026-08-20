'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Check, Globe, Lock, Server, ShieldCheck, Users } from 'lucide-react'
import { cn, slugify } from '@/lib/utils'
import { money } from '@/lib/format'
import { SITE_LABEL, type Site } from '@/lib/types'
import { BACKUP_PLANS, CATALOGUE, ORG_COURANTE, USERS, ZONES_DNS } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input, Radio, Select, Slider, Switch } from '@/components/ui/field'
import { Avatar, SolutionLogo } from '@/components/ui/display'
import { Card, CardHeader, Callout, KeyValueList } from '@/components/composition/card'
import { CostPreview, WizardShell } from '@/components/composition/flow'
import { useApp } from '@/components/app/contexte'

const ETAPES = [
  { numero: 1, titre: 'Palier' },
  { numero: 2, titre: 'Mode & site' },
  { numero: 3, titre: 'Sièges' },
  { numero: 4, titre: 'Domaine' },
  { numero: 5, titre: 'SSO & sauvegarde' },
  { numero: 6, titre: 'Récapitulatif' },
]

export function AssistantSouscription({ slug }: { slug: string }) {
  const router = useRouter()
  const { pousser } = useApp()
  const service = CATALOGUE.find((c) => c.slug === slug)!

  const [etape, setEtape] = useState(1)
  const [palierCode, setPalierCode] = useState(
    (service.paliers.find((p) => p.recommande) ?? service.paliers[0]).code,
  )
  const [mode, setMode] = useState<'dedie' | 'mutualise'>(
    service.modes.includes('dedie') ? 'dedie' : 'mutualise',
  )
  const [site, setSite] = useState<Site>('ABJ')
  const [sieges, setSieges] = useState(20)
  const [attribues, setAttribues] = useState<string[]>(
    USERS.filter((u) => u.orgId === ORG_COURANTE.id && u.statut === 'actif')
      .slice(0, 4)
      .map((u) => u.id),
  )
  const [typeDomaine, setTypeDomaine] = useState<'synelia' | 'client'>('synelia')
  const [domaineClient, setDomaineClient] = useState(`${slugify(service.nom)}.dba.africa`)
  const [dnsVerifie, setDnsVerifie] = useState(false)
  const [ssoActif, setSsoActif] = useState(true)
  const [jit, setJit] = useState(true)
  const [planSauvegarde, setPlanSauvegarde] = useState('bp-services')
  const [conditions, setConditions] = useState(false)
  const [periodicite, setPeriodicite] = useState<'mensuelle' | 'annuelle'>('mensuelle')

  const palier = service.paliers.find((p) => p.code === palierCode)!
  const parSiege = palier.prixSiege !== undefined
  const majoration = mode === 'dedie' && service.modes.includes('mutualise') ? 1.2 : 1
  const baseHt = parSiege ? palier.prixSiege! * sieges : palier.prixMois!
  const coutMensuel = Math.round(baseHt * majoration)

  const sousDomaine = `${slugify(service.nom)}-${ORG_COURANTE.domaine?.split('.')[0] ?? 'org'}.synelia.cloud`
  const domaineFinal = typeDomaine === 'synelia' ? sousDomaine : domaineClient

  const lignesCout = useMemo(() => {
    const l = [
      parSiege
        ? {
            libelle: `${service.nom} · palier ${palier.nom}`,
            detail: `${money(palier.prixSiege!)} par siège et par mois`,
            montant: palier.prixSiege! * sieges,
            quantite: sieges,
          }
        : {
            libelle: `${service.nom} · palier ${palier.nom}`,
            detail: palier.specs,
            montant: palier.prixMois!,
          },
    ]
    if (majoration > 1) {
      l.push({
        libelle: 'Majoration mode dédié (+20 %)',
        detail: 'Instance isolée, capacité réservée sur le site choisi',
        montant: Math.round(baseHt * 0.2),
      })
    }
    return l
  }, [service.nom, palier, sieges, parSiege, majoration, baseHt])

  const membres = USERS.filter((u) => u.orgId === ORG_COURANTE.id)
  const peutContinuer =
    etape === 4 ? typeDomaine === 'synelia' || dnsVerifie : etape === 6 ? conditions : true

  const valider = () => {
    pousser({
      ton: 'info',
      titre: 'Souscription prise en compte',
      detail: `Le provisioning de ${service.nom} a démarré. Suivez son avancement dans le centre de tâches.`,
    })
    router.push('/app/taches/job-1')
  }

  return (
    <WizardShell
      etapes={ETAPES}
      courante={etape}
      onChange={setEtape}
      titre={ETAPES[etape - 1].titre}
      panneau={
        <>
          <Card>
            <div className="flex items-center gap-3">
              <SolutionLogo initiales={service.logoInitiales} teinte={service.logoTeinte} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-ink">{service.nom}</p>
                <p className="truncate text-[11.5px] text-g-500">{service.solutionOSS}</p>
              </div>
            </div>
            <dl className="mt-3 space-y-1.5 border-t border-g-100 pt-3">
              <Petit cle="Palier" valeur={palier.nom} />
              <Petit cle="Mode" valeur={mode === 'dedie' ? 'Dédié' : 'Mutualisé'} />
              <Petit cle="Site" valeur={site === 'ABJ' ? 'Abidjan' : 'Grand-Bassam'} />
              {parSiege && <Petit cle="Sièges" valeur={String(sieges)} />}
              <Petit cle="Domaine" valeur={domaineFinal} />
              <Petit cle="SSO" valeur={ssoActif ? 'Activé' : 'Désactivé'} />
            </dl>
          </Card>
          <CostPreview lignes={lignesCout} periodicite={periodicite} />
        </>
      }
      actions={
        <>
          <Button
            variant="ghost"
            onClick={() => (etape === 1 ? router.back() : setEtape(etape - 1))}
          >
            {etape === 1 ? 'Annuler' : 'Précédent'}
          </Button>
          {etape < 6 ? (
            <Button disabled={!peutContinuer} onClick={() => setEtape(etape + 1)}>
              Continuer
            </Button>
          ) : (
            <Button disabled={!conditions} onClick={valider}>
              Valider la souscription
            </Button>
          )}
        </>
      }
    >
      {/* ─── Étape 1 : palier ─────────────────────────────────────────── */}
      {etape === 1 && (
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-g-700">
            Le palier détermine le dimensionnement et les fonctionnalités disponibles. Il se change
            à chaud à tout moment, avec application immédiate du prorata.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {service.paliers.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => setPalierCode(p.code)}
                className={cn(
                  'flex flex-col rounded-[10px] border-2 bg-white p-4 text-left transition-colors',
                  palierCode === p.code
                    ? 'border-p-700 shadow-[0_4px_16px_rgba(43,27,77,.1)]'
                    : 'border-g-300 hover:border-p-400',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="type-h3">{p.nom}</h3>
                  {p.recommande && (
                    <Badge tone="violet" size="sm">
                      Recommandé
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-[12px] text-g-500">{p.specs}</p>
                <p className="tnum mt-3 text-[19px] font-bold [font-family:var(--font-display)] text-p-700">
                  {money(p.prixSiege ?? p.prixMois ?? 0)}
                  <span className="text-[11px] font-semibold text-g-500">
                    {p.prixSiege !== undefined ? '/siège/mois' : '/mois'}
                  </span>
                </p>
                <ul className="mt-3 flex-1 space-y-1 border-t border-g-100 pt-3">
                  {p.limites.map((l) => (
                    <li key={l} className="flex items-start gap-1.5 text-[12px] text-g-700">
                      <Check size={12} className="mt-0.5 shrink-0 text-ok" />
                      {l}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
          <Card className="bg-g-050">
            <Switch
              checked={periodicite === 'annuelle'}
              onChange={(v) => setPeriodicite(v ? 'annuelle' : 'mensuelle')}
              label="Facturation annuelle (−15 %)"
              description="Engagement de douze mois, résiliable à l’échéance avec trente jours de préavis. Le mensuel reste sans engagement."
            />
          </Card>
        </div>
      )}

      {/* ─── Étape 2 : mode & site ────────────────────────────────────── */}
      {etape === 2 && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {(['dedie', 'mutualise'] as const)
              .filter((m) => service.modes.includes(m))
              .map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'rounded-[10px] border-2 bg-white p-4 text-left transition-colors',
                    mode === m ? 'border-p-700' : 'border-g-300 hover:border-p-400',
                  )}
                >
                  <span className="flex items-center gap-2">
                    {m === 'dedie' ? (
                      <Lock size={15} className="text-p-700" />
                    ) : (
                      <Users size={15} className="text-p-700" />
                    )}
                    <span className="type-h3">{m === 'dedie' ? 'Dédié' : 'Mutualisé'}</span>
                    {m === 'dedie' && (
                      <Badge tone="accent" size="sm">
                        +20 %
                      </Badge>
                    )}
                  </span>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-g-700">
                    {m === 'dedie'
                      ? 'Une instance isolée, avec sa propre base de données et sa propre capacité. C’est l’argument de souveraineté : aucune donnée partagée avec un autre client, versions maîtrisées, fenêtre de maintenance négociable.'
                      : 'Un compte sur une instance partagée entre plusieurs organisations, cloisonné logiquement. Meilleur rapport prix, montées de version mutualisées, pas de choix de fenêtre de maintenance.'}
                  </p>
                </button>
              ))}
          </div>

          <div>
            <MicroLabel className="mb-2">Site d’hébergement</MicroLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['ABJ', 'GBM'] as Site[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSite(s)}
                  className={cn(
                    'rounded-[10px] border-2 bg-white p-4 text-left transition-colors',
                    site === s ? 'border-p-700' : 'border-g-300 hover:border-p-400',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Server size={15} className="text-p-700" />
                    <span className="type-h3">{SITE_LABEL[s]}</span>
                  </span>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-g-700">
                    {s === 'ABJ'
                      ? 'Site principal. Latence la plus faible depuis Abidjan et le district autonome. Recommandé pour les usages quotidiens.'
                      : 'Site de Grand-Bassam, zone franche VITIB. Recommandé si votre production tourne déjà sur ce site, ou pour séparer physiquement ce service de vos autres charges.'}
                  </p>
                  <p className="mt-2 text-[11.5px] text-g-500">
                    Résidence des données : Côte d’Ivoire. Attestation générable à tout moment.
                  </p>
                </button>
              ))}
            </div>
          </div>

          <Callout ton="violet" titre="Le placement technique reste notre affaire">
            Vous choisissez le site physique ; la répartition sur nos hyperviseurs est décidée côté
            fournisseur et n’apparaît pas dans votre interface. Cela nous permet de rééquilibrer la
            charge sans vous impliquer.
          </Callout>
        </div>
      )}

      {/* ─── Étape 3 : sièges ─────────────────────────────────────────── */}
      {etape === 3 && (
        <div className="space-y-4">
          {parSiege ? (
            <>
              <Card>
                <Slider
                  label="Nombre de sièges souscrits"
                  value={sieges}
                  onChange={setSieges}
                  min={5}
                  max={200}
                  step={5}
                  unite="sièges"
                />
                <p className="mt-2 text-[12px] text-g-500">
                  {money(palier.prixSiege!)} par siège et par mois · total{' '}
                  <span className="tnum font-semibold text-ink">
                    {money(palier.prixSiege! * sieges)}
                  </span>
                  . Vous pourrez ajouter ou retirer des sièges à tout moment, au prorata.
                </p>
              </Card>

              <Card>
                <CardHeader
                  titre="Attribution immédiate"
                  sousTitre={`${attribues.length} siège(s) attribué(s) sur ${sieges}. Les sièges non attribués restent disponibles.`}
                />
                <div className="space-y-1">
                  {membres.map((u) => {
                    const coche = attribues.includes(u.id)
                    return (
                      <label
                        key={u.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-[6px] border px-3 py-2 transition-colors',
                          coche ? 'border-p-300 bg-p-050' : 'border-g-300 hover:bg-g-050',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={coche}
                          onChange={() =>
                            setAttribues((p) =>
                              p.includes(u.id) ? p.filter((x) => x !== u.id) : [...p, u.id],
                            )
                          }
                          className="h-3.5 w-3.5 accent-[#4B2882]"
                        />
                        <Avatar nom={u.nom} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-medium text-ink">
                            {u.nom}
                          </span>
                          <span className="block truncate text-[11px] text-g-500">{u.email}</span>
                        </span>
                        <span className="shrink-0 text-[11px] text-g-500">{u.fonction}</span>
                      </label>
                    )
                  })}
                </div>
              </Card>
            </>
          ) : (
            <Callout ton="info" titre="Ce service n’est pas facturé au siège">
              {service.nom} est facturé au palier ({palier.specs}). Les utilisateurs autorisés sont
              déterminés par le mapping SSO à l’étape suivante, sans limite de nombre au-delà des
              capacités du palier.
            </Callout>
          )}
        </div>
      )}

      {/* ─── Étape 4 : domaine ────────────────────────────────────────── */}
      {etape === 4 && (
        <div className="space-y-4">
          <Card>
            <div className="space-y-3">
              <Radio
                name="domaine"
                checked={typeDomaine === 'synelia'}
                onChange={() => setTypeDomaine('synelia')}
                label="Sous-domaine Synelia (recommandé)"
                description="Disponible immédiatement, certificat émis automatiquement, aucune action DNS de votre part."
              />
              {typeDomaine === 'synelia' && (
                <div className="ml-7 rounded-[6px] bg-g-050 px-3 py-2 font-mono text-[12.5px] text-ink">
                  {sousDomaine}
                </div>
              )}
              <Radio
                name="domaine"
                checked={typeDomaine === 'client'}
                onChange={() => setTypeDomaine('client')}
                label="Mon propre domaine"
                description="Nécessite la création d’un enregistrement DNS. Nous vous guidons et vérifions la propagation."
              />
              {typeDomaine === 'client' && (
                <div className="ml-7 space-y-3">
                  <Field label="Domaine souhaité">
                    <Input
                      value={domaineClient}
                      onChange={(e) => {
                        setDomaineClient(e.target.value)
                        setDnsVerifie(false)
                      }}
                      placeholder="drive.dba.africa"
                    />
                  </Field>
                  <div className="rounded-[8px] border border-g-300 bg-g-050 p-3">
                    <MicroLabel className="mb-2">Enregistrement à créer</MicroLabel>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max border-collapse font-mono text-[11.5px]">
                        <thead>
                          <tr className="text-g-500">
                            <th className="pr-4 text-left font-semibold">Type</th>
                            <th className="pr-4 text-left font-semibold">Nom</th>
                            <th className="pr-4 text-left font-semibold">Valeur</th>
                            <th className="text-left font-semibold">TTL</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-ink">
                            <td className="pr-4">CNAME</td>
                            <td className="pr-4">{domaineClient.split('.')[0]}</td>
                            <td className="pr-4">{sousDomaine}.</td>
                            <td>3600</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setDnsVerifie(true)}
                        iconBefore={<Globe size={13} />}
                      >
                        Vérifier la propagation
                      </Button>
                      {dnsVerifie ? (
                        <Badge tone="ok" dot>
                          Enregistrement détecté · certificat en cours d’émission
                        </Badge>
                      ) : (
                        <span className="text-[11.5px] text-g-500">
                          La vérification est nécessaire pour continuer.
                        </span>
                      )}
                    </div>
                  </div>
                  {ZONES_DNS.some((z) => domaineClient.endsWith(z.domaine)) && (
                    <Callout ton="ok" titre="Zone hébergée chez Synelia">
                      Ce domaine est déjà géré dans votre portefeuille DNS. Nous pouvons créer
                      l’enregistrement pour vous en un clic.
                    </Callout>
                  )}
                </div>
              )}
            </div>
          </Card>
          <Callout ton="info" titre="Certificat TLS">
            Le certificat est émis via Let’s Encrypt et renouvelé automatiquement trente jours avant
            son expiration. Vous pouvez aussi téléverser votre propre certificat depuis l’onglet
            Domaine du service, après le provisioning.
          </Callout>
        </div>
      )}

      {/* ─── Étape 5 : SSO & sauvegarde ───────────────────────────────── */}
      {etape === 5 && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre={
                <span className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-m-600" />
                  Fédération d’identité
                </span>
              }
              sousTitre="Vos utilisateurs se connectent avec leur identité d’entreprise. Aucun mot de passe spécifique à ce service."
            />
            <div className="space-y-3">
              <Switch
                checked={ssoActif}
                onChange={setSsoActif}
                label="Activer le SSO Keycloak"
                description={`Un client OIDC « ${slugify(service.nom)}-${ORG_COURANTE.domaine?.split('.')[0]} » sera déclaré dans le realm de votre organisation.`}
              />
              <Switch
                checked={jit}
                onChange={setJit}
                label="Provisioning à la première connexion (JIT)"
                description="Le compte applicatif est créé automatiquement au premier accès, avec les rôles issus du mapping ci-dessous."
              />
            </div>

            {ssoActif && (
              <div className="mt-3.5 border-t border-g-100 pt-3.5">
                <MicroLabel className="mb-2">
                  Mapping des groupes d’annuaire vers les rôles applicatifs
                </MicroLabel>
                <div className="space-y-2">
                  {[
                    { groupe: 'direction', role: 'admin' },
                    { groupe: 'tous', role: 'user' },
                    { groupe: 'invites', role: 'guest' },
                  ].map((m) => (
                    <div key={m.groupe} className="flex items-center gap-2">
                      <Input defaultValue={m.groupe} className="flex-1" aria-label="Groupe" />
                      <span className="shrink-0 text-g-500">→</span>
                      <Select defaultValue={m.role} className="flex-1" aria-label="Rôle applicatif">
                        <option value="admin">admin</option>
                        <option value="user">user</option>
                        <option value="guest">guest</option>
                      </Select>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11.5px] text-g-500">
                  Vous pourrez tester la connexion depuis l’onglet SSO du service dès la fin du
                  provisioning.
                </p>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              titre="Plan de sauvegarde"
              sousTitre={`Politique par défaut du service : ${service.backupPolicyDefault}.`}
            />
            <Field label="Plan appliqué">
              <Select value={planSauvegarde} onChange={(e) => setPlanSauvegarde(e.target.value)}>
                {BACKUP_PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} · rétention {p.retentionJours} j{p.immutable ? ' · immuable' : ''}
                  </option>
                ))}
                <option value="aucun">Aucun plan (déconseillé)</option>
              </Select>
            </Field>
            <div className="mt-3 rounded-[6px] bg-g-050 px-3 py-2.5">
              <MicroLabel className="mb-1.5">Granularité de restauration disponible</MicroLabel>
              <div className="flex flex-wrap gap-1.5">
                {service.granulariteRestauration.map((g) => (
                  <Badge key={g} tone="neutral" size="sm">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ─── Étape 6 : récapitulatif ──────────────────────────────────── */}
      {etape === 6 && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Ce qui va être créé"
              sousTitre="Sept tâches d’orchestration seront exécutées séquentiellement."
            />
            <KeyValueList
              colonnes={2}
              items={[
                { cle: 'Service', valeur: `${service.nom} · ${service.solutionOSS}` },
                { cle: 'Palier', valeur: `${palier.nom} — ${palier.specs}` },
                { cle: 'Mode', valeur: mode === 'dedie' ? 'Dédié (instance isolée)' : 'Mutualisé' },
                { cle: 'Site', valeur: SITE_LABEL[site] },
                {
                  cle: 'Sièges',
                  valeur: parSiege
                    ? `${sieges} souscrits · ${attribues.length} attribués immédiatement`
                    : 'Non applicable à ce palier',
                },
                { cle: 'Domaine', valeur: domaineFinal },
                {
                  cle: 'SSO',
                  valeur: ssoActif
                    ? `Activé · client OIDC · JIT ${jit ? 'activé' : 'désactivé'}`
                    : 'Désactivé',
                },
                {
                  cle: 'Sauvegarde',
                  valeur:
                    BACKUP_PLANS.find((p) => p.id === planSauvegarde)?.nom ?? 'Aucun plan appliqué',
                },
                { cle: 'Périodicité', valeur: periodicite === 'annuelle' ? 'Annuelle (−15 %)' : 'Mensuelle' },
                { cle: 'SLA', valeur: service.sla },
              ]}
            />
          </Card>

          <CostPreview lignes={lignesCout} periodicite={periodicite} />

          <Card>
            <Checkbox
              checked={conditions}
              onChange={(e) => setConditions(e.target.checked)}
              label={
                <>
                  J’accepte les conditions générales de vente et l’annexe SLA de ce service.
                </>
              }
              description={`Souscription ${periodicite === 'annuelle' ? 'annuelle avec engagement de douze mois' : 'mensuelle sans engagement, résiliable en fin de mois'}. Montants hors taxes, TVA 18 % appliquée à la facturation. Prorata du mois en cours ajouté à votre prochaine facture.`}
            />
          </Card>

          <Callout ton="info" titre="Après validation">
            Une page de suivi affichera les sept tâches de l’orchestrateur. Vous pourrez quitter
            cette page : le centre de tâches conserve le suivi et une notification signalera la fin
            du provisioning.
          </Callout>
        </div>
      )}
    </WizardShell>
  )
}

function Petit({ cle, valeur }: { cle: string; valeur: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="shrink-0 text-[11.5px] text-g-500">{cle}</dt>
      <dd className="truncate text-right text-[11.5px] font-semibold text-ink">{valeur}</dd>
    </div>
  )
}
