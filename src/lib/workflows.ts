import { WORKFLOWS } from './mock/workflows'
import type { DefinitionWorkflow, ProvisioningJob } from './types'

/**
 * Workflows — la part partagée entre le catalogue et l'atelier.
 *
 * L'atelier sait déjà lancer un job et faire avancer ses étapes. Ce qui
 * manquait tient en trois points, et c'est ce que ce module apporte :
 *
 * 1. Le texte des étapes vivait au site d'appel, recopié d'un écran à l'autre.
 *    Il vient désormais du catalogue, par identifiant.
 * 2. Chaque étape durait la cadence d'écran, si bien que le centre de tâches
 *    annonçait « 1 s » pour copier une image système. Les durées annoncées sont
 *    maintenant celles du catalogue, et le temps d'écran se répartit entre les
 *    étapes à leur prorata : une étape longue paraît longue.
 * 3. Aucune opération lancée depuis un écran n'échouait jamais. Deux workflows
 *    échouent volontairement au premier essai — sans quoi le diagnostic et le
 *    rollback ne se voient que sur les jobs figés du jeu de données.
 */

/** Temps d'écran d'un workflow, quelle que soit la somme des durées annoncées. */
export const DUREE_ECRAN_MS = 11_000

const PAR_ID = new Map(WORKFLOWS.map((w) => [w.id, w]))

export function workflowById(id: string): DefinitionWorkflow | undefined {
  return PAR_ID.get(id)
}

export function libelleWorkflow(def: DefinitionWorkflow, cible: string): string {
  return def.libelle.replace('{cible}', cible)
}

export interface EtapePlanifiee {
  nom: string
  /** Durée annoncée à l'utilisateur, en secondes. */
  dureeS: number
  message?: string
  /** Instant d'écran, en millisecondes depuis le lancement, où l'étape s'achève. */
  aMs: number
}

/**
 * Étapes à jouer et instant d'achèvement de chacune. `depuis` permet de
 * reprendre une séquence à l'étape échouée : les précédentes sont acquises et
 * ne sont pas rejouées.
 */
export function planifier(
  def: DefinitionWorkflow,
  options: { depuis?: number; jusqua?: number } = {},
): EtapePlanifiee[] {
  const depuis = Math.max(0, Math.min(options.depuis ?? 0, def.etapes.length - 1))
  const jusqua = Math.min(options.jusqua ?? def.etapes.length, def.etapes.length)
  const jouees = def.etapes.slice(depuis, jusqua)
  const total = jouees.reduce((a, e) => a + e.dureeS, 0) || 1

  let curseur = 0
  return jouees.map((e, i) => {
    curseur += (e.dureeS / total) * DUREE_ECRAN_MS
    return {
      ...e,
      // La dernière borne est posée exactement : l'accumulation de flottants la
      // ferait dépasser le temps d'écran et la dernière étape ne s'achèverait pas.
      aMs: Math.round(i === jouees.length - 1 ? DUREE_ECRAN_MS : curseur),
    }
  })
}

/** Rang, à partir de 1, de l'étape qui échoue — ou 0 si le workflow aboutit. */
export function etapeEnEchec(def: DefinitionWorkflow, essai: number): number {
  return essai === 0 && def.echec ? def.echec.etape : 0
}

export const LIBELLE_STATUT_JOB: Record<ProvisioningJob['statut'], string> = {
  queued: 'En file',
  running: 'En cours',
  done: 'Terminé',
  failed: 'Échec',
  rolled_back: 'Annulé',
}

export const TON_STATUT_JOB: Record<ProvisioningJob['statut'], 'ok' | 'err' | 'warn' | 'info'> = {
  queued: 'info',
  running: 'info',
  done: 'ok',
  failed: 'err',
  rolled_back: 'warn',
}

/** Progression 0–1, pour les barres compactes. */
export function progressionJob(job: ProvisioningJob): number {
  if (job.taches.length === 0) return 0
  return job.taches.filter((t) => t.statut === 'ok').length / job.taches.length
}
