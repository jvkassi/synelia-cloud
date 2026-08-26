# Plan — plateforme d'orchestration d'agents (MIA)

Plan de construction de la partie « agents » de l'univers **IA & Agents**, aligné
sur le cahier des charges *Mise en place d'une plateforme d'orchestration d'agents
IA* (Orange Côte d'Ivoire, v1.0 du 26/05/2026, 18 pages).

Le CDC décrit **6 modules et 39 fonctions** numérotées `FONC-01.1` à `FONC-06.9`.
Ce plan les prend une par une : chacune est rattachée à un écran, et son état est
dit sans arrondi. Un écran qui n'existe pas est marqué *à faire*, pas *en cours*.

Branche : `claude/ai-gateway-universe-ptjxux`.

---

## 1. État au moment où le plan est écrit

L'univers **IA & Agents** existe déjà avec sept sections (passerelle, catalogue de
modèles, routage, connaissances, inférence dédiée, consommation, accueil) et sa
contrepartie fournisseur `/admin/ia`. Ce socle est construit, vérifié et poussé.

S'y ajoute, **partiellement construit et non terminé** :

| Élément | État |
|---|---|
| `src/lib/types.ts` — types agents, outils, canaux, flux | **Fait** |
| `src/lib/mock/ia.ts` — 6 agents, 13 outils, 8 canaux, 2 flux, trace, annotations, alertes, quotas, coffre de clés, connecteurs | **Fait** |
| `src/lib/rbac.ts` — 4 actions (`ia.agent.write`, `ia.agent.publish`, `ia.flow.write`, `ia.tool.register`) | **Fait** |
| `src/lib/navigation.ts` — univers renommé « IA & Agents », 3 sections ajoutées | **Fait** |
| `/app/ia/agents` — liste + fiche à 6 onglets | **Fait** |
| `/app/ia/agents/new` — assistant de création | **À faire** |
| `/app/ia/orchestration` — studio de flux | **À faire** |
| `/app/ia/outils` — outils et canaux | **À faire** |
| Enrichissements des écrans existants (voir §4) | **À faire** |
| `outils/routes.json`, audit, CLAUDE.md | **À faire** |

**Conséquence à connaître avant de reprendre :** la barre de sections affiche déjà
*Orchestration* et *Outils & canaux*, et l'accueil de l'univers pointe vers eux.
Ces deux routes n'existent pas encore : les onglets répondent 404 tant que les
écrans du §3 ne sont pas construits. Les liens internes de la fiche d'agent vers
`/app/ia/outils` et `/app/ia/orchestration` sont dans le même cas.

---

## 2. Ce que la plateforme fera — et ce qu'elle ne fera pas

Trois partis pris qui décident du reste. Ils tiennent la règle du dépôt : le
portail construit la carte, il ne refait pas le produit d'en face.

**Un agent se construit ici, il se parle ailleurs.** Le portail définit, borne,
publie, observe et facture. La conversation a lieu sur le canal publié — widget,
WhatsApp, SMS, voix, API. Pas de fenêtre de discussion dans le portail : ce serait
reconstruire l'écran principal d'un produit de conversation, et cela cacherait le
vrai sujet, qui est la gouvernance.

**L'orchestration se voit en entier ou ne se voit pas.** Le studio montre le
graphe réel : nœuds, branches conditionnelles, exécutions parallèles, points de
reprise, pauses humaines — avec, sur chaque nœud, ce qu'il coûte, ce qu'il dure et
ce qu'il rate. Un graphe qui ne porterait pas ces trois chiffres serait un dessin.

**Ce qui doit être impossible ne se règle pas dans une consigne.** La consigne
oriente ; la portée de l'outil, le garde-fou d'entrée et la classe de données
empêchent. Chaque écran doit rendre cette différence visible, parce que c'est
exactement là que les plateformes d'agents déçoivent en production.

---

## 3. Écrans à construire

### 3.1 `/app/ia/agents/new` — assistant de création

