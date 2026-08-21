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
| Contrat d'API | `bun run api:spec` — régénère `docs/openapi.json` |

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

`docs/openapi.json` (OpenAPI 3.0.3, 474 opérations) décrit l'API que le backend
doit servir pour remplacer `src/lib/mock/`. Il est **généré** par
`outils/openapi/` : ne l'éditez pas à la main, éditez le générateur, qui refuse
d'écrire un document incohérent. Les conventions — asynchrone par travail de
provisioning, confirmation par le nom sur les actions destructives, `403` qui
nomme le rôle requis, `424` daté quand une intégration amont tombe — sont
détaillées dans `docs/API.md`. Les noms de champs reprennent `src/lib/types.ts`
à l'identique : l'interface les consomme tels quels.

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

### Trois façons d'occuper toute la largeur

Trois univers clients portent des ressources et occupent tout l'écran :
Infrastructure, Applications, Web Cloud. Mais leur panneau de gauche ne dit pas
la même chose, et c'est la distinction à ne pas perdre.

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

**Les trois cas partagent la coquille** `CoquillePanneau`
(`src/components/app/cadre-section.tsx`) : panneau collé au bord gauche en
colonne au-delà de 1024 px, bandeau dépliant en dessous, et c'est le panneau qui
porte la marge du contenu — d'où l'absence de conteneur de page sur ces routes.

`gabarit()` rend `plein` (sous un panneau, quel qu'il soit), `large` (univers en
pleine largeur, écran sans panneau : les trois accueils, le relais SMTP — borné à
1600 px) ou `borne` (1400 px, le reste). `topbar.tsx` s'en sert aussi : les
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

## L'atelier — l'état mutable du back-office

`src/components/app/atelier.tsx` porte les créations, modifications et
suppressions faites dans `/admin` pendant une session. Monté dans
`admin/layout.tsx`, il prend une copie du jeu figé au montage et l'expose en
registres typés (`organisations`, `revendeurs`, `offres`, `tickets`, `backends`,
`campagnes`, `journal`…), chacun avec `ajouter`, `modifier`, `supprimer`,
`remplacer` et `reinitialiser`.

`src/lib/mock/` **reste figé** : c'est ce qui garantit qu'un rendu serveur et le
premier rendu client donnent le même HTML. L'atelier ne persiste rien —
recharger revient au jeu d'origine, et c'est voulu : une maquette qui accumule
les essais de la veille devient illisible en démonstration.

`useActe()` est la porte d'entrée des pages : un acte, c'est **la mutation, le
message à l'écran, la trace au journal**. Les séparer garantit qu'un jour l'une
des trois manquera — en pratique, la trace.

```tsx
const { organisations } = useAtelier()
const acte = useActe()

acte({
  faire: () => organisations.modifier(o.id, { statut: 'suspendue' }),
  ton: 'warn',
  titre: `${o.nom} suspendue`,
  detail: 'Les accès sont coupés, les données conservées intactes.',
  action: 'organisation.suspend',   // objet.verbe, comme dans AUDIT
  cible: o.id,
  orgId: o.id,
  orgNom: o.nom,
})
```

Trois conséquences à connaître :

- **Identifiants et horodatages restent déterministes** : `nouvelId()` compte,
  `horodatage()` part de `MAINTENANT`. Pas de `Math.random()`, pas d'horloge
  navigateur — le rendu ne doit pas diverger.
- **Les routes de détail ne font plus `notFound()`.** Une organisation créée
  pendant la session n'existe pas dans le jeu figé : un 404 du serveur ferait
  croire à une panne. C'est la vue cliente qui dit ce qu'elle ne trouve pas.
- **Un enregistrement ouvert dans un tiroir se relit dans le registre**
  (`registre.parId(detail.id)`), sinon il affiche la copie du clic et ne reflète
  pas ce qu'on vient d'y changer.

Ce que l'atelier ne fait pas : appeler un réseau, valider métier côté serveur,
gérer des écritures concurrentes. Ces trois-là appartiennent à
l'implémentation, pas à la maquette.

## Décisions déjà arbitrées

| Sujet | Décision |
|---|---|
| Polices | Montserrat + Open Sans + JetBrains Mono. La charte interdit Inter, qui était pourtant suggéré par le cahier : la charte gagne. |
| Socle du PaaS | Kubernetes managé via OpenStack Magnum, namespace par projet. Sans effet sur la maquette. |
| Sauvegardes | Un onglet par ressource **et** une section transverse `Sauvegardes & PRA` dans Infrastructure, qui porte les plans réutilisables, la restauration granulaire et le tableau de conformité 3-2-1 qu'on montre à un auditeur. |
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
