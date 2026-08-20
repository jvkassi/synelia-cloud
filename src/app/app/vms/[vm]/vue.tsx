'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Camera,
  Copy,
  Maximize2,
  MonitorPlay,
  MoveRight,
  Power,
  RotateCw,
  Ruler,
  Trash2,
} from 'lucide-react'
import { cn, seededSeries } from '@/lib/utils'
import { dateCourte, dateHeure, goHumain, num, pct, relatif } from '@/lib/format'
import { SITE_LABEL } from '@/lib/types'
import {
  BACKUP_PLANS,
  EVENEMENTS_SUPERVISION,
  RESTORE_POINTS,
  SECURITY_GROUPS,
  VMS,
  VOLUMES,
  espaceById,
  hrefDuService,
} from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, SegmentedControl, Select, Switch } from '@/components/ui/field'
import { ConfirmDialog, Drawer, Popover } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { HealthBadge, QuotaBar, StatTile } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { EventList, GrilleSparkCharts } from '@/components/business/observabilite'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'materiel', label: 'Matériel virtuel' },
  { id: 'reseau', label: 'Réseau' },
  { id: 'stockage', label: 'Stockage' },
  { id: 'snapshots', label: 'Snapshots' },
  { id: 'sauvegardes', label: 'Sauvegardes' },
]