Quatre étapes, sur `WizardShell` (le composant existe, utilisé par
`/app/vms/new` et `/app/espaces/new`), avec `CostPreview` en panneau latéral.

1. **Identité** — nom, initiales et teinte en guise d'icône, rôle métier,
   description, type d'agent (conversationnel · tâche · flux · extraction).
   Le type conditionne la suite : un extracteur n'a ni mémoire ni canal humain.
2. **Modèle et consigne** — choix du modèle avec sa résidence et son tarif en
   regard, consigne, variables détectées automatiquement dans le texte,
   hyperparamètres (température, Top-P, jetons maximum).
3. **Outils et connaissances** — cases à cocher sur le catalogue d'outils, bases
   de connaissances rattachables, avertissement explicite sur tout outil qui écrit.
4. **Garde-fous et publication** — classe de données maximale, budget quotidien,
   validation humaine, reprise sur erreur, canaux à ouvrir. Récapitulatif, aperçu
   de coût, création en brouillon — jamais publié d'emblée.

Sous `GatedAction` avec `ia.agent.write`.

### 3.2 `/app/ia/orchestration` — studio de flux

- Sélection du flux (deux flux dans le jeu de données : traitement d'une
  réclamation, compte rendu de réunion), puis onglets **Studio · Exécutions ·
  Réglages**.
- **Studio** : canevas en `overflow-x-auto`, liens tracés en SVG, nœuds rendus en
  boutons HTML positionnés au-dessus — nommés, donc accessibles, ce que des
  `<rect>` SVG ne seraient pas. Sélection d'un nœud → panneau d'inspection :
  agent rattaché, exécutions sur 24 h, latence, coût pour mille, taux d'erreur,
  nombre de tentatives.
- Légende par type de nœud : entrée, agent, condition, outil, recherche, synthèse,
  pause humaine, sortie. Les branches conditionnelles portent leur part de trafic
  (« facturation · 62 % »).
- **Exécutions** : `StatTile` (exécutions 7 j, durée médiane, taux de succès, coût
  par exécution) + `LogPeek` des dernières exécutions.
- **Réglages** : mémoire partagée entre agents du flux, politique de reprise,
  seuils de pause humaine, export et import du flux en YAML (`CodeBlock`).
- Le glisser-déposer n'est pas implémenté dans la maquette ; l'écran n'affirme
  nulle part qu'il n'existe pas.

### 3.3 `/app/ia/outils` — outils et canaux

Deux onglets, parce que ce sont deux directions opposées : ce que l'agent appelle,
et ce qui appelle l'agent.

