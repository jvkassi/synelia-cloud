'use client'

import { useMemo, useState } from 'react'
import { Link2, Send, Sparkles, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_LABEL, type Role } from '@/lib/types'
import { GROUPES_RBAC, MATRICE_RBAC, ROLES_ORDRE, type Permission } from '@/lib/rbac'
import { BRIQUES_CANVAS, SUGGESTIONS_COPILOTE, REPONSES_COPILOTE } from '@/lib/mock/paas'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Input, SegmentedControl } from '@/components/ui/field'
import { Card, CardHeader } from '@/components/composition/card'

const SYMBOLES: Record<Permission, { glyphe: string; classe: string; titre: string }> = {
  full: { glyphe: '●', classe: 'text-ok', titre: 'Autorisé' },
  read: { glyphe: '◐', classe: 'text-warn', titre: 'Lecture seule' },
  none: { glyphe: '—', classe: 'text-g-300', titre: 'Interdit' },
}

/**
 * Matrice des rôles — écran de référence action × rôle (§7.1).
 * Rend le RBAC compréhensible plutôt que subi ; c'est aussi une exigence
 * de conformité.
 */
export function RoleMatrix({
  roles = ROLES_ORDRE,
  roleSurligne,
  className,
}: {
  roles?: Role[]
  roleSurligne?: Role
  className?: string
}) {
  const [groupe, setGroupe] = useState<string>('tous')
  const lignes = MATRICE_RBAC.filter((a) => groupe === 'tous' || a.groupe === groupe)

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setGroupe('tous')}
          className={cn(
            'rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors',
            groupe === 'tous'
              ? 'border-p-700 bg-p-700 text-white'
              : 'border-g-300 text-g-700 hover:bg-g-050',
          )}
        >
          Toutes les actions
        </button>
        {GROUPES_RBAC.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroupe(g)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors',
              groupe === g
                ? 'border-p-700 bg-p-700 text-white'
                : 'border-g-300 text-g-700 hover:bg-g-050',
            )}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-g-300 bg-white">
        <table className="w-full min-w-max border-collapse">
          <thead>
            <tr className="border-b border-g-300 bg-g-050">
              <th className="type-micro sticky left-0 z-10 min-w-64 bg-g-050 px-3 py-2.5 text-left text-g-500">
                Action
              </th>
              {roles.map((r) => (
                <th
                  key={r}
                  className={cn(
                    'px-2 py-2.5 text-center',
                    roleSurligne === r && 'bg-p-100',
                  )}
                >
                  <span className="type-micro block whitespace-nowrap text-g-500 [writing-mode:vertical-rl] rotate-180">
                    {ROLE_LABEL[r]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((a) => (
              <tr key={a.id} className="border-b border-g-100 last:border-0 hover:bg-p-050/50">
                <td className="sticky left-0 z-10 bg-white px-3 py-2 text-[12.5px] text-ink">
                  {a.libelle}
                </td>
                {roles.map((r) => {
                  const s = SYMBOLES[a.perms[r]]
                  return (
                    <td
                      key={r}
                      title={`${ROLE_LABEL[r]} — ${s.titre}`}
                      className={cn(
                        'px-2 py-2 text-center text-[15px] font-bold',
                        s.classe,
                        roleSurligne === r && 'bg-p-050',
                      )}
                    >
                      {s.glyphe}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-g-500">
        <span className="flex items-center gap-1.5">
          <span className="text-[14px] font-bold text-ok">●</span> autorisé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[14px] font-bold text-warn">◐</span> lecture seule
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[14px] font-bold text-g-300">—</span> interdit
        </span>
        <span className="ml-auto">
          Une action interdite n’est jamais masquée : elle est désactivée avec une infobulle qui
          nomme le rôle requis, et le refus est journalisé.
        </span>
      </div>
    </div>
  )
}

// ─── TopologyCanvas ───────────────────────────────────────────────────

interface NoeudCanvas {
  id: string
  briqueId: string
  nom: string
  x: number
  y: number
}

/**
 * Canvas d'architecture : glisser-déposer de briques, création d'une
 * dépendance en cliquant deux composants (§5.2 étape 3).
 */
export function TopologyCanvas({
  initial,
  className,
}: {
  initial?: Array<{ briqueId: string; nom: string; x: number; y: number }>
  className?: string
}) {
  const [noeuds, setNoeuds] = useState<NoeudCanvas[]>(
    (initial ?? [
      { briqueId: 'traefik', nom: 'traefik', x: 46, y: 12 },
      { briqueId: 'nginx', nom: 'web', x: 16, y: 44 },
      { briqueId: 'postgres', nom: 'postgres', x: 46, y: 74 },
      { briqueId: 'redis', nom: 'redis', x: 76, y: 44 },
    ]).map((n, i) => ({ ...n, id: `n${i}` })),
  )
  const [liens, setLiens] = useState<Array<[string, string]>>([
    ['n0', 'n1'],
    ['n1', 'n2'],
    ['n1', 'n3'],
  ])
  const [selection, setSelection] = useState<string | null>(null)
  const [mode, setMode] = useState<'deplacer' | 'lier'>('deplacer')
  const [glisse, setGlisse] = useState<string | null>(null)

  const brique = (id: string) => BRIQUES_CANVAS.find((b) => b.id === id)

  const ajouter = (briqueId: string) => {
    const b = brique(briqueId)
    if (!b) return
    const id = `n${Date.now()}`
    setNoeuds((p) => [
      ...p,
      { id, briqueId, nom: b.id, x: 20 + ((p.length * 17) % 60), y: 20 + ((p.length * 23) % 55) },
    ])
  }

  const cliquerNoeud = (id: string) => {
    if (mode === 'lier') {
      if (!selection) {
        setSelection(id)
      } else if (selection !== id) {
        setLiens((p) =>
          p.some(([a, b]) => (a === selection && b === id) || (a === id && b === selection))
            ? p
            : [...p, [selection, id]],
        )
        setSelection(null)
      } else {
        setSelection(null)
      }
    } else {
      setSelection(id === selection ? null : id)
    }
  }

  const supprimer = (id: string) => {
    setNoeuds((p) => p.filter((n) => n.id !== id))
    setLiens((p) => p.filter(([a, b]) => a !== id && b !== id))
    setSelection(null)
  }

  const noeudSelectionne = noeuds.find((n) => n.id === selection)

  return (
    <div className={cn('grid gap-4 lg:grid-cols-[240px_1fr]', className)}>
      <Card className="lg:max-h-[560px] lg:overflow-y-auto">
        <MicroLabel className="mb-2.5">Briques disponibles</MicroLabel>
        <div className="space-y-1.5">
          {BRIQUES_CANVAS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => ajouter(b.id)}
              className="flex w-full items-center gap-2.5 rounded-[6px] border border-g-300 px-2.5 py-2 text-left transition-colors hover:border-p-400 hover:bg-p-050"
            >
              <span
                className="h-6 w-6 shrink-0 rounded-[5px]"
                style={{ background: b.teinte }}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-semibold text-ink">{b.nom}</span>
                <span className="block truncate text-[10.5px] text-g-500">{b.categorie}</span>
              </span>
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl
            size="sm"
            value={mode}
            onChange={(v) => {
              setMode(v)
              setSelection(null)
            }}
            options={[
              { value: 'deplacer', label: 'Déplacer' },
              { value: 'lier', label: 'Créer une dépendance' },
            ]}
          />
          <p className="text-[11.5px] text-g-500">
            {mode === 'lier'
              ? 'Cliquez deux composants pour créer une dépendance.'
              : 'Faites glisser un composant pour le repositionner.'}
          </p>
        </div>

        <div
          className="relative h-[440px] overflow-hidden rounded-[10px] border border-g-300 bg-grid-violet bg-g-050"
          onMouseMove={(e) => {
            if (!glisse) return
            const r = e.currentTarget.getBoundingClientRect()
            const x = ((e.clientX - r.left) / r.width) * 100
            const y = ((e.clientY - r.top) / r.height) * 100
            setNoeuds((p) =>
              p.map((n) =>
                n.id === glisse
                  ? { ...n, x: Math.max(4, Math.min(92, x)), y: Math.max(4, Math.min(88, y)) }
                  : n,
              ),
            )
          }}
          onMouseUp={() => setGlisse(null)}
          onMouseLeave={() => setGlisse(null)}
        >
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            {liens.map(([a, b], i) => {
              const na = noeuds.find((n) => n.id === a)
              const nb = noeuds.find((n) => n.id === b)
              if (!na || !nb) return null
              return (
                <line
                  key={i}
                  x1={`${na.x + 4}%`}
                  y1={`${na.y + 5}%`}
                  x2={`${nb.x + 4}%`}
                  y2={`${nb.y + 5}%`}
                  stroke="var(--color-p-400)"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                />
              )
            })}
          </svg>

          {noeuds.map((n) => {
            const b = brique(n.briqueId)
            return (
              <button
                key={n.id}
                type="button"
                onMouseDown={() => mode === 'deplacer' && setGlisse(n.id)}
                onClick={() => cliquerNoeud(n.id)}
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
                className={cn(
                  'absolute flex w-28 flex-col items-center gap-1.5 rounded-[8px] border-2 bg-white px-2 py-2 shadow-[0_2px_8px_rgba(43,27,77,.1)] transition-all',
                  selection === n.id ? 'border-m-600' : 'border-g-300 hover:border-p-400',
                  mode === 'deplacer' ? 'cursor-move' : 'cursor-pointer',
                )}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[10px] font-bold text-white"
                  style={{ background: b?.teinte ?? '#4B2882' }}
                >
                  {(b?.nom ?? '?').slice(0, 2).toUpperCase()}
                </span>
                <span className="truncate font-mono text-[11px] text-ink">{n.nom}</span>
              </button>
            )
          })}
        </div>

        {noeudSelectionne && (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="type-h3 font-mono">{noeudSelectionne.nom}</h4>
                <p className="mt-0.5 text-[12px] text-g-500">
                  {brique(noeudSelectionne.briqueId)?.image}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge tone="violet" size="sm">
                  {liens.filter(([a, b]) => a === noeudSelectionne.id || b === noeudSelectionne.id).length}{' '}
                  dépendance(s)
                </Badge>
                <IconButton
                  label="Retirer le composant"
                  size="sm"
                  variant="ghost"
                  onClick={() => supprimer(noeudSelectionne.id)}
                >
                  <Trash2 size={13} className="text-err" />
                </IconButton>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Input defaultValue={noeudSelectionne.nom} aria-label="Nom du composant" />
              <Input defaultValue="1" suffix="vCPU" aria-label="vCPU" />
              <Input defaultValue="1024" suffix="Mo" aria-label="Mémoire" />
            </div>
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-g-500">
          <span className="flex items-center gap-1.5">
            <Link2 size={12} /> {liens.length} dépendances déclarées
          </span>
          <span>{noeuds.length} composants dans la composition</span>
        </div>
      </div>
    </div>
  )
}

// ─── Copilote ─────────────────────────────────────────────────────────

/** Copilote en langage naturel avec suggestions contextuelles (§5.5). */
export function Copilote({ className }: { className?: string }) {
  const [question, setQuestion] = useState('')
  const [echanges, setEchanges] = useState<Array<{ q: string; r: string }>>([])

  const repondre = (q: string) => {
    const cle = Object.keys(REPONSES_COPILOTE).find(
      (k) => k.toLowerCase() === q.trim().toLowerCase(),
    )
    const r =
      (cle && REPONSES_COPILOTE[cle]) ??
      "Je n'ai pas de réponse préenregistrée pour cette question dans cette maquette. Les questions suggérées ci-dessous illustrent le fonctionnement du copilote : il croise l'état de vos environnements, vos journaux de déploiement et vos métriques pour produire une réponse étayée."
    setEchanges((p) => [...p, { q: q.trim(), r }])
    setQuestion('')
  }

  const suggestionsRestantes = useMemo(
    () => SUGGESTIONS_COPILOTE.filter((s) => !echanges.some((e) => e.q === s)),
    [echanges],
  )

  return (
    <Card className={className}>
      <CardHeader
        titre={
          <span className="flex items-center gap-2">
            <Sparkles size={15} className="text-p-700" />
            Copilote
          </span>
        }
        sousTitre="Généré par IA · contrôlé par l’expert. Les actions proposées restent soumises à votre validation."
      />

      {echanges.length > 0 && (
        <div className="mb-3.5 space-y-3">
          {echanges.map((e, i) => (
            <div key={i} className="space-y-1.5">
              <p className="rounded-[8px] bg-p-050 px-3 py-2 text-[12.5px] font-semibold text-p-700">
                {e.q}
              </p>
              <p className="px-3 text-[12.5px] leading-relaxed text-g-700">{e.r}</p>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(ev) => {
          ev.preventDefault()
          if (question.trim()) repondre(question)
        }}
        className="flex items-center gap-2"
      >
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Posez une question sur vos environnements…"
          className="flex-1"
        />
        <Button type="submit" size="md" iconBefore={<Send size={13} />} disabled={!question.trim()}>
          Demander
        </Button>
      </form>

      {suggestionsRestantes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {suggestionsRestantes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => repondre(s)}
              className="rounded-full border border-g-300 px-2.5 py-1 text-[11.5px] text-g-700 transition-colors hover:border-p-400 hover:bg-p-050 hover:text-p-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
