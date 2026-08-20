'use client'

import { Plus } from 'lucide-react'
import { goHumain, money, num } from '@/lib/format'
import type { Volume } from '@/lib/types'
import { VOLUMES } from '@/lib/mock'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { PageHeader, Card, Callout } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { DataTable, type Colonne } from '@/components/composition/data-table'
import { useApp, useEspace } from '@/components/app/contexte'

const PRIX_GO: Record<Volume['classe'], number> = {
  nvme: 5.4,
  ssd: 3.2,
  hdd: 1.1,
  archive: 0.32,
}

const LIBELLE_CLASSE: Record<Volume['classe'], string> = {
  nvme: 'NVMe · 12 000 IOPS',
  ssd: 'SSD · 6 000 IOPS',
  hdd: 'HDD · 900 IOPS',
  archive: 'Archive · accès rare',
}

export default function Stockage() {
  const espace = useEspace()
  const { autorise, refus } = useApp()
  const volumes = VOLUMES.filter((v) => v.espaceId === espace.id)
  const total = volumes.reduce((a, v) => a + v.tailleGo, 0)
  const cout = volumes.reduce((a, v) => a + Math.round(v.tailleGo * PRIX_GO[v.classe]), 0)

  const colonnes: Array<Colonne<Volume>> = [
    {
      id: 'nom',
      entete: 'Volume',
      cle: (v) => v.nom,
      rendu: (v) => (
        <span className="block">
          <span className="block font-mono text-[12.5px] font-semibold text-ink">{v.nom}</span>
          {v.ephemere && (
            <Badge tone="warn" size="sm" className="mt-0.5">
              Éphémère
            </Badge>
          )}
        </span>
      ),
    },
    {
      id: 'taille',
      entete: 'Taille',
      aligne: 'right',
      cle: (v) => v.tailleGo,
      rendu: (v) => goHumain(v.tailleGo),
    },
    {
      id: 'classe',
      entete: 'Classe',
      cle: (v) => v.classe,
      rendu: (v) => (
        <span className="block">
          <Badge tone="neutral" size="sm">
            {v.classe.toUpperCase()}
          </Badge>
          <span className="mt-0.5 block text-[11px] text-g-500">{LIBELLE_CLASSE[v.classe]}</span>
        </span>
      ),
    },
    {
      id: 'iops',
      entete: 'IOPS',
      aligne: 'right',
      cle: (v) => v.iops,
      rendu: (v) => num(v.iops),
      masquable: true,
    },
    {
      id: 'chiffre',
      entete: 'Chiffrement',
      cle: (v) => (v.chiffre ? 1 : 0),
      rendu: (v) => (
        <Badge tone={v.chiffre ? 'ok' : 'warn'} size="sm">
          {v.chiffre ? 'Au repos' : 'Aucun'}
        </Badge>
      ),
    },
    {
      id: 'attache',
      entete: 'Machine attachée',
      cle: (v) => v.attachedLabel ?? '',
      rendu: (v) =>
        v.attachedLabel ? (
          <span className="font-mono text-[12px] text-ink">{v.attachedLabel}</span>
        ) : (
          <span className="text-[12px] text-g-500">détaché</span>
        ),
    },
    {
      id: 'montage',
      entete: 'Point de montage',
      cle: (v) => v.montage ?? '',
      rendu: (v) => (
        <span className="font-mono text-[11.5px] text-g-700">{v.montage ?? '—'}</span>
      ),
      masquable: true,
    },
    {
      id: 'cout',
      entete: 'Coût mensuel',
      aligne: 'right',
      cle: (v) => v.tailleGo * PRIX_GO[v.classe],
      rendu: (v) => money(Math.round(v.tailleGo * PRIX_GO[v.classe])),
    },
    {
      id: 'actions',
      entete: '',
      aligne: 'right',
      rendu: (v) => (
        <span className="flex justify-end gap-1">
          <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
            <Button size="sm" variant="ghost">
              Étendre
            </Button>
          </GatedAction>
          <Button size="sm" variant="ghost">
            {v.attachedTo ? 'Détacher' : 'Attacher'}
          </Button>
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: espace.code, href: `/app/espaces/${espace.id}` },
          { label: 'Stockage' },
        ]}
        titre="Volumes"
        sousTitre="Des disques attachables, extensibles à chaud, chiffrés au repos. Séparer les données du disque système permet de les déplacer, de les sauvegarder et de les étendre indépendamment."
        actions={
          <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
            <Button iconBefore={<Plus size={14} />}>Créer un volume</Button>
          </GatedAction>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <StatTile libelle="Volumes" valeur={volumes.length} />
        <StatTile libelle="Capacité allouée" valeur={goHumain(total)} />
        <StatTile
          libelle="Attachés"
          valeur={volumes.filter((v) => v.attachedTo).length}
          ton="ok"
          detail={`${volumes.filter((v) => !v.attachedTo).length} détaché(s), facturé(s)`}
        />
        <StatTile
          libelle="Chiffrés"
          valeur={`${volumes.filter((v) => v.chiffre).length}/${volumes.length}`}
          ton={volumes.every((v) => v.chiffre) ? 'ok' : 'warn'}
        />
        <StatTile libelle="Coût mensuel" valeur={money(cout).replace(' FCFA', '')} unite="FCFA" />
      </div>

      <DataTable
        lignes={volumes}
        colonnes={colonnes}
        placeholderRecherche="Rechercher un volume ou un point de montage…"
        filtres={[
          {
            id: 'classe',
            libelle: 'Classe',
            options: (['nvme', 'ssd', 'hdd', 'archive'] as const).map((c) => ({
              value: c,
              label: c.toUpperCase(),
            })),
          },
          {
            id: 'attache',
            libelle: 'Attachement',
            options: [
              { value: 'oui', label: 'Attaché' },
              { value: 'non', label: 'Détaché' },
            ],
          },
        ]}
        selection={(v, id, val) =>
          id === 'classe' ? v.classe === val : val === 'oui' ? Boolean(v.attachedTo) : !v.attachedTo
        }
        exportable
        actionsGroupees={(ids) => (
          <>
            <Button size="sm" variant="secondary">
              Créer un snapshot ({ids.length})
            </Button>
            <Button size="sm" variant="secondary">
              Appliquer un plan de sauvegarde
            </Button>
          </>
        )}
        vide={{
          titre: 'Aucun volume dans cet espace',
          phrase:
            'Un volume est un disque indépendant du système. Il s’étend à chaud, se déplace d’une machine à l’autre, et se sauvegarde séparément.',
          action: { libelle: 'Créer un volume', href: '#' },
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="type-micro mb-3 text-g-500">Grille tarifaire des classes</p>
          <div className="space-y-2">
            {(['nvme', 'ssd', 'hdd', 'archive'] as const).map((c) => (
              <div
                key={c}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-g-300 px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-semibold text-ink">
                    {c.toUpperCase()}
                  </span>
                  <span className="block text-[11px] text-g-500">{LIBELLE_CLASSE[c]}</span>
                </span>
                <span className="tnum shrink-0 text-[12.5px] font-semibold text-p-700">
                  {money(Math.round(PRIX_GO[c] * 1000))}/To/mois
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Callout ton="warn" titre="Les volumes détachés restent facturés">
          {volumes.filter((v) => !v.attachedTo).length > 0
            ? `${volumes.filter((v) => !v.attachedTo).map((v) => v.nom).join(', ')} n’est attaché à aucune machine mais continue d’occuper — et de facturer — sa capacité. C’est voulu : détacher un volume ne détruit pas ses données. Si vous n’en avez plus besoin, créez d’abord un snapshot, puis supprimez le volume.`
            : 'Tous vos volumes sont attachés. Un volume détaché conserve ses données et reste facturé : c’est ce qui permet de le déplacer d’une machine à l’autre sans risque.'}
        </Callout>
      </div>

      <Callout ton="violet" titre="Extension à chaud, mais pas réduction">
        L’extension d’un volume est instantanée et sans interruption : la nouvelle capacité apparaît
        immédiatement côté hyperviseur, il reste à étendre le système de fichiers dans l’invité
        (<span className="font-mono text-[12px]">resize2fs</span> ou{' '}
        <span className="font-mono text-[12px]">xfs_growfs</span>). La réduction n’est pas
        supportée — c’est une limitation générale du stockage bloc, pas une restriction Synelia.
      </Callout>
    </div>
  )
}
