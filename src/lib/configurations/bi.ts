import type { ConfigurationService } from './types'

/**
 * BI — Metabase. Le risque propre à un outil décisionnel est le partage public
 * d'un tableau de bord et la requête qui met une base de production à genoux.
 */
export const CONFIG_BI: ConfigurationService = {
  slug: 'bi',
  solution: 'Metabase',
  intro:
    'Le portail règle les sources connectées, les permissions de lecture, les limites de requête et le partage. Les questions et les tableaux de bord se construisent dans Metabase.',
  horsPerimetre: [
    { quoi: 'Construire une question ou un tableau de bord', ou: 'dans Metabase, via le bouton Ouvrir' },
    { quoi: 'Écrire du SQL', ou: 'dans Metabase, éditeur natif' },
  ],
  sections: [
    {
      titre: 'Sources de données',
      phrase:
        'Une source ajoutée est une source interrogeable par tous ceux qui y ont droit. Le choix de la réplique évite d’interroger la production.',
      champs: [
        {
          cle: 'sources',
          type: 'liste',
          libelle: 'Connexions déclarées',
          aide: 'Chaque connexion utilise un compte en lecture seule, créé par nos soins.',
          valeurs: ['entrepot (ClickHouse)', 'app_metier — réplique de lecture', 'facturation (PostgreSQL)'],
          placeholder: 'source',
        },
        {
          cle: 'lectureSeule',
          type: 'bascule',
          libelle: 'Comptes en lecture seule uniquement',
          aide: 'Interdit toute écriture depuis l’outil décisionnel. À laisser actif : un rapport n’a pas à modifier des données.',
          valeur: true,
          verrouille: 'Imposé par la politique d’exploitation Synelia.',
        },
        {
          cle: 'timeoutRequeteS',
          type: 'nombre',
          libelle: 'Délai maximal d’une requête',
          aide: 'Au-delà, la requête est interrompue. Protège la base d’un tableau de bord mal écrit.',
          valeur: 60,
          unite: 'secondes',
          min: 10,
          max: 600,
        },
        {
          cle: 'cacheResultatsMinutes',
          type: 'nombre',
          libelle: 'Cache des résultats',
          aide: 'Un tableau de bord consulté par vingt personnes ne doit pas déclencher vingt requêtes.',
          valeur: 30,
          unite: 'minutes',
          min: 0,
          max: 1440,
        },
      ],
    },
    {
      titre: 'Permissions',
      phrase: 'Qui voit quelles lignes, et qui peut écrire du SQL libre.',
      champs: [
        {
          cle: 'permissionsParLigne',
          type: 'bascule',
          libelle: 'Filtrage par ligne',
          aide: 'Chaque utilisateur ne voit que les lignes de son périmètre, selon un attribut de l’annuaire.',
          valeur: true,
        },
        {
          cle: 'sqlNatif',
          type: 'choix',
          libelle: 'Accès au SQL natif',
          aide: 'Le SQL libre contourne les filtres par ligne : à réserver à ceux qui ont déjà accès à tout.',
          valeur: 'groupe_data',
          options: [
            { valeur: 'personne', libelle: 'Personne' },
            { valeur: 'groupe_data', libelle: 'Groupe data seulement' },
            { valeur: 'tous', libelle: 'Tous les utilisateurs' },
          ],
        },
        {
          cle: 'telechargementLignesMax',
          type: 'nombre',
          libelle: 'Lignes exportables',
          aide: 'Plafonne l’export CSV. Un export d’un million de lignes est une copie de base, pas un rapport.',
          valeur: 10000,
          unite: 'lignes',
          min: 100,
          max: 1000000,
        },
      ],
    },
    {
      titre: 'Partage et diffusion',
      phrase: 'La façon la plus simple de publier des chiffres internes sur Internet.',
      champs: [
        {
          cle: 'partagePublic',
          type: 'bascule',
          libelle: 'Autoriser les liens publics',
          aide: 'Un lien public est accessible sans authentification, à quiconque le connaît. Nous le laissons fermé par défaut.',
          valeur: false,
        },
        {
          cle: 'envoisPlanifies',
          type: 'bascule',
          libelle: 'Envois planifiés par courriel',
          aide: 'Envoie un tableau de bord à heure fixe. Les destinataires externes doivent être déclarés explicitement.',
          valeur: true,
        },
        {
          cle: 'destinatairesExternes',
          type: 'liste',
          libelle: 'Destinataires externes autorisés',
          aide: 'Seules ces adresses hors organisation peuvent recevoir un envoi planifié.',
          valeurs: [],
          placeholder: 'adresse@externe.ci',
        },
      ],
    },
  ],
}
