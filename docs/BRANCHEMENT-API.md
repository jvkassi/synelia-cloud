# Branchement API — vague 1 : la couture données

Quand `NEXT_PUBLIC_API_URL` est renseignée (`.env.local`), l’interface parle au
backend FastAPI ; sans elle, tout vient de `src/lib/mock/` comme avant. Les
deux modes partagent les mêmes écrans : seule la provenance des données change.

```bash
# Backend (une fois, en fond)
cd /var/lib/synelia-cloud/synelia-cloud-backend \
  && export PATH="$HOME/.local/bin:$PATH" \
  && nohup uv run synelia api --port 4000 > /tmp/api.log 2>&1 &
# Interface branchée
echo 'NEXT_PUBLIC_API_URL=http://localhost:4000/v1' > .env.local
bun run dev --port 3111
# Compte de démonstration : admin@synelia.cloud / Synelia!2026
```

## Comment marche la couture

| Couche | Fichier | Rôle |
|---|---|---|
| Transport | `src/lib/api/client.ts` | `fetch` (Bearer + `X-Organisation-Id`, JSON), session `localStorage`, `ApiError` depuis `{ erreur }`, un rafraîchissement sur `401` via `/auth/rafraichir`, `estActif()`, `lister/créer/modifier/supprimerRessource`, `suivreTravail` (sonde `/travaux/{id}` toutes les 1,5 s) |
| Registre | `src/lib/api/collections.ts` | clé de `useCollection` → endpoint (`vms` → `/vms`, `clusters` → `/kubernetes`, `tunnels` → `/vpn`, `volumes` → `/volumes`, `drives` → `/web/drive`…). Motif à suffixe : `snapshots-<vmId>` → `/vms/<vmId>/instantanes`. Les autres clés à suffixe (`elevations-<id>`, `objets-<id>`…) et les inconnues : pas d’entrée, la graine est gardée |
| État | `src/components/app/atelier.tsx` | `useCollection` charge `GET {endpoint}?parPage=200` dans un effet (la graine reste affichée jusque-là : pas de divergence d’hydratation), expose `chargement`/`erreur`/`recharger` ; les mutations appellent l’API (`POST`, `PATCH {id}`, `DELETE {id}?confirmation=<nom exact>`) puis rechargent. `integrerTravail` fond un `TravailProvisioning` dans la collection des jobs pour le centre de tâches |
| Opérations | `src/components/app/actions.tsx` | `useOperation` accepte `appel: () => Promise<unknown>` : en mode API il l’exécute, suit un éventuel travail via `suivreTravail` (toasts de fin/échec avec `correlationId`), et traduit `ApiError` en toast (`rolesRequis` sur `403`, `champs` sur `422`). Sans `appel`, le chemin maquette est inchangé |
| Session | `src/components/app/contexte.tsx` | en mode API : réhydratation `localStorage`, permissions depuis `/moi` (`autorise()` les consulte, jamais la matrice locale), organisations et `changerOrganisation()` (`X-Organisation-Id` immédiat + `PUT /moi/organisation-active`), `deconnecter()` (`POST /auth/deconnexion`), `GardeAuth` (`/app/**` et `/admin/**` → `/login` sans session). `useEspace()` lit la collection (repli : le plus ancien `createdAt`, jamais le dernier créé qui est vide) et le choix est persisté (`synelia.espace`) |
| Entrée | `src/app/(auth)/login/` | `formulaire-connexion.tsx` : mot de passe + MFA (`/auth/connexion` → `/auth/mfa`), session stockée, redirection `/app`. La page serveur choisit le parcours selon la même variable (pas de bascule à l’hydratation) |
| Recherche | `src/components/app/recherche.tsx` | en mode API, dès qu’une requête est saisie, `GET /recherche?q=` (anti-rebond 250 ms) remplace l’index local ; à vide, les raccourcis locaux restent |
| Onboarding | `src/components/app/onboarding.tsx` | en mode API, `GET /onboarding` masque le panneau quand le backend le dit (`termine`/`masque`), et « Ne plus afficher » rejoue `PATCH { masque: true }` |

Les jobs (`jobs`, `jobs-plateforme`) se rechargent en plus toutes les 10 s :
une opération lancée ailleurs avance dans le centre de tâches sans rechargement.

