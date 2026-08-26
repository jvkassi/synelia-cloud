# Charte graphique — Synelia Cloud

La charte d'origine n'était pas dans le dépôt : elle avait été fournie en pièce
jointe, et ce que le produit appliquait réellement n'était écrit nulle part. Ce
fichier remplace cette pièce jointe. Il décrit ce qui est **en vigueur dans le
code**, pas une intention.

Les valeurs font foi dans `src/app/globals.css`. Si les deux divergent, c'est le
CSS qui a raison et ce fichier qui est en retard.

## L'ambiance : « Ronde & claire »

Trois directions complètes ont été comparées dans un labo temporaire — Wax,
Ronde & claire, Nuit électrique. **Ronde & claire a été retenue**, et le labo
supprimé une fois la variante reportée. Les deux autres restent récupérables
dans l'historique git au commit `8a26e88`.

Ce qui la caractérise, dans l'ordre d'importance :

1. **Du crème, pas du blanc.** Une seule valeur de fond change tout le
   ressenti. Le blanc clinique lisait « logiciel d'entreprise ».
2. **Une couleur chaude.** La charte n'avait que du violet, du magenta et du
   gris — aucune chance qu'une page paraisse accueillante. L'ocre et la terre
   viennent de là.
3. **Des rayons généreux.** 20 à 36 px sur les cartes, pastilles en `rounded-full`.
4. **Aucun dégradé, aucun flou.** Les aplats font le travail. Un contraste qui
   dépend d'un réglage d'opacité tombe dès qu'on change l'image derrière.

### Pourquoi le sombre a été abandonné sur la vitrine

Le héros violet foncé n'était pas triste parce qu'il était sombre : il était
triste parce qu'il était **désaturé**. Du violet moyen sur du violet foncé, tout
au même niveau d'énergie. Descendre le fond presque au noir et monter la
saturation des accents produit l'inverse — c'était la direction « Nuit
électrique », écartée pour la vitrine mais la démonstration tient.

## Couleurs

### Violet et magenta (inchangés)

| Jeton | Valeur | Usage |
|---|---|---|
| `p-900` | `#2b1b4d` | fonds sombres de l'espace client, `ink` |
| `p-800` | `#3a2266` | aplats sombres secondaires |
| `p-700` | `#4b2882` | bandeaux d'appel, boutons primaires |
| `p-600` | `#6b3fa0` | texte d'accent sur crème |
| `p-400` | `#9b7fd4` | texte secondaire sur fond sombre |
| `p-300` | `#c9b6f5` | texte tertiaire sur fond sombre |
| `p-100` | `#ede7f9` | fonds de pastille |
| `p-050` | `#f7f4fc` | fonds de tableau dans l'espace client |
| `m-600` | `#c0297a` | l'accroche, les accents |
| `m-400` | `#e766a6` | accroche **sur fond sombre uniquement** |

### La palette chaude (ajoutée avec Ronde & claire)

| Jeton | Valeur | Usage |
|---|---|---|
| `creme` | `#fbf4e8` | fond de page de la vitrine |
| `creme-2` | `#f3e7d3` | sections alternées, héros courts |
| `ocre` | `#e8a33d` | **aplat seulement**, jamais du texte |
| `terre` | `#a33a21` | second accent de titre |
| `encre-2` | `#241436` | texte courant de la vitrine |

## Contraste — la partie qui a coûté trois essais

Deux fonds coexistent sur la vitrine, `creme` et `creme-2`, et **c'est le
second qui contraint**. Valider une couleur contre le seul `creme` a produit
deux échecs successifs :

| Couleur | sur `creme` | sur `creme-2` | Verdict |
|---|---|---|---|
| `encre-2` | 15,6:1 | 14,0:1 | ✅ |
| `p-600` | 6,75:1 | 6,04:1 | ✅ |
| `terre` `#a33a21` | 6,03:1 | 5,40:1 | ✅ |
| `m-600` | 5,00:1 | 4,48:1 | ⚠️ grand texte seulement |
| `m-400` | 2,80:1 | 2,51:1 | ❌ jamais sur crème |
| `ocre` | 1,97:1 | 1,76:1 | ❌ jamais du texte |

Trois règles en découlent, et elles ne se négocient pas :

