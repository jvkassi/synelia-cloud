import type { ConfigurationService } from './types'

/**
 * Automatisation — n8n. Un moteur d'automatisation exécute du code arbitraire
 * et détient les identifiants de tous les systèmes qu'il relie.
 */
export const CONFIG_AUTOMATISATION: ConfigurationService = {
  slug: 'automatisation',
  solution: 'n8n',
  intro:
    'Le portail règle ce que les scénarios ont le droit d’appeler, combien de temps leurs exécutions sont conservées et qui accède aux identifiants enregistrés. Les scénarios eux-mêmes se construisent dans n8n.',
  horsPerimetre: [
    { quoi: 'Créer ou modifier un scénario', ou: 'dans n8n, via le bouton Ouvrir' },
    { quoi: 'Rejouer une exécution', ou: 'dans n8n, historique des exécutions' },
  ],
  sections: [
    {
      titre: 'Sorties autorisées',
      phrase:
        'Un moteur d’automatisation qui peut appeler n’importe quelle adresse peut aussi exfiltrer n’importe quoi.',
      champs: [
        {
          cle: 'sortieReseau',
          type: 'choix',
          libelle: 'Appels sortants',
          aide: 'La liste blanche demande un peu d’administration et supprime la classe entière des exfiltrations discrètes.',
          valeur: 'liste_blanche',
          options: [
            { valeur: 'liste_blanche', libelle: 'Liste blanche de domaines', detail: 'Recommandé' },
            { valeur: 'tout', libelle: 'Tout Internet' },
            { valeur: 'interne', libelle: 'Réseau interne uniquement' },
          ],
        },
        {
          cle: 'domainesAutorises',
          type: 'liste',
          libelle: 'Domaines autorisés',
          aide: 'Appliqué à chaque appel HTTP sortant, y compris ceux d’un nœud de code.',
          valeurs: ['api.dba.africa', 'api.orange.ci', 'hooks.slack.com'],
          placeholder: 'domaine',
        },
        {
          cle: 'noeudCodeAutorise',
          type: 'bascule',
          libelle: 'Autoriser les nœuds de code',
          aide: 'Un nœud de code exécute du JavaScript arbitraire. Puissant, et impossible à auditer par une liste de domaines seule.',
          valeur: false,
        },
        {
          cle: 'authWebhooks',
          type: 'choix',
          libelle: 'Authentification des webhooks entrants',
          aide: 'Un webhook sans authentification est déclenchable par quiconque connaît son URL.',
          valeur: 'signature',
          options: [
            { valeur: 'aucune', libelle: 'Aucune' },
            { valeur: 'entete', libelle: 'En-tête secret' },
            { valeur: 'signature', libelle: 'Signature HMAC', detail: 'Recommandé' },
          ],
        },
      ],
    },
    {
      titre: 'Identifiants',
      phrase: 'Les identifiants enregistrés dans n8n ouvrent les portes de vos autres systèmes.',
      champs: [
        {
          cle: 'partageIdentifiants',
          type: 'choix',
          libelle: 'Partage des identifiants',
          aide: 'Un identifiant partagé largement finit utilisé dans un scénario que personne ne surveille.',
          valeur: 'proprietaire_et_admins',
          options: [
            { valeur: 'proprietaire', libelle: 'Propriétaire seulement' },
            { valeur: 'proprietaire_et_admins', libelle: 'Propriétaire et administrateurs' },
            { valeur: 'tous', libelle: 'Tous les utilisateurs' },
          ],
        },
        {
          cle: 'coffreExterne',
          type: 'bascule',
          libelle: 'Lire les secrets depuis le coffre',
          aide: 'Les identifiants sont lus à l’exécution depuis votre coffre de mots de passe, plutôt que recopiés dans n8n.',
          valeur: true,
        },
      ],
    },
    {
      titre: 'Exécutions',
      phrase:
        'Les exécutions conservent les données qui ont traversé le scénario : c’est utile au diagnostic et lourd de conséquences.',
      champs: [
        {
          cle: 'retentionExecutionsJours',
          type: 'nombre',
          libelle: 'Rétention des exécutions',
          aide: 'Une exécution conservée garde en clair les données transportées. Court est plus sûr.',
          valeur: 14,
          unite: 'jours',
          min: 1,
          max: 365,
        },
        {
          cle: 'donneesEnErreurSeulement',
          type: 'bascule',
          libelle: 'Ne conserver les données qu’en cas d’erreur',
          aide: 'Bon compromis : on garde ce qui sert à corriger, on jette le reste.',
          valeur: true,
        },
        {
          cle: 'concurrenceMax',
          type: 'nombre',
          libelle: 'Exécutions simultanées',
          aide: 'Au-delà, les déclenchements sont mis en file. Protège les systèmes appelés d’une rafale.',
          valeur: 5,
          unite: 'exécutions',
          min: 1,
          max: 50,
        },
        {
          cle: 'alerteEchec',
          type: 'bascule',
          libelle: 'Alerter à l’échec d’un scénario',
          aide: 'Un scénario en échec silencieux donne l’illusion que le travail se fait.',
          valeur: true,
        },
      ],
    },
  ],
}
