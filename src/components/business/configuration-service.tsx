'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, Lock, Plus, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChampConfig, ConfigurationService, EffetChamp } from '@/lib/configurations'
import { compteReglages } from '@/lib/configurations'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { Input, Select, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout } from '@/components/composition/card'
import { Tooltip } from '@/components/ui/overlay'
import { BoutonAction } from '@/components/app/actions'

const LIBELLE_EFFET: Record<EffetChamp, string> = {
  immediat: 'Effet immédiat',
  redemarrage: 'Redémarre le service',
  prochaine_connexion: 'À la prochaine connexion des utilisateurs',
  fenetre_maintenance: 'Appliqué en fenêtre de maintenance',
}

type Valeurs = Record<string, unknown>

/**
 * Onglet « Paramètres spécifiques » d'un service managé (§6.6).
 *
 * Le formulaire est piloté par le fichier de configuration du service : c'est
 * lui qui décide des sections, des champs et de leur aide. Rien n'est deviné
 * depuis les données, sinon l'écran afficherait pour un ERP les questions d'un
 * Drive — ce qui n'a aucun sens.
 */
export function ConfigurationServicePanel({
  config,
  valeursAppliquees,
  autorise,
  messageRefus,
}: {
  config: ConfigurationService
  /**
   * Valeurs réellement en vigueur sur l'instance, qui écrasent les défauts du
   * fichier. Le fichier décrit le schéma, l'instance porte l'état.
   */
  valeursAppliquees?: Record<string, unknown>
  autorise: boolean
  messageRefus: string
}) {
  const initiales = useMemo(
    () => valeursInitiales(config, valeursAppliquees),
    [config, valeursAppliquees],
  )
  const [valeurs, setValeurs] = useState<Valeurs>(initiales)

  const modifies = useMemo(
    () =>
      Object.keys(initiales).filter(
        (cle) => JSON.stringify(valeurs[cle]) !== JSON.stringify(initiales[cle]),
      ),
    [valeurs, initiales],
  )

  const definitions = useMemo(
    () => new Map(config.sections.flatMap((s) => s.champs).map((c) => [c.cle, c])),
    [config],
  )

  const set = (cle: string, valeur: unknown) => setValeurs((v) => ({ ...v, [cle]: valeur }))

  return (
    <div className="space-y-4">
      <Callout ton="violet" titre="Des politiques, jamais du contenu">
        Ces {compteReglages(config)} réglages sont propres à {config.solution}. {config.intro}
      </Callout>

      {config.sections.map((section) => (
        <Card key={section.titre}>
          <CardHeader titre={section.titre} sousTitre={section.phrase} />
          <div className="divide-y divide-g-100">
            {section.champs.map((champ) => (
              <LigneChamp
                key={champ.cle}
                champ={champ}
                valeur={valeurs[champ.cle]}
                onChange={(v) => set(champ.cle, v)}
                autorise={autorise}
                messageRefus={messageRefus}
                modifie={modifies.includes(champ.cle)}
              />
            ))}
          </div>
        </Card>
      ))}

      <Card>
        <CardHeader
          titre="Ce qui ne se règle pas ici"
          sousTitre="Et où cela se règle — pour éviter de chercher longtemps."
        />
        <ul className="space-y-2">
          {config.horsPerimetre.map((h) => (
            <li key={h.quoi} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[13px] font-semibold text-ink">{h.quoi}</span>
              <span className="text-[12px] text-g-500">→ {h.ou}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Barre de validation, collée en bas dès qu'il y a quelque chose à valider */}
      {modifies.length > 0 && (
        <div className="sticky bottom-0 z-10 rounded-[10px] border border-p-300 bg-white p-3 shadow-[0_-4px_16px_rgba(43,27,77,.1)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-ink">
                {modifies.length} réglage{modifies.length > 1 ? 's' : ''} modifié
                {modifies.length > 1 ? 's' : ''}
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-g-700">
                {resumeEffets(modifies, definitions)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setValeurs(initiales)}>
                Annuler
              </Button>
              <GatedAction autorise={autorise} message={messageRefus}>
                <Button size="sm" onClick={() => setValeurs(valeurs)}>
                  Appliquer les modifications
                </Button>
              </GatedAction>
            </div>
          </div>
          <ul className="mt-2.5 flex flex-wrap gap-1.5 border-t border-g-100 pt-2.5">
            {modifies.map((cle) => (
              <Badge key={cle} tone="violet" size="sm">
                {definitions.get(cle)?.libelle ?? cle}
              </Badge>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Une ligne de réglage ─────────────────────────────────────────────

function LigneChamp({
  champ,
  valeur,
  onChange,
  autorise,
  messageRefus,
  modifie,
}: {
  champ: ChampConfig
  valeur: unknown
  onChange: (v: unknown) => void
  autorise: boolean
  messageRefus: string
  modifie: boolean
}) {
  const verrouille = Boolean(champ.verrouille)
  const modifiable = autorise && !verrouille

  return (
    <div className={cn('py-3.5 first:pt-0 last:pb-0', modifie && '-mx-2 rounded-[6px] bg-p-050 px-2')}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold text-ink">{champ.libelle}</span>
            {verrouille && (
              <Tooltip content={champ.verrouille!}>
                <span className="inline-flex items-center gap-1 rounded-[4px] bg-g-100 px-1.5 py-0.5 text-[11px] font-semibold text-g-700">
                  <Lock size={9} />
                  Verrouillé
                </span>
              </Tooltip>
            )}
            {champ.effet && champ.effet !== 'immediat' && (
              <Badge tone="info" size="sm">
                {LIBELLE_EFFET[champ.effet]}
              </Badge>
            )}
            {modifie && (
              <Badge tone="violet" size="sm">
                Modifié
              </Badge>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-g-700">{champ.aide}</p>
          {champ.impactFacture && (
            <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-relaxed text-warn">
              <Info size={11} className="mt-0.5 shrink-0" />
              {champ.impactFacture}
            </p>
          )}
          {champ.verrouille && (
            <p className="mt-1 text-[11px] leading-relaxed text-g-500">{champ.verrouille}</p>
          )}
        </div>

        <div className="w-full shrink-0 sm:w-64">
          <Controle
            champ={champ}
            valeur={valeur}
            onChange={onChange}
            modifiable={modifiable}
            messageRefus={messageRefus}
            autorise={autorise}
          />
        </div>
      </div>
    </div>
  )
}

function Controle({
  champ,
  valeur,
  onChange,
  modifiable,
  autorise,
  messageRefus,
}: {
  champ: ChampConfig
  valeur: unknown
  onChange: (v: unknown) => void
  modifiable: boolean
  autorise: boolean
  messageRefus: string
}) {
  switch (champ.type) {
    case 'bascule':
      return (
        <div className="sm:flex sm:justify-end">
          <GatedAction autorise={autorise} message={messageRefus}>
            <Switch
              checked={Boolean(valeur)}
              onChange={onChange}
              disabled={!modifiable}
              label={valeur ? 'Activé' : 'Désactivé'}
            />
          </GatedAction>
        </div>
      )

    case 'choix':
      return (
        <div>
          <Select
            value={String(valeur)}
            disabled={!modifiable}
            onChange={(e) => onChange(e.target.value)}
          >
            {champ.options.map((o) => (
              <option key={o.valeur} value={o.valeur}>
                {o.libelle}
              </option>
            ))}
          </Select>
          {champ.options.find((o) => o.valeur === valeur)?.detail && (
            <p className="mt-1 text-[11px] leading-snug text-g-500">
              {champ.options.find((o) => o.valeur === valeur)!.detail}
            </p>
          )}
        </div>
      )

    case 'nombre':
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={Number(valeur)}
            min={champ.min}
            max={champ.max}
            disabled={!modifiable}
            onChange={(e) => onChange(Number(e.target.value))}
            className="tnum"
          />
          {champ.unite && (
            <span className="shrink-0 text-[12px] font-semibold text-g-500">{champ.unite}</span>
          )}
        </div>
      )

    case 'texte':
      return (
        <Input
          value={String(valeur)}
          placeholder={champ.placeholder}
          disabled={!modifiable}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'liste':
      return (
        <ChampListe
          valeurs={(valeur as string[]) ?? []}
          placeholder={champ.placeholder}
          modifiable={modifiable}
          onChange={onChange}
        />
      )

    case 'etat':
      return <ChampEtat champ={champ} />
  }
}

function ChampListe({
  valeurs,
  placeholder,
  modifiable,
  onChange,
}: {
  valeurs: string[]
  placeholder?: string
  modifiable: boolean
  onChange: (v: string[]) => void
}) {
  const [saisie, setSaisie] = useState('')

  const ajouter = () => {
    const v = saisie.trim()
    if (!v || valeurs.includes(v)) return
    onChange([...valeurs, v])
    setSaisie('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {valeurs.length === 0 && (
          <span className="text-[12px] text-g-500">aucune valeur déclarée</span>
        )}
        {valeurs.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-[5px] border border-g-300 bg-g-050 px-1.5 py-0.5 text-[12px] font-medium text-ink"
          >
            <span className="font-mono">{v}</span>
            {modifiable && (
              <button
                type="button"
                aria-label={`Retirer ${v}`}
                onClick={() => onChange(valeurs.filter((x) => x !== v))}
                className="text-g-500 transition-colors hover:text-err"
              >
                <X size={10} />
              </button>
            )}
          </span>
        ))}
      </div>
      {modifiable && (
        <div className="mt-2 flex items-center gap-1.5">
          <Input
            value={saisie}
            placeholder={placeholder}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                ajouter()
              }
            }}
            className="h-8"
          />
          <Button size="sm" variant="ghost" onClick={ajouter} iconBefore={<Plus size={12} />}>
            Ajouter
          </Button>
        </div>
      )}
    </div>
  )
}

function ChampEtat({ champ }: { champ: Extract<ChampConfig, { type: 'etat' }> }) {
  const ton = champ.etat === 'ok' ? 'ok' : champ.etat === 'attention' ? 'warn' : 'err'
  const Icone = champ.etat === 'ok' ? CheckCircle2 : AlertTriangle

  return (
    <div>
      <div className="flex items-center justify-end gap-2">
        <Badge tone={ton} dot size="md">
          {champ.etat === 'ok' ? 'Conforme' : champ.etat === 'attention' ? 'À revoir' : 'En échec'}
        </Badge>
        <Icone
          size={15}
          className={champ.etat === 'ok' ? 'text-ok' : champ.etat === 'attention' ? 'text-warn' : 'text-err'}
        />
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-g-700">{champ.detail}</p>
      {champ.action && (
        <BoutonAction
          libelle={champ.action}
          className="mt-2"
          icone={<RefreshCw size={12} />}
          operation={{
            ton: 'info',
            titre: champ.action,
            detail: champ.detail,
          }}
        />
      )}
    </div>
  )
}

// ─── Utilitaires ──────────────────────────────────────────────────────

function valeursInitiales(
  config: ConfigurationService,
  appliquees?: Record<string, unknown>,
): Valeurs {
  const out: Valeurs = {}
  for (const section of config.sections) {
    for (const champ of section.champs) {
      if (champ.type === 'liste') out[champ.cle] = [...champ.valeurs]
      else if (champ.type === 'etat') out[champ.cle] = champ.etat
      else out[champ.cle] = champ.valeur

      // On n'applique une valeur d'instance que si son type correspond au
      // champ. Le jeu de données stocke parfois une phrase là où le champ
      // attend un code d'option : l'injecter mettrait la liste déroulante sur
      // une valeur inexistante, donc vide.
      const fournie = appliquees?.[champ.cle]
      if (fournie === undefined) continue
      const compatible =
        (champ.type === 'bascule' && typeof fournie === 'boolean') ||
        (champ.type === 'nombre' && typeof fournie === 'number') ||
        (champ.type === 'liste' && Array.isArray(fournie)) ||
        (champ.type === 'texte' && typeof fournie === 'string') ||
        (champ.type === 'choix' &&
          typeof fournie === 'string' &&
          champ.options.some((o) => o.valeur === fournie))
      if (compatible) out[champ.cle] = fournie
    }
  }
  return out
}

/** Résume ce que l'application des modifications va provoquer. */
function resumeEffets(cles: string[], definitions: Map<string, ChampConfig>): string {
  const effets = new Set(
    cles.map((c) => definitions.get(c)?.effet ?? 'immediat').filter(Boolean) as EffetChamp[],
  )
  if (effets.has('redemarrage')) {
    return 'Au moins un réglage redémarre le service : une courte interruption est à prévoir.'
  }
  if (effets.has('fenetre_maintenance')) {
    return 'Au moins un réglage ne s’applique qu’en fenêtre de maintenance, annoncée sept jours avant.'
  }
  if (effets.has('prochaine_connexion')) {
    return 'Les utilisateurs déjà connectés verront le changement à leur prochaine connexion.'
  }
  return 'Application immédiate, sans interruption de service.'
}
