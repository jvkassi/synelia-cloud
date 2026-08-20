# Synelia Cloud — repères pour travailler sur ce dépôt

Maquette fonctionnelle d'une plateforme de gestion de cloud multi-tenant :
vitrine publique, espace client, espace fournisseur. **Toutes les données sont
fictives** et vivent dans `src/lib/mock/`. Aucun appel réseau, aucune base.

Le cahier des charges d'origine (`SPECBUILDSYNELIACLOUD.md`, 1143 lignes) et la
charte graphique (`Design.md`) ne sont pas dans le dépôt : ils ont été fournis en
pièce jointe. Ce fichier retient ce qu'il faut en savoir pour ne pas défaire des
décisions déjà prises.

## Outillage

| Quoi | Commande |
|---|---|
| Paquets | `bun install` — **bun 1.4.0**, `bun.lock` fait foi, pas de npm |
| Développement | `bun run dev` — Next avec Turbopack |
| Construction | `bun run build` — Turbopack, ~32 s pour 128 routes |
| Comparaison | `bun run build:webpack` — ~50 s, gardé pour lever un doute |
| Types | `bun run typecheck` |
| Lint | `bun run lint` |
| Audit du rendu | `bun run build && bun run start` puis `node outils/audit.mjs` |

**Tout passe par bun** — `bun install`, `bun run`, `bunx`. Jamais npm, yarn ni
pnpm, pas même pour un essai : chacun écrit son propre fichier de verrouillage et
résout les versions à sa façon, et deux résolutions concurrentes dans le même
dépôt finissent toujours par diverger.

Il faut **bun 1.4.0 au moins** : `bun.lock` est en version 2, et un bun 1.3.x
refuse de le lire (« Unknown lockfile version ») puis, avec
`--frozen-lockfile`, échoue. Installer la bonne version plutôt que régénérer le
verrou :
`curl -fsSL https://bun.sh/install | bash -s "bun-v1.4.0"`.

Les versions des dépendances sont **épinglées à l'exact** : le bun de Vercel ne
sait pas lire un `bun.lock` en version 2 et résout à neuf, ce qui ferait diverger
l'installation locale de la distante. Ne remettez pas de caret.

### L'audit

`outils/audit.mjs` ouvre les 128 routes de `outils/routes.json` dans Chromium et
relève : erreurs console et HTTP, débordement horizontal, contraste sous le seuil
WCAG AA, boutons sans nom accessible, titres d'onglet laissés par défaut.

```
bun add -d playwright          # une fois, si absent
BASE=http://127.0.0.1:3111 node outils/audit.mjs
LARGEUR=390 HAUTEUR=800 node outils/audit.mjs
```

**L'état attendu est zéro partout, à 390 px comme à 1440 px.** Toute régression
sur ces cinq indicateurs est un défaut, pas un arbitrage.

Deux pièges déjà rencontrés :

- Un `next start` resté vivant sert l'ancien `.next` et produit des centaines de
  faux positifs. Tuez-le (`pkill -f next-server`) avant de reconstruire.
- Le harnais ne substitue pas d'identifiants : `routes.json` contient les vrais
  (`dba.africa`, `heb-dba`, `db-dba-maria`…). Ajoutez-y les nouvelles routes.

## Règles qui ne se négocient pas

**Passer par le skill `ponytail` avant d'écrire du code.** Écrire, ajouter,
corriger, refactorer, choisir une dépendance : à chaque fois. Il impose la
solution la plus paresseuse qui marche — se demander d'abord si le besoin
existe, réutiliser ce qui est déjà là, une ligne plutôt que cinquante, aucune
dépendance nouvelle sans raison. Cette maquette a 128 routes et un seul jeu de
composants : ce qu'on n'ajoute pas est ce qu'on n'aura pas à maintenir en
cohérence partout.

