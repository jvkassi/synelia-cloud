# Synelia Cloud — repères pour travailler sur ce dépôt

Maquette fonctionnelle d'une plateforme de gestion de cloud multi-tenant :
vitrine publique, espace client, espace super admin. **Toutes les données sont
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
| Construction | `bun run build` — Turbopack, ~20 s pour 106 routes |
| Comparaison | `bun run build:webpack` — ~50 s, gardé pour lever un doute |
| Types | `bun run typecheck` |
| Lint | `bun run lint` |
| Audit du rendu | `bun run build && bun run start` puis `node outils/audit.mjs` |
| Contrat d'API | `bun run api:spec` — régénère `docs/api/openapi.json` |

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

### Le contrat d'API

`docs/api/openapi.json` (OpenAPI 3.0.3, 527 opérations) décrit l'API que le
backend doit servir pour remplacer `src/lib/mock/`. Il est **généré** par
`outils/openapi/` : ne l'éditez pas à la main, éditez le générateur, qui refuse
d'écrire un document incohérent — référence morte, `operationId` en doublon,
paramètre de chemin non déclaré. Les conventions — enveloppe `{ erreur }`,
asynchrone par travail de provisioning, confirmation par le nom sur les actions
destructives, `403` qui nomme le rôle requis, `424` daté quand une intégration
amont tombe — sont détaillées dans `docs/api/README.md`. Les noms de champs
reprennent `src/lib/types.ts` à l'identique : l'interface les consomme tels
quels.

Il a remplacé une première version rédigée à la main : trois cents opérations de
JSON tenues à jour manuellement dérivent au premier ajout. Un contrat qui décrit
un écran disparu est pire qu'un contrat incomplet.

### L'audit

`outils/audit.mjs` ouvre les 160 routes de `outils/routes.json` dans Chromium et
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

## Les images de la vitrine

Le projet n'avait aucune image : pas de dossier `public/`, tout était dessiné en
CSS. Il y a maintenant deux familles, et elles ne se mélangent pas.

**`public/illustrations/*.svg` — générées.** `node outils/illustrations.mjs`
réécrit les huit fichiers depuis les coordonnées et les palettes du script. La
carte de Côte d'Ivoire repose sur un contour en longitude/latitude et une
projection ; ne retouchez pas le SVG à la main, corrigez le générateur et
relancez-le. La sortie est déterministe : deux exécutions donnent deux fichiers
identiques.

**`public/photos/*.webp` — génératives.** Produites avec Gemini (Nano Banana),
redimensionnées à 1600 px et encodées en WebP q76 : moins de 800 Ko pour les
neuf, contre 8 Mo en JPEG d'origine. `og.jpg` fait exception et reste en JPEG —
tous les robots d'indexation ne décodent pas le WebP, et un aperçu de lien sans
vignette est un aperçu raté. Ce ne sont **pas** des photographies de Synertech
Vallon ni du parc VITIB. Chaque emplacement le dit — « Vues d'illustration » —
et il faudra les remplacer par de vraies prises de vue avant tout usage
commercial.

Deux garde-fous appris en les posant :

