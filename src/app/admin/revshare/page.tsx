'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Percent, Send } from 'lucide-react'
import { cn, trendSeries } from '@/lib/utils'
import { dateCourte, money, num, pct } from '@/lib/format'
import {
  ORGANISATIONS,
  RELEVES_REVSHARE,
  RESELLERS,
  type ReleveRevshare,
} from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { Drawer } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { useApp } from '@/components/app/contexte'
import { useCollection } from '@/components/app/atelier'
import { BoutonAction, useOperation } from '@/components/app/actions'

const ONGLETS = [
  { id: 'releves', label: 'Relevés' },
  { id: 'calcul', label: 'Méthode de calcul' },
  { id: 'previsionnel', label: 'Prévisionnel' },
]

export default function Revshare() {
  const { autorise, refus } = useApp()
  const executer = useOperation()
  const releves = useCollection<ReleveRevshare>('releves-revshare', RELEVES_REVSHARE)
  const [onglet, setOnglet] = useState('releves')
  const [detailId, setDetail] = useState<string | null>(null)
  const detail = releves.items.find((r) => r.id === detailId) ?? null
  const [assietteEncaisse, setAssietteEncaisse] = useState(true)
  const [deduireAvoirs, setDeduireAvoirs] = useState(true)
  const [deduireRemises, setDeduireRemises] = useState(true)
  const [delaiContestation, setDelaiContestation] = useState(true)
  const [compenserNegatif, setCompenserNegatif] = useState(false)
  const [simPartenaire, setSimPartenaire] = useState(RESELLERS[0]?.id ?? '')
  const [simTaux, setSimTaux] = useState(25)

  /** Validation d'un relevé : versement sous 15 jours, statut réglé à la fin. */
  const valider = (r: ReleveRevshare) =>
    executer({
      action: 'reseller.manage',
      titre: `Relevé de ${r.periode} validé`,
      detail: `${money(r.montant)} seront versés à ${r.reseller} sous 15 jours, avec le relevé détaillé.`,
      job: {
        type: 'revshare.paiement',
        label: `Versement ${r.reseller} · ${r.periode}`,
        etapes: [
          'Figer le relevé et ses lignes',
          'Envoyer le relevé au partenaire',
          'Ordonner le virement',
        ],
        dureeEtapeMs: 1100,
      },
      effetFinal: () => releves.modifier(r.id, { statut: 'réglé' }),
    })

  const aRegler = releves.items.filter((r) => r.statut !== 'réglé')
  const regles = releves.items.filter((r) => r.statut === 'réglé')
  const totalDu = aRegler.reduce((a, r) => a + r.montant, 0)
  const totalVerse = regles.reduce((a, r) => a + r.montant, 0)
  const caApporte = releves.items.reduce((a, r) => a + r.caGenere, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Partage de revenus"
        sousTitre="Ce que nous reversons à nos partenaires, calculé sur le chiffre d’affaires réellement encaissé et non facturé. Le relevé est détaillé ligne par ligne : un partenaire doit pouvoir le vérifier, pas nous croire sur parole."
        actions={
          <GatedAction autorise={autorise('reseller.manage')} message={refus('reseller.manage')}>
            <BoutonAction
              libelle="Exporter les relevés"
              size="md"
              icone={<Download size={14} />}
              operation={{
                action: 'reseller.manage',
                titre: 'Export des relevés préparé',
                detail: `${releves.items.length} relevés, avec le détail des lignes et des déductions.`,
              }}
            />
          </GatedAction>
        }
        meta={
          <>
            <Badge tone="neutral" size="sm">
              {RESELLERS.length} partenaires
            </Badge>
            {totalDu > 0 && (
              <Badge tone="warn" dot size="sm">
                {money(totalDu)} à verser
              </Badge>
            )}
            <Badge tone="ok" size="sm">
              {money(totalVerse)} versés
            </Badge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          libelle="CA apporté par les partenaires"
          valeur={money(caApporte)}
          ton="ok"
          serie={trendSeries('revshare-ca', 12, caApporte * 0.55, caApporte)}
        />
        <StatTile libelle="Partage versé" valeur={money(totalVerse)} detail={`${regles.length} relevés réglés`} />
        <StatTile
          libelle="Partage à verser"
          valeur={money(totalDu)}
          ton={totalDu > 0 ? 'warn' : 'ok'}
          detail={`${aRegler.length} relevé${aRegler.length > 1 ? 's' : ''} en attente`}
        />
        <StatTile
          libelle="Taux moyen"
          valeur={pct(
            Math.round(
              (RESELLERS.reduce((a, r) => a + r.revsharePct, 0) / RESELLERS.length) * 10,
            ) / 10,
            1,
          )}
          ton="accent"
        />
        <StatTile
          libelle="Délai de versement"
          valeur="15 jours"
          ton="ok"
          detail="Après validation du relevé"
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'releves' && (
        <div className="space-y-4">
          {aRegler.length > 0 && (
            <Callout ton="warn" titre={`${money(totalDu)} de partage en attente de validation`}>
              {aRegler.map((r) => `${r.reseller} — ${r.periode} (${money(r.montant)})`).join(' · ')}.
              Un relevé validé est versé sous quinze jours. Prendre du retard sur un versement de
              partage abîme la relation partenaire bien plus vite qu’un désaccord sur un prix.
            </Callout>
          )}

          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3.5">
              <CardHeader
                titre="Relevés de partage"
                sousTitre="Un relevé par partenaire et par période. Cliquez sur une ligne pour voir le détail par client."
                className="mb-0"
                actions={<Percent size={15} className="text-m-600" />}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Période', 'Partenaire', 'CA encaissé', 'Taux', 'Montant du partage', 'Statut', ''].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {releves.items.map((r) => (
                    <tr key={`${r.reseller}-${r.periode}`} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5 text-[12.5px] font-semibold text-ink">
                        {r.periode}
                      </td>
                      <td className="px-3 py-2.5">
                        {(() => {
                          const partenaire = RESELLERS.find((x) => x.nom === r.reseller)
                          return partenaire ? (
                            <Link
                              href={`/admin/revendeurs/${partenaire.id}`}
                              className="text-[12px] font-semibold text-ink hover:text-p-700"
                            >
                              {r.reseller}
                            </Link>
                          ) : (
                            <span className="text-[12px] text-ink">{r.reseller}</span>
                          )
                        })()}
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                        {money(r.caGenere)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone="accent" size="sm">
                          {pct(r.revsharePct)}
                        </Badge>
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] font-bold text-ink">
                        {money(r.montant)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={r.statut === 'réglé' ? 'ok' : 'info'} dot size="sm">
                          {r.statut}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => setDetail(r.id)}>
                            Détail
                          </Button>
                          <BoutonAction
                            libelle="PDF"
                            variant="ghost"
                            icone={<Download size={12} />}
                            operation={{
                              action: 'reseller.manage',
                              ton: 'info',
                              titre: `Relevé de ${r.periode} téléchargé`,
                              detail: `${money(r.montant)} · détail ligne par ligne, comme le partenaire le reçoit`,
                            }}
                          />
                          {r.statut !== 'réglé' && (
                            <GatedAction
                              autorise={autorise('reseller.manage')}
                              message={refus('reseller.manage')}
                            >
                              <Button
                                size="sm"
                                variant="secondary"
                                iconBefore={<Send size={12} />}
                                onClick={() => valider(r)}
                              >
                                Valider
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
                    <td colSpan={2} className="px-3 py-2.5 text-right text-[12.5px] font-bold text-ink">
                      Cumul
                    </td>
                    <td className="tnum px-3 py-2.5 text-[12.5px] font-bold text-ink">
                      {money(caApporte)}
                    </td>
                    <td />
                    <td className="tnum px-3 py-2.5 text-[13px] font-bold text-p-700">
                      {money(totalDu + totalVerse)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Évolution du partage versé"
                sousTitre="Un partage qui croît signifie que le canal indirect fonctionne."
              />
              <div className="flex items-end gap-1.5">
                {trendSeries('revshare-evo', 12, totalVerse * 0.2, totalVerse * 0.35).map((v, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t-sm bg-m-600"
                    style={{ height: `${30 + (v / (totalVerse * 0.35)) * 90}px` }}
                    title={money(Math.round(v))}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10.5px] text-g-500">
                <span>Sept. 2025</span>
                <span>Août 2026</span>
              </div>
              <Callout ton="violet" className="mt-4" titre="Un partage en hausse est une bonne nouvelle">
                Ce que nous reversons est proportionnel à ce que les partenaires nous apportent. Voir
                cette ligne monter signifie que le réseau vend, ce qui coûte moins cher en acquisition
                que nos propres efforts commerciaux directs.
              </Callout>
            </Card>

            <Card>
              <CardHeader
                titre="Partage par partenaire"
                sousTitre="Cumul sur la période disponible."
              />
              <div className="space-y-2.5">
                {RESELLERS.map((r) => {
                  const releves = RELEVES_REVSHARE.filter((x) => x.reseller === r.nom)
                  const cumul = releves.reduce((a, x) => a + x.montant, 0)
                  const max = Math.max(
                    ...RESELLERS.map((y) =>
                      RELEVES_REVSHARE.filter((x) => x.reseller === y.nom).reduce(
                        (a, x) => a + x.montant,
                        0,
                      ),
                    ),
                    1,
                  )
                  return (
                    <div key={r.id}>
                      <div className="flex items-baseline justify-between gap-3">
                        <Link
                          href={`/admin/revendeurs/${r.id}`}
                          className="min-w-0 truncate text-[12.5px] font-semibold text-ink hover:text-p-700"
                        >
                          {r.nom}
                        </Link>
                        <span className="tnum shrink-0 text-[12.5px] font-bold text-ink">
                          {money(cumul)}
                        </span>
                      </div>
                      <span className="mt-1 block h-2.5 overflow-hidden rounded-full bg-g-100">
                        <span
                          className="block h-full rounded-full bg-m-600"
                          style={{ width: `${Math.max(3, (cumul / max) * 100)}%` }}
                        />
                      </span>
                      <p className="mt-0.5 text-[10.5px] text-g-500">
                        {releves.length} relevé{releves.length > 1 ? 's' : ''} · taux{' '}
                        {pct(r.revsharePct)} · {r.clientsFinaux.length} clients
                      </p>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'calcul' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Méthode de calcul"
              sousTitre="Écrite ici pour qu’un partenaire puisse la reproduire lui-même à partir de ses propres chiffres."
            />
            <ol className="space-y-3">
              {[
                {
                  t: 'Assiette : le chiffre d’affaires encaissé du mois',
                  d: 'Somme des factures de ses clients finaux effectivement réglées pendant le mois, quelle que soit la période qu’elles couvrent. Une facture émise mais impayée n’entre pas dans l’assiette.',
                  pourquoi:
                    'Verser un partage sur une facture impayée nous obligerait à le récupérer ensuite, ce qui empoisonne la relation pour une somme souvent modeste.',
                },
                {
                  t: 'Déduction des avoirs de service',
                  d: 'Si un engagement de disponibilité n’a pas été tenu et qu’un avoir a été accordé au client final, cet avoir est retiré de l’assiette.',
                  pourquoi:
                    'Nous ne reversons pas un partage sur un montant que nous avons nous-mêmes crédité au client. La règle est symétrique : nous ne facturons pas le partenaire pour notre propre manquement non plus.',
                },
                {
                  t: 'Déduction des remises commerciales exceptionnelles',
                  d: 'Une remise accordée à la demande du partenaire pour emporter une affaire est déduite de l’assiette, au prorata.',
                  pourquoi:
                    'L’effort commercial est partagé : si nous baissons notre prix pour l’aider à conclure, le partage suit la même baisse.',
                },
                {
                  t: 'Application du taux contractuel',
                  d: 'Le taux est fixé au contrat de partenariat, entre 18 et 25 % selon le niveau d’agrément. Il est garanti pour la durée du contrat, avec six mois de préavis en cas d’évolution.',
                  pourquoi:
                    'Un taux qui peut baisser sans préavis rend impossible toute construction commerciale sur le long terme.',
                },
                {
                  t: 'Relevé détaillé et validation',
                  d: 'Le relevé liste chaque client, chaque offre, chaque facture, l’assiette retenue et les déductions appliquées. Le partenaire dispose de quinze jours pour le contester.',
                  pourquoi:
                    'Un relevé non détaillé oblige le partenaire à nous faire confiance. Détaillé, il peut le vérifier — et c’est ce qui rend la confiance durable.',
                },
                {
                  t: 'Versement sous quinze jours',
                  d: 'Après validation ou expiration du délai de contestation, par virement sur le compte du partenaire.',
                  pourquoi:
                    'Un versement en retard sur un partage est perçu comme une rétention de trésorerie, quelle que soit la raison. Nous nous imposons ce délai.',
                },
              ].map((x, i) => (
                <li key={x.t} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-m-050 text-[12px] font-bold text-m-600">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-ink">{x.t}</span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-g-700">{x.d}</span>
                    <span className="mt-1 block rounded-[5px] bg-p-050 px-2.5 py-1.5 text-[11.5px] leading-relaxed text-p-900">
                      Pourquoi : {x.pourquoi}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Exemple chiffré"
                sousTitre="Le calcul du relevé de juillet 2026 pour OC²S, ligne par ligne."
              />
              <div className="overflow-x-auto rounded-[8px] border border-g-300">
                <table className="w-full min-w-max border-collapse">
                  <tbody>
                    {[
                      { l: 'Factures émises sur ses clients', v: 1_312_000, ton: 'neutral' },
                      { l: 'Dont non réglées au 31 juillet', v: -48_000, ton: 'warn' },
                      { l: 'Avoir de service accordé (Kubernetes)', v: -4_400, ton: 'warn' },
                      { l: 'Remise commerciale exceptionnelle', v: -19_600, ton: 'warn' },
                      { l: 'Assiette retenue', v: 1_240_000, ton: 'fort' },
                    ].map((x) => (
                      <tr
                        key={x.l}
                        className={cn(
                          'border-b border-g-100 last:border-0',
                          x.ton === 'fort' ? 'bg-g-050' : '',
                        )}
                      >
                        <td
                          className={cn(
                            'px-3 py-2 text-[12px]',
                            x.ton === 'fort' ? 'font-bold text-ink' : 'text-g-700',
                          )}
                        >
                          {x.l}
                        </td>
                        <td
                          className={cn(
                            'tnum px-3 py-2 text-right text-[12px]',
                            x.ton === 'fort'
                              ? 'font-bold text-ink'
                              : x.ton === 'warn'
                                ? 'text-warn'
                                : 'text-g-700',
                          )}
                        >
                          {money(x.v)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-m-050">
                      <td className="px-3 py-2.5 text-[12.5px] font-bold text-ink">
                        Partage à 22 % de l’assiette
                      </td>
                      <td className="tnum px-3 py-2.5 text-right text-[14px] font-bold text-m-600">
                        {money(272_800)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Callout ton="info" className="mt-4" titre="Les 48 000 FCFA non réglés">
                Ils ne sont pas perdus pour le partenaire : ils réintégreront l’assiette du mois où la
                facture sera réglée. Le décalage de trésorerie est simplement porté par lui, comme il
                l’est par nous.
              </Callout>
            </Card>

            <Card>
              <CardHeader
                titre="Réglages du calcul"
                sousTitre="Ces réglages s’appliquent à tous les partenaires. Une modification exige six mois de préavis contractuel."
              />
              <div className="space-y-3.5">
                <Switch
                  checked={assietteEncaisse}
                  onChange={setAssietteEncaisse}
                  label="Assiette sur le chiffre d’affaires encaissé"
                  description="Et non facturé. Le décalage est porté par les deux parties, ce qui évite les régularisations à rebours."
                />
                <Switch
                  checked={deduireAvoirs}
                  onChange={setDeduireAvoirs}
                  label="Déduire les avoirs de service"
                  description="Symétrique : nous ne facturons pas le partenaire pour notre propre manquement, nous ne lui reversons pas un partage sur un montant crédité."
                />
                <Switch
                  checked={deduireRemises}
                  onChange={setDeduireRemises}
                  label="Déduire les remises commerciales exceptionnelles"
                  description="Au prorata. L’effort commercial est partagé dans les deux sens."
                />
                <Switch
                  checked
                  disabled
                  label="Relevé détaillé ligne par ligne"
                  description="Non désactivable. C’est la condition d’une relation vérifiable."
                />
                <Switch
                  checked={delaiContestation}
                  onChange={setDelaiContestation}
                  label="Délai de contestation de 15 jours"
                  description="Passé ce délai, le relevé est réputé accepté et le versement part."
                />
                <Switch
                  checked={compenserNegatif}
                  onChange={setCompenserNegatif}
                  label="Compenser un partage négatif sur la période suivante"
                  description="Cas rare : un mois où les avoirs dépassent les encaissements. Nous préférons ne rien reverser plutôt que de créer une dette du partenaire envers nous."
                />
              </div>
              <BoutonAction
                libelle="Enregistrer — préavis de 6 mois"
                size="md"
                className="mt-4"
                operation={{
                  action: 'reseller.manage',
                  ton: 'warn',
                  titre: 'Règles de partage enregistrées',
                  detail:
                    'Elles prennent effet dans six mois : un partenaire ne voit pas ses conditions changer du jour au lendemain.',
                }}
              />
            </Card>
          </div>
        </div>
      )}

      {onglet === 'previsionnel' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Prévisionnel du partage"
              sousTitre="Projection sur douze mois, à taux constant et croissance observée. Une projection sert à provisionner, pas à promettre."
            />
            <div className="overflow-x-auto rounded-[8px] border border-g-300">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Partenaire', 'CA mensuel actuel', 'Croissance observée', 'CA projeté à 12 mois', 'Taux', 'Partage projeté'].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {RESELLERS.map((r) => {
                    const clients = ORGANISATIONS.filter((o) => r.clientsFinaux.includes(o.id))
                    const caMensuel = clients.reduce((a, o) => a + (o.caMensuel ?? 0), 0)
                    const croissance = r.id === 'res-oc2s' ? 8.4 : 4.2
                    const projete = Math.round(caMensuel * Math.pow(1 + croissance / 100, 12))
                    return (
                      <tr key={r.id} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/admin/revendeurs/${r.id}`}
                            className="text-[12.5px] font-semibold text-ink hover:text-p-700"
                          >
                            {r.nom}
                          </Link>
                          <span className="block text-[10.5px] text-g-500">
                            {clients.length} clients finaux
                          </span>
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                          {money(caMensuel)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone={croissance > 6 ? 'ok' : 'neutral'} size="sm">
                            + {pct(croissance, 1)} / mois
                          </Badge>
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12.5px] font-bold text-ink">
                          {money(projete)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone="accent" size="sm">
                            {pct(r.revsharePct)}
                          </Badge>
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12.5px] font-bold text-m-600">
                          {money(Math.round((projete * r.revsharePct) / 100))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Callout ton="warn" className="mt-4" titre="Une projection à douze mois est fragile">
              Elle suppose que la croissance observée se poursuive, qu’aucun client ne parte et
              qu’aucun nouveau partenaire n’arrive. Aucune de ces hypothèses ne tient réellement. Ce
              tableau sert à dimensionner une provision de trésorerie, pas à construire un plan
              commercial.
            </Callout>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Provision de trésorerie"
                sousTitre="Ce qu’il faut garder disponible pour honorer les versements à venir."
              />
              <KeyValueList
                colonnes={1}
                items={[
                  { cle: 'À verser sous 15 jours', valeur: money(totalDu) },
                  { cle: 'Projection du mois prochain', valeur: money(Math.round(totalDu * 1.08)) },
                  { cle: 'Projection du trimestre', valeur: money(Math.round(totalDu * 3.2)) },
                  { cle: 'Provision recommandée', valeur: money(Math.round(totalDu * 1.5)) },
                  {
                    cle: 'Règle retenue',
                    valeur: 'Un mois et demi de partage projeté, disponible en permanence',
                  },
                ]}
              />
              <Callout ton="violet" className="mt-4" titre="Pourquoi provisionner un mois et demi">
                Un versement de partage qui prend du retard, même pour une raison légitime de
                trésorerie, est lu par le partenaire comme un signe de fragilité. Il commence alors à
                chercher une alternative. Le coût d’une provision est très inférieur au coût de la
                perte d’un partenaire actif.
              </Callout>
            </Card>

            <Card>
              <CardHeader
                titre="Simuler un changement de taux"
                sousTitre="Effet sur le partage annuel, à volume constant."
              />
              <div className="space-y-4">
                <Field label="Partenaire">
                  <Select
                    value={simPartenaire}
                    onChange={(e) => setSimPartenaire(e.target.value)}
                  >
                    {RESELLERS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nom} — taux actuel {r.revsharePct} %
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Nouveau taux" hint="préavis contractuel de 6 mois avant application">
                  <Input
                    type="number"
                    min={0}
                    max={40}
                    value={simTaux}
                    suffix="%"
                    onChange={(e) => setSimTaux(Number(e.target.value))}
                  />
                </Field>
                <div className="rounded-[8px] border border-p-300 bg-p-050 p-3.5">
                  <MicroLabel className="text-p-700">Effet estimé</MicroLabel>
                  <div className="mt-2 space-y-1.5">
                    {(() => {
                      const partenaire = RESELLERS.find((r) => r.id === simPartenaire)
                      const assiette = (partenaire?.caGenere ?? 0) * 12
                      const actuel = Math.round((assiette * (partenaire?.revsharePct ?? 0)) / 100)
                      const nouveau = Math.round((assiette * simTaux) / 100)
                      return [
                        {
                          l: `Partage annuel actuel (${partenaire?.revsharePct ?? 0} %)`,
                          v: money(actuel),
                        },
                        { l: `Partage annuel au nouveau taux (${simTaux} %)`, v: money(nouveau) },
                        {
                          l: nouveau >= actuel ? 'Coût supplémentaire annuel' : 'Économie annuelle',
                          v: money(Math.abs(nouveau - actuel)),
                        },
                      ]
                    })().map((x, i) => (
                      <div key={x.l} className="flex items-baseline justify-between gap-3">
                        <span className="text-[12px] text-g-700">{x.l}</span>
                        <span
                          className={cn(
                            'tnum shrink-0 text-[12.5px] font-bold',
                            i === 2 ? 'text-warn' : 'text-ink',
                          )}
                        >
                          {x.v}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 border-t border-p-300/60 pt-2 text-[11px] leading-relaxed text-g-700">
                    Calculé à volume constant, sur douze fois le chiffre d’affaires mensuel apporté
                    par ce partenaire. Un changement de taux ne s’applique qu’après six mois de
                    préavis.
                  </p>
                </div>
                <Callout ton="info" titre="Une hausse de taux se justifie par un engagement">
                  Augmenter le partage d’un partenaire sans contrepartie revient à réduire sa propre
                  marge sans rien gagner. En revanche, un taux plus élevé contre un engagement de
                  volume annuel ou une prise en charge élargie du support de premier niveau est un
                  échange équilibré.
                </Callout>
              </div>
            </Card>
          </div>
        </div>
      )}

      <Drawer
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ? `Relevé ${detail.periode} — ${detail.reseller}` : ''}
        size="lg"
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={detail.statut === 'réglé' ? 'ok' : 'info'} dot>
                {detail.statut}
              </Badge>
              <Badge tone="accent" size="sm">
                Taux {pct(detail.revsharePct)}
              </Badge>
            </div>

            <KeyValueList
              colonnes={2}
              items={[
                { cle: 'Partenaire', valeur: detail.reseller },
                { cle: 'Période', valeur: detail.periode },
                { cle: 'CA encaissé (assiette)', valeur: money(detail.caGenere) },
                { cle: 'Taux contractuel', valeur: pct(detail.revsharePct) },
                { cle: 'Montant du partage', valeur: money(detail.montant) },
                { cle: 'Statut', valeur: detail.statut },
              ]}
            />

            <div>
              <MicroLabel className="mb-2">Détail par client final</MicroLabel>
              <div className="overflow-x-auto rounded-[8px] border border-g-300">
                <table className="w-full min-w-max border-collapse">
                  <thead>
                    <tr className="border-b border-g-300 bg-g-050">
                      {['Client final', 'Factures réglées', 'Assiette', 'Partage'].map((h) => (
                        <th
                          key={h}
                          className="type-micro px-3 py-2 text-left font-semibold text-g-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const partenaire = RESELLERS.find((x) => x.nom === detail.reseller)
                      const clients = partenaire
                        ? ORGANISATIONS.filter((o) => partenaire.clientsFinaux.includes(o.id))
                        : []
                      const totalCa = clients.reduce((a, o) => a + (o.caMensuel ?? 0), 0) || 1
                      return clients.map((o) => {
                        const assiette = Math.round(
                          (((o.caMensuel ?? 0) / totalCa) * detail.caGenere),
                        )
                        return (
                          <tr key={o.id} className="border-b border-g-100 last:border-0">
                            <td className="px-3 py-2 text-[12px] font-semibold text-ink">{o.nom}</td>
                            <td className="tnum px-3 py-2 text-[11.5px] text-g-700">1</td>
                            <td className="tnum px-3 py-2 text-[12px] text-g-700">
                              {money(assiette)}
                            </td>
                            <td className="tnum px-3 py-2 text-[12px] font-bold text-m-600">
                              {money(Math.round((assiette * detail.revsharePct) / 100))}
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-g-300 bg-m-050">
                      <td colSpan={2} className="px-3 py-2 text-right text-[12px] font-bold text-ink">
                        Total
                      </td>
                      <td className="tnum px-3 py-2 text-[12.5px] font-bold text-ink">
                        {money(detail.caGenere)}
                      </td>
                      <td className="tnum px-3 py-2 text-[13px] font-bold text-m-600">
                        {money(detail.montant)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <BoutonAction
                libelle="Télécharger le relevé"
                size="md"
                icone={<Download size={13} />}
                operation={{
                  action: 'reseller.manage',
                  ton: 'info',
                  titre: `Relevé de ${detail.periode} téléchargé`,
                  detail: `${money(detail.montant)} · ${detail.reseller}`,
                }}
              />
              <BoutonAction
                libelle="Détail des lignes en CSV"
                variant="ghost"
                size="md"
                icone={<Download size={13} />}
                operation={{
                  action: 'reseller.manage',
                  ton: 'info',
                  titre: 'Détail des lignes exporté',
                  detail:
                    'Numéro de facture, date de règlement et déductions appliquées : le partenaire rapproche ligne par ligne.',
                }}
              />
              {detail.statut !== 'réglé' && (
                <GatedAction autorise={autorise('reseller.manage')} message={refus('reseller.manage')}>
                  <Button iconBefore={<Send size={13} />} onClick={() => valider(detail)}>
                    Valider le versement
                  </Button>
                </GatedAction>
              )}
            </div>

            <Callout ton="info" titre="Ce que le partenaire reçoit">
              Le même tableau, avec en plus le numéro de chaque facture réglée, sa date de règlement,
              et le détail des déductions appliquées. Il peut ainsi rapprocher ligne par ligne avec sa
              propre comptabilité.
            </Callout>
          </div>
        )}
      </Drawer>
    </div>
  )
}
