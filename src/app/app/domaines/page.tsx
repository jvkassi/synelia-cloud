'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Globe, Lock, Plus, RefreshCw, ShieldCheck, Unlock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateCourte, money, relatif } from '@/lib/format'
import { DOMAINES, ZONES_DNS } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { DataTable } from '@/components/composition/data-table'
import { CostPreview } from '@/components/composition/flow'
import { useApp } from '@/components/app/contexte'
import type { Domaine } from '@/lib/types'

const ONGLETS = [
  { id: 'portefeuille', label: 'Portefeuille' },
  { id: 'zones', label: 'Zones DNS' },
  { id: 'transfert', label: 'Transfert entrant' },
  { id: 'nouveau', label: 'Enregistrer un domaine' },
]

const TARIFS: Record<string, number> = {
  '.ci': 22000,
  '.africa': 18000,
  '.com': 9500,
  '.tech': 14000,
  '.org': 10500,
}

export default function Domaines() {
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('portefeuille')
  const [recherche, setRecherche] = useState('')

  const sansRenouvellement = DOMAINES.filter((d) => !d.renouvellementAuto).length
  const expirentBientot = DOMAINES.filter((d) => d.expiration < '2026-12-31').length
  const nonVerrouilles = DOMAINES.filter((d) => !d.verrouTransfert).length

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Domaines' }]}
        titre="Domaines"
        sousTitre="Enregistrement, renouvellement, verrou de transfert, protection des coordonnées et zone DNS. Nous sommes bureau d’enregistrement accrédité pour le .ci — le domaine reste votre propriété, pas la nôtre."
        actions={
          <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
            <Button iconBefore={<Plus size={14} />} onClick={() => setOnglet('nouveau')}>
              Enregistrer un domaine
            </Button>
          </GatedAction>
        }
      />

      {sansRenouvellement > 0 && (
        <Callout ton="warn" titre={`${sansRenouvellement} domaine sans renouvellement automatique`}>
          Un domaine qui expire redevient disponible pour n’importe qui après une période de grâce.
          Récupérer un domaine perdu coûte entre dix et cent fois son prix de renouvellement, quand
          c’est encore possible. Nous vous prévenons soixante, trente et sept jours avant l’échéance,
          mais l’activation du renouvellement automatique reste le seul filet réellement fiable.
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile libelle="Domaines" valeur={DOMAINES.length} />
        <StatTile
          libelle="Renouvellement automatique"
          valeur={DOMAINES.length - sansRenouvellement}
          ton={sansRenouvellement > 0 ? 'warn' : 'ok'}
          detail={`sur ${DOMAINES.length} domaines`}
        />
        <StatTile
          libelle="Échéances sous 4 mois"
          valeur={expirentBientot}
          ton={expirentBientot > 0 ? 'info' : 'ok'}
        />
        <StatTile
          libelle="Verrou de transfert absent"
          valeur={nonVerrouilles}
          ton={nonVerrouilles > 0 ? 'warn' : 'ok'}
          detail="Protection contre le détournement"
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'portefeuille' && (
        <Card padding={false}>
          <div className="p-4">
            <DataTable<Domaine>
              lignes={DOMAINES}
              exportable
              placeholderRecherche="Rechercher un domaine…"
              filtres={[
                {
                  id: 'ext',
                  libelle: 'Extension',
                  options: [
                    { value: 'tous', label: 'Toutes les extensions' },
                    ...[...new Set(DOMAINES.map((d) => d.extension))].map((e) => ({
                      value: e,
                      label: e,
                    })),
                  ],
                },
              ]}
              selection={(l, fid, val) => (fid === 'ext' ? l.extension === val : true)}
              colonnes={[
                {
                  id: 'nom',
                  entete: 'Domaine',
                  cle: (d) => d.nom,
                  rendu: (d) => (
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-p-050 text-p-700">
                        <Globe size={13} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-mono text-[12.5px] font-semibold text-ink">
                          {d.nom}
                        </span>
                        <span className="block text-[11px] text-g-500">
                          Bureau d’enregistrement : Synelia
                        </span>
                      </span>
                    </span>
                  ),
                },
                {
                  id: 'expiration',
                  entete: 'Échéance',
                  cle: (d) => d.expiration,
                  rendu: (d) => (
                    <span className="block">
                      <span className="block text-[12px] text-ink">{dateCourte(d.expiration)}</span>
                      <span
                        className={cn(
                          'block text-[10.5px]',
                          d.expiration < '2026-10-31' ? 'text-warn' : 'text-g-500',
                        )}
                      >
                        {relatif(d.expiration)}
                      </span>
                    </span>
                  ),
                },
                {
                  id: 'auto',
                  entete: 'Renouvellement',
                  cle: (d) => (d.renouvellementAuto ? 1 : 0),
                  rendu: (d) =>
                    d.renouvellementAuto ? (
                      <Badge tone="ok" size="sm">
                        Automatique
                      </Badge>
                    ) : (
                      <Badge tone="warn" dot size="sm">
                        Manuel
                      </Badge>
                    ),
                },
                {
                  id: 'whois',
                  entete: 'Coordonnées',
                  aligne: 'center',
                  cle: (d) => (d.whoisProtege ? 1 : 0),
                  rendu: (d) =>
                    d.whoisProtege ? (
                      <Badge tone="ok" size="sm">
                        Masquées
                      </Badge>
                    ) : (
                      <Badge tone="warn" size="sm">
                        Publiques
                      </Badge>
                    ),
                },
                {
                  id: 'verrou',
                  entete: 'Verrou',
                  aligne: 'center',
                  cle: (d) => (d.verrouTransfert ? 1 : 0),
                  rendu: (d) => (
                    <span className="flex items-center justify-center">
                      {d.verrouTransfert ? (
                        <Lock size={13} className="text-ok" />
                      ) : (
                        <Unlock size={13} className="text-warn" />
                      )}
                    </span>
                  ),
                },
                {
                  id: 'zone',
                  entete: 'Zone DNS',
                  cle: (d) => d.zoneId ?? '',
                  rendu: (d) =>
                    d.zoneId ? (
                      <Link
                        href={`/app/dns/${d.zoneId}`}
                        className="text-[12px] font-semibold text-p-700 hover:text-m-600"
                      >
                        Gérer la zone
                      </Link>
                    ) : (
                      <span className="text-[11.5px] text-g-500">Serveurs externes</span>
                    ),
                },
                {
                  id: 'prix',
                  entete: 'Renouvellement',
                  aligne: 'right',
                  cle: (d) => TARIFS[d.extension] ?? 0,
                  rendu: (d) => (
                    <span className="tnum text-[12px] text-g-700">
                      {money(TARIFS[d.extension] ?? 12000)}/an
                    </span>
                  ),
                },
                {
                  id: 'actions',
                  entete: '',
                  aligne: 'right',
                  rendu: (d) => (
                    <span className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        iconBefore={<RefreshCw size={12} />}
                        onClick={() =>
                          pousser({
                            ton: 'ok',
                            titre: `${d.nom} renouvelé pour un an`,
                            detail: `Nouvelle échéance : ${dateCourte(d.expiration.replace('2026', '2027').replace('2027-', '2028-'))}. Facturé sur votre prochaine échéance.`,
                          })
                        }
                      >
                        Renouveler
                      </Button>
                      <Button size="sm" variant="ghost">
                        Réglages
                      </Button>
                    </span>
                  ),
                },
              ]}
              vide={{
                titre: 'Aucun domaine',
                phrase:
                  'Enregistrez un domaine, ou transférez-en un que vous détenez déjà chez un autre bureau d’enregistrement.',
              }}
            />
          </div>
        </Card>
      )}

      {onglet === 'zones' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {ZONES_DNS.map((z) => (
            <Card key={z.id} hover className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <Link
                    href={`/app/dns/${z.id}`}
                    className="block truncate font-mono text-[13px] font-bold text-ink hover:text-p-700"
                  >
                    {z.domaine}
                  </Link>
                  <span className="block text-[11px] text-g-500">
                    {z.enregistrements.length} enregistrements · {z.ns.length} serveurs de noms
                  </span>
                </span>
                {z.dnssec ? (
                  <Badge tone="ok" size="sm">
                    DNSSEC
                  </Badge>
                ) : (
                  <Badge tone="warn" size="sm">
                    Sans DNSSEC
                  </Badge>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {['A', 'CNAME', 'MX', 'TXT', 'CAA'].map((t) => {
                  const n = z.enregistrements.filter((r) => r.type === t).length
                  return n === 0 ? null : (
                    <Badge key={t} tone="neutral" size="sm">
                      {n} {t}
                    </Badge>
                  )
                })}
              </div>

              <MicroLabel className="mt-3.5 mb-1.5">Serveurs de noms</MicroLabel>
              <ul className="space-y-0.5">
                {z.ns.map((n) => (
                  <li key={n} className="font-mono text-[11px] text-g-700">
                    {n}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-wrap gap-1.5 border-t border-g-100 pt-3.5">
                <ButtonLink size="sm" variant="secondary" href={`/app/dns/${z.id}`}>
                  Ouvrir l’éditeur de zone
                </ButtonLink>
                {!z.dnssec && (
                  <Button size="sm" variant="ghost" iconBefore={<ShieldCheck size={12} />}>
                    Activer DNSSEC
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {onglet === 'transfert' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Transférer un domaine vers Synelia"
              sousTitre="Le transfert ne coupe pas votre site : la zone DNS actuelle est copiée avant la bascule."
            />
            <div className="space-y-4">
              <Field
                label="Nom de domaine"
                hint="sans www — le domaine doit avoir été enregistré il y a plus de 60 jours"
              >
                <Input placeholder="exemple.ci" />
              </Field>
              <Field
                label="Code d’autorisation"
                hint="fourni par votre bureau d’enregistrement actuel — parfois appelé EPP, AuthInfo ou code de transfert"
              >
                <Input placeholder="XXXX-XXXX-XXXX" />
              </Field>
              <div className="space-y-3">
                <Switch
                  checked
                  label="Copier la zone DNS actuelle avant la bascule"
                  description="Nous lisons vos enregistrements publics et les recréons chez nous à l’identique. Sans cela, votre site et vos courriels tomberaient au moment du changement de serveurs de noms."
                />
                <Switch
                  checked
                  label="Activer le renouvellement automatique après le transfert"
                />
                <Switch checked label="Masquer les coordonnées du titulaire" />
              </div>
            </div>
            <CostPreview
              className="mt-4"
              lignes={[
                { libelle: 'Transfert entrant .ci', detail: 'Inclut un an de renouvellement', montant: 22000 },
              ]}
            />
            <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
              <Button className="mt-3.5">Lancer le transfert</Button>
            </GatedAction>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader titre="Ce qui va se passer" />
              <ol className="space-y-3">
                {[
                  {
                    t: 'Vérification de l’éligibilité',
                    d: 'Le domaine doit être déverrouillé chez votre bureau actuel, avoir plus de 60 jours, et ne pas être en période de rédemption.',
                  },
                  {
                    t: 'Copie de la zone DNS',
                    d: 'Nous lisons vos enregistrements publics et les recréons chez nous. Vous pouvez les vérifier avant la bascule.',
                  },
                  {
                    t: 'Demande de transfert au registre',
                    d: 'Le registre envoie une confirmation au courriel du titulaire. Sans réponse, le transfert est automatiquement accepté après cinq jours.',
                  },
                  {
                    t: 'Bascule des serveurs de noms',
                    d: 'Une fois le transfert acté, nous basculons vers nos serveurs. La propagation prend jusqu’à 24 heures, mais votre site reste joignable pendant tout ce temps puisque les deux zones sont identiques.',
                  },
                ].map((e, i) => (
                  <li key={e.t} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-p-050 text-[11px] font-bold text-p-700">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold text-ink">{e.t}</span>
                      <span className="block text-[11.5px] leading-relaxed text-g-500">{e.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <Callout ton="info" className="mt-4" titre="Durée réelle">
                Cinq à sept jours pour un .com, jusqu’à dix jours pour un .ci. C’est le registre qui
                impose ce délai, pas nous : il existe pour empêcher les détournements de domaine.
              </Callout>
            </Card>

            <Card>
              <CardHeader
                titre="Transferts en cours"
                sousTitre="Aucun transfert n’est en attente pour cette organisation."
              />
              <div className="rounded-[6px] border border-dashed border-g-300 px-4 py-6 text-center">
                <p className="text-[12.5px] text-g-500">
                  Les transferts entrants et sortants apparaissent ici, avec leur étape en cours et la
                  date d’achèvement prévue.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'nouveau' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              titre="Vérifier la disponibilité"
              sousTitre="Nous sommes bureau d’enregistrement accrédité pour le .ci : l’enregistrement est direct, sans intermédiaire."
            />
            <div className="flex flex-wrap items-end gap-2">
              <Field className="min-w-[220px] flex-1" label="Nom recherché">
                <Input
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="mon-entreprise"
                />
              </Field>
              <Button>Vérifier</Button>
            </div>

            {recherche.trim().length > 1 && (
              <div className="mt-4 space-y-2">
                {Object.entries(TARIFS).map(([ext, prix], i) => {
                  const libre = i !== 2
                  return (
                    <div
                      key={ext}
                      className={cn(
                        'flex flex-wrap items-center justify-between gap-3 rounded-[6px] border px-3 py-2.5',
                        libre ? 'border-g-300' : 'border-g-300 bg-g-050',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block font-mono text-[13px] font-semibold text-ink">
                          {recherche.trim().toLowerCase().replace(/\s+/g, '-')}
                          {ext}
                        </span>
                        <span className="block text-[11px] text-g-500">
                          {libre
                            ? ext === '.ci'
                              ? 'Disponible · enregistrement direct auprès du registre ivoirien'
                              : 'Disponible'
                            : 'Déjà enregistré — le titulaire actuel est masqué'}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2.5">
                        <span className="tnum text-[13px] font-bold text-ink">{money(prix)}</span>
                        <span className="text-[11px] text-g-500">/an</span>
                        {libre ? (
                          <Button size="sm" variant="secondary">
                            Ajouter
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" disabled>
                            Indisponible
                          </Button>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {recherche.trim().length <= 1 && (
              <div className="mt-4 rounded-[6px] border border-dashed border-g-300 px-4 py-8 text-center">
                <p className="text-[12.5px] text-g-500">
                  Saisissez un nom pour voir sa disponibilité sur les extensions que nous proposons.
                </p>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader titre="Réglages à l’enregistrement" />
              <div className="space-y-3.5">
                <Switch
                  checked
                  label="Renouvellement automatique"
                  description="Le seul réglage qui protège vraiment d’une perte de domaine."
                />
                <Switch
                  checked
                  label="Masquer les coordonnées du titulaire"
                  description="Sans cela, votre nom, votre adresse et votre téléphone sont publics dans le WHOIS — et récoltés par les démarcheurs dans l’heure."
                />
                <Switch
                  checked
                  label="Verrou de transfert"
                  description="Empêche tout transfert sortant sans déverrouillage explicite depuis ce portail."
                />
                <Switch
                  checked
                  label="Créer la zone DNS chez nous"
                  description="Avec les enregistrements de base, prêts à pointer vers un Espace Cloud, un hébergement web ou un service managé."
                />
              </div>
            </Card>

            <Card>
              <CardHeader titre="Titulaire" sousTitre="Repris de la fiche de votre organisation." />
              <KeyValueList
                colonnes={1}
                items={[
                  { cle: 'Raison sociale', valeur: 'Digital Business Africa' },
                  { cle: 'Contact administratif', valeur: 'Léa Konan' },
                  { cle: 'Courriel', valeur: 'admin@dba.africa' },
                  { cle: 'Pays', valeur: 'Côte d’Ivoire' },
                ]}
              />
              <Callout ton="info" className="mt-4" titre="Le .ci exige un titulaire local">
                Le registre ivoirien demande une présence en Côte d’Ivoire pour enregistrer un .ci.
                Votre organisation y répond ; nous transmettons les justificatifs déjà déposés.
              </Callout>
            </Card>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader titre="Serveurs de noms Synelia" sousTitre="À renseigner chez un autre bureau d’enregistrement si vous gardez le domaine ailleurs." />
          <div className="space-y-2">
            {['ns1.synelia.cloud', 'ns2.synelia.cloud', 'ns3.synelia.cloud'].map((n) => (
              <CopyField key={n} label={n.split('.')[0].toUpperCase()} value={n} />
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-g-500">
            Trois serveurs, sur deux sites physiques distincts — Abidjan et Grand-Bassam — avec une
            anycast régionale. Une panne de site ne rend pas vos domaines injoignables.
          </p>
        </Card>

        <Callout ton="violet" titre="Le domaine reste votre propriété">
          Nous sommes votre bureau d’enregistrement, pas le titulaire. Le code d’autorisation de
          transfert est disponible à tout moment depuis les réglages du domaine, sans avoir à ouvrir
          un ticket ni à négocier quoi que ce soit. Un fournisseur qui rend un départ difficile
          compte sur l’enfermement plutôt que sur la qualité de son service.
        </Callout>
      </div>
    </div>
  )
}
