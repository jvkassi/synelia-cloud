/**
 * Génère les illustrations de la vitrine dans `public/illustrations/`.
 *
 * Pourquoi un générateur plutôt que des fichiers écrits à la main : la carte et
 * les schémas reposent sur des coordonnées et des projections. Les recalculer
 * à la main à chaque retouche produit des tracés faux, et un tracé faux sur une
 * carte de Côte d'Ivoire se voit tout de suite. Ici la géographie est une
 * donnée, la projection une fonction, et le SVG une sortie.
 *
 *   node outils/illustrations.mjs
 *
 * La sortie est déterministe : aucune source d'aléa, aucune date. Deux exécutions
 * donnent deux fichiers identiques, ce qui rend les diffs lisibles.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..')
const SORTIE = join(RACINE, 'public', 'illustrations')

/** La palette de la charte. Aucune couleur ne s'invente ici. */
const C = {
  p900: '#2b1b4d',
  p800: '#3a2266',
  p700: '#4b2882',
  p600: '#6b3fa0',
  p400: '#9b7fd4',
  p300: '#c9b6f5',
  p100: '#ede7f9',
  p050: '#f7f4fc',
  m600: '#c0297a',
  m400: '#e766a6',
  ok: '#15704d',
  g500: '#67677c',
  g300: '#c8c8d4',
  g100: '#efeff4',
  blanc: '#ffffff',
}

const arrondi = (n) => Number(n.toFixed(2))

// ───────────────────────────────────────────────────────────────────────────
// Géographie
// ───────────────────────────────────────────────────────────────────────────

/**
 * Contour de la Côte d'Ivoire, en (longitude, latitude).
 *
 * Ce sont de vraies coordonnées, pas une approximation : Natural Earth via
 * geoBoundaries (ADM0, domaine public), 1433 sommets réduits à 112 par
 * Douglas-Peucker à 0,05° — au-delà, le détail des lagunes se lit comme un
 * gribouillis le long de la côte. La version précédente était tapée à la main et
 * ne ressemblait pas au pays — la pointe nord tombait à 10,74° au lieu de
 * 10,73° au bon endroit, la frontière ouest s'arrêtait à -8,48° au lieu de
 * -8,62°, et le résultat se lisait comme une tache.
 *
 * Les valeurs sont figées ici pour que le générateur reste hors ligne et
 * déterministe : aucun appel réseau à la génération.
 */
const CONTOUR = [
  [-7.99, 10.162], [-8.174, 9.942], [-8.158, 9.531], [-8.054, 9.389], [-7.865, 9.41],
  [-7.93, 9.184], [-7.747, 9.076], [-7.932, 8.997], [-7.969, 8.813], [-7.697, 8.625],
  [-7.662, 8.375], [-7.971, 8.497], [-8.254, 8.447], [-8.266, 8.246], [-8.003, 8.184],
  [-7.963, 8.015], [-8.069, 8.029], [-8.229, 7.544], [-8.415, 7.613], [-8.485, 7.558],
  [-8.287, 6.994], [-8.352, 6.755], [-8.619, 6.493], [-8.418, 6.451], [-8.412, 6.34],
  [-7.914, 6.272], [-7.787, 5.958], [-7.494, 5.806], [-7.447, 5.846], [-7.39, 5.317],
  [-7.576, 5.072], [-7.574, 4.375], [-7.457, 4.344], [-6.903, 4.662], [-5.851, 5.03],
  [-5.002, 5.129], [-5.228, 5.204], [-5.187, 5.164], [-5.399, 5.142], [-5.322, 5.23],
  [-5.01, 5.216], [-4.893, 5.129], [-3.996, 5.232], [-4.184, 5.28], [-4.809, 5.18],
  [-4.673, 5.314], [-4.687, 5.232], [-4.564, 5.3], [-3.989, 5.269], [-3.906, 5.348],
  [-3.744, 5.274], [-3.805, 5.376], [-3.729, 5.267], [-4.002, 5.267], [-3.312, 5.12],
  [-3.262, 5.341], [-3.146, 5.369], [-3.205, 5.219], [-3.139, 5.142], [-2.767, 5.161],
  [-2.786, 5.595], [-2.946, 5.608], [-2.965, 5.71], [-3.03, 5.704], [-3.263, 6.617],
  [-3.225, 6.849], [-2.973, 7.215], [-2.942, 7.577], [-2.791, 7.943], [-2.611, 8.04],
  [-2.611, 8.165], [-2.506, 8.209], [-2.619, 8.924], [-2.775, 9.055], [-2.661, 9.254],
  [-2.689, 9.489], [-2.81, 9.411], [-3.215, 9.916], [-3.302, 9.841], [-3.317, 9.901],
  [-3.755, 9.936], [-4.15, 9.818], [-4.371, 9.583], [-4.502, 9.655], [-4.51, 9.745],
  [-4.681, 9.682], [-4.796, 9.754], [-4.798, 9.843], [-4.966, 9.901], [-4.963, 10.04],
  [-5.07, 10.11], [-5.136, 10.304], [-5.403, 10.301], [-5.594, 10.454], [-5.878, 10.376],
  [-6.016, 10.19], [-6.24, 10.252], [-6.181, 10.42], [-6.261, 10.514], [-6.204, 10.63],
  [-6.256, 10.726], [-6.427, 10.686], [-6.446, 10.552], [-6.669, 10.654], [-6.669, 10.361],
  [-6.961, 10.345], [-7.016, 10.141], [-7.363, 10.252], [-7.501, 10.459], [-7.664, 10.437],
  [-7.829, 10.212]
]

