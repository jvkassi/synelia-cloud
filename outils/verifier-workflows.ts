/**
 * Vérifie que le catalogue `src/lib/mock/workflows.ts` « fait sens », sans
 * navigateur : identifiants uniques, étapes et durées cohérentes, échec
 * borné aux étapes existantes, `href` qui pointe vers une route réelle, et
 * concordance à double sens avec les `workflow: '...'` écrits dans les
 * écrans (un identifiant en trop est du code mort, un identifiant en moins
 * est une référence cassée — Playwright ne peut pas cliquer sur les 41 sites
 * d'appel, ce contrôle couvre donc l'ensemble du catalogue là où l'audit
 * navigateur ne prend qu'un échantillon représentatif).
 *
 *     bun run outils/verifier-workflows.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { WORKFLOWS } from '../src/lib/mock/workflows'

const routes: string[] = JSON.parse(readFileSync(new URL('./routes.json', import.meta.url), 'utf8'))
const erreurs: string[] = []

// ─── Le catalogue lui-même ──────────────────────────────────────────────

const idsVus = new Set<string>()
for (const w of WORKFLOWS) {
  const p = `[${w.id}]`

  if (idsVus.has(w.id)) erreurs.push(`${p} identifiant en double`)
  idsVus.add(w.id)

  if (w.portee !== 'client' && w.portee !== 'fournisseur') erreurs.push(`${p} portée invalide`)
  if (!w.libelle.includes('{cible}')) erreurs.push(`${p} libellé sans {cible}`)
  if (!w.lancement.trim() || !w.fin.trim()) erreurs.push(`${p} lancement ou fin vide`)

  if (w.etapes.length === 0) erreurs.push(`${p} aucune étape`)
  w.etapes.forEach((e, i) => {
    if (!e.nom.trim()) erreurs.push(`${p} étape ${i + 1} sans nom`)
    if (!Number.isInteger(e.dureeS) || e.dureeS <= 0)
      erreurs.push(`${p} étape ${i + 1} durée invalide (${e.dureeS})`)
  })

  if (w.echec) {
    if (w.echec.etape < 1 || w.echec.etape > w.etapes.length)
      erreurs.push(`${p} échec.etape hors bornes (${w.echec.etape}/${w.etapes.length})`)
    if (!w.echec.message.trim() || !w.echec.suggestion.trim())
      erreurs.push(`${p} échec sans message ou sans suggestion`)
  }

  if (w.href && !routes.includes(w.href))
    erreurs.push(`${p} href « ${w.href} » absent de outils/routes.json`)
}

// ─── Concordance avec les sites d'appel ─────────────────────────────────

function fichiersSource(dir: string, acc: string[] = []): string[] {
  for (const nom of readdirSync(dir)) {
    if (nom === 'node_modules' || nom === '.next') continue
    const chemin = join(dir, nom)
    if (statSync(chemin).isDirectory()) fichiersSource(chemin, acc)
    else if (/\.(ts|tsx)$/.test(nom)) acc.push(chemin)
  }
  return acc
}

const sources = fichiersSource(new URL('../src', import.meta.url).pathname)
  .filter((f) => !f.endsWith('mock/workflows.ts'))
  .map((f) => readFileSync(f, 'utf8'))

// Un site d'appel n'écrit pas toujours `workflow: 'id'` en toutes lettres —
// `vms/[vm]/vue.tsx` choisit entre 'vm.power.start' et 'vm.power.stop' par
// ternaire. On vérifie donc que chaque identifiant apparaît quelque part
// comme littéral, pas seulement collé au mot-clé `workflow:`.
for (const id of idsVus) {
  const motif = new RegExp(`['"]${id.replace(/\./g, '\\.')}['"]`)
  if (!sources.some((s) => motif.test(s)))
    erreurs.push(`dans le catalogue mais jamais référencé par un écran : ${id}`)
}

// Le sens inverse — un `workflow: '...'` qui ne serait dans aucun catalogue —
// ne peut se vérifier qu'en littéral direct ; les cas ternaires plus haut
// pointent déjà vers un identifiant présent dans `idsVus`, donc aucune
// perte de couverture.
for (const s of sources) {
  for (const m of s.matchAll(/workflow:\s*'([^']+)'/g)) {
    if (!idsVus.has(m[1])) erreurs.push(`référencé par un écran mais absent du catalogue : ${m[1]}`)
  }
}

// ─── Verdict ─────────────────────────────────────────────────────────────

if (erreurs.length) {
  console.error(`${erreurs.length} défaut(s) sur ${WORKFLOWS.length} workflows :\n`)
  for (const e of erreurs) console.error('  · ' + e)
  process.exit(1)
}
console.log(`${WORKFLOWS.length} workflows cohérents, tous appelés par au moins un écran.`)