- **L'ocre ne porte jamais de texte.** Aplat sous de l'encre, fond de pastille,
  surligneur. C'est tout.
- **`m-600` ne sert qu'aux gros titres** sur crème. À 4,48:1 sur `creme-2` il
  est sous le seuil de 4,5:1 du texte courant, et n'y survit que parce que les
  accroches de héros sont à 46 px.
- **`m-400` et `p-300` sont réservés au fond sombre.** Huit accroches de héros
  étaient en `m-400` quand les héros sont passés au crème : 2,51:1, corrigées
  en `m-600`.

La terre a demandé trois valeurs. `#d4553b` du labo : 3,72:1, sous le seuil.
`#c14a2e` : 4,48:1, encore insuffisant en texte courant. `#a33a21` passe les
deux fonds. **Mesurer, ne pas estimer.**

## Typographie

| Rôle | Police | Jeton |
|---|---|---|
| Titres | Montserrat | `--font-display` |
| Texte | Open Sans | `--font-sans` |
| Chiffres, code | JetBrains Mono | `--font-mono` |

La charte interdit Inter, que le cahier des charges suggérait. La charte gagne.

Sur la vitrine les titres sont en `font-black` avec `tracking-[-0.02em]` à
`-0.03em` : c'est ce qui distingue le registre marketing du registre applicatif,
où les titres restent en `font-bold`.

**Piège :** `globals.css` applique `color: var(--color-ink)` à `h1`…`h6`. C'est
une règle sur l'élément, donc une couleur posée en `style` sur le **parent** ne
l'atteint pas. La couleur d'un titre se met sur le titre.

## Iconographie : la pâte à modeler

Dix-neuf pictogrammes dans `public/photos/pate-*.webp`, tous générés dans la
même matière pour former une famille : argile mate, arêtes biseautées, éclairage
d'atelier doux, fond crème, violet / magenta / ocre uniquement.

**Un produit, un pictogramme.** Les seize fiches produit portent un champ
`icone` ; les cartes de l'accueil aussi. Avant, la carte affichait la première
lettre du nom dans une pastille — ce qui n'apprenait rien.

| Produit | Pictogramme |
|---|---|
| Espace Cloud | `nuage` |
| Machines virtuelles | `serveurs` |
| Kubernetes managé | `kubernetes` (barre à roue) |
| Stockage objet S3 | `stockage-objet` |
| Stockage bloc | `volumes` |
| Load balancer | `load-balancer` |
| Cloud Backup | `sauvegarde` |
| PRA / DRaaS | `bouclier` |
| Réseau & VPN | `reseau-vpn` |
| IP & anti-DDoS | `ip-antiddos` |
| Bases managées | `bases-managees` |
| Hébergement web | `hebergement-web` |
| Domaines | `domaines` |
| DNS | `dns` |
| Relais SMTP | `smtp` |
| WordPress managé | `wordpress` |
| Drive Pro | `drive-pro` |

Plus `sites` (les deux datacenters) et `fusee` (le parcours de démarrage).

**Ce qui ne reçoit pas de pictogramme en pâte :** les solutions tierces du
marketplace — Nextcloud, Zimbra, Odoo. Elles gardent leurs initiales et leur
teinte de marque. Leur inventer une icône reviendrait à leur inventer une
identité visuelle qui n'est pas la nôtre.

## Photographies

`public/photos/*.webp`, générées, redimensionnées à 1600 px, WebP q76-82.
`og.jpg` reste en JPEG : tous les robots d'indexation ne décodent pas le WebP.

Deux garde-fous :

- **Pas de portrait.** La page équipe affiche des monogrammes et explique
  pourquoi. Les photos montrent des lieux, des baies, des mains. Une exception
  assumée : la photo d'équipe qui rit, environnementale et non cadrée en
  portrait — c'est le visuel qui fait le plus pour le ton du site.
- **Ce ne sont pas les vrais sites.** Ni Synertech Vallon, ni le parc VITIB.
  Chaque emplacement porte la mention « Vues d'illustration ». À remplacer par
  de vraies prises de vue avant tout usage commercial.

## Cartographie