/** Les villes qui situent la carte. `site` marque nos deux datacenters. */
const VILLES = [
  { nom: 'Abidjan', lon: -4.008, lat: 5.336, site: true, ancre: 'fin' },
  { nom: 'Grand-Bassam', lon: -3.738, lat: 5.196, site: true, ancre: 'debut' },
  { nom: 'Yamoussoukro', lon: -5.273, lat: 6.827 },
  { nom: 'Bouaké', lon: -5.03, lat: 7.69 },
  { nom: 'San-Pédro', lon: -6.637, lat: 4.748 },
  { nom: 'Korhogo', lon: -5.629, lat: 9.458 },
]

const LON = [-8.75, -2.35]
const LAT = [4.2, 10.9]

/**
 * Projection équirectangulaire corrigée en longitude. À 7,5° de latitude le
 * facteur cos vaut 0,991 : négligeable en apparence, mais l'omettre étire le
 * pays de 1 % et suffit à décaler la côte.
 */
function projection(largeur, marge) {
  const cos = Math.cos((7.5 * Math.PI) / 180)
  const dLon = (LON[1] - LON[0]) * cos
  const dLat = LAT[1] - LAT[0]
  const utile = largeur - marge * 2
  const echelle = utile / dLon
  const hauteur = dLat * echelle + marge * 2
  return {
    hauteur: Math.round(hauteur),
    pt: (lon, lat) => [
      arrondi(marge + (lon - LON[0]) * cos * echelle),
      arrondi(marge + (LAT[1] - lat) * echelle),
    ],
  }
}

/**
 * Carte des deux sites. `sombre` produit la variante pour fond violet.
 *
 * Les deux sites sont à 30 km : à cette échelle leurs étiquettes se
 * chevauchent. D'où la bande de légende sous la carte plutôt que des libellés
 * posés sur le tracé — la première version se recouvrait et débordait à droite.
 */