export function VueVm({ id }: { id: string }) {
  const vm = VMS.find((v) => v.id === id)!
  const espace = espaceById(vm.espaceId)
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('apercu')
  const [console_, setConsole] = useState(false)
  const [suppression, setSuppression] = useState(false)

  const ipPrivee = vm.ips.find((i) => i.type === 'privee')?.adresse
  const ipPublique = vm.ips.find((i) => i.type === 'publique')?.adresse
  const volumes = VOLUMES.filter((v) => v.attachedTo === vm.id)
  const points = RESTORE_POINTS.filter((p) => p.resourceId === vm.id)
  const plan = BACKUP_PLANS.find((p) => p.id === vm.backupPlanId)

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: espace?.code ?? '', href: `/app/espaces/${vm.espaceId}` },
          { label: 'Machines virtuelles', href: '/app/vms' },
          { label: vm.nom },
        ]}
        titre={<span className="font-mono">{vm.nom}</span>}
        sousTitre={`${vm.os} · ${vm.vcpu} vCPU / ${vm.ramGo} Go / ${num(vm.diskGo)} Go · ${SITE_LABEL[vm.site]}`}
        meta={
          <>
            <HealthBadge etat={vm.statut} />
            {ipPrivee && <span className="font-mono text-[12px] text-g-500">{ipPrivee}</span>}
            {ipPublique && (
              <Badge tone="accent" size="sm">
                {ipPublique}
              </Badge>
            )}
            {vm.applicationId && (
              <Link
                href={hrefDuService(vm.applicationId)}
                className="text-[12px] font-semibold text-p-700 hover:text-m-600"
              >
                {vm.applicationNom} →
              </Link>
            )}
            {(vm.tags ?? []).map((t) => (
              <Badge key={t} tone="neutral" size="sm">
                {t}
              </Badge>
            ))}
          </>
        }
        actions={
          <>
            <Button
              iconBefore={<MonitorPlay size={14} />}
              onClick={() => setConsole(true)}
              disabled={vm.statut !== 'running'}
            >
              Console
            </Button>
            <GatedAction autorise={autorise('vm.power')} message={refus('vm.power')}>
              <Button
                variant="secondary"
                iconBefore={<RotateCw size={14} />}
                onClick={() =>
                  pousser({
                    ton: 'info',
                    titre: `Redémarrage de ${vm.nom}`,
                    detail: 'La machine sera de nouveau disponible dans environ 40 secondes.',
                  })
                }
              >
                Redémarrer
              </Button>
            </GatedAction>
            <GatedAction autorise={autorise('vm.create_delete')} message={refus('vm.create_delete')}>
              <Button variant="secondary" iconBefore={<Camera size={14} />}>
                Snapshot
              </Button>
            </GatedAction>
            <Popover
              width="w-56"
              label="Autres actions sur la machine"
              trigger={() => (
                <span className="inline-flex h-9 items-center rounded-[6px] border border-g-300 px-3 text-[13px] font-semibold text-g-700 hover:bg-g-050">
                  Autres actions
                </span>
              )}
            >
              {(close) => (
                <div className="p-1.5">
                  {[
                    { l: 'Arrêter', i: <Power size={13} />, action: 'vm.power' },
                    { l: 'Redimensionner', i: <Ruler size={13} />, action: 'vm.hardware.update' },
                    { l: 'Migrer vers un autre hôte', i: <MoveRight size={13} />, action: 'vm.hardware.update' },
                  ].map((a) => (
                    <GatedAction key={a.l} autorise={autorise(a.action)} message={refus(a.action)}>
                      <button
                        type="button"
                        onClick={close}
                        className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[12.5px] text-ink hover:bg-p-050"
                      >
                        <span className="text-g-500">{a.i}</span>
                        {a.l}
                      </button>
                    </GatedAction>
                  ))}
                  <div className="mt-1 border-t border-g-100 pt-1">
                    <GatedAction
                      autorise={autorise('vm.create_delete')}
                      message={refus('vm.create_delete')}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          close()
                          setSuppression(true)
                        }}
                        className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[12.5px] text-err hover:bg-err-bg"
                      >
                        <Trash2 size={13} />
                        Supprimer la machine
                      </button>
                    </GatedAction>
                  </div>
                </div>
              )}
            </Popover>
          </>
        }
      />

      {vm.statut === 'error' && (
        <Callout ton="err" titre="Cette machine est en erreur">
          Le service applicatif ne démarre plus depuis le dernier déploiement. Le journal
          d’initialisation signale un échec de résolution de dépendances Python. Consultez le
          diagnostic de build dans la console applicative de {vm.applicationNom}.
        </Callout>
      )}
      {vm.statut === 'migrating' && (
        <Callout ton="info" titre="Migration en cours">
          La machine est en cours de migration à chaud vers un autre hôte physique. Aucune
          interruption de service n’est attendue ; les performances peuvent être légèrement dégradées
          pendant le transfert de la mémoire.
        </Callout>
      )}
      {!vm.backupPlanId && (
        <Callout ton="warn" titre="Aucun plan de sauvegarde">
          Cette machine n’est pas protégée : aucune restauration n’est possible en cas d’incident ou
          d’erreur humaine. Appliquez un plan depuis l’onglet Sauvegardes.
        </Callout>
      )}

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {/* ─── Aperçu ──────────────────────────────────────────────────── */}
      {onglet === 'apercu' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              libelle="CPU"
              valeur={vm.statut === 'running' ? 34 : 0}
              unite="%"
              variation={vm.statut === 'running' ? 6 : 0}
              serie={seededSeries(`${id}-cpu`, 24, 18, 48)}
            />
            <StatTile
              libelle="Mémoire"
              valeur={vm.statut === 'running' ? 61 : 0}
              unite="%"
              variation={vm.statut === 'running' ? -2 : 0}
              serie={seededSeries(`${id}-mem`, 24, 52, 68)}
            />
            <StatTile
              libelle="Disque"
              valeur={vm.statut === 'running' ? 57 : 57}
              unite="%"
              detail={`${goHumain(Math.round(vm.diskGo * 0.57))} sur ${goHumain(vm.diskGo)}`}
              serie={seededSeries(`${id}-disk`, 24, 55, 58)}
            />
            <StatTile
              libelle="Réseau"
              valeur={vm.statut === 'running' ? 148 : 0}
              unite="Mbit/s"
              ton="accent"
              serie={seededSeries(`${id}-net`, 24, 40, 280)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader titre="Caractéristiques" />
              <KeyValueList
                colonnes={2}
                items={[
                  { cle: 'Identifiant', valeur: <span className="font-mono text-[12px]">{vm.id}</span> },
                  { cle: 'Système', valeur: vm.os },
                  { cle: 'Gabarit', valeur: <span className="font-mono">{vm.flavor}</span> },
                  { cle: 'vCPU', valeur: `${vm.vcpu} vCPU` },
                  { cle: 'Mémoire', valeur: `${vm.ramGo} Go` },
                  { cle: 'Disque système', valeur: goHumain(vm.diskGo) },
                  { cle: 'Espace Cloud', valeur: espace?.code ?? '—' },
                  { cle: 'Site', valeur: SITE_LABEL[vm.site] },
                  {
                    cle: 'Application rattachée',
                    valeur: vm.applicationNom ?? 'Machine autonome',
                  },
                  {
                    cle: 'Dernière sauvegarde',
                    valeur: vm.derniereSauvegarde ? dateHeure(vm.derniereSauvegarde) : 'Aucune',
                  },
                ]}
              />
            </Card>

            <Card>
              <CardHeader titre="Accès" />
              <div className="space-y-3">
                {ipPrivee && <CopyField label="IP privée" value={ipPrivee} />}
                {ipPublique && <CopyField label="IP publique" value={ipPublique} />}
                <CopyField
                  label="Connexion SSH"
                  value={`ssh ops@${ipPublique ?? ipPrivee} -p 22`}
                />
              </div>
              <p className="mt-3 border-t border-g-100 pt-3 text-[11.5px] leading-relaxed text-g-500">
                {ipPublique
                  ? 'L’accès SSH depuis Internet est filtré par le groupe de sécurité. Vérifiez que votre adresse est autorisée.'
                  : 'Cette machine n’a pas d’IP publique : l’accès SSH passe par le VPN ou par le bastion.'}
              </p>
            </Card>
          </div>

          <GrilleSparkCharts
            seed={`vm-${id}`}
            metriques={[
              { titre: 'CPU', unite: '%', min: 18, max: 48 },
              { titre: 'Mémoire', unite: '%', min: 52, max: 68, seuil: 90 },
              { titre: 'Disque', unite: '%', min: 55, max: 58, seuil: 85 },
              { titre: 'Réseau', unite: 'Mbit/s', min: 40, max: 280, couleur: 'var(--color-m-600)' },
            ]}
            degrade={vm.statut === 'stopped'}
          />

          <Card>
            <CardHeader titre="Cinq derniers événements" />
            <EventList
              evenements={EVENEMENTS_SUPERVISION.filter((e) => e.site === vm.site).slice(0, 5)}
              max={5}
            />
          </Card>
        </div>
      )}

      {/* ─── Matériel virtuel ────────────────────────────────────────── */}
      {onglet === 'materiel' && <OngletMateriel vm={vm} />}

      {/* ─── Réseau ──────────────────────────────────────────────────── */}
      {onglet === 'reseau' && (
        <div className="space-y-4">
          <Card>
            <CardHeader titre="Interfaces réseau" sousTitre={`${vm.hardware.nics} carte(s) virtuelle(s)`} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Interface', 'Adresse', 'Type', 'Reverse DNS', 'Réseau'].map((h) => (
                      <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vm.ips.map((ip, i) => (
                    <tr key={ip.adresse} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5 font-mono text-[12px] text-ink">eth{i}</td>
                      <td className="px-3 py-2.5 font-mono text-[12.5px] text-ink">{ip.adresse}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone={ip.type === 'publique' ? 'accent' : 'neutral'} size="sm">
                          {ip.type === 'publique' ? 'Publique' : 'Privée'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11.5px] text-g-700">
                        {ip.ptr ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-[12.5px] text-g-700">
                        {ip.type === 'privee' ? 'prod-front · 10.0.1.0/24' : 'Internet'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader
              titre="Groupes de sécurité appliqués"
              actions={
                <Button size="sm" variant="secondary" onClick={() => {}}>
                  Modifier les groupes
                </Button>
              }
            />
            {SECURITY_GROUPS.slice(0, 2).map((sg) => (
              <div key={sg.id} className="mb-3.5 last:mb-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold text-ink">{sg.nom}</span>
                  <Badge tone={sg.defaultPolicy.ingress === 'deny' ? 'ok' : 'warn'} size="sm">
                    {sg.defaultPolicy.ingress === 'deny'
                      ? 'Refus par défaut en entrée, sortie autorisée'
                      : 'Autorisation par défaut en entrée'}
                  </Badge>
                </div>
                <div className="overflow-x-auto rounded-[6px] border border-g-300">
                  <table className="w-full min-w-max border-collapse">
                    <thead>
                      <tr className="border-b border-g-300 bg-g-050">
                        {['Direction', 'Protocole', 'Ports', 'Source / destination', 'Description'].map(
                          (h) => (
                            <th key={h} className="type-micro px-3 py-1.5 text-left text-g-500">
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sg.rules.map((r) => (
                        <tr key={r.id} className="border-b border-g-100 last:border-0">
                          <td className="px-3 py-1.5">
                            <Badge tone={r.direction === 'in' ? 'info' : 'neutral'} size="sm">
                              {r.direction === 'in' ? 'Entrée' : 'Sortie'}
                            </Badge>
                          </td>
                          <td className="px-3 py-1.5 font-mono text-[11.5px] uppercase text-ink">
                            {r.protocole}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-[11.5px] text-ink">
                            {r.ports ?? 'tous'}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-[11.5px] text-g-700">
                            {r.cible}
                          </td>
                          <td className="px-3 py-1.5 text-[11.5px] text-g-700">
                            {r.description ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ─── Stockage ────────────────────────────────────────────────── */}
      {onglet === 'stockage' && (
        <Card>
          <CardHeader
            titre="Volumes attachés"
            sousTitre="Le disque système est inclus dans le gabarit ; les volumes de données sont facturés séparément."
            actions={
              <Button size="sm" variant="secondary">
                Attacher un volume
              </Button>
            }
          />
          <div className="mb-4 rounded-[8px] border border-g-300 bg-g-050 px-3.5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <span className="block text-[12.5px] font-semibold text-ink">
                  Disque système ({goHumain(vm.diskGo)})
                </span>
                <span className="block font-mono text-[11.5px] text-g-500">/ · inclus au gabarit</span>
              </span>
              <span className="w-40">
                <QuotaBar
                  utilise={Math.round(vm.diskGo * 0.57)}
                  total={vm.diskGo}
                  compact
                  seuil={85}
                  formateur={(v) => goHumain(v)}
                />
              </span>
            </div>
          </div>
          {volumes.length === 0 ? (
            <EmptyState
              titre="Aucun volume de données"
              phrase="Un volume séparé permet d’étendre le stockage à chaud, de le déplacer vers une autre machine, et de le sauvegarder indépendamment du système."
              action={{ libelle: 'Créer un volume', href: '/app/stockage' }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Volume', 'Point de montage', 'Taille', 'Classe', 'IOPS', 'Chiffré', ''].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {volumes.map((v) => (
                    <tr key={v.id} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5 font-mono text-[12.5px] text-ink">{v.nom}</td>
                      <td className="px-3 py-2.5 font-mono text-[11.5px] text-g-700">
                        {v.montage ?? '—'}
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">
                        {goHumain(v.tailleGo)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone="neutral" size="sm">
                          {v.classe.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12px] text-g-700">{num(v.iops)}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone={v.chiffre ? 'ok' : 'warn'} size="sm">
                          {v.chiffre ? 'Oui' : 'Non'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Button size="sm" variant="ghost">
                          Étendre
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ─── Snapshots ───────────────────────────────────────────────── */}
      {onglet === 'snapshots' && (
        <Card>
          <CardHeader
            titre="Snapshots"
            sousTitre="Copie instantanée de l’état de la machine. Utile avant une mise à jour, mais ce n’est pas une sauvegarde : le snapshot vit sur le même stockage."
            actions={
              <GatedAction autorise={autorise('vm.create_delete')} message={refus('vm.create_delete')}>
                <Button size="sm" iconBefore={<Camera size={13} />}>
                  Prendre un snapshot
                </Button>
              </GatedAction>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr className="border-b border-g-300 bg-g-050">
                  {['Nom', 'Date', 'Taille', 'Type', 'Actions'].map((h) => (
                    <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { nom: 'avant-maj-noyau', date: '2026-08-18T21:40:00Z', taille: 42, type: 'à chaud' },
                  { nom: 'pre-deploiement-v2.7.1', date: '2026-08-19T15:04:00Z', taille: 44, type: 'à chaud' },
                  { nom: 'reference-installation', date: '2026-03-11T09:12:00Z', taille: 28, type: 'à froid' },
                ].map((s) => (
                  <tr key={s.nom} className="border-b border-g-100 last:border-0">
                    <td className="px-3 py-2.5 font-mono text-[12.5px] text-ink">{s.nom}</td>
                    <td className="px-3 py-2.5 text-[12.5px] text-g-700">{dateHeure(s.date)}</td>
                    <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">
                      {goHumain(s.taille)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone="neutral" size="sm">
                        {s.type}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex flex-wrap gap-1.5">
                        <Button size="sm" variant="ghost">
                          Restaurer
                        </Button>
                        <Button size="sm" variant="ghost" iconBefore={<Copy size={12} />}>
                          Cloner
                        </Button>
                        <IconButton label="Supprimer le snapshot" size="sm">
                          <Trash2 size={13} className="text-err" />
                        </IconButton>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout ton="warn" className="mt-4" titre="Un snapshot n’est pas une sauvegarde">
            Il partage le stockage de la machine : une défaillance du volume les emporte tous les
            deux. Pour une protection réelle, appliquez un plan de sauvegarde avec copie hors site
            immuable.
          </Callout>
        </Card>
      )}

      {/* ─── Sauvegardes ─────────────────────────────────────────────── */}
      {onglet === 'sauvegardes' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Plan appliqué"
              actions={
                plan ? (
                  <Badge tone={plan.immutable ? 'ok' : 'warn'}>
                    {plan.immutable ? 'Immuable' : 'Non immuable'}
                  </Badge>
                ) : undefined
              }
            />
            {plan ? (
              <KeyValueList
                colonnes={2}
                items={[
                  { cle: 'Plan', valeur: plan.nom },
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
                            ? 'Bucket autre site'
                            : 'Copie immuable',
                      )
                      .join(' · '),
                  },
                  { cle: 'Prochaine exécution', valeur: dateHeure(plan.prochaineExecution) },
                ]}
              />
            ) : (
              <EmptyState
                titre="Aucun plan appliqué"
                phrase="Cette machine n’est pas protégée. Appliquez un plan par étiquette pour couvrir automatiquement toutes vos machines de production, y compris celles créées plus tard."
                action={{ libelle: 'Choisir un plan', href: '/app/sauvegarde' }}
              />
            )}
          </Card>

          <Card>
            <CardHeader
              titre="Points de restauration"
              sousTitre="La restauration granulaire descend jusqu’au fichier."
              actions={
                <GatedAction autorise={autorise('backup.restore')} message={refus('backup.restore')}>
                  <Button size="sm">Lancer une restauration</Button>
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
                      {['Date', 'Type', 'Taille', 'Destination', 'Immuable', 'Vérifié', ''].map((h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                          {h}
                        </th>
                      ))}
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
                        <td className="px-3 py-2.5 text-[12px] text-g-700">
                          {p.immuableJusquau ? `jusqu’au ${dateCourte(p.immuableJusquau)}` : '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone={p.verifie ? 'ok' : 'neutral'} size="sm">
                            {p.verifie ? 'Oui' : 'Non'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <GatedAction
                            autorise={autorise('backup.restore')}
                            message={refus('backup.restore')}
                          >
                            <Button size="sm" variant="ghost">
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
            <p className="mt-3 border-t border-g-100 pt-3 text-[11.5px] leading-relaxed text-g-500">
              Granularité disponible pour une machine : machine entière, volume, système de fichiers
              parcourable, fichier unique. La destination peut être le même emplacement, un autre
              Espace Cloud, l’autre site, ou un téléchargement local.
            </p>
          </Card>
        </div>
      )}

      {/* Console en panneau plein écran */}
      <Drawer
        open={console_}
        onClose={() => setConsole(false)}
        title={`Console · ${vm.nom}`}
        description="Le portail encapsule la console KVM de l’hyperviseur. Il ne réimplémente pas le protocole."
        size="full"
        footer={
          <>
            <span className="mr-auto text-[11.5px] text-g-500">
              Session console chiffrée · déconnexion automatique après 15 minutes d’inactivité
            </span>
            <Button variant="ghost" iconBefore={<Maximize2 size={13} />}>
              Plein écran
            </Button>
            <Button variant="secondary" iconBefore={<RotateCw size={13} />}>
              Envoyer Ctrl+Alt+Suppr
            </Button>
            <Button variant="ghost" onClick={() => setConsole(false)}>
              Fermer
            </Button>
          </>
        }
      >
        <div className="flex h-full min-h-[60vh] flex-col overflow-hidden rounded-[8px] border border-g-300 bg-p-900">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse-dot" />
            <span className="type-micro text-p-300">
              Connecté · {vm.nom} · {vm.os}
            </span>
          </div>
          <pre className="flex-1 overflow-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed text-[#C9E4CA]">
{`Ubuntu 24.04.1 LTS ${vm.nom} tty1

${vm.nom} login: ops
Password:

Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-45-generic x86_64)

 * Documentation:  https://docs.synelia.cloud
 * Support:        https://app.synelia.cloud/support

  Système d'information au ${dateHeure('2026-08-19T15:20:00Z')}

  Charge système :  0,42               Processus :            186
  Utilisation /  :  57,0 % de ${goHumain(vm.diskGo)}   Utilisateurs :         1
  Mémoire        :  61 %               IP privée :            ${ipPrivee}
  Swap           :  0 %                ${ipPublique ? `IP publique :          ${ipPublique}` : ''}

  Sauvegarde     :  ${vm.derniereSauvegarde ? `dernière ${relatif(vm.derniereSauvegarde)}` : 'aucun plan appliqué'}
  Supervision    :  sondes actives (Centreon)

0 mise à jour peut être appliquée immédiatement.

Dernière connexion : ${dateHeure('2026-08-19T09:31:00Z')} depuis 10.99.0.14

ops@${vm.nom}:~$ systemctl is-system-running
running

ops@${vm.nom}:~$ _`}
          </pre>
        </div>
      </Drawer>

      <ConfirmDialog
        open={suppression}
        onClose={() => setSuppression(false)}
        onConfirm={() =>
          pousser({
            ton: 'warn',
            titre: `Suppression de ${vm.nom} lancée`,
            detail: 'Le quota sera libéré à la fin de l’opération.',
          })
        }
        titre="Supprimer cette machine virtuelle"
        ressource={vm.nom}
        pertes={[
          'Le disque système et son contenu seront détruits',
          `${volumes.length} volume(s) attaché(s) seront détaché(s) puis conservé(s) séparément`,
          '3 snapshots seront supprimés',
          vm.backupPlanId
            ? `Les points de restauration restent disponibles pendant ${plan?.retentionJours ?? 30} jours`
            : 'Aucun point de restauration n’existe : la perte sera définitive',
          `${vm.vcpu} vCPU et ${vm.ramGo} Go seront rendus au quota de ${espace?.code}`,
        ]}
        libelleAction="Supprimer la machine"
      />
    </div>
  )
}

// ─── Onglet Matériel virtuel ──────────────────────────────────────────

function OngletMateriel({ vm }: { vm: (typeof VMS)[number] }) {
  const { autorise, refus } = useApp()
  const [sousOnglet, setSousOnglet] = useState<'materiel' | 'options' | 'avance'>('materiel')

  return (
    <div className="space-y-4">
      <SegmentedControl
        value={sousOnglet}
        onChange={setSousOnglet}
        options={[
          { value: 'materiel', label: 'Matériel virtuel' },
          { value: 'options', label: 'Options de la VM' },
          { value: 'avance', label: 'Paramètres avancés' },
        ]}
      />

      {sousOnglet === 'materiel' && (
        <Card>
          <CardHeader
            titre="Matériel virtuel"
            sousTitre="Chaque modification indique si elle exige un redémarrage de la machine."
            actions={
              <GatedAction
                autorise={autorise('vm.hardware.update')}
                message={refus('vm.hardware.update')}
              >
                <Button size="sm">Appliquer les modifications</Button>
              </GatedAction>
            }
          />
          <div className="space-y-4">
            <Ligne
              libelle="vCPU"
              redemarrage={false}
              note="Ajout à chaud possible sur cette image ; le retrait exige un redémarrage."
            >
              <Input type="number" defaultValue={vm.vcpu} min={1} max={64} className="w-24" />
            </Ligne>
            <Ligne
              libelle="Mémoire"
              redemarrage={false}
              note="Ajout à chaud possible ; le retrait exige un redémarrage."
            >
              <Input type="number" defaultValue={vm.ramGo} min={1} max={256} suffix="Go" className="w-32" />
            </Ligne>
            <Ligne
              libelle="Contrôleur SCSI"
              redemarrage
              note="Le changement de type de contrôleur peut nécessiter un pilote dans l’invité."
            >
              <Select defaultValue="paravirtual" className="w-56">
                <option value="paravirtual">VirtIO SCSI (paravirtualisé)</option>
                <option value="lsi">LSI Logic SAS</option>
                <option value="nvme">NVMe</option>
              </Select>
            </Ligne>
            <Ligne libelle="Cartes réseau" redemarrage note="Une carte ajoutée apparaît comme ethN dans l’invité.">
              <Input type="number" defaultValue={vm.hardware.nics} min={1} max={8} className="w-24" />
            </Ligne>
            <Ligne libelle="Carte vidéo" redemarrage={false} note="Mémoire vidéo allouée à la console.">
              <Select defaultValue={String(vm.hardware.videoMo ?? 16)} className="w-40">
                <option value="8">8 Mo</option>
                <option value="16">16 Mo</option>
                <option value="32">32 Mo</option>
                <option value="64">64 Mo</option>
              </Select>
            </Ligne>
            <Ligne
              libelle="Périphériques USB"
              redemarrage
              note="Redirection USB depuis la console. Déconseillé en production."
            >
              <Switch checked={vm.hardware.usb} label="" />
            </Ligne>
            <Ligne
              libelle="Périphériques de sécurité"
              redemarrage
              note="Secure Boot et vTPM sont requis par Windows 11 et par le chiffrement de disque BitLocker ou LUKS scellé."
            >
              <div className="flex flex-col items-end gap-2">
                <Switch checked={vm.hardware.secureBoot} label="Secure Boot" />
                <Switch checked={vm.hardware.vtpm ?? false} label="vTPM 2.0" />
              </div>
            </Ligne>
          </div>
        </Card>
      )}

      {sousOnglet === 'options' && (
        <Card>
          <CardHeader titre="Options de la VM" />
          <div className="space-y-4">
            <Ligne libelle="Démarrage automatique de l’hôte" redemarrage={false} note="Redémarre la machine après une maintenance de l’hyperviseur.">
              <Switch checked label="" />
            </Ligne>
            <Ligne libelle="Ordre de démarrage" redemarrage={false} note="Priorité au sein d’un groupe de démarrage PRA.">
              <Input type="number" defaultValue={2} min={1} max={10} className="w-24" />
            </Ligne>
            <Ligne libelle="Synchronisation horaire" redemarrage={false} note="NTP interne Synelia, pas d’accès NTP public nécessaire.">
              <Select defaultValue="synelia" className="w-56">
                <option value="synelia">ntp.interne.synelia.cloud</option>
                <option value="hote">Horloge de l’hyperviseur</option>
              </Select>
            </Ligne>
            <Ligne libelle="Agent invité" redemarrage={false} note="Permet l’arrêt propre, le quiescing des sauvegardes et la remontée de métriques fines.">
              <Badge tone="ok" dot>
                Installé et actif
              </Badge>
            </Ligne>
            <Ligne libelle="Quiescing des sauvegardes" redemarrage={false} note="Suspend brièvement les écritures pour garantir la cohérence applicative du point de restauration.">
              <Switch checked label="" />
            </Ligne>
          </div>
        </Card>
      )}

      {sousOnglet === 'avance' && (
        <div className="space-y-4">
          <Card>
            <CardHeader titre="Paramètres avancés" />
            <div className="space-y-4">
              <Ligne libelle="Réservation CPU" redemarrage={false} note="Garantit une part minimale de cycles, même en cas de contention sur l’hôte.">
                <Input type="number" defaultValue={0} suffix="MHz" className="w-32" />
              </Ligne>
              <Ligne libelle="Limite CPU" redemarrage={false} note="Plafonne la consommation. Laisser à 0 pour aucune limite.">
                <Input type="number" defaultValue={0} suffix="MHz" className="w-32" />
              </Ligne>
              <Ligne libelle="Réservation mémoire" redemarrage={false} note="Mémoire garantie non sujette au ballooning.">
                <Input type="number" defaultValue={vm.ramGo / 2} suffix="Go" className="w-32" />
              </Ligne>
              <Ligne libelle="Groupe d’anti-affinité" redemarrage={false} note="Les machines d’un même groupe ne sont jamais placées sur le même hôte physique.">
                <Select defaultValue={vm.tags?.includes('production') ? 'prod-web' : ''} className="w-56">
                  <option value="">Aucun</option>
                  <option value="prod-web">prod-web</option>
                  <option value="prod-data">prod-data</option>
                </Select>
              </Ligne>
              <Ligne libelle="Migration à chaud" redemarrage={false} note="Autorise nos équipes à déplacer la machine entre hôtes sans interruption, pour les opérations de maintenance.">
                <Switch checked label="" />
              </Ligne>
            </div>
          </Card>
          <Callout ton="violet" titre="Ce que vous ne voyez pas ici, volontairement">
            L’hôte physique et l’hyperviseur sur lequel tourne cette machine ne sont pas exposés :
            c’est une décision de placement côté fournisseur, qui nous permet de rééquilibrer la
            charge sans vous impliquer. L’emplacement que nous exposons est le site — Abidjan ou
            Grand-Bassam — parce que c’est celui qui vous engage contractuellement.
          </Callout>
        </div>
      )}
    </div>
  )
}

function Ligne({
  libelle,
  note,
  redemarrage,
  children,
}: {
  libelle: string
  note: string
  redemarrage: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-g-100 pb-3.5 last:border-0 last:pb-0">
      <div className="min-w-0 max-w-md">
        <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink">
          {libelle}
          <Badge tone={redemarrage ? 'warn' : 'ok'} size="sm">
            {redemarrage ? 'Redémarrage requis' : 'Applicable à chaud'}
          </Badge>
        </p>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-500">{note}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