- **Pas de visage.** La page équipe affiche des monogrammes et explique pourquoi
  (« un visage acheté sur une banque d'images n'apprendrait rien sur l'équipe »).
  Une photo de personne la contredirait. Les photos montrent des lieux, des
  baies, des mains — jamais un portrait.
- **Contraste avant décor.** Une photo posée en fond de héros sous du texte
  blanc fait tomber le contraste sous le seuil AA. Le héros la garde sous un
  dégradé opaque du côté du texte et ne l'éclaircit qu'à droite, où il n'y a que
  le visuel de baie. L'audit vérifie.

## Règles qui ne se négocient pas

**Passer par le skill `ponytail` avant d'écrire du code.** Écrire, ajouter,
corriger, refactorer, choisir une dépendance : à chaque fois. Il impose la
solution la plus paresseuse qui marche — se demander d'abord si le besoin
existe, réutiliser ce qui est déjà là, une ligne plutôt que cinquante, aucune
dépendance nouvelle sans raison. Cette maquette a 106 routes et un seul jeu de
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

**Aucun bouton inerte.** Un bouton, un interrupteur ou un champ visible fait ce
qu'il annonce, ou il est désactivé avec la raison. Un interrupteur dont le
libellé dit « non désactivable » porte `disabled`, il n'est pas simplement muet.

## L'atelier — l'état mutable de la démonstration

`src/components/app/atelier.tsx` garde, le temps de la session, les collections
qui ont été modifiées. Une collection jamais touchée n'existe pas dans l'état :
la lecture retombe sur la graine importée de `src/lib/mock/`, si bien que le
rendu serveur et le premier rendu client restent identiques. Un rechargement
complet remet la démonstration à zéro, et le menu du compte propose
« Réinitialiser la démonstration » dès qu'une collection a bougé.

```tsx
const parc = useCollection<VM>('vms', VMS)     // items, creer, modifier, supprimer
parc.modifier(id, { statut: 'running' })       // ou une fonction (vm) => patch
const { lancerJob } = useAtelier()             // job suivi dans /app/taches
```

Trois primitives dans `src/components/app/actions.tsx` évitent que chaque écran
réinvente la séquence « RBAC → mutation → notification → job » :

| Composant | Pour quoi |
|---|---|
| `BoutonAction` | une action directe, avec confirmation par saisie du nom si besoin |
| `BoutonFormulaire` | un bouton qui ouvre un formulaire puis exécute l'action |
| `ModaleFormulaire` | le formulaire seul, quand il doit vivre hors d'un popover |
| `useOperation()` | la séquence complète, à appeler depuis un `onClick` existant |

Deux pièges :

- **Une modale ne vit pas dans un popover.** Un clic dans la modale est un clic
  « hors popover » : le popover se ferme et démonte la modale. Montez-la à la
  racine de la vue et ouvrez-la depuis le popover par un état.
- **Une entité affichée dans un tiroir doit être relue depuis la collection**
  (par identifiant), pas capturée à l'ouverture : sinon le tiroir montre l'état
  d'avant la modification.

Les lectures des sélecteurs de `src/lib/mock/` (`vmsDeLEspace`, `messageriesDeLOrg`…)
donnent le **périmètre** ; l'état vient de l'atelier. Le motif est :
`const perimetre = new Set(selecteur().map((x) => x.id))` puis filtrer les items.

### Deux ateliers, un seul retenu

Deux branches ont écrit un atelier en parallèle : un registre typé par
collection avec `useActe()` (back-office seul, 14 fichiers) et le
`useCollection(nom, graine)` générique décrit plus haut (les deux espaces, 65
fichiers). **Le générique a été retenu à la fusion** : le même mécanisme sert la
vitrine, l'espace client et l'espace fournisseur, et une collection ne se
déclare pas au préalable.

Ce que l'autre faisait de mieux a depuis été reprise : `useOperation()` écrit la
trace au journal d'audit en même temps que la mutation et la notification, et il
journalise aussi les refus du RBAC — c'est la seule trace qu'un auditeur ne peut
pas reconstituer autrement.

Deux règles de l'autre atelier restent vraies ici, et sont déjà appliquées :

- **Identifiants et horodatages déterministes** : `collection.identifiant()`
  compte, les dates partent de `MAINTENANT`. Pas de `Math.random()`, pas
  d'horloge navigateur.
- **Une route de détail ne fait plus `notFound()`.** Une organisation ou un
  projet créé pendant la session n'existe pas dans le jeu figé : un 404 du
  serveur ferait croire à une panne. C'est la vue cliente qui dit ce qu'elle ne
  trouve pas — `ProjetIntrouvable` pour l'univers Applications. Corollaire : la
  vue relit l'entité dans la collection et tolère son absence, donc pas de `!`
  sur un `find`, et la garde se place **après** tous les hooks.

### Le catalogue des opérations longues

`src/lib/mock/workflows.ts` décrit les opérations qui prennent du temps : les
étapes, leurs **durées annoncées**, la phrase de départ, celle de fin, et un
échec facultatif. `src/lib/workflows.ts` porte la mécanique. Un site d'appel
n'écrit plus la séquence :

```tsx
job: { workflow: 'backup.restore', cible: `${p.resourceNom} · ${dateCourte(p.date)}` }
```

Trois raisons, et ce sont trois règles à tenir :

1. **Le texte appartient au catalogue, pas au site d'appel.** La restauration
   d'un point de sauvegarde se lançait depuis quatre écrans qui recopiaient la
   même liste d'étapes ; il suffisait d'en corriger trois pour que le portail se
   contredise.
2. **Les durées sont plausibles.** Le temps d'écran reste constant (~11 s) mais
   se répartit entre les étapes **au prorata de leurs durées annoncées** : copier
   une image système ne s'affiche plus comme durant une seconde, et une étape
   longue paraît longue.
3. **Deux workflows échouent volontairement au premier essai** — validation DNS
   d'un certificat, conversion de disque d'un lot de migration. Sans cela, les
   états `failed` et `rolled_back` et le champ `erreur` ne se voyaient que sur
   les jobs figés du jeu de données : aucune opération lancée depuis un écran ne
   montrait jamais un diagnostic. La reprise, elle, aboutit.

`reprendreJob(id)` reprend **à l'étape échouée**, sur le job lui-même : les
étapes déjà réussies ne sont pas rejouées. Et `effetFinal` ne s'applique qu'en
cas de succès — un renouvellement de certificat qui échoue laisse le certificat
« en émission », il ne le marque pas actif.

La forme sans catalogue (`etapes: string[]` au site d'appel) reste disponible et
reste juste quand les étapes **dépendent d'un choix de l'utilisateur** : la
restauration granulaire nomme l'étape « Parcourir l'arborescence » ou « Copier
les données » selon la granularité choisie. Une cinquantaine de sites sont dans
ce cas ; ne les forcez pas dans le catalogue, la variation est l'information.

### Les exports

`src/lib/export.ts` produit un fichier réel : `telechargerCsv` (point-virgule et
BOM, ce qu'attend un tableur en français) et `telechargerTexte`. `DataTable`
l'utilise pour son icône d'export ; le simulateur de la vitrine, le journal
d'audit et la facturation fournisseur en descendent leurs jeux de données. Ce que
le navigateur ne sait pas fabriquer — un PDF signé, un flux syslog — reste une
notification qui dit ce qui se passerait, sans prétendre le faire.

Les formulaires de la vitrine passent par `FormulaireSite`
(`src/components/site/formulaire.tsx`) : champs obligatoires réellement exigés,
accusé de réception avec référence, et la phrase qui dit qu'aucun courriel ne
part d'une maquette.

## Architecture de la navigation

Deux barres, pas de barre latérale de navigation. `src/lib/navigation.ts` porte le
modèle ; `topbar.tsx` le rend.

- **Barre 1** : les univers. Client — `Global · Infrastructure · Applications ·
  Web Cloud · IAM & sécurité`. Super admin — `Pilotage · Clients ·
  Infrastructure · Produit · Finance · Exploitation`.
- **Barre 2** : les sections de l'univers courant.

Côté super admin, l'univers **Clients** porte lui aussi un panneau — voir plus
bas. C'est le seul de cet espace.

`sectionActive()` résout au **préfixe le plus long** : `/app/reseau/lb` désigne
les load balancers, pas le réseau. Le champ `aussi` rattache les routes sans
onglet propre (`/app/dns` → Domaines, `/app/taches` → Tableau de bord).

### Quatre façons d'occuper toute la largeur

Trois univers clients portent des ressources et occupent tout l'écran :
Infrastructure, Applications, Web Cloud. Côté super admin, l'univers Clients s'y
ajoute. Mais leur panneau de gauche ne dit pas la même chose, et c'est la
distinction à ne pas perdre.

**Infrastructure : un contexte.** `panneauEspace: true` sur l'univers. Le panneau
est un **sélecteur d'Espace Cloud unique**, rigoureusement identique sur toutes
les sections — machines, clusters, réseau, volumes, bases. On choisit une fois où
l'on travaille, et cela vaut pour tous les onglets. Choisir ne navigue pas : les
entrées sont des boutons, pas des liens, et l'on reste sur l'onglet courant, relu
dans le nouvel Espace.

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

**Applications : une sélection, mais une seule pour tout l'univers.**
`panneau: ['/prefixe']` sur chacune des sept sections qui suivent l'accueil, et
`CadreProjet` (`src/components/app/cadre-projet.tsx`) monte partout la *même*
liste : les projets. Volontairement pas un sélecteur d'Espace — un projet est une
unité de travail indépendante de son hébergement, et deux projets du même Espace
n'ont rien à se dire. La question à poser une fois pour toutes est « de quel
projet parle-t-on ? ».

Comme la sélection est partagée, changer d'onglet ne doit pas la reperdre :
`hrefSection()` dans `topbar.tsx` reporte le projet courant dans l'adresse de la
section visée.

**Web Cloud : une navigation.** `panneau: ['/prefixe']` sur chaque section, mais
le panneau liste les *ressources de la section* — domaines, hébergements,
certificats — et change donc de contenu d'un onglet à l'autre. Ses entrées sont
des liens vers une fiche.

**Clients, côté super admin : une navigation, elle aussi.** Même forme que Web
Cloud — `pleineLargeur` sur l'univers, `panneau: ['/admin/organisations']` sur son
unique section, et `app/admin/organisations/layout.tsx` monte la liste des
organisations clientes. Un exploitant saute d'un client à l'autre toute la
journée : sans panneau persistant, chaque saut repasse par la liste. C'est
`ConteneurAdmin` qui applique `gabarit()` de ce côté, comme `Conteneur` le fait
côté client.

**Les quatre cas partagent la coquille** `CoquillePanneau`
(`src/components/app/cadre-section.tsx`) : panneau collé au bord gauche en
colonne au-delà de 1024 px, bandeau dépliant en dessous, et c'est le panneau qui
porte la marge du contenu — d'où l'absence de conteneur de page sur ces routes.

`gabarit()` rend `plein` (sous un panneau, quel qu'il soit), `large` (univers en
pleine largeur, écran sans panneau : les trois accueils clients, le relais SMTP —
borné à 1600 px) ou `borne` (1400 px, le reste). `topbar.tsx` s'en sert aussi : les
onglets d'un univers en pleine largeur s'alignent sur le bord gauche, là où
commence le panneau.

**Le sélecteur doit dire vrai.** Un panneau qui annonce un Espace au-dessus d'une
liste qui l'ignore est un mensonge d'interface. Les écrans d'Infrastructure
filtraient déjà par `useEspace()`. Dans Applications, le panneau désigne un
projet et chaque section ne montre que ce projet ; les racines de section, elles,
assument de traverser tous les projets et le disent dans leur sous-titre.

Reste à trancher : `/app/espaces` liste encore les trois Espaces alors que le
panneau en désigne un. Chez OVH, l'onglet « Projet » montre le projet
sélectionné. Le transformer en fiche de l'Espace courant est un chantier à part.

### Infrastructure

Dix sections : `Accueil · Espaces Cloud · Machines virtuelles · Kubernetes ·
Load balancers · Réseau & IP · Stockage bloc · Stockage objet S3 ·
Bases managées · Sauvegardes & PRA`.

### Applications

Huit sections : `Accueil · Projets · Déploiements · Observabilité · Backup ·
Domaines & routage · Variables & secrets · Paramètres`, toutes sous
`/app/applications/`. Accueil n'a pas de panneau — c'est un tableau de bord, il
ne porte sur aucun projet en particulier.

La fiche d'un projet n'a pas d'onglets : variables, domaines et paramètres en ont
été sortis pour devenir des sections. Un onglet dans un onglet oblige à retenir
deux niveaux de position ; la barre en tient un seul.

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
| Revendeurs | **Il n'y en a pas.** Deux acteurs seulement : l'organisation cliente et le super admin qui exploite la plateforme. Ni rôle `reseller_admin`, ni type d'organisation indirect, ni grille d'achat partenaire, ni revshare, ni page `/partenaires`. Une offre porte **un** prix, celui de la vitrine. |
| Marketplace | Supprimé en tant qu'univers. Le partagé (messagerie, drive, CMS) est passé dans Web Cloud, attaché au domaine ; le dédié est devenu des modèles déployables dans un projet. |
| Bibliothèque de modèles | Plus de section ni de fiche : les modèles se choisissent à l'étape « Source » de `/app/applications/nouveau`, à côté de Git, image Docker et canvas. Une fiche de modèle qu'on ne peut pas déployer depuis elle-même était un détour. Le jeu de données `mock/modeles.ts` reste : les services en portent le `modeleSlug` et leur configuration en dépend. |
| Registre d'images | Supprimé. Un explorateur de dépôts et d'étiquettes est l'écran principal d'un registre — donc hors périmètre. Ce qui compte (image, étiquette, signature, résultat de l'analyse) est déjà sur la fiche du déploiement. |
| Applications web | Section à part de `Hébergement Web` : « installer WordPress » et « régler PHP » ne sont pas la même intention. |
| Bases mutualisées | Aucun accès distant, présenté comme une propriété de l'offre et non un réglage. Une base mutualisée n'a pas à être joignable depuis Internet. |
| Sortie du propriétaire | Les socles VMware et Hyper-V restent dans le jeu de données avec `enSortie`, et `/souverainete` publie la trajectoire de sortie datée. Assumer la transition plutôt que la cacher. |
| Configurations de service | Un fichier par service dans `src/lib/configurations/`. Configurer une messagerie n'a presque rien de commun avec configurer un Drive ou un ERP. |
| Membres d'une organisation cliente | Le fournisseur ne les crée pas, ne change pas leurs rôles et ne les révoque pas : l'organisation le fait depuis son propre espace. Seule exception, écrite dans l'écran : la récupération du dernier administrateur perdu. |
| Suppression d'une offre | Une offre publiée ne se supprime pas, elle se déprécie — elle a été vendue. Seul un brouillon jamais souscrit se supprime. |

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

1. **`/app/docs`** — pas de parcours de formation, ni de suivi de complétion, ni
   d'accès au bac à sable.
2. **Anglais** — aucun mécanisme d'internationalisation ; tous les libellés sont
   en français en dur. Le cahier ne demande que la structure, pas la traduction.
   C'est le seul chantier de la liste qui se compte en jours.
3. **Lanceur comme page d'accueil** — l'écran existe et l'explique, mais aucun
   réglage ne le fixe pour les membres au rôle purement utilisateur.
4. **Refus non journalisables depuis l'interface** — `useOperation()` écrit bien
   une entrée `result: 'refuse'`, mais `GatedAction` neutralise les événements de
   pointeur (`pointer-events-none`) : une action interdite ne peut pas être
   cliquée, donc la branche ne se déclenche pas depuis l'interface. Les refus
   affichés viennent du jeu de données. Rendre la promesse vraie demanderait que
   `GatedAction` intercepte le clic au lieu de le bloquer — ce qui change le
   comportement arbitré « désactivée, jamais masquée ». À trancher.
5. **Tableau de bord client** — `/app` est un composant serveur : il lit la
   graine `AUDIT` et non le journal de l'atelier. Les entrées créées pendant la
   session n'y apparaissent donc pas, contrairement à `/admin/audit` et
   `/app/securite`.

Fait depuis : le découpage du catalogue par famille (`/admin/catalogue`, cinq
tuiles qui filtrent le tableau), le journal d'audit alimenté par l'atelier —
`useOperation()` écrit dans la collection `audit`, que `/admin/audit`,
`/app/securite`, `/admin/equipe`, `/admin/page` et la fiche organisation lisent
désormais en direct —, les illustrations et photographies de la vitrine, puis
l'assistant `/app/kubernetes/new` (cinq étapes), l'onglet
*Sessions actives* de `/app/securite` et sa politique d'organisation, le centre
de tâches `/app/taches`, le glisser-déposer de composition de serveurs qui livre
réellement ses lots (`/app/vms/composer`), et le câblage complet de l'espace
fournisseur sur l'atelier — organisations, catalogue, capacité, marketplace,
tickets, équipe, conformité, recouvrement, revendeurs — puis celui de l'univers
Applications restructuré : projets, services, variables, déploiements,
sauvegardes, domaines et paramètres.

## Style d'écriture

Le code et l'interface sont **en français**, y compris les noms de variables et
de composants métier. Les commentaires expliquent *pourquoi*, pas *quoi* — et
seulement quand le choix n'est pas évident. Les textes d'interface disent ce que
le produit fait **et ce qu'il ne fait pas** : c'est souvent l'information la plus
utile avant de s'engager.

## Branches et intégration

`main` est la branche d'intégration : **tout travail y est fusionné dès qu'il
est terminé**, sans pull request. Le travail lui-même se fait sur une branche
`claude/<sujet>`, poussée elle aussi.

La séquence, à la fin de chaque changement :

```
bun run typecheck && bun run lint && bun run build   # avant tout
git push -u origin claude/<sujet>
git checkout main && git pull && git merge claude/<sujet>
```

**Résolvez les conflits, ne les reportez pas.** Cinq branches parallèles ont
déjà divergé assez pour qu'une fusion tardive coûte une demi-journée. Deux
règles apprises à cette occasion :

- **Un conflit fusionné automatiquement n'est pas un conflit résolu.** Git a
  accepté sans broncher `panneauEspace: true` (branche A) au-dessus des huit
  sections d'Applications (branche B) : le fichier compilait, l'univers portait
  deux panneaux et aucune ligne n'était marquée en conflit. Après toute fusion
  qui touche `navigation.ts`, `conteneur.tsx` ou `topbar.tsx`, relisez le
  résultat — le compilateur ne voit pas ce genre de contradiction.
- **Quand deux branches répondent différemment à la même question de
  conception, tranchez et écrivez pourquoi** dans le message de fusion et dans
  ce fichier. Ne gardez pas les deux réponses « en attendant ».

Après la fusion, rejouez `typecheck`, `lint`, `build` **et** l'audit du rendu :
c'est la fusion, pas la branche, qui casse.

Déploiement, depuis `main` :
`bunx vercel@latest --prod --yes --archive=tgz --token "$VERCEL_TOKEN"` — un
`fetch failed` est fréquent et ne dit rien de la construction : le déploiement
est créé côté Vercel et continue. Vérifiez avec
`bunx vercel@latest inspect <url> --token "$VERCEL_TOKEN"` plutôt que de
relancer, sinon vous empilez les déploiements.
