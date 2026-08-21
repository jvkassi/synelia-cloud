/** Remet un fichier au visiteur. Touche `document` : gestionnaire d'événement uniquement. */
export function telechargerTexte(nom: string, contenu: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contenu], { type }))
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nom
  lien.click()
  URL.revokeObjectURL(url)
}

/**
 * Sortie réelle des boutons « Exporter ».
 *
 * Point-virgule et BOM : c'est ce qu'attend un tableur configuré en français —
 * une virgule y sépare les décimales, pas les colonnes. La fonction touche
 * `document`, elle ne s'appelle donc que depuis un gestionnaire d'événement.
 */
export function telechargerCsv(
  nom: string,
  entetes: readonly string[],
  lignes: ReadonlyArray<ReadonlyArray<string | number>>,
): void {
  const echappe = (v: string | number) => {
    const t = String(v)
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  const contenu = [
    entetes.map(echappe).join(';'),
    ...lignes.map((l) => l.map(echappe).join(';')),
  ].join('\n')

  telechargerTexte(
    nom.endsWith('.csv') ? nom : `${nom}.csv`,
    `\ufeff${contenu}`,
    'text/csv;charset=utf-8',
  )
}
