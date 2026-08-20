import type { ConfigurationService } from './types'

/**
 * GED — Mayan EDMS. Contrairement au Drive, l'objet n'est pas un fichier mais
 * un document indexé, soumis à une durée de conservation réglementaire.
 */
export const CONFIG_GED: ConfigurationService = {
  slug: 'ged',
  solution: 'Mayan EDMS',
  intro:
    'Le portail règle l’indexation, les durées de conservation et les circuits de validation. La consultation et le classement des documents se font dans Mayan.',
  horsPerimetre: [
    { quoi: 'Consulter, annoter ou classer un document', ou: 'dans Mayan EDMS, via le bouton Ouvrir' },
    { quoi: 'Définir un type de document et ses métadonnées', ou: 'dans l’administration Mayan' },
    { quoi: 'Restaurer un document supprimé', ou: 'onglet Sauvegarde de ce service' },
  ],
  sections: [
    {
      titre: 'Indexation et reconnaissance de texte',
      phrase:
        'Un document non reconnu est un document introuvable. L’OCR est ce qui distingue une GED d’un dossier partagé.',
      champs: [
        {
          cle: 'ocrLangues',
          type: 'liste',
          libelle: 'Langues reconnues',
          aide: 'Chaque langue ajoutée allonge légèrement le traitement. Le français couvre la majorité des cas ivoiriens.',
          valeurs: ['français', 'anglais'],
          placeholder: 'langue',
        },
        {
          cle: 'ocrAutomatique',
          type: 'bascule',
          libelle: 'Reconnaissance dès le dépôt',
          aide: 'Le document est indexé avant d’être proposé à la recherche. Un dépôt massif peut alors prendre plusieurs minutes.',
          valeur: true,
        },
        {
          cle: 'metadonneesObligatoires',
          type: 'liste',
          libelle: 'Métadonnées obligatoires',
          aide: 'Un document sans ces champs reste en brouillon et n’entre pas dans le circuit de validation.',
          valeurs: ['type de pièce', 'date', 'tiers concerné'],
          placeholder: 'métadonnée',
        },
        {
          cle: 'formatsAcceptes',
          type: 'liste',
          libelle: 'Formats acceptés',
          aide: 'Les formats propriétaires sont convertis en PDF/A à l’archivage, pour rester lisibles dans dix ans.',
          valeurs: ['PDF', 'PDF/A', 'JPEG', 'TIFF', 'DOCX', 'XLSX'],
          placeholder: 'format',
        },
      ],
    },
    {
      titre: 'Conservation réglementaire',
      phrase:
        'La durée légale prime sur toute demande de suppression : c’est ce que garantit le coffre WORM.',
      champs: [
        {
          cle: 'dureeConservationAns',
          type: 'nombre',
          libelle: 'Durée de conservation par défaut',
          aide: 'Applicable aux pièces comptables et contractuelles. Un type de document peut porter sa propre durée, plus longue.',
          valeur: 10,
          unite: 'ans',
          min: 1,
          max: 30,
        },
        {
          cle: 'coffreWorm',
          type: 'bascule',
          libelle: 'Coffre WORM',
          aide: 'Une fois écrit, un document du coffre ne peut plus être modifié ni supprimé, même par un administrateur, même par nous.',
          valeur: true,
          effet: 'immediat',
        },
        {
          cle: 'suppressionAvantEcheance',
          type: 'choix',
          libelle: 'Suppression avant l’échéance légale',
          aide: 'Le cas se présente sur une demande d’effacement. Il faut décider à l’avance qui tranche.',
          valeur: 'validation_double',
          options: [
            { valeur: 'interdite', libelle: 'Interdite' },
            { valeur: 'validation_double', libelle: 'Double validation', detail: 'Deux administrateurs distincts' },
            { valeur: 'admin', libelle: 'Un administrateur suffit' },
          ],
        },
        {
          cle: 'signatureElectronique',
          type: 'bascule',
          libelle: 'Signature électronique',
          aide: 'Signature au format PAdES, vérifiable hors de la plateforme. L’horodatage est fourni par un tiers de confiance.',
          valeur: false,
          verrouille: 'Disponible à partir du palier Entreprise.',
        },
      ],
    },
    {
      titre: 'Circuits de validation',
      phrase: 'Qui valide quoi, dans quel ordre, et ce qui se passe en cas de silence.',
      champs: [
        {
          cle: 'circuits',
          type: 'liste',
          libelle: 'Circuits actifs',
          aide: 'Chaque circuit enchaîne des étapes de validation par groupe de l’annuaire.',
          valeurs: ['Facture fournisseur', 'Contrat client', 'Note de frais'],
          placeholder: 'nom du circuit',
        },
        {
          cle: 'delaiValidationJours',
          type: 'nombre',
          libelle: 'Délai avant relance',
          aide: 'Un valideur silencieux est relancé, puis son supérieur est informé. Sans cela, les circuits s’arrêtent en silence.',
          valeur: 3,
          unite: 'jours',
          min: 1,
          max: 30,
        },
        {
          cle: 'delegationAbsence',
          type: 'bascule',
          libelle: 'Délégation automatique en cas d’absence',
          aide: 'S’appuie sur l’absence déclarée dans l’agenda. Évite le blocage d’un circuit pendant les congés.',
          valeur: true,
        },
      ],
    },
  ],
}
