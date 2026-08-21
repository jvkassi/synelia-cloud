'use client'

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { Field, Input, MonoTextarea, Select, Switch, Textarea } from '@/components/ui/field'
import { ConfirmDialog, Modal } from '@/components/ui/overlay'
import { useApp } from './contexte'
import { useAtelier, type SpecJob } from './atelier'

/**
 * Actions de la maquette — un seul chemin pour « ce bouton fait quelque chose ».
 *
 * Trois choses doivent arriver ensemble quand on agit sur une ressource :
 * le RBAC décide si l'action est possible (désactivée et nommée, jamais
 * masquée), l'état de l'atelier change, et l'utilisateur reçoit une trace —
 * notification, et job de provisionnement quand l'opération n'est pas
 * instantanée. Regroupé ici pour que chaque écran ne réinvente pas la séquence.
 */

export interface SpecOperation {
  /** Identifiant d'action RBAC. Absent = toujours autorisé. */
  action?: string
  titre: string
  detail?: string
  ton?: 'ok' | 'info' | 'warn' | 'err'
  /** Mutation immédiate de l'atelier. */
  effet?: () => void
  /** Job de provisionnement affiché dans le centre de tâches. */
  job?: Omit<SpecJob, 'alFin'>
  /** Mutation appliquée à la fin du job — bascule d'état, par exemple. */
  effetFinal?: () => void
}

export function useOperation() {
  const { pousser, autorise } = useApp()
  const { lancerJob } = useAtelier()

  const executer = useCallback(
    (spec: SpecOperation) => {
      if (spec.action && !autorise(spec.action)) return
      spec.effet?.()
      if (spec.job) lancerJob({ ...spec.job, alFin: spec.effetFinal })
      else spec.effetFinal?.()
      pousser({
        ton: spec.ton ?? 'ok',
        titre: spec.titre,
        detail:
          spec.detail ?? (spec.job ? 'Avancement suivi dans le centre de tâches.' : undefined),
      })
    },
    [autorise, lancerJob, pousser],
  )

  return executer
}

// ─── Bouton d'action ──────────────────────────────────────────────────

/**
 * Bouton qui exécute une opération : gabarit RBAC, confirmation éventuelle,
 * mutation, notification, job. `confirmation` demande la saisie du nom exact
 * de la ressource, comme l'exige toute action destructive.
 */
export function BoutonAction({
  operation,
  libelle,
  confirmation,
  variant = 'secondary',
  size = 'sm',
  icone,
  fullWidth,
  className,
  desactive,
  nomAccessible,
}: {
  operation: SpecOperation
  libelle: ReactNode
  confirmation?: { ressource: string; titre?: string; pertes: string[]; libelleAction?: string }
  variant?: ButtonVariant
  size?: ButtonSize
  icone?: ReactNode
  fullWidth?: boolean
  className?: string
  desactive?: boolean
  /** Obligatoire quand `libelle` n'est qu'une icône : sinon le bouton est muet. */
  nomAccessible?: string
}) {
  const { autorise, refus } = useApp()
  const executer = useOperation()
  const [ouvert, setOuvert] = useState(false)
  const permis = operation.action ? autorise(operation.action) : true

  return (
    <>
      <GatedAction autorise={permis} message={operation.action ? refus(operation.action) : ''}>
        <Button
          variant={variant}
          size={size}
          iconBefore={icone}
          fullWidth={fullWidth}
          className={className}
          disabled={desactive}
          aria-label={nomAccessible}
          title={nomAccessible}
          onClick={() => (confirmation ? setOuvert(true) : executer(operation))}
        >
          {libelle}
        </Button>
      </GatedAction>
      {confirmation && (
        <ConfirmDialog
          open={ouvert}
          onClose={() => setOuvert(false)}
          onConfirm={() => executer(operation)}
          titre={confirmation.titre ?? `Supprimer ${confirmation.ressource} ?`}
          ressource={confirmation.ressource}
          pertes={confirmation.pertes}
          libelleAction={confirmation.libelleAction}
        />
      )}
    </>
  )
}

// ─── Formulaire générique ─────────────────────────────────────────────

export type ValeurChamp = string | number | boolean

export interface ChampSpec {
  id: string
  label: string
  type?: 'texte' | 'nombre' | 'select' | 'switch' | 'zone' | 'mono'
  options?: Array<{ value: string; label: string }>
  hint?: string
  placeholder?: string
  suffixe?: string
  obligatoire?: boolean
  /** Un champ court occupe une demi-largeur sur écran large. */
  demi?: boolean
  min?: number
  max?: number
}

export type ValeursFormulaire = Record<string, ValeurChamp>

function valeursInitiales(champs: ChampSpec[], depart?: ValeursFormulaire): ValeursFormulaire {
  const out: ValeursFormulaire = {}
  for (const c of champs) {
    out[c.id] =
      depart?.[c.id] ??
      (c.type === 'switch' ? false : c.type === 'nombre' ? (c.min ?? 0) : (c.options?.[0]?.value ?? ''))
  }
  return out
}

