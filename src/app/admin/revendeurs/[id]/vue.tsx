'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Palette, Percent, Plus } from 'lucide-react'
import { cn, surfaceMarque, trendSeries } from '@/lib/utils'
import { dateCourte, money, moneyPerMonth, num, pct } from '@/lib/format'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { Modal } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { useApp } from '@/components/app/contexte'
import { useActe, useAtelier } from '@/components/app/atelier'
import type { Reseller } from '@/lib/types'

const ONGLETS = [
  { id: 'synthese', label: 'Synthèse' },
  { id: 'grille', label: 'Grille d’achat' },
  { id: 'clients', label: 'Clients finaux' },
  { id: 'marque', label: 'Marque blanche' },
  { id: 'revshare', label: 'Partage de revenus' },
]

function RevendeurIntrouvable({ id }: { id: string }) {
  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace fournisseur', href: '/admin' },
          { label: 'Revendeurs', href: '/admin/revendeurs' },
          { label: 'Introuvable' },
        ]}
        titre="Partenaire introuvable"
        sousTitre={`Aucun partenaire ne porte l’identifiant ${id}. Son agrément a peut-être été retiré.`}
      />
      <Card>
        <p className="rounded-[8px] border border-dashed border-g-300 px-4 py-10 text-center text-[12.5px] text-g-500">
          Un agrément retiré fait disparaître la fiche. Ses clients finaux, eux, restent servis : ils
          sont passés en direct.
        </p>
        <ButtonLink variant="secondary" className="mt-4" href="/admin/revendeurs">
          Revenir à la liste
        </ButtonLink>
      </Card>
    </div>
  )
}

export function VueRevendeur({ id }: { id: string }) {
  const { revendeurs } = useAtelier()
  const r = revendeurs.parId(id)
  if (!r) return <RevendeurIntrouvable id={id} />
  return <FicheRevendeur r={r} />
}

const PERSONNALISATION_INITIALE = {
  logo: true,
  domaine: true,
  courriels: true,
  factures: true,
}

