'use client'


import { useMemo, useState } from 'react'
import {
  Clock,
  Download,
  FileCode,
  History,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateHeure, duree, num } from '@/lib/format'
import { MODELES_DNS, ZONES_DNS } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink, IconButton } from '@/components/ui/button'
import { CodeBlock, CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, MonoTextarea, Select, Switch } from '@/components/ui/field'
import { ConfirmDialog, Drawer, Modal, Tooltip } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { useApp } from '@/components/app/contexte'
import type { DnsZone } from '@/lib/types'

const ONGLETS = [
  { id: 'enregistrements', label: 'Enregistrements' },
  { id: 'modeles', label: 'Modèles rapides' },
  { id: 'dnssec', label: 'DNSSEC' },
  { id: 'serveurs', label: 'Serveurs de noms' },
  { id: 'brut', label: 'Fichier de zone' },
]

const TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'CAA', 'NS'] as const

const EXPLICATIONS: Record<string, string> = {
  A: 'Pointe un nom vers une adresse IPv4. C’est l’enregistrement le plus courant.',
  AAAA: 'Même rôle que A, mais pour une adresse IPv6.',
  CNAME: 'Alias vers un autre nom. Interdit sur l’apex du domaine (@) par la norme.',
  MX: 'Désigne les serveurs qui reçoivent le courrier. La priorité la plus basse est essayée d’abord.',
  TXT: 'Texte libre. Utilisé pour SPF, DKIM, DMARC et les vérifications de propriété.',
  SRV: 'Localise un service en indiquant son hôte et son port. Utilisé par la téléphonie et la messagerie instantanée.',
  CAA: 'Restreint les autorités autorisées à émettre un certificat pour ce domaine.',
  NS: 'Délègue un sous-domaine à d’autres serveurs de noms.',
}

