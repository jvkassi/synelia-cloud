import type { ConfigurationService } from './types'

/** Drive Pro — Nextcloud. Le risque principal est la fuite par lien public. */
export const CONFIG_DRIVE_PRO: ConfigurationService = {
  slug: 'drive-pro',
  solution: 'Nextcloud',
  intro:
    'Le portail règle qui peut partager quoi, avec qui, et pour combien de temps. L’arborescence, les fichiers et les commentaires vivent dans Nextcloud.',
  horsPerimetre: [
    { quoi: 'Parcourir, déposer ou éditer des fichiers', ou: 'dans Nextcloud, via le bouton Ouvrir' },
    { quoi: 'Créer des dossiers de groupe et leurs droits fins', ou: 'dans l’administration Nextcloud' },
    { quoi: 'Restaurer un fichier précis', ou: 'onglet Sauvegarde de ce service' },
  ],
  sections: [
    {
      titre: 'Partage externe',
      phrase:
        'Le partage par lien est la première cause de fuite documentaire. Ces règles s’appliquent à tous les sièges, sans exception possible côté utilisateur.',
      champs: [
        {
          cle: 'partageExterne',
          type: 'choix',
          libelle: 'Partage vers l’extérieur',
          aide: 'Détermine si un utilisateur peut créer un lien accessible hors de l’organisation.',
          valeur: 'groupes_autorises',
          effet: 'prochaine_connexion',
          options: [
            { valeur: 'interdit', libelle: 'Interdit', detail: 'Aucun lien externe, aucune exception' },
            {
              valeur: 'groupes_autorises',
              libelle: 'Réservé à certains groupes',
              detail: 'Seuls les groupes listés ci-dessous peuvent partager',
            },
            { valeur: 'autorise', libelle: 'Autorisé à tous', detail: 'Chaque siège peut créer des liens' },
          ],
        },
        {
          cle: 'groupesAutorises',
          type: 'liste',
          libelle: 'Groupes autorisés à partager',
          aide: 'Groupes de l’annuaire, hérités de la fédération d’identité.',
          valeurs: ['direction', 'commerce', 'projets'],
          placeholder: 'nom du groupe',
        },
        {
          cle: 'motDePasseObligatoire',
          type: 'bascule',
          libelle: 'Mot de passe obligatoire sur les liens',
          aide: 'Un lien sans mot de passe est indexable et transférable sans trace. Nous recommandons de laisser cette règle active.',
          valeur: true,
        },
        {
          cle: 'expirationLiensJours',
          type: 'nombre',
          libelle: 'Expiration par défaut des liens',
          aide: 'Au-delà de ce délai, le lien cesse de fonctionner. L’utilisateur peut raccourcir la durée, jamais l’allonger.',
          valeur: 30,
          unite: 'jours',
          min: 1,
          max: 365,
        },
        {
          cle: 'televersementAnonyme',
          type: 'bascule',
          libelle: 'Autoriser le dépôt anonyme',
          aide: 'Utile pour recevoir des pièces d’un tiers sans lui créer de compte. À n’ouvrir que sur des dossiers dédiés.',
          valeur: false,
        },
      ],
    },
    {
      titre: 'Quotas et rétention',
      phrase: 'Ce que chaque siège peut stocker, et combien de temps ce qui est supprimé reste récupérable.',
      champs: [
        {
          cle: 'quotaParUtilisateurGo',
          type: 'nombre',
          libelle: 'Quota par utilisateur',
          aide: 'Un dépassement bloque le dépôt sans rien supprimer, et déclenche une alerte.',
          valeur: 500,
          unite: 'Go',
          min: 10,
          max: 2000,
          impactFacture: 'Le palier Business plafonne à 500 Go par siège ; au-delà, passage en Entreprise.',
        },
        {
          cle: 'retentionCorbeilleJours',
          type: 'nombre',
          libelle: 'Rétention de la corbeille',
          aide: 'Durée pendant laquelle un utilisateur récupère seul un fichier supprimé, sans passer par le support.',
          valeur: 30,
          unite: 'jours',
          min: 7,
          max: 180,
        },
        {
          cle: 'versionsConservees',
          type: 'nombre',
          libelle: 'Versions conservées par fichier',
          aide: 'Le versioning protège d’une écriture malheureuse ou d’un chiffrement par rançongiciel.',
          valeur: 90,
          unite: 'jours',
          min: 7,
          max: 365,
        },
      ],
    },
    {
      titre: 'Sécurité du poste et des accès',
      phrase: 'Ce qui s’applique aux clients bureau et mobiles, sur lesquels les fichiers sont recopiés.',
      champs: [
        {
          cle: 'chiffrementBoutEnBout',
          type: 'bascule',
          libelle: 'Chiffrement de bout en bout par dossier',
          aide: 'Les fichiers d’un dossier chiffré ne sont lisibles que par les clients autorisés. Nous ne pouvons alors ni les indexer, ni les restaurer sans la clé.',
          valeur: false,
          verrouille: 'Disponible à partir du palier Entreprise.',
        },
        {
          cle: 'antivirusDepot',
          type: 'bascule',
          libelle: 'Analyse antivirale au dépôt',
          aide: 'Chaque fichier déposé est analysé avant d’être mis à disposition des autres sièges.',
          valeur: true,
        },
        {
          cle: 'blocageExtensions',
          type: 'liste',
          libelle: 'Extensions refusées',
          aide: 'Refusées au dépôt comme à la synchronisation, dans les deux sens.',
          valeurs: ['.exe', '.scr', '.bat', '.js'],
          placeholder: '.ext',
        },
        {
          cle: 'verrouillageAppareil',
          type: 'choix',
          libelle: 'Appareils autorisés à synchroniser',
          aide: 'Restreindre la synchronisation limite le nombre de copies des fichiers hors de nos murs.',
          valeur: 'tous',
          options: [
            { valeur: 'tous', libelle: 'Tous les appareils' },
            { valeur: 'declares', libelle: 'Appareils déclarés seulement' },
            { valeur: 'web', libelle: 'Accès web uniquement', detail: 'Aucune copie locale' },
          ],
        },
      ],
    },
  ],
}