Le cache distant est partagé par clé (`CACHE_DISTANT` dans `atelier.tsx`) :
plusieurs `useCollection` montés ensemble ne déclenchent qu’une requête
(les chargements simultanés partagent la même promesse), le cache sert
immédiatement puis se réactualise en fond. `recharger()` force la relecture —
chaque `effetFinal` branché le fait après l’appel réel.

En mode API avec `appel`, `useOperation` ne rejoue **pas** `effet` (la
collection distante `POST`/`PATCH` à nouveau : la mutation serait doublée).
`effet` reste le chemin maquette, `effetFinal` la réconciliation commune
(`recharger()`, navigation). `job` reste simulé uniquement sans `appel`.

`DELETE` confirme avec le champ exact relevé des `exiger_confirmation` du
backend (`champConfirmation()` dans `collections.ts`) : `code` pour un espace,
`adresse` pour une IP, `cible` pour une alerte, `hote`/`domaine`/`domaineProvisoire`/`resourceNom`
côté Web Cloud et sauvegarde. `supprimer(id, confirmation?)` accepte une
valeur explicite quand la collection ne la porte pas (courriel d’un membre).

## Brancher une page

1. Lecture : rien à faire si elle utilise `useCollection` avec une clé du
   registre — vérifier le filtre (périmètre par `id`, pas par objet figé).
2. Écriture : ajouter `appel` à l’opération `useOperation` (ou à
   `BoutonAction`/`BoutonFormulaire` via `operation()`), avec `effetFinal`
   qui `recharger()` la collection. Garder `effet`/`job` pour le mode
   maquette derrière `if (estActif()) … else …` (exemple :
   `src/app/app/espaces/new/page.tsx`).
3. Vérifier : `bun run typecheck && bun run lint && bun run build`, avec et
   sans `.env.local`.

## Vérifié en direct (2026-09-04)

`bun run dev --port 3111` + backend local, scénario Playwright (Chromium
système) : login démo → `/app` (12/12) ; `/app/vms` affiche `web-01`, `db-01`
du backend ; `/app/espaces` affiche `demo-abj` puis l’espace créé ; création
UI (`/app/espaces/new`) → `202`, travail à 5 étapes suivi jusqu’à `done`,
visible dans `/app/taches` ; visite sans session → `/login`. Mode maquette
(port sans `.env.local`) : zéro appel backend, données fictives inchangées.

## Vague 2 — mutations branchées (vérifié 2026-09-05, 23/23 verts)

Scénario `/tmp/w2-verif.mjs` (Chromium système, backend local) :

- VM : création par l’assistant UI (`POST /vms/lot` → `202`, la taille par
  défaut 2×4 vCPU répond `402` — quota, le toast porte le motif) ; arrêt et
  démarrage depuis la fiche (`POST /vms/{id}/arret|demarrage|redemarrage`) ;
  redimensionnement (`POST …/redimensionnement`) ; snapshot
  (`POST …/instantanes { nom }`), restauration (`POST …/instantanes/{id}`),
  suppression (`DELETE …/instantanes/{id}`, sans confirmation) ; suppression
  de la machine (`DELETE /vms/{id}?confirmation=<nom>`, 404 après) ;
  migration (`POST …/migration { site }`).
- Volumes : création UI (`POST /volumes` → `202` + travail suivi) ; extension
  (`POST …/extension { tailleGo }`) ; attachement (`PUT …/attachement
  { vmId, montage }` → `202`) et détachement (`DELETE`, `204` après le job) ;
  suppression (`204`).
- Membres : invitation UI (`POST /invitations` → `201`), relance (`POST
  …/relance`), révocation (`DELETE`, sans confirmation), changement de rôle
  (`PATCH /membres/{id} { role }`), retrait (`DELETE …?confirmation=<email>`),
  attribution (`POST /membres`).
- Clés API (`/app/parametres`, onglet API) : création (`POST
  /securite/cles-api`, rôles traduits en actions RBAC) avec secret affiché une
  seule fois ; révocation (`DELETE ?confirmation=<nom>`). Clés S3 : création
  (`POST /cles-s3`, `droits` traduits) avec identifiants affichés une fois.
- Support : ouverture (`POST /support/tickets`), réponse (`POST
  …/messages`), résolu/réouvert (`PATCH { statut }`), escalade (`POST
  …/escalade { motif }`).
