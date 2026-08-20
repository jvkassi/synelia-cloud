'use client'

import Link from 'next/link'
import { KeyRound, Plus, RotateCw, Trash2 } from 'lucide-react'
import { goHumain, money, num } from '@/lib/format'
import type { Bucket } from '@/lib/types'
import { BUCKETS, CLES_S3 } from '@/lib/mock'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { CodeBlock, GatedAction } from '@/components/ui/display'
import { PageHeader, Card, CardHeader, Callout } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { DataTable, type Colonne } from '@/components/composition/data-table'
import { useApp } from '@/components/app/contexte'

const PRIX_GO = { chaud: 1.5, froid: 0.62 }

export default function StockageObjet() {
  const { autorise, refus } = useApp()
  const total = BUCKETS.reduce((a, b) => a + b.tailleGo, 0)
  const objets = BUCKETS.reduce((a, b) => a + b.objets, 0)
  const cout = BUCKETS.reduce((a, b) => a + Math.round(b.tailleGo * PRIX_GO[b.classe]), 0)

  const colonnes: Array<Colonne<Bucket>> = [
    {
      id: 'nom',
      entete: 'Bucket',
      cle: (b) => b.nom,
      rendu: (b) => (
        <span className="block">
          {/* Pas de lien ici : le DataTable enveloppe déjà la première colonne
              dans le lien de la ligne, et deux <a> imbriqués sont du HTML
              invalide — React refuse alors d'hydrater la table. */}
          <span className="block font-mono text-[12.5px] font-semibold text-ink">{b.nom}</span>
          <span className="block text-[11px] text-g-500">
            {b.policy === 'prive'
              ? 'Privé'
              : b.policy === 'lecture_publique'
                ? 'Lecture publique'
                : 'Politique JSON'}
          </span>
        </span>
      ),
    },
    {
      id: 'region',
      entete: 'Région',
      cle: (b) => b.region,
      rendu: (b) => (
        <Badge tone="neutral" size="sm">
          {b.region}
        </Badge>
      ),
    },
    {
      id: 'classe',
      entete: 'Classe',
      cle: (b) => b.classe,
      rendu: (b) => (
        <Badge tone={b.classe === 'chaud' ? 'violet' : 'neutral'} size="sm">
          {b.classe === 'chaud' ? 'Chaude' : 'Froide'}
        </Badge>
      ),
    },
    {
      id: 'taille',
      entete: 'Taille',
      aligne: 'right',
      cle: (b) => b.tailleGo,
      rendu: (b) => goHumain(b.tailleGo),
    },
    {
      id: 'objets',
      entete: 'Objets',
      aligne: 'right',
      cle: (b) => b.objets,
      rendu: (b) => num(b.objets),
    },
    {
      id: 'versioning',
      entete: 'Versioning',
      cle: (b) => (b.versioning ? 1 : 0),
      rendu: (b) => (
        <Badge tone={b.versioning ? 'ok' : 'neutral'} size="sm">
          {b.versioning ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      id: 'worm',
      entete: 'Verrouillage d’objet',
      cle: (b) => (b.objectLock?.actif ? 1 : 0),
      rendu: (b) =>
        b.objectLock?.actif ? (
          <Badge tone="ok" size="sm">
            WORM {b.objectLock.retentionJours} j
          </Badge>
        ) : (
          <Badge tone="neutral" size="sm">
            Non
          </Badge>
        ),
    },
    {
      id: 'replication',
      entete: 'Réplication',
      rendu: (b) =>
        b.replication ? (
          <Badge tone="violet" size="sm">
            → {b.replication.cible}
          </Badge>
        ) : (
          <span className="text-[12px] text-g-500">aucune</span>
        ),
      masquable: true,
    },
    {
      id: 'cout',
      entete: 'Coût mensuel',
      aligne: 'right',
      cle: (b) => b.tailleGo * PRIX_GO[b.classe],
      rendu: (b) => money(Math.round(b.tailleGo * PRIX_GO[b.classe])),
    },
    {
      id: 'actions',
      entete: '',
      aligne: 'right',
      rendu: (b) => (
        <Link
          href={`/app/objet/${b.id}`}
          className="text-[12px] font-semibold text-p-700 hover:text-m-600"
        >
          Ouvrir →
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Stockage objet S3' }]}
        titre="Stockage objet"
        sousTitre="Compatible avec l’API S3 : vos outils existants fonctionnent en changeant simplement l’endpoint. Le verrouillage d’objet WORM est la seule protection qui résiste à une compromission de compte administrateur."
        actions={
          <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
            <Button iconBefore={<Plus size={14} />}>Créer un bucket</Button>
          </GatedAction>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile libelle="Buckets" valeur={BUCKETS.length} />
        <StatTile libelle="Volume stocké" valeur={goHumain(total)} />
        <StatTile libelle="Objets" valeur={num(objets)} />
        <StatTile
          libelle="Buckets protégés WORM"
          valeur={BUCKETS.filter((b) => b.objectLock?.actif).length}
          ton="ok"
          detail="Anti-rançongiciel"
        />
        <StatTile libelle="Coût mensuel" valeur={money(cout).replace(' FCFA', '')} unite="FCFA" />
      </div>

      <DataTable
        lignes={BUCKETS}
        colonnes={colonnes}
        placeholderRecherche="Rechercher un bucket…"
        filtres={[
          {
            id: 'region',
            libelle: 'Région',
            options: [
              { value: 'ABJ', label: 'Abidjan' },
              { value: 'GBM', label: 'Grand-Bassam' },
            ],
          },
          {
            id: 'classe',
            libelle: 'Classe',
            options: [
              { value: 'chaud', label: 'Chaude' },
              { value: 'froid', label: 'Froide' },
            ],
          },
        ]}
        selection={(b, id, v) => (id === 'region' ? b.region === v : b.classe === v)}
        href={(b) => `/app/objet/${b.id}`}
        exportable
        vide={{
          titre: 'Aucun bucket',
          phrase:
            'Un bucket de stockage objet accueille sauvegardes, médias, exports et archives, avec versioning et verrouillage WORM.',
          action: { libelle: 'Créer un bucket', href: '#' },
        }}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            titre="Clés d’accès"
            sousTitre="La valeur secrète n’est affichée qu’une seule fois, à la création."
            actions={
              <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
                <Button size="sm" iconBefore={<KeyRound size={13} />}>
                  Créer une clé
                </Button>
              </GatedAction>
            }
          />
          <div className="space-y-2">
            {CLES_S3.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block font-mono text-[12.5px] font-semibold text-ink">
                    {c.nom}
                  </span>
                  <span className="block text-[11px] text-g-500">
                    Portée : {c.portee} · créée le {c.creee}
                  </span>
                  <span className="block text-[11px] text-g-500">
                    Dernière utilisation : {c.derniereUtilisation.slice(0, 10)}
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
          <p className="mt-3 border-t border-g-100 pt-3 text-[11.5px] leading-relaxed text-g-500">
            Donnez à chaque usage sa propre clé, avec la portée la plus étroite possible. Une clé
            d’écriture sur le bucket de sauvegarde ne doit jamais pouvoir supprimer d’objet — le
            verrouillage WORM l’en empêche de toute façon.
          </p>
        </Card>

        <Card>
          <CardHeader
            titre="Compatibilité S3"
            sousTitre="Changez l’endpoint, rien d’autre."
          />
          <CodeBlock
            langue="bash"
            code={`# Configuration aws-cli
aws configure set aws_access_key_id     "SYN…"
aws configure set aws_secret_access_key "…"
aws configure set region                "abj"

export S3_ENDPOINT="https://s3.abj.synelia.cloud"

# Lister les buckets
aws --endpoint-url $S3_ENDPOINT s3 ls

# Synchroniser un dossier
aws --endpoint-url $S3_ENDPOINT s3 sync ./exports \\
  s3://dba-exports-reversibilite/2026-08/

# rclone fonctionne également
rclone copy ./medias synelia:dba-medias-publics --progress`}
          />
          <p className="mt-3 text-[11.5px] leading-relaxed text-g-500">
            La compatibilité couvre les opérations sur les objets, le versioning, le cycle de vie, le
            verrouillage d’objet et les téléversements multipartites. Endpoints :{' '}
            <span className="font-mono">s3.abj.synelia.cloud</span> et{' '}
            <span className="font-mono">s3.gbm.synelia.cloud</span>.
          </p>
        </Card>
      </div>

      <Callout ton="violet" titre="Le verrouillage WORM, expliqué sans détour">
        Une fois la rétention posée sur un objet, ni vous, ni nos administrateurs, ni un attaquant
        ayant obtenu vos droits ne peuvent la raccourcir ou supprimer l’objet avant son expiration.
        C’est contraignant — et c’est précisément l’intérêt. Un rançongiciel qui chiffre vos serveurs
        et tente d’effacer vos sauvegardes échoue sur un bucket verrouillé. Aucune autre mesure ne
        garantit cela.
      </Callout>
    </div>
  )
}