La carte de la Côte d'Ivoire repose sur de **vraies coordonnées** — Natural
Earth via geoBoundaries, domaine public — figées dans `outils/illustrations.mjs`
pour que le générateur reste hors ligne. 1433 sommets réduits à 112 par
Douglas-Peucker à 0,05°.

Deux enseignements :

- **Un contour tapé à la main ne ressemble pas au pays.** La première version
  plaçait la pointe nord et la frontière ouest à côté ; le résultat se lisait
  comme une tache.
- **Trop de précision nuit.** À 0,03° et 207 sommets, le détail des lagunes se
  lit comme un gribouillis le long de la côte.

La version en pâte à modeler de l'accueil a été générée **avec la silhouette
réelle en image de référence**. Un modèle d'image livré à lui-même ne produit
pas une frontière juste : il produit une forme vraisemblable et fausse.

## Mouvement

Sobre, et en CSS natif — aucune dépendance d'animation.

| Utilitaire | Usage |
|---|---|
| `revele` | apparition au défilement, `animation-timeline: view()` |
| `animate-derive` | dérive lente d'un aplat décoratif |
| `animate-marquee` | carrousel de logos |
| `animate-pulse-dot` | pastille d'état |

Deux pièges, tous deux vérifiés :

- **`revele` vit sous `@supports (animation-timeline: view())`.** Hors de cette
  garde, un navigateur sans timelines de défilement appliquerait l'état initial
  — `opacity: 0` — et ne l'animerait jamais. Toute la page resterait invisible.
- **`prefers-reduced-motion` ne suffit pas par la durée.** La règle globale
  plafonne `animation-duration`, ce qui n'arrête pas une animation pilotée par
  une timeline. Il faut couper `animation-timeline` et rétablir l'état final
  explicitement.

La carte SVG s'anime de l'intérieur — `<style>` interne, pas de feuille
externe, qui ne serait pas chargée pour un SVG servi via `<img>`.

## Ce qui compte comme un défaut

`outils/audit.mjs` ouvre les 176 routes dans Chromium et relève cinq
indicateurs : erreurs console et HTTP, débordement horizontal, contraste sous le
seuil AA, boutons sans nom accessible, titres d'onglet par défaut.

**L'état attendu est zéro partout, à 390 px comme à 1440 px.** Une régression
sur l'un des cinq est un défaut, pas un arbitrage.

Ce que l'audit **ne** voit pas, et qu'il faut vérifier autrement :

- **Les liens sortants.** Il visite les routes de `outils/routes.json` ; il ne
  suit pas les `href`. La carte Drive Pro de l'accueil pointait sur
  `/offres/drive-pro`, qui renvoyait 404, sans que rien ne le signale.
- **Les ombres dures comptées comme « slop ».** Une métrique maison qui
  cherchait `Npx 0px 0px` dans `box-shadow` comptait en réalité les anneaux de
  focus, qui calculent `0px 0px 0px Npx`. Faux signal.

## Le slop, nommément

Ce qui a été retiré, et pourquoi c'était du slop :

- **Les ombres dures colorées** (`shadow-[0_8px_0_0_couleur]`). Sous deux
  cartes, c'était une barre violette et une barre magenta de huit pixels qui se
  lisaient comme des bordures épaisses.
- **Les halos flous et les voiles en dégradé.** La signature que toutes les
  vitrines de SaaS partagent depuis dix ans, et treize pages la portaient via un
  seul composant.
- **Les formes 3D flottantes du héros.** Décoratives et muettes. Remplacées par
  une scène qui dit ce que fait la plateforme : deux baies, deux épingles, un
  nuage.
- **Un cadre autour d'une image dont le fond est déjà celui de la page.** Il
  n'ajoutait qu'un rectangle visible autour de rien.
- **Une phrase de soixante-six caractères dans un `Badge`.** Le composant porte
  `whitespace-nowrap`, ce qui est juste pour un libellé court ; c'était l'usage
  qui était faux. C'est devenu une légende.

## Portée

Cette charte s'applique à la **vitrine** — le groupe `src/app/(site)`. L'espace
client (`/app`) et le back-office (`/admin`) gardent le fond blanc et la charte
violet/gris : ce sont des outils de travail denses, pas des pages de vente.

C'est pourquoi le crème est posé sur la coquille de `(site)` et **non sur
`body`** : la règle globale sert aussi les deux autres espaces.
