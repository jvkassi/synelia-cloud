/**
 * Audit complet du rendu : erreurs console, hydratation, débordement horizontal,
 * contraste, titres de page, boutons sans libellé accessible.
 * Passe en 1440 px puis en 390 px.
 */
import { readFileSync } from 'node:fs'

/*
 * Playwright n'est pas une dépendance du projet : il ne sert qu'à cet audit et
 * alourdirait chaque installation de production pour rien.
 *   bun add -d playwright
 * Le navigateur est déjà présent dans l'environnement de développement
 * (PLAYWRIGHT_BROWSERS_PATH) : inutile de lancer « playwright install ».
 */
let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.error(
    'Playwright est absent. Installez-le avec « bun add -d playwright », puis relancez.',
  )
  process.exit(1)
}

const routes = JSON.parse(readFileSync(new URL('./routes.json', import.meta.url), 'utf8'))

const BASE = process.env.BASE || 'http://127.0.0.1:3111'
const LARGEUR = Number(process.env.LARGEUR || 1440)
const HAUTEUR = Number(process.env.HAUTEUR || 1000)

const dansLaPage = () => {
  const parse = (c) => (c.match(/[\d.]+/g) || []).map(Number)
  const opaque = (c) => c.length >= 3 && (c[3] === undefined || c[3] > 0.85)
  const lum = ([r, g, b]) => {
    const f = (v) => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }

  // Débordement horizontal
  const debordement =
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      ? document.documentElement.scrollWidth - document.documentElement.clientWidth
      : 0

  // Éléments qui dépassent la largeur de la fenêtre
  const qui = []
  if (debordement > 0) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.right > window.innerWidth + 2 && r.width < window.innerWidth * 3) {
        const s = getComputedStyle(el)
        if (s.overflowX === 'auto' || s.overflowX === 'scroll') continue
        let parentScroll = false
        let n = el.parentElement
        while (n) {
          const ps = getComputedStyle(n)
          if (ps.overflowX === 'auto' || ps.overflowX === 'scroll') {
            parentScroll = true
            break
          }
          n = n.parentElement
        }
        if (!parentScroll) {
          qui.push(
            (el.tagName.toLowerCase() +
              '.' +
              String(el.className || '').split(' ').slice(0, 3).join('.')).slice(0, 90),
          )
        }
      }
      if (qui.length >= 4) break
    }
  }

  // Contraste : uniquement quand on peut résoudre un fond opaque
  const contraste = []
  for (const el of document.querySelectorAll('a, button, h1, h2, h3, p, span, td, th, li, dd, dt')) {
    if (el.children.length > 0 && el.textContent.trim() === '') continue
    const propre = [...el.childNodes].some(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 0,
    )
    if (!propre) continue
    const s = getComputedStyle(el)
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.3) continue
    const r = el.getBoundingClientRect()
    if (r.width < 4 || r.height < 4) continue
    const fg = parse(s.color)
    if (!opaque(fg)) continue
    let bg = null
    let n = el
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor)
      if (opaque(c)) {
        bg = c
        break
      }
      n = n.parentElement
    }
    if (!bg) continue
    const taille = parseFloat(s.fontSize)
    const gras = Number(s.fontWeight) >= 600
    const seuil = taille >= 24 || (taille >= 18.66 && gras) ? 3 : 4.5
    const rr = ratio(fg, bg)
    if (rr < seuil - 0.05) {
      contraste.push({
        t: el.textContent.trim().slice(0, 40),
        ratio: Math.round(rr * 100) / 100,
        seuil,
        fg: s.color,
        bg: `rgb(${bg.slice(0, 3).join(', ')})`,
      })
    }
    if (contraste.length >= 5) break
  }

  // Boutons/liens sans libellé accessible
  const muets = []
  for (const el of document.querySelectorAll('a, button')) {
    const r = el.getBoundingClientRect()
    if (r.width < 4 || r.height < 4) continue
    const nom = (
      el.getAttribute('aria-label') ||
      el.getAttribute('title') ||
      el.textContent ||
      ''
    ).trim()
    if (!nom) muets.push((el.tagName + '.' + String(el.className || '').slice(0, 50)).slice(0, 70))
    if (muets.length >= 4) break
  }

  return { debordement, qui, contraste, muets, titre: document.title }
}

;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const ctx = await b.newContext({ viewport: { width: LARGEUR, height: HAUTEUR } })
  const p = await ctx.newPage()

  let total = 0
  const resume = { erreurs: 0, debordement: 0, contraste: 0, muets: 0, titreDefaut: 0 }

  for (const u of routes) {
    const journal = []
    const onErr = (e) => journal.push('JS: ' + e.message.slice(0, 130))
    const onCons = (m) => {
      if (m.type() === 'error') journal.push('CONSOLE: ' + m.text().slice(0, 130))
    }
    const onResp = (r) => {
      if (r.status() >= 400) journal.push(r.status() + ' ' + r.url().replace(BASE, ''))
    }
    p.on('pageerror', onErr)
    p.on('console', onCons)
    p.on('response', onResp)

    let r
    try {
      await p.goto(BASE + u, { waitUntil: 'load', timeout: 45000 })
      await p.waitForLoadState('networkidle').catch(() => {})
      await p.waitForTimeout(400)
      r = await p.evaluate(dansLaPage)
    } catch (e) {
      journal.push('NAV: ' + e.message.slice(0, 120))
      r = { debordement: 0, qui: [], contraste: [], muets: [], titre: '' }
    }

    p.off('pageerror', onErr)
    p.off('console', onCons)
    p.off('response', onResp)

    const defauts = []
    if (journal.length) {
      defauts.push('ERREURS[' + journal.slice(0, 2).join(' | ') + ']')
      resume.erreurs++
    }
    if (r.debordement > 0) {
      defauts.push('DEBORD ' + r.debordement + 'px ' + JSON.stringify(r.qui))
      resume.debordement++
    }
    if (r.contraste.length) {
      defauts.push('CONTRASTE ' + JSON.stringify(r.contraste.slice(0, 2)))
      resume.contraste++
    }
    if (r.muets.length) {
      defauts.push('SANS-LIBELLE ' + JSON.stringify(r.muets.slice(0, 2)))
      resume.muets++
    }
    const titreGenerique = [
      'Synelia Cloud — Infrastructure cloud souveraine en Côte d’Ivoire',
      'Espace client · Synelia Cloud',
      'Espace fournisseur · Synelia Cloud',
    ]
    if (titreGenerique.includes(r.titre)) {
      defauts.push('TITRE-DEFAUT')
      resume.titreDefaut++
    }

    total++
    if (defauts.length) console.log(u.padEnd(40), '| ' + defauts.join('  '))
  }

  console.log('\n=== ' + LARGEUR + 'px — ' + total + ' routes ===')
  console.log(JSON.stringify(resume))
  await b.close()
})()