- **Outils** — `DataTable` sur les 13 outils, filtrable par catégorie (fourni par
  la plateforme · API interne · schéma OpenAPI importé · serveur MCP) et par effet
  (lit / écrit). Colonnes : signature, authentification, appels 24 h, taux
  d'erreur, latence, état. Fiche latérale : description, portée, agents qui
  l'utilisent, exigence de confirmation humaine. Actions de déclaration d'un outil
  (import OpenAPI, ajout d'un serveur MCP) sous `ia.tool.register`.
- **Canaux** — les huit canaux en cartes : widget, WhatsApp Business, Telegram,
  SMS bidirectionnel, voix (transcription et synthèse), serveur vocal interactif,
  API REST, WebSocket. Chacun avec son fournisseur, son identifiant, son état, son
  volume 24 h et sa contrainte propre (validation Meta à 48 h, découpage SMS à 160
  caractères, plan de numérotation SIP à écrire). Carte dédiée au **routeur de
  contexte omnicanal** : clé de rapprochement, fenêtre de 72 h, reprises comptées.

---

## 4. Enrichissements des écrans existants

| Écran | À ajouter | Fonction du CDC |
|---|---|---|
| `/app/ia/connaissances` | Carte des 8 connecteurs d'ingestion (Drive, S3, git, exploration web, SharePoint, Confluence, Notion en aperçu, téléversement direct) ; réglages de découpage (taille de fragment, recouvrement, stratégie) ; filtres de métadonnées avec leur taux de couverture | FONC-03.1, 03.2, 03.3, 03.6 |
| `/app/ia/passerelle` | Coffre-fort des clés fournisseurs : empreinte masquée, date d'ajout, échéance de rotation, portée, état — jamais la valeur en clair | FONC-05.4 |
| `/app/ia/consommation` | Table des règles d'alerte de seuil (cible, métrique, seuil, canaux e-mail/WhatsApp/webhook, plage, escalade) ; quotas par direction métier avec consommation | FONC-04.5, FONC-05.5 |
| `/app/ia` (accueil) | Bandeau des agents publiés et de leur activité, en tête de l'univers | FONC-04.1 |
| `/admin/ia` | Vue fournisseur des agents à l'échelle de la plateforme : nombre d'agents par organisation, part du calcul consommée par l'orchestration | — |

---

## 5. Couverture du cahier des charges, fonction par fonction

`✓` construit · `→` planifié dans ce document · `↗` couvert par un écran
préexistant de la maquette.

### FONC-01 — Gestion et configuration des agents

| Code | Fonction | Où | État |
|---|---|---|---|
| 01.1 | Création de profil agent | `/app/ia/agents/new`, fiche d'agent | → / ✓ |
| 01.2 | Assignation du modèle | Fiche d'agent, onglet *Rôle & consigne* | ✓ |
| 01.3 | Édition du system prompt | Fiche d'agent, consigne annotée | ✓ |
| 01.4 | Variables dynamiques `{{…}}` | Fiche d'agent, table des variables | ✓ |
| 01.5 | Versioning et retour arrière | Fiche d'agent, onglet *Versions* | ✓ |
| 01.6 | Hyperparamètres | Fiche d'agent, panneau latéral | ✓ |
| 01.7 | Attribution des outils | Fiche d'agent, onglet *Outils* + `/app/ia/outils` | ✓ / → |

### FONC-02 — Moteur d'orchestration et multi-agents

| Code | Fonction | Où | État |
|---|---|---|---|
| 02.1 | Studio visuel de workflow | `/app/ia/orchestration` | → |
| 02.2 | Orchestration séquentielle | Graphe du flux, liens simples | → |
| 02.3 | Orchestration parallèle + synthèse | Flux *réclamation* : trois branches convergeant sur un nœud de synthèse | → |
| 02.4 | Routage conditionnel | Liens conditionnels avec part de trafic | → |
| 02.5 | Boucle humaine | Nœud *Validation humaine*, seuil à 50 000 FCFA | → |
| 02.6 | Mémoire partagée | Fiche d'agent (onglet *Garde-fous*) + réglages du flux | ✓ / → |
| 02.7 | Reprise sur erreur | Nombre de tentatives par nœud, étape de reprise visible dans la trace | ✓ / → |

### FONC-03 — Connaissance et RAG

| Code | Fonction | Où | État |
|---|---|---|---|
| 03.1 | Import de documents | `/app/ia/connaissances`, connecteur *Téléversement direct* | → |
| 03.2 | Connecteurs externes | Carte des connecteurs (SharePoint, Notion, Confluence…) | → |
| 03.3 | Découpage automatique | Réglages d'indexation | → |
| 03.4 | Vectorisation | Modèle d'embedding et dimensions, par base | ✓ |
| 03.5 | Recherche sémantique | Onglet *Interroger*, score minimal, reclassement | ✓ |
| 03.6 | Filtres de métadonnées | Table des filtres et de leur couverture | → |

### FONC-04 — Observabilité, journaux et supervision

| Code | Fonction | Où | État |
|---|---|---|---|
| 04.1 | Tableau de bord de consommation | `/app/ia` | ✓ |
| 04.2 | Suivi financier | `/app/ia/consommation` — en FCFA, pas en euros | ✓ |
| 04.3 | Traçabilité des prompts | Fiche d'agent, onglet *Traces* | ✓ |
| 04.4 | Chaîne de pensée inspectable | Trace en dix étapes, avec durée et jetons par étape | ✓ |
| 04.5 | Alertes de dépassement | `/app/ia/consommation`, règles d'alerte | → |

### FONC-05 — Sécurité, gouvernance et administration

| Code | Fonction | Où | État |
|---|---|---|---|
| 05.1 | Authentification unique | `/app/sso` — OIDC, SAML 2, annuaire | ↗ |
| 05.2 | Gestion des rôles | `/app/membres` et matrice RBAC, 4 actions IA ajoutées | ✓ |
| 05.3 | Masquage des données personnelles | `/app/ia/routage`, garde-fou *Données personnelles* | ✓ |
| 05.4 | Coffre-fort de clés fournisseurs | `/app/ia/passerelle` | → |
| 05.5 | Quotas par utilisateur ou direction | `/app/ia/consommation` | → |

### FONC-06 — Connecteurs multicanaux et API

| Code | Fonction | Où | État |
|---|---|---|---|
| 06.1 | WhatsApp Business | `/app/ia/outils`, onglet *Canaux* | → |
| 06.2 | Telegram | idem | → |
| 06.3 | SMS bidirectionnel | idem, découpage à 160 caractères documenté | → |
| 06.4 | Transcription vocale | idem — Whisper souverain, à Abidjan | → |
| 06.5 | Synthèse vocale | idem | → |
| 06.6 | Couplage téléphonique | idem — état *à configurer*, plan de numérotation à écrire | → |
| 06.7 | API REST synchrone | Fiche d'agent, onglet *Publication* | ✓ |
| 06.8 | WebSocket | `/app/ia/outils`, onglet *Canaux* | → |
| 06.9 | Routeur de contexte omnicanal | idem, carte dédiée | → |

**Décompte : 39 fonctions.** 17 construites, 21 planifiées ici, 1 couverte par un
écran préexistant.

---

## 6. Ordre de reprise

1. `/app/ia/outils` — c'est le socle dont la fiche d'agent et le studio ont besoin ;
   sans lui, deux écrans gardent des liens morts.
2. `/app/ia/orchestration` — le morceau le plus long, à cause du canevas.
3. `/app/ia/agents/new` — mécanique connue, les composants existent tous.
4. Enrichissements du §4 — courts, indépendants les uns des autres.
5. `outils/routes.json` : ajouter `/app/ia/agents`, `/app/ia/agents/new`,
   `/app/ia/orchestration`, `/app/ia/outils` — 140 routes au total.
6. `bun run typecheck && bun run lint && bun run build`, puis l'audit du rendu à
   1440 px **et** à 390 px. L'état attendu reste zéro sur les cinq indicateurs.
7. Mettre à jour la section « IA & Agents » de `CLAUDE.md` : dix sections, mention
   du studio d'orchestration et de la règle « la consigne oriente, la plateforme
   empêche ».

## 7. Points à trancher avant de finir

- **Le canevas doit-il être modifiable ?** Le CDC demande un studio en
  glisser-déposer (FONC-02.1). La maquette peut se contenter de montrer le graphe
  et son coût. Trancher avant d'écrire l'écran : un canevas modifiable, même
  factice, coûte deux fois plus cher qu'un canevas de lecture.
- **Deux univers ou un seul ?** Dix sections dans une seule barre, c'est le maximum
  tenable — Web Cloud en a dix. Si les agents prennent de l'ampleur, séparer
  « IA & Agents » (agents, orchestration, outils) de « Modèles & passerelle »
  (catalogue, passerelle, routage, connaissances, inférence, consommation).
- **Le multi-agent hiérarchique** n'est pas dans le CDC : un agent superviseur qui
  délègue à des agents subordonnés. Le modèle de données actuel le permettrait,
  aucun écran ne le montre. À laisser de côté tant que le client ne le demande pas.