function carteSites({ sombre }) {
  const L = 600
  const MARGE = 26
  const LEGENDE = 104
  const { hauteur: Hcarte, pt } = projection(L, MARGE)
  const H = Hcarte + LEGENDE
  const id = sombre ? 's' : 'c'

  const trait = CONTOUR.map((p, i) => `${i ? 'L' : 'M'}${pt(...p).join(' ')}`).join('') + 'Z'

  const t = sombre
    ? { bord: C.p400, texte: C.blanc, faible: C.p300, grille: 'rgba(255,255,255,.07)', fondLeg: 'rgba(255,255,255,.06)', bordLeg: 'rgba(255,255,255,.16)' }
    : { bord: C.p600, texte: C.p900, faible: C.g500, grille: 'rgba(43,27,77,.06)', fondLeg: C.p050, bordLeg: C.g300 }

  const abj = pt(VILLES[0].lon, VILLES[0].lat)
  const gbm = pt(VILLES[1].lon, VILLES[1].lat)

  const reperes = VILLES.filter((v) => !v.site)
    .map((v) => {
      const [x, y] = pt(v.lon, v.lat)
      return `<g><circle cx="${x}" cy="${y}" r="2.5" fill="${t.faible}" opacity=".7"/>` +
        `<text x="${x + 7}" y="${y + 3.5}" font-size="10.5" fill="${t.faible}" font-family="'Open Sans',system-ui,sans-serif">${v.nom}</text></g>`
    })
    .join('')

  /** Un site : halo, pastille magenta, numéro repris dans la légende. */
  const site = ([x, y], n, rang) => `<g>
      <circle class="halo${rang === 2 ? ' halo-2' : ''}" cx="${x}" cy="${y}" r="16" fill="${C.m600}" opacity=".15"/>
      <circle cx="${x}" cy="${y}" r="10" fill="${C.m600}" opacity=".3"/>
      <circle cx="${x}" cy="${y}" r="6.5" fill="${C.m400}" stroke="${sombre ? C.p900 : C.blanc}" stroke-width="1.8"/>
      <text x="${x}" y="${y + 3.4}" text-anchor="middle" font-size="9" font-weight="700" fill="${C.p900}" font-family="Montserrat,system-ui,sans-serif">${n}</text>
    </g>`

  // Un repère numéroté dans la légende, aligné sur la pastille de la carte.
  const entree = (x, n, nom, sous) => `<g>
      <circle cx="${x + 9}" cy="26" r="6.5" fill="${C.m400}"/>
      <text x="${x + 9}" y="29.4" text-anchor="middle" font-size="9" font-weight="700" fill="${C.p900}" font-family="Montserrat,system-ui,sans-serif">${n}</text>
      <text x="${x + 23}" y="23" font-size="12.5" font-weight="700" fill="${t.texte}" font-family="Montserrat,system-ui,sans-serif">${nom}</text>
      <text x="${x + 23}" y="38" font-size="10.5" fill="${t.faible}" font-family="'Open Sans',system-ui,sans-serif">${sous}</text>
    </g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${H}" width="${L}" height="${H}" role="img" aria-label="Carte de la Côte d'Ivoire : les deux sites de Synelia, Abidjan (Synertech Vallon, Cocody) et Grand-Bassam (parc VITIB), reliés par une liaison de 4 à 6 millisecondes">
  <defs>
    <linearGradient id="${id}-terre" x1="0" y1="0" x2="0.4" y2="1">
      ${sombre
        ? `<stop offset="0" stop-color="#54308f"/><stop offset="1" stop-color="#3a2266"/>`
        : `<stop offset="0" stop-color="${C.p100}"/><stop offset="1" stop-color="#ddd2f4"/>`}
    </linearGradient>
    <pattern id="${id}-grille" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0V24" fill="none" stroke="${t.grille}" stroke-width="1"/>
    </pattern>
    <clipPath id="${id}-pays"><path d="${trait}"/></clipPath>
  </defs>

  <style>
    /*
     * L'animation vit dans le fichier : une feuille externe ne serait pas
     * chargée pour un SVG servi via &lt;img&gt;, un &lt;style&gt; interne si.
     * La liaison inter-site défile et les halos respirent — c'est la seule
     * chose qui bouge, et elle désigne précisément ce que la carte raconte.
     */
    .lien { stroke-dasharray: 4 3; animation: marche 1.1s linear infinite; }
    .halo { animation: souffle 3.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
    .halo-2 { animation-delay: -1.7s; }
    @keyframes marche { to { stroke-dashoffset: -14; } }
    @keyframes souffle {
      0%, 100% { opacity: .15; transform: scale(1); }
      50% { opacity: .32; transform: scale(1.18); }
    }
    @media (prefers-reduced-motion: reduce) {
      .lien, .halo { animation: none; }
    }
  </style>
  <path d="${trait}" fill="url(#${id}-terre)"/>
  <g clip-path="url(#${id}-pays)"><rect width="${L}" height="${Hcarte}" fill="url(#${id}-grille)"/></g>
  <path d="${trait}" fill="none" stroke="${t.bord}" stroke-width="1.8" stroke-linejoin="round"/>

  ${reperes}
  <path class="lien" d="M${abj.join(' ')}L${gbm.join(' ')}" fill="none" stroke="${C.m400}" stroke-width="2"/>
  ${site(abj, 1, 1)}
  ${site(gbm, 2, 2)}

  <g transform="translate(0 ${Hcarte})">
    <rect x="${MARGE}" y="0" width="${L - MARGE * 2}" height="64" rx="11" fill="${t.fondLeg}" stroke="${t.bordLeg}" stroke-width="1.2"/>
    ${entree(MARGE + 12, 1, 'Abidjan', 'Synertech Vallon · Cocody')}
    ${entree(MARGE + 216, 2, 'Grand-Bassam', 'Parc VITIB')}
    <g>
      <path d="M${MARGE + 424} 26h22" stroke="${C.m400}" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="${MARGE + 424}" y="16" font-size="10.5" fill="${t.faible}" font-family="'Open Sans',system-ui,sans-serif">liaison inter-site</text>
      <text x="${MARGE + 452}" y="30" font-size="12.5" font-weight="700" fill="${sombre ? C.blanc : C.m600}" font-family="'JetBrains Mono',ui-monospace,monospace">4–6 ms</text>
    </g>
  </g>
</svg>
`
}

