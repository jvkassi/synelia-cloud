import type { ConfigurationService } from './types'

/**
 * ERP — Odoo Community. Les réglages portent sur le périmètre fonctionnel et le
 * cadre comptable, jamais sur les écritures : une écriture est du contenu.
 */
export const CONFIG_ERP: ConfigurationService = {
  slug: 'erp',
  solution: 'Odoo Community',
  intro:
    'Le portail règle les modules ouverts, le cadre comptable et fiscal, les environnements de test et les moyens de paiement raccordés. La saisie comptable et commerciale se fait dans Odoo.',
  horsPerimetre: [
    { quoi: 'Saisir une facture, un devis, une écriture', ou: 'dans Odoo, via le bouton Ouvrir' },
    { quoi: 'Créer un article, un client, un fournisseur', ou: 'dans Odoo' },
    { quoi: 'Éditer un état comptable', ou: 'dans Odoo, module Comptabilité' },
    { quoi: 'Restaurer une base à une date', ou: 'onglet Sauvegarde de ce service' },
  ],
  sections: [
    {
      titre: 'Périmètre fonctionnel',
      phrase:
        'Chaque module ouvert ajoute des écrans, des droits et des données. Ouvrir large complique la reprise ; ouvrir juste facilite l’adoption.',
      champs: [
        {
          cle: 'modulesActives',
          type: 'liste',
          libelle: 'Modules activés',
          aide: 'Désactiver un module ne supprime pas ses données : elles redeviennent visibles à la réactivation.',
          valeurs: ['Ventes', 'Achats', 'Stock', 'Comptabilité', 'Facturation', 'Projets', 'RH'],
          placeholder: 'module',
          impactFacture: 'Le palier Business plafonne à 12 modules.',
        },
        {
          cle: 'multiSociete',
          type: 'bascule',
          libelle: 'Multi-société',
          aide: 'Permet de tenir plusieurs entités juridiques dans la même base, avec cloisonnement des écritures.',
          valeur: false,
          verrouille: 'Disponible à partir du palier Entreprise.',
        },
        {
          cle: 'languesInterface',
          type: 'liste',
          libelle: 'Langues de l’interface',
          aide: 'Chaque utilisateur choisit ensuite la sienne parmi cette liste.',
          valeurs: ['français', 'anglais'],
          placeholder: 'langue',
        },
      ],
    },
    {
      titre: 'Cadre comptable et fiscal',
      phrase:
        'Ces choix se figent à la première écriture : les changer ensuite demande une reprise, pas un réglage.',
      champs: [
        {
          cle: 'planComptable',
          type: 'choix',
          libelle: 'Plan comptable',
          aide: 'Le référentiel applicable en Côte d’Ivoire est le SYSCOHADA révisé.',
          valeur: 'syscohada',
          effet: 'fenetre_maintenance',
          options: [
            { valeur: 'syscohada', libelle: 'SYSCOHADA révisé', detail: 'Zone UEMOA · recommandé' },
            { valeur: 'pcg', libelle: 'Plan comptable général français' },
            { valeur: 'ifrs', libelle: 'IFRS' },
          ],
        },
        {
          cle: 'deviseSociete',
          type: 'choix',
          libelle: 'Devise de tenue',
          aide: 'Devise dans laquelle les comptes sont tenus. Les devises secondaires restent utilisables en facturation.',
          valeur: 'XOF',
          options: [
            { valeur: 'XOF', libelle: 'Franc CFA (XOF)' },
            { valeur: 'EUR', libelle: 'Euro (EUR)' },
            { valeur: 'USD', libelle: 'Dollar américain (USD)' },
          ],
        },
        {
          cle: 'tvaParDefaut',
          type: 'nombre',
          libelle: 'TVA par défaut',
          aide: 'Taux appliqué aux nouvelles lignes de vente, modifiable ligne par ligne.',
          valeur: 18,
          unite: '%',
          min: 0,
          max: 30,
        },
        {
          cle: 'debutExercice',
          type: 'choix',
          libelle: 'Début de l’exercice',
          aide: 'Détermine les périodes de clôture et les états réglementaires.',
          valeur: '01-01',
          options: [
            { valeur: '01-01', libelle: '1er janvier' },
            { valeur: '04-01', libelle: '1er avril' },
            { valeur: '07-01', libelle: '1er juillet' },
            { valeur: '10-01', libelle: '1er octobre' },
          ],
        },
        {
          cle: 'verrouillagePeriode',
          type: 'bascule',
          libelle: 'Verrouiller les périodes clôturées',
          aide: 'Interdit toute écriture antérieure à la dernière clôture. Indispensable si vos comptes sont audités.',
          valeur: true,
        },
      ],
    },
    {
      titre: 'Encaissements',
      phrase: 'Les moyens de paiement raccordés à la facturation, avec leurs frais.',
      champs: [
        {
          cle: 'moyensPaiement',
          type: 'liste',
          libelle: 'Moyens raccordés',
          aide: 'Le rapprochement bancaire consomme ces raccordements. Chaque opérateur applique sa propre commission.',
          valeurs: ['Orange Money', 'MTN MoMo', 'Wave', 'Virement bancaire'],
          placeholder: 'moyen',
        },
        {
          cle: 'rapprochementAuto',
          type: 'bascule',
          libelle: 'Rapprochement automatique',
          aide: 'Associe les encaissements aux factures par référence. Les écarts restent à traiter à la main.',
          valeur: true,
        },
      ],
    },
    {
      titre: 'Environnements de test',
      phrase:
        'Essayer une configuration sur la base de production est la façon la plus rapide de perdre une comptabilité.',
      champs: [
        {
          cle: 'bacASable',
          type: 'bascule',
          libelle: 'Environnement bac à sable',
          aide: 'Copie de la production, remise à neuf sur demande, sans aucun lien avec les données réelles ensuite.',
          valeur: true,
          impactFacture: 'Facturé comme un environnement supplémentaire, à 40 % du tarif.',
        },
        {
          cle: 'jeuDemoActif',
          type: 'bascule',
          libelle: 'Jeu de données de démonstration',
          aide: 'Ne doit jamais rester actif en production : les données de démonstration polluent les états.',
          valeur: false,
        },
        {
          cle: 'copieProductionJours',
          type: 'nombre',
          libelle: 'Rafraîchissement du bac à sable',
          aide: 'Recopie la production dans le bac à sable à cette fréquence, en anonymisant les tiers.',
          valeur: 30,
          unite: 'jours',
          min: 0,
          max: 180,
        },
      ],
    },
  ],
}
