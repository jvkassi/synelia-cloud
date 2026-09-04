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
| Registre | `src/lib/api/collections.ts` | clé de `useCollection` → endpoint (`vms` → `/vms`, `clusters` → `/kubernetes`, `tunnels` → `/vpn`…). Clés à suffixe (`snapshots-<id>`…) et inconnues : pas d’entrée, la graine est gardée |
| État | `src/components/app/atelier.tsx` | `useCollection` charge `GET {endpoint}?parPage=200` dans un effet (la graine reste affichée jusque-là : pas de divergence d’hydratation), expose `chargement`/`erreur`/`recharger` ; les mutations appellent l’API (`POST`, `PATCH {id}`, `DELETE {id}?confirmation=<nom exact>`) puis rechargent. `integrerTravail` fond un `TravailProvisioning` dans la collection des jobs pour le centre de tâches |
| Opérations | `src/components/app/actions.tsx` | `useOperation` accepte `appel: () => Promise<unknown>` : en mode API il l’exécute, suit un éventuel travail via `suivreTravail` (toasts de fin/échec avec `correlationId`), et traduit `ApiError` en toast (`rolesRequis` sur `403`, `champs` sur `422`). Sans `appel`, le chemin maquette est inchangé |
| Session | `src/components/app/contexte.tsx` | en mode API : réhydratation `localStorage`, permissions depuis `/moi` (`autorise()` les consulte, jamais la matrice locale), organisations et `changerOrganisation()` (`X-Organisation-Id` immédiat + `PUT /moi/organisation-active`), `deconnecter()` (`POST /auth/deconnexion`), `GardeAuth` (`/app/**` et `/admin/**` → `/login` sans session). `useEspace()` lit la collection (repli : le plus ancien `createdAt`, jamais le dernier créé qui est vide) et le choix est persisté (`synelia.espace`) |
| Entrée | `src/app/(auth)/login/` | `formulaire-connexion.tsx` : mot de passe + MFA (`/auth/connexion` → `/auth/mfa`), session stockée, redirection `/app`. La page serveur choisit le parcours selon la même variable (pas de bascule à l’hydratation) |

Les jobs (`jobs`, `jobs-plateforme`) se rechargent en plus toutes les 10 s :
une opération lancée ailleurs avance dans le centre de tâches sans rechargement.

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

## Reste pour la vague 2 (mutations encore locales)

- Toutes les pages hors `/app/espaces/new` : leurs `effet`/`job` restent
  simulés ; leur ajouter `appel` au cas par cas (même patron).
- Chaque instance `useCollection` refait son `GET` : un cache partagé
  éliminerait les requêtes en double (visible : `/espaces` appelé 4×).
- Listes d’organisations du sélecteur et pages `/app` (serveur, graine
  `AUDIT`) : encore adossées aux mocks.
- `DELETE` devine le nom de confirmation (`nom ?? code ?? id`) : les
  ressources sans ces champs répondront `422` au lieu de partir.