// ───────────────────────────────────────────────────────────────────────────
// Schémas
// ───────────────────────────────────────────────────────────────────────────

/** Cadre à coins arrondis, titre et sous-titre. Le motif de base des schémas. */
function boite({ x, y, l, h, titre, sous, teinte = C.p700, fond = C.blanc, texte = C.p900, faible = C.g500, trait }) {
  const b = trait ?? C.g300
  return `<g>
    <rect x="${x}" y="${y}" width="${l}" height="${h}" rx="10" fill="${fond}" stroke="${b}" stroke-width="1.4"/>
    <rect x="${x}" y="${y}" width="${l}" height="3.5" rx="1.75" fill="${teinte}"/>
    <text x="${x + l / 2}" y="${y + h / 2 - (sous ? 3 : -4)}" text-anchor="middle" font-size="12.5" font-weight="700" fill="${texte}" font-family="Montserrat,system-ui,sans-serif">${titre}</text>
    ${sous ? `<text x="${x + l / 2}" y="${y + h / 2 + 13}" text-anchor="middle" font-size="10.5" fill="${faible}" font-family="'Open Sans',system-ui,sans-serif">${sous}</text>` : ''}
  </g>`
}

/** Flèche horizontale étiquetée. */
function fleche({ x1, x2, y, label, couleur = C.p400, pointille }) {
  const mx = arrondi((x1 + x2) / 2)
  return `<g>
    <path d="M${x1} ${y}H${x2 - 7}" fill="none" stroke="${couleur}" stroke-width="1.8"${pointille ? ' stroke-dasharray="5 4"' : ''}/>
    <path d="M${x2 - 8} ${y - 4.5}L${x2} ${y}L${x2 - 8} ${y + 4.5}Z" fill="${couleur}"/>
    ${label ? `<text x="${mx}" y="${y - 9}" text-anchor="middle" font-size="10" fill="${C.g500}" font-family="'Open Sans',system-ui,sans-serif">${label}</text>` : ''}
  </g>`
}

/**
 * La règle 3-2-1 telle que nous l'appliquons : trois copies, deux supports,
 * une hors site. Le schéma nomme chaque copie et son site — c'est ce qu'un
 * auditeur demande, et c'est ce qu'un tableau de chiffres ne montre pas.
 */
