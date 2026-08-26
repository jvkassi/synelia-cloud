'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bot,
  BookOpen,
  Combine,
  GitBranch,
  LogIn,
  LogOut,
  UserCheck,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { money, num, pct } from '@/lib/format'
import type { FluxOrchestration, LigneLog, NoeudFlux, TypeNoeud } from '@/lib/types'
import { AGENTS_IA, FLUX_ORCHESTRATION } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { CodeBlock, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Select, Slider, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { LogPeek } from '@/components/business/observabilite'
import { useApp, useEspace } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'studio', label: 'Studio' },
  { id: 'executions', label: 'Exécutions' },
  { id: 'reglages', label: 'Réglages' },
]

/** Gabarit d'un nœud sur le canevas, en pixels. */
const N_L = 150
const N_H = 60

const STYLE_NOEUD: Record<
  TypeNoeud,
  { bord: string; fond: string; texte: string; icone: React.ReactNode; label: string }
> = {
  entree: { bord: 'border-g-500', fond: 'bg-white', texte: 'text-g-700', icone: <LogIn size={12} />, label: 'Entrée' },
  agent: { bord: 'border-p-700', fond: 'bg-p-050', texte: 'text-p-700', icone: <Bot size={12} />, label: 'Agent' },
  condition: { bord: 'border-warn', fond: 'bg-warn-bg', texte: 'text-warn', icone: <GitBranch size={12} />, label: 'Condition' },
  outil: { bord: 'border-info', fond: 'bg-info-bg', texte: 'text-info', icone: <Wrench size={12} />, label: 'Outil' },
  connaissance: { bord: 'border-ok', fond: 'bg-ok-bg', texte: 'text-ok', icone: <BookOpen size={12} />, label: 'Recherche' },
  synthese: { bord: 'border-p-600', fond: 'bg-p-100', texte: 'text-p-700', icone: <Combine size={12} />, label: 'Synthèse' },
  humain: { bord: 'border-dashed border-p-700', fond: 'bg-white', texte: 'text-p-700', icone: <UserCheck size={12} />, label: 'Pause humaine' },
  sortie: { bord: 'border-g-500', fond: 'bg-white', texte: 'text-g-700', icone: <LogOut size={12} />, label: 'Sortie' },
}

const JOURNAL_FLUX: LigneLog[] = [
  { ts: '2026-08-19T15:14:15Z', niveau: 'INFO', source: 'exec-8841f2', message: 'WhatsApp · facturation · 12,8 s · 8 420 jetons · 46 F · succès' },
  { ts: '2026-08-19T15:11:48Z', niveau: 'INFO', source: 'exec-8841e9', message: 'SMS · technique · 9,2 s · 6 180 jetons · 38 F · succès' },
  { ts: '2026-08-19T15:08:02Z', niveau: 'WARN', source: 'exec-8841d4', message: 'Dossier client en délai dépassé — reprise 1/2 réussie · 15,4 s' },
  { ts: '2026-08-19T15:04:37Z', niveau: 'INFO', source: 'exec-8841c1', message: 'Widget · facturation · 11,1 s · succès' },
  { ts: '2026-08-19T14:59:20Z', niveau: 'ERROR', source: 'exec-8841b8', message: 'Journaux MCP indisponible après 2 reprises — synthèse produite sans la branche technique' },
  { ts: '2026-08-19T14:56:44Z', niveau: 'INFO', source: 'exec-8841a2', message: 'WhatsApp · technique · 18,7 s · succès' },
  { ts: '2026-08-19T14:52:10Z', niveau: 'INFO', source: 'exec-88419e', message: 'En attente de validation humaine depuis 6 min · enjeu 124 365 F' },
  { ts: '2026-08-19T14:48:33Z', niveau: 'WARN', source: 'exec-884188', message: 'Triage sous le seuil de confiance (0,54) — catégorie « autre » par défaut' },
  { ts: '2026-08-19T14:44:07Z', niveau: 'INFO', source: 'exec-884171', message: 'SMS · facturation · 8,4 s · succès' },
  { ts: '2026-08-19T14:40:52Z', niveau: 'INFO', source: 'exec-884160', message: 'Widget · technique · 21,3 s · succès' },
]

