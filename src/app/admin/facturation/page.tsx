'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Phone, Receipt, Send, TrendingUp } from 'lucide-react'
import { cn, trendSeries } from '@/lib/utils'
import { dateCourte, money, num, pct } from '@/lib/format'
import {
  FACTURES,
  IMPAYES,
  MARGE_BACKENDS,
  ORGANISATIONS,
  RELEVES_REVSHARE,
  SYNTHESE_PLATEFORME,
  VENTILATION_DEPENSE,
} from '@/lib/mock'
import { MOYEN_LABEL } from '@/lib/types'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/field'
import { Modal } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StackedBar, StatTile } from '@/components/composition/metrics'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'revenus', label: 'Revenus' },
  { id: 'cycle', label: 'Cycle de facturation' },
  { id: 'recouvrement', label: 'Recouvrement' },
  { id: 'rentabilite', label: 'Rentabilité' },
]

const COULEURS = [
  'var(--color-p-600)',
  'var(--color-m-600)',
  'var(--color-info)',
  'var(--color-ok)',
  'var(--color-warn)',
  'var(--color-p-300)',
]

export default function FacturationAdmin() {
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('revenus')
  const [relance, setRelance] = useState<(typeof IMPAYES)[number] | null>(null)

  const caMensuel = SYNTHESE_PLATEFORME.caMensuel
  const impayesTotal = IMPAYES.reduce((a, i) => a + i.montant, 0)
  const revshareDu = RELEVES_REVSHARE.filter((r) => r.statut !== 'réglé').reduce(
    (a, r) => a + r.montant,
    0,
  )
  const coutInfra = MARGE_BACKENDS.reduce((a, m) => a + m.coutInfra, 0)
  const revenuInfra = MARGE_BACKENDS.reduce((a, m) => a + m.revenu, 0)
  const margeBrute = Math.round(((revenuInfra - coutInfra) / revenuInfra) * 1000) / 10

  const parCanal = [
    {
      canal: 'Direct',
      montant: ORGANISATIONS.filter((o) => o.type === 'direct').reduce(
        (a, o) => a + (o.caMensuel ?? 0),
        0,
      ),
    },
    {
      canal: 'Via revendeur',
      montant: ORGANISATIONS.filter((o) => o.type === 'client_revendeur').reduce(
        (a, o) => a + (o.caMensuel ?? 0),
        0,
      ),
    },
    {
      canal: 'Revendeurs (compte propre)',
      montant: ORGANISATIONS.filter((o) => o.type === 'revendeur').reduce(
        (a, o) => a + (o.caMensuel ?? 0),
        0,
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Facturation de la plateforme"
        sousTitre="Revenus par canal, cycle d’émission, recouvrement et rentabilité par socle. Le recouvrement se fait par appel et échelonnement avant de parler de suspension : une entreprise dont la trésorerie est tendue reste un client, pas un problème."
        actions={
          <GatedAction autorise={autorise('invoice.view')} message={refus('invoice.view')}>
            <Button variant="secondary" iconBefore={<Download size={14} />}>
              Exporter la période
            </Button>
          </GatedAction>
        }
        meta={
          <>
            <Badge tone="neutral" size="sm">
              Période du 1er au 19 août 2026
            </Badge>
            <Badge tone="ok" size="sm">
              Marge brute {pct(margeBrute, 1)}
            </Badge>
            {impayesTotal > 0 && (
              <Badge tone="err" dot size="sm">
                {money(impayesTotal)} d’impayés
              </Badge>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatTile
          libelle="CA mensuel récurrent"
          valeur={money(caMensuel)}
          ton="ok"
          serie={trendSeries('admin-ca', 12, caMensuel * 0.68, caMensuel)}
        />
        <StatTile
          libelle="Croissance mensuelle"
          valeur="+ 6,8 %"
          ton="ok"
          detail="Moyenne sur 6 mois"
        />
        <StatTile
          libelle="Coût d’infrastructure"
          valeur={money(coutInfra)}
          detail="Matériel, licences, énergie, hébergement"
        />
        <StatTile
          libelle="Marge brute"
          valeur={pct(margeBrute, 1)}
          ton={margeBrute > 40 ? 'ok' : 'warn'}
        />
        <StatTile
          libelle="Impayés"
          valeur={money(impayesTotal)}
          ton={impayesTotal > 0 ? 'err' : 'ok'}
          detail={`${IMPAYES.length} factures`}
        />
        <StatTile
          libelle="Partage à verser"
          valeur={money(revshareDu)}
          ton={revshareDu > 0 ? 'warn' : 'ok'}
          detail="Périodes non réglées"
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'revenus' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                titre="Revenu mensuel récurrent"
                sousTitre="Douze derniers mois. Le revenu récurrent exclut les prestations ponctuelles et les frais de mise en service."
              />
              <div className="flex items-end gap-1.5">
                {trendSeries('admin-mrr', 12, caMensuel * 0.62, caMensuel).map((v, i) => (
                  <span
                    key={i}
                    className="group relative flex-1"
                    title={money(Math.round(v))}
                  >
                    <span
                      className="block rounded-t-sm bg-p-600 transition-colors group-hover:bg-p-700"
                      style={{ height: `${40 + (v / caMensuel) * 110}px` }}
                    />
                  </span>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10.5px] text-g-500">
                <span>Sept. 2025</span>
                <span>Août 2026</span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-g-100 pt-4 sm:grid-cols-4">
                <div>
                  <MicroLabel className="text-g-500">Revenu récurrent</MicroLabel>
                  <p className="tnum mt-0.5 text-[15px] font-bold text-ink">{money(caMensuel)}</p>
                </div>
                <div>
                  <MicroLabel className="text-g-500">Panier moyen</MicroLabel>
                  <p className="tnum mt-0.5 text-[15px] font-bold text-ink">
                    {money(Math.round(caMensuel / SYNTHESE_PLATEFORME.tenantsActifs))}
                  </p>
                </div>
                <div>
                  <MicroLabel className="text-g-500">Organisations facturées</MicroLabel>
                  <p className="tnum mt-0.5 text-[15px] font-bold text-ink">
                    {SYNTHESE_PLATEFORME.tenantsActifs}
                  </p>
                </div>
                <div>
                  <MicroLabel className="text-g-500">Attrition annuelle</MicroLabel>
                  <p className="tnum mt-0.5 text-[15px] font-bold text-ok">3,2 %</p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader titre="Répartition par canal" sousTitre="Revenu mensuel récurrent." />
              <StackedBar
                segments={parCanal.map((c, i) => ({
                  label: c.canal,
                  valeur: c.montant,
                  couleur: COULEURS[i],
                }))}
              />
              <div className="mt-4 space-y-1.5 border-t border-g-100 pt-3.5">
                {parCanal.map((c, i) => (
                  <div key={c.canal} className="flex items-baseline justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-sm"
                        style={{ background: COULEURS[i] }}
                      />
                      <span className="truncate text-[12px] text-g-700">{c.canal}</span>
                    </span>
                    <span className="tnum shrink-0 text-[12px] font-semibold text-ink">
                      {money(c.montant)}
                    </span>
                  </div>
                ))}
              </div>
              <Callout ton="info" className="mt-4" titre="Le canal indirect progresse">
                Un client apporté par un partenaire coûte moins cher à acquérir et se révèle plus
                stable, parce que le partenaire fait un travail de conseil que nous ne faisons pas.
                C’est ce qui justifie la remise consentie.
              </Callout>
            </Card>
          </div>

          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3.5">
              <CardHeader
                titre="Revenu par organisation"
                sousTitre="Toutes organisations facturées, du plus gros contributeur au plus petit."
                className="mb-0"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Organisation', 'Canal', 'Plan', 'Espaces', 'CA mensuel', 'Part du revenu', 'Statut', ''].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[...ORGANISATIONS]
                    .filter((o) => (o.caMensuel ?? 0) > 0)
                    .sort((a, b) => (b.caMensuel ?? 0) - (a.caMensuel ?? 0))
                    .map((o) => {
                      const part = Math.round(((o.caMensuel ?? 0) / caMensuel) * 1000) / 10
                      return (
                        <tr key={o.id} className="border-b border-g-100 last:border-0">
                          <td className="px-3 py-2.5">
                            <Link
                              href={`/admin/organisations/${o.id}`}
                              className="text-[12.5px] font-semibold text-ink hover:text-p-700"
                            >
                              {o.nom}
                            </Link>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge
                              tone={
                                o.type === 'revendeur'
                                  ? 'accent'
                                  : o.type === 'client_revendeur'
                                    ? 'info'
                                    : 'neutral'
                              }
                              size="sm"
                            >
                              {o.type === 'revendeur'
                                ? 'Revendeur'
                                : o.type === 'client_revendeur'
                                  ? 'Indirect'
                                  : 'Direct'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-[11.5px] text-g-700">
                            {o.tenantPlan ?? '—'}
                          </td>
                          <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                            {o.espaces ?? 0}
                          </td>
                          <td className="tnum px-3 py-2.5 text-[12.5px] font-bold text-ink">
                            {money(o.caMensuel ?? 0)}
                          </td>
                          <td className="w-40 px-3 py-2.5">
                            <span className="flex items-center gap-2">
                              <span className="relative block h-2 flex-1 overflow-hidden rounded-full bg-g-100">
                                <span
                                  className={cn(
                                    'absolute inset-y-0 left-0 rounded-full',
                                    part > 25 ? 'bg-warn' : 'bg-p-600',
                                  )}
                                  style={{ width: `${Math.min(100, part * 3)}%` }}
                                />
                              </span>
                              <span className="tnum shrink-0 text-[11.5px] text-g-700">
                                {pct(part, 1)}
                              </span>
                            </span>
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
                            <ButtonLink
                              size="sm"
                              variant="ghost"
                              href={`/admin/organisations/${o.id}`}
                            >
                              Ouvrir
                            </ButtonLink>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </Card>

          <Callout ton="warn" titre="Une organisation représente plus d’un quart du revenu">
            C’est un risque de concentration qu’il faut regarder en face : son départ, ou une simple
            renégociation à la baisse, se verrait immédiatement dans les comptes. Diversifier passe par
            le canal indirect, qui apporte des clients plus petits mais plus nombreux.
          </Callout>
        </div>
      )}

      {onglet === 'cycle' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Cycle de facturation"
              sousTitre="Ce qui se passe chaque mois, automatiquement, et les points où une intervention humaine reste requise."
            />
            <div className="space-y-2">
              {[
                {
                  j: 'Le 28 du mois',
                  t: 'Consolidation de la consommation',
                  d: 'Les compteurs de vCPU-heures, de stockage, de transfert sortant et de sièges sont figés. Les lignes d’abonnement sont calculées.',
                  auto: true,
                },
                {
                  j: 'Le 29',
                  t: 'Génération des brouillons',
                  d: 'Une facture brouillon par organisation, visible du client dans son espace. Il peut la contester avant émission.',
                  auto: true,
                },
                {
                  j: 'Le 30',
                  t: 'Revue des anomalies',
                  d: 'Toute facture qui varie de plus de 30 % par rapport au mois précédent est mise de côté pour vérification humaine. Une erreur de compteur est plus facile à corriger avant émission qu’après.',
                  auto: false,
                },
                {
                  j: 'Le 1er',
                  t: 'Émission et envoi',
                  d: 'Les factures sont émises, numérotées, archivées et envoyées au contact de facturation de chaque organisation.',
                  auto: true,
                },
                {
                  j: 'Le 5',
                  t: 'Prélèvement automatique',
                  d: 'Pour les organisations ayant mandaté un prélèvement Orange Money ou un virement récurrent.',
                  auto: true,
                },
                {
                  j: 'Le 3 du mois suivant',
                  t: 'Relance automatique',
                  d: 'Premier rappel par courriel sur les factures non réglées, sans pénalité.',
                  auto: true,
                },
                {
                  j: 'Le 15 du mois suivant',
                  t: 'Deuxième relance et appel',
                  d: 'Relance écrite, puis appel téléphonique. À partir de ce stade, un humain reprend le dossier.',
                  auto: false,
                },
              ].map((x) => (
                <div
                  key={x.j}
                  className={cn(
                    'flex flex-wrap items-start gap-3 rounded-[6px] border px-3 py-2.5',
                    x.auto ? 'border-g-300' : 'border-warn/40 bg-warn-bg',
                  )}
                >
                  <span className="w-32 shrink-0 text-[11.5px] font-semibold text-p-700">{x.j}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-semibold text-ink">{x.t}</span>
                    <span className="block text-[11.5px] leading-relaxed text-g-700">{x.d}</span>
                  </span>
                  <Badge tone={x.auto ? 'ok' : 'warn'} size="sm">
                    {x.auto ? 'Automatique' : 'Intervention humaine'}
                  </Badge>
                </div>
              ))}
            </div>
            <Callout ton="violet" className="mt-4" titre="La revue des anomalies n’est pas automatisable">
              Une facture qui triple d’un mois sur l’autre peut être légitime — le client a lancé un
              gros traitement — ou refléter un compteur défaillant de notre côté. Envoyer la facture
              sans vérifier, c’est risquer de facturer une erreur à un client, ce qui coûte bien plus
              cher en confiance qu’en trésorerie.
            </Callout>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Factures du cycle en cours"
                sousTitre="État à J−9 de l’émission."
              />
              <div className="space-y-2">
                {[
                  { l: 'Brouillons générés', v: 8, t: 'info' as const },
                  { l: 'Anomalies à vérifier', v: 1, t: 'warn' as const },
                  { l: 'Contestations client', v: 0, t: 'ok' as const },
                  { l: 'Prêtes à émettre', v: 7, t: 'ok' as const },
                ].map((x) => (
                  <div
                    key={x.l}
                    className="flex items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
                  >
                    <span className="text-[12.5px] text-ink">{x.l}</span>
                    <Badge tone={x.t} size="sm">
                      {x.v}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-3.5 rounded-[6px] border border-warn/40 bg-warn-bg px-3 py-2.5">
                <p className="text-[12.5px] font-semibold text-ink">
                  Anomalie : AMUGA, + 214 % sur le transfert sortant
                </p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-700">
                  1,8 To de transfert sortant contre 580 Go le mois dernier. À vérifier avant émission :
                  soit le client a mis en ligne un catalogue média, soit un compteur double-compte.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="secondary">
                    Vérifier les compteurs
                  </Button>
                  <Button size="sm" variant="ghost">
                    Appeler le client
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader
                titre="Ventilation du revenu par famille"
                sousTitre="Ce que nous vendons réellement, indépendamment de ce que nous mettons en avant."
              />
              <div className="space-y-2.5">
                {VENTILATION_DEPENSE.map((v, i) => {
                  const max = Math.max(...VENTILATION_DEPENSE.map((x) => x.montant))
                  return (
                    <div key={v.famille}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate text-[12px] text-ink">{v.famille}</span>
                        <span className="tnum shrink-0 text-[12px]">
                          <span className="font-semibold text-ink">{money(v.montant)}</span>
                          <span className="ml-1.5 text-g-500">{pct(v.pct, 1)}</span>
                        </span>
                      </div>
                      <span className="mt-1 block h-2 overflow-hidden rounded-full bg-g-100">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${(v.montant / max) * 100}%`,
                            background: COULEURS[i % COULEURS.length],
                          }}
                        />
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'recouvrement' && (
        <div className="space-y-4">
          <Callout ton="violet" titre="Notre politique de recouvrement, écrite noir sur blanc">
            Relance automatique à trois jours, relance écrite à quinze, appel téléphonique à trente,
            proposition d’échelonnement systématique. La suspension n’intervient qu’après un rappel
            écrit et un délai de quinze jours supplémentaires, et c’est une décision humaine consignée.
            Couper le service d’une entreprise, c’est arrêter son activité : nous ne le faisons pas par
            traitement automatique nocturne.
          </Callout>

          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3.5">
              <CardHeader
                titre="Impayés en cours"
                sousTitre="Triés par ancienneté. Le nombre de relances indique où en est le dossier."
                className="mb-0"
                actions={
                  <Badge tone={impayesTotal > 0 ? 'err' : 'ok'} size="sm">
                    {money(impayesTotal)}
                  </Badge>
                }
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Organisation', 'Facture', 'Montant', 'Échéance', 'Retard', 'Relances', 'Prochaine action', ''].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[...IMPAYES]
                    .sort((a, b) => b.retardJours - a.retardJours)
                    .map((i) => (
                      <tr key={i.facture} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5 text-[12.5px] font-semibold text-ink">{i.org}</td>
                        <td className="px-3 py-2.5 font-mono text-[12px] text-g-700">{i.facture}</td>
                        <td className="tnum px-3 py-2.5 text-[12.5px] font-bold text-ink">
                          {money(i.montant)}
                        </td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-700">
                          {dateCourte(i.echeance)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            tone={
                              i.retardJours > 60 ? 'err' : i.retardJours > 30 ? 'warn' : 'info'
                            }
                            size="sm"
                          >
                            {i.retardJours} jours
                          </Badge>
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12px] text-g-700">{i.relances}</td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-700">
                          {i.retardJours > 60
                            ? 'Appel de la direction, proposition d’échelonnement'
                            : i.retardJours > 30
                              ? 'Appel téléphonique'
                              : 'Relance écrite'}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="flex items-center justify-end gap-1.5">
                            <GatedAction
                              autorise={autorise('invoice.view')}
                              message={refus('invoice.view')}
                            >
                              <Button
                                size="sm"
                                variant="secondary"
                                iconBefore={<Phone size={12} />}
                                onClick={() => setRelance(i)}
                              >
                                Traiter
                              </Button>
                            </GatedAction>
                            <Button size="sm" variant="ghost">
                              Historique
                            </Button>
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader titre="Efficacité du recouvrement" sousTitre="Douze derniers mois." />
              <KeyValueList
                colonnes={1}
                items={[
                  { cle: 'Taux de recouvrement', valeur: '97,8 %' },
                  { cle: 'Délai moyen de règlement', valeur: '34 jours' },
                  { cle: 'Échelonnements accordés', valeur: '6' },
                  { cle: 'Échelonnements respectés', valeur: '6 sur 6' },
                  { cle: 'Suspensions prononcées', valeur: '1' },
                  { cle: 'Créances passées en perte', valeur: money(0) },
                ]}
              />
              <Callout ton="ok" className="mt-4" titre="L’échelonnement marche mieux que la menace">
                Six échelonnements accordés, six respectés. Un client à qui l’on propose une solution
                paie ; un client menacé de coupure cherche un autre fournisseur et laisse sa dette.
              </Callout>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader
                titre="Moyens de paiement utilisés"
                sousTitre="La répartition réelle, qui justifie de ne pas se limiter à la carte bancaire."
              />
              <div className="space-y-2.5">
                {[
                  { m: 'orange_money' as const, pct: 42, n: 'Le plus utilisé, de loin' },
                  { m: 'virement' as const, pct: 34, n: 'Grands comptes et secteur public' },
                  { m: 'mtn_momo' as const, pct: 12, n: 'Second opérateur mobile' },
                  { m: 'carte' as const, pct: 9, n: 'Minoritaire, surtout international' },
                  { m: 'wave' as const, pct: 3, n: 'En progression' },
                ].map((x) => (
                  <div key={x.m}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 text-[12.5px] font-semibold text-ink">
                        {MOYEN_LABEL[x.m]}
                      </span>
                      <span className="tnum shrink-0 text-[12.5px] font-bold text-ink">
                        {pct(x.pct)}
                      </span>
                    </div>
                    <span className="mt-1 block h-2.5 overflow-hidden rounded-full bg-g-100">
                      <span
                        className="block h-full rounded-full bg-p-600"
                        style={{ width: `${x.pct}%` }}
                      />
                    </span>
                    <p className="mt-0.5 text-[10.5px] text-g-500">{x.n}</p>
                  </div>
                ))}
              </div>
              <Callout ton="violet" className="mt-4" titre="Un fournisseur qui n’accepte que la carte se coupe de 88 % du marché">
                C’est le genre de détail qui décide d’une vente en Afrique de l’Ouest. Accepter Orange
                Money et MTN MoMo n’est pas une commodité : c’est la condition d’accès au marché.
              </Callout>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'rentabilite' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <StatTile libelle="Revenu porté" valeur={money(revenuInfra)} ton="ok" />
            <StatTile libelle="Coût d’infrastructure" valeur={money(coutInfra)} />
            <StatTile
              libelle="Marge brute"
              valeur={money(revenuInfra - coutInfra)}
              ton="ok"
              detail={pct(margeBrute, 1)}
            />
            <StatTile
              libelle="Licences propriétaires"
              valeur={money(28_800_000)}
              ton="warn"
              detail="Par an — supprimées à la fin de la trajectoire"
            />
          </div>

          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3.5">
              <CardHeader
                titre="Rentabilité par socle"
                sousTitre="La lecture qui justifie économiquement la sortie des socles propriétaires."
                className="mb-0"
                actions={
                  <ButtonLink size="sm" variant="ghost" href="/admin/capacite">
                    Détail de la capacité
                  </ButtonLink>
                }
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Socle', 'Technologie', 'Coût', 'Revenu', 'Marge brute', 'Taux', 'Nature'].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[...MARGE_BACKENDS]
                    .sort((a, b) => b.marge - a.marge)
                    .map((m) => (
                      <tr key={m.backend} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5 font-mono text-[12px] font-semibold text-ink">
                          {m.backend}
                        </td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-700">{m.type}</td>
                        <td className="tnum px-3 py-2.5 text-[11.5px] text-g-700">
                          {money(m.coutInfra)}
                        </td>
                        <td className="tnum px-3 py-2.5 text-[11.5px] text-g-700">
                          {money(m.revenu)}
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12px] font-bold text-ink">
                          {money(m.revenu - m.coutInfra)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-2">
                            <span className="relative block h-2 w-20 overflow-hidden rounded-full bg-g-100">
                              <span
                                className={cn(
                                  'absolute inset-y-0 left-0 rounded-full',
                                  m.marge > 50 ? 'bg-ok' : m.marge > 30 ? 'bg-p-600' : 'bg-warn',
                                )}
                                style={{ width: `${m.marge}%` }}
                              />
                            </span>
                            <span
                              className={cn(
                                'tnum text-[12px] font-bold',
                                m.marge > 50 ? 'text-ok' : m.marge > 30 ? 'text-ink' : 'text-warn',
                              )}
                            >
                              {pct(m.marge, 1)}
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            tone={
                              m.type.includes('OpenStack') ||
                              m.type.includes('Proxmox') ||
                              m.type.includes('CloudStack')
                                ? 'ok'
                                : 'warn'
                            }
                            size="sm"
                          >
                            {m.type.includes('OpenStack') ||
                            m.type.includes('Proxmox') ||
                            m.type.includes('CloudStack')
                              ? 'Libre'
                              : 'Propriétaire'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Callout ton="violet" titre="Le chiffre qui décide de la trajectoire">
              Socles libres : 49 à 57 % de marge. Socles propriétaires : 24 à 31 %. L’écart, ce sont les
              licences. Sortir du propriétaire améliore la marge de vingt points sur la capacité
              concernée, tout en réduisant notre dépendance à un éditeur. Il n’y a pas d’arbitrage à
              faire entre le principe et l’intérêt économique : ils vont dans le même sens.
            </Callout>

            <Card>
              <CardHeader
                titre="Structure de coûts"
                sousTitre="Ce qui compose le coût d’infrastructure mensuel."
                actions={<Receipt size={15} className="text-p-700" />}
              />
              <div className="space-y-2.5">
                {[
                  { l: 'Amortissement du matériel', v: 38 },
                  { l: 'Licences propriétaires', v: 24 },
                  { l: 'Énergie et refroidissement', v: 16 },
                  { l: 'Hébergement et baies', v: 11 },
                  { l: 'Connectivité et transit', v: 8 },
                  { l: 'Maintenance et pièces', v: 3 },
                ].map((x, i) => (
                  <div key={x.l}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-[12px] text-ink">{x.l}</span>
                      <span className="tnum shrink-0 text-[12px] font-semibold text-ink">
                        {pct(x.v)}
                      </span>
                    </div>
                    <span className="mt-1 block h-2 overflow-hidden rounded-full bg-g-100">
                      <span
                        className={cn(
                          'block h-full rounded-full',
                          x.l.includes('Licences') ? 'bg-warn' : 'bg-p-600',
                        )}
                        style={{ width: `${x.v * 2.4}%` }}
                      />
                    </span>
                  </div>
                ))}
              </div>
              <Callout ton="warn" className="mt-4" titre="Les licences pèsent presque autant que le matériel">
                24 % du coût d’infrastructure part en licences pour la couche de virtualisation, sans
                que le client en retire quoi que ce soit qu’un socle libre ne fournirait pas. C’est la
                dépense la plus facile à supprimer, et c’est ce que fait la trajectoire de sortie.
              </Callout>
            </Card>
          </div>
        </div>
      )}

      <Modal
        open={relance !== null}
        onClose={() => setRelance(null)}
        title={`Traiter l’impayé — ${relance?.org ?? ''}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRelance(null)}>
              Annuler
            </Button>
            <Button
              iconBefore={<Send size={13} />}
              onClick={() => {
                pousser({
                  ton: 'ok',
                  titre: 'Action de recouvrement enregistrée',
                  detail: 'Le dossier est mis à jour et l’action est consignée dans l’historique du compte.',
                })
                setRelance(null)
              }}
            >
              Enregistrer l’action
            </Button>
          </>
        }
      >
        {relance && (
          <div className="space-y-4">
            <KeyValueList
              colonnes={2}
              items={[
                { cle: 'Organisation', valeur: relance.org },
                { cle: 'Facture', valeur: relance.facture },
                { cle: 'Montant', valeur: money(relance.montant) },
                { cle: 'Échéance', valeur: dateCourte(relance.echeance) },
                { cle: 'Retard', valeur: `${relance.retardJours} jours` },
                { cle: 'Relances envoyées', valeur: String(relance.relances) },
              ]}
            />
            <Field label="Action">
              <Select defaultValue="appel">
                <option value="appel">Appel téléphonique effectué</option>
                <option value="relance">Relance écrite envoyée</option>
                <option value="echelonnement">Proposition d’échelonnement</option>
                <option value="avoir">Avoir commercial accordé</option>
                <option value="promesse">Promesse de règlement enregistrée</option>
              </Select>
            </Field>
            <Field label="Compte rendu" hint="ce que le client a dit, et ce qui a été convenu">
              <Textarea
                rows={4}
                placeholder="Appel au directeur financier. Difficulté de trésorerie liée à un retard de paiement de leur propre client public. Échelonnement en trois mensualités proposé et accepté, première échéance au 5 septembre."
              />
            </Field>
            <Field label="Prochaine relance" hint="laisser vide si le dossier est résolu">
              <Input type="date" defaultValue="2026-09-05" />
            </Field>
            <div className="space-y-3">
              <Switch
                checked={false}
                label="Proposer un échelonnement"
                description="Trois mensualités par défaut, sans pénalité. C’est le levier qui recouvre le mieux."
              />
              <Switch
                checked={false}
                label="Suspendre l’organisation"
                description="Décision humaine, à ne prendre qu’après rappel écrit et quinze jours supplémentaires. Elle arrête l’activité du client et sera consignée avec votre nom."
              />
            </div>
            <Callout ton="violet" titre="Avant de suspendre, appelez">
              Sur les six dossiers d’impayé traités cette année, cinq se sont résolus par un simple
              appel et un échelonnement. Le sixième était une entreprise en cessation de paiement, où
              la suspension n’aurait rien changé. La coupure n’a jamais fait rentrer d’argent plus vite
              qu’une conversation.
            </Callout>
          </div>
        )}
      </Modal>
    </div>
  )
}