function sauvegarde321() {
  const L = 760, H = 306
  const yb = 96, hb = 74

  const copies = [
    { x: 40, l: 168, titre: 'Production', sous: 'Espace Cloud · ABJ', teinte: C.p700, tag: null },
    { x: 258, l: 168, titre: 'Instantané local', sous: 'NVMe · Vallon (ABJ)', teinte: C.p600, tag: 'copie 1' },
    { x: 476, l: 168, titre: 'Réplique hors site', sous: 'Objet S3 · VITIB (GBM)', teinte: C.m600, tag: 'copie 2' },
  ]

  const immuable = { x: 476, l: 168, y: 212, h: 64 }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${H}" width="${L}" height="${H}" role="img" aria-label="Schéma de la règle 3-2-1 : production à Abidjan, instantané local sur NVMe, réplique hors site sur stockage objet à Grand-Bassam, et copie immuable verrouillée quatorze jours">
  <defs>
    <linearGradient id="v-cadre" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.p050}"/><stop offset="1" stop-color="${C.blanc}"/>
    </linearGradient>
  </defs>
  <rect width="${L}" height="${H}" rx="14" fill="url(#v-cadre)" stroke="${C.g300}" stroke-width="1.2"/>

  <text x="40" y="38" font-size="11" font-weight="700" letter-spacing="1.1" fill="${C.m600}" font-family="Montserrat,system-ui,sans-serif">RÈGLE 3-2-1</text>
  <text x="40" y="62" font-size="15" font-weight="700" fill="${C.p900}" font-family="Montserrat,system-ui,sans-serif">Trois copies, deux supports, une hors site</text>

  ${copies.map((c) => boite({ x: c.x, y: yb, l: c.l, h: hb, titre: c.titre, sous: c.sous, teinte: c.teinte })).join('')}
  ${copies
    .filter((c) => c.tag)
    .map(
      (c) => `<g><rect x="${c.x + c.l - 62}" y="${yb + hb - 20}" width="54" height="17" rx="8.5" fill="${C.p100}"/>
      <text x="${c.x + c.l - 35}" y="${yb + hb - 8}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${C.p700}" font-family="'Open Sans',system-ui,sans-serif">${c.tag}</text></g>`,
    )
    .join('')}

  ${fleche({ x1: 214, x2: 252, y: yb + hb / 2, label: '15 min' })}
  ${fleche({ x1: 432, x2: 470, y: yb + hb / 2, label: '1 h', couleur: C.m400 })}

  <path d="M560 ${yb + hb}V${immuable.y}" fill="none" stroke="${C.ok}" stroke-width="1.8" stroke-dasharray="5 4"/>
  <path d="M555.5 ${immuable.y - 8}L560 ${immuable.y}L564.5 ${immuable.y - 8}Z" fill="${C.ok}"/>
  ${boite({
    x: immuable.x,
    y: immuable.y,
    l: immuable.l,
    h: immuable.h,
    titre: 'Copie immuable',
    sous: 'verrou 14 j · non effaçable',
    teinte: C.ok,
    trait: '#b9dccd',
  })}

  <g>
    <rect x="40" y="${immuable.y}" width="404" height="${immuable.h}" rx="10" fill="${C.blanc}" stroke="${C.g300}" stroke-width="1.4" stroke-dasharray="4 4"/>
    <text x="58" y="${immuable.y + 21}" font-size="11.5" font-weight="700" fill="${C.p900}" font-family="Montserrat,system-ui,sans-serif">Ce que le schéma ne promet pas</text>
    <text x="58" y="${immuable.y + 37}" font-size="10.5" fill="${C.g500}" font-family="'Open Sans',system-ui,sans-serif">Une sauvegarde n'est prouvée que par une restauration.</text>
    <text x="58" y="${immuable.y + 51}" font-size="10.5" fill="${C.g500}" font-family="'Open Sans',system-ui,sans-serif">Les nôtres sont exercées chaque trimestre, rapport à l'appui.</text>
  </g>
