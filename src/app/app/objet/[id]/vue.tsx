'use client'

import { useState } from 'react'
import { Download, File, Folder, KeyRound, Lock, Plus, RotateCw, Trash2 } from 'lucide-react'
import { cn, seededSeries } from '@/lib/utils'
import { dateCourte, dateHeure, goHumain, money, num } from '@/lib/format'
import { BUCKETS, CLES_S3, LOGS_EXECUTION } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { CodeBlock, CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, MonoTextarea, Radio, Select, Slider, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { LogPeek } from '@/components/business/observabilite'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'objets', label: 'Objets' },
  { id: 'politique', label: 'Politique d’accès' },
  { id: 'versioning', label: 'Versioning' },
  { id: 'cycle', label: 'Cycle de vie' },
  { id: 'worm', label: 'Verrouillage d’objet' },
  { id: 'replication', label: 'Réplication' },
  { id: 'cles', label: 'Clés d’accès' },
  { id: 'journaux', label: 'Journaux d’accès' },
]

const ARBORESCENCE = [
  { type: 'dossier' as const, nom: '2026-08/', taille: 412_000, objets: 12_840 },
  { type: 'dossier' as const, nom: '2026-07/', taille: 398_000, objets: 12_412 },
  { type: 'dossier' as const, nom: '2026-06/', taille: 386_000, objets: 11_988 },
  { type: 'fichier' as const, nom: 'manifest.json', taille: 0.8, objets: 1 },
  { type: 'fichier' as const, nom: 'checksums.sha256', taille: 2.4, objets: 1 },
]

