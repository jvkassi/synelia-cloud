/**
 * Chemins — univers « IA & Agents » (MVP).
 *
 * Une passerelle (LiteLLM devant OpenRouter), un catalogue de modèles et des
 * agents qu'on invoque en un aller-retour. Pas de flux, de bases de
 * connaissances, d'outils, de canaux, de clés, de routage, de garde-fous, de
 * points d'inférence dédiée ni de consommation détaillée dans cette passe :
 * volontairement laissés pour une itération suivante.
 */

import { chemin, crud, fusion, op, ref } from './socle.mjs'

const T_MODELES = 'IA — Modèles'
const T_AGENTS = 'IA — Agents'

const idModele = chemin('modeleId', 'Identifiant du modèle IA.', 'm-llama-70b')
const idAgent = chemin('agentId', 'Identifiant de l’agent.', 'agent-support')

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

export const cheminsIa = fusion(modeles, agents)