/**
 * Canevas du flux : les liens en SVG, les nœuds en boutons HTML posés dessus.
 * Des `<rect>` SVG n'auraient pas de nom accessible — un bouton, si.
 */
function Canevas({
  flux,
  actif,
  onSelect,
}: {
  flux: FluxOrchestration
  actif: string
  onSelect: (id: string) => void
}) {
  const parId = new Map(flux.noeuds.map((n) => [n.id, n]))

  return (
    <div className="overflow-x-auto rounded-[8px] border border-g-300 bg-g-050">
      <div
        className="relative"
        style={{ width: flux.largeur, height: flux.hauteur, minWidth: flux.largeur }}
      >
        <svg
          className="absolute inset-0"
          width={flux.largeur}
          height={flux.hauteur}
          aria-hidden
          focusable="false"
        >
          <defs>
            <marker
              id="fleche"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 z" fill="var(--color-g-500)" />
            </marker>
          </defs>
          {flux.liens.map((l) => {
            const s = parId.get(l.de)
            const t = parId.get(l.vers)
            if (!s || !t) return null
            // Deux nœuds d'une même colonne se relient par le bas ; sinon on
            // sort par la droite et on entre par la gauche.
            const vertical = t.x <= s.x
            const x1 = vertical ? s.x + N_L / 2 : s.x + N_L
            const y1 = vertical ? s.y + N_H : s.y + N_H / 2
            const x2 = vertical ? t.x + N_L / 2 : t.x
            const y2 = vertical ? t.y : t.y + N_H / 2
            const d = vertical
              ? `M ${x1} ${y1} C ${x1} ${y1 + 30}, ${x2} ${y2 - 30}, ${x2} ${y2}`
              : `M ${x1} ${y1} C ${x1 + 24} ${y1}, ${x2 - 24} ${y2}, ${x2} ${y2}`
            return (
              <path
                key={`${l.de}-${l.vers}`}
                d={d}
                fill="none"
                stroke="var(--color-g-500)"
                strokeWidth={1.5}
                strokeDasharray={l.conditionnel ? '4 3' : undefined}
                markerEnd="url(#fleche)"
              />
            )
          })}
        </svg>

        {flux.liens
          .filter((l) => l.libelle)
          .map((l) => {
            const s = parId.get(l.de)
            const t = parId.get(l.vers)
            if (!s || !t) return null
            const vertical = t.x <= s.x
            const cx = vertical ? s.x + N_L / 2 : (s.x + N_L + t.x) / 2
            const cy = vertical
              ? (s.y + N_H + t.y) / 2
              : (s.y + N_H / 2 + (t.y + N_H / 2)) / 2
            return (
              <span
                key={`lb-${l.de}-${l.vers}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-[4px] border border-g-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-g-700"
                style={{ left: cx, top: cy }}
              >
                {l.libelle}
              </span>
            )
          })}

        {flux.noeuds.map((n) => {
          const st = STYLE_NOEUD[n.type]
          const selectionne = n.id === actif
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onSelect(n.id)}
              style={{ left: n.x, top: n.y, width: N_L, height: N_H }}
              className={cn(
                'absolute flex flex-col justify-center rounded-[8px] border-2 px-2.5 text-left transition-shadow',
                st.bord,
                st.fond,
                selectionne
                  ? 'shadow-[0_0_0_3px_rgba(75,40,130,.25)]'
                  : 'hover:shadow-[0_2px_10px_rgba(43,27,77,.14)]',
              )}
            >
              <span className={cn('flex items-center gap-1', st.texte)}>
                {st.icone}
                <span className="type-micro truncate">{st.label}</span>
                {n.tentatives && n.tentatives > 1 && (
                  <span className="tnum ml-auto shrink-0 text-[9.5px]">×{n.tentatives}</span>
                )}
              </span>
              <span className="mt-0.5 block truncate text-[12px] font-bold text-ink">{n.nom}</span>
              <span className="block truncate text-[10px] text-g-500">{n.detail}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Orchestration() {
  const espace = useEspace()
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('studio')

  const flux = FLUX_ORCHESTRATION.filter((f) => f.espaceId === espace.id)
  const [fluxId, setFluxId] = useState(flux[0]?.id ?? '')
  const courant = flux.find((f) => f.id === fluxId) ?? flux[0]
  const [noeudId, setNoeudId] = useState(courant?.noeuds[0]?.id ?? '')

  const peutEcrire = autorise('ia.flow.write')
  const noeud: NoeudFlux | undefined =
    courant?.noeuds.find((n) => n.id === noeudId) ?? courant?.noeuds[0]
  const agent = noeud?.agentId ? AGENTS_IA.find((a) => a.id === noeud.agentId) : undefined
  const typesPresents = courant
    ? Array.from(new Set(courant.noeuds.map((n) => n.type)))
    : []
  const plusLent = courant
    ? [...courant.noeuds].sort((a, b) => b.latenceMs - a.latenceMs)[0]
    : undefined
  const plusFragile = courant
    ? [...courant.noeuds].sort((a, b) => b.tauxErreurPct - a.tauxErreurPct)[0]
    : undefined

  if (!courant) {
    return (
      <div className="space-y-5">
        <PageHeader
          fil={[
            { label: 'Espace client', href: '/app' },
            { label: 'IA & Agents', href: '/app/ia' },
            { label: 'Orchestration' },
          ]}
          titre="Orchestration"
          sousTitre="Aucun flux sur cet espace."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'IA & Agents', href: '/app/ia' },
          { label: 'Orchestration' },
        ]}
        titre="Orchestration"
        sousTitre="Un agent seul traite une intention. Un flux en enchaîne plusieurs : il classe, aiguille, lance des recherches en parallèle, fusionne, reprend ce qui a échoué et s’arrête devant un humain quand l’enjeu le demande. Chaque nœud du graphe porte ce qu’il dure, ce qu’il coûte et ce qu’il rate."
        actions={
          <GatedAction autorise={peutEcrire} message={refus('ia.flow.write')}>
            <Button variant="secondary">Modifier le flux</Button>
          </GatedAction>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {flux.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setFluxId(f.id)
              setNoeudId(f.noeuds[0].id)
            }}
            className={cn(
              'rounded-[10px] border-2 bg-white p-4 text-left transition-colors',
              courant.id === f.id ? 'border-p-700' : 'border-g-300 hover:border-p-400',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-bold text-ink">{f.nom}</span>
                <span className="block truncate text-[11px] text-g-500">{f.declencheur}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <Badge tone="neutral" size="sm">
                  {f.version}
                </Badge>
                <Badge tone={f.statut === 'publie' ? 'ok' : 'neutral'} dot size="sm">
                  {f.statut === 'publie' ? 'Publié' : 'Brouillon'}
                </Badge>
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-g-100 pt-2.5">
              <span className="block">
                <MicroLabel>Exécutions 7 j</MicroLabel>
                <span className="tnum block text-[12.5px] font-semibold text-ink">
                  {num(f.executions7j)}
                </span>
              </span>
              <span className="block">
                <MicroLabel>Durée médiane</MicroLabel>
                <span className="tnum block text-[12.5px] font-semibold text-ink">
                  {f.dureeMedianeS} s
                </span>
              </span>
              <span className="block">
                <MicroLabel>Nœuds</MicroLabel>
                <span className="tnum block text-[12.5px] font-semibold text-ink">
                  {f.noeuds.length}
                </span>
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile libelle="Exécutions 7 jours" valeur={num(courant.executions7j)} />
        <StatTile
          libelle="Durée médiane"
          valeur={`${courant.dureeMedianeS} s`}
          detail={`Nœud le plus lent : ${plusLent?.nom ?? '—'}`}
        />
        <StatTile
          libelle="Taux de succès"
          valeur={pct(courant.tauxSuccesPct, 1)}
          ton={courant.tauxSuccesPct > 90 ? 'ok' : 'warn'}
          detail={`Maillon faible : ${plusFragile?.nom ?? '—'}`}
        />
        <StatTile
          libelle="Coût par exécution"
          valeur={money(courant.coutParExecution)}
          detail={`${money(courant.coutParExecution * courant.executions7j)} sur 7 jours`}
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'studio' && (
        <div className="space-y-4">
          <Card padding={false}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-g-100 px-4 py-3">
              <div className="min-w-0">
                <p className="type-h3">{courant.nom}</p>
                <p className="mt-0.5 max-w-3xl text-[12px] leading-relaxed text-g-500">
                  {courant.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {typesPresents.map((t) => (
                  <span
                    key={t}
                    className={cn(
                      'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold',
                      STYLE_NOEUD[t].bord,
                      STYLE_NOEUD[t].fond,
                      STYLE_NOEUD[t].texte,
                    )}
                  >
                    {STYLE_NOEUD[t].icone}
                    {STYLE_NOEUD[t].label}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4">
              <Canevas flux={courant} actif={noeud?.id ?? ''} onSelect={setNoeudId} />
              <p className="mt-2 text-[11.5px] text-g-500">
                Trait plein : enchaînement systématique. Trait pointillé : branche conditionnelle,
                avec sa part de trafic. Un nœud marqué <span className="font-mono">×2</span> est
                rejoué automatiquement en cas d’échec.
              </p>
            </div>
          </Card>

          {noeud && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
              <Card>
                <CardHeader
                  titre={noeud.nom}
                  sousTitre={`${STYLE_NOEUD[noeud.type].label} · ${noeud.detail}`}
                  actions={
                    agent && (
                      <ButtonLink href="/app/ia/agents" variant="ghost" size="sm">
                        <Bot size={13} />
                        Ouvrir l’agent
                      </ButtonLink>
                    )
                  }
                />
                <KeyValueList
                  colonnes={2}
                  items={[
                    { cle: 'Exécutions 24 h', valeur: num(noeud.executions24h) },
                    {
                      cle: 'Latence médiane',
                      valeur:
                        noeud.latenceMs === 0
                          ? 'Sans objet — attente humaine'
                          : noeud.latenceMs > 10_000
                            ? `${(noeud.latenceMs / 1000).toFixed(0)} s`
                            : `${num(noeud.latenceMs)} ms`,
                    },
                    {
                      cle: 'Coût pour mille passages',
                      valeur: noeud.coutPourMille === 0 ? 'Aucun' : money(noeud.coutPourMille),
                    },
                    {
                      cle: 'Taux d’erreur',
                      valeur: noeud.tauxErreurPct === 0 ? 'Aucune erreur' : pct(noeud.tauxErreurPct, 1),
                    },
                    {
                      cle: 'Reprises',
                      valeur: noeud.tentatives
                        ? `${noeud.tentatives} tentatives avant abandon`
                        : 'Aucune — l’échec remonte immédiatement',
                    },
                    {
                      cle: 'Agent rattaché',
                      valeur: agent ? agent.nom : 'Aucun — nœud technique',
                    },
                  ]}
                />
                {noeud.type === 'humain' && (
                  <Callout ton="violet" className="mt-4" titre="Le flux attend ici">
                    L’exécution est mise en pause et reprend là où elle s’est arrêtée après décision.
                    {' '}{num(noeud.executions24h)} exécutions sur 24 h passent par ce point ; celles
                    qui n’obtiennent pas de réponse sous quatre heures repartent en file de
                    traitement humain classique, sans réponse automatique.
                  </Callout>
                )}
                {noeud.tauxErreurPct > 5 && (
                  <Callout ton="warn" className="mt-4" titre="Le maillon faible du flux">
                    {pct(noeud.tauxErreurPct, 1)} d’échecs, soit environ{' '}
                    {num(Math.round((noeud.executions24h * noeud.tauxErreurPct) / 100))} passages par
                    jour rattrapés par la reprise, ou perdus. Le taux de succès du flux entier ne
                    dépassera pas ce qu’autorise ce nœud.
                  </Callout>
                )}
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader
                    titre="Où part le temps"
                    sousTitre="Latence de chaque nœud, rapportée au plus lent."
                  />
                  <div className="space-y-2">
                    {[...courant.noeuds]
                      .filter((n) => n.latenceMs > 0)
                      .sort((a, b) => b.latenceMs - a.latenceMs)
                      .slice(0, 6)
                      .map((n) => (
                        <div key={n.id}>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="min-w-0 truncate text-[11.5px] text-ink">{n.nom}</span>
                            <span className="tnum shrink-0 text-[11px] text-g-500">
                              {n.latenceMs > 10_000
                                ? `${(n.latenceMs / 1000).toFixed(0)} s`
                                : `${num(n.latenceMs)} ms`}
                            </span>
                          </div>
                          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-g-100">
                            <span
                              className={cn(
                                'block h-full rounded-full',
                                n.id === noeud.id ? 'bg-p-700' : 'bg-p-400',
                              )}
                              style={{
                                width: `${(n.latenceMs / (plusLent?.latenceMs || 1)) * 100}%`,
                              }}
                            />
                          </span>
                        </div>
                      ))}
                  </div>
                </Card>
                <Callout ton="info" titre="Le parallèle ne réduit pas le coût">
                  Trois branches lancées ensemble raccourcissent l’attente, pas la facture : chacune
                  consomme ses jetons. Le parallélisme s’achète en jetons et se rembourse en secondes.
                </Callout>
              </div>
            </div>
          )}
        </div>
      )}

      {onglet === 'executions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              libelle="Exécutions 24 h"
              valeur={num(courant.noeuds[0].executions24h)}
              detail="Entrées dans le flux"
            />
            <StatTile
              libelle="En attente humaine"
              valeur={num(
                courant.noeuds.filter((n) => n.type === 'humain').reduce((a, n) => a + n.executions24h, 0),
              )}
              detail="Mises en pause sur 24 h"
              ton="warn"
            />
            <StatTile
              libelle="Reprises déclenchées"
              valeur={num(
                courant.noeuds
                  .filter((n) => n.tentatives)
                  .reduce((a, n) => a + Math.round((n.executions24h * n.tauxErreurPct) / 100), 0),
              )}
              detail="Nœuds rejoués automatiquement"
            />
            <StatTile
              libelle="Échecs définitifs"
              valeur={pct(100 - courant.tauxSuccesPct, 1)}
              ton="warn"
              detail="Après épuisement des reprises"
            />
          </div>

          <Card>
            <CardHeader
              titre="Dernières exécutions"
              sousTitre="Vingt lignes au plus. Le détail pas à pas d’une exécution se lit dans la trace de l’agent concerné."
              actions={
                <ButtonLink href="/app/ia/agents" variant="ghost" size="sm">
                  Voir une trace complète
                </ButtonLink>
              }
            />
            <LogPeek lignes={JOURNAL_FLUX} max={20} titre="Journal du flux" />
          </Card>

          <Callout ton="warn" titre="Une exécution « réussie » peut avoir perdu une branche">
            L’exécution <span className="font-mono text-[12px]">exec-8841b8</span> est comptée en
            échec parce que la branche technique n’a rien rendu. Mais d’autres aboutissent avec une
            branche muette et sont comptées en succès : la synthèse se fait alors sur moins
            d’éléments, sans que personne ne le remarque. C’est le mode de défaillance le plus
            coûteux d’un flux multi-agents, et le plus discret.
          </Callout>
        </div>
      )}

      {onglet === 'reglages' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader
                titre="Mémoire et reprise"
                sousTitre="Ce que les agents d’un même flux partagent, et ce qui se rejoue quand un maillon lâche."
              />
              <div className="space-y-3.5">
                <Switch
                  checked={courant.memoirePartagee}
                  disabled={!peutEcrire}
                  label="Espace de contexte commun"
                  description="Les agents du flux lisent et écrivent dans la même mémoire de session. Pratique pour éviter de reposer trois fois la même question — au prix d’un couplage : ce qu’un agent y écrit de faux, les suivants le prennent pour acquis."
                />
                <Slider
                  label="Tentatives par nœud"
                  value={2}
                  onChange={() => undefined}
                  min={0}
                  max={5}
                  unite="tentatives"
                />
                <Slider
                  label="Délai entre deux tentatives"
                  value={3}
                  onChange={() => undefined}
                  min={1}
                  max={30}
                  unite="secondes"
                />
                <Field
                  label="Comportement après épuisement des reprises"
                  hint="Ce qui arrive quand un outil reste muet"
                >
                  <Select defaultValue="poursuivre" disabled={!peutEcrire}>
                    <option value="poursuivre">
                      Poursuivre sans la branche, en signalant l’absence dans la réponse
                    </option>
                    <option value="humain">Basculer vers un traitement humain</option>
                    <option value="echouer">Échouer et rendre une erreur à l’appelant</option>
                  </Select>
                </Field>
              </div>
            </Card>

            <Card>
              <CardHeader
                titre="Seuils de validation humaine"
                sousTitre="Où le flux doit s’arrêter et attendre une décision."
              />
              <div className="space-y-3.5">
                <Field label="Enjeu financier déclenchant une validation">
                  <Select defaultValue="50000" disabled={!peutEcrire}>
                    <option value="0">Toujours — chaque réponse est relue</option>
                    <option value="50000">Au-delà de 50 000 FCFA</option>
                    <option value="250000">Au-delà de 250 000 FCFA</option>
                    <option value="jamais">Jamais — le flux répond seul</option>
                  </Select>
                </Field>
                <Switch
                  checked
                  disabled={!peutEcrire}
                  label="Valider aussi sous le seuil de confiance"
                  description="Une classification à moins de 60 % de confiance part en validation, quel que soit le montant. C’est ce réglage qui rattrape les réclamations mal comprises."
                />
                <Field label="Délai avant bascule en file humaine classique">
                  <Select defaultValue="4" disabled={!peutEcrire}>
                    <option value="1">1 heure</option>
                    <option value="4">4 heures</option>
                    <option value="24">24 heures</option>
                  </Select>
                </Field>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader
                titre="Définition du flux"
                sousTitre="Le graphe s’exporte et s’importe. Versionné dans votre dépôt, il se relit, se compare et se déploie comme du code."
                actions={
                  <GatedAction autorise={peutEcrire} message={refus('ia.flow.write')}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        pousser({
                          ton: 'ok',
                          titre: 'Définition exportée',
                          detail: `${courant.nom} · ${courant.version}`,
                        })
                      }
                    >
                      Exporter
                    </Button>
                  </GatedAction>
                }
              />
              <CodeBlock
                langue="yaml"
                code={`flux: ${courant.id}
version: ${courant.version}
declencheur: ${courant.declencheur.toLowerCase()}
memoire_partagee: ${courant.memoirePartagee}

noeuds:
${courant.noeuds
  .slice(0, 5)
  .map(
    (n) =>
      `  - id: ${n.id}\n    type: ${n.type}${n.agentId ? `\n    agent: ${AGENTS_IA.find((a) => a.id === n.agentId)?.slug}` : ''}${n.tentatives ? `\n    tentatives: ${n.tentatives}` : ''}`,
  )
  .join('\n')}
  # … ${courant.noeuds.length - 5} nœuds supplémentaires

liens:
${courant.liens
  .slice(0, 4)
  .map((l) => `  - ${l.de} → ${l.vers}${l.libelle ? `   # ${l.libelle}` : ''}`)
  .join('\n')}
  # … ${courant.liens.length - 4} liens supplémentaires`}
              />
            </Card>

            <Callout ton="violet" titre="Un flux se teste par ses branches, pas par son chemin heureux">
              Le chemin nominal fonctionne toujours en démonstration. Ce qui casse en production,
              c’est la branche rare : la classification incertaine, l’outil muet, le montant juste
              au-dessus du seuil. Le jeu d’épreuves d’un flux doit contenir un cas par branche —
              sinon il ne mesure que la moitié du graphe.
            </Callout>

            <Callout ton="info" titre="Les agents restent autonomes">
              Un agent utilisé dans un flux garde sa propre consigne, ses propres outils et son
              propre budget. Le flux ne les remplace pas : il décide seulement de qui parle, quand,
              et avec quoi.{' '}
              <Link href="/app/ia/agents" className="font-semibold text-p-700 hover:text-m-600">
                Voir les agents →
              </Link>
            </Callout>
          </div>
        </div>
      )}
    </div>
  )
}
