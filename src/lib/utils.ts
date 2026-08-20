/**
 * Utilitaires transverses — Synelia Cloud
 */

type ClassValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | ClassValue[]
  | Record<string, unknown>

/** Concaténation conditionnelle de classes utilitaires. */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = []
  const walk = (value: ClassValue) => {
    if (!value) return
    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value))
      return
    }
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    if (typeof value === 'object') {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) out.push(key)
      }
    }
  }
  inputs.forEach(walk)
  return out.join(' ')
}

/** Génère un identifiant de corrélation lisible pour les états d'erreur (§1.5.3). */
export function correlationId(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8)
  return `syn-${hex}-${seed.length.toString(16).padStart(2, '0')}`
}

/** Découpe un tableau en pages de taille fixe. */
export function paginate<T>(items: T[], page: number, perPage: number): T[] {
  const start = (page - 1) * perPage
  return items.slice(start, start + perPage)
}

/** Somme d'un champ numérique. */
export function sumBy<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((acc, item) => acc + pick(item), 0)
}

/** Regroupe une collection par clé. */
export function groupBy<T, K extends string>(
  items: T[],
  pick: (item: T) => K,
): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = pick(item)
      ;(acc[key] ||= []).push(item)
      return acc
    },
    {} as Record<K, T[]>,
  )
}

/** Générateur pseudo-aléatoire déterministe — évite toute divergence SSR/client. */
export function seededSeries(seed: string, count: number, min = 20, max = 90): number[] {
  let state = 0
  for (let i = 0; i < seed.length; i += 1) {
    state = (state * 31 + seed.charCodeAt(i)) % 2147483647
  }
  const out: number[] = []
  for (let i = 0; i < count; i += 1) {
    state = (state * 1103515245 + 12345) % 2147483647
    const ratio = (state % 10000) / 10000
    out.push(Math.round((min + ratio * (max - min)) * 10) / 10)
  }
  return out
}

/** Série avec tendance — utile pour les micro-courbes de consommation. */
export function trendSeries(
  seed: string,
  count: number,
  from: number,
  to: number,
  jitter = 6,
): number[] {
  const noise = seededSeries(seed, count, -jitter, jitter)
  return noise.map((n, i) => {
    const base = from + ((to - from) * i) / Math.max(1, count - 1)
    return Math.max(0, Math.round((base + n) * 10) / 10)
  })
}

/** Retourne la valeur bornée entre min et max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Transforme un libellé en slug d'URL. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Initiales d'un nom, pour les avatars. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