export function VueBucket({ id }: { id: string }) {
  const bucket = BUCKETS.find((b) => b.id === id)!
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('objets')
  const prixGo = bucket.classe === 'chaud' ? 1.5 : 0.62

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Stockage objet S3', href: '/app/objet' },
          { label: bucket.nom },
        ]}
        titre={<span className="font-mono">{bucket.nom}</span>}
        sousTitre={`Région ${bucket.region} · classe ${bucket.classe === 'chaud' ? 'chaude' : 'froide'} · ${num(bucket.objets)} objets · ${goHumain(bucket.tailleGo)}`}
        meta={
          <>
            <Badge tone="neutral">{bucket.region}</Badge>
            <Badge tone={bucket.classe === 'chaud' ? 'violet' : 'neutral'}>
              {bucket.classe === 'chaud' ? 'Classe chaude' : 'Classe froide'}
            </Badge>
            {bucket.versioning && <Badge tone="ok">Versioning actif</Badge>}
            {bucket.objectLock?.actif && (
              <Badge tone="ok" dot>
                WORM {bucket.objectLock.retentionJours} j
              </Badge>
            )}
            {bucket.replication && (
              <Badge tone="violet">Réplication → {bucket.replication.cible}</Badge>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          libelle="Volume stocké"
          valeur={goHumain(bucket.tailleGo)}
          serie={seededSeries(`${id}-vol`, 24, bucket.tailleGo * 0.94, bucket.tailleGo)}
        />
        <StatTile libelle="Objets" valeur={num(bucket.objets)} />
        <StatTile
          libelle="Coût mensuel"
          valeur={money(Math.round(bucket.tailleGo * prixGo)).replace(' FCFA', '')}
          unite="FCFA"
          detail={`${money(Math.round(prixGo * 1000))} par To`}
        />
        <StatTile
          libelle="Trafic sortant du mois"
          valeur={goHumain(Math.round(bucket.tailleGo * 0.12))}
          detail={`Quota inclus : ${goHumain(bucket.classe === 'chaud' ? bucket.tailleGo : bucket.tailleGo * 0.2)}`}
          ton="ok"
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {/* Objets */}
      {onglet === 'objets' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Navigateur d’objets"
              sousTitre="Navigation simple pour vérifier un contenu. Le portail n’est pas un explorateur de fichiers : utilisez aws-cli ou rclone pour les opérations de masse."
              actions={
                <Button size="sm" variant="secondary" iconBefore={<Plus size={13} />}>
                  Téléverser
                </Button>
              }
            />
            <div className="mb-3 flex items-center gap-1.5 font-mono text-[12px] text-g-500">
              <span className="text-p-700">{bucket.nom}</span>
              <span>/</span>
            </div>
            <div className="overflow-x-auto rounded-[6px] border border-g-300">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Nom', 'Taille', 'Objets', 'Dernière modification', ''].map((h) => (
                      <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ARBORESCENCE.map((e) => (
                    <tr key={e.nom} className="border-b border-g-100 last:border-0 hover:bg-p-050/60">
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2">
                          {e.type === 'dossier' ? (
                            <Folder size={14} className="shrink-0 text-p-600" />
                          ) : (
                            <File size={14} className="shrink-0 text-g-500" />
                          )}
                          <span className="font-mono text-[12.5px] text-ink">{e.nom}</span>
                        </span>
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">
                        {goHumain(e.taille)}
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">
                        {e.type === 'dossier' ? num(e.objets) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-g-700">
                        {dateCourte('2026-08-19')}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="flex justify-end gap-1">
                          <IconButton label="Télécharger" size="sm">
                            <Download size={13} />
                          </IconButton>
                          <IconButton
                            label={
                              bucket.objectLock?.actif
                                ? 'Suppression impossible : verrouillage WORM actif'
                                : 'Supprimer'
                            }
                            size="sm"
                            disabled={bucket.objectLock?.actif}
                          >
                            <Trash2
                              size={13}
                              className={bucket.objectLock?.actif ? 'text-g-300' : 'text-err'}
                            />
                          </IconButton>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bucket.objectLock?.actif && (
              <Callout ton="info" className="mt-3.5" titre="Suppression désactivée">
                Ce bucket est protégé par un verrouillage d’objet de {bucket.objectLock.retentionJours}{' '}
                jours. Les objets ne peuvent être supprimés qu’après expiration de leur rétention —
                la restriction est appliquée par le stockage, pas par cette interface.
              </Callout>
            )}
          </Card>
        </div>
      )}

      {/* Politique d'accès */}
      {onglet === 'politique' && (
        <div className="space-y-4">
          <Card>
            <CardHeader titre="Politique d’accès" />
            <div className="space-y-3">
              <Radio
                name="politique"
                defaultChecked={bucket.policy === 'prive'}
                label="Privé"
                description="Accès uniquement par clé d’accès signée. Aucune lecture anonyme. C’est le réglage à conserver pour tout bucket de sauvegarde ou d’export."
              />
              <Radio
                name="politique"
                defaultChecked={bucket.policy === 'lecture_publique'}
                label="Lecture publique"
                description="Tout objet est lisible sans authentification par son URL. À réserver aux médias destinés à être servis sur un site web."
              />
              <Radio
                name="politique"
                defaultChecked={bucket.policy === 'json'}
                label="Politique JSON personnalisée"
                description="Contrôle fin par préfixe, par action et par principal."
              />
            </div>

            {bucket.policy === 'json' && (
              <div className="mt-4">
                <MicroLabel className="mb-2">Politique appliquée</MicroLabel>
                <MonoTextarea
                  rows={16}
                  defaultValue={`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AuditLectureSeule",
      "Effect": "Allow",
      "Principal": { "SYN": ["arn:syn:iam::org-dba:key/audit-lecture-seule"] },
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:syn:s3:::${bucket.nom}",
        "arn:syn:s3:::${bucket.nom}/*"
      ]
    },
    {
      "Sid": "InterdireSuppression",
      "Effect": "Deny",
      "Principal": "*",
      "Action": ["s3:DeleteObject", "s3:DeleteObjectVersion"],
      "Resource": "arn:syn:s3:::${bucket.nom}/*"
    }
  ]
}`}
                />
              </div>
            )}

            {bucket.policy === 'lecture_publique' && (
              <Callout ton="warn" className="mt-4" titre="Bucket en lecture publique">
                Tout objet déposé ici est lisible par quiconque connaît son URL. Vérifiez qu’aucune
                donnée personnelle ni aucun document interne n’y transite. Pour un site web, préférez
                un préfixe dédié plutôt que le bucket entier.
              </Callout>
            )}

            <div className="mt-4 border-t border-g-100 pt-4">
              <CopyField
                label="Endpoint du bucket"
                value={`https://s3.${bucket.region.toLowerCase()}.synelia.cloud/${bucket.nom}`}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Versioning */}
      {onglet === 'versioning' && (
        <div className="space-y-4">
          <Card>
            <CardHeader titre="Versioning" />
            <Switch
              checked={bucket.versioning}
              label="Conserver chaque version d’un objet"
              description="Une écriture sur une clé existante crée une nouvelle version au lieu d’écraser l’ancienne. Une suppression pose un marqueur sans détruire les versions précédentes."
            />
            {bucket.versioning ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <StatTile
                    libelle="Versions conservées"
                    valeur={num(Math.round(bucket.objets * 1.34))}
                    detail={`pour ${num(bucket.objets)} clés distinctes`}
                  />
                  <StatTile
                    libelle="Surcoût du versioning"
                    valeur={goHumain(Math.round(bucket.tailleGo * 0.24))}
                    ton="warn"
                    detail="Versions antérieures"
                  />
                  <StatTile
                    libelle="Marqueurs de suppression"
                    valeur={num(842)}
                    detail="Purgés par le cycle de vie"
                  />
                </div>
                <Callout ton="info" className="mt-4" titre="Le versioning a un coût de stockage">
                  Chaque version antérieure occupe sa propre capacité. Sans règle de cycle de vie
                  pour les expirer, un bucket versionné croît indéfiniment. Configurez l’expiration
                  des versions non courantes dans l’onglet Cycle de vie.
                </Callout>
              </>
            ) : (
              <Callout ton="warn" className="mt-4" titre="Versioning désactivé">
                Une écriture sur une clé existante écrase définitivement le contenu précédent. Sur un
                bucket recevant des sauvegardes, activez le versioning : c’est ce qui permet de
                revenir en arrière après une écriture erronée.
              </Callout>
            )}
          </Card>
        </div>
      )}

      {/* Cycle de vie */}
      {onglet === 'cycle' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Règles de cycle de vie"
              sousTitre="Transition chaud → froid et expiration automatique. Évaluées une fois par jour."
              actions={
                <Button size="sm" variant="secondary" iconBefore={<Plus size={13} />}>
                  Ajouter une règle
                </Button>
              }
            />
            <div className="space-y-3">
              {[
                {
                  nom: 'Transition vers la classe froide',
                  prefixe: '2026-*/',
                  action: 'Passer en classe froide',
                  apres: '30 jours après création',
                  actif: bucket.classe === 'chaud',
                },
                {
                  nom: 'Expiration des versions non courantes',
                  prefixe: '*',
                  action: 'Supprimer les versions antérieures',
                  apres: '90 jours',
                  actif: bucket.versioning,
                },
                {
                  nom: 'Purge des téléversements incomplets',
                  prefixe: '*',
                  action: 'Abandonner les multipart incomplets',
                  apres: '7 jours',
                  actif: true,
                },
              ].map((r) => (
                <div
                  key={r.nom}
                  className={cn(
                    'rounded-[8px] border px-3.5 py-3',
                    r.actif ? 'border-g-300' : 'border-g-300 bg-g-050 opacity-70',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-ink">{r.nom}</span>
                      <span className="mt-0.5 block text-[11.5px] text-g-500">
                        Préfixe <span className="font-mono">{r.prefixe}</span> · {r.action} ·{' '}
                        {r.apres}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge tone={r.actif ? 'ok' : 'neutral'} size="sm">
                        {r.actif ? 'Active' : 'Inactive'}
                      </Badge>
                      <IconButton label="Supprimer la règle" size="sm">
                        <Trash2 size={13} className="text-err" />
                      </IconButton>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {bucket.objectLock?.actif && (
              <Callout ton="warn" className="mt-4" titre="Interaction avec le verrouillage WORM">
                Une règle d’expiration ne peut pas supprimer un objet encore sous rétention WORM.
                L’expiration s’applique à la date la plus tardive entre celle de la règle et celle du
                verrouillage — la protection prime toujours.
              </Callout>
            )}
          </Card>
        </div>
      )}

      {/* WORM */}
      {onglet === 'worm' && (
        <div className="space-y-4">
          <Card className={bucket.objectLock?.actif ? 'border-[#B7E3D0]' : undefined}>
            <CardHeader
              titre={
                <span className="flex items-center gap-2">
                  <Lock size={15} className="text-p-700" />
                  Verrouillage d’objet (WORM)
                </span>
              }
              sousTitre="Write Once Read Many — écriture unique, lecture multiple."
              actions={
                <Badge tone={bucket.objectLock?.actif ? 'ok' : 'neutral'} dot>
                  {bucket.objectLock?.actif
                    ? `Actif · ${bucket.objectLock.retentionJours} jours`
                    : 'Inactif'}
                </Badge>
              }
            />

            <div className="rounded-[8px] border-l-4 border-p-600 bg-p-050 px-4 py-3.5">
              <p className="text-[13px] font-semibold text-ink">
                C’est votre protection anti-rançongiciel
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-g-700">
                Un attaquant qui compromet un compte administrateur peut chiffrer vos serveurs, puis
                tenter d’effacer vos sauvegardes pour vous forcer à payer. Sur un bucket verrouillé,
                cette seconde étape échoue : ni lui, ni vous, ni nos propres équipes ne pouvons
                supprimer ou raccourcir la rétention d’un objet avant son expiration. C’est la seule
                mesure qui offre cette garantie — le chiffrement, les droits d’accès et même les
                copies multiples n’y suffisent pas.
              </p>
            </div>

            <div className="mt-4 space-y-4">
              <Switch
                checked={bucket.objectLock?.actif ?? false}
                label="Activer le verrouillage d’objet"
                description="Une fois activé sur un bucket, le verrouillage ne peut plus être désactivé. C’est une contrainte assumée de la norme, pas une limitation Synelia."
              />
              {bucket.objectLock?.actif && (
                <>
                  <Slider
                    label="Durée de rétention par défaut"
                    value={bucket.objectLock.retentionJours}
                    onChange={() => {}}
                    min={1}
                    max={3650}
                    step={1}
                    unite="jours"
                  />
                  <Field label="Mode de rétention">
                    <Select defaultValue="conformite">
                      <option value="gouvernance">
                        Gouvernance — un rôle privilégié peut lever la rétention
                      </option>
                      <option value="conformite">
                        Conformité — personne ne peut lever la rétention (recommandé)
                      </option>
                    </Select>
                  </Field>
                </>
              )}
            </div>

            {bucket.objectLock?.actif && (
              <div className="mt-4 grid gap-3 border-t border-g-100 pt-4 sm:grid-cols-3">
                <StatTile
                  libelle="Objets sous rétention"
                  valeur={num(Math.round(bucket.objets * 0.92))}
                  ton="ok"
                />
                <StatTile
                  libelle="Rétention en cours"
                  valeur={bucket.objectLock.retentionJours}
                  unite="jours"
                />
                <StatTile
                  libelle="Mode"
                  valeur="Conformité"
                  detail="Non contournable"
                  ton="ok"
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Réplication */}
      {onglet === 'replication' && (
        <Card>
          <CardHeader
            titre="Réplication inter-site"
            actions={
              bucket.replication ? (
                <Badge tone="ok" dot>
                  Active vers {bucket.replication.cible}
                </Badge>
              ) : (
                <Badge tone="neutral">Inactive</Badge>
              )
            }
          />
          <Switch
            checked={Boolean(bucket.replication)}
            label={`Répliquer vers ${bucket.region === 'ABJ' ? 'Grand-Bassam' : 'Abidjan'}`}
            description="Réplication asynchrone de chaque nouvel objet vers le second site. Le trafic inter-site n’est pas facturé ; seul le stockage de la copie l’est."
          />
          {bucket.replication ? (
            <>
              <KeyValueList
                className="mt-4"
                colonnes={2}
                items={[
                  { cle: 'Bucket cible', valeur: <span className="font-mono">{bucket.nom.replace(bucket.region.toLowerCase(), bucket.replication.cible.toLowerCase())}</span> },
                  { cle: 'Région cible', valeur: bucket.replication.cible },
                  { cle: 'Mode', valeur: 'Asynchrone, à l’écriture' },
                  { cle: 'Retard moyen', valeur: '18 secondes' },
                  { cle: 'Objets répliqués', valeur: num(Math.round(bucket.objets * 0.998)) },
                  { cle: 'En attente', valeur: num(Math.round(bucket.objets * 0.002)) },
                ]}
              />
              <Callout ton="ok" className="mt-4" titre="Vous satisfaites la règle « une copie hors site »">
                La réplication vers {bucket.replication.cible} constitue la troisième copie de la
                règle 3-2-1, sur un site physiquement distinct. C’est ce qui apparaît en pastille
                verte dans le tableau de conformité.
              </Callout>
            </>
          ) : (
            <Callout ton="warn" className="mt-4" titre="Aucune copie hors site">
              Sans réplication, une défaillance majeure du site {bucket.region} emporte ce bucket. Si
              ce bucket contient des sauvegardes, la réplication est indispensable pour satisfaire la
              règle 3-2-1.
            </Callout>
          )}
        </Card>
      )}

      {/* Clés */}
      {onglet === 'cles' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Clés d’accès ayant une portée sur ce bucket"
              actions={
                <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
                  <Button size="sm" iconBefore={<KeyRound size={13} />}>
                    Créer une clé
                  </Button>
                </GatedAction>
              }
            />
            <div className="space-y-2">
              {CLES_S3.filter(
                (c) => c.portee.includes(bucket.nom) || c.portee.includes('tous les buckets'),
              ).map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-[12.5px] font-semibold text-ink">
                      {c.nom}
                    </span>
                    <span className="block text-[11px] text-g-500">
                      {c.portee} · créée le {c.creee} · dernière utilisation{' '}
                      {dateHeure(c.derniereUtilisation)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <IconButton label="Faire tourner la clé" size="sm">
                      <RotateCw size={13} />
                    </IconButton>
                    <IconButton label="Révoquer la clé" size="sm">
                      <Trash2 size={13} className="text-err" />
                    </IconButton>
                  </span>
                </div>
              ))}
            </div>
            <Callout ton="info" className="mt-4" titre="La valeur secrète n’est affichée qu’une fois">
              À la création, le secret est affiché une seule fois : si vous le perdez, il faut créer
              une nouvelle clé. Ce n’est pas une contrainte arbitraire — un secret récupérable est un
              secret compromis dès qu’un accès en lecture au portail est obtenu.
            </Callout>
          </Card>

          <Card>
            <CardHeader titre="Exemple d’utilisation" />
            <CodeBlock
              langue="bash"
              code={`export AWS_ACCESS_KEY_ID="SYN…"
export AWS_SECRET_ACCESS_KEY="…"

aws --endpoint-url https://s3.${bucket.region.toLowerCase()}.synelia.cloud \\
  s3 ls s3://${bucket.nom}/ --recursive --human-readable --summarize`}
            />
          </Card>
        </div>
      )}

      {/* Journaux */}
      {onglet === 'journaux' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Journaux d’accès"
              actions={
                <Switch
                  checked={bucket.accessLogs}
                  label=""
                />
              }
            />
            {bucket.accessLogs ? (
              <LogPeek lignes={LOGS_EXECUTION} max={20} titre="Requêtes récentes sur ce bucket" />
            ) : (
              <Callout ton="warn" titre="Journaux d’accès désactivés">
                Sans journalisation, aucune trace des lectures et écritures sur ce bucket n’est
                conservée. Activez-la sur tout bucket contenant des sauvegardes ou des données
                sensibles : c’est ce qui permet de reconstituer un incident après coup.
              </Callout>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