**Ne jamais reconstruire l'écran principal d'un produit existant.** Pas
d'explorateur de fichiers, pas de webmail, pas d'écran métier d'ERP, pas
d'éditeur de contenu de CMS, pas de constructeur de requêtes de journaux. Le
portail construit *la carte qui y mène* : il provisionne, dimensionne, sauvegarde,
supervise, et ouvre la porte. Si un écran commence à ressembler au produit amont,
c'est le signe qu'il faut s'arrêter.

**Observabilité bornée** à quatre formats : `StatTile`, `SparkChart` (24 h / 7 j /
30 j uniquement), `EventList` (8 lignes au plus), `LogPeek` (20 lignes au plus),
plus les liens de sortie vers Centreon, Grafana et VictoriaLogs.

**Le magenta `#C0297A` est réservé à trois usages** : le mot d'accroche d'un
héros de la vitrine, le bouton `Ouvrir` d'un service managé, les libellés de flux
SSO. Sur fond violet foncé, utiliser `m-400` — `m-600` n'y tient pas le contraste.

**Cinq états par écran** : chargement en squelettes, vide avec une phrase qui
explique la valeur, erreur avec identifiant de corrélation copiable, droits
insuffisants en grisé nommant le rôle requis, dégradé quand une intégration
externe ne répond pas.

**Une action interdite n'est jamais masquée** : elle est désactivée, avec une
infobulle qui nomme le rôle requis. Enveloppez-la dans `GatedAction`.

**Déterminisme du rendu.** Jamais de `Math.random()`, `Date.now()` ni
`new Date()` sans argument dans un rendu : le serveur et le client divergeraient.
Utilisez `seededSeries`, `trendSeries` et la date figée `MAINTENANT`
(`2026-08-19T15:20:00Z`).

**Montants en FCFA** par défaut, site physique (Abidjan ou Grand-Bassam) visible
partout, `CostPreview` avant toute action facturable, saisie du nom exact avant
toute action destructive.

## Architecture de la navigation

Deux barres, pas de barre latérale de navigation. `src/lib/navigation.ts` porte le
modèle ; `topbar.tsx` le rend.

- **Barre 1** : les univers. Client — `Global · Infrastructure · Applications ·
  Web Cloud · IAM & sécurité`. Fournisseur — `Pilotage · Clients ·
  Infrastructure · Produit · Finance · Exploitation`.
- **Barre 2** : les sections de l'univers courant.

`sectionActive()` résout au **préfixe le plus long** : `/app/reseau/lb` désigne
les load balancers, pas le réseau. Le champ `aussi` rattache les routes sans
onglet propre (`/app/dns` → Domaines, `/app/taches` → Tableau de bord).

### Deux façons d'occuper toute la largeur

Trois univers clients portent des ressources et occupent tout l'écran :
Infrastructure, Applications, Web Cloud. Mais leur panneau de gauche ne dit pas
la même chose, et c'est la distinction à ne pas perdre.

**Infrastructure et Applications : un contexte.** `panneauEspace: true` sur
l'univers. Le panneau est un **sélecteur d'Espace Cloud unique**, rigoureusement
identique sur toutes les sections — machines, clusters, réseau, volumes, bases,
projets. On choisit une fois où l'on travaille, et cela vaut pour tous les
onglets. Choisir ne navigue pas : les entrées sont des boutons, pas des liens, et
l'on reste sur l'onglet courant, relu dans le nouvel Espace. C'est le modèle du
manager OVHcloud, où le projet se choisit à gauche et ne se repose plus.

Le panneau est monté par `Conteneur`, donc par le `layout.tsx` de l'espace
client, et non par les sections : c'est ce qui garantit qu'il ne se reconstruit
jamais d'un onglet à l'autre — un contexte doit survivre à la navigation. La
barre supérieure masque alors son propre sélecteur d'Espace (`avecEspace`), pour
ne pas poser la même question à deux endroits de l'écran ; elle le garde
ailleurs, notamment pour la Supervision de l'univers Global, filtrée par Espace
elle aussi.

