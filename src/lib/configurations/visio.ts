import type { ConfigurationService } from './types'

/**
 * Visio & Chat — Jitsi Meet et Rocket.Chat. Ici les réglages portent sur des
 * salles et des enregistrements : des objets éphémères, dont la fuite se joue
 * au moment de l'invitation.
 */
export const CONFIG_VISIO: ConfigurationService = {
  slug: 'visio',
  solution: 'Jitsi Meet · Rocket.Chat',
  intro:
    'Le portail règle qui entre dans une salle, ce qui est enregistré et combien de temps l’enregistrement survit. Il n’ouvre aucune réunion et ne lit aucune conversation.',
  horsPerimetre: [
    { quoi: 'Rejoindre une réunion ou discuter', ou: 'dans Jitsi ou Rocket.Chat, via le bouton Ouvrir' },
    { quoi: 'Créer un canal et inviter ses membres', ou: 'dans Rocket.Chat' },
    { quoi: 'Consulter un enregistrement', ou: 'dans le Drive, dossier Enregistrements' },
  ],
  sections: [
    {
      titre: 'Accès aux salles',
      phrase:
        'Une salle dont l’URL est devinable est une salle publique. Ces réglages décident du niveau de friction à l’entrée.',
      champs: [
        {
          cle: 'participantsMax',
          type: 'nombre',
          libelle: 'Participants maximum par salle',
          aide: 'Au-delà, les nouveaux arrivants sont refusés avec un message explicite plutôt qu’une salle qui se dégrade pour tous.',
          valeur: 100,
          unite: 'participants',
          min: 5,
          max: 300,
          impactFacture: 'Le palier Business plafonne à 100 ; au-delà, passage en Entreprise.',
        },
        {
          cle: 'salleAttente',
          type: 'bascule',
          libelle: 'Salle d’attente obligatoire',
          aide: 'Personne n’entre avant qu’un organisateur ne l’admette. C’est la seule protection réelle contre l’intrusion dans une réunion sensible.',
          valeur: true,
        },
        {
          cle: 'motDePasseObligatoire',
          type: 'bascule',
          libelle: 'Mot de passe obligatoire',
          aide: 'S’ajoute à la salle d’attente. Utile quand le lien circule par courriel vers des externes.',
          valeur: false,
        },
        {
          cle: 'invitesExternes',
          type: 'choix',
          libelle: 'Participants externes',
          aide: 'Un externe n’a pas de siège : il rejoint par lien, sans compte.',
          valeur: 'autorise_avec_admission',
          options: [
            { valeur: 'interdit', libelle: 'Interdits', detail: 'Réunions internes uniquement' },
            { valeur: 'autorise_avec_admission', libelle: 'Admis un par un', detail: 'Passage obligatoire par la salle d’attente' },
            { valeur: 'autorise', libelle: 'Entrée libre' },
          ],
        },
        {
          cle: 'appelTelephonique',
          type: 'bascule',
          libelle: 'Accès par téléphone',
          aide: 'Un numéro ivoirien permet de rejoindre sans connexion Internet. Le code d’accès est alors la seule barrière.',
          valeur: true,
        },
      ],
    },
    {
      titre: 'Enregistrements',
      phrase:
        'Un enregistrement est une donnée personnelle : il faut savoir où il va et quand il disparaît.',
      champs: [
        {
          cle: 'enregistrementAutorise',
          type: 'choix',
          libelle: 'Qui peut enregistrer',
          aide: 'Tous les participants sont prévenus par une mention visible dès le début de l’enregistrement.',
          valeur: 'organisateur',
          options: [
            { valeur: 'personne', libelle: 'Personne' },
            { valeur: 'organisateur', libelle: 'L’organisateur seulement' },
            { valeur: 'tous', libelle: 'Tous les participants' },
          ],
        },
        {
          cle: 'destinationEnregistrements',
          type: 'choix',
          libelle: 'Destination',
          aide: 'Le Drive garde l’enregistrement dans votre périmètre et sous vos règles de partage.',
          valeur: 'drive',
          options: [
            { valeur: 'drive', libelle: 'Drive Pro', detail: 'Dossier Enregistrements du service' },
            { valeur: 'bucket', libelle: 'Compartiment objet S3', detail: 'bkt-enregistrements' },
          ],
        },
        {
          cle: 'retentionEnregistrementsJours',
          type: 'nombre',
          libelle: 'Rétention des enregistrements',
          aide: 'Passé ce délai, l’enregistrement est supprimé automatiquement. Conserver sans limite est un risque, pas une précaution.',
          valeur: 90,
          unite: 'jours',
          min: 7,
          max: 730,
        },
        {
          cle: 'transcription',
          type: 'bascule',
          libelle: 'Transcription automatique',
          aide: 'Génère un texte horodaté à côté de l’enregistrement. La transcription suit la même rétention.',
          valeur: false,
          verrouille: 'Disponible à partir du palier Entreprise.',
        },
      ],
    },
    {
      titre: 'Messagerie instantanée',
      phrase: 'Le chat persistant conserve les échanges : il faut décider combien de temps.',
      champs: [
        {
          cle: 'retentionMessagesJours',
          type: 'nombre',
          libelle: 'Rétention des messages',
          aide: 'S’applique aux canaux comme aux messages directs. Zéro signifie conservation sans limite.',
          valeur: 365,
          unite: 'jours',
          min: 0,
          max: 3650,
        },
        {
          cle: 'partageFichiersChat',
          type: 'bascule',
          libelle: 'Autoriser les fichiers dans le chat',
          aide: 'Désactiver pousse les échanges de documents vers le Drive, où les règles de partage s’appliquent.',
          valeur: true,
        },
        {
          cle: 'editionMessage',
          type: 'nombre',
          libelle: 'Délai de modification d’un message',
          aide: 'Au-delà, un message ne se modifie plus. Utile quand les échanges peuvent être produits en justice.',
          valeur: 5,
          unite: 'minutes',
          min: 0,
          max: 1440,
        },
      ],
    },
  ],
}
