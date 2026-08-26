import { MAINTENANT } from './format'
import { workflowById } from './mock/workflows'
import type { DefinitionWorkflow, ProvisioningJob, TacheSimulee } from './types'
import { correlationId } from './utils'

/**
 * Moteur des workflows simulés.
 *
 * Le job affiché est *dérivé* du temps écoulé, jamais stocké : une seule
 * variable avance (`ecoule`), tout le reste est recalculé. Cela garantit un
 * rendu déterministe — aucun `Math.random()`, aucune date réelle — et rend la
 * reprise triviale : remettre `ecoule` à zéro suffit.
 */

/** Battement de l'horloge simulée. */
export const CADENCE_MS = 400

/** Temps d'écran d'un workflow, quelle que soit sa durée annoncée. */
const DUREE_ECRAN_MS = 11_000

/** Le job reste « en file » ce court instant : la file existe, il faut la voir. */
const ATTENTE_FILE_MS = 600

/** Temps d'écran total d'une tâche, file d'attente comprise. */
export const DUREE_TOTALE_MS = ATTENTE_FILE_MS + DUREE_ECRAN_MS

export function libelleWorkflow(def: DefinitionWorkflow, cible: string): string {
  return def.libelle.replace('{cible}', cible)
}

/**
 * Job tel qu'il doit s'afficher à l'instant `tache.ecoule`. Le temps d'écran est
 * réparti entre les étapes au prorata de leurs durées annoncées : une étape
 * longue paraît longue.
 */
export function jobDepuisTache(tache: TacheSimulee): ProvisioningJob {
  const def = workflowById(tache.workflowId)
  if (!def) {
    // Ne devrait pas arriver : un identifiant inconnu vaut mieux qu'un écran blanc.
    return {
      id: tache.id,
      orgId: 'org-dba',
      type: tache.workflowId,
      label: tache.cible || tache.workflowId,
      statut: 'failed',
      startedAt: MAINTENANT,
      taches: [],
      erreur: {
        message: `Workflow « ${tache.workflowId} » introuvable dans le catalogue.`,
        correlationId: correlationId(tache.id),
      },
    }
  }

  const total = def.etapes.reduce((a, e) => a + e.dureeS, 0)
  const echec = tache.essai === 0 ? def.echec : undefined
  // Une étape qui échoue interrompt la séquence, et une reprise repart de
  // l'étape échouée : le temps d'écran ne se répartit donc que sur les étapes
  // réellement jouées à cet essai, sinon l'échec attendrait la fin du job et la
  // reprise rejouerait un transfert déjà terminé.
  const depuis = Math.min(tache.depuis ?? 0, def.etapes.length - 1)
  const fin = echec ? echec.etape : def.etapes.length
  const jouees = def.etapes.slice(depuis, fin)
  const totalJoue = jouees.reduce((a, e) => a + e.dureeS, 0)

  const avance = Math.max(0, tache.ecoule - ATTENTE_FILE_MS)
  const enFile = tache.ecoule < ATTENTE_FILE_MS

  let curseur = 0
  const bornes = jouees.map((e, i) => {
    curseur += (e.dureeS / totalJoue) * DUREE_ECRAN_MS
    // La dernière borne est posée exactement : l'accumulation de flottants la
    // ferait dépasser le temps d'écran, et le job resterait « en cours » après
    // l'arrêt de l'horloge.
    return i === jouees.length - 1 ? DUREE_ECRAN_MS : curseur
  })
  let rang = jouees.length
  for (let i = 0; i < bornes.length; i += 1) {
    if (avance < bornes[i]) {
      rang = i
      break
    }
  }

  const termine = rang >= jouees.length
  const indexCourant = depuis + rang
  const echoue = termine && echec !== undefined

  const taches = def.etapes.map((e, i) => {
    const fait = i < indexCourant
    const enCours = i === indexCourant && !termine
    const ratee = echoue && i === echec.etape - 1

    return {
      ordre: i + 1,
      nom: e.nom,
      statut: ratee ? ('failed' as const) : fait ? ('ok' as const) : enCours ? ('running' as const) : ('pending' as const),
      dureeS: fait || ratee ? e.dureeS : undefined,
      message: enCours ? e.message : ratee ? 'Interrompue — voir le diagnostic' : undefined,
    }
  })

  const statut = enFile
    ? ('queued' as const)
    : echoue
      ? echec.rollback
        ? ('rolled_back' as const)
        : ('failed' as const)
      : termine
        ? ('done' as const)
        : ('running' as const)

  return {
    id: tache.id,
    orgId: 'org-dba',
    type: def.id,
    label: libelleWorkflow(def, tache.cible),
    statut,
    startedAt: MAINTENANT,
    dureeS: termine ? (echoue ? totalJoue : total) : undefined,
    taches,
    erreur: echoue
      ? {
          message: echec.message,
          correlationId: correlationId(`${def.id}-${tache.cible}`),
          suggestion: echec.suggestion,
        }
      : undefined,
  }
}

/** Une tâche est-elle encore en train de tourner ? */
export function tacheActive(tache: TacheSimulee): boolean {
  return tache.ecoule < DUREE_TOTALE_MS
}

/**
 * Espace auquel appartient un job de session. L'état est partagé entre les deux
 * espaces ; sans ce filtre, une création de machine s'afficherait dans le centre
 * de tâches du fournisseur.
 */
export function porteeDuJob(job: ProvisioningJob): 'client' | 'fournisseur' | undefined {
  return workflowById(job.type)?.portee
}

/** Progression 0–1, pour les barres compactes. */
export function progression(job: ProvisioningJob): number {
  if (job.taches.length === 0) return 0
  const faites = job.taches.filter((t) => t.statut === 'ok').length
  return faites / job.taches.length
}

export const LIBELLE_STATUT: Record<ProvisioningJob['statut'], string> = {
  queued: 'En file',
  running: 'En cours',
  done: 'Prêt',
  failed: 'Échec',
  rolled_back: 'Annulé / restauré',
}

export const TON_STATUT: Record<ProvisioningJob['statut'], 'ok' | 'err' | 'warn' | 'info'> = {
  queued: 'info',
  running: 'info',
  done: 'ok',
  failed: 'err',
  rolled_back: 'warn',
}