`sansPanneau: true` fait l'exception : l'accueil d'Infrastructure
(`/app/infrastructure`) est la seule section sans panneau. Elle regarde tous les
Espaces à la fois, et sert précisément à choisir lequel ouvrir — un sélecteur y
serait redondant. C'est aussi elle qui rassemble ce qui demande une décision :
quota près du plafond, machine sans plan de sauvegarde, plan de reprise jamais
testé.

**Web Cloud : une navigation.** `panneau: ['/prefixe']` sur chaque section. Le
panneau liste les *ressources de la section* — domaines, hébergements,
certificats — et change donc de contenu d'un onglet à l'autre. Ses entrées sont
des liens vers une fiche. Il est monté par le `layout.tsx` de la section, jamais
par une page, sinon il se reconstruit à chaque changement d'onglet.

**Les deux cas partagent la coquille** `CoquillePanneau`
(`src/components/app/cadre-section.tsx`) : panneau collé au bord gauche en
colonne au-delà de 1024 px, bandeau dépliant en dessous, et c'est le panneau qui
porte la marge du contenu — d'où l'absence de conteneur de page sur ces routes.

`gabarit()` rend `plein` (sous un panneau, quel qu'il soit), `large` (univers en
pleine largeur, écran sans panneau : accueil d'Infrastructure, accueil de Web
Cloud, relais SMTP — borné à 1600 px) ou `borne` (1400 px, le reste). `topbar.tsx`
s'en sert aussi : les onglets d'un univers en pleine largeur s'alignent sur le
bord gauche, là où commence le panneau.

**Le sélecteur doit dire vrai.** Un panneau qui annonce un Espace au-dessus d'une
liste qui l'ignore est un mensonge d'interface. Les écrans d'Infrastructure
filtraient déjà par `useEspace()` ; les projets le font désormais aussi, agrégats
compris. Les trois écrans d'Applications qui traversent réellement tous les
Espaces — Déploiements, Registre d'images, catalogue de Modèles — le disent dans
leur sous-titre plutôt que de faire semblant de filtrer.

Reste à trancher : `/app/espaces` liste encore les trois Espaces alors que le
panneau en désigne un. Chez OVH, l'onglet « Projet » montre le projet
sélectionné. Le transformer en fiche de l'Espace courant est un chantier à part.

### Infrastructure

Dix sections : `Accueil · Espaces Cloud · Machines virtuelles · Kubernetes ·
Load balancers · Réseau & IP · Stockage bloc · Stockage objet S3 ·
Bases managées · Sauvegardes & PRA`.

### Web Cloud

Dix sections : `Accueil · Domaines · Hébergement Web · Databases · Emails ·
Drive · Applications · SSL · Backup · Relais SMTP`.

**Un domaine est attaché à un serveur et à un seul.** C'est la règle du produit.
Elle évite le défaut des portails qui vendent le nom, l'hébergement et la
messagerie séparément : chez eux le même nom réapparaît dans trois listes et
aucune page ne dit tout ce qui le concerne.

## Décisions déjà arbitrées

| Sujet | Décision |
|---|---|
| Polices | Montserrat + Open Sans + JetBrains Mono. La charte interdit Inter, qui était pourtant suggéré par le cahier : la charte gagne. |
| Socle du PaaS | Kubernetes managé via OpenStack Magnum, namespace par projet. Sans effet sur la maquette. |
| Sauvegardes | Un onglet par ressource **et** une section transverse `Sauvegardes & PRA` dans Infrastructure, qui porte les plans réutilisables, la restauration granulaire et le tableau de conformité 3-2-1 qu'on montre à un auditeur. |
| Marketplace | Supprimé en tant qu'univers. Le partagé (messagerie, drive, CMS) est passé dans Web Cloud, attaché au domaine ; le dédié est devenu des modèles déployables dans un projet. |
| Applications web | Section à part de `Hébergement Web` : « installer WordPress » et « régler PHP » ne sont pas la même intention. |
| Bases mutualisées | Aucun accès distant, présenté comme une propriété de l'offre et non un réglage. Une base mutualisée n'a pas à être joignable depuis Internet. |
| Sortie du propriétaire | Les socles VMware et Hyper-V restent dans le jeu de données avec `enSortie`, et `/souverainete` publie la trajectoire de sortie datée. Assumer la transition plutôt que la cacher. |
| Configurations de service | Un fichier par service dans `src/lib/configurations/`. Configurer une messagerie n'a presque rien de commun avec configurer un Drive ou un ERP. |