/** Modale de saisie construite depuis une description de champs. */
export function ModaleFormulaire({
  ouvert,
  onFermer,
  titre,
  description,
  champs,
  valeursDepart,
  libelleValider = 'Enregistrer',
  taille = 'md',
  onValider,
  complement,
}: {
  ouvert: boolean
  onFermer: () => void
  titre: string
  description?: string
  champs: ChampSpec[]
  valeursDepart?: ValeursFormulaire
  libelleValider?: string
  taille?: 'sm' | 'md' | 'lg'
  onValider: (valeurs: ValeursFormulaire) => void
  /** Bloc libre affiché sous les champs — aperçu de coût, avertissement. */
  complement?: (valeurs: ValeursFormulaire) => ReactNode
}) {
  const depart = useMemo(() => valeursInitiales(champs, valeursDepart), [champs, valeursDepart])
  const [valeurs, setValeurs] = useState<ValeursFormulaire>(depart)
  const [cle, setCle] = useState(0)

  // Remonte les valeurs de départ quand la modale se rouvre sur une autre ressource.
  const signature = JSON.stringify(depart)
  const [signaturePrec, setSignaturePrec] = useState(signature)
  if (signature !== signaturePrec) {
    setSignaturePrec(signature)
    setValeurs(depart)
    setCle((c) => c + 1)
  }

  const poser = (id: string, v: ValeurChamp) => setValeurs((p) => ({ ...p, [id]: v }))

  const complet = champs.every(
    (c) => !c.obligatoire || String(valeurs[c.id] ?? '').trim().length > 0,
  )

  return (
    <Modal
      open={ouvert}
      onClose={onFermer}
      title={titre}
      description={description}
      size={taille}
      footer={
        <>
          <Button variant="ghost" onClick={onFermer}>
            Annuler
          </Button>
          <Button
            disabled={!complet}
            onClick={() => {
              onValider(valeurs)
              onFermer()
            }}
          >
            {libelleValider}
          </Button>
        </>
      }
    >
      <div key={cle} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {champs.map((c) => (
          <Field
            key={c.id}
            label={c.label}
            hint={c.hint}
            required={c.obligatoire}
            className={c.demi ? 'sm:col-span-1' : 'sm:col-span-2'}
          >
            {c.type === 'select' ? (
              <Select value={String(valeurs[c.id] ?? '')} onChange={(e) => poser(c.id, e.target.value)}>
                {(c.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            ) : c.type === 'switch' ? (
              <Switch checked={Boolean(valeurs[c.id])} onChange={(v) => poser(c.id, v)} label={c.placeholder} />
            ) : c.type === 'zone' ? (
              <Textarea
                value={String(valeurs[c.id] ?? '')}
                placeholder={c.placeholder}
                onChange={(e) => poser(c.id, e.target.value)}
              />
            ) : c.type === 'mono' ? (
              <MonoTextarea
                value={String(valeurs[c.id] ?? '')}
                placeholder={c.placeholder}
                onChange={(e) => poser(c.id, e.target.value)}
              />
            ) : (
              <Input
                type={c.type === 'nombre' ? 'number' : 'text'}
                value={String(valeurs[c.id] ?? '')}
                placeholder={c.placeholder}
                suffix={c.suffixe}
                min={c.min}
                max={c.max}
                onChange={(e) =>
                  poser(c.id, c.type === 'nombre' ? Number(e.target.value) : e.target.value)
                }
              />
            )}
          </Field>
        ))}
        {complement && <div className="sm:col-span-2">{complement(valeurs)}</div>}
      </div>
    </Modal>
  )
}

/**
 * Bouton qui ouvre un formulaire puis exécute une opération construite à
 * partir des valeurs saisies. Couvre la création rapide et la modification.
 */
export function BoutonFormulaire({
  libelle,
  titre,
  description,
  champs,
  valeursDepart,
  action,
  libelleValider,
  taille,
  variant = 'secondary',
  size = 'sm',
  icone,
  fullWidth,
  className,
  operation,
  complement,
}: {
  libelle: ReactNode
  titre: string
  description?: string
  champs: ChampSpec[]
  valeursDepart?: ValeursFormulaire
  /** Identifiant RBAC : le bouton reste visible, désactivé et expliqué. */
  action?: string
  libelleValider?: string
  taille?: 'sm' | 'md' | 'lg'
  variant?: ButtonVariant
  size?: ButtonSize
  icone?: ReactNode
  fullWidth?: boolean
  className?: string
  operation: (valeurs: ValeursFormulaire) => SpecOperation
  complement?: (valeurs: ValeursFormulaire) => ReactNode
}) {
  const { autorise, refus } = useApp()
  const executer = useOperation()
  const [ouvert, setOuvert] = useState(false)
  const permis = action ? autorise(action) : true

  return (
    <>
      <GatedAction autorise={permis} message={action ? refus(action) : ''}>
        <Button
          variant={variant}
          size={size}
          iconBefore={icone}
          fullWidth={fullWidth}
          className={className}
          onClick={() => setOuvert(true)}
        >
          {libelle}
        </Button>
      </GatedAction>
      <ModaleFormulaire
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        titre={titre}
        description={description}
        champs={champs}
        valeursDepart={valeursDepart}
        libelleValider={libelleValider}
        taille={taille}
        complement={complement}
        onValider={(valeurs) => executer({ action, ...operation(valeurs) })}
      />
    </>
  )
}