</svg>
`
}

/**
 * Une rangée de baies en projection isométrique. Sert de visuel de site : on y
 * lit le nombre de baies et leur remplissage, pas une photo de salle blanche
 * qui pourrait être n'importe où.
 */
function datacenter() {
  const L = 620, H = 380
  // Projection isométrique classique : 30° sur les deux axes du sol.
  const ux = [Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)]
  const uy = [-Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)]
  const O = [310, 132]
  const iso = (a, b, z) => [
    arrondi(O[0] + a * ux[0] * 26 + b * uy[0] * 26),
    arrondi(O[1] + a * ux[1] * 26 + b * uy[1] * 26 - z * 26),
  ]

  const face = (pts, fill, trait) =>
    `<path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${p.join(' ')}`).join('')}Z" fill="${fill}"${trait ? ` stroke="${trait}" stroke-width=".9"` : ''}/>`

  /** Une baie : trois faces, plus des unités allumées sur la face avant. */
  const baie = (a, b, h, remplissage, accent) => {
    const dessus = [iso(a, b, h), iso(a + 1, b, h), iso(a + 1, b + 1, h), iso(a, b + 1, h)]
    const gauche = [iso(a, b + 1, h), iso(a + 1, b + 1, h), iso(a + 1, b + 1, 0), iso(a, b + 1, 0)]
    const droite = [iso(a + 1, b, h), iso(a + 1, b + 1, h), iso(a + 1, b + 1, 0), iso(a + 1, b, 0)]

    const n = Math.round(h * 4)
    const allumees = Math.round(n * remplissage)
    const unites = Array.from({ length: n }, (_, i) => {
      const z0 = ((i + 0.18) * h) / n
      const z1 = ((i + 0.82) * h) / n
      const q = [iso(a + 0.12, b + 1, z0), iso(a + 0.88, b + 1, z0), iso(a + 0.88, b + 1, z1), iso(a + 0.12, b + 1, z1)]
      const on = n - 1 - i < allumees
      return face(q, on ? (accent ? C.m400 : C.p300) : 'rgba(255,255,255,.08)')
    }).join('')

    return `<g>${face(droite, '#2f1c57')}${face(gauche, accent ? '#5b3390' : '#472a7d')}${unites}${face(dessus, accent ? '#7a4bb5' : '#5f399f', 'rgba(255,255,255,.14)')}</g>`
  }

  // Le sol, puis deux rangées de quatre baies. Dessin de l'arrière vers l'avant.
  const sol = [iso(-1.4, -1.4, 0), iso(9.4, -1.4, 0), iso(9.4, 4.4, 0), iso(-1.4, 4.4, 0)]

  const baies = []
  for (let b = 0; b <= 2; b += 2) {
    for (let a = 0; a < 8; a += 2) {
      const rang = b === 0 ? 0 : 1
      const accent = rang === 1 && a === 4
      baies.push(baie(a, b, 2.6 - (a % 4 === 0 ? 0 : 0.35), 0.55 + (a / 8) * 0.35, accent))
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${H}" width="${L}" height="${H}" role="img" aria-label="Vue isométrique de deux rangées de baies, dont une baie mise en avant, dans un site Synelia">
  <defs>
    <linearGradient id="d-sol" x1="0" y1="0" x2=".6" y2="1">
      <stop offset="0" stop-color="#3d2470"/><stop offset="1" stop-color="#2b1b4d"/>
    </linearGradient>
    <radialGradient id="d-lueur" cx=".5" cy=".42" r=".6">
      <stop offset="0" stop-color="${C.m600}" stop-opacity=".28"/>
      <stop offset="1" stop-color="${C.m600}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${L}" height="${H}" rx="14" fill="${C.p900}"/>
  <rect width="${L}" height="${H}" rx="14" fill="url(#d-lueur)"/>
  ${face(sol, 'url(#d-sol)', 'rgba(255,255,255,.08)')}
  ${baies.join('')}
  <g>
    <text x="30" y="40" font-size="10.5" font-weight="700" letter-spacing="1.1" fill="${C.p300}" font-family="Montserrat,system-ui,sans-serif">SITE ABJ · SYNERTECH VALLON</text>
    <text x="30" y="${H - 30}" font-size="10.5" fill="${C.p300}" font-family="'Open Sans',system-ui,sans-serif">2 rangées · 8 baies · alimentation et refroidissement redondants</text>
  </g>
</svg>
`
}

/**
 * L'architecture d'un Espace Cloud. Montre la frontière du locataire : ce qui
 * est à lui, ce qui est à nous. C'est la question posée à chaque atelier de
 * cadrage.
 */
function architectureEspaceCloud() {
  const L = 760, H = 362

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${H}" width="${L}" height="${H}" role="img" aria-label="Architecture d'un Espace Cloud : Internet, pare-feu et répartiteur de charge, deux sous-réseaux de machines virtuelles, stockage bloc et objet, et le socle opéré par Synelia sous le périmètre piloté par le client">
  <defs>
    <linearGradient id="a-fond" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.p050}"/><stop offset="1" stop-color="${C.blanc}"/>
    </linearGradient>
  </defs>
  <rect width="${L}" height="${H}" rx="14" fill="url(#a-fond)" stroke="${C.g300}" stroke-width="1.2"/>

  <text x="34" y="32" font-size="11" font-weight="700" letter-spacing="1.1" fill="${C.m600}" font-family="Montserrat,system-ui,sans-serif">ESPACE CLOUD (VDC)</text>

  <!--
    Le périmètre du locataire s'arrête avant le socle : c'est la question posée
    à chaque atelier de cadrage — qui règle quoi. La première version faisait
    déborder le socle dans le cadre, ce qui disait le contraire.
  -->
  <g>
    <rect x="150" y="52" width="576" height="228" rx="12" fill="none" stroke="${C.p400}" stroke-width="1.4" stroke-dasharray="6 5"/>
    <rect x="166" y="42" width="200" height="20" rx="10" fill="${C.p100}"/>
    <text x="266" y="56" text-anchor="middle" font-size="10" font-weight="700" fill="${C.p700}" font-family="'Open Sans',system-ui,sans-serif">périmètre piloté par le client</text>
  </g>

  ${boite({ x: 30, y: 138, l: 100, h: 60, titre: 'Internet', sous: 'BGP · 2 transits', teinte: C.g500 })}
  ${fleche({ x1: 130, x2: 174, y: 168 })}

  ${boite({ x: 176, y: 124, l: 118, h: 88, titre: 'Pare-feu', sous: 'WAF · anti-DDoS', teinte: C.p700 })}
  ${fleche({ x1: 294, x2: 336, y: 168 })}

  ${boite({ x: 338, y: 124, l: 118, h: 88, titre: 'Répartiteur', sous: '2 chemins', teinte: C.p600 })}

  <!-- Le sous-réseau public expose ; le privé ne sort que par le répartiteur. -->
  ${boite({ x: 500, y: 74, l: 200, h: 58, titre: 'Sous-réseau public', sous: '2 VM · web', teinte: C.p600 })}
  ${boite({ x: 500, y: 144, l: 200, h: 58, titre: 'Sous-réseau privé', sous: '3 VM · applicatif et base', teinte: C.p800 })}

  <path d="M456 152H478V103H494" fill="none" stroke="${C.p400}" stroke-width="1.8"/>
  <path d="M486 98.5L494 103L486 107.5Z" fill="${C.p400}"/>
  <path d="M456 184H478V173H494" fill="none" stroke="${C.p400}" stroke-width="1.8"/>
  <path d="M486 168.5L494 173L486 177.5Z" fill="${C.p400}"/>

  ${boite({ x: 500, y: 214, l: 96, h: 52, titre: 'Bloc', sous: 'NVMe', teinte: C.m600 })}
  ${boite({ x: 604, y: 214, l: 96, h: 52, titre: 'Objet', sous: 'S3', teinte: C.m600 })}
  <path d="M548 202V214M652 202V214" fill="none" stroke="${C.p400}" stroke-width="1.6" stroke-dasharray="4 3"/>

  <!-- Sous le périmètre : ce que nous opérons, et que le client ne règle pas. -->
  <g>
    <rect x="30" y="296" width="696" height="46" rx="10" fill="${C.p900}"/>
    <text x="50" y="316" font-size="11.5" font-weight="700" fill="${C.blanc}" font-family="Montserrat,system-ui,sans-serif">Socle opéré par Synelia</text>
    <text x="50" y="332" font-size="10.5" fill="${C.p300}" font-family="'Open Sans',system-ui,sans-serif">hyperviseurs, réseau physique, stockage, supervision, sauvegarde — hors du périmètre client</text>
  </g>
</svg>
`
}

/**
 * Les trois vérifications de souveraineté. Trois pictogrammes distincts : la
 * page en affichait trois fois le même bouclier, ce qui n'aidait personne à
 * distinguer les questions.
 */
function souverainete(variante) {
  const S = 96
  const cadre = (corps) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="${variante.alt}">
  <rect width="${S}" height="${S}" rx="20" fill="${C.p100}"/>
  ${corps}
</svg>
`

  if (variante.cle === 'lieu') {
    // Deux sites nommés, et une épingle : « où sont vos données ».
    return cadre(`
  <rect x="20" y="52" width="22" height="26" rx="3" fill="${C.p600}"/>
  <rect x="54" y="60" width="22" height="18" rx="3" fill="${C.p400}"/>
  <path d="M20 78h56" stroke="${C.p700}" stroke-width="2.4" stroke-linecap="round"/>
  <g fill="${C.blanc}" opacity=".85">
    <rect x="24" y="57" width="5" height="5" rx="1"/><rect x="33" y="57" width="5" height="5" rx="1"/>
    <rect x="24" y="66" width="5" height="5" rx="1"/><rect x="33" y="66" width="5" height="5" rx="1"/>
    <rect x="58" y="65" width="5" height="5" rx="1"/><rect x="67" y="65" width="5" height="5" rx="1"/>
  </g>
  <path d="M48 16c-7.2 0-13 5.8-13 13 0 9.4 13 20 13 20s13-10.6 13-20c0-7.2-5.8-13-13-13z" fill="${C.m600}"/>
  <circle cx="48" cy="29" r="4.6" fill="${C.blanc}"/>`)
  }

  if (variante.cle === 'acces') {
    // Une matrice de droits, une clé, et une ligne refusée : « qui peut accéder ».
    return cadre(`
  <rect x="18" y="20" width="60" height="56" rx="6" fill="${C.blanc}" stroke="${C.p400}" stroke-width="1.8"/>
  <path d="M18 36h60M40 20v56M59 20v56" stroke="${C.p400}" stroke-width="1.4"/>
  <g fill="${C.p600}">
    <rect x="24" y="43" width="10" height="4" rx="2"/><rect x="24" y="56" width="10" height="4" rx="2"/><rect x="24" y="67" width="10" height="4" rx="2"/>
  </g>
  <path d="M45.5 46.5l2.6 2.6 5.2-5.2" stroke="${C.ok}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M64.5 44.5l5.6 5.6M70.1 44.5l-5.6 5.6" stroke="${C.m600}" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M45.5 59.5l2.6 2.6 5.2-5.2" stroke="${C.ok}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M64.5 57.5l5.6 5.6M70.1 57.5l-5.6 5.6" stroke="${C.m600}" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M45.5 70.5l2.6 2.6 5.2-5.2" stroke="${C.ok}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="67.3" cy="70.5" r="3.2" fill="none" stroke="${C.p600}" stroke-width="2.2"/>
  <path d="M24 27h12M45 27h9M62 27h12" stroke="${C.p300}" stroke-width="2.6" stroke-linecap="round"/>`)
  }

  // Un export qui sort du cadre : « comment vous repartez ».
  return cadre(`
  <rect x="16" y="26" width="44" height="48" rx="6" fill="${C.blanc}" stroke="${C.p400}" stroke-width="1.8"/>
  <path d="M24 38h26M24 48h26M24 58h16" stroke="${C.p300}" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M46 50h28" stroke="${C.m600}" stroke-width="3" stroke-linecap="round"/>
  <path d="M67 41l9 9-9 9" fill="none" stroke="${C.m600}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="60" y="20" width="20" height="14" rx="3" fill="${C.p600}"/>
  <text x="70" y="30.5" text-anchor="middle" font-size="8" font-weight="700" fill="${C.blanc}" font-family="'JetBrains Mono',monospace">CSV</text>
  <rect x="60" y="66" width="20" height="14" rx="3" fill="${C.p700}"/>
  <text x="70" y="76.5" text-anchor="middle" font-size="8" font-weight="700" fill="${C.blanc}" font-family="'JetBrains Mono',monospace">SQL</text>`)
}

// ───────────────────────────────────────────────────────────────────────────

const FICHIERS = {
  'carte-sites.svg': carteSites({ sombre: false }),
  'carte-sites-sombre.svg': carteSites({ sombre: true }),
  'sauvegarde-321.svg': sauvegarde321(),
  'datacenter.svg': datacenter(),
  'architecture-espace-cloud.svg': architectureEspaceCloud(),
  'souverainete-lieu.svg': souverainete({ cle: 'lieu', alt: 'Deux bâtiments et une épingle : où sont vos données' }),
  'souverainete-acces.svg': souverainete({ cle: 'acces', alt: 'Une matrice de droits avec des accès accordés et refusés : qui peut y accéder' }),
  'souverainete-sortie.svg': souverainete({ cle: 'sortie', alt: 'Un document exporté en CSV et SQL hors du cadre : comment vous repartez' }),
}

mkdirSync(SORTIE, { recursive: true })
for (const [nom, contenu] of Object.entries(FICHIERS)) {
  writeFileSync(join(SORTIE, nom), contenu, 'utf8')
  console.log(`${nom}  ${contenu.length} o`)
}
console.log(`\n${Object.keys(FICHIERS).length} illustrations écrites dans public/illustrations/`)
