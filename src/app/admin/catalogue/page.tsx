'use client'

import { useState } from 'react'
import { Archive, Plus, Trash2 } from 'lucide-react'
import { cn, slugify } from '@/lib/utils'
import { dateCourte, money, moneyPerMonth, num, pct } from '@/lib/format'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/field'
import { ConfirmDialog, Drawer } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { DataTable } from '@/components/composition/data-table'
import { useApp } from '@/components/app/contexte'
import { useActe, useAtelier } from '@/components/app/atelier'
import type { Offer } from '@/lib/types'

const ONGLETS = [
  { id: 'offres', label: 'Offres' },
  { id: 'grille', label: 'Grille tarifaire' },
  { id: 'depreciation', label: 'Dépréciation' },
]

const LIBELLE_CATEGORIE: Record<Offer['categorie'], string> = {
  espace_cloud: 'Espace Cloud',
  image_vm: 'Image de machine',
  k8s: 'Kubernetes',
  stack: 'Pile applicative',
  web: 'Hébergement web',
}

/** Ce qu'un formulaire d'offre porte — le reste du modèle est dérivé. */
interface Brouillon {
  nom: string
  code: string
  categorie: Offer['categorie']
  specs: string
  caracteristiques: string
  direct: number
  revendeur: number
  operateur: number
  sla: string
  populaire: boolean
  surDevis: boolean
}

const BROUILLON_VIDE: Brouillon = {
  nom: '',
  code: '',
  categorie: 'espace_cloud',
  specs: '',
  caracteristiques: '',
  direct: 0,
  revendeur: 0,
  operateur: 0,
  sla: '99,9 %',
  populaire: false,
  surDevis: false,
}

const versBrouillon = (o: Offer): Brouillon => ({
  nom: o.nom,
  code: o.code,
  categorie: o.categorie,
  specs: o.specs,
  caracteristiques: o.caracteristiques.join('\n'),
  direct: o.prix.direct,
  revendeur: o.prix.revendeur,
  operateur: o.prix.operateur,
  sla: o.sla ?? '',
  populaire: o.populaire ?? false,
  surDevis: o.surDevis ?? false,
})