## Pièges techniques rencontrés

**Conflit d'utilitaires de couleur.** Deux classes de couleur concurrentes se
départagent par l'ordre de la feuille de style, pas par l'ordre des classes.
Surcharger la couleur d'une variante par `className` échoue une fois sur deux :
créez une variante (`inverse`, `ghostInverse`), ne surchargez pas.

**Grilles responsives.** Une grille qui déclare `lg:grid-cols-2` sans
`grid-cols-1` de base dimensionne sa colonne implicite au contenu et pousse la
page hors de l'écran. 293 grilles avaient ce défaut.

**Liens imbriqués.** `DataTable` enveloppe la première colonne visible dans le
lien de la ligne quand `href` est fourni : son `rendu` ne doit pas contenir de
lien, deux ancres imbriquées étant du HTML que React refuse d'hydrater.

**Hooks.** Jamais de `useState` après un retour anticipé.

**Titres d'onglet.** Une page `'use client'` ne peut pas exporter `metadata` : un
`layout.tsx` minimal à côté d'elle nomme le segment.

## Ce qui reste à faire

Écart mesuré face au cahier des charges, vérifié fichier par fichier :

1. **Assistant de création Kubernetes** — `/app/kubernetes/new` n'existe pas.
   Quatre étapes attendues : version et région, control plane mono ou HA, pools
   de workers, modules. C'est le seul assistant du cahier qui manque.
2. **`/app/securite`** — il manque *Politiques* (MFA, durée de session,
   restriction par plage IP) et *Sessions* (sessions actives, révocation). Les
   clés d'API existent, sous `/app/parametres`.
3. **`/app/docs`** — pas de parcours de formation, ni de suivi de complétion, ni
   d'accès au bac à sable.
4. **Fiche revendeur** — il manque *Périmètre de catalogue* et *API & intégration*.
5. **`/admin/catalogue`** — le cahier demande un découpage par famille (Espace
   Cloud, images VM, clusters, stacks, web) ; on a un tableau unique.
6. **IaaS** — déploiement de plusieurs serveurs d'un coup en glisser-déposer,
   avec ce qu'on installe, le processeur, la mémoire, le disque et la carte
   réseau. Demandé, pas commencé.
7. **Anglais** — aucun mécanisme d'internationalisation ; tous les libellés sont
   en français en dur. Le cahier ne demande que la structure, pas la traduction.
   C'est le seul chantier de la liste qui se compte en jours.
8. **Lanceur comme page d'accueil** — l'écran existe et l'explique, mais aucun
   réglage ne le fixe pour les membres au rôle purement utilisateur.

## Style d'écriture

Le code et l'interface sont **en français**, y compris les noms de variables et
de composants métier. Les commentaires expliquent *pourquoi*, pas *quoi* — et
seulement quand le choix n'est pas évident. Les textes d'interface disent ce que
le produit fait **et ce qu'il ne fait pas** : c'est souvent l'information la plus
utile avant de s'engager.

## Branche

Le travail va sur `claude/marketplace-admin-vercel-x4f2mh`, poussé directement,
sans pull request. Déploiement :
`bunx vercel@latest --prod --yes --archive=tgz --token "$VERCEL_TOKEN"` — un
`fetch failed` au premier essai est fréquent, le second passe.
