import type { ConfigurationService } from './types'

/**
 * Forge logicielle — GitLab CE. Les réglages tournent autour du code source,
 * des secrets d'intégration continue et de ce qui peut sortir.
 */
export const CONFIG_FORGE: ConfigurationService = {
  slug: 'forge',
  solution: 'GitLab CE',
  intro:
    'Le portail règle la visibilité des dépôts, la protection des branches, les runners d’intégration continue et la rétention du registre. Le code, les tickets et les demandes de fusion vivent dans GitLab.',
  horsPerimetre: [
    { quoi: 'Lire ou pousser du code, ouvrir une demande de fusion', ou: 'dans GitLab, via le bouton Ouvrir' },
    { quoi: 'Écrire un pipeline .gitlab-ci.yml', ou: 'dans le dépôt lui-même' },
  ],
  sections: [
    {
      titre: 'Visibilité et accès',
      phrase: 'Un dépôt public par défaut est une fuite de code qui attend son heure.',
      champs: [
        {
          cle: 'visibiliteDefaut',
          type: 'choix',
          libelle: 'Visibilité par défaut d’un nouveau dépôt',
          aide: 'Le créateur peut ensuite ouvrir davantage, jamais par accident.',
          valeur: 'privee',
          options: [
            { valeur: 'privee', libelle: 'Privée', detail: 'Recommandé' },
            { valeur: 'interne', libelle: 'Interne à l’organisation' },
            { valeur: 'publique', libelle: 'Publique' },
          ],
        },
        {
          cle: 'mfaObligatoire',
          type: 'bascule',
          libelle: 'Double authentification obligatoire',
          aide: 'Un accès au code source vaut un accès à la production. Sans second facteur, un mot de passe volé suffit.',
          valeur: true,
        },
        {
          cle: 'clesSshExpirationJours',
          type: 'nombre',
          libelle: 'Expiration des clés SSH',
          aide: 'Une clé sans expiration reste valide après le départ de son propriétaire.',
          valeur: 365,
          unite: 'jours',
          min: 0,
          max: 1095,
        },
        {
          cle: 'branchesProtegees',
          type: 'liste',
          libelle: 'Branches protégées',
          aide: 'Interdit la poussée directe et la réécriture d’historique. Une revue devient obligatoire.',
          valeurs: ['main', 'release/*'],
          placeholder: 'nom ou motif',
        },
      ],
    },
    {
      titre: 'Intégration continue',
      phrase: 'Ce que les pipelines ont le droit de faire, et avec quels secrets.',
      champs: [
        {
          cle: 'runners',
          type: 'choix',
          libelle: 'Runners utilisés',
          aide: 'Un runner partagé est mutualisé entre organisations : le code y passe, jamais les secrets de production.',
          valeur: 'dedies',
          options: [
            { valeur: 'partages', libelle: 'Runners partagés' },
            { valeur: 'dedies', libelle: 'Runners dédiés', detail: 'Recommandé pour la production' },
          ],
          impactFacture: 'Les runners dédiés sont facturés à la machine, non à la minute.',
        },
        {
          cle: 'secretsBranchesProtegees',
          type: 'bascule',
          libelle: 'Secrets réservés aux branches protégées',
          aide: 'Empêche qu’une branche de test créée par n’importe qui lise les identifiants de production.',
          valeur: true,
        },
        {
          cle: 'detectionSecrets',
          type: 'bascule',
          libelle: 'Détection de secrets à la poussée',
          aide: 'Refuse un commit qui contient une clé ou un mot de passe. Un secret poussé est un secret à révoquer.',
          valeur: true,
        },
        {
          cle: 'minutesCiMois',
          type: 'nombre',
          libelle: 'Minutes d’exécution par mois',
          aide: 'Au-delà, les pipelines sont mis en file plutôt que refusés.',
          valeur: 5000,
          unite: 'minutes',
          min: 500,
          max: 100000,
        },
      ],
    },
    {
      titre: 'Registre et rétention',
      phrase: 'Les images produites s’accumulent vite et coûtent du stockage.',
      champs: [
        {
          cle: 'retentionImagesJours',
          type: 'nombre',
          libelle: 'Rétention des images non étiquetées',
          aide: 'Les images portant une étiquette de version sont conservées ; les intermédiaires sont purgées.',
          valeur: 30,
          unite: 'jours',
          min: 7,
          max: 365,
        },
        {
          cle: 'analyseVulnerabilites',
          type: 'bascule',
          libelle: 'Analyse des images au push',
          aide: 'Chaque image poussée est comparée aux bases de vulnérabilités connues. Le résultat apparaît dans le registre.',
          valeur: true,
        },
        {
          cle: 'blocageCritiques',
          type: 'bascule',
          libelle: 'Refuser le déploiement d’une image critique',
          aide: 'Bloque la mise en production d’une image portant une vulnérabilité critique corrigée en amont.',
          valeur: false,
        },
      ],
    },
  ],
}
