# API Synelia Cloud — contrat backend

`openapi.json` décrit **tout ce que le portail attend du backend** : 414 opérations
sur 279 chemins, 215 schémas. Le fichier est un document OpenAPI 3.1 valide,
directement exploitable par Swagger UI, Redoc, ou un générateur de client.

Le backend est à construire séparément : cette spécification ne présume rien de
l'implémentation. Les hyperviseurs, l'orchestrateur, l'annuaire et les solutions
open source du marketplace restent derrière ces points d'entrée.

## Lire la spécification

```bash
# Swagger UI
npx --yes @redocly/cli preview-docs docs/api/openapi.json

# ou simplement déposer le fichier sur https://editor.swagger.io
```

## Conventions

| Sujet | Règle |
| --- | --- |
| Base | `/v1`, réponses en `application/json; charset=utf-8` |
| Langue | Champs et libellés en français, comme `src/lib/types.ts`. Les `message` d'erreur sont affichables tels quels |
| Montants | Entiers en FCFA (XOF), hors taxes. La TVA à 18 % est appliquée par le portail |
| Dates | ISO 8601 en UTC |
| Collections | Enveloppe `{ donnees, pagination }` · paramètres `page`, `parPage`, `tri`, `ordre`, `q` |
| Ressource unique | Objet à la racine, sans enveloppe |
| Opérations longues | `202` + `ProvisioningJob`, suivi par `GET /jobs/{jobId}` |
| Erreurs | `{ erreur: { code, message, correlationId } }` — le `correlationId` est toujours présent |
| Secrets | Mots de passe, clés privées et jetons ne sont retournés qu'à la création |

## Périmètres

- **`/**`** — espace client. L'access token porte l'organisation active ; toute
  collection est implicitement filtrée sur elle. `GET /vms` ne retourne jamais
  les machines d'un autre tenant.
- **`/admin/**`** — espace fournisseur, réservé aux rôles `provider_admin`,
  `provider_operator` et `reseller_admin`. Voit toutes les organisations.
- **`/public/**`** — vitrine, sans authentification.

## Autorisations

Chaque opération soumise à la matrice RBAC porte l'extension `x-rbac` avec
l'identifiant d'action de `src/lib/rbac.ts` (ex. `vm.create_delete`). Un refus
retourne `403` avec `roleRequis` : le portail **désactive** l'action et nomme le
rôle attendu, il ne masque pas le bouton. Tout refus est journalisé dans l'audit.

`GET /rbac/matrice` sert la matrice complète, `GET /moi` les permissions
effectives de la session.

## Ce que l'API ne fait pas

Conformément à la règle §0.2, le portail ne réimplémente aucun produit externe :
ni webmail, ni explorateur de fichiers, ni écran métier ERP, ni éditeur de
contenu CMS, ni constructeur de requêtes de journaux. L'API expose donc :

- des points d'entrée d'**ouverture** — `POST /services/{id}/ouverture` retourne
  une URL SSO à usage unique vers l'interface d'origine de la solution ;
- des **liens de sortie** (`LiensSortie`) vers Centreon, Grafana et
  VictoriaLogs, plutôt que leur contenu ;
- une **observabilité encadrée** : séries de métriques, événements et aperçu de
  journal borné, ce qu'exigent les seuls composants autorisés côté portail.

## Groupes d'opérations

| Groupe | Op. | Couvre |
| --- | --: | --- |
| Authentification | 17 | Mot de passe, découverte et callback SSO, MFA, inscription, invitations, contexte |
| Organisation & membres | 17 | Membres, rôles et périmètres, invitations, fédération, matrice RBAC |
| Espaces Cloud | 8 | Quotas, plage réseau, placement sur backends, consommation |
| Calcul | 12 | VM, matériel virtuel, alimentation, console, migration, instantanés, gabarits |
| Kubernetes | 10 | Plan de contrôle, pools, modules, montée de version, kubeconfig |
| Réseau | 37 | Réseaux, IP publiques, groupes de sécurité, VPN, load balancers, certificats |
| Stockage | 16 | Volumes, buckets S3, clés d'accès |
| Bases de données | 8 | Bases managées, identifiants, restauration à un instant donné |
| Sauvegarde & PRA | 22 | Plans, points de restauration, conformité 3-2-1, bascules |
| Plateforme applicative | 32 | Applications, environnements, composants, secrets, déploiements, anomalies |
| Projets applicatifs | 23 | Projets, services typés, variables, zone applicative, domaines |
| Bibliothèque de modèles | 3 | Modèles prêts à déployer, estimation de coût |
| Marketplace | 25 | Catalogue, souscription, dimensionnement, SSO, sièges, versions, réversibilité |
| Web Cloud | 37 | Hébergement, sites, bases, comptes de transfert, tâches, services partagés |
| Domaines & DNS | 19 | Achat, transfert, zones, enregistrements, modèles, contrôles |
| Relais SMTP | 11 | Clés, quotas, réputation, journal, webhooks, SPF/DKIM/DMARC |
| Facturation | 20 | Offres, souscriptions, factures, devis, paiements, showback |
| Support | 10 | Tickets, SLA et crédits, base de connaissance |
| Observabilité | 8 | Métriques, événements, aperçu de journal, règles d'alerte |
| Audit & jobs | 8 | Journal d'audit, attestations, exports, suivi des jobs |
| Tableaux de bord | 4 | Agrégats client, recherche globale, prise en main |
| Fournisseur — pilotage | 6 | Tableau de bord plateforme, organisations, assistance |
| Fournisseur — capacité | 11 | Backends, saturation, sites, santé, migrations |
| Fournisseur — parc & catalogue | 12 | Parc d'instances, campagnes de MAJ, offres, catalogue |
| Fournisseur — revendeurs | 6 | Marque blanche, grilles, revenus partagés |
| Fournisseur — finance | 9 | Cycles de facturation, impayés, marges, tickets, demandes |
| Fournisseur — équipe & conformité | 12 | Équipe, élévation, conformité, audit, statut publié |
| Vitrine | 11 | Statut, tarifs, simulateur, fiches produit, contenus, demandes |

## Correspondance avec le portail

Les schémas reprennent nom pour nom les interfaces de `src/lib/types.ts`
(`EspaceCloud`, `VM`, `ServiceProjet`, `ManagedService`, `WebHosting`,
`Deployment`, `Ticket`, `AuditEvent`, `ProvisioningJob`…) et des modèles annexes
de `src/lib/mock` (`ModeleApplicatif`, `InstanceParc`, `CampagneMaj`, `Anomalie`,
`MembreEquipe`) ainsi que `ConfigurationService` de `src/lib/configurations`.

Une fois le backend en place, les collections de `src/lib/mock` se remplacent
donc par des appels, sans toucher aux écrans.
