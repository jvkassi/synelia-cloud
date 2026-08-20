'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn, seededSeries, surfaceMarque } from '@/lib/utils'
import { dateCourte, goHumain, money, num, pct } from '@/lib/format'
import { BASES_MANAGEES } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { HealthBadge, QuotaBar, StatTile } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { GrilleSparkCharts, LogPeek } from '@/components/business/observabilite'
import { useApp, useEspace } from '@/components/app/contexte'
import type { LigneLog } from '@/lib/types'

const MOTEURS: Record<string, { nom: string; teinte: string; port: number }> = {
  postgresql: { nom: 'PostgreSQL', teinte: '#336791', port: 5432 },
  mysql: { nom: 'MySQL', teinte: '#00758F', port: 3306 },
  mariadb: { nom: 'MariaDB', teinte: '#C0765A', port: 3306 },
  mongodb: { nom: 'MongoDB', teinte: '#47A248', port: 27017 },
  redis: { nom: 'Redis', teinte: '#DC382D', port: 6379 },
}

const ONGLETS = [
  { id: 'connexion', label: 'Connexion' },
  { id: 'replicas', label: 'Réplicas de lecture' },
  { id: 'sauvegardes', label: 'Sauvegardes & PITR' },
  { id: 'metriques', label: 'Métriques' },
  { id: 'version', label: 'Version' },
  { id: 'reseau', label: 'Restriction réseau' },
]

const REQUETES_LENTES: LigneLog[] = [
  { ts: '2026-08-19T15:14:02Z', niveau: 'WARN', source: 'slow-query', message: 'SELECT * FROM facture WHERE periode = $1 — 1 284 ms — index manquant sur (periode)' },
  { ts: '2026-08-19T14:52:41Z', niveau: 'WARN', source: 'slow-query', message: 'SELECT ... JOIN client ON ... — 942 ms — 48 200 lignes parcourues' },
  { ts: '2026-08-19T14:08:18Z', niveau: 'INFO', source: 'autovacuum', message: 'automatic vacuum of table "facture": 12 480 pages removed' },
  { ts: '2026-08-19T13:41:07Z', niveau: 'WARN', source: 'slow-query', message: 'UPDATE rapprochement SET statut = $1 WHERE lot_id = $2 — 812 ms' },
  { ts: '2026-08-19T12:22:55Z', niveau: 'ERROR', source: 'connection', message: 'FATAL: remaining connection slots reserved for superuser — pic à 298/300' },
  { ts: '2026-08-19T11:04:12Z', niveau: 'INFO', source: 'checkpoint', message: 'checkpoint complete: wrote 8 412 buffers in 4.2 s' },
]