function FicheRevendeur({ r }: { r: Reseller }) {
  const { autorise, refus } = useApp()
  const { revendeurs, organisations, revshare, offres } = useAtelier()
  const acte = useActe()

  const [onglet, setOnglet] = useState('synthese')
  const [ligne, setLigne] = useState<{ offerId: string; prixAchat: number; prixVente: number } | null>(
    null,
  )
  const [ajout, setAjout] = useState(false)
  const [personnalisation, setPersonnalisation] = useState(PERSONNALISATION_INITIALE)
  const [partage, setPartage] = useState({
    taux: r.revsharePct,
    periodicite: 'mensuel',
    delaiJours: 15,
    surEncaisse: true,
    deduireAvoirs: true,
  })

  const clients = organisations.liste.filter((o) => r.clientsFinaux.includes(o.id))
  const releves = revshare.liste.filter((x) => x.reseller === r.nom)
  const orgRevendeur = organisations.parId(r.orgId)
  const OFFRES = offres.liste
  const offresHorsGrille = OFFRES.filter(
    (o) => o.statut === 'publiee' && !o.surDevis && !r.grille.some((g) => g.offerId === o.id),
  )

  const enregistrerLigne = (
    valeur: { offerId: string; prixAchat: number; prixVente: number },
    creation: boolean,
  ) => {
    const offre = OFFRES.find((o) => o.id === valeur.offerId)
    acte({
      faire: () =>
        revendeurs.modifier(r.id, (courant) => ({
          grille: creation
            ? [...courant.grille, valeur]
            : courant.grille.map((g) => (g.offerId === valeur.offerId ? valeur : g)),
        })),
      titre: creation
        ? `${offre?.nom ?? valeur.offerId} ajoutée à la grille`
        : `Grille mise à jour sur ${offre?.nom ?? valeur.offerId}`,
      detail: `Prix d’achat ${money(valeur.prixAchat)}, prix de vente indicatif ${money(valeur.prixVente)}. Une hausse du prix d’achat ne s’applique jamais aux engagements en cours de ses clients.`,
      action: creation ? 'reseller.grid.add' : 'reseller.grid.update',
      cible: `${r.id}/${valeur.offerId}`,
      orgNom: r.nom,
    })
    setLigne(null)
    setAjout(false)
  }

  const retirerLigne = (offerId: string) => {
    const offre = OFFRES.find((o) => o.id === offerId)
    acte({
      faire: () =>
        revendeurs.modifier(r.id, (courant) => ({
          grille: courant.grille.filter((g) => g.offerId !== offerId),
        })),
      ton: 'warn',
      titre: `${offre?.nom ?? offerId} retirée de la grille`,
      detail:
        'Le partenaire ne peut plus souscrire cette offre. Ses clients qui l’ont déjà souscrite continuent d’être servis au prix garanti.',
      action: 'reseller.grid.remove',
      cible: `${r.id}/${offerId}`,
      orgNom: r.nom,
    })
  }

  const validerVersement = (x: (typeof releves)[number]) => {
    acte({
      faire: () => revshare.modifier(`${x.reseller}·${x.periode}`, { statut: 'réglé' }),
      titre: `Partage de ${x.periode} validé`,
      detail: `${money(x.montant)} seront versés à ${r.nom} sous ${partage.delaiJours} jours, avec le relevé détaillé ligne par ligne.`,
      action: 'revshare.payout.approve',
      cible: `${r.id}/${x.periode}`,
      orgNom: r.nom,
    })
  }

  const enregistrerPartage = () => {
    acte({
      faire: () => revendeurs.modifier(r.id, { revsharePct: partage.taux }),
      ton: 'info',
      titre: 'Réglages du partage enregistrés',
      detail: `Taux ${pct(partage.taux)}, versement ${partage.periodicite === 'mensuel' ? 'mensuel' : 'trimestriel'} sous ${partage.delaiJours} jours. Le nouveau taux ne s’applique qu’après six mois de préavis, et jamais aux engagements en cours.`,
      action: 'revshare.settings.update',
      cible: r.id,
      orgNom: r.nom,
    })
  }

  const enregistrerPersonnalisation = () => {
    const actifs = Object.entries(personnalisation)
      .filter(([, v]) => v)
      .map(([k]) => k)
    acte({
      faire: () => undefined,
      titre: 'Périmètre de personnalisation enregistré',
      detail: `${actifs.length} élément${actifs.length > 1 ? 's' : ''} thématisé${actifs.length > 1 ? 's' : ''} sur ${r.theme.domaine}. La structure des écrans et les mentions de l’exploitant restent inchangées.`,
      action: 'reseller.branding.update',
      cible: r.id,
      orgNom: r.nom,
    })
  }

  const caMensuelClients = clients.reduce((a, o) => a + (o.caMensuel ?? 0), 0)
  const margeMoyenne =
    r.grille.length > 0
      ? Math.round(
          (r.grille.reduce(
            (a, g) => a + ((g.prixVente - g.prixAchat) / g.prixVente) * 100,
            0,
          ) /
            r.grille.length) *
            10,
        ) / 10
      : 0

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace fournisseur', href: '/admin' },
          { label: 'Revendeurs', href: '/admin/revendeurs' },
          { label: r.nom },
        ]}
        titre={
          <span className="flex flex-wrap items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] text-[12px] font-bold"
              style={{
                background: surfaceMarque(r.theme.primary).fond,
                color: surfaceMarque(r.theme.primary).texte,
              }}
            >
              {r.nom.slice(0, 2).toUpperCase()}
            </span>
            <span>{r.nom}</span>
          </span>
        }
        sousTitre={`${clients.length} clients finaux · portail servi sur ${r.theme.domaine} · partage de revenus de ${r.revsharePct} %`}
        meta={
          <>
            <Badge tone="accent" size="sm">
              {pct(r.revsharePct)} de partage
            </Badge>
            <Badge tone="neutral" size="sm">
              {r.catalogue.length} offres revendues
            </Badge>
            {orgRevendeur && (
              <Badge tone="neutral" size="sm">
                {orgRevendeur.pays}
              </Badge>
            )}
          </>
        }
        actions={
          <>
            <ButtonLink
              variant="secondary"
              external
              href={`https://${r.theme.domaine}`}
              iconAfter={<ExternalLink size={13} />}
            >
              Voir son portail
            </ButtonLink>
            {orgRevendeur && (
              <ButtonLink variant="ghost" href={`/admin/organisations/${orgRevendeur.id}`}>
                Organisation revendeur
              </ButtonLink>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          libelle="CA apporté"
          valeur={money(r.caGenere)}
          ton="ok"
          serie={trendSeries(`rev-${r.id}`, 12, r.caGenere * 0.62, r.caGenere)}
        />
        <StatTile libelle="Marge dégagée" valeur={money(r.marge)} ton="accent" />
        <StatTile libelle="Clients finaux" valeur={clients.length} />
        <StatTile
          libelle="CA mensuel des clients"
          valeur={money(caMensuelClients)}
          detail="Facturation récurrente"
        />
        <StatTile
          libelle="Marge moyenne à la revente"
          valeur={pct(margeMoyenne, 1)}
          ton="accent"
          detail="Sur sa grille de prix"
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'synthese' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader titre="Fiche partenaire" />
            <KeyValueList
              colonnes={1}
              items={[
                { cle: 'Identifiant', valeur: r.id },
                { cle: 'Raison sociale', valeur: r.nom },
                { cle: 'Organisation revendeur', valeur: orgRevendeur?.nom ?? r.orgId },
                { cle: 'Pays', valeur: orgRevendeur?.pays ?? '—' },
                { cle: 'Domaine du portail', valeur: r.theme.domaine },
                { cle: 'Partage de revenus', valeur: pct(r.revsharePct) },
                { cle: 'Offres au catalogue', valeur: `${r.catalogue.length} sur ${OFFRES.length}` },
                { cle: 'Clients finaux', valeur: String(clients.length) },
                {
                  cle: 'Protection des comptes',
                  valeur: 'Active — aucun démarchage direct de nos équipes sur ses clients',
                },
              ]}
            />
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader
                titre="Ce que le partenaire porte"
                sousTitre="La répartition des rôles, telle qu’elle figure au contrat."
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-[8px] border border-m-600/30 bg-m-050 p-3.5">
                  <MicroLabel className="text-m-600">Le partenaire</MicroLabel>
                  <ul className="mt-2 space-y-1.5">
                    {[
                      'Relation commerciale',
                      'Facturation du client final',
                      'Support de premier niveau',
                      'Conseil et accompagnement',
                      'Prix de vente qu’il fixe librement',
                    ].map((x) => (
                      <li key={x} className="text-[11.5px] leading-relaxed text-ink">
                        · {x}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[8px] border border-p-300 bg-p-050 p-3.5">
                  <MicroLabel className="text-p-700">Nous</MicroLabel>
                  <ul className="mt-2 space-y-1.5">
                    {[
                      'Exploitation de la plateforme',
                      'Engagements de disponibilité',
                      'Support de deuxième niveau',
                      'Sauvegardes et supervision',
                      'Mises à jour et sécurité',
                    ].map((x) => (
                      <li key={x} className="text-[11.5px] leading-relaxed text-ink">
                        · {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Callout ton="violet" className="mt-4" titre="Le client final peut toujours nous saisir">
                Même si le contrat passe par ce partenaire. En cas de panne, nous traitons l’incident
                technique sans attendre et nous informons le partenaire — la question contractuelle
                vient après le rétablissement du service.
              </Callout>
            </Card>

            <Card>
              <CardHeader
                titre="Évolution du chiffre d’affaires apporté"
                sousTitre="Douze derniers mois."
              />
              <div className="flex items-end gap-1.5">
                {trendSeries(`rev-ca-${r.id}`, 12, r.caGenere * 0.6, r.caGenere).map((v, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t-sm bg-p-600"
                    style={{ height: `${30 + (v / r.caGenere) * 90}px` }}
                    title={money(Math.round(v))}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10.5px] text-g-500">
                <span>Sept. 2025</span>
                <span>Août 2026</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'grille' && (
        <div className="space-y-4">
          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3.5">
              <CardHeader
                titre="Grille d’achat et de vente"
                sousTitre="Le prix d’achat est celui que nous facturons au partenaire. Le prix de vente est celui qu’il pratique — il le fixe librement, nous ne l’imposons pas."
                className="mb-0"
                actions={
                  <GatedAction
                    autorise={autorise('reseller.manage')}
                    message={refus('reseller.manage')}
                  >
                    <Button
                      size="sm"
                      variant="secondary"
                      iconBefore={<Plus size={13} />}
                      disabled={offresHorsGrille.length === 0}
                      onClick={() => {
                        const o = offresHorsGrille[0]
                        setLigne({
                          offerId: o.id,
                          prixAchat: o.prix.revendeur,
                          prixVente: o.prix.direct,
                        })
                        setAjout(true)
                      }}
                    >
                      {offresHorsGrille.length === 0
                        ? 'Catalogue complet'
                        : 'Ajouter une offre'}
                    </Button>
                  </GatedAction>
                }
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Offre', 'Prix public', 'Prix d’achat partenaire', 'Remise', 'Prix de vente pratiqué', 'Marge partenaire', ''].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {r.grille.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-[12.5px] text-g-500">
                        Aucune offre dans sa grille d’achat : ce partenaire ne peut rien vendre
                        tant qu’au moins une n’y figure pas.
                      </td>
                    </tr>
                  )}
                  {r.grille.map((g) => {
                    const offre = OFFRES.find((o) => o.id === g.offerId)
                    const remise = offre
                      ? Math.round(((offre.prix.direct - g.prixAchat) / offre.prix.direct) * 1000) / 10
                      : 0
                    const marge = Math.round(((g.prixVente - g.prixAchat) / g.prixVente) * 1000) / 10
                    return (
                      <tr key={g.offerId} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5">
                          <span className="block text-[12.5px] font-semibold text-ink">
                            {offre?.nom ?? g.offerId}
                          </span>
                          <span className="block font-mono text-[10.5px] text-g-500">
                            {offre?.code ?? '—'}
                          </span>
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                          {offre ? money(offre.prix.direct) : '—'}
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12.5px] font-bold text-ink">
                          {money(g.prixAchat)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone="accent" size="sm">
                            − {pct(remise, 1)}
                          </Badge>
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                          {money(g.prixVente)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-2">
                            <span className="relative block h-2 w-16 overflow-hidden rounded-full bg-g-100">
                              <span
                                className={cn(
                                  'absolute inset-y-0 left-0 rounded-full',
                                  marge > 25 ? 'bg-ok' : marge > 12 ? 'bg-p-600' : 'bg-warn',
                                )}
                                style={{ width: `${Math.min(100, marge * 2)}%` }}
                              />
                            </span>
                            <span className="tnum text-[12px] font-bold text-ink">
                              {pct(marge, 1)}
                            </span>
                            <span className="text-[10.5px] text-g-500">
                              {money(g.prixVente - g.prixAchat)}/mois
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="flex items-center justify-end gap-1.5">
                            <GatedAction
                              autorise={autorise('reseller.manage')}
                              message={refus('reseller.manage')}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setAjout(false)
                                  setLigne({ ...g })
                                }}
                              >
                                Modifier
                              </Button>
                            </GatedAction>
                            <GatedAction
                              autorise={autorise('reseller.manage')}
                              message={refus('reseller.manage')}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-err hover:bg-err-bg"
                                onClick={() => retirerLigne(g.offerId)}
                              >
                                Retirer
                              </Button>
                            </GatedAction>
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Callout ton="violet" titre="Nous n’imposons pas de prix de vente">
              Fixer le prix de revente d’un partenaire serait à la fois contestable juridiquement et
              contre-productif : c’est lui qui connaît son marché, sa structure de coûts et la valeur
              de son accompagnement. Nous garantissons son prix d’achat, il décide de sa marge.
            </Callout>
            <Card>
              <CardHeader
                titre="Garanties sur la grille"
                sousTitre="Ce sur quoi le partenaire peut s’appuyer pour construire une offre."
              />
              <KeyValueList
                colonnes={1}
                items={[
                  {
                    cle: 'Prix d’achat garanti',
                    valeur: 'Pour la durée de l’engagement de chacun de ses clients',
                  },
                  { cle: 'Préavis d’évolution de grille', valeur: '6 mois' },
                  { cle: 'Application d’une hausse', valeur: 'Nouvelles souscriptions seulement' },
                  {
                    cle: 'Protection des comptes',
                    valeur: 'Aucun démarchage direct de nos équipes sur ses clients',
                  },
                  {
                    cle: 'Sous-cotation',
                    valeur: 'Nous ne consentons aucune remise qui viendrait sous son prix sur son client',
                  },
                ]}
              />
            </Card>
          </div>
        </div>
      )}

      {onglet === 'clients' && (
        <Card padding={false}>
          <div className="border-b border-g-100 px-4 py-3.5">
            <CardHeader
              titre="Clients finaux"
              sousTitre="Les organisations dont ce partenaire porte le contrat. Nous voyons leurs métadonnées ; leur relation commerciale reste la sienne."
              className="mb-0"
            />
          </div>
          {clients.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12.5px] text-g-500">
              Aucun client final rattaché à ce partenaire.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Organisation', 'Pays', 'Secteur', 'Espaces', 'Utilisateurs', 'CA mensuel', 'Statut', ''].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {clients.map((o) => (
                    <tr key={o.id} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/admin/organisations/${o.id}`}
                          className="text-[12.5px] font-semibold text-ink hover:text-p-700"
                        >
                          {o.nom}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-g-700">{o.pays}</td>
                      <td className="px-3 py-2.5 text-[11.5px] text-g-700">{o.secteur ?? '—'}</td>
                      <td className="tnum px-3 py-2.5 text-[12px] text-g-700">{o.espaces ?? 0}</td>
                      <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                        {o.utilisateurs ?? 0}
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12px] font-semibold text-ink">
                        {o.caMensuel ? money(o.caMensuel) : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          tone={
                            o.statut === 'active'
                              ? 'ok'
                              : o.statut === 'suspendue'
                                ? 'warn'
                                : 'neutral'
                          }
                          dot
                          size="sm"
                        >
                          {o.statut}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <ButtonLink size="sm" variant="ghost" href={`/admin/organisations/${o.id}`}>
                          Ouvrir
                        </ButtonLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-g-300 bg-p-050">
                    <td colSpan={5} className="px-3 py-2.5 text-right text-[12.5px] font-bold text-ink">
                      CA mensuel cumulé
                    </td>
                    <td className="tnum px-3 py-2.5 text-[13px] font-bold text-p-700">
                      {money(caMensuelClients)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          <div className="border-t border-g-100 px-4 py-3">
            <p className="text-[11.5px] leading-relaxed text-g-500">
              Si l’un de ces clients nous contacte directement pour une question commerciale, nous le
              renvoyons vers son partenaire et nous en informons celui-ci. En cas d’incident technique
              en revanche, nous traitons immédiatement.
            </p>
          </div>
        </Card>
      )}

      {onglet === 'marque' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Identité du portail"
              sousTitre="Le portail est servi sous le domaine et les couleurs du partenaire."
              actions={<Palette size={15} className="text-p-700" />}
            />
            <div className="space-y-3">
              <CopyField label="Domaine servi" value={r.theme.domaine} />
              <CopyField label="Cible CNAME à créer" value="portail.synelia.cloud" />
              <CopyField label="Couleur principale" value={r.theme.primary} />
              <CopyField label="Couleur d’accentuation" value={r.theme.accent} />
            </div>
            <MicroLabel className="mt-4 mb-2">Aperçu de la palette</MicroLabel>
            <div className="overflow-hidden rounded-[8px] border border-g-300">
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: surfaceMarque(r.theme.primary).fond }}
              >
                <span
                  className="text-[13px] font-bold"
                  style={{ color: surfaceMarque(r.theme.primary).texte }}
                >
                  {r.nom}
                </span>
                <span
                  className="rounded-[5px] px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: surfaceMarque(r.theme.accent).fond,
                    color: surfaceMarque(r.theme.accent).texte,
                  }}
                >
                  Ouvrir
                </span>
              </div>
              <div className="bg-white px-4 py-3">
                <p className="text-[12px] text-ink">
                  Le client final voit cette identité, sur {r.theme.domaine}.
                </p>
              </div>
            </div>
            <Callout ton="info" className="mt-4" titre="Ce que nous ne masquons jamais">
              La mention légale de l’exploitant technique et la localisation des données restent
              visibles dans les mentions du portail et sur les factures. Un client a le droit de savoir
              qui exploite réellement son infrastructure et où sont ses données — c’est une obligation,
              pas une option commerciale.
            </Callout>
          </Card>

          <Card>
            <CardHeader
              titre="Périmètre de personnalisation"
              sousTitre="Ce qui est thématisable, et ce qui ne l’est pas."
            />
            <div className="space-y-3.5">
              <Switch
                checked={personnalisation.logo}
                onChange={(v) => setPersonnalisation((c) => ({ ...c, logo: v }))}
                label="Logo et couleurs du portail"
                description="En-tête, boutons principaux, accents. La structure des écrans reste identique."
              />
              <Switch
                checked={personnalisation.domaine}
                onChange={(v) => setPersonnalisation((c) => ({ ...c, domaine: v }))}
                label="Domaine dédié avec certificat"
                description="Certificat émis et renouvelé automatiquement pour le domaine du partenaire."
              />
              <Switch
                checked={personnalisation.courriels}
                onChange={(v) => setPersonnalisation((c) => ({ ...c, courriels: v }))}
                label="Modèles de courriels"
                description="Notifications, invitations, alertes : envoyées sous le nom et le domaine du partenaire."
              />
              <Switch
                checked={personnalisation.factures}
                onChange={(v) => setPersonnalisation((c) => ({ ...c, factures: v }))}
                label="En-tête des factures"
                description="Les factures émises au client final portent l’identité du partenaire."
              />
              <Switch
                checked={false}
                disabled
                label="Structure des écrans"
                description="Non personnalisable. Quand un incident survient, nos équipes et les leurs doivent regarder le même écran et se comprendre immédiatement."
              />
              <Switch
                checked={false}
                disabled
                label="Mentions légales de l’exploitant"
                description="Non masquable. La localisation des données et l’identité de l’exploitant technique restent visibles."
              />
            </div>
            <GatedAction autorise={autorise('reseller.manage')} message={refus('reseller.manage')}>
              <Button className="mt-4" variant="secondary" onClick={enregistrerPersonnalisation}>
                Enregistrer le périmètre
              </Button>
            </GatedAction>
          </Card>
        </div>
      )}

      {onglet === 'revshare' && (
        <div className="space-y-4">
          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3.5">
              <CardHeader
                titre="Relevés de partage"
                sousTitre="Calculés automatiquement chaque mois sur le chiffre d’affaires encaissé, pas facturé : nous ne reversons pas un partage sur une facture impayée, et nous le disons."
                className="mb-0"
                actions={<Percent size={15} className="text-m-600" />}
              />
            </div>
            {releves.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12.5px] text-g-500">
                Aucun relevé pour ce partenaire.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse">
                  <thead>
                    <tr className="border-b border-g-300 bg-g-050">
                      {['Période', 'CA généré', 'Taux', 'Montant du partage', 'Statut', ''].map((h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {releves.map((x) => (
                      <tr key={x.periode} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5 text-[12.5px] font-semibold text-ink">
                          {x.periode}
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                          {money(x.caGenere)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone="accent" size="sm">
                            {pct(x.revsharePct)}
                          </Badge>
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12.5px] font-bold text-ink">
                          {money(x.montant)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone={x.statut === 'réglé' ? 'ok' : 'info'} dot size="sm">
                            {x.statut}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                acte({
                                  ton: 'info',
                                  titre: `Relevé de ${x.periode}`,
                                  detail: `${money(x.caGenere)} de chiffre d’affaires encaissé, ${pct(x.revsharePct)} de partage, soit ${money(x.montant)}. Le détail ligne par ligne est joint au relevé.`,
                                  action: 'revshare.statement.open',
                                  cible: `${r.id}/${x.periode}`,
                                  orgNom: r.nom,
                                })
                              }
                            >
                              Détail
                            </Button>
                            {x.statut !== 'réglé' && (
                              <GatedAction
                                autorise={autorise('reseller.manage')}
                                message={refus('reseller.manage')}
                              >
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => validerVersement(x)}
                                >
                                  Valider le versement
                                </Button>
                              </GatedAction>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-g-300 bg-p-050">
                      <td className="px-3 py-2.5 text-right text-[12.5px] font-bold text-ink">
                        Cumul
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] font-bold text-ink">
                        {money(releves.reduce((a, x) => a + x.caGenere, 0))}
                      </td>
                      <td />
                      <td className="tnum px-3 py-2.5 text-[13px] font-bold text-p-700">
                        {money(releves.reduce((a, x) => a + x.montant, 0))}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Comment le partage est calculé"
                sousTitre="Le calcul doit être vérifiable par le partenaire, pas seulement affiché."
              />
              <ol className="space-y-2.5">
                {[
                  {
                    t: 'Chiffre d’affaires encaissé du mois',
                    d: 'Somme des factures de ses clients finaux effectivement réglées pendant le mois. Une facture émise mais impayée n’entre pas dans le calcul.',
                  },
                  {
                    t: 'Déduction des avoirs de service',
                    d: 'Si un engagement de disponibilité n’a pas été tenu, l’avoir accordé au client est déduit de l’assiette. Nous ne reversons pas un partage sur un montant que nous avons crédité.',
                  },
                  {
                    t: 'Application du taux contractuel',
                    d: `${pct(r.revsharePct)} pour ce partenaire, appliqué à l’assiette nette.`,
                  },
                  {
                    t: 'Relevé détaillé et versement',
                    d: 'Le relevé liste chaque client, chaque offre et chaque ligne. Le versement suit sous quinze jours après validation.',
                  },
                ].map((x, i) => (
                  <li key={x.t} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-m-050 text-[11px] font-bold text-m-600">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold text-ink">{x.t}</span>
                      <span className="block text-[11.5px] leading-relaxed text-g-500">{x.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Card>

            <Card>
              <CardHeader
                titre="Réglages du partage"
                sousTitre="Toute modification fait l’objet de six mois de préavis."
              />
              <div className="space-y-4">
                <Field label="Taux de partage" hint="pourcentage du CA encaissé reversé au partenaire">
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    value={partage.taux}
                    suffix="%"
                    onChange={(e) =>
                      setPartage((c) => ({
                        ...c,
                        taux: Math.min(60, Math.max(0, Number(e.target.value) || 0)),
                      }))
                    }
                  />
                </Field>
                <Field label="Périodicité du versement">
                  <Select
                    value={partage.periodicite}
                    onChange={(e) => setPartage((c) => ({ ...c, periodicite: e.target.value }))}
                  >
                    <option value="mensuel">Mensuelle</option>
                    <option value="trimestriel">Trimestrielle</option>
                  </Select>
                </Field>
                <Field label="Délai de versement après validation" hint="jours">
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={partage.delaiJours}
                    onChange={(e) =>
                      setPartage((c) => ({
                        ...c,
                        delaiJours: Math.min(90, Math.max(1, Number(e.target.value) || 1)),
                      }))
                    }
                  />
                </Field>
                <div className="space-y-3">
                  <Switch
                    checked={partage.surEncaisse}
                    onChange={(v) => setPartage((c) => ({ ...c, surEncaisse: v }))}
                    label="Calcul sur le chiffre d’affaires encaissé"
                    description="Et non facturé. Un partage versé sur une facture impayée devrait être récupéré ensuite, ce qui empoisonne la relation."
                  />
                  <Switch
                    checked={partage.deduireAvoirs}
                    onChange={(v) => setPartage((c) => ({ ...c, deduireAvoirs: v }))}
                    label="Déduire les avoirs de service de l’assiette"
                    description="Cohérent : nous ne reversons pas un partage sur un montant que nous avons crédité au client."
                  />
                  <Switch
                    checked
                    disabled
                    label="Relevé détaillé ligne par ligne"
                    description="Non désactivable. Un partenaire doit pouvoir vérifier son relevé, pas le prendre pour argent comptant."
                  />
                </div>
              </div>
              <GatedAction autorise={autorise('reseller.manage')} message={refus('reseller.manage')}>
                <Button
                  className="mt-4"
                  variant="secondary"
                  disabled={partage.taux === r.revsharePct}
                  onClick={enregistrerPartage}
                >
                  Enregistrer — préavis de 6 mois
                </Button>
              </GatedAction>
            </Card>
          </div>
        </div>
      )}

      <Modal
        open={ligne !== null}
        onClose={() => {
          setLigne(null)
          setAjout(false)
        }}
        title={ajout ? 'Ajouter une offre à la grille' : 'Modifier la ligne de grille'}
        description="Le prix d’achat est ce que nous facturons au partenaire. Le prix de vente n’est qu’indicatif : il le fixe librement."
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setLigne(null)
                setAjout(false)
              }}
            >
              Annuler
            </Button>
            <Button
              disabled={
                ligne === null || ligne.prixAchat <= 0 || ligne.prixVente < ligne.prixAchat
              }
              onClick={() => ligne && enregistrerLigne(ligne, ajout)}
            >
              {ajout ? 'Ajouter à la grille' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        {ligne && (
          <div className="space-y-4">
            <Field label="Offre">
              <Select
                value={ligne.offerId}
                disabled={!ajout}
                onChange={(e) => {
                  const o = OFFRES.find((x) => x.id === e.target.value)
                  setLigne({
                    offerId: e.target.value,
                    prixAchat: o?.prix.revendeur ?? 0,
                    prixVente: o?.prix.direct ?? 0,
                  })
                }}
              >
                {(ajout
                  ? offresHorsGrille
                  : OFFRES.filter((o) => o.id === ligne.offerId)
                ).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nom} — prix public {money(o.prix.direct)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Prix d’achat partenaire" required>
                <Input
                  type="number"
                  min={0}
                  value={ligne.prixAchat}
                  suffix="FCFA"
                  onChange={(e) =>
                    setLigne((l) =>
                      l ? { ...l, prixAchat: Math.max(0, Number(e.target.value) || 0) } : l,
                    )
                  }
                />
              </Field>
              <Field
                label="Prix de vente pratiqué"
                hint="indicatif"
                error={
                  ligne.prixVente < ligne.prixAchat
                    ? 'Un prix de vente sous le prix d’achat fait perdre de l’argent au partenaire.'
                    : undefined
                }
              >
                <Input
                  type="number"
                  min={0}
                  value={ligne.prixVente}
                  suffix="FCFA"
                  onChange={(e) =>
                    setLigne((l) =>
                      l ? { ...l, prixVente: Math.max(0, Number(e.target.value) || 0) } : l,
                    )
                  }
                />
              </Field>
            </div>
            <KeyValueList
              colonnes={2}
              items={[
                {
                  cle: 'Remise sur le prix public',
                  valeur: (() => {
                    const o = OFFRES.find((x) => x.id === ligne.offerId)
                    if (!o || o.prix.direct === 0) return '—'
                    return `− ${pct(
                      Math.round(((o.prix.direct - ligne.prixAchat) / o.prix.direct) * 1000) / 10,
                      1,
                    )}`
                  })(),
                },
                {
                  cle: 'Marge du partenaire',
                  valeur:
                    ligne.prixVente > 0
                      ? `${money(ligne.prixVente - ligne.prixAchat)}/mois`
                      : '—',
                },
              ]}
            />
            <Callout ton="warn" titre="Une hausse ne rattrape jamais l’existant">
              Le prix d’achat modifié ne s’applique qu’aux nouvelles souscriptions du partenaire. Ses
              clients déjà engagés conservent le prix garanti au moment de leur signature.
            </Callout>
          </div>
        )}
      </Modal>
    </div>
  )
}
