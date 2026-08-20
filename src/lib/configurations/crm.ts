import type { ConfigurationService } from './types'

/** CRM — EspoCRM. Le sujet ici est la donnée personnelle de prospection. */
export const CONFIG_CRM: ConfigurationService = {
  slug: 'crm',
  solution: 'EspoCRM',
  intro:
    'Le portail règle le pipeline, l’attribution des pistes, les limites d’envoi et le traitement du consentement. Les fiches et les affaires se travaillent dans EspoCRM.',
  horsPerimetre: [
    { quoi: 'Créer ou modifier une fiche, une affaire', ou: 'dans EspoCRM, via le bouton Ouvrir' },
    { quoi: 'Rédiger et envoyer une campagne', ou: 'dans EspoCRM, module Campagnes' },
  ],
  sections: [
    {
      titre: 'Pipeline commercial',
      phrase: 'Les étapes du cycle de vente, communes à toute l’équipe.',
      champs: [
        {
          cle: 'etapes',
          type: 'liste',
          libelle: 'Étapes du pipeline',
          aide: 'Renommer une étape conserve l’historique ; en supprimer une force à reclasser les affaires ouvertes.',
          valeurs: ['Qualification', 'Proposition', 'Négociation', 'Gagnée', 'Perdue'],
          placeholder: 'étape',
        },
        {
          cle: 'attributionPistes',
          type: 'choix',
          libelle: 'Attribution des nouvelles pistes',
          aide: 'Une piste non attribuée n’est traitée par personne. Le tour de rôle évite l’oubli.',
          valeur: 'tour_de_role',
          options: [
            { valeur: 'manuelle', libelle: 'Manuelle' },
            { valeur: 'tour_de_role', libelle: 'Tour de rôle' },
            { valeur: 'territoire', libelle: 'Par territoire' },
          ],
        },
        {
          cle: 'delaiPremierContactHeures',
          type: 'nombre',
          libelle: 'Délai de premier contact',
          aide: 'Au-delà, la piste remonte en alerte au responsable commercial.',
          valeur: 24,
          unite: 'heures',
          min: 1,
          max: 168,
        },
        {
          cle: 'detectionDoublons',
          type: 'bascule',
          libelle: 'Détection des doublons',
          aide: 'Compare le courriel, le téléphone et la raison sociale avant création. Deux fiches pour un même client faussent tous les chiffres.',
          valeur: true,
        },
      ],
    },
    {
      titre: 'Prospection et consentement',
      phrase:
        'Envoyer sans consentement expose à une sanction et brûle la réputation d’expédition du domaine.',
      champs: [
        {
          cle: 'consentementObligatoire',
          type: 'bascule',
          libelle: 'Consentement obligatoire avant envoi',
          aide: 'Une fiche sans consentement daté est exclue de toute campagne, sans exception possible.',
          valeur: true,
        },
        {
          cle: 'limiteEnvoiJour',
          type: 'nombre',
          libelle: 'Limite d’envoi par jour',
          aide: 'Protège la réputation du domaine. Un envoi massif soudain est le signal le plus sûr pour être classé indésirable.',
          valeur: 2000,
          unite: 'messages',
          min: 100,
          max: 50000,
        },
        {
          cle: 'desabonnementUnClic',
          type: 'bascule',
          libelle: 'Désabonnement en un clic',
          aide: 'Exigé par les principaux fournisseurs de messagerie depuis 2024. Le lien est ajouté automatiquement.',
          valeur: true,
          verrouille: 'Imposé par la politique d’expédition Synelia.',
        },
        {
          cle: 'retentionPisteAns',
          type: 'nombre',
          libelle: 'Conservation des pistes non converties',
          aide: 'Au-delà, la fiche est anonymisée. Conserver indéfiniment une piste morte n’a aucune valeur commerciale et augmente le risque.',
          valeur: 3,
          unite: 'ans',
          min: 1,
          max: 10,
        },
      ],
    },
    {
      titre: 'Accès et portail',
      phrase: 'Qui voit quoi, à l’intérieur comme à l’extérieur.',
      champs: [
        {
          cle: 'visibiliteFiches',
          type: 'choix',
          libelle: 'Visibilité des fiches',
          aide: 'Le cloisonnement par équipe limite la fuite lors d’un départ, mais complique l’entraide.',
          valeur: 'equipe',
          options: [
            { valeur: 'globale', libelle: 'Toute l’organisation' },
            { valeur: 'equipe', libelle: 'Par équipe' },
            { valeur: 'proprietaire', libelle: 'Propriétaire uniquement' },
          ],
        },
        {
          cle: 'portailClient',
          type: 'bascule',
          libelle: 'Portail client',
          aide: 'Donne au client un accès en lecture à ses tickets et devis. Publie donc une partie du CRM sur Internet.',
          valeur: false,
        },
        {
          cle: 'exportCsv',
          type: 'choix',
          libelle: 'Export CSV',
          aide: 'L’export est le vecteur classique d’exfiltration d’un fichier de prospects.',
          valeur: 'responsables',
          options: [
            { valeur: 'interdit', libelle: 'Interdit' },
            { valeur: 'responsables', libelle: 'Responsables seulement', detail: 'Journalisé dans l’audit' },
            { valeur: 'tous', libelle: 'Tous les utilisateurs' },
          ],
        },
      ],
    },
  ],
}
