import type { ConfigurationService } from './types'

/**
 * Analytics web — Matomo. Tout le sujet est la mesure sans surveillance :
 * ce qu'on collecte, combien de temps, et sous quel consentement.
 */
export const CONFIG_ANALYTICS_WEB: ConfigurationService = {
  slug: 'analytics-web',
  solution: 'Matomo',
  intro:
    'Le portail règle ce qui est collecté, comment les visiteurs sont anonymisés et combien de temps les données sont gardées. Les rapports se consultent dans Matomo.',
  horsPerimetre: [
    { quoi: 'Consulter les rapports de fréquentation', ou: 'dans Matomo, via le bouton Ouvrir' },
    { quoi: 'Créer un objectif ou un segment', ou: 'dans Matomo' },
  ],
  sections: [
    {
      titre: 'Collecte et consentement',
      phrase:
        'Mesurer sans cookie évite la bannière de consentement, au prix d’une précision moindre sur le visiteur unique.',
      champs: [
        {
          cle: 'modeSuivi',
          type: 'choix',
          libelle: 'Mode de suivi',
          aide: 'Le suivi sans cookie est exempté de consentement dans la plupart des cadres, y compris ivoirien.',
          valeur: 'sans_cookie',
          options: [
            { valeur: 'sans_cookie', libelle: 'Sans cookie', detail: 'Aucune bannière requise' },
            { valeur: 'cookie_apres_consentement', libelle: 'Cookie après consentement' },
            { valeur: 'cookie', libelle: 'Cookie systématique', detail: 'Bannière obligatoire' },
          ],
        },
        {
          cle: 'anonymisationIp',
          type: 'choix',
          libelle: 'Anonymisation des adresses IP',
          aide: 'Masquer deux octets suffit à conserver le pays et la ville tout en cassant l’identification.',
          valeur: 'deux_octets',
          options: [
            { valeur: 'aucune', libelle: 'Aucune' },
            { valeur: 'un_octet', libelle: 'Un octet masqué' },
            { valeur: 'deux_octets', libelle: 'Deux octets masqués', detail: 'Recommandé' },
            { valeur: 'complete', libelle: 'Adresse non conservée' },
          ],
        },
        {
          cle: 'respectDoNotTrack',
          type: 'bascule',
          libelle: 'Respecter le signal « ne pas me suivre »',
          aide: 'Les visiteurs qui ont exprimé ce refus dans leur navigateur ne sont pas comptés.',
          valeur: true,
        },
        {
          cle: 'exclusions',
          type: 'liste',
          libelle: 'Adresses exclues de la mesure',
          aide: 'Sans cela, la navigation de vos propres équipes gonfle les statistiques.',
          valeurs: ['102.176.20.0/24'],
          placeholder: 'plage CIDR',
        },
      ],
    },
    {
      titre: 'Sites mesurés',
      phrase: 'Chaque site déclaré consomme du quota d’événements.',
      champs: [
        {
          cle: 'sites',
          type: 'liste',
          libelle: 'Sites déclarés',
          aide: 'Un site non déclaré n’est pas mesuré, même si le marqueur est présent dans ses pages.',
          valeurs: ['www.dba.africa', 'boutique.dba.africa'],
          placeholder: 'domaine',
        },
        {
          cle: 'quotaEvenementsMois',
          type: 'nombre',
          libelle: 'Quota d’événements par mois',
          aide: 'Au-delà, la collecte est échantillonnée plutôt qu’interrompue.',
          valeur: 1000000,
          unite: 'événements',
          min: 10000,
          max: 50000000,
          impactFacture: 'Facturé par tranche de 500 000 événements au-delà du palier.',
        },
      ],
    },
    {
      titre: 'Conservation',
      phrase: 'Les données brutes de navigation vieillissent mal et pèsent lourd.',
      champs: [
        {
          cle: 'retentionBrutMois',
          type: 'nombre',
          libelle: 'Conservation des données brutes',
          aide: 'Les visites détaillées, visiteur par visiteur. C’est la partie sensible.',
          valeur: 6,
          unite: 'mois',
          min: 1,
          max: 36,
        },
        {
          cle: 'retentionAgregatMois',
          type: 'nombre',
          libelle: 'Conservation des agrégats',
          aide: 'Les totaux par jour, semaine et mois. Ils ne permettent plus d’identifier personne et peuvent être gardés longtemps.',
          valeur: 60,
          unite: 'mois',
          min: 12,
          max: 240,
        },
        {
          cle: 'suppressionSurDemande',
          type: 'bascule',
          libelle: 'Traiter les demandes d’effacement',
          aide: 'Permet de supprimer les données d’un visiteur identifié qui en fait la demande.',
          valeur: true,
        },
      ],
    },
  ],
}
