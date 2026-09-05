/**
 * Schémas — univers « IA & Agents » (MVP passerelle LiteLLM/OpenRouter).
 *
 * Volontairement réduit : seuls le catalogue de modèles et les agents (CRUD +
 * invocation) sont couverts. Pas de flux, bases de connaissances, outils,
 * canaux, clés, règles de routage, garde-fous, points d'inférence dédiée ni
 * consommation détaillée dans cette passe.
 */

import { booleen, chaine, entier, horodatage, liste, nombre, objet, tableau } from './socle.mjs'

const FAMILLES_MODELE = ['texte', 'code', 'embedding', 'reranker', 'transcription', 'vision']
const HEBERGEMENTS_MODELE = ['souverain', 'externe']
const STATUTS_MODELE = ['disponible', 'apercu', 'degrade', 'retire']
const STATUTS_AGENT = ['brouillon', 'publie', 'suspendu']

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
}

export const schemasIa = { ...ia }
