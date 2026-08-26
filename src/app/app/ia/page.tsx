'use client'

import {
  Bot,
  Boxes,
  BrainCircuit,
  Cpu,
  KeyRound,
  Plug,
  Wallet,
  Workflow,
} from 'lucide-react'
import Link from 'next/link'
import { seededSeries } from '@/lib/utils'
import { TYPE_AGENT_LABEL } from '@/lib/types'
import { jetons, money, num, pct } from '@/lib/format'
import {
  AGENTS_IA,
  BUDGET_IA,
  CLES_IA,
  CONSOMMATION_PAR_MODELE,
  EVENEMENTS_IA,
  MODELES_IA,
  PASSERELLE_IA,
  POINTS_INFERENCE,
  modeleParSlug,
} from '@/lib/mock'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { SolutionLogo } from '@/components/ui/display'
import { Card, CardHeader, Callout, NavCard, PageHeader } from '@/components/composition/card'
import { StackedBar, StatTile } from '@/components/composition/metrics'
import { EventList, GrilleSparkCharts, LiensSortie } from '@/components/business/observabilite'
import { useEspace } from '@/components/app/contexte'

const SECTIONS = [
  {
    href: '/app/ia/agents',
    titre: 'Agents',
    icone: <Bot size={17} />,
    description:
      'Rôle, consigne, variables, outils, connaissances et garde-fous. Chaque modification crée une version, et toute version se rejoue.',
  },
  {
    href: '/app/ia/orchestration',
    titre: 'Orchestration',
    icone: <Workflow size={17} />,
    description:
      'Plusieurs agents qui se passent le relais : enchaînement, branches, exécution parallèle, reprise sur erreur, validation humaine.',
  },
  {
    href: '/app/ia/connaissances',
    titre: 'Connaissances',
    icone: <BrainCircuit size={17} />,
    description:
      'Vos documents indexés pour que vos agents les interrogent. Nous indexons la source, nous ne la dupliquons pas.',
  },
  {
    href: '/app/ia/integrations',
    titre: 'Intégrations',
    icone: <Plug size={17} />,
    description:
      'Par où les gens atteignent un agent — WhatsApp, SMS, voix, SIP, REST — et ce qu’un agent peut appeler : API internes, serveurs MCP.',
  },
  {
    href: '/app/ia/modeles',
    titre: 'Modèles',
    icone: <Boxes size={17} />,
    description:
      'Ce qui est disponible, où le calcul a lieu, combien coûte un million de jetons et quelle latence attendre.',
  },
  {
    href: '/app/ia/inference',
    titre: 'Inférence dédiée',
    icone: <Cpu size={17} />,
    description:
      'Des GPU réservés pour vous seul quand la file mutualisée ne suffit plus. Facturé à l’heure, pas au jeton.',
  },
  {
    href: '/app/ia/consommation',
    titre: 'Consommation',
    icone: <Wallet size={17} />,
    description:
      'Jetons et FCFA par modèle, par clé et par jour, et comparaison avec un scénario tout externe.',
  },
  {
    href: '/app/ia/parametres',
    titre: 'Paramètres',
    icone: <KeyRound size={17} />,
    description:
      'Passerelle et clés, coffre-fort fournisseurs, routage, garde-fous, résidence des données, budget. Ce qui s’applique à toute l’organisation.',
  },
]

