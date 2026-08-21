# Contrat d'API — Synelia Cloud

`docs/openapi.json` décrit l'API que le backend doit servir pour que cette
interface fonctionne sans données fictives. **474 opérations, 333 chemins, 193
schémas**, OpenAPI 3.0.3.

Le fichier est **généré** : il ne s'édite pas à la main.

```
node outils/openapi/index.mjs        # écrit docs/openapi.json
bun run api:spec                     # même chose
bunx @redocly/cli lint docs/openapi.json
bunx openapi-typescript docs/openapi.json -o src/lib/api/types.d.ts
```

Le générateur refuse d'écrire un document incohérent : référence morte,
`operationId` en doublon, paramètre de chemin non déclaré, `GET` avec corps.
Une erreur au moment de générer vaut mieux qu'un client généré qui compile et
ne marche pas.

## Où se trouve quoi

| Fichier | Contenu |
|---|---|
| `outils/openapi/socle.mjs` | fabriques de schémas, paramètres et réponses communs, fabrique d'opérations, gabarit CRUD |
| `outils/openapi/schemas-socle.mjs` | erreurs, enveloppes, identité, IaaS, protection |
| `outils/openapi/schemas-produits.mjs` | applicatif, projets, services managés, Web Cloud, commerce, exploitation |
| `outils/openapi/chemins-*.mjs` | les chemins, par domaine |
| `outils/openapi/index.mjs` | assemblage, vérifications, écriture |

Les noms de champs des ressources reprennent **exactement** ceux de
`src/lib/types.ts`. L'interface les consomme tels quels : renommer un champ
dans le contrat, c'est casser un écran.

## Conventions à implémenter

**Authentification.** `Authorization: Bearer <jeton>` pour une session
utilisateur, `X-Api-Key` pour un accès machine. Une clé d'API ne peut jamais
dépasser les droits du rôle qui l'a émise.

**Multi-tenant.** L'organisation vient du jeton. `X-Organisation-Id` la
remplace quand l'utilisateur appartient à plusieurs organisations et bascule
depuis le sélecteur de la barre supérieure.

**Pagination.** `page` et `parPage` (25 par défaut, 200 au plus), plus `tri` et
`q`. Réponse : `{ donnees, pagination }`.

**Asynchrone.** Toute opération de provisioning répond `202` avec un
`TravailProvisioning` : une liste de tâches ordonnées, chacune avec son statut.
Un échec nomme la tâche fautive, il ne dit pas « erreur ». C'est ce que suit
l'écran `/app/taches/{id}`.

**Actions destructives.** Paramètre `confirmation` obligatoire, valant le nom
exact de la ressource. Un écart renvoie `422` **sans rien détruire**.

**Actions facturables.** `POST /facturation/estimation` renvoie l'aperçu de
coût (`CostPreview`) attendu avant l'engagement. Le simulateur public passe par
`POST /public/simulateur` et partage le même moteur.

**Droits.** Chaque opération porte `x-rbac`, l'identifiant de son action dans la
matrice de `src/lib/rbac.ts`. Un refus renvoie `403` avec `rolesRequis` :
l'interface désactive l'action et nomme le rôle requis, elle ne la masque pas.
`GET /rbac/matrice` sert la matrice complète pour que le client sache quoi
désactiver avant d'essayer.

**Erreurs.** Forme unique, toujours avec un `correlationId` — affiché et
copiable sur chaque écran d'erreur.

**Intégration amont en défaut.** `424` avec `integration`, `donneesPartielles`
et `dateDonnees` : l'écran passe en état dégradé daté plutôt qu'en page vide.
Concerne Centreon, Grafana, VictoriaLogs, les socles de virtualisation, les
registres de domaines et les passerelles de paiement.

**Montants.** Entiers en FCFA (XOF). `devise` accompagne tout montant
convertible.

**Langue.** `Accept-Language` gouverne les libellés (`fr` par défaut, `en`
prévu), jamais les clés ni les codes.

## Répartition des opérations

| Domaine | Opérations |
|---|---|
| Authentification, compte, organisations, membres, sécurité, audit | 58 |
| Tableau de bord et travaux de provisioning | 5 |
| IaaS — espaces, machines, Kubernetes, réseau, stockage, bases | 102 |
| Sauvegarde et PRA | 18 |
| Plateforme applicative — applications, déploiements, projets, modèles | 62 |
| Observabilité | 9 |
| Services managés | 19 |
| Web Cloud — domaines, hébergement, applications, bases, emails, drive, SSL, sauvegarde, SMTP | 95 |
| Facturation, support, documentation | 32 |
| Espace fournisseur | 58 |
| Vitrine publique | 16 |

Verbes : 194 `GET`, 155 `POST`, 50 `DELETE`, 47 `PATCH`, 28 `PUT`.

## Ce que le contrat ne fait pas, volontairement

Le portail **ne réimplémente jamais l'écran principal d'un produit amont**.
Aucun point d'entrée ne lit un courriel, ne liste les objets d'un bucket, ne
parcourt les fichiers d'un drive, n'ouvre une console SQL ni ne construit une
requête de journaux. L'API provisionne, dimensionne, sauvegarde, supervise, et
**ouvre la porte** : `POST /services/{id}/ouverture` renvoie un rebond SSO vers
l'interface d'origine de la solution, et c'est là que le travail se fait.

L'observabilité est bornée à quatre formats — `Tuile`, `Serie` (fenêtres `24h`,
`7j`, `30j` uniquement), liste d'événements (huit lignes), `ExtraitLogs` (vingt
lignes) — plus les liens de sortie (`LiensSortie`) vers Centreon, Grafana et
VictoriaLogs. Un backend n'a donc pas à servir de moteur de requêtes.

Les bases d'hébergement mutualisé n'ont **aucun accès distant** : `hoteInterne`
est une boucle locale. C'est une propriété de l'offre, pas un réglage — il n'y a
volontairement pas de point d'entrée pour l'ouvrir.

Un domaine est attaché à **un serveur et à un seul** :
`POST /web/hebergements/{id}/attachement-domaine` refuse (`409`) un nom déjà
attaché ailleurs, et `GET /web/domaines/{id}` renvoie tout ce qui concerne le
nom en une réponse — hébergement, zone, messagerie, drive, certificats, sites.

## Écarts connus

- Le serveur de développement (`http://localhost:4000/v1`) déclenche un
  avertissement `no-server-example.com` chez Redocly. Il est conservé : il sert
  au branchement local de l'interface.
- Les téléversements passent par du base64 en JSON
  (`POST /support/pieces`), pas par `multipart/form-data` : un seul format de
  corps dans tout le contrat simplifie les clients générés. À revoir si des
  pièces lourdes apparaissent.
