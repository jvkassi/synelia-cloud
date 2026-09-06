/**
 * Schémas — univers « IA & Agents » (MVP passerelle LiteLLM/OpenRouter, puis
 * exécution réelle de flux d'orchestration).
 *
 * Le catalogue de modèles, les agents (CRUD + invocation) et désormais les flux
 * d'orchestration (CRUD + exécution + reprise humaine) sont couverts. Bases de
 * connaissances, outils, canaux, clés, règles de routage, garde-fous, points
 * d'inférence dédiée et consommation détaillée restent hors de cette passe.
 */

import { booleen, chaine, dictionnaire, entier, horodatage, liste, nombre, objet, ref, tableau } from './socle.mjs'

const FAMILLES_MODELE = ['texte', 'code', 'embedding', 'reranker', 'transcription', 'vision']
const HEBERGEMENTS_MODELE = ['souverain', 'externe']
const STATUTS_MODELE = ['disponible', 'apercu', 'degrade', 'retire']
const STATUTS_AGENT = ['brouillon', 'publie', 'suspendu']

// ─── Flux d'orchestration (FONC-02) ────────────────────────────────────
const TYPES_ETAPE = [
  'declencheur',
  'agent',
  'outil',
  'connaissance',
  'routeur',
  'boucle',
  'humain',
  'code',
  'reponse',
  'anonymisation',
  'habilitation',
  'transfert',
]
const STATUTS_FLUX = ['publie', 'brouillon', 'suspendu']
const TYPES_DECLENCHEUR_FLUX = ['message', 'planifie', 'webhook', 'fichier', 'evenement']
const MODES_ROUTAGE = ['premiere', 'toutes']
const PORTEES_VARIABLE = ['environnement', 'conversation', 'systeme']

const declencheurFlux = () =>
  objet(
    { type: liste(TYPES_DECLENCHEUR_FLUX), libelle: chaine(), detail: chaine() },
    ['type', 'libelle', 'detail'],
  )

