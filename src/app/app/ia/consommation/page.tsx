'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { dateCourte, jetons, money, num, pct } from '@/lib/format'
import {
  BUDGET_IA,
  CLES_IA,
  COMPARAISON_SOUVERAIN,
  CONSOMMATION_IA_JOURS,
  CONSOMMATION_PAR_CLE,
  CONSOMMATION_PAR_MODELE,
  modeleParSlug,
} from '@/lib/mock'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { Slider, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, PageHeader } from '@/components/composition/card'
import { DataTable, type Colonne } from '@/components/composition/data-table'
import { QuotaBar, StackedBar, StatTile } from '@/components/composition/metrics'
import { PermissionDenied } from '@/components/composition/states'
import { useApp } from '@/components/app/contexte'

interface LigneJour {
  id: string
  date: string
  jetonsEntree: number
  jetonsSortie: number
  jetonsExternes: number
  requetes: number
  montant: number
}

const JOURS: LigneJour[] = CONSOMMATION_IA_JOURS.map((j) => ({ id: j.date, ...j }))

export default function ConsommationIA() {
  const { autorise, refus, pousser } = useApp()
  const [plafond, setPlafond] = useState(BUDGET_IA.plafondMensuel)
  const [bloquer, setBloquer] = useState(BUDGET_IA.bloquerAuPlafond)

  const peutBudgeter = autorise('ia.budget.update')
  const jetonsTotal = CONSOMMATION_PAR_MODELE.reduce((a, c) => a + c.jetons, 0)
  const requetes = JOURS.reduce((a, j) => a + j.requetes, 0)
  const externes = CONSOMMATION_PAR_MODELE.filter(
    (c) => modeleParSlug(c.slug)?.hebergement === 'externe',
  )
  const partExterneMontant = externes.reduce((a, c) => a + c.montant, 0)

  const controlesBudget = (
    <>
      <QuotaBar
        libelle="Dépense du mois"
        utilise={BUDGET_IA.consomme}
        total={plafond}
        seuil={BUDGET_IA.seuilAlertePct}
        formateur={(v) => money(v)}
      />
      <Slider
        label="Plafond mensuel"
        value={plafond}
        onChange={setPlafond}
        min={100_000}
        max={1_500_000}
        step={50_000}
        unite="FCFA"
      />
      <Switch
        checked={bloquer}
        onChange={setBloquer}
        label="Couper les appels au plafond"
        description="Au plafond, la passerelle répond 402 sur toutes les clés. Sans cette coupure, la dépense continue et la facture arrive à la fin du mois."
      />
    </>
  )

  const colonnes: Array<Colonne<LigneJour>> = [
    {
      id: 'date',
      entete: 'Jour',
      cle: (j) => j.date,
      rendu: (j) => <span className="text-[12.5px] text-ink">{dateCourte(j.date)}</span>,
    },
    {
      id: 'requetes',
      entete: 'Requêtes',
      aligne: 'right',
      cle: (j) => j.requetes,
      rendu: (j) => num(j.requetes),
    },
    {
      id: 'entree',
      entete: 'Jetons entrants',
      aligne: 'right',
      cle: (j) => j.jetonsEntree,
      rendu: (j) => jetons(j.jetonsEntree),
    },
    {
      id: 'sortie',
      entete: 'Jetons sortants',
      aligne: 'right',
      cle: (j) => j.jetonsSortie,
      rendu: (j) => jetons(j.jetonsSortie),
    },
    {
      id: 'externes',
      entete: 'Dont hors territoire',
      aligne: 'right',
      masquable: true,
      cle: (j) => j.jetonsExternes,
      rendu: (j) => (
        <span className="tnum text-warn">{jetons(j.jetonsExternes)}</span>
      ),
    },
    {
      id: 'montant',
      entete: 'Montant',
      aligne: 'right',
      cle: (j) => j.montant,
      rendu: (j) => <span className="font-semibold">{money(j.montant)}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'IA & Modèles', href: '/app/ia' },
          { label: 'Consommation & coûts' },
        ]}
        titre="Consommation & coûts"
        sousTitre="L’inférence se facture à l’usage : rien à l’arrêt, tout au jeton. Ce qui suit décompose la dépense du mois par modèle, par clé et par jour, et compare ce que coûterait le même trafic sans modèles souverains."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          libelle="Dépense du mois"
          valeur={money(BUDGET_IA.consomme)}
          detail={`Au ${dateCourte('2026-08-19')}, hors taxes`}
        />
        <StatTile
          libelle="Prévision fin de mois"
          valeur={money(BUDGET_IA.prevision)}
          ton={BUDGET_IA.prevision > plafond ? 'warn' : 'ok'}
          detail={`Plafond ${money(plafond)}`}
        />
        <StatTile libelle="Jetons du mois" valeur={jetons(jetonsTotal)} detail={`${num(requetes)} requêtes`} />
        <StatTile
          libelle="Coût pour mille requêtes"
          valeur={money(Math.round((BUDGET_IA.consomme / requetes) * 1_000))}
          detail="Toutes clés et tous modèles confondus"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            titre="Par modèle"
            sousTitre="Les modèles externes pèsent peu en jetons et beaucoup en francs."
          />
          <StackedBar
            segments={CONSOMMATION_PAR_MODELE.map((c) => ({
              label: modeleParSlug(c.slug)?.nom ?? c.slug,
              valeur: c.montant,
              couleur:
                modeleParSlug(c.slug)?.hebergement === 'souverain'
                  ? 'var(--color-p-600)'
                  : 'var(--color-warn)',
            }))}
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-g-300">
                  <th className="type-micro py-2 text-g-500">Modèle</th>
                  <th className="type-micro py-2 text-right text-g-500">Jetons</th>
                  <th className="type-micro py-2 text-right text-g-500">Montant</th>
                  <th className="type-micro py-2 text-right text-g-500">Part</th>
                </tr>
              </thead>
              <tbody>
                {CONSOMMATION_PAR_MODELE.map((c) => {
                  const m = modeleParSlug(c.slug)
                  return (
                    <tr key={c.slug} className="border-b border-g-100 last:border-0">
                      <td className="py-2.5">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[12.5px] text-ink">{m?.nom ?? c.slug}</span>
                          <Badge tone={m?.hebergement === 'souverain' ? 'ok' : 'warn'} size="sm">
                            {m?.hebergement === 'souverain' ? 'Territoire' : 'Hors territoire'}
                          </Badge>
                        </span>
                      </td>
                      <td className="tnum py-2.5 text-right text-[12.5px] text-g-700">
                        {jetons(c.jetons)}
                      </td>
                      <td className="tnum py-2.5 text-right text-[12.5px] font-semibold text-ink">
                        {money(c.montant)}
                      </td>
                      <td className="tnum py-2.5 text-right text-[12.5px] text-g-500">
                        {pct(c.pct, 1)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader
            titre="Par clé"
            sousTitre="Le showback interne se lit ici : chaque clé porte une application."
          />
          <div className="space-y-3">
            {CONSOMMATION_PAR_CLE.map((c) => {
              const cle = CLES_IA.find((k) => k.id === c.cleId)
              return (
                <div key={c.cleId}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-[12.5px] text-ink">
                      {cle?.nom ?? c.cleId}
                    </span>
                    <span className="tnum shrink-0 text-[12px] font-semibold text-ink">
                      {money(c.montant)}
                    </span>
                  </div>
                  <span className="mt-1 block h-2 overflow-hidden rounded-full bg-g-100">
                    <span
                      className="block h-full rounded-full bg-p-600"
                      style={{ width: `${c.pct}%` }}
                    />
                  </span>
                </div>
              )
            })}
          </div>
          <Callout ton="info" className="mt-4" titre="Refacturation interne">
            Ces montants s’exportent au format attendu par votre comptabilité analytique, avec le
            centre de coût déclaré sur chaque clé. C’est la raison d’être du champ « usage » : sans
            lui, la facture arrive en un seul bloc que personne ne sait ventiler.
          </Callout>
        </Card>
      </div>

      <Card>
        <CardHeader
          titre="Plafond de dépense"
          sousTitre="Le plafond porte sur l’ensemble de l’organisation ; chaque clé garde en plus le sien."
          actions={
            <GatedAction autorise={peutBudgeter} message={refus('ia.budget.update')}>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  pousser({ ton: 'ok', titre: 'Plafond enregistré', detail: money(plafond) })
                }
              >
                Enregistrer
              </Button>
            </GatedAction>
          }
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Le plafond est un réglage, pas un bouton : le griser au moyen de
              l'état « droits insuffisants » dit mieux la raison qu'une infobulle
              sur chaque curseur. */}
          {peutBudgeter ? (
            <div className="space-y-4">{controlesBudget}</div>
          ) : (
            <PermissionDenied message={refus('ia.budget.update')}>
              <div className="space-y-4">{controlesBudget}</div>
            </PermissionDenied>
          )}
          <div className="space-y-3">
            <Callout
              ton={BUDGET_IA.prevision > plafond ? 'warn' : 'ok'}
              titre={
                BUDGET_IA.prevision > plafond
                  ? 'La prévision dépasse le plafond'
                  : 'La prévision tient dans le plafond'
              }
            >
              À ce rythme, le mois se terminera à {money(BUDGET_IA.prevision)}, soit{' '}
              {pct((BUDGET_IA.prevision / plafond) * 100)} du plafond.{' '}
              {bloquer
                ? 'La coupure étant active, les appels s’arrêteront avant la fin du mois si le rythme se maintient.'
                : 'Aucune coupure n’est prévue : le dépassement passera en facturation.'}
            </Callout>
            <Callout ton="violet" titre="Trois leviers, dans l’ordre d’efficacité">
              Router davantage de trafic vers un modèle souverain, réduire la taille des consignes
              renvoyées à chaque appel, puis activer la mise en cache des consignes système — elle
              retire déjà 2 840 jetons non refacturés par appel sur la clé de production.
            </Callout>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          titre="Ce que coûterait le même trafic ailleurs"
          sousTitre="Même volume de jetons, même répartition entrée-sortie, aux tarifs publics de chaque scénario."
        />
        <div className="space-y-3">
          {[
            { label: 'Tout chez des fournisseurs externes', montant: COMPARAISON_SOUVERAIN.toutExterneFcfa, ton: 'warn' as const },
            { label: 'Répartition actuelle', montant: COMPARAISON_SOUVERAIN.reelFcfa, ton: 'violet' as const },
            { label: 'Tout sur les modèles souverains', montant: COMPARAISON_SOUVERAIN.toutSouverainFcfa, ton: 'ok' as const },
          ].map((s) => (
            <div key={s.label} className="flex flex-wrap items-center gap-3">
              <span className="w-full min-w-0 text-[12.5px] text-ink sm:w-64">{s.label}</span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-g-100">
                  <span
                    className={cn(
                      'block h-full rounded-full',
                      s.ton === 'warn' ? 'bg-warn' : s.ton === 'ok' ? 'bg-ok' : 'bg-p-600',
                    )}
                    style={{
                      width: `${(s.montant / COMPARAISON_SOUVERAIN.toutExterneFcfa) * 100}%`,
                    }}
                  />
                </span>
                <span className="tnum w-28 shrink-0 text-right text-[12.5px] font-semibold text-ink">
                  {money(s.montant)}
                </span>
              </span>
            </div>
          ))}
        </div>
        <Callout ton="ok" className="mt-4" titre={`${money(COMPARAISON_SOUVERAIN.economieMoisFcfa)} d’écart mensuel`}>
          L’écart entre le scénario tout externe et votre répartition actuelle paie plusieurs fois les
          GPU réservés. Il ne dit pas que les modèles externes sont inutiles : les{' '}
          {money(partExterneMontant)} dépensés chez eux couvrent {pct((externes.reduce((a, c) => a + c.jetons, 0) / jetonsTotal) * 100, 1)}{' '}
          des jetons, sur les tâches où l’écart de qualité se voit encore.
        </Callout>
      </Card>

      <Card padding={false}>
        <div className="border-b border-g-100 px-4 py-3">
          <CardHeader
            titre="Détail par jour"
            sousTitre="Dix-neuf jours écoulés sur le mois d’août 2026."
            className="mb-0"
          />
        </div>
        <DataTable
          lignes={JOURS}
          colonnes={colonnes}
          parPage={10}
          exportable
          densiteInitiale="compacte"
          vide={{
            titre: 'Aucune consommation ce mois-ci',
            phrase: 'Aucun appel n’a encore été facturé sur la période en cours.',
          }}
        />
      </Card>
    </div>
  )
}
