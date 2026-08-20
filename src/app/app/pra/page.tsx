import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, FileDown, Plus } from 'lucide-react'
import { dateCourte, dureeMin, pct } from '@/lib/format'
import { SITE_COURT } from '@/lib/types'
import { DR_PLANS } from '@/lib/mock'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardHeader, Callout, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { DrPlanSummary } from '@/components/business/infra'

export const metadata: Metadata = {
  title: 'Plan de reprise (PRA)',
  description:
    'RPO et RTO en cible et en constaté, ordre de démarrage, réplication, bascule de test et exercices datés.',
}

export default function ListePra() {
  const testes = DR_PLANS.filter((p) => p.exercices.length > 0)
  const dernier = testes.flatMap((p) => p.exercices).sort((a, b) => b.date.localeCompare(a.date))[0]
  const conformes = DR_PLANS.filter(
    (p) => p.rtoConstateMin > 0 && p.rtoConstateMin <= p.rtoCibleMin,
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Plan de reprise (PRA)' }]}
        titre="Plan de reprise"
        sousTitre="Un plan de reprise qui n’a jamais été exercé n’est pas un plan, c’est une intention. Nous affichons systématiquement la cible et le constaté côte à côte, et nous exerçons vos plans trimestriellement en réseau isolé."
        actions={
          <ButtonLink href="/app/pra" iconBefore={<Plus size={14} />}>
            Nouveau plan de reprise
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile libelle="Plans de reprise" valeur={DR_PLANS.length} />
        <StatTile
          libelle="Conformes au RTO"
          valeur={`${conformes}/${DR_PLANS.length}`}
          ton={conformes === DR_PLANS.length ? 'ok' : 'warn'}
        />
        <StatTile
          libelle="Exercices réalisés"
          valeur={testes.flatMap((p) => p.exercices).length}
          detail={dernier ? `Dernier le ${dateCourte(dernier.date)}` : 'Aucun exercice'}
        />
        <StatTile
          libelle="Plans jamais testés"
          valeur={DR_PLANS.filter((p) => p.exercices.length === 0).length}
          ton={DR_PLANS.some((p) => p.exercices.length === 0) ? 'warn' : 'ok'}
        />
      </div>

      <div className="space-y-4">
        {DR_PLANS.map((plan) => (
          <div key={plan.id} className="space-y-2">
            <DrPlanSummary plan={plan} />
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <span className="flex flex-wrap items-center gap-2 text-[12px] text-g-500">
                <Badge tone="neutral" size="sm">
                  {SITE_COURT[plan.siteSource]} → {SITE_COURT[plan.siteRepli]}
                </Badge>
                <span>
                  {plan.groupes.length} groupes de démarrage ·{' '}
                  {plan.groupes.reduce((a, g) => a + g.ressources.length, 0)} ressources
                </span>
              </span>
              <Link
                href={`/app/pra/${plan.id}`}
                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-p-700 hover:text-m-600"
              >
                Ouvrir le plan
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader
          titre="Historique des exercices"
          sousTitre="Chaque exercice produit un rapport daté, téléchargeable, opposable à un auditeur."
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse">
            <thead>
              <tr className="border-b border-g-300 bg-g-050">
                {['Date', 'Plan', 'Type', 'Durée', 'RTO constaté', 'Cible', 'Résultat', 'Rapport'].map(
                  (h) => (
                    <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {DR_PLANS.flatMap((p) =>
                p.exercices.map((e) => ({ ...e, plan: p.nom, cible: p.rtoCibleMin })),
              )
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((e) => (
                  <tr key={`${e.plan}-${e.date}`} className="border-b border-g-100 last:border-0">
                    <td className="px-3 py-2.5 text-[12.5px] text-ink">{dateCourte(e.date)}</td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-g-700">{e.plan}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={e.type === 'reel' ? 'err' : 'info'} size="sm">
                        {e.type === 'reel' ? 'Bascule réelle' : 'Bascule de test'}
                      </Badge>
                    </td>
                    <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">
                      {dureeMin(e.dureeMin)}
                    </td>
                    <td className="tnum px-3 py-2.5 text-[12.5px] font-semibold">
                      <span
                        className={e.rtoConstateMin <= e.cible ? 'text-ok' : 'text-err'}
                      >
                        {dureeMin(e.rtoConstateMin)}
                      </span>
                    </td>
                    <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">
                      {dureeMin(e.cible)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={e.succes ? 'ok' : 'err'} dot size="sm">
                        {e.succes ? 'Réussi' : 'Échoué'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <a
                        href={e.rapportUrl}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-p-700 hover:text-m-600"
                      >
                        <FileDown size={12} />
                        Télécharger
                      </a>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Callout ton="ok" titre="PRA-DBA-PROD : les chiffres tiennent">
          RPO constaté de 11 minutes pour une cible de 15, RTO constaté de 3 h 12 pour une cible de
          4 h. La progression est nette depuis l’exercice de janvier, qui avait échoué sur un groupe
          de sécurité de repli absent et un ordre de démarrage incorrect. Ces deux points ont été
          corrigés et vérifiés lors des exercices d’avril et de juillet.
        </Callout>
        <Callout ton="warn" titre="PRA-DBA-COLLAB n’a jamais été exercé">
          Le plan est configuré, la réplication fonctionne avec un retard de 48 minutes, mais aucune
          bascule de test n’a été menée. Le RTO de 8 heures affiché est donc théorique. Une bascule de
          test en réseau isolé n’a aucun impact sur votre production — c’est précisément ce qui permet
          de l’exercer souvent.
        </Callout>
      </div>
    </div>
  )
}