const ia = {
  ModeleIA: objet(
    {
      id: chaine(),
      slug: chaine('Identifiant appelé côté passerelle — le vrai modèle OpenRouter pour les modèles invocables.'),
      nom: chaine(),
      editeur: chaine(),
      famille: liste(FAMILLES_MODELE),
      hebergement: liste(HEBERGEMENTS_MODELE),
      residence: chaine(),
      site: chaine(),
      parametres: chaine(),
      licence: chaine(),
      contexteJetons: entier(),
      prixEntree: nombre('Prix pour un million de jetons en entrée, en FCFA.'),
      prixSortie: nombre('Prix pour un million de jetons en sortie, en FCFA.'),
      unite: liste(['jeton', 'minute']),
      latenceP50Ms: entier(),
      debitJetonsSec: entier(),
      statut: liste(STATUTS_MODELE),
      usages: tableau(chaine()),
      description: chaine(),
      invocable: booleen(
        'Vrai si ce modèle est réellement appelable via la passerelle LiteLLM ; sinon `invoquer` renvoie 422.',
      ),
    },
    ['id', 'slug', 'nom', 'editeur', 'famille', 'hebergement', 'residence', 'licence', 'statut', 'invocable'],
  ),

  ModeleIACreation: objet(
    {
      slug: chaine(),
      nom: chaine(),
      editeur: chaine(),
      famille: liste(FAMILLES_MODELE),
      hebergement: liste(HEBERGEMENTS_MODELE),
      residence: chaine(),
      licence: chaine(),
      contexteJetons: entier(),
      prixEntree: nombre(),
      prixSortie: nombre(),
      unite: liste(['jeton', 'minute']),
      statut: liste(STATUTS_MODELE),
      usages: tableau(chaine()),
      description: chaine(),
      invocable: booleen(),
    },
    ['slug', 'nom', 'editeur', 'famille', 'hebergement', 'residence', 'licence'],
  ),

  AgentIA: objet(
    {
      id: chaine(),
      nom: chaine(),
      consigne: chaine('Consigne système envoyée au modèle avant le message de l’appelant.'),
      espaceId: chaine(),
      modele: chaine('Slug du modèle IA utilisé — référence `ModeleIA.slug`.'),
      temperature: nombre(),
      topP: nombre(),
      jetonsMax: entier(),
      statut: liste(STATUTS_AGENT),
      createdAt: horodatage(),
    },
    ['id', 'nom', 'consigne', 'modele', 'temperature', 'topP', 'jetonsMax', 'statut', 'createdAt'],
  ),

  AgentIACreation: objet(
    {
      nom: chaine(),
      consigne: chaine(),
      espaceId: chaine(),
      modele: chaine(),
      temperature: nombre(undefined, { default: 0.7 }),
      topP: nombre(undefined, { default: 1 }),
      jetonsMax: entier(undefined, { default: 1024 }),
    },
    ['nom', 'consigne', 'modele'],
  ),

  AgentIAModification: objet({
    nom: chaine(),
    consigne: chaine(),
    modele: chaine(),
    temperature: nombre(),
    topP: nombre(),
    jetonsMax: entier(),
    statut: liste(STATUTS_AGENT),
  }),

  AgentInvocationRequest: objet(
    {
      message: chaine('Message de l’appelant — un seul tour, pas de mémoire de conversation dans ce MVP.'),
      conversationId: chaine('Réservé pour un usage futur ; ignoré aujourd’hui.'),
    },
    ['message'],
  ),

  AgentInvocationResponse: objet(
    {
      reponse: chaine(),
      jetonsEntree: entier(),
      jetonsSortie: entier(),
      coutFcfa: nombre(),
      latenceMs: entier(),
    },
    ['reponse', 'jetonsEntree', 'jetonsSortie', 'coutFcfa', 'latenceMs'],
  ),

  VariableFlux: objet(
    {
      cle: chaine(),
      portee: liste(PORTEES_VARIABLE),
      valeur: chaine(),
      secret: booleen(),
      description: chaine(),
    },
    ['cle', 'portee', 'valeur', 'description'],
  ),

  BrancheFlux: objet(
    {
      id: chaine(),
      nom: chaine(),
      condition: chaine('Évaluée en « premier mot-clé de la condition trouvé dans les variables ou la dernière sortie » — pas un langage d’expression complet.'),
      partPct: nombre(),
      parDefaut: booleen('La branche de repli reçoit ce qu’aucune condition n’a retenu.'),
      etapes: tableau(ref('EtapeFlux')),
    },
    ['id', 'nom', 'condition', 'partPct', 'etapes'],
  ),

  EtapeFlux: objet(
    {
      id: chaine(),
      type: liste(TYPES_ETAPE),
      nom: chaine(),
      source: chaine(),
      detail: chaine(),
      agentId: chaine(),
      outilId: chaine(),
      condition: chaine(),
      verrouillee: booleen(),
      executions24h: entier(),
      latenceMs: entier(),
      coutPourMille: nombre(),
      tauxErreurPct: nombre(),
      reprise: objet({ tentatives: entier(), delaiS: entier() }, ['tentatives', 'delaiS']),
      branches: tableau(ref('BrancheFlux')),
      modeRoutage: liste(MODES_ROUTAGE),
      corps: tableau(ref('EtapeFlux')),
      surItems: chaine(),
      maxIterations: entier(),
    },
    ['id', 'type', 'nom', 'source', 'detail', 'executions24h', 'latenceMs', 'coutPourMille', 'tauxErreurPct'],
  ),

  FluxOrchestration: objet(
    {
      id: chaine(),
      nom: chaine(),
      description: chaine(),
      espaceId: chaine(),
      statut: liste(STATUTS_FLUX),
      declencheur: declencheurFlux(),
      etapes: tableau(ref('EtapeFlux')),
      variables: tableau(ref('VariableFlux')),
      executions7j: entier(),
      dureeMedianeS: entier(),
      tauxSuccesPct: nombre(),
      coutParExecution: nombre(),
      memoirePartagee: booleen(),
      version: chaine(),
    },
    ['id', 'nom', 'description', 'espaceId', 'statut', 'declencheur', 'etapes', 'variables', 'memoirePartagee', 'version'],
  ),

  FluxOrchestrationCreation: objet(
    {
      nom: chaine(),
      description: chaine(),
      espaceId: chaine(),
      declencheur: declencheurFlux(),
      etapes: tableau(ref('EtapeFlux')),
      variables: tableau(ref('VariableFlux')),
      memoirePartagee: booleen(undefined, { default: false }),
    },
    ['nom', 'declencheur'],
  ),

  FluxOrchestrationModification: objet({
    nom: chaine(),
    description: chaine(),
    statut: liste(STATUTS_FLUX),
    declencheur: declencheurFlux(),
    etapes: tableau(ref('EtapeFlux')),
    variables: tableau(ref('VariableFlux')),
    memoirePartagee: booleen(),
  }),

  FluxExecutionRequest: objet(
    {
      entree: chaine('Message ou charge utile qui déclenche le flux — ce que le déclencheur aurait reçu.'),
      variables: dictionnaire({}, 'Valeurs de variables à surcharger pour cette exécution seulement (clé → valeur).'),
    },
    ['entree'],
  ),

  FluxRepriseRequest: objet(
    {
      decision: liste(['approuve', 'rejete']),
      commentaire: chaine('Motif ou précision laissé par la personne qui valide.'),
    },
    ['decision'],
  ),
}

export const schemasIa = { ...ia }
