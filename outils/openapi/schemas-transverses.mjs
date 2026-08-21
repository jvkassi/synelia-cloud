/**
 * Schémas — capacités transverses reprises du contrat rédigé sur `main` :
 * recherche globale, copilote, onboarding, anomalies, attestations, prospects,
 * contenus publics, versions de service, clés et webhooks SMTP.
 *
 * Elles existent dans la maquette (`recherche.tsx`, `onboarding.tsx`,
 * `ANOMALIES`, `PAGES_LEGALES`, `CONTRAT_INTEGRATION`…) : les décrire évite que
 * le backend découvre après coup un écran sans point d'entrée.
 */

import {
  ROLES,
  SITES,
  booleen,
  chaine,
  entier,
  horodatage,
  jour,
  liste,
  montant,
  nombre,
  objet,
  pourcentage,
  ref,
  tableau,
} from './socle.mjs'

export const schemasTransverses = {
  ResultatRecherche: objet(
    {
      type: chaine('`vm`, `espace`, `projet`, `service`, `domaine`, `hebergement`, `ticket`, `facture`, `modele`, `article`…'),
      id: chaine(),
      libelle: chaine(),
      contexte: chaine('Où la ressource se trouve : espace, projet, domaine.'),
      href: chaine('Route de l’interface qui l’affiche.'),
      site: liste(SITES),
      statut: chaine(),
      score: nombre(),
    },
    ['type', 'id', 'libelle', 'href'],
    'Entrée de la recherche globale de la barre supérieure.',
  ),

  QuestionCopilote: objet(
    {
      question: chaine(),
      contexte: objet(
        { route: chaine(), ressourceId: chaine(), espaceId: chaine() },
        [],
        'Écran depuis lequel la question est posée, pour ancrer la réponse.',
      ),
    },
    ['question'],
  ),

  ReponseCopilote: objet(
    {
      reponse: chaine('Texte affichable, en français.'),
      sources: tableau(
        objet({ titre: chaine(), url: chaine(), type: liste(['documentation', 'article', 'contrat']) }, [
          'titre',
          'url',
        ]),
      ),
      actionsProposees: tableau(
        objet(
          {
            libelle: chaine(),
            href: chaine(),
            actionRbac: chaine('Le client désactive l’action quand le rôle ne la permet pas.'),
          },
          ['libelle'],
        ),
      ),
      suggestions: tableau(chaine(), 'Questions suivantes proposées.'),
      horsPerimetre: booleen(
        'Vrai quand la question porte sur l’intérieur d’un produit amont : le copilote renvoie ' +
          'vers la solution plutôt que d’inventer une réponse.',
      ),
    },
    ['reponse'],
  ),

  Onboarding: objet(
    {
      termine: booleen(),
      masque: booleen('L’utilisateur a demandé à ne plus voir le guide.'),
      etapes: tableau(
        objet(
          {
            cle: chaine(),
            libelle: chaine(),
            description: chaine(),
            faite: booleen(),
            href: chaine(),
            actionRbac: chaine(),
            obligatoire: booleen(),
          },
          ['cle', 'libelle', 'faite'],
        ),
      ),
      pctComplete: pourcentage(),
    },
    ['termine', 'etapes', 'pctComplete'],
    'Guide de démarrage de l’organisation : ce qui reste à faire pour être opérationnel.',
  ),

  Anomalie: objet(
    {
      id: chaine(),
      detecteeLe: horodatage(),
      gravite: liste(['critique', 'majeure', 'mineure']),
      portee: objet(
        { type: chaine(), id: chaine(), libelle: chaine() },
        ['type', 'libelle'],
      ),
      titre: chaine(),
      constat: chaine('Ce qui a été observé, avec les chiffres.'),
      consequence: chaine('Ce que cela produit si rien n’est fait.'),
      correctif: objet(
        {
          libelle: chaine(),
          action: chaine('Identifiant du correctif à passer à `POST /anomalies/{id}/correctif`.'),
          automatisable: booleen(),
          actionRbac: chaine(),
          impact: chaine('Coupure ou surcoût attendu, dit franchement.'),
        },
        ['libelle', 'action', 'automatisable'],
      ),
      statut: liste(['ouverte', 'en_cours', 'corrigee', 'ignoree']),
      ignoreeJusquau: horodatage(),
    },
    ['id', 'detecteeLe', 'gravite', 'portee', 'titre', 'constat', 'consequence', 'statut'],
    'Écart relevé par la plateforme — ressource sans sauvegarde, certificat qui expire, ' +
      'quota bientôt atteint, socle en sortie encore utilisé.',
  ),

  DecisionAnomalie: objet(
    {
      decision: liste(['appliquer', 'ignorer', 'reouvrir']),
      jusquau: horodatage('Durée de l’exemption quand la décision est `ignorer`.'),
      motif: chaine(),
      fenetre: horodatage('Fenêtre d’application quand le correctif coupe le service.'),
    },
    ['decision'],
  ),

  Attestation: objet(
    {
      id: chaine(),
      type: liste(
        ['hebergement', 'sauvegarde', 'conformite_321', 'souverainete', 'disponibilite', 'reversibilite'],
        'Document qu’un client présente à un tiers — auditeur, banque, bailleur.',
      ),
      titre: chaine(),
      description: chaine(),
      periode: chaine(),
      genereLe: horodatage(),
      url: chaine(),
      empreinte: chaine('Empreinte du document, pour vérification par le tiers.'),
      signataire: chaine(),
      disponible: booleen(),
      motifIndisponible: chaine('Ce qui manque pour pouvoir l’émettre.'),
    },
    ['id', 'type', 'titre', 'disponible'],
  ),

  Lead: objet(
    {
      id: chaine(),
      recuLe: horodatage(),
      origine: liste(['contact', 'devis', 'simulateur', 'partenaires', 'entreprises', 'statut']),
      nom: chaine(),
      email: chaine(),
      telephone: chaine(),
      organisation: chaine(),
      taille: chaine(),
      secteur: chaine(),
      message: chaine(),
      configurationSimulee: ref('EstimationCout'),
      statut: liste(['nouveau', 'contacte', 'qualifie', 'devis_envoye', 'gagne', 'perdu']),
      assigneA: chaine(),
      notes: tableau(objet({ date: horodatage(), auteur: chaine(), texte: chaine() }, ['date', 'auteur', 'texte'])),
    },
    ['id', 'recuLe', 'origine', 'nom', 'email', 'statut'],
    'Demande entrante de la vitrine, côté fournisseur.',
  ),

  PageLegale: objet(
    {
      slug: chaine(),
      titre: chaine(),
      miseAJour: jour(),
      contenuMarkdown: chaine(),
      version: chaine(),
    },
    ['slug', 'titre', 'miseAJour', 'contenuMarkdown'],
  ),

  Referentiels: objet(
    {
      pays: tableau(objet({ code: chaine(), nom: chaine(), indicatif: chaine() }, ['code', 'nom'])),
      secteurs: tableau(chaine()),
      taillesOrganisation: tableau(chaine()),
      sites: tableau(
        objet({ code: liste(SITES), libelle: chaine(), ville: chaine() }, ['code', 'libelle']),
      ),
      devises: tableau(chaine()),
      roles: tableau(objet({ code: liste(ROLES), libelle: chaine() }, ['code', 'libelle'])),
      moyensPaiement: tableau(objet({ code: chaine(), libelle: chaine() }, ['code', 'libelle'])),
    },
    ['pays', 'secteurs', 'sites'],
    'Listes de référence des formulaires — évite de les figer dans le client.',
  ),

  ContratIntegration: objet(
    {
      capacites: tableau(
        objet(
          { num: entier(), capacite: chaine(), ecran: chaine(), disponible: booleen() },
          ['num', 'capacite', 'ecran'],
        ),
        'Ce que la plateforme garantit pour tout service intégré au catalogue.',
      ),
      prerequisSolution: tableau(chaine()),
      delaiIntegration: chaine(),
    },
    ['capacites'],
  ),

  BrancheDepot: objet(
    {
      nom: chaine(),
      dernierCommit: objet(
        { sha: chaine(), message: chaine(), auteur: chaine(), date: horodatage() },
        ['sha', 'message', 'date'],
      ),
      defaut: booleen(),
      protegee: booleen(),
    },
    ['nom', 'defaut'],
  ),

  InstantaneVm: objet(
    {
      id: chaine(),
      vmId: chaine(),
      nom: chaine(),
      cree: horodatage(),
      tailleGo: nombre(),
      avecMemoire: booleen(),
      description: chaine(),
      expire: horodatage('Un instantané n’est pas une sauvegarde : sa durée de vie est bornée.'),
    },
    ['id', 'vmId', 'nom', 'cree', 'tailleGo', 'avecMemoire'],
  ),

  Restauration: objet(
    {
      id: chaine(),
      pointId: chaine(),
      ressourceNom: chaine(),
      granularite: chaine(),
      cible: chaine(),
      demandeePar: chaine(),
      demandeeLe: horodatage(),
      statut: liste(['queued', 'running', 'done', 'failed', 'rolled_back']),
      travailId: chaine(),
      dureeMin: entier(),
      elements: tableau(chaine()),
    },
    ['id', 'pointId', 'ressourceNom', 'granularite', 'demandeeLe', 'statut'],
  ),

  VersionService: objet(
    {
      version: chaine(),
      publieeLe: jour(),
      statut: liste(['courante', 'disponible', 'depreciee', 'retiree']),
      notesUrl: chaine(),
      notes: chaine(),
      rupture: booleen('Version qui casse une compatibilité : la migration n’est pas transparente.'),
      dureeIndisponibiliteMin: entier(),
      rollbackPossible: booleen(),
      installeeLe: horodatage(),
    },
    ['version', 'statut'],
  ),

  ExportService: objet(
    {
      id: chaine(),
      serviceId: chaine(),
      format: chaine(),
      perimetre: tableau(chaine()),
      demandeLe: horodatage(),
      statut: liste(['en_cours', 'pret', 'expire', 'echec']),
      tailleGo: nombre(),
      url: chaine(),
      expire: horodatage(),
      empreinte: chaine(),
    },
    ['id', 'serviceId', 'format', 'demandeLe', 'statut'],
    'Trace des exports de réversibilité : ce qui a été sorti, quand, et jusqu’à quand c’est récupérable.',
  ),

  MiseAJourSite: objet(
    {
      composant: chaine(),
      type: liste(['coeur', 'extension', 'theme', 'traduction']),
      versionInstallee: chaine(),
      versionDisponible: chaine(),
      securite: booleen('Correctif de sécurité : à appliquer sans attendre la fenêtre habituelle.'),
      notesUrl: chaine(),
      compatibilitePhp: chaine(),
    },
    ['composant', 'type', 'versionInstallee', 'versionDisponible', 'securite'],
  ),

  CleSmtp: objet(
    {
      id: chaine(),
      nom: chaine(),
      identifiant: chaine(),
      domainesAutorises: tableau(chaine()),
      quotaJour: entier(),
      utiliseJour: entier(),
      creeeLe: horodatage(),
      derniereUtilisation: horodatage(),
      statut: liste(['active', 'suspendue', 'revoquee']),
    },
    ['id', 'nom', 'identifiant', 'creeeLe', 'statut'],
    'Une clé par application émettrice : révoquer celle qui fuit sans couper les autres.',
  ),

  CleSmtpCreation: objet(
    {
      nom: chaine(),
      domainesAutorises: tableau(chaine()),
      quotaJour: entier(),
    },
    ['nom'],
  ),

  CleSmtpSecret: objet(
    {
      cle: ref('CleSmtp'),
      hote: chaine(),
      ports: tableau(entier()),
      motDePasse: chaine('Renvoyé une seule fois.'),
    },
    ['cle', 'hote', 'motDePasse'],
  ),

  WebhookSmtp: objet(
    {
      id: chaine(),
      url: chaine(),
      evenements: tableau(liste(['remis', 'differe', 'rebond', 'rejete', 'plainte'])),
      actif: booleen(),
      secretDefini: booleen(),
      dernierEnvoi: horodatage(),
      dernierCode: entier(),
      echecsConsecutifs: entier(),
    },
    ['id', 'url', 'evenements', 'actif'],
  ),

  WebhookSmtpCreation: objet(
    {
      url: chaine(),
      evenements: tableau(liste(['remis', 'differe', 'rebond', 'rejete', 'plainte'])),
      secret: chaine(),
      actif: booleen(),
    },
    ['url', 'evenements'],
  ),

  CycleFacturation: objet(
    {
      id: chaine(),
      periode: chaine(),
      lanceLe: horodatage(),
      statut: liste(['en_cours', 'termine', 'echec', 'partiel']),
      organisations: entier(),
      facturesEmises: entier(),
      montantTotal: montant(),
      echecs: tableau(objet({ orgId: chaine(), motif: chaine() }, ['orgId', 'motif'])),
    },
    ['id', 'periode', 'lanceLe', 'statut', 'organisations'],
  ),

  ReclamationCredit: objet(
    {
      periode: chaine(),
      composant: chaine(),
      motif: chaine(),
      incidentsCites: tableau(chaine()),
    },
    ['periode', 'composant', 'motif'],
    'Réclamation d’un crédit SLA non appliqué automatiquement.',
  ),

  FenetrePatching: objet(
    {
      id: chaine(),
      libelle: chaine(),
      perimetre: chaine('Socles, images ou services couverts.'),
      debut: horodatage(),
      dureeMin: entier(),
      recurrence: chaine(),
      impactClient: chaine(),
      organisationsNotifiees: entier(),
      statut: liste(['planifiee', 'en_cours', 'terminee', 'annulee']),
    },
    ['id', 'libelle', 'perimetre', 'debut', 'dureeMin', 'statut'],
  ),

  Elevation: objet(
    {
      id: chaine(),
      qui: chaine(),
      quand: horodatage(),
      duree: chaine('Durée accordée, telle qu’affichée : `4 h`, `30 min`.'),
      motif: chaine(),
      actif: booleen(),
      membreId: chaine(),
      role: liste(ROLES),
      ticketId: chaine(),
      expire: horodatage(),
      accordePar: chaine(),
      actionsJournalisees: entier(),
    },
    ['id', 'qui', 'quand', 'duree', 'motif', 'actif'],
    'Élévation temporaire d’un membre de l’équipe : bornée dans le temps, motivée, et tracée.',
  ),

}
