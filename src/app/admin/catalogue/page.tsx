'use client'

import { useState } from 'react'
import { Archive, Eye, FileEdit, Plus, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { money, moneyPerMonth, num, pct } from '@/lib/format'
import { OFFRES, SOUSCRIPTIONS } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/field'
import { ConfirmDialog, Drawer } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { DataTable } from '@/components/composition/data-table'
import { useApp } from '@/components/app/contexte'
import type { Offer } from '@/lib/types'

const ONGLETS = [
  { id: 'offres', label: 'Offres' },
  { id: 'grille', label: 'Tarification' },
  { id: 'depreciation', label: 'Dépréciation' },
]

const LIBELLE_CATEGORIE: Record<Offer['categorie'], string> = {
  espace_cloud: 'Espace Cloud',
  image_vm: 'Image de machine',
  k8s: 'Kubernetes',
  stack: 'Pile applicative',
  web: 'Hébergement web',
}

export default function Catalogue() {
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('offres')
  const [edition, setEdition] = useState<Offer | null>(null)
  const [creation, setCreation] = useState(false)
  const [depreciation, setDepreciation] = useState<Offer | null>(null)

  const publiees = OFFRES.filter((o) => o.statut === 'publiee')
  const brouillons = OFFRES.filter((o) => o.statut === 'brouillon')
  const depreciees = OFFRES.filter((o) => o.statut === 'depreciee')
  const souscriptionsTotal = OFFRES.reduce((a, o) => a + o.souscriptionsActives, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Catalogue d’offres"
        sousTitre="Ce que nous vendons et à quel prix. Une offre publiée engage un prix : la modifier à la hausse ne s’applique jamais à une souscription en cours, seulement aux nouvelles."
        actions={
          <GatedAction autorise={autorise('catalog.edit')} message={refus('catalog.edit')}>
            <Button iconBefore={<Plus size={14} />} onClick={() => setCreation(true)}>
              Créer une offre
            </Button>
          </GatedAction>
        }
        meta={
          <>
            <Badge tone="ok" size="sm">
              {publiees.length} publiées
            </Badge>
            {brouillons.length > 0 && (
              <Badge tone="info" size="sm">
                {brouillons.length} brouillons
              </Badge>
            )}
            {depreciees.length > 0 && (
              <Badge tone="warn" size="sm">
                {depreciees.length} dépréciées
              </Badge>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile libelle="Offres au catalogue" valeur={OFFRES.length} />
        <StatTile libelle="Publiées" valeur={publiees.length} ton="ok" />
        <StatTile
          libelle="Souscriptions actives"
          valeur={num(souscriptionsTotal)}
          detail="Toutes offres confondues"
        />
        <StatTile
          libelle="Offres sur devis"
          valeur={OFFRES.filter((o) => o.surDevis).length}
          detail="Périmètre à qualifier"
        />
        <StatTile
          libelle="Revenu récurrent"
          valeur={moneyPerMonth(
            OFFRES.reduce((a, o) => a + o.prix * o.souscriptionsActives, 0),
          )}
          ton="accent"
          detail="Prix publics × souscriptions actives"
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'offres' && (
        <Card padding={false}>
          <div className="p-4">
            <DataTable<Offer>
              lignes={OFFRES}
              exportable
              parPage={12}
              placeholderRecherche="Rechercher une offre, un code…"
              filtres={[
                {
                  id: 'statut',
                  libelle: 'Statut',
                  options: [
                    { value: 'tous', label: 'Tous les statuts' },
                    { value: 'publiee', label: 'Publiée' },
                    { value: 'brouillon', label: 'Brouillon' },
                    { value: 'depreciee', label: 'Dépréciée' },
                  ],
                },
                {
                  id: 'categorie',
                  libelle: 'Catégorie',
                  options: [
                    { value: 'tous', label: 'Toutes les catégories' },
                    ...Object.entries(LIBELLE_CATEGORIE).map(([v, l]) => ({ value: v, label: l })),
                  ],
                },
              ]}
              selection={(l, fid, val) =>
                fid === 'statut' ? l.statut === val : fid === 'categorie' ? l.categorie === val : true
              }
              colonnes={[
                {
                  id: 'nom',
                  entete: 'Offre',
                  cle: (o) => `${o.nom} ${o.code}`,
                  rendu: (o) => (
                    <span className="block min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[12.5px] font-semibold text-ink">{o.nom}</span>
                        {o.populaire && (
                          <Badge tone="accent" size="sm">
                            Populaire
                          </Badge>
                        )}
                      </span>
                      <span className="block font-mono text-[10.5px] text-g-500">{o.code}</span>
                    </span>
                  ),
                },
                {
                  id: 'categorie',
                  entete: 'Catégorie',
                  cle: (o) => o.categorie,
                  rendu: (o) => (
                    <Badge tone="neutral" size="sm">
                      {LIBELLE_CATEGORIE[o.categorie]}
                    </Badge>
                  ),
                },
                {
                  id: 'specs',
                  entete: 'Caractéristiques',
                  cle: (o) => o.specs,
                  rendu: (o) => (
                    <span className="block max-w-[28ch] truncate text-[11.5px] text-g-700">
                      {o.specs}
                    </span>
                  ),
                },
                {
                  id: 'prix',
                  entete: 'Prix public',
                  aligne: 'right',
                  cle: (o) => o.prix,
                  rendu: (o) => (
                    <span className="tnum text-[12.5px] font-bold text-ink">
                      {o.surDevis ? 'Sur devis' : moneyPerMonth(o.prix)}
                    </span>
                  ),
                },
                {
                  id: 'sla',
                  entete: 'Engagement',
                  cle: (o) => o.sla ?? '',
                  masquable: true,
                  rendu: (o) => (
                    <span className="text-[11.5px] text-g-700">{o.sla ?? '—'}</span>
                  ),
                },
                {
                  id: 'souscriptions',
                  entete: 'Souscriptions',
                  aligne: 'right',
                  cle: (o) => o.souscriptionsActives,
                  rendu: (o) => (
                    <span
                      className={cn(
                        'tnum text-[12px] font-semibold',
                        o.souscriptionsActives === 0 ? 'text-g-500' : 'text-ink',
                      )}
                    >
                      {o.souscriptionsActives}
                    </span>
                  ),
                },
                {
                  id: 'statut',
                  entete: 'Statut',
                  cle: (o) => o.statut,
                  rendu: (o) => (
                    <Badge
                      tone={
                        o.statut === 'publiee' ? 'ok' : o.statut === 'brouillon' ? 'info' : 'warn'
                      }
                      dot
                      size="sm"
                    >
                      {o.statut === 'publiee'
                        ? 'Publiée'
                        : o.statut === 'brouillon'
                          ? 'Brouillon'
                          : 'Dépréciée'}
                    </Badge>
                  ),
                },
                {
                  id: 'actions',
                  entete: '',
                  aligne: 'right',
                  rendu: (o) => (
                    <span className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setEdition(o)}>
                        Modifier
                      </Button>
                      {o.statut === 'publiee' && (
                        <GatedAction
                          autorise={autorise('catalog.edit')}
                          message={refus('catalog.edit')}
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            iconBefore={<Archive size={12} />}
                            onClick={() => setDepreciation(o)}
                          >
                            Déprécier
                          </Button>
                        </GatedAction>
                      )}
                      {o.statut === 'brouillon' && (
                        <GatedAction
                          autorise={autorise('catalog.edit')}
                          message={refus('catalog.edit')}
                        >
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              pousser({
                                ton: 'ok',
                                titre: `${o.nom} publiée`,
                                detail: 'L’offre apparaît immédiatement sur la vitrine publique et dans le simulateur de coût.',
                              })
                            }
                          >
                            Publier
                          </Button>
                        </GatedAction>
                      )}
                    </span>
                  ),
                },
              ]}
              vide={{
                titre: 'Aucune offre',
                phrase: 'Créez votre première offre pour la rendre souscriptible.',
              }}
            />
          </div>
        </Card>
      )}

      {onglet === 'grille' && (
        <div className="space-y-4">
          <Callout ton="violet" titre="Un seul prix, celui de la vitrine">
            Nous vendons en direct, sans revendeur ni apporteur d'affaires : il n'y a donc pas de
            grille d'achat partenaire à tenir à côté du prix public. Ce que le client lit sur la
            vitrine est ce qu'il paie, et c'est le même montant pour tout le monde. Les remises
            existent — volume, engagement annuel — mais elles se matérialisent dans un devis, pas
            dans une seconde grille cachée.
          </Callout>

          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3.5">
              <CardHeader
                titre="Prix publics des offres publiées"
                sousTitre="Le revenu récurrent est le prix multiplié par les souscriptions actives, hors remises de volume."
                className="mb-0"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Offre', 'Prix public', 'Souscriptions actives', 'Revenu récurrent'].map((h) => (
                      <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OFFRES.filter((o) => !o.surDevis && o.statut === 'publiee').map((o) => (
                    <tr key={o.id} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5">
                        <span className="block text-[12.5px] font-semibold text-ink">{o.nom}</span>
                        <span className="block font-mono text-[10.5px] text-g-500">{o.code}</span>
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] font-bold text-ink">
                        {moneyPerMonth(o.prix)}
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                        {num(o.souscriptionsActives)}
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                        {moneyPerMonth(o.prix * o.souscriptionsActives)}
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
                titre="Règles de tarification"
                sousTitre="Ce que nous nous interdisons, écrit noir sur blanc."
              />
              <div className="space-y-2">
                {[
                  {
                    r: 'Une hausse de prix ne touche jamais une souscription en cours',
                    d: 'Elle s’applique aux nouvelles souscriptions et aux renouvellements, avec un préavis de trois mois. Un client qui a signé à un prix le conserve pour la durée de son engagement.',
                  },
                  {
                    r: 'Le même prix pour tous, à caractéristiques égales',
                    d: 'Vendre en direct et sans intermédiaire nous oblige à une chose : deux clients qui souscrivent la même offre paient le même montant. Une remise se justifie par un volume ou un engagement, jamais par la capacité de négociation de l’interlocuteur.',
                  },
                  {
                    r: 'Aucun prix d’appel non tenable',
                    d: 'Nous ne bradons pas la première année pour rattraper la deuxième. Un prix qui double au renouvellement est une pratique commerciale que nous refusons.',
                  },
                  {
                    r: 'Le transfert sortant est plafonné à 15 % de l’abonnement',
                    d: 'Contractuellement, pas commercialement. C’est ce qui rend une facture prévisible même en cas de pic de trafic.',
                  },
                  {
                    r: 'Une offre dépréciée reste servie',
                    d: 'La dépréciation retire l’offre de la vente. Elle ne résilie personne, et son prix reste garanti jusqu’à ce que le client décide de migrer.',
                  },
                ].map((x) => (
                  <div key={x.r} className="rounded-[6px] border border-p-300 bg-p-050 px-3 py-2.5">
                    <p className="text-[12.5px] font-semibold text-ink">{x.r}</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-700">{x.d}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader
                titre="Offres les plus souscrites"
                sousTitre="Ce que les clients achètent réellement, indépendamment de ce que nous mettons en avant."
              />
              <div className="space-y-2.5">
                {[...OFFRES]
                  .filter((o) => o.souscriptionsActives > 0)
                  .sort((a, b) => b.souscriptionsActives - a.souscriptionsActives)
                  .slice(0, 8)
                  .map((o) => {
                    const max = Math.max(...OFFRES.map((x) => x.souscriptionsActives))
                    return (
                      <div key={o.id}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 truncate text-[12px] text-ink">{o.nom}</span>
                          <span className="tnum shrink-0 text-[12px] font-semibold text-ink">
                            {o.souscriptionsActives}
                          </span>
                        </div>
                        <span className="mt-1 block h-2 overflow-hidden rounded-full bg-g-100">
                          <span
                            className={cn(
                              'block h-full rounded-full',
                              o.populaire ? 'bg-m-600' : 'bg-p-600',
                            )}
                            style={{ width: `${(o.souscriptionsActives / max) * 100}%` }}
                          />
                        </span>
                      </div>
                    )
                  })}
              </div>
              <Callout ton="info" className="mt-4" titre="L’offre que nous mettons en avant n’est pas la plus vendue">
                Les clients choisissent majoritairement l’offre juste en dessous de celle que nous
                marquons « populaire ». C’est une information utile : soit notre recommandation est
                mal calibrée, soit le palier supérieur porte une fonctionnalité que peu de gens
                utilisent réellement.
              </Callout>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'depreciation' && (
        <div className="space-y-4">
          <Callout ton="violet" titre="Déprécier une offre n’est pas résilier ses clients">
            Une offre dépréciée disparaît de la vente et du simulateur, mais continue d’être servie et
            facturée au prix garanti pour ceux qui l’ont souscrite. Nous ne forçons personne à migrer.
            Quand nous devons vraiment retirer une offre — fin de vie d’un matériel, par exemple — le
            préavis est de douze mois et nous proposons une offre de remplacement à prix équivalent.
          </Callout>

          {depreciees.length === 0 ? (
            <Card>
              <p className="rounded-[8px] border border-dashed border-g-300 px-4 py-10 text-center text-[12.5px] text-g-500">
                Aucune offre dépréciée actuellement.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {depreciees.map((o) => (
                <Card key={o.id} className="border-warn/30">
                  <CardHeader
                    titre={o.nom}
                    sousTitre={o.specs}
                    actions={
                      <Badge tone="warn" dot size="sm">
                        Dépréciée
                      </Badge>
                    }
                  />
                  <KeyValueList
                    colonnes={1}
                    items={[
                      { cle: 'Code', valeur: o.code },
                      { cle: 'Souscriptions encore actives', valeur: String(o.souscriptionsActives) },
                      { cle: 'Prix garanti', valeur: moneyPerMonth(o.prix) },
                      { cle: 'Retirée de la vente', valeur: 'Oui — absente de la vitrine et du simulateur' },
                      { cle: 'Toujours servie', valeur: 'Oui, sans limite de durée annoncée' },
                    ]}
                  />
                  <Callout ton="info" className="mt-4" titre="Offre de remplacement proposée">
                    Les clients concernés reçoivent une comparaison chiffrée avec l’offre courante la
                    plus proche, et restent libres de ne rien changer. Aucune migration n’est imposée.
                  </Callout>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardHeader
              titre="Historique des changements de catalogue"
              sousTitre="Chaque publication, dépréciation et modification de prix est datée et attribuée."
            />
            <div className="space-y-1.5">
              {[
                { q: '12 août 2026', qui: 'Jean-Vincent Kassi', d: 'Publication de l’offre Cloud Souverain — placement exclusivement libre et local' },
                { q: '4 août 2026', qui: 'Aïcha Bamba', d: 'Publication de l’offre Cloud Hybride — absorption d’une capacité VMware existante' },
                { q: '28 juillet 2026', qui: 'Jean-Vincent Kassi', d: 'Dépréciation de Cloud Start 2024 — 4 souscriptions maintenues au prix garanti' },
                { q: '11 juillet 2026', qui: 'Marc Ouattara', d: 'Ajustement du prix public de Cloud Pro — de 96 000 à 85 000 FCFA par mois' },
                { q: '2 juillet 2026', qui: 'Aïcha Bamba', d: 'Ajout de l’engagement 99,95 % sur les offres Espace Cloud' },
              ].map((x) => (
                <div
                  key={x.q}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-g-100 pb-1.5 last:border-0"
                >
                  <span className="min-w-0 text-[12px] text-ink">{x.d}</span>
                  <span className="shrink-0 text-[10.5px] text-g-500">
                    {x.qui} · {x.q}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Drawer
        open={edition !== null || creation}
        onClose={() => {
          setEdition(null)
          setCreation(false)
        }}
        title={edition ? `Modifier ${edition.nom}` : 'Créer une offre'}
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setEdition(null)
                setCreation(false)
              }}
            >
              Annuler
            </Button>
            <GatedAction autorise={autorise('catalog.edit')} message={refus('catalog.edit')}>
              <Button
                onClick={() => {
                  pousser({
                    ton: 'ok',
                    titre: edition ? 'Offre modifiée' : 'Offre créée en brouillon',
                    detail: edition
                      ? 'Les souscriptions en cours conservent leur prix. La modification ne concerne que les nouvelles.'
                      : 'Elle n’apparaîtra sur la vitrine qu’après publication explicite.',
                  })
                  setEdition(null)
                  setCreation(false)
                }}
              >
                {edition ? 'Enregistrer' : 'Créer en brouillon'}
              </Button>
            </GatedAction>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom commercial">
              <Input defaultValue={edition?.nom ?? ''} placeholder="Cloud Pro" />
            </Field>
            <Field label="Code" hint="apparaît sur les factures — immuable après publication">
              <Input defaultValue={edition?.code ?? ''} placeholder="CLOUD-PRO" />
            </Field>
          </div>
          <Field label="Catégorie">
            <Select defaultValue={edition?.categorie ?? 'espace_cloud'}>
              {Object.entries(LIBELLE_CATEGORIE).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Caractéristiques" hint="phrase affichée sur la vitrine et le comparateur">
            <Input defaultValue={edition?.specs ?? ''} placeholder="16 vCPU · 64 Go · 2 To SSD" />
          </Field>
          <Field label="Ce qui est inclus" hint="une ligne par élément">
            <Textarea
              rows={5}
              defaultValue={edition?.caracteristiques.join('\n') ?? ''}
              placeholder={'Sauvegarde quotidienne incluse\nIP publique\nSupport en heures ouvrées'}
            />
          </Field>
          <MicroLabel className="pt-2">Tarification</MicroLabel>
          <Field label="Prix public" hint="publié sur la vitrine — c’est le seul prix de l’offre">
            <Input type="number" defaultValue={edition?.prix ?? 0} suffix="FCFA" />
          </Field>
          <Field label="Engagement de disponibilité">
            <Select defaultValue={edition?.sla ?? '99,9 %'}>
              <option value="">Aucun engagement chiffré</option>
              <option value="99,9 %">99,9 %</option>
              <option value="99,95 %">99,95 %</option>
              <option value="99,99 %">99,99 %</option>
            </Select>
          </Field>
          <div className="space-y-3">
            <Switch
              checked={edition?.populaire ?? false}
              label="Marquer comme populaire"
              description="Met l’offre en avant sur la vitrine. À utiliser sur l’offre que vous recommandez réellement, pas sur celle qui rapporte le plus."
            />
            <Switch
              checked={edition?.surDevis ?? false}
              label="Sur devis uniquement"
              description="L’offre apparaît sans prix, avec un bouton de prise de contact. Pour les périmètres qui exigent une qualification."
            />
          </div>
          <Callout ton="warn" titre="Publier engage un prix">
            Une fois publiée, l’offre est souscriptible en autonomie et son prix est garanti pour la
            durée de l’engagement de chaque souscripteur. Une hausse ultérieure ne s’applique qu’aux
            nouvelles souscriptions, avec trois mois de préavis.
          </Callout>
        </div>
      </Drawer>

      <ConfirmDialog
        open={depreciation !== null}
        onClose={() => setDepreciation(null)}
        titre="Déprécier une offre"
        ressource={depreciation?.code ?? ''}
        libelleAction="Déprécier l’offre"
        pertes={[
          'L’offre disparaît de la vitrine publique, du simulateur et du comparateur',
          'Aucune nouvelle souscription ne sera possible',
          `Les ${depreciation?.souscriptionsActives ?? 0} souscriptions actives sont maintenues, au prix garanti, sans limite de durée annoncée`,
          'Les clients concernés reçoivent une comparaison avec l’offre de remplacement, sans obligation de migrer',
        ]}
        onConfirm={() => {
          pousser({
            ton: 'info',
            titre: `${depreciation?.nom} dépréciée`,
            detail: 'Elle n’est plus souscriptible. Les clients existants continuent d’être servis au prix garanti.',
          })
          setDepreciation(null)
        }}
      />
    </div>
  )
}
