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

### Applications, en maître-détail sur le projet

Huit sections : `Accueil · Projets · Déploiements · Observabilité · Backup ·
Domaines & routage · Variables & secrets · Paramètres`, toutes sous
`/app/applications/`.

Web Cloud donne à chaque section son propre panneau ; ici c'est **un seul
panneau partagé — le projet** (`CadreProjet`, monté dans chaque `layout.tsx`).
Les huit sections décrivent le même objet sous huit angles, donc changer
d'onglet ne doit pas redemander de quel projet on parle : `hrefSection()` dans
`topbar.tsx` reporte le projet courant dans l'adresse de la section visée.
Accueil n'a pas de panneau — c'est un tableau de bord.

L'univers est **en pleine largeur**, comme Web Cloud (`Conteneur`).

La fiche d'un projet n'a plus d'onglets : variables, domaines et paramètres
étaient des onglets dans un onglet, ils sont devenus des sections.

### Web Cloud, en maître-détail

Neuf sections : `Accueil · Domaines · Hébergement Web · Databases · Emails ·
Drive · Applications · SSL · Backup · Relais SMTP`.

Chaque section sauf Accueil a un **panneau de sélection persistant**, monté dans
son `layout.tsx` via `CadreSection` — jamais dans une page, sinon il se
reconstruit à chaque changement d'onglet. Accueil n'en a pas : c'est un tableau de
bord, il ne parle d'aucune ressource.

Web Cloud est **en pleine largeur** : `Conteneur` (dans `app/layout.tsx`) retire
la borne de 1400 px pour `/app/web`. Le reste de l'espace client la garde — un
paragraphe de 1900 px ne se lit pas.

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

## Branche

Le travail va sur `claude/univers-nav-restructure-1968bj`, poussé directement,
sans pull request. Déploiement :
`npx vercel@latest --prod --yes --archive=tgz --token "$VERCEL_TOKEN"` — un
`fetch failed` au premier essai est fréquent, le second passe.