- Services : activation drive (`POST /web/drive { domaine, palier, sieges }`) ;
  souscription/résiliation managée vérifiées au niveau API (`POST /services`
  → `202`, `DELETE ?confirmation=<nom>` → `202`) — aucun écran client dédié.
- Facturation : règlement (`POST /facturation/factures/{id}/paiement`),
  moyen principal (`PATCH …/moyens-paiement/{id} { defaut }`), ajout de moyen
  (`POST`), souscriptions (`PATCH { quantite, periodicite }`).
- Sécurité : révocation d’une session (`DELETE /securite/sessions/{id}`) et
  de toutes (`DELETE /securite/sessions?confirmation=<nom org>`) ; formes
  backend normalisées (utilisateur embarqué, `type`/`defaut`, `expire`).
- Sauvegarde & PRA : restauration depuis un point (`POST
  /sauvegarde/restaurations { pointId, cible }`) ; bascule de test et réelle
  (`POST /pra/{id}/bascule { type, confirmation }`).
- Bases : réplica (`POST /bases/{id}/replicas`), PITR (`POST
  …/restauration { instant, nomCible }`).
- Kubernetes : création (`POST /kubernetes` → `202`), mise à jour (`POST
  …/mise-a-jour { version }`), pool (`POST …/pools`, `DELETE
  …/pools/{nom}?confirmation=<nom>`), modules (`PUT …/modules`).
- Espaces : quota (`PUT /espaces/{id}/quota`) ; création déjà vague 1.
- Admin catalogue : création (`201`), modification, publication/dépréciation
  (`POST …/publication { statut }`), suppression (`204`) — vérifiés au niveau
  API (voir l’écart `/moi` ci-dessous).

Détail : les 15 routes de détail sous `/app/**` ne font plus `notFound()` sur
le jeu figé (elles 404aient tout identifiant backend) ; la vue cliente dit
l’absence (`EmptyState` nommé, squelettes pendant le chargement, lecture
unitaire `GET {endpoint}/{id}` via `useEntite` quand la liste ne contient pas
l’item). Les périmètres mock (`…DeLOrg()`) ne filtrent plus en mode API (le
backend filtre déjà, avec des identifiants inconnus du jeu local) : listes et
panneaux Web Cloud, membres (utilisateur embarqué), moyens, sessions, jetons.

## Reste pour la vague 3

- Les créations dont le corps mock contient déjà les champs requis partent par
  le chemin générique (`POST` + `recharger`) sans `appel` dédié : données
  justes, mais pas de suivi fin du `202` dans le centre de tâches (réseaux,
  IP, groupes, LB, VPN, buckets, plans de sauvegarde/PRA, projets, sites,
  DNS, SMTP…).
- Écrans sans équivalent branché : souscription à un service managé (pas
  d’écran client dédié — vérifié au niveau API), estimation facturable (`POST
  /facturation/estimation`, aucun écran ne l’appelle — `CostPreview` calcule
  en local), attribution de sièges (`userId` backend vs `USERS` mock),
  ouverture SSO (`POST …/ouverture` → URL à ouvrir), console VM, politiques
  SSO (`PUT /securite/politiques`), consommation/ventilation facturation,
  métriques/journaux/événements d’observabilité (graines locales), tableaux de
  bord `/app` et `/admin` (serveur, graines).
- Écarts backend relevés en vérifiant (pas du ressort du frontend) :
  - `GET /moi` n’expose pas les droits équipe : le backend accorde
    `catalog.edit` par contournement (`est_admin_plateforme`) mais ne le liste
    pas dans `permissions` — les boutons admin restent désactivés avec le
    compte démo alors que l’API répond `201`. Vérifié : création, publication,
    suppression d’offre au niveau API.
  - SQLite en contention : ~170 `OperationalError: disk I/O error` pendant un
    run Playwright (deux instances `:4000` + `:4001` sur le même fichier),
    disparu après redémarrage de `:4000`. À surveiller si les runs se
    chevauchent.
  - Le jeu démo a bougé pendant la vague (7 → 1 espaces) : un autre
    travailleur sur `:4001` partage la même organisation. Coordonner les
    nettoyages.
- Bannières dégradées `424` (`integration`/`dateDonnees`) et erreurs de
  champs `422` vers les formulaires : transportées (`ApiError.champs`,
  toast), pas encore câblées écran par écran.
