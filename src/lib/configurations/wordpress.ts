import type { ConfigurationService } from './types'

/**
 * WordPress managé. Le sujet n'est pas le contenu du site mais son socle :
 * mises à jour, cache, pare-feu, préproduction.
 */
export const CONFIG_WORDPRESS: ConfigurationService = {
  slug: 'wordpress',
  solution: 'WordPress',
  intro:
    'Le portail règle les mises à jour, le cache, le pare-feu applicatif et la préproduction. Les pages, les articles et les médias s’éditent dans WordPress.',
  horsPerimetre: [
    { quoi: 'Écrire une page ou un article', ou: 'dans WordPress, via le bouton Ouvrir' },
    { quoi: 'Installer un thème ou une extension', ou: 'dans l’administration WordPress' },
    { quoi: 'Gérer les comptes rédacteurs', ou: 'dans WordPress, ou par la fédération d’identité' },
  ],
  sections: [
    {
      titre: 'Mises à jour',
      phrase:
        'Une extension non mise à jour est la première porte d’entrée sur un WordPress. Une mise à jour non testée est la première cause de site cassé.',
      champs: [
        {
          cle: 'majCoeur',
          type: 'choix',
          libelle: 'Mises à jour du cœur',
          aide: 'Les correctifs de sécurité sont appliqués sous 24 h quel que soit ce réglage.',
          valeur: 'auto_apres_sauvegarde',
          options: [
            { valeur: 'auto_apres_sauvegarde', libelle: 'Automatiques après sauvegarde', detail: 'Recommandé' },
            { valeur: 'validation', libelle: 'Soumises à validation', detail: 'Avec rapport de ce qui change' },
            { valeur: 'manuelle', libelle: 'Manuelles' },
          ],
        },
        {
          cle: 'majExtensions',
          type: 'choix',
          libelle: 'Mises à jour des extensions',
          aide: 'Tester en préproduction avant d’appliquer en production évite la page blanche du lundi matin.',
          valeur: 'preprod_puis_prod',
          options: [
            { valeur: 'auto', libelle: 'Automatiques' },
            { valeur: 'preprod_puis_prod', libelle: 'Préproduction puis production', detail: 'Recommandé' },
            { valeur: 'manuelle', libelle: 'Manuelles' },
          ],
        },
        {
          cle: 'versionPhp',
          type: 'choix',
          libelle: 'Version de PHP',
          aide: 'Une version en fin de vie ne reçoit plus de correctif de sécurité.',
          valeur: '8.3',
          effet: 'redemarrage',
          options: [
            { valeur: '8.4', libelle: 'PHP 8.4' },
            { valeur: '8.3', libelle: 'PHP 8.3', detail: 'Recommandé' },
            { valeur: '8.2', libelle: 'PHP 8.2' },
            { valeur: '8.1', libelle: 'PHP 8.1', detail: 'Fin de support en novembre 2026' },
          ],
        },
        {
          cle: 'retourArriereJours',
          type: 'nombre',
          libelle: 'Fenêtre de retour arrière',
          aide: 'Durée pendant laquelle un retour à l’état d’avant mise à jour reste possible en un clic.',
          valeur: 7,
          unite: 'jours',
          min: 1,
          max: 30,
        },
      ],
    },
    {
      titre: 'Performance',
      phrase: 'Le cache décide de la tenue du site sous charge, et de la fraîcheur de ce qui est servi.',
      champs: [
        {
          cle: 'cachePage',
          type: 'bascule',
          libelle: 'Cache de page',
          aide: 'Sert une copie prête à l’emploi. La purge est automatique à chaque publication.',
          valeur: true,
        },
        {
          cle: 'cacheDureeMinutes',
          type: 'nombre',
          libelle: 'Durée de vie du cache',
          aide: 'Plus la durée est longue, moins le site travaille — et plus une modification tarde à apparaître.',
          valeur: 60,
          unite: 'minutes',
          min: 1,
          max: 1440,
        },
        {
          cle: 'cdn',
          type: 'bascule',
          libelle: 'Diffusion par le réseau de bordure',
          aide: 'Sert les images et les fichiers statiques au plus près du visiteur.',
          valeur: true,
        },
        {
          cle: 'conversionWebp',
          type: 'bascule',
          libelle: 'Conversion automatique des images',
          aide: 'Les images sont converties et redimensionnées à la volée, sans toucher aux originaux.',
          valeur: true,
        },
      ],
    },
    {
      titre: 'Sécurité',
      phrase: 'Ce qui est bloqué avant d’atteindre PHP.',
      champs: [
        {
          cle: 'wafRegles',
          type: 'choix',
          libelle: 'Jeu de règles du pare-feu',
          aide: 'Le mode détection journalise sans bloquer : c’est par là qu’on commence, pour repérer les faux positifs.',
          valeur: 'owasp_wordpress',
          options: [
            { valeur: 'detection', libelle: 'Détection seule' },
            { valeur: 'owasp_base', libelle: 'OWASP standard' },
            { valeur: 'owasp_wordpress', libelle: 'OWASP + règles WordPress', detail: 'Recommandé' },
          ],
        },
        {
          cle: 'antiForceBrute',
          type: 'bascule',
          libelle: 'Anti-force brute sur la connexion',
          aide: 'Bloque une adresse après plusieurs échecs sur wp-login et XML-RPC.',
          valeur: true,
        },
        {
          cle: 'xmlrpc',
          type: 'bascule',
          libelle: 'Laisser XML-RPC ouvert',
          aide: 'Nécessaire à quelques applications mobiles anciennes, et cible privilégiée d’attaques par amplification.',
          valeur: false,
        },
        {
          cle: 'scanMalware',
          type: 'bascule',
          libelle: 'Scan de malware quotidien',
          aide: 'Compare les fichiers du cœur et des extensions à leur empreinte officielle, et met en quarantaine ce qui diffère.',
          valeur: true,
        },
        {
          cle: 'coeurLectureSeule',
          type: 'bascule',
          libelle: 'Cœur en lecture seule',
          aide: 'Interdit l’écriture dans les fichiers du cœur hors fenêtre de mise à jour. Bloque net la plupart des infections.',
          valeur: true,
        },
      ],
    },
    {
      titre: 'Préproduction',
      phrase: 'Un site de test qui ne doit jamais être indexé ni confondu avec la production.',
      champs: [
        {
          cle: 'preprodActive',
          type: 'bascule',
          libelle: 'Environnement de préproduction',
          aide: 'Clone du site et de sa base, publiable vers la production après comparaison.',
          valeur: true,
        },
        {
          cle: 'preprodMotDePasse',
          type: 'bascule',
          libelle: 'Protéger la préproduction par mot de passe',
          aide: 'Empêche l’indexation et la consultation accidentelle par un client.',
          valeur: true,
        },
      ],
    },
  ],
}
