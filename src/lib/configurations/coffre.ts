import type { ConfigurationService } from './types'

/**
 * Coffre de mots de passe — Vaultwarden. Service où la politique compte plus
 * qu'ailleurs : c'est la clé de tout le reste.
 */
export const CONFIG_COFFRE: ConfigurationService = {
  slug: 'coffre',
  solution: 'Vaultwarden',
  intro:
    'Le portail règle la robustesse exigée des mots de passe, le second facteur, le partage et l’accès d’urgence. Les entrées du coffre restent chiffrées de bout en bout : nous ne pouvons pas les lire.',
  horsPerimetre: [
    { quoi: 'Consulter ou créer une entrée', ou: 'dans les clients Bitwarden, via le bouton Ouvrir' },
    { quoi: 'Récupérer un mot de passe oublié', ou: 'impossible — le chiffrement est de bout en bout' },
  ],
  sections: [
    {
      titre: 'Robustesse exigée',
      phrase:
        'Ces règles s’appliquent au mot de passe maître, celui qui protège tout le reste.',
      champs: [
        {
          cle: 'longueurMinimale',
          type: 'nombre',
          libelle: 'Longueur minimale du mot de passe maître',
          aide: 'La longueur protège mieux que la complexité. Une phrase de passe de quatre mots vaut mieux qu’un mot tordu.',
          valeur: 14,
          unite: 'caractères',
          min: 8,
          max: 64,
        },
        {
          cle: 'complexiteMinimale',
          type: 'choix',
          libelle: 'Complexité exigée',
          aide: 'Trop d’exigences poussent à écrire le mot de passe sur un papier.',
          valeur: 'phrase_ou_mixte',
          options: [
            { valeur: 'aucune', libelle: 'Aucune, longueur seule' },
            { valeur: 'phrase_ou_mixte', libelle: 'Phrase de passe ou casse mixte', detail: 'Recommandé' },
            { valeur: 'stricte', libelle: 'Majuscule, chiffre et symbole' },
          ],
        },
        {
          cle: 'mfaObligatoire',
          type: 'bascule',
          libelle: 'Second facteur obligatoire',
          aide: 'Sans second facteur, le vol du mot de passe maître donne accès à tous les secrets de l’organisation.',
          valeur: true,
        },
        {
          cle: 'methodesMfa',
          type: 'liste',
          libelle: 'Méthodes acceptées',
          aide: 'Les clés matérielles résistent à l’hameçonnage ; les codes par courriel non.',
          valeurs: ['Clé matérielle (WebAuthn)', 'Application TOTP'],
          placeholder: 'méthode',
        },
      ],
    },
    {
      titre: 'Partage et sortie',
      phrase: 'Comment un secret circule dans l’organisation, et comment il en sort.',
      champs: [
        {
          cle: 'collectionsPartagees',
          type: 'bascule',
          libelle: 'Collections partagées par équipe',
          aide: 'Un secret partagé dans une collection reste accessible après le départ de celui qui l’a créé.',
          valeur: true,
        },
        {
          cle: 'exportPersonnelInterdit',
          type: 'bascule',
          libelle: 'Interdire l’export du coffre',
          aide: 'Un export en clair d’un coffre annule tout l’intérêt du chiffrement. Interdire ferme le principal vecteur d’exfiltration.',
          valeur: true,
        },
        {
          cle: 'envoiSecuriseJours',
          type: 'nombre',
          libelle: 'Durée de vie d’un envoi sécurisé',
          aide: 'Transmet un secret à un tiers par lien à usage limité, plutôt que par courriel.',
          valeur: 7,
          unite: 'jours',
          min: 1,
          max: 31,
        },
        {
          cle: 'accesUrgence',
          type: 'bascule',
          libelle: 'Accès d’urgence',
          aide: 'Permet à un contact désigné d’obtenir l’accès après un délai d’attente, si le titulaire ne répond pas. Sans cela, un départ brutal emporte les secrets.',
          valeur: true,
        },
      ],
    },
    {
      titre: 'Sessions et journalisation',
      phrase: 'Ce qui se passe sur un poste laissé sans surveillance.',
      champs: [
        {
          cle: 'verrouillageMinutes',
          type: 'nombre',
          libelle: 'Verrouillage automatique',
          aide: 'Après ce délai d’inactivité, le coffre se reverrouille et redemande le mot de passe maître.',
          valeur: 15,
          unite: 'minutes',
          min: 1,
          max: 240,
        },
        {
          cle: 'journalAcces',
          type: 'bascule',
          libelle: 'Journal des accès',
          aide: 'Enregistre qui a consulté quelle entrée, et quand. Le contenu reste illisible pour nous.',
          valeur: true,
        },
        {
          cle: 'alerteFuite',
          type: 'bascule',
          libelle: 'Alerte sur mot de passe compromis',
          aide: 'Compare les empreintes à celles des fuites publiques connues, sans transmettre le mot de passe.',
          valeur: true,
        },
      ],
    },
  ],
}
