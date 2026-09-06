/**
 * Chemins — univers « IA & Agents ».
 *
 * Une passerelle (LiteLLM devant OpenRouter), un catalogue de modèles, des
 * agents qu'on invoque en un aller-retour, et des flux d'orchestration qu'on
 * exécute réellement (moteur natif Python, pas de service Mastra séparé pour
 * l'instant). Bases de connaissances, outils, canaux, clés, routage,
 * garde-fous, points d'inférence dédiée et consommation détaillée restent hors
 * de cette passe.
 */

import { action, chemin, crud, fusion, op, ref } from './socle.mjs'

const T_MODELES = 'IA — Modèles'
const T_AGENTS = 'IA — Agents'
const T_FLUX = 'IA — Orchestration'

const idModele = chemin('modeleId', 'Identifiant du modèle IA.', 'm-llama-70b')
const idAgent = chemin('agentId', 'Identifiant de l’agent.', 'agent-support')
const idFlux = chemin('fluxId', 'Identifiant du flux d’orchestration.', 'fx-reclamation')
const idExecution = chemin('travailId', 'Identifiant du travail — l’exécution du flux.', 'trv-01')

const modeles = crud({
  tag: T_MODELES,
  base: '/ia/modeles',
  idParam: idModele,
  nomSingulier: 'ModeleIA',
  nomPluriel: 'ModelesIA',
  libelle: 'un modèle IA',
  libellePluriel: 'les modèles IA',
  schema: 'ModeleIA',
  creation: 'ModeleIACreation',
  sansModification: true,
  sansSuppression: true,
  rbacLecture: 'org.dashboard.view',
})

const agents = fusion(
  crud({
    tag: T_AGENTS,
    base: '/ia/agents',
    idParam: idAgent,
    nomSingulier: 'AgentIA',
    nomPluriel: 'AgentsIA',
    libelle: 'un agent',
    libellePluriel: 'les agents',
    schema: 'AgentIA',
    creation: 'AgentIACreation',
    modification: 'AgentIAModification',
    rbacLecture: 'org.dashboard.view',
    rbacEcriture: 'ia.agent.write',
  }),
  {
    '/ia/agents/{agentId}/invoquer': {
      post: op({
        tag: T_AGENTS,
        id: 'invoquerAgent',
        resume: 'Invoquer un agent',
        detail:
          'Un aller-retour : la consigne de l’agent et le message de l’appelant partent vers le ' +
          'modèle configuré via la passerelle LiteLLM. Pas de mémoire de conversation ni ' +
          'd’anonymisation dans ce MVP. Un agent dont le modèle n’est pas invocable sur cette ' +
          'passerelle renvoie 422, jamais une réponse inventée.',
        params: [idAgent],
        corps: ref('AgentInvocationRequest'),
        ok: ref('AgentInvocationResponse'),
        erreurs: [424],
      }),
    },
  },
)

const flux = fusion(
  crud({
    tag: T_FLUX,
    base: '/ia/flux',
    idParam: idFlux,
    nomSingulier: 'FluxOrchestration',
    nomPluriel: 'FluxOrchestrations',
    libelle: 'un flux d’orchestration',
    libellePluriel: 'les flux d’orchestration',
    schema: 'FluxOrchestration',
    creation: 'FluxOrchestrationCreation',
    modification: 'FluxOrchestrationModification',
    rbacLecture: 'org.dashboard.view',
    rbacEcriture: 'ia.flow.write',
  }),
  action({
    tag: T_FLUX,
    chemin: `/ia/flux/{${idFlux.name}}/executer`,
    id: 'executerFlux',
    resume: 'Exécuter un flux',
    detail:
      'Démarre une exécution réelle du flux — moteur natif Python, pas un simulateur : les étapes ' +
      '`agent` appellent réellement la passerelle LiteLLM, les étapes `connaissance` la recherche ' +
      'documentaire réelle. Asynchrone comme toute opération longue : renvoie un `TravailProvisioning` ' +
      'à interroger via `GET /travaux/{id}`. Une étape `humain` en attente laisse le travail `running` ' +
      'avec un message explicite sur la tâche concernée, à débloquer via `reprendreExecutionFlux`.',
    params: [idFlux],
    corps: ref('FluxExecutionRequest'),
    corpsRequis: true,
    erreurs: [409, 424],
  }),
  action({
    tag: T_FLUX,
    chemin: `/ia/flux/{${idFlux.name}}/executions/{${idExecution.name}}/reprendre`,
    id: 'reprendreExecutionFlux',
    resume: 'Reprendre un flux en attente d’une validation humaine',
    detail:
      'Une étape `humain` a mis le travail en pause : ce point d’entrée transmet la décision et reprend ' +
      'l’exécution à l’étape suivante. Un travail qui n’est pas en attente d’une validation humaine ' +
      'renvoie 409.',
    params: [idFlux, idExecution],
    corps: ref('FluxRepriseRequest'),
    corpsRequis: true,
    rbac: 'ia.flow.write',
    erreurs: [409, 424],
  }),
)

export const cheminsIa = fusion(modeles, agents, flux)
