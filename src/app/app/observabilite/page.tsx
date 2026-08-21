'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BellRing, Plus } from 'lucide-react'
import { cn, seededSeries } from '@/lib/utils'
import { dateHeure, num, pct, relatif } from '@/lib/format'
import {
  ALERTES_PLATEFORME,
  COMPOSANTS,
  APPLICATIONS,
  ENVIRONNEMENTS,
  EVENEMENTS_SUPERVISION,
  LOGS_EXECUTION,
  REGLES_ALERTES,
  VMS,
  vmsDeLEspace,
  hrefDuService,
} from '@/lib/mock'
import type { AlerteRegle } from '@/lib/types'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, SegmentedControl, Select, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, PageHeader } from '@/components/composition/card'
import { HealthBadge, StatTile } from '@/components/composition/metrics'
import { EventList, GrilleSparkCharts, LiensSortie, LogPeek } from '@/components/business/observabilite'
import { useApp, useEspace } from '@/components/app/contexte'
import { useCollection } from '@/components/app/atelier'
import { BoutonFormulaire, useOperation } from '@/components/app/actions'

/** Champs d'une règle d'alerte — mêmes champs à la création et à la reprise. */
const CHAMPS_ALERTE = [
  { id: 'metrique', label: 'Règle', placeholder: 'CPU soutenu au-delà de 85 %', obligatoire: true },
  { id: 'cible', label: 'Portée', placeholder: 'étiquette production', obligatoire: true },
  { id: 'seuil', label: 'Seuil', placeholder: '> 85 %', demi: true, obligatoire: true },
  {
    id: 'plage',
    label: 'Pendant',
    type: 'select' as const,
    demi: true,
    options: [
      { value: '5 min', label: '5 minutes' },
      { value: '15 min', label: '15 minutes' },
      { value: '30 min', label: '30 minutes' },
      { value: '1 h', label: '1 heure' },
    ],
  },
  {
    id: 'canal',
    label: 'Canal de notification',
    type: 'select' as const,
    options: [
      { value: 'email', label: 'Courriel' },
      { value: 'sms', label: 'SMS' },
      { value: 'whatsapp', label: 'WhatsApp' },
      { value: 'webhook', label: 'Webhook' },
    ],
  },
  { id: 'actif', label: 'Active', type: 'switch' as const, placeholder: 'Règle armée' },
]
import { SITE_COURT } from '@/lib/types'

const LIBELLE_GRAVITE = {
  critique: 'Critique',
  majeure: 'Majeure',
  mineure: 'Mineure',
  info: 'Information',
} as const

/** Emplacement réel d'exécution d'un environnement, déduit de ses composants (§5.4). */
function emplacementDeLEnv(envId: string) {
  const cs = COMPOSANTS.filter((c) => c.envId === envId)
  const ns = cs.find((c) => c.emplacement.namespace)?.emplacement.namespace
  if (ns) return ns
  const vms = cs.flatMap((c) => c.emplacement.vms ?? [])
  return vms.length > 0 ? [...new Set(vms)].slice(0, 2).join(', ') : '—'
}

const ONGLETS = [
  { id: 'vue', label: 'Vue d’ensemble' },
  { id: 'ressources', label: 'Par ressource' },
  { id: 'evenements', label: 'Événements' },
  { id: 'alertes', label: 'Règles d’alerte' },
]

const PERIMETRES = [
  { value: 'espace', label: 'Espace Cloud' },
  { value: 'apps', label: 'Applications' },
  { value: 'services', label: 'Services managés' },
]

