'use client'

import { useState } from 'react'
import { Download, Lock, Play, RotateCcw, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateCourte, dateHeure, relatif } from '@/lib/format'
import { SITE_LABEL } from '@/lib/types'
import { hebergementById, sauvegardeWebById } from '@/lib/mock'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { PageHeader, Card, CardHeader, Callout, KeyValueList } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { Stepper } from '@/components/composition/flow'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'executions', label: 'Exécutions' },
  { id: 'plan', label: 'Réglages du plan' },
  { id: 'restauration', label: 'Restaurer' },
]

const ETAPES = [
  { numero: 1, titre: 'Quoi' },
  { numero: 2, titre: 'Quand' },
  { numero: 3, titre: 'Où' },
  { numero: 4, titre: 'Récapitulatif' },
]

export function VueSauvegarde({ id }: { id: string }) {
  const { autorise, refus, lancer } = useApp()
  const [onglet, setOnglet] = useState('executions')
  const [etape, setEtape] = useState(1)
  const [immuable, setImmuable] = useState(true)

  const p = sauvegardeWebById(id)
  if (!p) return null
  const h = hebergementById(p.hebergementId)
  const dernier = p.executions[0]

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Backup', href: '/app/web/backup' },
          { label: p.nomServi },
        ]}
        titre={<span className="break-words font-mono">{p.nomServi}</span>}
        sousTitre={`Plan de sauvegarde de ${p.serveur}. Une exécution prend les fichiers, les bases, la configuration${p.perimetre.messagerie ? ' et la messagerie' : ''} en une seule passe cohérente.`}
        meta={
          <>
            <Badge tone={p.actif ? 'ok' : 'neutral'} dot={p.actif}>
              {p.actif ? 'Actif' : 'Suspendu'}
            </Badge>
            <Badge tone="neutral">{p.frequence} à {p.heure}</Badge>
            <Badge tone="neutral">Rétention {p.retentionJours} j</Badge>
            {p.immuable && (
              <Badge tone="ok">
                <Lock size={10} className="mr-1 inline" />
                Immuable
              </Badge>
            )}
            <Badge tone="violet">{SITE_LABEL[p.site]}</Badge>
          </>
        }
        actions={
          <>
            <GatedAction autorise={autorise('backup.manage')} message={refus('backup.manage')}>
              <Button
                variant="secondary"
                iconBefore={<Play size={14} />}
                onClick={() => lancer('web.backup.run', p.serveur)}
              >
                Sauvegarder maintenant
              </Button>
            </GatedAction>
            {h && (
              <ButtonLink href={`/app/web/hebergement/${h.id}`} variant="ghost">
                Le serveur
              </ButtonLink>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          libelle="Dernière exécution"
          valeur={dernier ? relatif(dernier.ts) : '—'}
          detail={dernier?.taille}
          ton={dernier?.statut === 'ok' ? 'ok' : 'warn'}
        />
        <StatTile
          libelle="Espace conservé"
          valeur={`${p.espaceOccupeGo.toFixed(1)} Go`}
          detail={`${p.executions.length} copies sous rétention`}
        />
        <StatTile
          libelle="Point de restauration le plus ancien"
          valeur={p.executions.length > 0 ? dateCourte(p.executions[p.executions.length - 1].ts) : '—'}
        />
        <StatTile
          libelle="Dernier test de restauration"
          valeur={p.dernierTestRestauration ? dateCourte(p.dernierTestRestauration.date) : 'jamais'}
          detail={
            p.dernierTestRestauration ? `${p.dernierTestRestauration.dureeMin} min` : 'à programmer'
          }
          ton={p.dernierTestRestauration?.resultat === 'ok' ? 'ok' : 'warn'}
        />
      </div>

      {!p.dernierTestRestauration && (
        <Callout ton="warn" titre="Aucun test de restauration sur ce plan">
          Une sauvegarde qu’on n’a jamais restaurée est une hypothèse, pas une garantie. Programmez
          un test : il restaure dans un environnement isolé, sans toucher la production.
        </Callout>
      )}

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'executions' && (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr className="border-b border-g-300 bg-g-050">
                  {['Exécution', 'État', 'Taille', 'Durée', 'Contenu', 'Immuable jusqu’au', ''].map(
                    (c) => (
                      <th
                        key={c}
                        className="type-micro px-3 py-2 text-left font-semibold text-g-500"
                      >
                        {c}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {p.executions.map((e) => (
                  <tr key={e.id} className="border-b border-g-100 last:border-0 align-top">
                    <td className="px-3 py-2.5 text-[12px] text-g-700">{dateHeure(e.ts)}</td>
                    <td className="px-3 py-2.5">
                      <Badge
                        tone={e.statut === 'ok' ? 'ok' : e.statut === 'partielle' ? 'warn' : 'err'}
                        size="sm"
                      >
                        {e.statut === 'ok' ? 'OK' : e.statut === 'partielle' ? 'Partielle' : 'Échec'}
                      </Badge>
                      {e.message && (
                        <p className="mt-1 max-w-[46ch] text-[11px] leading-snug text-g-700">
                          {e.message}
                        </p>
                      )}
                    </td>
                    <td className="tnum px-3 py-2.5 text-[12px] text-g-700">{e.taille}</td>
                    <td className="tnum px-3 py-2.5 text-[12px] text-g-700">{e.dureeMin} min</td>
                    <td className="px-3 py-2.5 text-[11.5px] text-g-500">{e.contenu.join(' · ')}</td>
                    <td className="px-3 py-2.5 text-[11.5px] text-g-700">
                      {e.immuableJusqua ? (
                        <span className="flex items-center gap-1">
                          <Lock size={11} className="text-ok" />
                          {e.immuableJusqua}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="ghost" iconBefore={<RotateCcw size={12} />}>
                          Restaurer
                        </Button>
                        <Button size="sm" variant="ghost" iconBefore={<Download size={12} />}>
                          Télécharger
                        </Button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {onglet === 'plan' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Planification"
              sousTitre="L’heure est celle du serveur, à Abidjan. Une exécution quotidienne suffit à la plupart des sites ; au-delà, il faut une réplication."
            />
            <div className="space-y-3">
              <Field label="Fréquence">
                <Select defaultValue={p.frequence}>
                  <option value="quotidienne">Quotidienne</option>
                  <option value="bihebdomadaire">Deux fois par semaine</option>
                  <option value="hebdomadaire">Hebdomadaire</option>
                </Select>
              </Field>
              <Field label="Heure" hint="hors heures de trafic">
                <Input defaultValue={p.heure} />
              </Field>
              <Field label="Rétention" hint="au-delà, les copies sont détruites automatiquement">
                <Select defaultValue={String(p.retentionJours)}>
                  <option value="7">7 jours</option>
                  <option value="14">14 jours</option>
                  <option value="30">30 jours</option>
                  <option value="90">90 jours</option>
                </Select>
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader
              titre="Périmètre et destination"
              sousTitre="Ce qui entre dans l’exécution, et où la copie est écrite."
            />
            <div className="space-y-2">
              {(
                [
                  ['Fichiers du serveur', p.perimetre.fichiers],
                  ['Bases de données', p.perimetre.bases],
                  ['Configuration', p.perimetre.configuration],
                  ['Messagerie', p.perimetre.messagerie],
                ] as const
              ).map(([l, actif]) => (
                <div
                  key={l}
                  className="flex items-center justify-between gap-2 rounded-[6px] border border-g-300 px-3 py-2"
                >
                  <span className="text-[12.5px] text-g-700">{l}</span>
                  <Badge tone={actif ? 'ok' : 'neutral'} size="sm">
                    {actif ? 'Inclus' : 'Exclu'}
                  </Badge>
                </div>
              ))}
            </div>
            <Switch
              className="mt-3"
              label="Copies immuables"
              description="Une copie écrite ne peut plus être altérée avant la fin de sa rétention, même par un compte administrateur compromis."
              checked={immuable}
              onChange={setImmuable}
            />
            <KeyValueList
              className="mt-3 border-t border-g-100 pt-3"
              items={[
                { cle: 'Destination', valeur: p.destination },
                { cle: 'Site de la copie', valeur: SITE_LABEL[p.site] },
                {
                  cle: 'Site du serveur',
                  valeur: h ? SITE_LABEL[h.serveur.site] : '—',
                },
                { cle: 'Chiffrement', valeur: 'AES-256 au repos, TLS en transit' },
              ]}
            />
          </Card>
        </div>
      )}

      {onglet === 'restauration' && (
        <div className="space-y-4">
          <Stepper etapes={ETAPES} courante={etape} />

          <Card>
            {etape === 1 && (
              <>
                <CardHeader
                  titre="Que faut-il restaurer ?"
                  sousTitre="Plus le périmètre est étroit, plus la restauration est rapide et moins elle risque d’écraser du travail récent."
                />
                <div className="space-y-2">
                  {[
                    { l: 'Le serveur entier', d: 'Fichiers, bases et configuration. Pour un sinistre.' },
                    { l: 'Une application', d: 'Les fichiers d’un site et sa base. Le cas le plus courant.' },
                    { l: 'Une base seule', d: 'Restaurée à côté de l’originale, jamais par-dessus.' },
                    { l: 'Des fichiers précis', d: 'Arborescence parcourable, sélection fine.' },
                    ...(p.perimetre.messagerie
                      ? [{ l: 'Une boîte aux lettres', d: 'Un dossier ou la boîte entière.' }]
                      : []),
                  ].map((x) => (
                    <button
                      key={x.l}
                      type="button"
                      className="flex w-full items-start gap-2.5 rounded-[6px] border border-g-300 px-3 py-2.5 text-left transition-colors hover:border-p-400 hover:bg-p-050"
                    >
                      <ShieldCheck size={14} className="mt-0.5 shrink-0 text-p-700" />
                      <span>
                        <span className="block text-[12.5px] font-semibold text-ink">{x.l}</span>
                        <span className="block text-[11.5px] text-g-500">{x.d}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {etape === 2 && (
              <>
                <CardHeader
                  titre="À quel moment ?"
                  sousTitre="Chaque exécution est un point de restauration distinct."
                />
                <div className="space-y-2">
                  {p.executions.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-[6px] border border-g-300 px-3 py-2.5 text-left transition-colors hover:border-p-400 hover:bg-p-050"
                    >
                      <span>
                        <span className="block text-[12.5px] font-semibold text-ink">
                          {dateHeure(e.ts)}
                        </span>
                        <span className="block text-[11.5px] text-g-500">
                          {e.taille} · {e.contenu.join(' · ')}
                        </span>
                      </span>
                      <Badge tone={e.statut === 'ok' ? 'ok' : 'warn'} size="sm">
                        {e.statut === 'ok' ? 'Complète' : 'Partielle'}
                      </Badge>
                    </button>
                  ))}
                </div>
              </>
            )}

            {etape === 3 && (
              <>
                <CardHeader
                  titre="Où écrire la restauration ?"
                  sousTitre="Écrire par-dessus la production est le seul choix irréversible du parcours."
                />
                <div className="space-y-2">
                  {[
                    {
                      l: 'À côté, sur le même serveur',
                      d: 'Recommandé. Vous comparez, puis vous basculez vous-même.',
                      ton: 'ok' as const,
                    },
                    {
                      l: 'Sur un autre hébergement',
                      d: 'Utile pour reconstruire sans toucher au serveur d’origine.',
                      ton: 'neutral' as const,
                    },
                    {
                      l: 'Par-dessus la production',
                      d: 'Écrase les données actuelles. Demande la saisie du nom du serveur.',
                      ton: 'err' as const,
                    },
                    {
                      l: 'Téléchargement local',
                      d: 'Archive chiffrée, lien valable 24 heures.',
                      ton: 'neutral' as const,
                    },
                  ].map((x) => (
                    <button
                      key={x.l}
                      type="button"
                      className={cn(
                        'flex w-full items-start justify-between gap-2 rounded-[6px] border px-3 py-2.5 text-left transition-colors',
                        x.ton === 'err'
                          ? 'border-err/40 hover:bg-err-bg'
                          : 'border-g-300 hover:border-p-400 hover:bg-p-050',
                      )}
                    >
                      <span>
                        <span className="block text-[12.5px] font-semibold text-ink">{x.l}</span>
                        <span className="block text-[11.5px] text-g-500">{x.d}</span>
                      </span>
                      {x.ton === 'err' && (
                        <Badge tone="err" size="sm">
                          Irréversible
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {etape === 4 && (
              <>
                <CardHeader
                  titre="Récapitulatif"
                  sousTitre="Relisez avant de lancer : une restauration est une opération d’exploitation, pas un clic."
                />
                <KeyValueList
                  items={[
                    { cle: 'Périmètre', valeur: 'Une application — boutique.dba.africa' },
                    {
                      cle: 'Point de restauration',
                      valeur: dernier ? dateHeure(dernier.ts) : '—',
                    },
                    { cle: 'Destination', valeur: 'À côté, sur le même serveur' },
                    { cle: 'Durée estimée', valeur: '6 à 9 minutes' },
                    { cle: 'Impact sur la production', valeur: 'Aucun' },
                  ]}
                />
                <GatedAction autorise={autorise('backup.restore')} message={refus('backup.restore')}>
                  <Button
                    className="mt-4"
                    onClick={() => lancer('web.backup.restore', p.serveur)}
                  >
                    Lancer la restauration
                  </Button>
                </GatedAction>
              </>
            )}

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-g-100 pt-4">
              <Button
                variant="ghost"
                size="sm"
                disabled={etape === 1}
                onClick={() => setEtape((e) => Math.max(1, e - 1))}
              >
                Précédent
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={etape === 4}
                onClick={() => setEtape((e) => Math.min(4, e + 1))}
              >
                Suivant
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
