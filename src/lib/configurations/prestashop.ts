import type { ConfigurationService } from './types'

/**
 * PrestaShop managé. Une boutique ajoute au socle web des sujets propres :
 * paiement, stock, fiscalité, et le risque de la double commande.
 */
export const CONFIG_PRESTASHOP: ConfigurationService = {
  slug: 'prestashop',
  solution: 'PrestaShop',
  intro:
    'Le portail règle les moyens de paiement raccordés, la politique de stock, la fiscalité et la préproduction. Le catalogue et les commandes se gèrent dans PrestaShop.',
  horsPerimetre: [
    { quoi: 'Créer un produit, traiter une commande', ou: 'dans PrestaShop, via le bouton Ouvrir' },
    { quoi: 'Éditer le thème de la boutique', ou: 'dans PrestaShop' },
    { quoi: 'Répondre à un client', ou: 'dans le service client de PrestaShop' },
  ],
  sections: [
    {
      titre: 'Paiement',
      phrase:
        'Chaque opérateur applique sa commission et son délai de reversement. Le rapprochement dépend de ces raccordements.',
      champs: [
        {
          cle: 'moyensPaiement',
          type: 'liste',
          libelle: 'Moyens raccordés',
          aide: 'Le mobile money représente l’essentiel des paiements en Côte d’Ivoire ; la carte reste utile pour la diaspora.',
          valeurs: ['Orange Money', 'MTN MoMo', 'Wave', 'Carte bancaire', 'Paiement à la livraison'],
          placeholder: 'moyen',
        },
        {
          cle: 'modeTest',
          type: 'bascule',
          libelle: 'Paiements en mode test',
          aide: 'Aucun débit réel. Laisser ce mode actif en production signifie que vous ne serez jamais payé.',
          valeur: false,
        },
        {
          cle: 'delaiAnnulationMinutes',
          type: 'nombre',
          libelle: 'Délai d’abandon d’un panier en attente de paiement',
          aide: 'Passé ce délai, le stock réservé est relibéré. Trop court, le client perd sa commande pendant la saisie du code.',
          valeur: 30,
          unite: 'minutes',
          min: 5,
          max: 240,
        },
        {
          cle: 'protectionDoubleCommande',
          type: 'bascule',
          libelle: 'Protection contre la double commande',
          aide: 'Un rechargement de page après paiement ne crée pas une seconde commande. Sans cela, les doublons sont fréquents sur réseau mobile instable.',
          valeur: true,
        },
      ],
    },
    {
      titre: 'Stock et livraison',
      phrase: 'Ce que la boutique fait quand il n’y a plus rien à vendre.',
      champs: [
        {
          cle: 'ventesSansStock',
          type: 'choix',
          libelle: 'Commande hors stock',
          aide: 'Vendre sans stock améliore le chiffre et dégrade la satisfaction. À choisir produit par produit si possible.',
          valeur: 'refus',
          options: [
            { valeur: 'refus', libelle: 'Refuser' },
            { valeur: 'precommande', libelle: 'Accepter en précommande', detail: 'Avec délai affiché' },
            { valeur: 'libre', libelle: 'Accepter sans mention' },
          ],
        },
        {
          cle: 'seuilAlerteStock',
          type: 'nombre',
          libelle: 'Seuil d’alerte de stock',
          aide: 'Déclenche une notification au gestionnaire, pas un blocage.',
          valeur: 5,
          unite: 'unités',
          min: 0,
          max: 100,
        },
        {
          cle: 'zonesLivraison',
          type: 'liste',
          libelle: 'Zones de livraison',
          aide: 'Une zone non déclarée n’apparaît pas au tunnel de commande.',
          valeurs: ['Abidjan', 'Intérieur Côte d’Ivoire', 'UEMOA', 'International'],
          placeholder: 'zone',
        },
      ],
    },
    {
      titre: 'Fiscalité et documents',
      phrase: 'Ce qui figure sur la facture, et ce qui est conservé.',
      champs: [
        {
          cle: 'tvaBoutique',
          type: 'nombre',
          libelle: 'TVA par défaut',
          aide: 'Appliquée aux produits sans règle propre.',
          valeur: 18,
          unite: '%',
          min: 0,
          max: 30,
        },
        {
          cle: 'prixAffichesTtc',
          type: 'bascule',
          libelle: 'Afficher les prix toutes taxes comprises',
          aide: 'Attendu en vente au particulier ; le hors taxes convient au professionnel.',
          valeur: true,
        },
        {
          cle: 'conservationFacturesAns',
          type: 'nombre',
          libelle: 'Conservation des factures',
          aide: 'Les factures sont archivées en PDF immuable, indépendamment de la base de la boutique.',
          valeur: 10,
          unite: 'ans',
          min: 5,
          max: 30,
        },
      ],
    },
    {
      titre: 'Exploitation',
      phrase: 'Mises à jour et bascule, sur un site qui encaisse de l’argent.',
      champs: [
        {
          cle: 'preprodActive',
          type: 'bascule',
          libelle: 'Environnement de préproduction',
          aide: 'Indispensable sur une boutique : une mise à jour ratée en production, c’est du chiffre perdu à la minute.',
          valeur: true,
        },
        {
          cle: 'maintenanceIpAutorisees',
          type: 'liste',
          libelle: 'Adresses autorisées en mode maintenance',
          aide: 'Pendant une maintenance, seules ces adresses voient la boutique.',
          valeurs: ['102.176.20.0/24'],
          placeholder: 'plage CIDR',
        },
        {
          cle: 'fenetreMaintenance',
          type: 'choix',
          libelle: 'Fenêtre de maintenance',
          aide: 'Choisie hors des heures de commande. Le trafic de votre boutique culmine en soirée.',
          valeur: 'nuit_semaine',
          options: [
            { valeur: 'nuit_semaine', libelle: 'Nuit, du lundi au jeudi', detail: '01:00 – 04:00' },
            { valeur: 'dimanche_matin', libelle: 'Dimanche matin' },
            { valeur: 'sur_demande', libelle: 'Sur demande uniquement' },
          ],
        },
      ],
    },
  ],
}
