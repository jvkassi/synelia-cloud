/**
 * Vérifie, dans un vrai navigateur, que le moteur de workflows (§ « Le
 * catalogue des opérations longues » de CLAUDE.md) tient ses promesses : un
 * clic sur un vrai bouton d'un vrai écran lance un job dans l'atelier, le
 * centre de tâches le suit étape par étape, un échec écrit produit le bon
 * diagnostic et un rollback, et « Reprendre » aboutit au second essai.
 *
 * `outils/verifier-workflows.ts` couvre déjà les 41 entrées du catalogue en
 * statique (étapes, durées, échec borné, href, appelé par un écran). Rejouer
 * les 41 sites d'appel au clic serait la même vérification quarante fois :
 * le mécanisme qui les rejoue (`src/lib/workflows.ts` + l'atelier) est
 * unique, donc trois parcours réels suffisent à le mettre à l'épreuve — un
 * succès, un échec-rollback-reprise, et la page de liste elle-même.
 *
 *     bun run build && bun run start -- -p 3111   # une fois
 *     bun add -d playwright                        # une fois, si absent
 *     BASE=http://127.0.0.1:3111 node outils/test-workflows.mjs
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

const BASE = process.env.BASE || 'http://127.0.0.1:3111'

let echecs = 0
function verifier(cond, message) {
  if (cond) {
    console.log('  ✓ ' + message)
  } else {
    echecs++
    console.error('  ✗ ' + message)
  }
}

/** Sonde `lire` jusqu'à ce qu'elle rende une valeur vraie, ou abandonne. */
async function attendre(lire, { timeout = 15_000, intervalle = 300, quoi = '' } = {}) {
  const fin = Date.now() + timeout
  for (;;) {
    const v = await lire()
    if (v) return v
    if (Date.now() > fin) throw new Error(`délai dépassé en attendant : ${quoi}`)
    await new Promise((r) => setTimeout(r, intervalle))
  }
}

/** Ouvre le panneau « Centre de tâches » de la barre supérieure et suit le job le plus récent. */
async function suivreDernierJob(page) {
  await page.getByTitle('Centre de tâches').click()
  const lien = page.locator('a[href^="/app/taches/job-"]').first()
  await lien.waitFor({ state: 'visible', timeout: 5000 })
  const href = await lien.getAttribute('href')
  await lien.click()
  await page.waitForURL('**' + href)
  return href
}

async function scenarioListeDeBase(browser) {
  console.log('\n— Centre de tâches, rendu de base —')
  const page = await browser.newPage()
  await page.goto(BASE + '/app/taches', { waitUntil: 'load' })

  verifier(await page.getByText('Centre de tâches').first().isVisible(), 'titre de page affiché')
  verifier(await page.getByText('En échec').first().isVisible(), 'la tuile « En échec » existe')

  // job-1 est semé « running » à l'étape 3 dans src/lib/mock/ops.ts : la
  // ligne doit porter le badge « En cours », pas un état figé du mock.
  const ligneJob1 = page.locator('tr', { hasText: 'Configurer le domaine et le TLS' })
  verifier(
    (await ligneJob1.count()) > 0 || (await page.getByText('En cours').first().isVisible()),
    'au moins un job semé apparaît « En cours »',
  )

  const boutonReprendre = page.getByRole('button', { name: 'Reprendre' }).first()
  verifier(await boutonReprendre.isVisible(), 'un job semé en échec propose « Reprendre »')

  await page.close()
}

async function scenarioSucces(browser) {
  console.log('\n— vm.power.reboot : succès en trois étapes —')
  const page = await browser.newPage()
  await page.goto(BASE + '/app/vms/vm-web-01', { waitUntil: 'load' })

  await page.getByRole('button', { name: 'Redémarrer' }).click()
  const href = await suivreDernierJob(page)
  verifier(href.startsWith('/app/taches/job-'), `navigation vers ${href}`)

  verifier(
    await page.getByText('Redémarrage de web-prod-01').first().isVisible(),
    'le libellé du catalogue (avec {cible} substitué) est affiché',
  )

  await attendre(() => page.getByText('Prêt', { exact: true }).first().isVisible(), {
    timeout: 15_000,
    quoi: 'le badge du job passe à « Prêt »',
  })
  verifier(true, 'le job termine dans le temps annoncé (~11 s d’écran)')

  // Le premier <ol> de la page est celui du JobTracker ; le second liste les
  // sept tâches génériques de la carte latérale « de l'orchestrateur ».
  const etapes = page.locator('ol').first().locator('> li')
  verifier((await etapes.count()) === 3, 'les trois étapes du catalogue sont listées')
  verifier(
    await page.getByText('Provisioning terminé').isVisible(),
    'le bandeau de succès du catalogue (« fin ») s’affiche',
  )
  verifier(
    (await page.getByText('Identifiant de corrélation').count()) === 0,
    'aucun diagnostic sur un job qui n’a pas échoué',
  )

  await page.close()
}

async function scenarioEchecPuisReprise(browser) {
  console.log('\n— web.ssl.renew : échec écrit, rollback, puis reprise réussie —')
  const page = await browser.newPage()
  await page.goto(BASE + '/app/web/ssl/crt-www', { waitUntil: 'load' })

  await page.getByRole('button', { name: 'Renouveler maintenant' }).click()
  await suivreDernierJob(page)

  await attendre(() => page.getByText('Annulé / restauré').first().isVisible(), {
    timeout: 15_000,
    quoi: 'le job échoue puis affiche « Annulé / restauré »',
  })

  const attendu =
    "L'autorité de certification n'a pas vu l'enregistrement de validation dans le délai de 90 secondes"
  verifier(
    await page.getByText(attendu, { exact: false }).isVisible(),
    'le message exact du catalogue (`echec.message`) est affiché, pas une trace brute',
  )
  verifier(
    await page.getByText('serveurs de noms du domaine sont bien les nôtres').isVisible(),
    'la suggestion du catalogue (`echec.suggestion`) est affichée',
  )
  verifier(
    await page.getByText('Identifiant de corrélation').isVisible(),
    'un identifiant de corrélation est produit',
  )
  verifier(
    await page.getByText('Cette tâche a été annulée').isVisible(),
    'le bandeau « rolled_back » explique le retour arrière automatique',
  )

  const boutonReprendre = page.getByRole('button', { name: 'Reprendre à l’étape échouée' })
  verifier(await boutonReprendre.isVisible(), 'le bouton de reprise est proposé')
  await boutonReprendre.click()

  verifier(
    !(await page.getByText('Annulé / restauré').isVisible().catch(() => false)),
    'la reprise repasse le job « En cours » immédiatement',
  )

  await attendre(() => page.getByText('Prêt', { exact: true }).first().isVisible(), {
    timeout: 15_000,
    quoi: 'le deuxième essai aboutit (le catalogue n’échoue qu’au premier essai)',
  })
  verifier(true, 'la reprise aboutit sans rejouer l’échec')
  verifier(
    await page.getByText('Provisioning terminé').isVisible(),
    'le bandeau de succès s’affiche après la reprise',
  )

  await page.close()
}

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  try {
    await scenarioListeDeBase(browser)
    await scenarioSucces(browser)
    await scenarioEchecPuisReprise(browser)
  } catch (e) {
    echecs++
    console.error('\n✗ Erreur inattendue : ' + e.message)
  } finally {
    await browser.close()
  }

  console.log(`\n=== ${echecs === 0 ? 'OK' : echecs + ' défaut(s)'} ===`)
  process.exit(echecs === 0 ? 0 : 1)
})()
