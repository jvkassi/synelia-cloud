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
  Web Cloud · IAM & sécurité`. Fournisseur — `Pilotage · Clients ·
  Infrastructure · Produit · Finance · Exploitation`.
- **Barre 2** : les sections de l'univers courant.

`sectionActive()` résout au **préfixe le plus long** : `/app/reseau/lb` désigne
les load balancers, pas le réseau. Le champ `aussi` rattache les routes sans
onglet propre (`/app/dns` → Domaines, `/app/taches` → Tableau de bord).

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

1. **`/app/docs`** — pas de parcours de formation, ni de suivi de complétion, ni
   d'accès au bac à sable.
2. **Fiche revendeur** — il manque *Périmètre de catalogue* et *API & intégration*.
3. **`/admin/catalogue`** — le cahier demande un découpage par famille (Espace
   Cloud, images VM, clusters, stacks, web) ; on a un tableau unique.
4. **Anglais** — aucun mécanisme d'internationalisation ; tous les libellés sont
   en français en dur. Le cahier ne demande que la structure, pas la traduction.
   C'est le seul chantier de la liste qui se compte en jours.
5. **Lanceur comme page d'accueil** — l'écran existe et l'explique, mais aucun
   réglage ne le fixe pour les membres au rôle purement utilisateur.

Fait depuis : l'assistant `/app/kubernetes/new` (cinq étapes), l'onglet
*Sessions actives* de `/app/securite` et sa politique d'organisation, le centre
de tâches `/app/taches`, le glisser-déposer de composition de serveurs qui livre
réellement ses lots (`/app/vms/composer`), et le câblage complet de l'espace
fournisseur sur l'atelier — organisations, catalogue, capacité, marketplace,
tickets, équipe, conformité, recouvrement, revendeurs.

## Style d'écriture

Le code et l'interface sont **en français**, y compris les noms de variables et
de composants métier. Les commentaires expliquent *pourquoi*, pas *quoi* — et
seulement quand le choix n'est pas évident. Les textes d'interface disent ce que
le produit fait **et ce qu'il ne fait pas** : c'est souvent l'information la plus
utile avant de s'engager.

## Branche

Le travail va sur `claude/fake-workflows-crud-hmks5e`, poussé directement,
sans pull request. Déploiement :
`npx vercel@latest --prod --yes --archive=tgz --token "$VERCEL_TOKEN"` — un
`fetch failed` au premier essai est fréquent, le second passe.