export default function AccueilIA() {
  const espace = useEspace()
  const cles = CLES_IA.filter((c) => c.espaceId === espace.id && c.statut === 'active')
  const souverains = MODELES_IA.filter(
    (m) => m.hebergement === 'souverain' && m.statut !== 'retire',
  )
  const points = POINTS_INFERENCE.filter((p) => p.espaceId === espace.id)
  const agentsPublies = AGENTS_IA.filter((a) => a.espaceId === espace.id && a.statut === 'publie')

  const partExterne = 100 - PASSERELLE_IA.partTerritoirePct

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'IA & Agents' }]}
        titre="Intelligence artificielle"
        sousTitre="Une passerelle unique devant deux mondes : les modèles que nous hébergeons à Abidjan et à Grand-Bassam, et ceux des fournisseurs étrangers. Vous décidez, usage par usage, ce qui reste sur le territoire — et le portail compte ce qui en sort."
        meta={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone="violet" size="sm">
              Région {PASSERELLE_IA.region}
            </Badge>
            <Badge tone="ok" dot size="sm">
              {souverains.length} modèles souverains
            </Badge>
            <Badge tone="neutral" size="sm">
              {cles.length} clés actives sur {espace.code}
            </Badge>
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          libelle="Requêtes 24 h"
          valeur={num(PASSERELLE_IA.requetes24h)}
          serie={seededSeries('ia-req', 24, 5_200, 9_800)}
        />
        <StatTile
          libelle="Jetons du mois"
          valeur={jetons(PASSERELLE_IA.jetonsConsommesMois)}
          detail={`${pct((PASSERELLE_IA.jetonsConsommesMois / PASSERELLE_IA.quotaOrgJetonsMois) * 100)} du quota de l’organisation`}
        />
        <StatTile
          libelle="Traité sur le territoire"
          valeur={pct(PASSERELLE_IA.partTerritoirePct, 1)}
          ton="ok"
          detail={`${pct(partExterne, 1)} appelés hors de Côte d’Ivoire`}
          serie={seededSeries('ia-terr', 24, 74, 84)}
        />
        <StatTile
          libelle="Dépense du mois"
          valeur={money(BUDGET_IA.consomme)}
          detail={`Prévision ${money(BUDGET_IA.prevision)} · plafond ${money(BUDGET_IA.plafondMensuel)}`}
        />
      </div>

      <Callout ton="violet" titre="Ce que la plateforme fait, et ce qu’elle ne fait pas">
        Elle distribue les accès, choisit le modèle, exécute vos agents, applique les garde-fous,
        mesure et facture. Elle n’entraîne aucun modèle sur vos données et ne propose pas d’affinage.
        Vos requêtes ne sont jamais réutilisées pour entraîner quoi que ce soit — ni chez nous, ni
        chez les fournisseurs sous notre contrat cadre. Un agent se met au travail sur un canal
        publié — widget, WhatsApp, SMS, voix, API : ce portail sert à le construire, l’observer et le
        borner, pas à converser avec lui.
      </Callout>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <NavCard
            key={s.href}
            href={s.href}
            titre={s.titre}
            icone={s.icone}
            description={s.description}
          />
        ))}
      </div>

      <Card>
        <CardHeader
          titre="Agents en production"
          sousTitre="Ce que la plateforme fait tourner pour vous en ce moment, et ce que cela coûte par jour."
          actions={
            <ButtonLink href="/app/ia/agents" variant="ghost" size="sm">
              Tous les agents
            </ButtonLink>
          }
        />
        {agentsPublies.length === 0 ? (
          <p className="text-[12.5px] leading-relaxed text-g-500">
            Aucun agent publié sur cet espace. La passerelle est utilisable telle quelle depuis vos
            applications, mais rien ne tourne pour vous.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {agentsPublies.map((a) => (
              <Link
                key={a.id}
                href={`/app/ia/agents/${a.id}`}
                className="rounded-[8px] border border-g-300 px-3 py-2.5 transition-colors hover:border-p-400"
              >
                <span className="flex items-center gap-2.5">
                  <SolutionLogo initiales={a.initiales} teinte={a.teinte} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-ink">
                      {a.nom}
                    </span>
                    <span className="block truncate text-[11px] text-g-500">
                      {TYPE_AGENT_LABEL[a.type]} · {num(a.metriques.conversations7j)} échanges / 7 j
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-right text-[11px] text-g-500">
                    {money(a.metriques.coutJour)}
                    <span className="block">par jour</span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            titre="Où va le trafic"
            sousTitre="Part des jetons du mois par modèle, souverains d’abord."
          />
          <StackedBar
            segments={CONSOMMATION_PAR_MODELE.map((c) => ({
              label: modeleParSlug(c.slug)?.nom ?? c.slug,
              valeur: c.jetons,
              couleur:
                modeleParSlug(c.slug)?.hebergement === 'souverain'
                  ? 'var(--color-p-600)'
                  : 'var(--color-warn)',
            }))}
          />
          <div className="mt-4 space-y-1.5">
            {CONSOMMATION_PAR_MODELE.map((c) => {
              const m = modeleParSlug(c.slug)
              return (
                <div
                  key={c.slug}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-g-100 pb-1.5 last:border-0"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[12.5px] text-ink">{m?.nom ?? c.slug}</span>
                    <Badge tone={m?.hebergement === 'souverain' ? 'ok' : 'warn'} size="sm">
                      {m?.hebergement === 'souverain' ? 'Territoire' : 'Hors territoire'}
                    </Badge>
                  </span>
                  <span className="tnum shrink-0 text-[12px] text-g-500">
                    {jetons(c.jetons)} · {money(c.montant)}
                  </span>
                </div>
              )
            })}
          </div>
          <Callout ton="info" className="mt-4" titre="Lire ce graphique">
            Les modèles externes pèsent 8 % des jetons mais 24 % de la dépense. C’est le rapport
            normal : on ne les appelle que là où le gain de qualité se justifie.
          </Callout>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Événements de la passerelle"
              sousTitre="Huit dernières entrées — quotas, replis, garde-fous, incidents fournisseurs."
            />
            <EventList evenements={EVENEMENTS_IA} max={8} />
          </Card>
          <Card>
            <CardHeader titre="Points d’inférence dédiés" sousTitre={`Espace ${espace.code}`} />
            {points.length === 0 ? (
              <p className="text-[12.5px] leading-relaxed text-g-500">
                Aucun GPU réservé sur cet espace : tout passe par la file mutualisée, ce qui suffit
                tant que la latence p95 reste sous la seconde.
              </p>
            ) : (
              <div className="space-y-2">
                {points.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-g-300 px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-[12.5px] font-semibold text-ink">
                        {p.nom}
                      </span>
                      <span className="block text-[11px] text-g-500">
                        {p.gpu} ×{p.gpuParReplica * p.replicas} · {p.site === 'ABJ' ? 'Abidjan' : 'Grand-Bassam'}
                      </span>
                    </span>
                    <Badge
                      tone={p.statut === 'en_ligne' ? 'ok' : p.statut === 'erreur' ? 'err' : 'neutral'}
                      dot
                      size="sm"
                    >
                      {p.statut === 'en_ligne'
                        ? 'En ligne'
                        : p.statut === 'en_veille'
                          ? 'En veille'
                          : p.statut === 'demarrage'
                            ? 'Démarrage'
                            : 'Erreur'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader
          titre="Santé de la passerelle"
          sousTitre="Vingt-quatre dernières heures, tous modèles confondus."
          actions={<LiensSortie grafana logs />}
        />
        <GrilleSparkCharts
          seed="ia-passerelle"
          metriques={[
            { titre: 'Requêtes par minute', unite: 'req/min', min: 84, max: 186 },
            { titre: 'Latence du premier jeton', unite: 'ms', min: 240, max: 1_400, seuil: 1_200 },
            { titre: 'Taux d’erreur', unite: '%', min: 0.1, max: 1.4, seuil: 1, couleur: 'var(--color-warn)' },
            { titre: 'Jetons par seconde', unite: 'jet/s', min: 1_800, max: 4_600 },
          ]}
        />
      </Card>

      <Callout
        ton="info"
        titre={`${num(PASSERELLE_IA.requetes24h)} requêtes en 24 h, dont ${pct(partExterne, 1)} hors du territoire`}
      >
        Le détail des sorties — modèle appelé, juridiction, classe de données, volume — est conservé
        cinq ans et exportable depuis le journal d’audit. C’est la pièce que réclame un contrôle :
        non pas la promesse que rien ne sort, mais la trace de ce qui est sorti et pourquoi.
      </Callout>
    </div>
  )
}
