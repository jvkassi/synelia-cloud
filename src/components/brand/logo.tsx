import { cn } from '@/lib/utils'

/**
 * Marque Synelia Cloud. Le symbole reprend le « S » en deux arcs violet et
 * magenta — synergie et nouveauté (étymologie du nom du groupe).
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="var(--color-p-700)" />
      <path
        d="M22.5 10.5c-1.6-1.7-4-2.6-6.6-2.6-4 0-6.9 2-6.9 5 0 2.7 2.2 4 6.1 4.7"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M9.5 21.5c1.6 1.7 4 2.6 6.6 2.6 4 0 6.9-2 6.9-5 0-2.7-2.2-4-6.1-4.7"
        stroke="var(--color-m-600)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Logo({
  variante = 'clair',
  contexte,
  size = 28,
  compact = false,
  className,
}: {
  /** `clair` sur fond blanc, `sombre` sur fond violet. */
  variante?: 'clair' | 'sombre'
  /** Badge de contexte, par exemple `SUPER ADMIN`. */
  contexte?: string
  size?: number
  /** Réduit la marque à son symbole sous 640 px, pour les barres denses. */
  compact?: boolean
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} className={variante === 'sombre' ? '[&>rect]:fill-white/12' : ''} />
      {/* Le nom disparaît sous 640 px : la barre supérieure y porte déjà le
          sélecteur d'univers, et le symbole seul suffit à identifier le portail. */}
      <span className={cn('flex-col leading-none', compact ? 'hidden sm:flex' : 'flex')}>
        <span
          className={cn(
            'text-[15px] font-extrabold tracking-tight [font-family:var(--font-display)]',
            variante === 'sombre' ? 'text-white' : 'text-ink',
          )}
        >
          Synelia
          <span className={variante === 'sombre' ? 'text-p-300' : 'text-m-600'}> Cloud</span>
        </span>
        {contexte && (
          <span
            className={cn(
              'type-micro mt-0.5',
              variante === 'sombre' ? 'text-p-300' : 'text-g-500',
            )}
          >
            {contexte}
          </span>
        )}
      </span>
    </span>
  )
}

/** Badge de contexte super admin, à côté du logo (§8.1). */
export function BadgeSuperAdmin() {
  return (
    // Masqué sur les écrans étroits : la barre supérieure n'a pas la place et
    // le fond sombre suffit déjà à distinguer l'espace super admin.
    <span className="hidden rounded-[4px] border border-p-400/60 bg-white/10 px-1.5 py-0.5 text-[11px] font-bold tracking-[.08em] text-p-300 sm:inline-block">
      SUPER ADMIN
    </span>
  )
}