export function EditeurZone({ zoneId }: { zoneId: string }) {
  const { autorise, refus, lancer } = useApp()
  const [onglet, setOnglet] = useState('enregistrements')
  const [filtre, setFiltre] = useState<string>('tous')
  const [q, setQ] = useState('')
  const [edition, setEdition] = useState<string | null>(null)
  const [ajout, setAjout] = useState(false)
  const [modele, setModele] = useState<string | null>(null)
  const [suppression, setSuppression] = useState<{ nom: string; type: string } | null>(null)

  const zone = ZONES_DNS.find((z) => z.id === zoneId) as DnsZone
  const domaines = ZONES_DNS.map((z) => z.domaine)

  const lignes = useMemo(() => {
    let out = zone.enregistrements
    if (filtre !== 'tous') out = out.filter((r) => r.type === filtre)
    if (q.trim()) {
      const n = q.trim().toLowerCase()
      out = out.filter(
        (r) => r.nom.toLowerCase().includes(n) || r.valeur.toLowerCase().includes(n),
      )
    }
    return out
  }, [zone.enregistrements, filtre, q])

  const enEdition = zone.enregistrements.find((r) => r.id === edition)

  const fichierZone = [
    `$ORIGIN ${zone.domaine}.`,
    `$TTL 3600`,
    '',
    ...zone.ns.map((n) => `@\t3600\tIN\tNS\t${n}.`),
    '',
    ...zone.enregistrements.map(
      (r) =>
        `${r.nom === '@' ? '@' : r.nom}\t${r.ttl}\tIN\t${r.type}\t${r.priorite !== undefined ? `${r.priorite} ` : ''}${r.type === 'TXT' ? `"${r.valeur}"` : r.valeur}`,
    ),
  ].join('\n')

  return (
    <div className="space-y-5">

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          libelle="Enregistrements"
          valeur={zone.enregistrements.length}
          detail={`${new Set(zone.enregistrements.map((r) => r.type)).size} types différents`}
        />
        <StatTile
          libelle="TTL le plus court"
          valeur={duree(Math.min(...zone.enregistrements.map((r) => r.ttl)))}
          detail="Délai de propagation d’un changement"
        />
        <StatTile
          libelle="Requêtes 24 h"
          valeur={num(184_920)}
          detail="Sur les trois serveurs de noms"
        />
        <StatTile
          libelle="DNSSEC"
          valeur={zone.dnssec ? 'Actif' : 'Inactif'}
          ton={zone.dnssec ? 'ok' : 'warn'}
          detail={zone.dnssec ? 'Chaîne de confiance validée' : 'Zone falsifiable en chemin'}
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'enregistrements' && (
        <Card padding={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-g-100 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filtrer par nom ou valeur…"
                className="w-56"
              />
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setFiltre('tous')}
                  className={cn(
                    'rounded-[5px] px-2 py-1 text-[11.5px] font-semibold transition-colors',
                    filtre === 'tous' ? 'bg-p-700 text-white' : 'bg-g-050 text-g-700 hover:bg-g-100',
                  )}
                >
                  Tous
                </button>
                {[...new Set(zone.enregistrements.map((r) => r.type))].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFiltre(t)}
                    className={cn(
                      'rounded-[5px] px-2 py-1 font-mono text-[11.5px] font-semibold transition-colors',
                      filtre === t ? 'bg-p-700 text-white' : 'bg-g-050 text-g-700 hover:bg-g-100',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {/*
              Les quatre issues de secours d'un opérateur de zone : régler le TTL
              par défaut plutôt que ligne par ligne, coller un fichier de zone
              entier, relire ce qui a changé, et revenir en arrière. Sans elles,
              corriger dix-neuf enregistrements se fait à la souris.
            */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button size="sm" variant="ghost" iconBefore={<Clock size={12} />}>
                TTL par défaut
              </Button>
              <Button size="sm" variant="ghost" iconBefore={<FileCode size={12} />}>
                Mode textuel
              </Button>
              <Button size="sm" variant="ghost" iconBefore={<History size={12} />}>
                Historique
              </Button>
              <Button size="sm" variant="ghost" iconBefore={<Download size={12} />}>
                Exporter
              </Button>
              <Button size="sm" variant="ghost" iconBefore={<Upload size={12} />}>
                Importer
              </Button>
              <Button size="sm" variant="ghost" iconBefore={<RotateCcw size={12} />}>
                Réinitialiser
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr className="border-b border-g-300 bg-g-050">
                  {['Type', 'Nom', 'Valeur', 'TTL', 'Priorité', ''].map((h) => (
                    <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignes.map((r) => (
                  <tr key={`${r.type}-${r.nom}-${r.valeur}`} className="border-b border-g-100 last:border-0">
                    <td className="px-3 py-2">
                      <Tooltip content={EXPLICATIONS[r.type] ?? r.type}>
                        <Badge tone="violet" size="sm">
                          {r.type}
                        </Badge>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2 font-mono text-[12px] font-semibold text-ink">
                      {r.nom}
                    </td>
                    <td className="max-w-[42ch] truncate px-3 py-2 font-mono text-[11.5px] text-g-700">
                      {r.valeur}
                    </td>
                    <td className="tnum px-3 py-2 text-[11.5px] text-g-500">{r.ttl}</td>
                    <td className="tnum px-3 py-2 text-[11.5px] text-g-500">
                      {r.priorite ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="flex items-center justify-end gap-1">
                        <GatedAction
                          autorise={autorise('network.manage')}
                          message={refus('network.manage')}
                        >
                          <IconButton
                            label="Modifier"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEdition(r.id)}
                          >
                            <Pencil size={12} />
                          </IconButton>
                        </GatedAction>
                        <GatedAction
                          autorise={autorise('network.manage')}
                          message={refus('network.manage')}
                        >
                          <IconButton
                            label="Supprimer"
                            size="sm"
                            variant="ghost"
                            onClick={() => setSuppression({ nom: r.nom, type: r.type })}
                          >
                            <Trash2 size={12} />
                          </IconButton>
                        </GatedAction>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lignes.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-[12.5px] text-g-500">
                Aucun enregistrement ne correspond à ce filtre.
              </p>
            </div>
          )}

          <div className="border-t border-g-100 px-4 py-3">
            <p className="text-[11.5px] leading-relaxed text-g-500">
              Un changement est publié sur les trois serveurs de noms en moins de dix secondes. Le
              temps qu’il devienne visible partout dépend du TTL de l’enregistrement modifié — un TTL
              de 3 600 secondes signifie qu’un résolveur peut encore servir l’ancienne valeur pendant
              une heure.
            </p>
          </div>
        </Card>
      )}

      {onglet === 'modeles' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {MODELES_DNS.map((m) => (
            <Card key={m.id} hover className="flex flex-col">
              <CardHeader
                titre={m.nom}
                sousTitre={m.description}
                actions={<Wand2 size={15} className="text-m-600" />}
              />
              <MicroLabel className="mb-1.5">Enregistrements créés</MicroLabel>
              <ul className="space-y-1">
                {m.enregistrements.map((e) => (
                  <li
                    key={e}
                    className="rounded-[5px] bg-g-050 px-2.5 py-1.5 font-mono text-[11px] text-ink"
                  >
                    {e}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-3.5">
                <GatedAction
                  autorise={autorise('network.manage')}
                  message={refus('network.manage')}
                >
                  <Button size="sm" variant="secondary" onClick={() => setModele(m.id)}>
                    Appliquer ce modèle
                  </Button>
                </GatedAction>
              </div>
            </Card>
          ))}
        </div>
      )}

      {onglet === 'dnssec' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Signature de la zone"
              sousTitre="DNSSEC signe cryptographiquement vos réponses DNS : un résolveur peut vérifier qu’elles n’ont pas été falsifiées en chemin."
            />
            <Switch
              checked={zone.dnssec}
              label="DNSSEC"
              description="Nous gérons les clés, leur rotation et la publication de l’enregistrement DS auprès du registre. Aucune manipulation de clé de votre côté."
            />
            {zone.dnssec ? (
              <>
                <div className="mt-4 space-y-3 border-t border-g-100 pt-4">
                  <CopyField
                    label="Enregistrement DS publié au registre"
                    value="34291 13 2 8f2a91c4d7b0e5443a17c96e2f0d8b4144ba1e9f029e3c8d1a751b74e0aa93c0"
                  />
                  <KeyValueList
                    colonnes={1}
                    items={[
                      { cle: 'Algorithme', valeur: 'ECDSA P-256 avec SHA-256 (13)' },
                      { cle: 'Clé de signature de clé', valeur: 'Rotation annuelle, prochaine le 4 mars 2027' },
                      { cle: 'Clé de signature de zone', valeur: 'Rotation trimestrielle, automatique' },
                      { cle: 'Chaîne de confiance', valeur: 'Validée depuis la racine' },
                      { cle: 'Dernière vérification', valeur: dateHeure('2026-08-19T15:04:00Z') },
                    ]}
                  />
                </div>
                <Callout ton="ok" className="mt-4" titre="Chaîne de confiance complète">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck size={13} />
                    Le registre publie bien votre enregistrement DS, et la signature est valide depuis
                    la racine. Un attaquant ne peut pas faire répondre une fausse adresse pour ce
                    domaine à un résolveur validant.
                  </span>
                </Callout>
              </>
            ) : (
              <Callout ton="warn" className="mt-4" titre="Sans DNSSEC, la réponse DNS est falsifiable">
                Un attaquant en position d’intercepter le trafic — un réseau Wi-Fi public, un
                résolveur compromis — peut faire répondre une autre adresse pour votre domaine.
                L’activation prend quelques minutes et n’exige rien de votre part : nous gérons les
                clés et leur publication au registre.
              </Callout>
            )}
          </Card>

          <Card>
            <CardHeader
              titre="Vérifications d’intégrité"
              sousTitre="Ce que nous contrôlons en continu sur cette zone."
            />
            <div className="space-y-2">
              {[
                { t: 'Cohérence des serveurs de noms', ok: true, d: 'Les trois serveurs servent la même série de zone.' },
                { t: 'Enregistrement SPF unique', ok: zone.enregistrements.filter((r) => r.type === 'TXT' && r.valeur.startsWith('v=spf1')).length <= 1, d: 'Deux SPF sur un même domaine invalident les deux — c’est une cause fréquente de courriels rejetés.' },
                { t: 'Aucun CNAME sur l’apex', ok: !zone.enregistrements.some((r) => r.type === 'CNAME' && r.nom === '@'), d: 'La norme interdit un CNAME sur @. Certains résolveurs le tolèrent, d’autres refusent toute la zone.' },
                { t: 'DMARC publié', ok: zone.enregistrements.some((r) => r.nom === '_dmarc'), d: 'Sans DMARC, n’importe qui peut envoyer des courriels en usurpant votre domaine.' },
                { t: 'CAA présent', ok: zone.enregistrements.some((r) => r.type === 'CAA'), d: 'Limite l’émission de certificats aux autorités que vous désignez.' },
                { t: 'MX joignables', ok: true, d: 'Les serveurs de courrier déclarés répondent sur le port 25.' },
              ].map((v) => (
                <div
                  key={v.t}
                  className={cn(
                    'rounded-[6px] border px-3 py-2.5',
                    v.ok ? 'border-g-300' : 'border-warn/40 bg-warn-bg',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12.5px] font-semibold text-ink">{v.t}</span>
                    <Badge tone={v.ok ? 'ok' : 'warn'} size="sm">
                      {v.ok ? 'Conforme' : 'À corriger'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-500">{v.d}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {onglet === 'serveurs' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Serveurs de noms de cette zone"
              sousTitre="À renseigner chez votre bureau d’enregistrement si le domaine n’est pas géré chez nous."
            />
            <div className="space-y-2">
              {zone.ns.map((n, i) => (
                <div
                  key={n}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-[12.5px] font-semibold text-ink">{n}</span>
                    <span className="block text-[11px] text-g-500">
                      {i === 0
                        ? 'Abidjan · ABJ-1 · primaire'
                        : i === 1
                          ? 'Grand-Bassam · GBM-1 · secondaire'
                          : 'Anycast régional · secondaire'}
                    </span>
                  </span>
                  <Badge tone="ok" dot size="sm">
                    Répond
                  </Badge>
                </div>
              ))}
            </div>
            <Callout ton="info" className="mt-4" titre="Pourquoi trois serveurs sur deux sites">
              Un seul serveur de noms, c’est un point de défaillance unique : s’il tombe, votre
              domaine devient injoignable même si vos serveurs web fonctionnent. Deux sites physiques
              distincts protègent d’une panne électrique ou réseau localisée.
            </Callout>
          </Card>

          <Card>
            <CardHeader
              titre="Délégation d’un sous-domaine"
              sousTitre="Confier un sous-domaine à d’autres serveurs de noms — par exemple pour un service tiers ou une filiale."
            />
            <div className="space-y-4">
              <Field label="Sous-domaine" hint={`sera délégué sous ${zone.domaine}`}>
                <Input placeholder="labs" />
              </Field>
              <Field label="Serveurs de noms cibles" hint="un par ligne">
                <MonoTextarea rows={3} placeholder={'ns1.exemple-tiers.com\nns2.exemple-tiers.com'} />
              </Field>
            </div>
            <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
              <Button className="mt-3.5" variant="secondary">
                Créer la délégation
              </Button>
            </GatedAction>
            <Callout ton="warn" className="mt-4" titre="Une délégation vous retire la main">
              Une fois le sous-domaine délégué, ses enregistrements ne sont plus gérés ici mais chez
              le tiers. Vous ne pourrez plus corriger une erreur de leur côté depuis ce portail.
            </Callout>
          </Card>
        </div>
      )}

      {onglet === 'brut' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Fichier de zone"
              sousTitre="Format BIND standard. Utile pour un audit, une sauvegarde, ou une migration vers un autre fournisseur."
              actions={
                <Button size="sm" variant="ghost" iconBefore={<Download size={12} />}>
                  Télécharger
                </Button>
              }
            />
            <CodeBlock langue="dns" code={fichierZone} />
          </Card>

          <Card>
            <CardHeader
              titre="Import de zone"
              sousTitre="Collez un fichier de zone BIND. Nous vous montrons les différences avant d’appliquer quoi que ce soit."
            />
            <MonoTextarea rows={8} placeholder="@	3600	IN	A	203.0.113.10" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="secondary">Analyser les différences</Button>
              <span className="text-[11.5px] text-g-500">
                Aucun enregistrement n’est modifié avant votre validation du comparatif.
              </span>
            </div>
          </Card>
        </div>
      )}

      <Drawer
        open={ajout || enEdition !== undefined}
        onClose={() => {
          setAjout(false)
          setEdition(null)
        }}
        title={enEdition ? `Modifier ${enEdition.type} ${enEdition.nom}` : 'Nouvel enregistrement'}
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setAjout(false)
                setEdition(null)
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                lancer('web.dns.apply', zone.domaine)
                setAjout(false)
                setEdition(null)
              }}
            >
              {enEdition ? 'Enregistrer' : 'Créer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Type" hint={EXPLICATIONS[enEdition?.type ?? 'A']}>
            <Select defaultValue={enEdition?.type ?? 'A'}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Nom"
            hint={`@ pour ${zone.domaine} lui-même, ou un sous-domaine comme www`}
          >
            <Input defaultValue={enEdition?.nom ?? ''} placeholder="@" suffix={`.${zone.domaine}`} />
          </Field>
          <Field label="Valeur" hint="adresse IP, nom de domaine cible, ou contenu textuel">
            <Input defaultValue={enEdition?.valeur ?? ''} placeholder="203.0.113.10" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="TTL" hint="secondes — 300 pendant une migration, 3 600 en régime stable">
              <Select defaultValue={String(enEdition?.ttl ?? 3600)}>
                <option value="60">60 s — bascule imminente</option>
                <option value="300">300 s — 5 minutes</option>
                <option value="3600">3 600 s — 1 heure (recommandé)</option>
                <option value="86400">86 400 s — 1 jour</option>
              </Select>
            </Field>
            <Field label="Priorité" hint="MX et SRV uniquement — la plus basse est essayée d’abord">
              <Input type="number" defaultValue={enEdition?.priorite ?? ''} placeholder="10" />
            </Field>
          </div>
          <Callout ton="info" titre="Avant de valider">
            Un CNAME ne peut pas coexister avec un autre enregistrement sur le même nom, et il est
            interdit sur l’apex (@). Si vous voulez pointer{' '}
            <span className="font-mono text-[12px]">{zone.domaine}</span> vers un service externe,
            utilisez un A vers son adresse IP, ou un ALIAS si le service en fournit un.
          </Callout>
        </div>
      </Drawer>

      <Modal
        open={modele !== null}
        onClose={() => setModele(null)}
        title="Appliquer un modèle"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModele(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                lancer('web.dns.apply', zone.domaine)
                setModele(null)
              }}
            >
              Appliquer
            </Button>
          </>
        }
      >
        {modele && (
          <div className="space-y-4">
            <p className="text-[13px] leading-relaxed text-g-700">
              {MODELES_DNS.find((m) => m.id === modele)?.description}
            </p>
            <div>
              <MicroLabel className="mb-1.5">Ce qui sera créé</MicroLabel>
              <ul className="space-y-1">
                {MODELES_DNS.find((m) => m.id === modele)?.enregistrements.map((e) => (
                  <li
                    key={e}
                    className="rounded-[5px] bg-g-050 px-2.5 py-1.5 font-mono text-[11px] text-ink"
                  >
                    {e}
                  </li>
                ))}
              </ul>
            </div>
            <Field label="Valeur à substituer" hint="remplace les paramètres entre chevrons ci-dessus">
              <Input placeholder="102.176.20.13" />
            </Field>
            <Callout ton="warn" titre="Les enregistrements existants ne sont pas écrasés">
              Si un enregistrement du même nom et du même type existe déjà, nous vous le signalons et
              vous choisissez : conserver, remplacer, ou ajouter en parallèle.
            </Callout>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={suppression !== null}
        onClose={() => setSuppression(null)}
        titre="Supprimer un enregistrement DNS"
        ressource={suppression ? `${suppression.type} ${suppression.nom}` : ''}
        libelleAction="Supprimer l’enregistrement"
        pertes={[
          'Les résolveurs cesseront de répondre pour ce nom à l’expiration du TTL',
          suppression?.type === 'MX'
            ? 'Les courriels à destination de ce domaine seront rejetés'
            : 'Le service pointé par cet enregistrement deviendra injoignable par ce nom',
          'La suppression est journalisée dans l’audit, avec votre nom',
        ]}
        onConfirm={() => {
          lancer('web.dns.apply', zone.domaine)
          setSuppression(null)
        }}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Callout ton="violet" titre="Baisser le TTL avant une migration">
          Vingt-quatre heures avant de changer une adresse, passez le TTL de l’enregistrement
          concerné à 300 secondes. Le jour de la bascule, la propagation prendra cinq minutes plutôt
          qu’une heure. Remontez-le ensuite : un TTL court multiplie les requêtes et ralentit
          légèrement la résolution.
        </Callout>
        <Card>
          <CardHeader titre="Historique de la zone" sousTitre="Sept derniers jours." />
          <div className="space-y-1.5">
            {[
              { q: '2026-08-19T11:04:00Z', a: 'Léa Konan', t: 'A staging modifié — 102.176.34.7' },
              { q: '2026-08-17T09:22:00Z', a: 'Kouassi Touré', t: 'TXT _dmarc modifié — p=none → p=quarantine' },
              { q: '2026-08-14T16:41:00Z', a: 'Léa Konan', t: 'CNAME erp créé — erp-dba.synelia.cloud.' },
              { q: '2026-08-12T08:12:00Z', a: 'ci-bot', t: 'A analytics créé — 102.176.20.13' },
            ].map((h) => (
              <div
                key={h.q}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-g-100 pb-1.5 last:border-0"
              >
                <span className="min-w-0 text-[12px] text-ink">{h.t}</span>
                <span className="shrink-0 text-[10.5px] text-g-500">
                  {h.a} · {dateHeure(h.q)}
                </span>
              </div>
            ))}
          </div>
          <ButtonLink size="sm" variant="ghost" className="mt-3" href="/app/securite">
            Voir le journal d’audit complet
          </ButtonLink>
        </Card>
      </div>
    </div>
  )
}