export default function Observabilite() {
  const espace = useEspace()
  const { autorise, refus, pousser } = useApp()
  const alertes = useCollection<AlerteRegle>('regles-alertes', REGLES_ALERTES)
  const executer = useOperation()
  const [canalCourriel, setCanalCourriel] = useState(true)
  const [canalWebhook, setCanalWebhook] = useState(false)
  const [canalTicket, setCanalTicket] = useState(false)
  const [onglet, setOnglet] = useState('vue')
  const [perimetre, setPerimetre] = useState('espace')

  const vms = vmsDeLEspace(espace.id)
  const enMarche = vms.filter((v) => v.statut === 'running')
  const critiques = EVENEMENTS_SUPERVISION.filter(
    (e) => e.gravite === 'critique' || e.gravite === 'majeure',
  ).length
  const appsDegradees = APPLICATIONS.filter(
    (a) => a.sante === 'degrade' || a.sante === 'echec',
  ).length

  /** Les métriques instantanées sont dérivées d'une graine stable pour rester identiques au rendu serveur. */
  const charge = (id: string, min: number, max: number) => seededSeries(id, 1, min, max)[0]
  const chargeMoy = Math.round(
    enMarche.reduce((a, v) => a + charge(`cpu-${v.id}`, 12, 88), 0) / Math.max(1, enMarche.length),
  )

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Observabilité' }]}
        titre="Observabilité"
        sousTitre="Une vue de synthèse, volontairement resserrée : l’état de santé, quelques courbes, les derniers événements, un aperçu des journaux. Pour l’analyse fine, nous vous ouvrons Centreon, Grafana et le moteur de recherche de journaux — ce sont des outils spécialisés, nous ne cherchons pas à les remplacer."
        actions={
          <BoutonFormulaire
            libelle="Nouvelle règle d’alerte"
            size="md"
            icone={<BellRing size={14} />}
            titre="Nouvelle règle d’alerte"
            description="Sans durée de dépassement, une alerte se déclenche sur le moindre pic et finit par être ignorée. C’est le réglage qui fait la différence entre une alerte utile et du bruit."
            champs={CHAMPS_ALERTE}
            valeursDepart={{ plage: '15 min', canal: 'email', actif: true }}
            libelleValider="Créer la règle"
            operation={(v) => ({
              titre: `Règle « ${v.metrique} » créée`,
              detail: `${v.seuil} pendant ${v.plage} · ${v.canal}`,
              effet: () =>
                alertes.creer({
                  id: alertes.identifiant('alerte'),
                  cible: String(v.cible),
                  metrique: String(v.metrique),
                  seuil: String(v.seuil),
                  canaux: [v.canal as AlerteRegle['canaux'][number]],
                  plage: String(v.plage),
                  actif: Boolean(v.actif),
                }),
            })}
          />
        }
        meta={
          <>
            <Badge tone="neutral" size="sm">
              {espace.code}
            </Badge>
            <Badge tone="neutral" size="sm">
              Données à {dateHeure('2026-08-19T15:20:00Z')}
            </Badge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          libelle="Ressources supervisées"
          valeur={vms.length + ENVIRONNEMENTS.length}
          detail={`${vms.length} machines · ${ENVIRONNEMENTS.length} environnements`}
        />
        <StatTile
          libelle="Charge processeur moyenne"
          valeur={pct(chargeMoy)}
          ton={chargeMoy > 75 ? 'warn' : 'ok'}
          serie={seededSeries(`obs-cpu-${espace.id}`, 24, Math.max(5, chargeMoy - 18), chargeMoy + 14)}
        />
        <StatTile
          libelle="Événements ouverts"
          valeur={critiques}
          ton={critiques > 0 ? 'warn' : 'ok'}
          detail={critiques > 0 ? 'Critiques ou majeurs' : 'Aucun événement ouvert'}
        />
        <StatTile
          libelle="Applications en alerte"
          valeur={appsDegradees}
          ton={appsDegradees > 0 ? 'err' : 'ok'}
          detail={appsDegradees > 0 ? 'analytics dégradé, batch en échec' : 'Toutes saines'}
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'vue' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl options={PERIMETRES} value={perimetre} onChange={setPerimetre} />
            <LiensSortie centreon grafana logs />
          </div>

          <GrilleSparkCharts
            seed={`obs-${perimetre}-${espace.id}`}
            metriques={
              perimetre === 'espace'
                ? [
                    { titre: 'Processeur agrégé', unite: '%', min: 24, max: 82, seuil: 85 },
                    { titre: 'Mémoire utilisée', unite: '%', min: 48, max: 79, seuil: 90 },
                    { titre: 'Débit disque', unite: 'Mo/s', min: 40, max: 320, couleur: 'var(--color-m-600)' },
                    { titre: 'Trafic réseau sortant', unite: 'Mb/s', min: 60, max: 420 },
                  ]
                : perimetre === 'apps'
                  ? [
                      { titre: 'Requêtes par seconde', unite: 'req/s', min: 180, max: 940 },
                      { titre: 'Latence 95e centile', unite: 'ms', min: 60, max: 240, seuil: 200 },
                      { titre: 'Taux d’erreur', unite: '%', min: 0, max: 2.4, seuil: 1, couleur: 'var(--color-err)' },
                      { titre: 'Redémarrages de conteneurs', unite: '', min: 0, max: 4 },
                    ]
                  : [
                      { titre: 'Sessions actives', unite: '', min: 90, max: 480 },
                      { titre: 'Temps de réponse', unite: 'ms', min: 110, max: 380, seuil: 500 },
                      { titre: 'Volume stocké', unite: 'Go', min: 1180, max: 1240 },
                      { titre: 'Disponibilité', unite: '%', min: 99.6, max: 100, seuil: 99.9 },
                    ]
            }
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Derniers événements"
                sousTitre="Les huit derniers événements de supervision, toutes ressources confondues."
              />
              <EventList
                evenements={EVENEMENTS_SUPERVISION}
                max={8}
                lienSortie="Ouvrir la console Centreon"
                hrefSortie="https://centreon.synelia.cloud/monitoring/resources"
              />
            </Card>

            <Card>
              <CardHeader
                titre="Aperçu des journaux"
                sousTitre="Vingt lignes, brutes, pour vérifier qu’une hypothèse tient. Au-delà, le moteur de recherche est bien meilleur que nous."
              />
              <LogPeek
                lignes={LOGS_EXECUTION}
                max={20}
                titre="facturation-api · Production"
                hrefSortie="https://logs.synelia.cloud/select/vmui"
              />
            </Card>
          </div>

          <Callout ton="violet" titre="Pourquoi nous n’avons pas construit de constructeur de requêtes">
            Écrire une requête de journaux se fait dans un outil qui sait tout faire : autocomplétion
            des champs, agrégations, sauvegarde des recherches, corrélation. Le reconstruire à moitié
            dans un portail ne rend service à personne. Nous vous amenons jusqu’au bon écran, déjà
            filtré sur votre organisation et sur la fenêtre de temps que vous regardiez.
          </Callout>
        </div>
      )}

      {onglet === 'ressources' && (
        <div className="space-y-4">
          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3.5">
              <CardHeader
                titre="État par ressource"
                sousTitre="Machines de l’espace et environnements applicatifs, avec leur emplacement réel d’exécution."
                className="mb-0"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Ressource', 'Type', 'Emplacement', 'Processeur', 'Mémoire', 'État', ''].map(
                      (h) => (
                        <th
                          key={h}
                          className="type-micro px-3 py-2 text-left font-semibold text-g-500"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {vms.map((v) => (
                    <tr key={v.id} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/app/vms/${v.id}`}
                          className="font-mono text-[12px] font-semibold text-ink hover:text-p-700"
                        >
                          {v.nom}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-g-700">Machine virtuelle</td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-g-500">
                        {SITE_COURT[v.site]} · {v.flavor ?? `${v.vcpu} vCPU / ${v.ramGo} Go`}
                      </td>
                      <td className="px-3 py-2.5">
                        <Jauge valeur={charge(`cpu-${v.id}`, 12, 88)} seuil={85} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Jauge valeur={charge(`ram-${v.id}`, 30, 92)} seuil={90} />
                      </td>
                      <td className="px-3 py-2.5">
                        <HealthBadge etat={v.statut} size="sm" />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <ButtonLink
                          size="sm"
                          variant="ghost"
                          external
                          href={`https://grafana.synelia.cloud/d/vm/${v.id}`}
                        >
                          Grafana
                        </ButtonLink>
                      </td>
                    </tr>
                  ))}
                  {ENVIRONNEMENTS.slice(0, 8).map((e) => {
                    const app = APPLICATIONS.find((a) => a.id === e.appId)
                    return (
                      <tr key={e.id} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5">
                          <Link
                            href={hrefDuService(e.appId)}
                            className="font-mono text-[12px] font-semibold text-ink hover:text-p-700"
                          >
                            {app?.nom} / {e.nom}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-700">
                          {app?.cible === 'k8s' ? 'Namespace Kubernetes' : 'Machines dédiées'}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-g-500">
                          {emplacementDeLEnv(e.id)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Jauge valeur={e.sante.cpu} seuil={85} />
                        </td>
                        <td className="px-3 py-2.5">
                          <Jauge valeur={e.sante.ram} seuil={90} />
                        </td>
                        <td className="px-3 py-2.5">
                          <HealthBadge etat={e.statut} size="sm" />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <ButtonLink
                            size="sm"
                            variant="ghost"
                            external
                            href={`https://grafana.synelia.cloud/d/app/${e.id}`}
                          >
                            Grafana
                          </ButtonLink>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Callout ton="info" titre="Ce que « emplacement » veut dire ici">
            Pour une machine, c’est le socle technique et l’hôte physique qui l’exécute. Pour un
            environnement applicatif, c’est le namespace Kubernetes ou le groupe de machines. Nous
            l’affichons parce que c’est la première question posée pendant un incident, et qu’une
            plateforme qui la masque vous fait perdre dix minutes à chaque fois.
          </Callout>
        </div>
      )}

      {onglet === 'evenements' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <StatTile
              libelle="Critiques"
              valeur={EVENEMENTS_SUPERVISION.filter((e) => e.gravite === 'critique').length}
              ton="err"
            />
            <StatTile
              libelle="Majeurs"
              valeur={EVENEMENTS_SUPERVISION.filter((e) => e.gravite === 'majeure').length}
              ton="warn"
            />
            <StatTile
              libelle="Mineurs"
              valeur={EVENEMENTS_SUPERVISION.filter((e) => e.gravite === 'mineure').length}
              ton="info"
            />
            <StatTile
              libelle="Informations"
              valeur={EVENEMENTS_SUPERVISION.filter((e) => e.gravite === 'info').length}
              ton="neutral"
            />
          </div>

          <Card>
            <CardHeader
              titre="Journal des événements"
              sousTitre="Un événement reste ouvert jusqu’à sa résolution ou son acquittement. L’acquittement est nominatif."
            />
            <div className="space-y-2">
              {EVENEMENTS_SUPERVISION.map((e) => (
                <div
                  key={e.id}
                  className={cn(
                    'flex flex-wrap items-start justify-between gap-3 rounded-[6px] border px-3 py-2.5',
                    e.gravite === 'critique'
                      ? 'border-err/40 bg-err-bg'
                      : e.gravite === 'majeure'
                        ? 'border-warn/40 bg-warn-bg'
                        : 'border-g-300',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-ink">{e.message}</span>
                    <span className="block text-[11px] text-g-500">
                      {e.ressource} · {dateHeure(e.ts)} · {relatif(e.ts)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge
                      tone={
                        e.gravite === 'critique'
                          ? 'err'
                          : e.gravite === 'majeure'
                            ? 'warn'
                            : e.gravite === 'mineure'
                              ? 'info'
                              : 'neutral'
                      }
                      size="sm"
                    >
                      {LIBELLE_GRAVITE[e.gravite]}
                    </Badge>
                    {e.gravite === 'info' ? (
                      <Badge tone="neutral" size="sm">
                        Acquitté
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          pousser({
                            ton: 'ok',
                            titre: 'Événement acquitté',
                            detail: 'Votre nom et l’horodatage sont enregistrés dans l’audit.',
                          })
                        }
                      >
                        Acquitter
                      </Button>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-g-100 pt-4">
              <LiensSortie centreon grafana logs />
            </div>
          </Card>
        </div>
      )}

      {onglet === 'alertes' && (
        <div className="space-y-4">
          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3.5">
              <CardHeader
                titre="Règles d’alerte"
                sousTitre="Une règle définit un seuil, une durée de dépassement et un canal de notification. Sans durée, une alerte se déclenche sur le moindre pic et finit par être ignorée."
                className="mb-0"
                actions={
                  <BoutonFormulaire
                    libelle="Ajouter"
                    icone={<Plus size={13} />}
                    titre="Ajouter une règle d’alerte"
                    champs={CHAMPS_ALERTE}
                    valeursDepart={{ plage: '15 min', canal: 'email', actif: true }}
                    libelleValider="Ajouter la règle"
                    operation={(v) => ({
                      titre: `Règle « ${v.metrique} » ajoutée`,
                      effet: () =>
                        alertes.creer({
                          id: alertes.identifiant('alerte'),
                          cible: String(v.cible),
                          metrique: String(v.metrique),
                          seuil: String(v.seuil),
                          canaux: [v.canal as AlerteRegle['canaux'][number]],
                          plage: String(v.plage),
                          actif: Boolean(v.actif),
                        }),
                    })}
                  />
                }
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Règle', 'Portée', 'Condition', 'Canal', 'État', ''].map((h) => (
                      <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alertes.items.map((r) => (
                    <tr key={r.id} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5 text-[12.5px] font-semibold text-ink">
                        {r.metrique}
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-g-700">{r.cible}</td>
                      <td className="px-3 py-2.5 font-mono text-[11.5px] text-g-700">
                        {r.seuil}
                        <span className="block font-sans text-[10.5px] text-g-500">
                          {r.plage}
                          {r.escalade ? ` · escalade ${r.escalade}` : ''}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex flex-wrap gap-1">
                          {r.canaux.map((c) => (
                            <Badge key={c} tone="neutral" size="sm">
                              {c}
                            </Badge>
                          ))}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={r.actif ? 'ok' : 'neutral'} dot size="sm">
                          {r.actif ? 'Active' : 'Désactivée'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <BoutonFormulaire
                          libelle="Modifier"
                          variant="ghost"
                          titre={`Modifier « ${r.metrique} »`}
                          champs={CHAMPS_ALERTE}
                          valeursDepart={{
                            metrique: r.metrique,
                            cible: r.cible,
                            seuil: r.seuil,
                            plage: r.plage,
                            canal: r.canaux[0] ?? 'email',
                            actif: r.actif,
                          }}
                          operation={(v) => ({
                            titre: `Règle « ${v.metrique} » modifiée`,
                            detail: v.actif ? undefined : 'La règle est désarmée : elle ne notifiera plus.',
                            effet: () =>
                              alertes.modifier(r.id, {
                                metrique: String(v.metrique),
                                cible: String(v.cible),
                                seuil: String(v.seuil),
                                plage: String(v.plage),
                                canaux: [v.canal as AlerteRegle['canaux'][number]],
                                actif: Boolean(v.actif),
                              }),
                          })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Nouvelle règle"
                sousTitre="Trois champs suffisent dans la plupart des cas."
              />
              <div className="space-y-4">
                <Field label="Métrique">
                  <Select defaultValue="cpu">
                    <option value="cpu">Charge processeur</option>
                    <option value="ram">Mémoire utilisée</option>
                    <option value="disque">Espace disque restant</option>
                    <option value="latence">Latence 95e centile</option>
                    <option value="erreurs">Taux d’erreur HTTP</option>
                    <option value="sauvegarde">Sauvegarde en échec</option>
                  </Select>
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Seuil" hint="en pourcentage">
                    <Input type="number" defaultValue={85} />
                  </Field>
                  <Field
                    label="Dépassement continu"
                    hint="minutes — évite les alertes sur un pic isolé"
                  >
                    <Input type="number" defaultValue={10} />
                  </Field>
                </div>
                <Field label="Portée">
                  <Select defaultValue="espace">
                    <option value="espace">Tout l’espace {espace.code}</option>
                    <option value="vm">Une machine précise</option>
                    <option value="app">Une application</option>
                  </Select>
                </Field>
                <div className="space-y-3">
                  <Switch
                    checked={canalCourriel}
                    onChange={(v) =>
                      executer({
                        titre: v ? 'Courriel activé' : 'Courriel coupé',
                        detail: v
                          ? undefined
                          : 'Plus aucune alerte ne partira par courriel : vérifiez qu’un autre canal reste actif.',
                        effet: () => setCanalCourriel(v),
                      })
                    }
                    label="Courriel aux administrateurs de l’organisation"
                  />
                  <Switch
                    checked={canalWebhook}
                    onChange={(v) =>
                      executer({
                        titre: v ? 'Webhook activé' : 'Webhook coupé',
                        detail: v ? 'Charge JSON signée, format documenté.' : undefined,
                        effet: () => setCanalWebhook(v),
                      })
                    }
                    label="Webhook vers un canal d’équipe"
                    description="Nous envoyons une charge JSON signée ; le format est décrit dans la documentation."
                  />
                  <Switch
                    checked={canalTicket}
                    onChange={(v) =>
                      executer({
                        titre: v
                          ? 'Ouverture automatique de ticket activée'
                          : 'Ouverture automatique de ticket coupée',
                        detail: v
                          ? 'Uniquement pour les alertes critiques, rattachées à la ressource concernée.'
                          : undefined,
                        effet: () => setCanalTicket(v),
                      })
                    }
                    label="Ouvrir automatiquement un ticket de support"
                    description="Uniquement pour les alertes critiques. Le ticket est rattaché à la ressource concernée."
                  />
                </div>
              </div>
              <GatedAction autorise={autorise('org.dashboard.view')} message={refus('org.dashboard.view')}>
                <Button
                  className="mt-4"
                  onClick={() =>
                    pousser({
                      ton: 'ok',
                      titre: 'Règle d’alerte créée',
                      detail: 'Elle prendra effet au prochain cycle de collecte, dans moins d’une minute.',
                    })
                  }
                >
                  Créer la règle
                </Button>
              </GatedAction>
            </Card>

            <Card>
              <CardHeader
                titre="Alertes déclenchées récemment"
                sousTitre="L’historique des déclenchements permet de repérer une règle trop sensible."
              />
              <EventList evenements={ALERTES_PLATEFORME} max={6} />
              <MicroLabel className="mt-4 mb-2">Volume de déclenchements sur 30 jours</MicroLabel>
              <div className="flex items-end gap-1">
                {seededSeries('alertes-30j', 30, 0, 9).map((v, i) => (
                  <span
                    key={i}
                    className={cn('flex-1 rounded-t-sm', v > 6 ? 'bg-warn' : 'bg-p-300')}
                    style={{ height: `${8 + v * 5}px` }}
                    title={`${num(v)} déclenchement${v > 1 ? 's' : ''}`}
                  />
                ))}
              </div>
              <Callout ton="warn" className="mt-4" titre="Une règle se déclenche trop souvent">
                La règle « Charge processeur supérieure à 80 % » s’est déclenchée 34 fois ce mois-ci
                sur <span className="font-mono text-[12px]">{VMS[0]?.nom}</span>, sans incident
                associé. Un seuil à 80 % sur une machine dimensionnée pour tourner à 75 % produit du
                bruit, pas de l’information. Portez le seuil à 90 % ou la durée à 20 minutes.
              </Callout>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function Jauge({ valeur, seuil }: { valeur: number; seuil: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="relative block h-1.5 w-16 overflow-hidden rounded-full bg-g-100">
        <span
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            valeur >= seuil ? 'bg-err' : valeur >= seuil - 15 ? 'bg-warn' : 'bg-p-600',
          )}
          style={{ width: `${Math.min(100, valeur)}%` }}
        />
      </span>
      <span
        className={cn(
          'tnum text-[11.5px] font-semibold',
          valeur >= seuil ? 'text-err' : valeur === 0 ? 'text-g-500' : 'text-g-700',
        )}
      >
        {pct(valeur)}
      </span>
    </span>
  )
}
