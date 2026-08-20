'use client'

import { useState } from 'react'
import {
  Check,
  Download,
  ExternalLink,
  FileDown,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { cn, seededSeries } from '@/lib/utils'
import { dateCourte, dateHeure, goHumain, money, num, pct, relatif } from '@/lib/format'
import { SITE_LABEL } from '@/lib/types'
import {
  BACKUP_PLANS,
  EVENEMENTS_SUPERVISION,
  RESTORE_POINTS,
  SERVICES_MANAGES,
  USERS,
  serviceCatalogue,
  siegesDuService,
  userById,
} from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink, IconButton } from '@/components/ui/button'
import { Checkbox, Field, Input, Select, Slider, Switch } from '@/components/ui/field'
import { Avatar, CopyField, SolutionLogo, Tabs, GatedAction } from '@/components/ui/display'
import { ConfirmDialog, Drawer } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { HealthBadge, QuotaBar, StatTile } from '@/components/composition/metrics'
import { DataTable, type Colonne } from '@/components/composition/data-table'
import { EmptyState } from '@/components/composition/states'
import { GrilleSparkCharts, EventList, LiensSortie } from '@/components/business/observabilite'
import { SlaGauge } from '@/components/business/infra'
import { CostPreview } from '@/components/composition/flow'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'dimensionnement', label: 'Dimensionnement' },
  { id: 'sieges', label: 'Sièges' },
  { id: 'domaine', label: 'Domaine' },
  { id: 'sso', label: 'SSO' },
  { id: 'parametres', label: 'Paramètres spécifiques' },
  { id: 'sauvegarde', label: 'Sauvegarde' },
  { id: 'supervision', label: 'Supervision' },
  { id: 'versions', label: 'Versions' },
  { id: 'reversibilite', label: 'Réversibilité' },
]

export function AdministrationService({ id }: { id: string }) {
  const service = SERVICES_MANAGES.find((s) => s.id === id)!
  const catalogue = serviceCatalogue(service.catalogSlug)!
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('dimensionnement')

  const palier = catalogue.paliers.find((p) => p.nom === service.palier) ?? catalogue.paliers[0]
  const pretAOuvrir = service.statut !== 'provisioning' && service.statut !== 'erreur'

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Mes services', href: '/app/services' },
          { label: service.nom },
        ]}
        titre={
          <span className="flex items-center gap-3">
            <SolutionLogo initiales={catalogue.logoInitiales} teinte={catalogue.logoTeinte} size="lg" />
            {service.nom}
          </span>
        }
        sousTitre={`${catalogue.solutionOSS} · ${service.mode === 'dedie' ? 'instance dédiée' : 'compte sur instance mutualisée'} · ${SITE_LABEL[service.site]}`}
        meta={
          <>
            <HealthBadge etat={service.statut} />
            <Badge tone="neutral">v{service.version}</Badge>
            <Badge tone="violet">Palier {service.palier}</Badge>
            <span className="font-mono text-[12px] text-g-500">{service.domaine}</span>
          </>
        }
        actions={
          <>
            {pretAOuvrir && (
              <ButtonLink
                href={service.urlNative}
                external
                variant="accent"
                iconAfter={<ExternalLink size={13} />}
              >
                Ouvrir
              </ButtonLink>
            )}
            <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
              <Button
                variant="secondary"
                iconBefore={<RefreshCw size={13} />}
                onClick={() =>
                  pousser({
                    ton: 'info',
                    titre: 'Vérification de l’instance lancée',
                    detail: 'Les sondes de supervision sont interrogées, résultat dans quelques secondes.',
                  })
                }
              >
                Vérifier l’instance
              </Button>
            </GatedAction>
          </>
        }
      />

      {service.statut === 'provisioning' && (
        <Callout ton="info" titre="Instance en cours de provisioning">
          Les écrans d’administration deviendront actifs à la fin du provisioning. Suivez
          l’avancement dans le centre de tâches — l’étape en cours est la configuration du domaine
          et du TLS.
        </Callout>
      )}
      {service.statut === 'maj_disponible' && (
        <Callout
          ton="warn"
          titre={`Version ${service.versionDisponible} disponible`}
          action={
            <Button size="sm" variant="secondary" onClick={() => setOnglet('versions')}>
              Voir le changelog
            </Button>
          }
        >
          Votre instance tourne en {service.version}. La version {service.versionDisponible} est
          qualifiée et déployable sur une fenêtre de maintenance que vous choisissez.
        </Callout>
      )}
      {service.statut === 'degrade' && (
        <Callout ton="err" titre="Service dégradé">
          La disponibilité constatée sur 30 jours ({pct(service.uptime30j, 2)}) est inférieure à
          l’engagement du service. Un crédit SLA sera calculé automatiquement et appliqué sur votre
          prochaine facture, sans réclamation de votre part.
        </Callout>
      )}

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'dimensionnement' && (
        <Dimensionnement service={service} catalogue={catalogue} palier={palier} />
      )}
      {onglet === 'sieges' && <OngletSieges service={service} />}
      {onglet === 'domaine' && <OngletDomaine service={service} />}
      {onglet === 'sso' && <OngletSso service={service} catalogue={catalogue} />}
      {onglet === 'parametres' && <OngletParametres service={service} catalogue={catalogue} />}
      {onglet === 'sauvegarde' && <OngletSauvegarde service={service} catalogue={catalogue} />}
      {onglet === 'supervision' && <OngletSupervision service={service} catalogue={catalogue} />}
      {onglet === 'versions' && <OngletVersions service={service} catalogue={catalogue} />}
      {onglet === 'reversibilite' && <OngletReversibilite service={service} catalogue={catalogue} />}
    </div>
  )
}

type Service = (typeof SERVICES_MANAGES)[number]
type Catalogue = NonNullable<ReturnType<typeof serviceCatalogue>>

// ─── 2 · Dimensionnement ──────────────────────────────────────────────

