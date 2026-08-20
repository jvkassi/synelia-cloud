import type { ConfigurationService } from './types'

/**
 * Email Pro — Grommunio. Rien de commun avec un Drive : ici les objets sont des
 * domaines, des boîtes, des alias, et la réputation d'expédition — qui se perd
 * en une journée et se reconstruit en un mois.
 */
export const CONFIG_EMAIL_PRO: ConfigurationService = {
  slug: 'email-pro',
  solution: 'Grommunio',
  intro:
    'Le portail gouverne les domaines gérés, l’authentification d’expédition, les quotas de boîte et les règles de rétention. Les messages, eux, ne sont jamais lus ni affichés ici.',
  horsPerimetre: [
    { quoi: 'Lire, écrire ou classer des messages', ou: 'dans le webmail, via le bouton Ouvrir' },
    { quoi: 'Créer une règle de tri personnelle', ou: 'dans les préférences de chaque utilisateur' },
    { quoi: 'Restaurer une boîte ou un message', ou: 'onglet Sauvegarde de ce service' },
    { quoi: 'Acheter ou transférer un domaine', ou: 'Web Cloud › Domaines & DNS' },
  ],
  sections: [
    {
      titre: 'Domaines gérés',
      phrase:
        'Un domaine n’accepte le courrier qu’une fois ses enregistrements DNS en place. Le portail vérifie, il ne suppose pas.',
      champs: [
        {
          cle: 'domainesGeres',
          type: 'liste',
          libelle: 'Domaines de messagerie',
          aide: 'Chaque domaine ajouté doit être vérifié avant de recevoir du courrier.',
          valeurs: ['dba.africa', 'digitalbusinessafrica.ci'],
          placeholder: 'exemple.ci',
        },
        {
          cle: 'spf',
          type: 'etat',
          libelle: 'SPF',
          aide: 'Déclare quels serveurs ont le droit d’expédier pour votre domaine. Sans SPF valide, une partie des messages part en indésirable.',
          etat: 'ok',
          detail: 'v=spf1 include:_spf.synelia.cloud -all — publié et aligné sur les deux domaines.',
          action: 'Vérifier à nouveau',
        },
        {
          cle: 'dkim',
          type: 'etat',
          libelle: 'DKIM',
          aide: 'Signe chaque message sortant. La clé est générée par domaine et tournée une fois par an.',
          etat: 'ok',
          detail: 'Sélecteur syn2026 · clé 2048 bits · rotation prévue le 14 février 2027.',
          action: 'Forcer une rotation',
        },
        {
          cle: 'dmarc',
          type: 'etat',
          libelle: 'DMARC',
          aide: 'Indique aux destinataires quoi faire d’un message qui échoue SPF et DKIM. Le passage en reject se fait par étapes, jamais d’un coup.',
          etat: 'attention',
          detail:
            'p=quarantine sur dba.africa, p=none sur digitalbusinessafrica.ci. Les rapports agrégés ne montrent plus d’échec légitime depuis 21 jours : le passage en reject est envisageable.',
          action: 'Passer en reject',
        },
        {
          cle: 'catchAll',
          type: 'choix',
          libelle: 'Adresse fourre-tout',
          aide: 'Reçoit le courrier adressé à une boîte inexistante. Pratique, mais elle attire aussi tout le spam de dictionnaire.',
          valeur: 'refus',
          options: [
            { valeur: 'refus', libelle: 'Refuser', detail: 'Le message est rejeté à l’entrée, l’expéditeur est prévenu' },
            { valeur: 'boite', libelle: 'Rediriger vers une boîte' },
            { valeur: 'silence', libelle: 'Accepter puis jeter', detail: 'Déconseillé : l’expéditeur croit avoir été lu' },
          ],
        },
      ],
    },
    {
      titre: 'Boîtes, alias et distribution',
      phrase: 'Ce que reçoit chaque siège, et comment le courrier collectif est routé.',
      champs: [
        {
          cle: 'quotaBoiteGo',
          type: 'nombre',
          libelle: 'Quota par boîte',
          aide: 'À 90 % du quota, l’utilisateur est averti. À 100 %, la réception est refusée avec un message clair à l’expéditeur.',
          valeur: 50,
          unite: 'Go',
          min: 5,
          max: 200,
          impactFacture: 'Le palier Business plafonne à 50 Go par boîte.',
        },
        {
          cle: 'alias',
          type: 'liste',
          libelle: 'Alias déclarés',
          aide: 'Un alias ne consomme pas de siège : il redirige vers une boîte existante.',
          valeurs: ['contact@dba.africa', 'facturation@dba.africa', 'support@dba.africa'],
          placeholder: 'alias@domaine.ci',
        },
        {
          cle: 'groupesDistribution',
          type: 'liste',
          libelle: 'Groupes de distribution',
          aide: 'Une adresse unique qui distribue à plusieurs boîtes. Les membres se gèrent depuis l’annuaire.',
          valeurs: ['direction@dba.africa', 'equipe-projet@dba.africa'],
          placeholder: 'groupe@domaine.ci',
        },
        {
          cle: 'tailleMaxPieceJointeMo',
          type: 'nombre',
          libelle: 'Taille maximale des pièces jointes',
          aide: 'Au-delà, le portail propose à l’utilisateur un lien Drive plutôt qu’un rejet sec.',
          valeur: 25,
          unite: 'Mo',
          min: 5,
          max: 150,
        },
      ],
    },
    {
      titre: 'Anti-spam et protection',
      phrase: 'Le filtrage entrant, et ce qui est fait des messages douteux.',
      champs: [
        {
          cle: 'antiSpam',
          type: 'choix',
          libelle: 'Agressivité du filtrage',
          aide: 'Plus le filtre est strict, plus il écarte de courrier légitime. Le niveau standard convient à la grande majorité des organisations.',
          valeur: 'standard',
          options: [
            { valeur: 'permissif', libelle: 'Permissif', detail: 'Peu de faux positifs, plus de spam en boîte' },
            { valeur: 'standard', libelle: 'Standard', detail: 'Réglage recommandé' },
            { valeur: 'strict', libelle: 'Strict', detail: 'À surveiller : des messages légitimes seront écartés' },
          ],
        },
        {
          cle: 'quarantaine',
          type: 'choix',
          libelle: 'Destination des messages douteux',
          aide: 'La quarantaine centralisée évite que chaque utilisateur juge seul un message d’hameçonnage.',
          valeur: 'quarantaine_centrale',
          options: [
            { valeur: 'dossier_indesirable', libelle: 'Dossier Indésirables de l’utilisateur' },
            { valeur: 'quarantaine_centrale', libelle: 'Quarantaine centralisée', detail: 'Revue par un administrateur' },
            { valeur: 'rejet', libelle: 'Rejet à l’entrée' },
          ],
        },
        {
          cle: 'reecritureLiens',
          type: 'bascule',
          libelle: 'Réécriture des liens entrants',
          aide: 'Les liens sont analysés au moment du clic, et non à la réception : un site piégé après l’envoi est tout de même bloqué.',
          valeur: true,
        },
        {
          cle: 'blocageExterneVersInterne',
          type: 'bascule',
          libelle: 'Refuser l’usurpation de vos adresses',
          aide: 'Rejette un message venant d’Internet qui se présente avec une de vos adresses comme expéditeur. Sans cela, un faux ordre de virement passe facilement.',
          valeur: true,
        },
      ],
    },
    {
      titre: 'Rétention et archivage',
      phrase: 'Combien de temps le courrier est conservé, et sous quelle forme.',
      champs: [
        {
          cle: 'retentionArchivageMois',
          type: 'nombre',
          libelle: 'Archivage légal',
          aide: 'Copie immuable de tout le courrier entrant et sortant, y compris ce qu’un utilisateur supprime.',
          valeur: 12,
          unite: 'mois',
          min: 0,
          max: 120,
          impactFacture: 'Facturé au volume archivé, au-delà de 12 mois inclus.',
        },
        {
          cle: 'suppressionDefinitiveJours',
          type: 'nombre',
          libelle: 'Purge des éléments supprimés',
          aide: 'Délai après lequel un message supprimé par l’utilisateur devient irrécupérable, hors archivage légal.',
          valeur: 30,
          unite: 'jours',
          min: 7,
          max: 90,
        },
        {
          cle: 'exportBoite',
          type: 'bascule',
          libelle: 'Autoriser l’export d’une boîte par son titulaire',
          aide: 'Un export au format standard facilite le départ d’un collaborateur, et facilite aussi l’exfiltration. À trancher selon votre politique.',
          valeur: false,
        },
      ],
    },
  ],
}
