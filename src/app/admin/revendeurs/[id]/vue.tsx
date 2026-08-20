'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Palette, Percent, Plus } from 'lucide-react'
import { cn, trendSeries } from '@/lib/utils'
import { dateCourte, money, moneyPerMonth, num, pct } from '@/lib/format'
import { OFFRES, ORGANISATIONS, RELEVES_REVSHARE, RESELLERS } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'synthese', label: 'Synthèse' },
  { id: 'grille', label: 'Grille d’achat' },
  { id: 'clients', label: 'Clients finaux' },
  { id: 'marque', label: 'Marque blanche' },
  { id: 'revshare', label: 'Partage de revenus' },
]

export function VueRevendeur({ id }: { id: string }) {
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('synthese')

  const r = RESELLERS.find((x) => x.id === id)!
  const clients = ORGANISATIONS.filter((o) => r.clientsFinaux.includes(o.id))
  const releves = RELEVES_REVSHARE.filter((x) => x.reseller === r.nom)
  const orgRevendeur = ORGANISATIONS.find((o) => o.id === r.orgId)

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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] text-[12px] font-bold text-white"
              style={{ background: r.theme.primary }}
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
        <div className="grid gap-4 lg:grid-cols-2">
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
              <div className="grid gap-3 sm:grid-cols-2">
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
                    <Button size="sm" variant="secondary" iconBefore={<Plus size={13} />}>
                      Ajouter une offre
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
                          <GatedAction
                            autorise={autorise('reseller.manage')}
                            message={refus('reseller.manage')}
                          >
                            <Button size="sm" variant="ghost">
                              Modifier
                            </Button>
                          </GatedAction>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
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
        <div className="grid gap-4 lg:grid-cols-2">
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
                style={{ background: r.theme.primary }}
              >
                <span className="text-[13px] font-bold text-white">{r.nom}</span>
                <span
                  className="rounded-[5px] px-2.5 py-1 text-[11px] font-semibold text-white"
                  style={{ background: r.theme.accent }}
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
                checked
                label="Logo et couleurs du portail"
                description="En-tête, boutons principaux, accents. La structure des écrans reste identique."
              />
              <Switch
                checked
                label="Domaine dédié avec certificat"
                description="Certificat émis et renouvelé automatiquement pour le domaine du partenaire."
              />
              <Switch
                checked
                label="Modèles de courriels"
                description="Notifications, invitations, alertes : envoyées sous le nom et le domaine du partenaire."
              />
              <Switch
                checked
                label="En-tête des factures"
                description="Les factures émises au client final portent l’identité du partenaire."
              />
              <Switch
                checked={false}
                label="Structure des écrans"
                description="Non personnalisable. Quand un incident survient, nos équipes et les leurs doivent regarder le même écran et se comprendre immédiatement."
              />
              <Switch
                checked={false}
                label="Mentions légales de l’exploitant"
                description="Non masquable. La localisation des données et l’identité de l’exploitant technique restent visibles."
              />
            </div>
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
                            <Button size="sm" variant="ghost">
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
                                  onClick={() =>
                                    pousser({
                                      ton: 'ok',
                                      titre: `Partage de ${x.periode} validé`,
                                      detail: `${money(x.montant)} seront versés à ${r.nom} sous 15 jours, avec le relevé détaillé ligne par ligne.`,
                                    })
                                  }
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

          <div className="grid gap-4 lg:grid-cols-2">
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
                  <Input type="number" defaultValue={r.revsharePct} suffix="%" />
                </Field>
                <Field label="Périodicité du versement">
                  <Select defaultValue="mensuel">
                    <option value="mensuel">Mensuelle</option>
                    <option value="trimestriel">Trimestrielle</option>
                  </Select>
                </Field>
                <Field label="Délai de versement après validation" hint="jours">
                  <Input type="number" defaultValue={15} />
                </Field>
                <div className="space-y-3">
                  <Switch
                    checked
                    label="Calcul sur le chiffre d’affaires encaissé"
                    description="Et non facturé. Un partage versé sur une facture impayée devrait être récupéré ensuite, ce qui empoisonne la relation."
                  />
                  <Switch
                    checked
                    label="Déduire les avoirs de service de l’assiette"
                    description="Cohérent : nous ne reversons pas un partage sur un montant que nous avons crédité au client."
                  />
                  <Switch
                    checked
                    label="Relevé détaillé ligne par ligne"
                    description="Non désactivable. Un partenaire doit pouvoir vérifier son relevé, pas le prendre pour argent comptant."
                  />
                </div>
              </div>
              <GatedAction autorise={autorise('reseller.manage')} message={refus('reseller.manage')}>
                <Button className="mt-4" variant="secondary">
                  Enregistrer — préavis de 6 mois
                </Button>
              </GatedAction>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