export default function BasesManagees() {
  const espace = useEspace()
  const { autorise, refus } = useApp()
  const bases = BASES_MANAGEES.filter((b) => b.espaceId === espace.id)
  const [selection, setSelection] = useState(bases[0]?.id ?? '')
  const [onglet, setOnglet] = useState('connexion')

  const base = bases.find((b) => b.id === selection)
  const moteur = base ? MOTEURS[base.moteur] : undefined

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: espace.code, href: `/app/espaces/${espace.id}` },
          { label: 'Bases managées' },
        ]}
        titre="Bases de données managées"
        sousTitre="Nous exploitons le moteur : haute disponibilité, sauvegardes avec restauration à un instant précis, montées de version qualifiées. Vous gardez la main sur vos schémas et vos données."
        actions={
          <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
            <Button iconBefore={<Plus size={14} />}>Créer une base</Button>
          </GatedAction>
        }
      />

      {bases.length === 0 ? (
        <EmptyState
          titre="Aucune base managée dans cet espace"
          phrase="Une base managée vous évite d’exploiter vous-même le moteur : nous gérons la haute disponibilité, les sauvegardes avec restauration à un instant précis, les montées de version et la supervision fine."
          action={{ libelle: 'Créer une base', href: '#' }}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile libelle="Bases" valeur={bases.length} />
            <StatTile
              libelle="En haute disponibilité"
              valeur={bases.filter((b) => b.ha).length}
              ton="ok"
              detail={`${bases.filter((b) => !b.ha).length} en instance simple`}
            />
            <StatTile
              libelle="Volume total"
              valeur={goHumain(bases.reduce((a, b) => a + b.tailleGo, 0))}
            />
            <StatTile
              libelle="Connexions actives"
              valeur={num(bases.reduce((a, b) => a + b.connexions.actives, 0))}
              detail={`sur ${num(bases.reduce((a, b) => a + b.connexions.max, 0))} autorisées`}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bases.map((b) => {
              const m = MOTEURS[b.moteur]
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelection(b.id)}
                  className={cn(
                    'rounded-[10px] border-2 bg-white p-4 text-left transition-colors',
                    selection === b.id ? 'border-p-700' : 'border-g-300 hover:border-p-400',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[10px] font-bold"
                        style={{
                          background: surfaceMarque(m.teinte).fond,
                          color: surfaceMarque(m.teinte).texte,
                        }}
                      >
                        {m.nom.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-mono text-[12.5px] font-semibold text-ink">
                          {b.nom}
                        </span>
                        <span className="block text-[11px] text-g-500">
                          {m.nom} {b.version}
                        </span>
                      </span>
                    </span>
                    <HealthBadge etat={b.statut} size="sm" />
                  </div>
                  <div className="mt-3 space-y-2">
                    <QuotaBar
                      libelle="Connexions"
                      utilise={b.connexions.actives}
                      total={b.connexions.max}
                      compact
                      seuil={85}
                      formateur={(v) => num(v)}
                    />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Badge tone="neutral" size="sm">
                      {b.palier}
                    </Badge>
                    {b.ha && (
                      <Badge tone="ok" size="sm">
                        HA
                      </Badge>
                    )}
                    {b.pitr && (
                      <Badge tone="violet" size="sm">
                        PITR
                      </Badge>
                    )}
                    {b.replicas > 0 && (
                      <Badge tone="neutral" size="sm">
                        {b.replicas} réplica{b.replicas > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {base && moteur && (
            <>
              <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

              {onglet === 'connexion' && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader
                      titre="Chaîne de connexion"
                      sousTitre="Ne codez jamais le mot de passe en dur : référencez le coffre de secrets."
                    />
                    <div className="space-y-3">
                      <CopyField label="Hôte" value={base.host} />
                      <CopyField label="Port" value={String(moteur.port)} />
                      <CopyField
                        label="Chaîne de connexion"
                        masque
                        value={
                          base.moteur === 'postgresql'
                            ? `postgresql://app:••••••••@${base.host}:${moteur.port}/${base.nom}?sslmode=require`
                            : base.moteur === 'redis'
                              ? `rediss://default:••••••••@${base.host}:${moteur.port}/0`
                              : `mysql://app:••••••••@${base.host}:${moteur.port}/${base.nom}?ssl-mode=REQUIRED`
                        }
                      />
                      <CopyField
                        label="Référence au coffre de secrets"
                        value={`{{ vault:org-dba/db/${base.nom}#url }}`}
                      />
                    </div>
                    <Callout ton="info" className="mt-4" titre="TLS obligatoire">
                      Les connexions non chiffrées sont refusées par le moteur. Le certificat serveur
                      est signé par notre autorité interne, dont le paquet racine est disponible dans
                      la documentation.
                    </Callout>
                  </Card>

                  <Card>
                    <CardHeader titre="Caractéristiques" />
                    <KeyValueList
                      colonnes={1}
                      items={[
                        { cle: 'Moteur', valeur: `${moteur.nom} ${base.version}` },
                        { cle: 'Palier', valeur: base.palier },
                        {
                          cle: 'Haute disponibilité',
                          valeur: base.ha
                            ? 'Active — bascule automatique sur le nœud secondaire'
                            : 'Instance simple — une interruption est possible lors d’une maintenance',
                        },
                        { cle: 'Volume', valeur: goHumain(base.tailleGo) },
                        {
                          cle: 'Connexions',
                          valeur: `${num(base.connexions.actives)} actives sur ${num(base.connexions.max)}`,
                        },
                        { cle: 'Réplicas de lecture', valeur: String(base.replicas) },
                        {
                          cle: 'Restauration à un instant précis',
                          valeur: base.pitr ? 'Disponible sur 14 jours' : 'Non disponible',
                        },
                      ]}
                    />
                  </Card>
                </div>
              )}

              {onglet === 'replicas' && (
                <Card>
                  <CardHeader
                    titre="Réplicas de lecture"
                    sousTitre="Un réplica soulage l’instance principale pour les requêtes de lecture et les rapports."
                    actions={
                      <Button size="sm" variant="secondary" iconBefore={<Plus size={13} />}>
                        Ajouter un réplica
                      </Button>
                    }
                  />
                  {base.replicas === 0 ? (
                    <EmptyState
                      titre="Aucun réplica de lecture"
                      phrase="Un réplica permet d’exécuter les rapports et les exports sans peser sur l’instance principale. Sur une base qui atteint régulièrement 80 % de ses connexions, c’est souvent le premier levier."
                    />
                  ) : (
                    <div className="space-y-2">
                      {Array.from({ length: base.replicas }, (_, i) => (
                        <div
                          key={i}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
                        >
                          <span className="min-w-0">
                            <span className="block font-mono text-[12.5px] font-semibold text-ink">
                              {base.nom}-replica-{i + 1}
                            </span>
                            <span className="block font-mono text-[11px] text-g-500">
                              {base.host.replace(base.nom, `${base.nom}-replica-${i + 1}`)}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <Badge tone="ok" dot size="sm">
                              Synchronisé
                            </Badge>
                            <span className="tnum text-[11.5px] text-g-500">retard 42 ms</span>
                            <Button size="sm" variant="ghost">
                              Promouvoir
                            </Button>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Callout ton="info" className="mt-4" titre="Réplica en lecture seule">
                    Toute écriture sur un réplica est refusée par le moteur. Pointez vos rapports et
                    vos exports vers le réplica, et gardez l’instance principale pour les écritures.
                    La promotion d’un réplica en instance principale est une opération manuelle,
                    utilisée en cas de sinistre ou de migration.
                  </Callout>
                </Card>
              )}

              {onglet === 'sauvegardes' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <StatTile
                      libelle="Dernière sauvegarde complète"
                      valeur="il y a 13 h"
                      detail={dateCourte('2026-08-19')}
                      ton="ok"
                    />
                    <StatTile
                      libelle="Journalisation continue"
                      valeur={base.pitr ? 'Active' : 'Inactive'}
                      ton={base.pitr ? 'ok' : 'warn'}
                      detail={base.pitr ? 'RPO de quelques secondes' : 'RPO = dernière sauvegarde'}
                    />
                    <StatTile libelle="Fenêtre PITR" valeur="14 jours" />
                    <StatTile
                      libelle="Dernier test de restauration"
                      valeur="9 août"
                      ton="ok"
                      detail="Réussi en 26 min"
                    />
                  </div>
                  <Card>
                    <CardHeader
                      titre="Restauration à un instant précis"
                      sousTitre="La journalisation continue permet de revenir à n’importe quel instant de la fenêtre, à la seconde près."
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Instant cible" hint="heure GMT">
                        <Input type="datetime-local" defaultValue="2026-08-19T14:00" />
                      </Field>
                      <Field label="Destination">
                        <Select defaultValue="nouvelle">
                          <option value="nouvelle">Nouvelle instance (recommandé)</option>
                          <option value="ecraser">Écraser l’instance actuelle</option>
                        </Select>
                      </Field>
                    </div>
                    <GatedAction
                      autorise={autorise('backup.restore')}
                      message={refus('backup.restore')}
                    >
                      <Button className="mt-3.5">Lancer la restauration</Button>
                    </GatedAction>
                    <Callout ton="violet" className="mt-4" titre="Pourquoi une nouvelle instance">
                      Restaurer dans une nouvelle instance permet de vérifier le contenu avant de
                      basculer votre application, sans perdre l’état actuel. C’est la manœuvre à
                      privilégier après une suppression accidentelle : vous récupérez ce qui manque
                      sans annuler les écritures légitimes qui ont suivi.
                    </Callout>
                  </Card>
                </div>
              )}

              {onglet === 'metriques' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <StatTile
                      libelle="Connexions"
                      valeur={`${base.connexions.actives}/${base.connexions.max}`}
                      ton={base.connexions.actives / base.connexions.max > 0.85 ? 'warn' : 'ok'}
                      serie={seededSeries(`${base.id}-conn`, 24, base.connexions.actives * 0.6, base.connexions.max * 0.98)}
                    />
                    <StatTile
                      libelle="Requêtes lentes 24 h"
                      valeur={base.moteur === 'postgresql' ? 42 : 8}
                      ton="warn"
                      detail="Supérieures à 500 ms"
                      serie={seededSeries(`${base.id}-slow`, 24, 0, 8)}
                    />
                    <StatTile
                      libelle="Taux de cache"
                      valeur={pct(97.4, 1)}
                      ton="ok"
                      serie={seededSeries(`${base.id}-cache`, 24, 95, 99)}
                    />
                    <StatTile
                      libelle="Volume"
                      valeur={goHumain(base.tailleGo)}
                      detail="+2,1 % sur 30 jours"
                      serie={seededSeries(`${base.id}-size`, 24, base.tailleGo * 0.97, base.tailleGo)}
                    />
                  </div>

                  <GrilleSparkCharts
                    seed={`db-${base.id}`}
                    metriques={[
                      { titre: 'Connexions actives', unite: '', min: base.connexions.actives * 0.5, max: base.connexions.max * 0.98, seuil: base.connexions.max * 0.85 },
                      { titre: 'Requêtes par seconde', unite: 'req/s', min: 80, max: 640, couleur: 'var(--color-m-600)' },
                      { titre: 'Taux de cache', unite: '%', min: 94, max: 99.5 },
                      { titre: 'Latence de réplication', unite: 'ms', min: 8, max: 120, seuil: 500 },
                    ]}
                  />

                  <Card>
                    <CardHeader
                      titre="Journal du moteur"
                      sousTitre="Requêtes lentes, points de contrôle et saturations de connexions."
                    />
                    <LogPeek lignes={REQUETES_LENTES} max={20} titre="Événements du moteur" />
                  </Card>

                  {base.connexions.actives / base.connexions.max > 0.25 && base.moteur === 'postgresql' && (
                    <Callout ton="warn" titre="Un index manque sur la table facture">
                      La requête <span className="font-mono text-[12px]">SELECT * FROM facture WHERE periode = $1</span>{' '}
                      revient régulièrement au-delà de 1 200 ms, sans index sur la colonne{' '}
                      <span className="font-mono text-[12px]">periode</span>. Un index simple ramènerait
                      cette requête sous les 20 ms. Nous ne créons pas d’index de notre initiative :
                      votre schéma vous appartient. Ouvrez un ticket si vous souhaitez que nous
                      accompagnions l’analyse.
                    </Callout>
                  )}
                </div>
              )}

              {onglet === 'version' && (
                <Card>
                  <CardHeader
                    titre="Version du moteur"
                    sousTitre="Les montées de version majeures exigent une fenêtre de maintenance ; les correctifs mineurs s’appliquent à chaud sur les instances HA."
                  />
                  <div className="space-y-2">
                    {[
                      { v: base.version, courante: true, statut: 'Déployée' },
                      {
                        v: base.moteur === 'postgresql' ? '16.5' : base.moteur === 'mysql' ? '8.4.3' : '7.4',
                        courante: false,
                        statut: 'Correctif disponible — applicable à chaud',
                      },
                      {
                        v: base.moteur === 'postgresql' ? '17.2' : base.moteur === 'mysql' ? '9.0' : '8.0',
                        courante: false,
                        statut: 'Version majeure — fenêtre de maintenance requise',
                      },
                    ].map((x) => (
                      <div
                        key={x.v}
                        className={cn(
                          'flex flex-wrap items-center justify-between gap-3 rounded-[6px] border px-3 py-2.5',
                          x.courante ? 'border-p-700 bg-p-050' : 'border-g-300',
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block font-mono text-[13px] font-semibold text-ink">
                            {moteur.nom} {x.v}
                          </span>
                          <span className="block text-[11.5px] text-g-500">{x.statut}</span>
                        </span>
                        {x.courante ? (
                          <Badge tone="violet" size="sm">
                            Votre version
                          </Badge>
                        ) : (
                          <Button size="sm" variant="secondary">
                            Planifier
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Callout ton="info" className="mt-4" titre="Ce que nous prenons en charge">
                    Snapshot avant l’opération, application de la mise à jour, vérification du
                    démarrage et des connexions, retour arrière possible pendant sept jours. Sur une
                    instance HA, un correctif mineur s’applique nœud par nœud, sans interruption
                    perceptible.
                  </Callout>
                </Card>
              )}

              {onglet === 'reseau' && (
                <Card>
                  <CardHeader
                    titre="Restriction réseau"
                    sousTitre="Par défaut, la base n’est joignable que depuis les réseaux privés de son Espace Cloud."
                  />
                  <div className="space-y-3.5">
                    <Switch
                      checked
                      label="Restreindre aux réseaux privés de l’espace"
                      description={`Seules les ressources de ${espace.code} (${espace.cidr}) peuvent se connecter. Aucune exposition sur Internet.`}
                    />
                    <Switch
                      checked={false}
                      label="Autoriser des adresses IP externes"
                      description="À n’activer que temporairement, pour une migration ou un outil d’administration ponctuel. Chaque adresse autorisée élargit la surface d’attaque."
                    />
                  </div>
                  <div className="mt-4 border-t border-g-100 pt-4">
                    <MicroLabel className="mb-2">Réseaux autorisés</MicroLabel>
                    <div className="space-y-2">
                      {['10.0.1.0/24 · prod-front', '10.0.4.0/24 · ci-cd', '10.99.0.0/24 · pool VPN'].map(
                        (r) => (
                          <div
                            key={r}
                            className="flex items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2"
                          >
                            <span className="font-mono text-[12px] text-ink">{r}</span>
                            <Badge tone="ok" size="sm">
                              Autorisé
                            </Badge>
                          </div>
                        ),
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="mt-2.5" iconBefore={<Plus size={12} />}>
                      Ajouter un réseau
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