function Dimensionnement({
  service,
  catalogue,
  palier,
}: {
  service: Service
  catalogue: Catalogue
  palier: Catalogue['paliers'][number]
}) {
  const { autorise, refus } = useApp()
  const [nouveauPalier, setNouveauPalier] = useState(palier.code)
  const [sieges, setSieges] = useState(service.siegesSouscrits)
  const cible = catalogue.paliers.find((p) => p.code === nouveauPalier)!
  const modifie = nouveauPalier !== palier.code || sieges !== service.siegesSouscrits
  const parSiege = cible.prixSiege !== undefined
  const majoration = service.mode === 'dedie' && catalogue.modes.includes('mutualise') ? 1.2 : 1
  const nouveauCout = Math.round(
    (parSiege ? cible.prixSiege! * sieges : cible.prixMois!) * majoration,
  )

  const stockageUtilise = Math.round(service.siegesUtilises * 128)
  const stockageTotal = service.siegesSouscrits * 500

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-4">
        <Card>
          <CardHeader
            titre="Palier actuel"
            sousTitre={`${palier.nom} — ${palier.specs}`}
            actions={<Badge tone="violet">{money(service.coutMensuel)}/mois</Badge>}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {catalogue.paliers.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => setNouveauPalier(p.code)}
                className={cn(
                  'rounded-[8px] border-2 p-3 text-left transition-colors',
                  nouveauPalier === p.code ? 'border-p-700 bg-p-050' : 'border-g-300 hover:border-p-400',
                  p.code === palier.code && nouveauPalier !== p.code && 'border-g-500',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="type-h3">{p.nom}</span>
                  {p.code === palier.code && (
                    <Badge tone="neutral" size="sm">
                      Actuel
                    </Badge>
                  )}
                </span>
                <span className="mt-1 block text-[11.5px] text-g-500">{p.specs}</span>
                <span className="tnum mt-2 block text-[14px] font-bold text-p-700">
                  {money(p.prixSiege ?? p.prixMois ?? 0)}
                  <span className="text-[10px] font-semibold text-g-500">
                    {p.prixSiege !== undefined ? '/siège' : '/mois'}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {parSiege && (
            <div className="mt-4 border-t border-g-100 pt-4">
              <Slider
                label="Sièges souscrits"
                value={sieges}
                onChange={setSieges}
                min={service.siegesUtilises}
                max={200}
                step={5}
                unite="sièges"
              />
              <p className="mt-1.5 text-[11.5px] text-g-500">
                Le minimum est fixé à {service.siegesUtilises} : le nombre de sièges actuellement
                attribués. Retirez d’abord des sièges dans l’onglet Sièges pour descendre en dessous.
              </p>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            titre="Consommation"
            sousTitre="Mesurée par nos sondes sur l’instance, actualisée toutes les cinq minutes."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              libelle="Stockage utilisé"
              valeur={goHumain(stockageUtilise).split(' ')[0]}
              unite={goHumain(stockageUtilise).split(' ')[1]}
              detail={`sur ${goHumain(stockageTotal)} alloués`}
              serie={seededSeries(`${service.id}-sto`, 24, 55, 62)}
            />
            <StatTile
              libelle="Sièges attribués"
              valeur={`${service.siegesUtilises}/${service.siegesSouscrits}`}
              ton="ok"
              serie={seededSeries(`${service.id}-seat`, 24, 16, 18)}
            />
            <StatTile
              libelle="Utilisateurs actifs 7 j"
              valeur={Math.max(1, service.siegesUtilises - 2)}
              detail="Au moins une connexion sur la période"
              serie={seededSeries(`${service.id}-act`, 24, 12, 17)}
            />
            <StatTile
              libelle="Requêtes / minute"
              valeur={num(Math.round(service.siegesUtilises * 14.2))}
              detail="Moyenne sur les 24 dernières heures"
              serie={seededSeries(`${service.id}-req`, 24, 180, 320)}
            />
          </div>
          <div className="mt-4">
            <QuotaBar
              libelle="Stockage alloué"
              utilise={stockageUtilise}
              total={stockageTotal}
              unite="Go"
              formateur={(v) => num(v)}
            />
          </div>
        </Card>

        <Callout ton="info" titre="Extension à chaud">
          Le changement de palier et l’ajout de sièges s’appliquent sans interruption de service.
          Une réduction de palier peut nécessiter une fenêtre de maintenance si le stockage utilisé
          dépasse la capacité du palier cible — nous vous le signalerons avant validation.
        </Callout>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        {modifie ? (
          <>
            <CostPreview
              lignes={[
                parSiege
                  ? {
                      libelle: `${service.nom} · palier ${cible.nom}`,
                      detail: `${money(cible.prixSiege!)} par siège`,
                      montant: cible.prixSiege! * sieges,
                      quantite: sieges,
                    }
                  : {
                      libelle: `${service.nom} · palier ${cible.nom}`,
                      detail: cible.specs,
                      montant: cible.prixMois!,
                    },
                ...(majoration > 1
                  ? [
                      {
                        libelle: 'Majoration mode dédié (+20 %)',
                        montant: Math.round((nouveauCout / majoration) * 0.2),
                      },
                    ]
                  : []),
              ]}
            />
            <div className="rounded-[8px] border border-g-300 bg-white p-3.5">
              <MicroLabel>Écart mensuel</MicroLabel>
              <p
                className={cn(
                  'tnum mt-1 text-[18px] font-bold [font-family:var(--font-display)]',
                  nouveauCout > service.coutMensuel ? 'text-warn' : 'text-ok',
                )}
              >
                {nouveauCout > service.coutMensuel ? '+' : '−'}{' '}
                {money(Math.abs(nouveauCout - service.coutMensuel))}
              </p>
              <p className="mt-1 text-[11.5px] text-g-500">
                Par rapport à votre facturation actuelle de {money(service.coutMensuel)}/mois.
              </p>
            </div>
            <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
              <Button fullWidth size="lg">
                Appliquer le nouveau dimensionnement
              </Button>
            </GatedAction>
          </>
        ) : (
          <Card>
            <MicroLabel>Dimensionnement actuel</MicroLabel>
            <dl className="mt-2.5 space-y-2">
              <Ligne cle="Palier" valeur={palier.nom} />
              <Ligne cle="Sièges" valeur={`${service.siegesSouscrits} souscrits`} />
              <Ligne cle="Mode" valeur={service.mode === 'dedie' ? 'Dédié' : 'Mutualisé'} />
              <Ligne cle="Coût mensuel" valeur={money(service.coutMensuel)} />
              <Ligne cle="Souscrit le" valeur={dateCourte(service.createdAt)} />
            </dl>
            <p className="mt-3 border-t border-g-100 pt-3 text-[11.5px] text-g-500">
              Modifiez le palier ou le nombre de sièges à gauche pour voir l’impact tarifaire.
            </p>
          </Card>
        )}
      </aside>
    </div>
  )
}

// ─── 5 · Sièges ───────────────────────────────────────────────────────

function OngletSieges({ service }: { service: Service }) {
  const { autorise, refus, pousser } = useApp()
  const [drawer, setDrawer] = useState(false)
  const sieges = siegesDuService(service.id)
  const membresSansSiege = USERS.filter(
    (u) => u.orgId === service.orgId && !sieges.some((s) => s.userId === u.id),
  )
  const coutParSiege = Math.round(service.coutMensuel / Math.max(1, service.siegesSouscrits))

  type Ligne = {
    id: string
    nom: string
    email: string
    fonction: string
    statut: string
    quotaUtilise?: number
    quotaTotal?: number
    derniereActivite?: string
  }

  const lignes: Ligne[] = sieges.map((s) => {
    const u = userById(s.userId)
    return {
      id: s.id,
      nom: u?.nom ?? s.userId,
      email: u?.email ?? '—',
      fonction: u?.fonction ?? '—',
      statut: s.statut,
      quotaUtilise: s.quotaUtilise,
      quotaTotal: s.quotaTotal,
      derniereActivite: s.derniereActivite,
    }
  })

  const colonnes: Array<Colonne<Ligne>> = [
    {
      id: 'membre',
      entete: 'Membre',
      cle: (l) => l.nom,
      rendu: (l) => (
        <span className="flex items-center gap-2.5">
          <Avatar nom={l.nom} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-ink">{l.nom}</span>
            <span className="block truncate text-[11px] text-g-500">{l.email}</span>
          </span>
        </span>
      ),
    },
    { id: 'fonction', entete: 'Fonction', cle: (l) => l.fonction, rendu: (l) => l.fonction, masquable: true },
    {
      id: 'statut',
      entete: 'Siège',
      cle: (l) => l.statut,
      rendu: (l) => (
        <Badge tone={l.statut === 'actif' ? 'ok' : 'neutral'} dot size="sm">
          {l.statut === 'actif' ? 'Actif' : 'Suspendu'}
        </Badge>
      ),
    },
    {
      id: 'quota',
      entete: 'Quota consommé',
      cle: (l) => l.quotaUtilise ?? 0,
      rendu: (l) =>
        l.quotaTotal ? (
          <span className="block w-40">
            <QuotaBar
              utilise={l.quotaUtilise ?? 0}
              total={l.quotaTotal}
              unite="Go"
              compact
              seuil={85}
              formateur={(v) => num(v)}
            />
          </span>
        ) : (
          <span className="text-g-500">Non applicable</span>
        ),
    },
    {
      id: 'activite',
      entete: 'Dernière activité',
      cle: (l) => l.derniereActivite ?? '',
      rendu: (l) => (l.derniereActivite ? relatif(l.derniereActivite) : '—'),
    },
    {
      id: 'cout',
      entete: 'Coût',
      aligne: 'right',
      rendu: () => money(coutParSiege),
    },
    {
      id: 'actions',
      entete: '',
      aligne: 'right',
      rendu: (l) => (
        <GatedAction autorise={autorise('seat.assign')} message={refus('seat.assign')}>
          <IconButton
            label="Retirer le siège"
            size="sm"
            onClick={() =>
              pousser({
                ton: 'warn',
                titre: `Siège retiré à ${l.nom}`,
                detail: 'Le compte applicatif est désactivé, ses données sont conservées 30 jours.',
              })
            }
          >
            <X size={13} />
          </IconButton>
        </GatedAction>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile libelle="Sièges souscrits" valeur={service.siegesSouscrits} />
        <StatTile libelle="Sièges attribués" valeur={service.siegesUtilises} ton="ok" />
        <StatTile
          libelle="Disponibles"
          valeur={service.siegesSouscrits - service.siegesUtilises}
          ton={service.siegesSouscrits - service.siegesUtilises <= 2 ? 'warn' : 'neutral'}
        />
        <StatTile libelle="Coût par siège" valeur={money(coutParSiege)} />
      </div>

      <Card>
        <CardHeader
          titre="Qui consomme quoi"
          sousTitre="Attribution, consommation individuelle et coût par siège."
          actions={
            <GatedAction autorise={autorise('seat.assign')} message={refus('seat.assign')}>
              <Button size="sm" iconBefore={<Plus size={13} />} onClick={() => setDrawer(true)}>
                Attribuer des sièges
              </Button>
            </GatedAction>
          }
        />
        <DataTable
          lignes={lignes}
          colonnes={colonnes}
          parPage={10}
          placeholderRecherche="Rechercher un membre…"
          vide={{
            titre: 'Aucun siège attribué',
            phrase:
              'Attribuez des sièges à vos collaborateurs pour qu’ils puissent accéder au service. Un siège non attribué reste facturé mais inutilisé.',
          }}
        />
      </Card>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Attribuer des sièges"
        description={`${service.siegesSouscrits - service.siegesUtilises} siège(s) disponible(s) sur cette instance.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawer(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                setDrawer(false)
                pousser({ ton: 'ok', titre: 'Sièges attribués', detail: 'Les comptes applicatifs seront créés à la première connexion.' })
              }}
            >
              Attribuer
            </Button>
          </>
        }
      >
        {membresSansSiege.length === 0 ? (
          <EmptyState
            titre="Tous vos membres ont un siège"
            phrase="Invitez de nouveaux membres depuis Utilisateurs & rôles pour leur attribuer un siège sur ce service."
            action={{ libelle: 'Inviter un membre', href: '/app/membres' }}
          />
        ) : (
          <div className="space-y-2">
            {membresSansSiege.map((u) => (
              <label
                key={u.id}
                className="flex cursor-pointer items-center gap-3 rounded-[6px] border border-g-300 px-3 py-2 hover:bg-g-050"
              >
                <input type="checkbox" className="h-3.5 w-3.5 accent-[#4B2882]" />
                <Avatar nom={u.nom} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-ink">{u.nom}</span>
                  <span className="block truncate text-[11px] text-g-500">{u.email}</span>
                </span>
                {u.statut === 'invite' && (
                  <Badge tone="warn" size="sm">
                    Invitation en attente
                  </Badge>
                )}
              </label>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  )
}

// ─── 3 · Domaine ──────────────────────────────────────────────────────

function OngletDomaine({ service }: { service: Service }) {
  const { autorise, refus } = useApp()
  const [verifie, setVerifie] = useState(true)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader titre="Domaine actuel" />
        <KeyValueList
          colonnes={1}
          items={[
            {
              cle: 'Domaine',
              valeur: <span className="font-mono text-[13px]">{service.domaine}</span>,
            },
            {
              cle: 'URL native',
              valeur: (
                <a
                  href={service.urlNative}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[12.5px] font-semibold text-m-600 hover:underline"
                >
                  {service.urlNative}
                  <ExternalLink size={11} />
                </a>
              ),
            },
            {
              cle: 'Certificat',
              valeur: service.certificat ? (
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone="ok" dot size="sm">
                    Valide
                  </Badge>
                  <span className="text-[12.5px]">
                    Expire le {dateCourte(service.certificat.expire)}
                  </span>
                  {service.certificat.auto && (
                    <Badge tone="neutral" size="sm">
                      Renouvellement automatique
                    </Badge>
                  )}
                </span>
              ) : (
                <Badge tone="warn" size="sm">
                  En cours d’émission
                </Badge>
              ),
            },
            {
              cle: 'Autorité de certification',
              valeur: 'Let’s Encrypt (ACME HTTP-01)',
            },
          ]}
        />
        <div className="mt-3.5 flex flex-wrap gap-2 border-t border-g-100 pt-3.5">
          <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
            <Button size="sm" variant="secondary">
              Changer de domaine
            </Button>
          </GatedAction>
          <Button size="sm" variant="ghost">
            Téléverser mon certificat
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader
          titre="Enregistrements DNS requis"
          sousTitre="Vérification en direct de la propagation."
          actions={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setVerifie(true)}
              iconBefore={<RefreshCw size={13} />}
            >
              Vérifier
            </Button>
          }
        />
        <div className="overflow-x-auto rounded-[6px] border border-g-300">
          <table className="w-full min-w-max border-collapse font-mono text-[12px]">
            <thead>
              <tr className="border-b border-g-300 bg-g-050 text-g-500">
                <th className="px-3 py-2 text-left font-semibold">Type</th>
                <th className="px-3 py-2 text-left font-semibold">Nom</th>
                <th className="px-3 py-2 text-left font-semibold">Valeur attendue</th>
                <th className="px-3 py-2 text-left font-semibold">État</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 text-ink">CNAME</td>
                <td className="px-3 py-2 text-ink">{service.domaine.split('.')[0]}</td>
                <td className="px-3 py-2 text-ink">
                  {service.catalogSlug}-dba.synelia.cloud.
                </td>
                <td className="px-3 py-2">
                  {verifie ? (
                    <span className="inline-flex items-center gap-1 text-ok">
                      <Check size={12} /> Propagé
                    </span>
                  ) : (
                    <span className="text-warn">En attente</span>
                  )}
                </td>
              </tr>
              <tr className="border-t border-g-100">
                <td className="px-3 py-2 text-ink">CAA</td>
                <td className="px-3 py-2 text-ink">@</td>
                <td className="px-3 py-2 text-ink">0 issue &quot;letsencrypt.org&quot;</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1 text-ok">
                    <Check size={12} /> Propagé
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-g-500">
          La zone <span className="font-mono">dba.africa</span> est hébergée chez Synelia : nous
          pouvons créer et maintenir ces enregistrements pour vous depuis l’éditeur de zone.
        </p>
      </Card>
    </div>
  )
}

// ─── 4 · SSO ──────────────────────────────────────────────────────────

function OngletSso({ service, catalogue }: { service: Service; catalogue: Catalogue }) {
  const { autorise, refus, pousser } = useApp()
  const [resultat, setResultat] = useState<null | 'ok'>(null)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader
          titre="État de la fédération"
          actions={
            <Badge tone={service.sso.actif ? 'ok' : 'neutral'} dot>
              {service.sso.actif ? 'Active' : 'Inactive'}
            </Badge>
          }
        />
        <KeyValueList
          colonnes={1}
          items={[
            { cle: 'Protocole', valeur: 'OpenID Connect (Keycloak)' },
            {
              cle: 'Identifiant client',
              valeur: <span className="font-mono text-[12.5px]">{service.sso.clientId}</span>,
            },
            {
              cle: 'Issuer',
              valeur: (
                <span className="font-mono text-[12px]">
                  https://sso.synelia.cloud/realms/dba-africa
                </span>
              ),
            },
            { cle: 'Provisioning JIT', valeur: 'Activé — compte créé à la première connexion' },
            { cle: 'Synchronisation', valeur: 'Périodique, toutes les 15 minutes' },
          ]}
        />
        <div className="mt-3.5 border-t border-g-100 pt-3.5">
          <CopyField
            label="URL de redirection déclarée"
            value={`${service.urlNative}/apps/oidc_login/oidc`}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <GatedAction autorise={autorise('sso.configure')} message={refus('sso.configure')}>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setResultat('ok')
                pousser({
                  ton: 'ok',
                  titre: 'Connexion SSO réussie',
                  detail: 'Jeton reçu, revendications lues, rôle applicatif résolu.',
                })
              }}
            >
              Tester la connexion
            </Button>
          </GatedAction>
          {resultat === 'ok' && (
            <Badge tone="ok" dot>
              Test réussi
            </Badge>
          )}
        </div>
        {resultat === 'ok' && (
          <div className="mt-3 rounded-[6px] bg-ok-bg px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-g-700">
            <p>→ Redirection vers l’issuer : 200</p>
            <p>→ Échange du code d’autorisation : 200</p>
            <p>→ Revendications reçues : sub, email, name, groups[3]</p>
            <p>→ Groupe « direction » → rôle « {service.sso.groupMappings[0]?.roleApp ?? 'admin'} »</p>
            <p className="text-ok">→ Session applicative ouverte en 412 ms</p>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          titre="Mapping des groupes vers les rôles applicatifs"
          sousTitre={`Vos groupes d’annuaire déterminent les droits dans ${catalogue.solutionOSS}.`}
        />
        {service.sso.groupMappings.length === 0 ? (
          <EmptyState
            titre="Aucun mapping configuré"
            phrase="Sans mapping, les utilisateurs fédérés reçoivent le rôle applicatif par défaut de la solution. Déclarez au moins une correspondance pour vos administrateurs."
            action={{ libelle: 'Ajouter un mapping', href: '#' }}
          />
        ) : (
          <div className="space-y-2">
            {service.sso.groupMappings.map((m) => (
              <div key={m.groupe} className="flex items-center gap-2">
                <Input defaultValue={m.groupe} className="flex-1" aria-label="Groupe d’annuaire" />
                <span className="shrink-0 text-g-500">→</span>
                <Input defaultValue={m.roleApp} className="flex-1" aria-label="Rôle applicatif" />
                <GatedAction autorise={autorise('sso.configure')} message={refus('sso.configure')}>
                  <IconButton label="Supprimer le mapping" size="sm">
                    <Trash2 size={13} className="text-err" />
                  </IconButton>
                </GatedAction>
              </div>
            ))}
          </div>
        )}
        <GatedAction autorise={autorise('sso.configure')} message={refus('sso.configure')}>
          <Button size="sm" variant="ghost" className="mt-3" iconBefore={<Plus size={13} />}>
            Ajouter un mapping
          </Button>
        </GatedAction>
        <Callout ton="violet" className="mt-3.5" titre="Aucun mot de passe stocké ici">
          Le portail ne détient ni ne transmet de mot de passe. L’authentification, le MFA et la
          politique de mot de passe sont administrés dans Keycloak.
        </Callout>
      </Card>
    </div>
  )
}

// ─── Paramètres spécifiques ───────────────────────────────────────────

function OngletParametres({ service, catalogue }: { service: Service; catalogue: Catalogue }) {
  const { autorise, refus } = useApp()
  const entrees = Object.entries(service.parametres)

  if (entrees.length === 0) {
    return (
      <EmptyState
        titre="Paramètres non encore disponibles"
        phrase="Les politiques spécifiques à ce service deviendront modifiables à la fin du provisioning. Elles portent toujours sur des politiques, jamais sur du contenu."
        icone={<RefreshCw size={22} />}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Callout ton="violet" titre="Des politiques, jamais du contenu">
        C’est la seule partie qui varie d’un service à l’autre. Le portail règle ici les politiques
        applicables ; le contenu — fichiers, messages, documents, écritures comptables — se gère
        exclusivement dans {catalogue.solutionOSS}.
      </Callout>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader titre="Politiques appliquées" sousTitre="Valeurs actuellement en vigueur." />
          <div className="space-y-3">
            {entrees.map(([cle, valeur]) => (
              <ParametreLigne key={cle} cle={cle} valeur={valeur} />
            ))}
          </div>
          <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
            <Button size="sm" className="mt-4">
              Enregistrer les modifications
            </Button>
          </GatedAction>
        </Card>

        <Card>
          <CardHeader
            titre="Politiques disponibles pour ce service"
            sousTitre="Extrait du catalogue — ce que vous pouvez piloter depuis le portail."
          />
          <KeyValueList
            colonnes={1}
            items={catalogue.parametresSpecifiques.map((p) => ({
              cle: p.titre,
              valeur: p.description,
            }))}
          />
        </Card>
      </div>
    </div>
  )
}

const LIBELLES_PARAM: Record<string, string> = {
  partageExterne: 'Politique de partage externe',
  motDePasseObligatoire: 'Mot de passe obligatoire sur les liens',
  expirationLiensJours: 'Expiration par défaut des liens (jours)',
  quotaParUtilisateurGo: 'Quota par utilisateur (Go)',
  retentionCorbeilleJours: 'Rétention de la corbeille (jours)',
  domainesGeres: 'Domaines de messagerie gérés',
  alias: 'Alias déclarés',
  groupesDistribution: 'Groupes de distribution',
  quotaBoiteGo: 'Quota de boîte (Go)',
  antiSpam: 'Politique anti-spam',
  spf: 'SPF',
  dkim: 'DKIM',
  dmarc: 'DMARC',
  retentionArchivageMois: 'Rétention d’archivage (mois)',
  participantsMax: 'Participants maximum par salle',
  salleAttente: 'Salle d’attente obligatoire',
  destinationEnregistrements: 'Destination des enregistrements',
  retentionEnregistrementsJours: 'Rétention des enregistrements (jours)',
  modulesActives: 'Modules activés',
  jeuDemoActif: 'Jeu de données de démonstration',
  bacASable: 'Environnement bac à sable',
  planComptable: 'Plan comptable',
  mfaObligatoire: 'MFA obligatoire',
  complexiteMinimale: 'Complexité minimale',
  exportPersonnelInterdit: 'Export personnel interdit',
  journalisationAcces: 'Journalisation des accès',
}

function ParametreLigne({ cle, valeur }: { cle: string; valeur: unknown }) {
  const libelle = LIBELLES_PARAM[cle] ?? cle
  const [etat, setEtat] = useState(valeur)

  if (typeof etat === 'boolean') {
    return (
      <Switch
        checked={etat}
        onChange={setEtat}
        label={libelle}
        description={etat ? 'Politique active' : 'Politique désactivée'}
      />
    )
  }
  if (Array.isArray(etat)) {
    return (
      <div>
        <p className="mb-1.5 text-[12.5px] font-semibold text-g-700">{libelle}</p>
        <div className="flex flex-wrap gap-1.5">
          {etat.map((v) => (
            <Badge key={String(v)} tone="neutral" size="sm">
              {String(v)}
            </Badge>
          ))}
        </div>
      </div>
    )
  }
  if (typeof etat === 'number') {
    return (
      <Field label={libelle}>
        <Input
          type="number"
          value={etat}
          onChange={(e) => setEtat(Number(e.target.value))}
          className="max-w-40"
        />
      </Field>
    )
  }
  const texte = String(etat)
  const estStatutAuth = ['spf', 'dkim', 'dmarc'].includes(cle)
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-g-100 pb-2.5 last:border-0">
      <p className="text-[12.5px] font-semibold text-g-700">{libelle}</p>
      {estStatutAuth ? (
        <Badge tone={texte.includes('valide') || texte.startsWith('p=') ? 'ok' : 'warn'} dot size="sm">
          {texte}
        </Badge>
      ) : (
        <p className="text-[12.5px] text-ink">{texte}</p>
      )}
    </div>
  )
}

// ─── 6 · Sauvegarde ───────────────────────────────────────────────────

function OngletSauvegarde({ service, catalogue }: { service: Service; catalogue: Catalogue }) {
  const { autorise, refus } = useApp()
  const plan = BACKUP_PLANS.find((p) => p.id === service.backupPlanId)
  const points = RESTORE_POINTS.filter((p) => p.resourceId === service.id)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            titre="Plan appliqué"
            sousTitre={
              plan
                ? `${plan.nom} · prochaine exécution ${dateHeure(plan.prochaineExecution)}`
                : 'Aucun plan de sauvegarde appliqué'
            }
            actions={
              plan && plan.immutable ? (
                <Badge tone="ok">Immuable</Badge>
              ) : (
                <Badge tone="warn">Non immuable</Badge>
              )
            }
          />
          {plan ? (
            <KeyValueList
              colonnes={2}
              items={[
                { cle: 'Fréquence', valeur: plan.frequence },
                {
                  cle: 'Mode',
                  valeur:
                    plan.mode === 'complete'
                      ? 'Complète'
                      : 'Incrémentale avec complète hebdomadaire',
                },
                { cle: 'Rétention', valeur: `${plan.retentionJours} jours` },
                {
                  cle: 'Destinations',
                  valeur: plan.destinations
                    .map((d) =>
                      d.type === 'local'
                        ? 'Bucket local'
                        : d.type === 'autre_site'
                          ? 'Bucket sur l’autre site'
                          : 'Copie immuable',
                    )
                    .join(' · '),
                },
                {
                  cle: 'Chiffrement',
                  valeur:
                    plan.chiffrement.mode === 'byok'
                      ? `Vos propres clés (${plan.chiffrement.kmsRef})`
                      : 'Clés gérées par Synelia',
                },
                {
                  cle: 'Dernier résultat',
                  valeur: (
                    <Badge
                      tone={
                        plan.dernierResultat === 'ok'
                          ? 'ok'
                          : plan.dernierResultat === 'partiel'
                            ? 'warn'
                            : 'err'
                      }
                      dot
                      size="sm"
                    >
                      {plan.dernierResultat === 'ok'
                        ? 'Succès'
                        : plan.dernierResultat === 'partiel'
                          ? 'Partiel'
                          : 'Échec'}
                    </Badge>
                  ),
                },
              ]}
            />
          ) : (
            <EmptyState
              titre="Ce service n’est pas protégé"
              phrase="Sans plan de sauvegarde, aucune restauration n’est possible. La politique recommandée pour ce service est : quotidienne, rétention 30 jours, copie hors site."
              action={{ libelle: 'Appliquer le plan par défaut', href: '/app/sauvegarde' }}
            />
          )}
        </Card>

        <Card>
          <CardHeader titre="Dernier test de restauration" />
          {service.statut === 'provisioning' ? (
            <p className="text-[12.5px] text-g-500">
              Aucun test réalisé — l’instance est encore en provisioning.
            </p>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <Badge tone="ok" dot>
                  Réussi
                </Badge>
                <span className="text-[12.5px] text-g-500">le 5 août 2026</span>
              </div>
              <dl className="mt-3 space-y-2">
                <Ligne cle="Périmètre testé" valeur="Compte utilisateur complet" />
                <Ligne cle="Durée de restauration" valeur="12 min" />
                <Ligne cle="Intégrité vérifiée" valeur="Oui, somme de contrôle" />
                <Ligne cle="Prochain test planifié" valeur="5 septembre 2026" />
              </dl>
            </>
          )}
          <p className="mt-3 border-t border-g-100 pt-3 text-[11.5px] leading-relaxed text-g-500">
            Une sauvegarde qui n’a jamais été restaurée est une hypothèse. Nous restaurons un
            échantillon chaque mois et datons le résultat.
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader
          titre="Points de restauration"
          sousTitre="Restauration granulaire adaptée à ce service."
          actions={
            <GatedAction autorise={autorise('backup.restore')} message={refus('backup.restore')}>
              <ButtonLink href="/app/sauvegarde" size="sm">
                Lancer une restauration
              </ButtonLink>
            </GatedAction>
          }
        />
        {points.length === 0 ? (
          <EmptyState
            titre="Aucun point de restauration"
            phrase="Les points apparaîtront après la première exécution réussie du plan de sauvegarde."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr className="border-b border-g-300 bg-g-050">
                  {['Date', 'Type', 'Taille', 'Destination', 'Immuable jusqu’au', 'Vérifié', ''].map(
                    (h) => (
                      <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.id} className="border-b border-g-100 last:border-0">
                    <td className="px-3 py-2.5 text-[12.5px] text-ink">{dateHeure(p.date)}</td>
                    <td className="px-3 py-2.5 text-[12.5px] text-g-700">{p.type}</td>
                    <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">
                      {goHumain(p.tailleGo)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11.5px] text-g-700">
                      {p.destination}
                    </td>
                    <td className="px-3 py-2.5 text-[12.5px] text-g-700">
                      {p.immuableJusquau ? dateCourte(p.immuableJusquau) : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {p.verifie ? (
                        <Badge tone="ok" size="sm">
                          Oui
                        </Badge>
                      ) : (
                        <Badge tone="neutral" size="sm">
                          Non
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <GatedAction
                        autorise={autorise('backup.restore')}
                        message={refus('backup.restore')}
                      >
                        <Button size="sm" variant="ghost" iconBefore={<RotateCcw size={12} />}>
                          Restaurer
                        </Button>
                      </GatedAction>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3.5 border-t border-g-100 pt-3.5">
          <MicroLabel className="mb-2">Granularité disponible pour ce service</MicroLabel>
          <div className="flex flex-wrap gap-1.5">
            {catalogue.granulariteRestauration.map((g) => (
              <Badge key={g} tone="violet" size="sm">
                {g}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── 7 · Supervision ──────────────────────────────────────────────────

function OngletSupervision({ service, catalogue }: { service: Service; catalogue: Catalogue }) {
  const engagement = Number(catalogue.sla.match(/\d+,\d+/)?.[0].replace(',', '.') ?? 99.9)
  const evenements = EVENEMENTS_SUPERVISION.filter(
    (e) => e.ressource.includes(service.nom) || e.ressource.includes(service.domaine),
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          libelle="Disponibilité 30 jours"
          valeur={service.uptime30j > 0 ? pct(service.uptime30j, 2) : '—'}
          ton={service.uptime30j >= engagement ? 'ok' : 'warn'}
          detail={`Engagement contractuel : ${pct(engagement, 2)}`}
          serie={seededSeries(`${service.id}-up`, 24, 99.7, 100)}
        />
        <StatTile
          libelle="Incidents ouverts"
          valeur={service.statut === 'degrade' ? 1 : 0}
          ton={service.statut === 'degrade' ? 'err' : 'ok'}
          detail={service.statut === 'degrade' ? 'Temps de réponse dégradés' : 'Aucun incident'}
        />
        <StatTile
          libelle="Dernier incident"
          valeur={service.statut === 'degrade' ? 'En cours' : 'Aucun'}
          detail={service.statut === 'degrade' ? 'Depuis le 19 août, 08:04' : 'Sur les 30 derniers jours'}
        />
      </div>

      <GrilleSparkCharts
        seed={`svc-${service.id}`}
        metriques={[
          { titre: 'Temps de réponse', unite: 'ms', min: 120, max: service.statut === 'degrade' ? 8200 : 420, couleur: 'var(--color-p-600)', seuil: 1000 },
          { titre: 'Requêtes par minute', unite: 'req/min', min: 80, max: 340, couleur: 'var(--color-m-600)' },
          { titre: 'Taux d’erreur', unite: '%', min: 0, max: service.statut === 'degrade' ? 3.4 : 0.4, seuil: 1 },
          { titre: 'Utilisateurs connectés', unite: '', min: 2, max: service.siegesUtilises },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            titre="Événements de supervision"
            sousTitre="Huit dernières lignes, gravité décroissante."
          />
          {evenements.length > 0 ? (
            <EventList evenements={evenements} max={8} />
          ) : (
            <>
              <EventList evenements={EVENEMENTS_SUPERVISION.slice(0, 4)} max={4} lienSortie="" />
              <p className="mt-2 text-[11.5px] text-g-500">
                Aucun événement propre à cette instance sur la période. Les lignes ci-dessus
                concernent l’organisation.
              </p>
            </>
          )}
        </Card>

        <Card>
          <CardHeader
            titre="Disponibilité face au SLA"
            sousTitre="Mesurée par nos sondes, pas de vue partielle du service."
          />
          <SlaGauge
            composant={`${service.nom} · ${catalogue.solutionOSS}`}
            engagement={engagement}
            constate={service.uptime30j || engagement}
          />
          <p className="mt-3 text-[12.5px] leading-relaxed text-g-700">
            Les fenêtres de maintenance annoncées au moins sept jours à l’avance sont exclues du
            calcul. Un manquement génère automatiquement un crédit proportionnel à l’écart, appliqué
            sur la facture suivante sans réclamation de votre part.
          </p>
          <LiensSortie className="mt-3.5" />
        </Card>
      </div>
    </div>
  )
}

// ─── 8 · Versions ─────────────────────────────────────────────────────

const CHANGELOG: Record<string, Array<{ version: string; date: string; notes: string[] }>> = {
  'email-pro': [
    {
      version: '2026.02.1',
      date: '2026-03-04',
      notes: [
        'Correctif de sécurité sur le traitement des pièces jointes (CVE-2026-1184, gravité élevée)',
        'Amélioration des performances de recherche sur les boîtes de plus de 50 Go',
        'Prise en charge des règles de rétention par dossier',
      ],
    },
    {
      version: '2025.11.4',
      date: '2025-11-22',
      notes: [
        'Correctifs de stabilité sur la synchronisation ActiveSync',
        'Mise à jour du moteur anti-spam Rspamd',
      ],
    },
  ],
}

function OngletVersions({ service, catalogue }: { service: Service; catalogue: Catalogue }) {
  const { autorise, refus } = useApp()
  const [fenetre, setFenetre] = useState('2026-08-24T22:00')
  const journal = CHANGELOG[service.catalogSlug] ?? [
    {
      version: service.version,
      date: service.createdAt,
      notes: [
        'Version actuellement déployée sur votre instance.',
        'Le changelog détaillé de cette version est publié par l’éditeur de la solution.',
      ],
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-4">
        <Card>
          <CardHeader
            titre="Versions"
            sousTitre={`${catalogue.solutionOSS} · ${catalogue.versionsSupportees.length} versions maintenues en parallèle.`}
          />
          <div className="space-y-2">
            {catalogue.versionsSupportees.map((v) => {
              const courante = v === service.version
              const cible = v === service.versionDisponible
              return (
                <div
                  key={v}
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-3 rounded-[6px] border px-3 py-2.5',
                    courante ? 'border-p-700 bg-p-050' : 'border-g-300',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold text-ink">{v}</span>
                    {courante && <Badge tone="violet" size="sm">Déployée</Badge>}
                    {cible && <Badge tone="accent" size="sm">Disponible</Badge>}
                  </span>
                  {!courante && (
                    <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
                      <Button size="sm" variant="secondary">
                        Planifier la mise à jour
                      </Button>
                    </GatedAction>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <CardHeader titre="Changelog" sousTitre="Publié par l’éditeur, qualifié par Synelia." />
          <div className="space-y-4">
            {journal.map((j) => (
              <div key={j.version} className="border-l-2 border-p-300 pl-3.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-[13px] font-bold text-ink">{j.version}</span>
                  <span className="text-[11.5px] text-g-500">{dateCourte(j.date)}</span>
                  {j.version === service.version && (
                    <Badge tone="violet" size="sm">
                      Votre version
                    </Badge>
                  )}
                </div>
                <ul className="mt-1.5 space-y-1">
                  {j.notes.map((n) => (
                    <li key={n} className="text-[12.5px] leading-relaxed text-g-700">
                      · {n}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader titre="Historique des mises à jour" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr className="border-b border-g-300 bg-g-050">
                  {['Date', 'De', 'Vers', 'Durée', 'Résultat', 'Snapshot'].map((h) => (
                    <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { date: '2026-06-14', de: '28.0.11', vers: '29.0.4', duree: '18 min', ok: true },
                  { date: '2026-02-28', de: '28.0.4', vers: '28.0.11', duree: '11 min', ok: true },
                  { date: '2025-11-22', de: '27.1.9', vers: '28.0.4', duree: '42 min', ok: true },
                ].map((h) => (
                  <tr key={h.date} className="border-b border-g-100 last:border-0">
                    <td className="px-3 py-2.5 text-[12.5px] text-ink">{dateCourte(h.date)}</td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-g-700">{h.de}</td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-g-700">{h.vers}</td>
                    <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">{h.duree}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={h.ok ? 'ok' : 'err'} size="sm">
                        {h.ok ? 'Réussie' : 'Échouée'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-g-500">Purgé après 7 jours</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card>
          <CardHeader titre="Fenêtre de maintenance" />
          <Field label="Créneau souhaité" hint="Heure GMT">
            <Input type="datetime-local" value={fenetre} onChange={(e) => setFenetre(e.target.value)} />
          </Field>
          <div className="mt-3 space-y-2">
            <Checkbox
              defaultChecked
              label="Snapshot avant mise à jour"
              description="Permet un retour arrière immédiat pendant sept jours."
            />
            <Checkbox
              defaultChecked
              label="Me notifier au démarrage et à la fin"
              description="Par e-mail et dans le centre de tâches."
            />
          </div>
          <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
            <Button fullWidth className="mt-3.5" disabled={!service.versionDisponible}>
              {service.versionDisponible
                ? `Planifier la montée en ${service.versionDisponible}`
                : 'Aucune mise à jour disponible'}
            </Button>
          </GatedAction>
        </Card>

        <Card>
          <MicroLabel>Retour arrière</MicroLabel>
          <p className="mt-2 text-[12.5px] leading-relaxed text-g-700">
            Un retour à la version précédente reste possible pendant sept jours après une mise à
            jour, à partir du snapshot pris automatiquement. Au-delà, une restauration depuis le plan
            de sauvegarde est nécessaire.
          </p>
          <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
            <Button variant="secondary" size="sm" className="mt-3" iconBefore={<RotateCcw size={13} />}>
              Revenir à la version précédente
            </Button>
          </GatedAction>
        </Card>
      </aside>
    </div>
  )
}

// ─── 9 · Réversibilité ────────────────────────────────────────────────

function OngletReversibilite({ service, catalogue }: { service: Service; catalogue: Catalogue }) {
  const { pousser } = useApp()
  const [confirme, setConfirme] = useState(false)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader
          titre="Format d’export"
          sousTitre="Standard, documenté et testé — pas un format maison."
        />
        <KeyValueList
          colonnes={1}
          items={[
            {
              cle: 'Formats disponibles',
              valeur: (
                <span className="flex flex-wrap gap-1.5">
                  {catalogue.reversibilite.formats.map((f) => (
                    <Badge key={f} tone="violet" size="sm">
                      {f}
                    </Badge>
                  ))}
                </span>
              ),
            },
            {
              cle: 'Délai estimé',
              valeur: `${catalogue.reversibilite.delaiJours} jours ouvrés à compter de la demande`,
            },
            {
              cle: 'Volume estimé',
              valeur: goHumain(service.siegesUtilises * 128),
            },
            {
              cle: 'Documentation de reprise',
              valeur: (
                <a
                  href={catalogue.reversibilite.docUrl}
                  className="inline-flex items-center gap-1 font-semibold text-p-700 hover:text-m-600"
                >
                  <FileDown size={12} />
                  Procédure de reprise ({catalogue.solutionOSS})
                </a>
              ),
            },
          ]}
        />
        <div className="mt-4 border-t border-g-100 pt-4">
          <Checkbox
            checked={confirme}
            onChange={(e) => setConfirme(e.target.checked)}
            label="Je comprends que l’export contient l’intégralité des données du service"
            description="L’archive sera déposée dans un bucket chiffré de votre organisation, avec un lien de téléchargement valable sept jours. L’accès à l’export est journalisé dans l’audit."
          />
          <Button
            className="mt-3"
            disabled={!confirme}
            iconBefore={<Download size={13} />}
            onClick={() =>
              pousser({
                ton: 'info',
                titre: 'Génération de l’export lancée',
                detail: `Délai estimé : ${catalogue.reversibilite.delaiJours} jours ouvrés. Vous serez notifié.`,
              })
            }
          >
            Générer un export complet
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader titre="Historique des exports" />
          <div className="space-y-2">
            {[
              { date: '2026-06-30', format: catalogue.reversibilite.formats[0], taille: 2140, motif: 'Audit annuel · Cabinet Kouadio' },
              { date: '2025-12-31', format: catalogue.reversibilite.formats[0], taille: 1820, motif: 'Archivage réglementaire' },
            ].map((e) => (
              <div
                key={e.date}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-g-300 px-3 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-medium text-ink">
                    {dateCourte(e.date)} · {e.format}
                  </span>
                  <span className="block text-[11px] text-g-500">{e.motif}</span>
                </span>
                <span className="tnum shrink-0 text-[12px] text-g-700">{goHumain(e.taille)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-g-500">
            Les archives d’export sont conservées trente jours puis purgées automatiquement. Un
            export plus ancien doit être régénéré.
          </p>
        </Card>

        <Callout ton="violet" titre="Pourquoi nous testons la réversibilité">
          Un format d’export annoncé mais jamais éprouvé ne vaut rien le jour où vous en avez besoin.
          Nous vérifions périodiquement que l’export de ce service se réimporte effectivement dans
          une instance {catalogue.solutionOSS} vierge. Partir doit être possible pour que rester soit
          un choix.
        </Callout>
      </div>
    </div>
  )
}

function Ligne({ cle, valeur }: { cle: string; valeur: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-[11.5px] text-g-500">{cle}</dt>
      <dd className="tnum text-right text-[12px] font-semibold text-ink">{valeur}</dd>
    </div>
  )
}