export default function Catalogue() {
  const { autorise, refus } = useApp()
  const { offres, journal } = useAtelier()
  const acte = useActe()

  const [onglet, setOnglet] = useState('offres')
  const [edition, setEdition] = useState<Offer | null>(null)
  const [creation, setCreation] = useState(false)
  const [form, setForm] = useState<Brouillon>(BROUILLON_VIDE)
  const [depreciation, setDepreciation] = useState<Offer | null>(null)
  const [suppression, setSuppression] = useState<Offer | null>(null)

  const OFFRES = offres.liste
  const publiees = OFFRES.filter((o) => o.statut === 'publiee')
  const brouillons = OFFRES.filter((o) => o.statut === 'brouillon')
  const depreciees = OFFRES.filter((o) => o.statut === 'depreciee')
  const souscriptionsTotal = OFFRES.reduce((a, o) => a + o.souscriptionsActives, 0)

  /** Les mouvements de catalogue de la session, lus dans le journal d'audit. */
  const mouvements = journal.liste.filter((a) => a.action.startsWith('offer.'))

  const modifierForm = <C extends keyof Brouillon>(champ: C, valeur: Brouillon[C]) =>
    setForm((f) => ({ ...f, [champ]: valeur }))

  const ouvrirCreation = () => {
    setEdition(null)
    setForm(BROUILLON_VIDE)
    setCreation(true)
  }

  const ouvrirEdition = (o: Offer) => {
    setCreation(false)
    setForm(versBrouillon(o))
    setEdition(o)
  }

  const fermerFormulaire = () => {
    setEdition(null)
    setCreation(false)
  }

  const nomValide = form.nom.trim().length >= 2
  const codeValide = /^[A-Z0-9-]{3,}$/.test(form.code.trim().toUpperCase())
  const prixValide = form.surDevis || form.direct > 0
  const ordreValide =
    form.surDevis || (form.revendeur <= form.direct && form.operateur <= form.revendeur)
  const formValide = nomValide && codeValide && prixValide && ordreValide

  const enregistrer = () => {
    const nom = form.nom.trim()
    const code = form.code.trim().toUpperCase()
    const prix = { direct: form.direct, revendeur: form.revendeur, operateur: form.operateur }
    const caracteristiques = form.caracteristiques
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    if (edition) {
      acte({
        faire: () =>
          offres.modifier(edition.id, {
            nom,
            code,
            categorie: form.categorie,
            specs: form.specs.trim(),
            caracteristiques,
            prix,
            sla: form.sla || undefined,
            populaire: form.populaire,
            surDevis: form.surDevis,
          }),
        titre: `${nom} modifiée`,
        detail:
          edition.souscriptionsActives > 0
            ? `Les ${edition.souscriptionsActives} souscriptions en cours conservent leur prix. La modification ne concerne que les nouvelles.`
            : 'Aucune souscription en cours : la modification prend effet immédiatement.',
        action: 'offer.update',
        cible: code,
      })
    } else {
      const base = `off-${slugify(nom).slice(0, 20) || 'offre'}`
      let id = base
      let n = 2
      while (offres.parId(id)) {
        id = `${base}-${n}`
        n += 1
      }
      acte({
        faire: () =>
          offres.ajouter({
            id,
            code,
            nom,
            categorie: form.categorie,
            specs: form.specs.trim(),
            caracteristiques,
            prix,
            statut: 'brouillon',
            souscriptionsActives: 0,
            sla: form.sla || undefined,
            populaire: form.populaire,
            surDevis: form.surDevis,
          }),
        titre: `${nom} créée en brouillon`,
        detail:
          'Elle n’apparaîtra sur la vitrine qu’après publication explicite. Publier engage le prix.',
        action: 'offer.create',
        cible: code,
      })
    }
    fermerFormulaire()
  }

  const publier = (o: Offer) => {
    acte({
      faire: () => offres.modifier(o.id, { statut: 'publiee' }),
      titre: `${o.nom} publiée`,
      detail:
        'L’offre apparaît immédiatement sur la vitrine publique et dans le simulateur de coût. Son prix est désormais garanti pour chaque souscripteur.',
      action: 'offer.publish',
      cible: o.code,
    })
  }

  const deprecier = (o: Offer) => {
    acte({
      faire: () => offres.modifier(o.id, { statut: 'depreciee', populaire: false }),
      ton: 'info',
      titre: `${o.nom} dépréciée`,
      detail: `Elle n’est plus souscriptible. Les ${o.souscriptionsActives} clients existants continuent d’être servis au prix garanti.`,
      action: 'offer.deprecate',
      cible: o.code,
    })
    setDepreciation(null)
  }

  const republier = (o: Offer) => {
    acte({
      faire: () => offres.modifier(o.id, { statut: 'publiee' }),
      titre: `${o.nom} remise en vente`,
      detail: 'Elle réapparaît sur la vitrine et dans le simulateur, au prix affiché.',
      action: 'offer.publish',
      cible: o.code,
    })
  }

  const supprimer = (o: Offer) => {
    acte({
      faire: () => offres.supprimer(o.id),
      ton: 'warn',
      titre: `${o.nom} supprimée`,
      detail:
        'Un brouillon n’a jamais été vendu : sa suppression n’engage personne. Une offre publiée, elle, ne peut être que dépréciée.',
      action: 'offer.delete',
      cible: o.code,
    })
    setSuppression(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Catalogue d’offres"
        sousTitre="Ce que nous vendons, à quel prix, et selon quel canal. Une offre publiée engage un prix : la modifier à la hausse ne s’applique jamais à une souscription en cours, seulement aux nouvelles."
        actions={
          <GatedAction autorise={autorise('catalog.edit')} message={refus('catalog.edit')}>
            <Button iconBefore={<Plus size={14} />} onClick={ouvrirCreation}>
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
          libelle="Écart revendeur"
          valeur={pct(18)}
          ton="accent"
          detail="Remise moyenne sur le prix direct"
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
                  id: 'direct',
                  entete: 'Prix direct',
                  aligne: 'right',
                  cle: (o) => o.prix.direct,
                  rendu: (o) => (
                    <span className="tnum text-[12.5px] font-bold text-ink">
                      {o.surDevis ? 'Sur devis' : moneyPerMonth(o.prix.direct)}
                    </span>
                  ),
                },
                {
                  id: 'revendeur',
                  entete: 'Prix revendeur',
                  aligne: 'right',
                  cle: (o) => o.prix.revendeur,
                  masquable: true,
                  rendu: (o) => (
                    <span className="tnum text-[12px] text-g-700">
                      {o.surDevis ? '—' : money(o.prix.revendeur)}
                    </span>
                  ),
                },
                {
                  id: 'operateur',
                  entete: 'Prix opérateur',
                  aligne: 'right',
                  cle: (o) => o.prix.operateur,
                  masquable: true,
                  masqueeParDefaut: true,
                  rendu: (o) => (
                    <span className="tnum text-[12px] text-g-700">
                      {o.surDevis ? '—' : money(o.prix.operateur)}
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
                      <Button size="sm" variant="ghost" onClick={() => ouvrirEdition(o)}>
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
                          <Button size="sm" variant="secondary" onClick={() => publier(o)}>
                            Publier
                          </Button>
                        </GatedAction>
                      )}
                      {o.statut === 'depreciee' && (
                        <GatedAction
                          autorise={autorise('catalog.edit')}
                          message={refus('catalog.edit')}
                        >
                          <Button size="sm" variant="ghost" onClick={() => republier(o)}>
                            Remettre en vente
                          </Button>
                        </GatedAction>
                      )}
                      {o.souscriptionsActives === 0 && o.statut !== 'publiee' && (
                        <GatedAction
                          autorise={autorise('catalog.edit')}
                          message={refus('catalog.edit')}
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-err hover:bg-err-bg"
                            iconBefore={<Trash2 size={12} />}
                            onClick={() => setSuppression(o)}
                          >
                            Supprimer
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
          <Callout ton="violet" titre="Trois canaux, trois grilles, un seul prix affiché publiquement">
            Le prix direct est celui de la vitrine : c’est le seul que nous publions. Le prix revendeur
            et le prix opérateur sont des prix d’achat, négociés dans un contrat de partenariat. Un
            revendeur reste libre de fixer son prix de vente — nous ne lui imposons pas de marge, et
            nous ne cassons pas ses prix en vendant en direct au même client.
          </Callout>

          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3.5">
              <CardHeader
                titre="Grille par canal"
                sousTitre="Les écarts sont exprimés par rapport au prix direct."
                className="mb-0"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Offre', 'Direct', 'Revendeur', 'Écart', 'Opérateur', 'Écart', 'Marge à la revente'].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {OFFRES.filter((o) => !o.surDevis && o.statut === 'publiee').map((o) => {
                    const ecartRev = Math.round(
                      ((o.prix.direct - o.prix.revendeur) / o.prix.direct) * 1000,
                    ) / 10
                    const ecartOp = Math.round(
                      ((o.prix.direct - o.prix.operateur) / o.prix.direct) * 1000,
                    ) / 10
                    return (
                      <tr key={o.id} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5">
                          <span className="block text-[12.5px] font-semibold text-ink">{o.nom}</span>
                          <span className="block font-mono text-[10.5px] text-g-500">{o.code}</span>
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12.5px] font-bold text-ink">
                          {money(o.prix.direct)}
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                          {money(o.prix.revendeur)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone="accent" size="sm">
                            − {pct(ecartRev, 1)}
                          </Badge>
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                          {money(o.prix.operateur)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone="info" size="sm">
                            − {pct(ecartOp, 1)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-500">
                          {money(o.prix.direct - o.prix.revendeur)} par mois si revendu au prix direct
                        </td>
                      </tr>
                    )
                  })}
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
                    r: 'Nous ne vendons pas en direct sous le prix d’un revendeur sur son client',
                    d: 'Si un client apporté par un revendeur nous contacte, nous le renvoyons vers son revendeur. Court-circuiter un partenaire une fois suffit à détruire la confiance du réseau entier.',
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
                      { cle: 'Prix garanti', valeur: moneyPerMonth(o.prix.direct) },
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
              {mouvements.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-g-100 pb-1.5 last:border-0"
                >
                  <span className="min-w-0 text-[12px] text-ink">
                    <span className="mr-1.5 font-mono text-[10.5px] text-p-700">{a.action}</span>
                    {a.target}
                    {a.detail ? ` — ${a.detail}` : ''}
                  </span>
                  <span className="shrink-0 text-[10.5px] text-g-500">
                    {a.actor.nom} · {dateCourte(a.ts)}
                  </span>
                </div>
              ))}
              {[
                { q: '12 août 2026', qui: 'Jean-Vincent Kassi', d: 'Publication de l’offre Cloud Souverain — placement exclusivement libre et local' },
                { q: '4 août 2026', qui: 'Aïcha Bamba', d: 'Publication de l’offre Cloud Hybride — absorption d’une capacité VMware existante' },
                { q: '28 juillet 2026', qui: 'Jean-Vincent Kassi', d: 'Dépréciation de Cloud Start 2024 — 4 souscriptions maintenues au prix garanti' },
                { q: '11 juillet 2026', qui: 'Marc Ouattara', d: 'Ajustement du prix revendeur de Cloud Pro — de −15 % à −18 %' },
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
        onClose={fermerFormulaire}
        title={edition ? `Modifier ${edition.nom}` : 'Créer une offre'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={fermerFormulaire}>
              Annuler
            </Button>
            <GatedAction autorise={autorise('catalog.edit')} message={refus('catalog.edit')}>
              <Button disabled={!formValide} onClick={enregistrer}>
                {edition ? 'Enregistrer' : 'Créer en brouillon'}
              </Button>
            </GatedAction>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Nom commercial"
              required
              error={form.nom !== '' && !nomValide ? 'Deux caractères au minimum.' : undefined}
            >
              <Input
                value={form.nom}
                onChange={(e) => modifierForm('nom', e.target.value)}
                placeholder="Cloud Pro"
                autoFocus
              />
            </Field>
            <Field
              label="Code"
              required
              hint={
                edition?.statut === 'publiee'
                  ? 'immuable : il apparaît sur des factures déjà émises'
                  : 'apparaît sur les factures — immuable après publication'
              }
              error={
                form.code !== '' && !codeValide
                  ? 'Trois caractères au minimum, en majuscules, chiffres et tirets.'
                  : undefined
              }
            >
              <Input
                value={form.code}
                disabled={edition?.statut === 'publiee'}
                onChange={(e) => modifierForm('code', e.target.value.toUpperCase())}
                placeholder="CLOUD-PRO"
              />
            </Field>
          </div>
          <Field label="Catégorie">
            <Select
              value={form.categorie}
              onChange={(e) =>
                modifierForm('categorie', e.target.value as Offer['categorie'])
              }
            >
              {Object.entries(LIBELLE_CATEGORIE).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Caractéristiques" hint="phrase affichée sur la vitrine et le comparateur">
            <Input
              value={form.specs}
              onChange={(e) => modifierForm('specs', e.target.value)}
              placeholder="16 vCPU · 64 Go · 2 To SSD"
            />
          </Field>
          <Field label="Ce qui est inclus" hint="une ligne par élément">
            <Textarea
              rows={5}
              value={form.caracteristiques}
              onChange={(e) => modifierForm('caracteristiques', e.target.value)}
              placeholder={'Sauvegarde quotidienne incluse\nIP publique\nSupport en heures ouvrées'}
            />
          </Field>
          <MicroLabel className="pt-2">Tarification par canal</MicroLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Prix direct"
              hint="publié sur la vitrine"
              required={!form.surDevis}
              error={!form.surDevis && form.direct <= 0 ? 'Un prix est attendu.' : undefined}
            >
              <Input
                type="number"
                min={0}
                value={form.direct}
                disabled={form.surDevis}
                onChange={(e) => modifierForm('direct', Math.max(0, Number(e.target.value) || 0))}
                suffix="FCFA"
              />
            </Field>
            <Field
              label="Prix revendeur"
              hint="prix d’achat partenaire"
              error={
                !form.surDevis && form.revendeur > form.direct
                  ? 'Au-dessus du prix direct : le partenaire ne pourrait rien vendre.'
                  : undefined
              }
            >
              <Input
                type="number"
                min={0}
                value={form.revendeur}
                disabled={form.surDevis}
                onChange={(e) =>
                  modifierForm('revendeur', Math.max(0, Number(e.target.value) || 0))
                }
                suffix="FCFA"
              />
            </Field>
            <Field
              label="Prix opérateur"
              hint="volume négocié"
              error={
                !form.surDevis && form.operateur > form.revendeur
                  ? 'Au-dessus du prix revendeur : la hiérarchie des canaux s’inverse.'
                  : undefined
              }
            >
              <Input
                type="number"
                min={0}
                value={form.operateur}
                disabled={form.surDevis}
                onChange={(e) =>
                  modifierForm('operateur', Math.max(0, Number(e.target.value) || 0))
                }
                suffix="FCFA"
              />
            </Field>
          </div>
          <Field label="Engagement de disponibilité">
            <Select value={form.sla} onChange={(e) => modifierForm('sla', e.target.value)}>
              <option value="">Aucun engagement chiffré</option>
              <option value="99,9 %">99,9 %</option>
              <option value="99,95 %">99,95 %</option>
              <option value="99,99 %">99,99 %</option>
            </Select>
          </Field>
          <div className="space-y-3">
            <Switch
              checked={form.populaire}
              onChange={(v) => modifierForm('populaire', v)}
              label="Marquer comme populaire"
              description="Met l’offre en avant sur la vitrine. À utiliser sur l’offre que vous recommandez réellement, pas sur celle qui rapporte le plus."
            />
            <Switch
              checked={form.surDevis}
              onChange={(v) => modifierForm('surDevis', v)}
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
        onConfirm={() => depreciation && deprecier(depreciation)}
      />

      <ConfirmDialog
        open={suppression !== null}
        onClose={() => setSuppression(null)}
        titre="Supprimer une offre"
        ressource={suppression?.code ?? ''}
        libelleAction="Supprimer l’offre"
        pertes={[
          'L’offre disparaît du catalogue, sans trace côté client',
          'Aucune souscription n’est concernée : seule une offre jamais vendue peut être supprimée',
          'Une offre publiée, elle, ne se supprime pas — elle se déprécie',
        ]}
        onConfirm={() => suppression && supprimer(suppression)}
      />
    </div>
  )
}
