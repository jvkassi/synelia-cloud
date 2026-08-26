/**
 * Briques communes aux ambiances du labo.
 *
 * Les ambiances vivent hors du groupe `(site)` : elles n'héritent donc pas de
 * l'en-tête ni du pied de la vitrine, et chacune peut proposer les siens. Sans
 * cela on ne juge qu'un héros posé dans une coquille qui ne change pas, ce qui
 * est précisément ce qui rendait la première tentative illisible.
 */

import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * La palette chaude, propre au labo. Elle ne va pas dans `globals.css` :
 * tant qu'une ambiance n'est pas retenue, ces valeurs n'ont pas à exister
 * pour le reste du produit.
 */
export const CHAUD = {
  ocre: '#E8A33D',
  terre: '#D4553B',
  creme: '#FBF4E8',
  cremeFonce: '#F3E7D3',
  encre: '#241436',
  nuit: '#150C24',
  vert: '#0F7D6B',
  magenta: '#C0297A',
  magentaVif: '#F0387F',
  violet: '#6B3FA0',
  violetClair: '#9B7FD4',
}

export const AMBIANCES = [
  {
    cle: 'wax',
    nom: 'Wax',
    tagline: 'Le motif ivoirien comme langage graphique',
    couleurs: [CHAUD.violet, CHAUD.magenta, CHAUD.ocre, CHAUD.terre],
    pourquoi:
      'Aplats francs, bandeaux de motif, typo énorme. Un cloud souverain ivoirien n’a aucune raison de ressembler à un SaaS du Delaware.',
  },
  {
    cle: 'ronde',
    nom: 'Ronde & claire',
    tagline: 'Crème, coins ronds, formes en pâte à modeler',
    couleurs: [CHAUD.creme, CHAUD.violet, CHAUD.magentaVif, CHAUD.ocre],
    pourquoi:
      'Fond crème, grosses cartes arrondies, volumes 3D souples. Lumineux et accueillant — on entre sans se sentir convoqué.',
  },
  {
    cle: 'electrique',
    nom: 'Nuit électrique',
    tagline: 'Sombre, mais une boîte de nuit, pas un enterrement',
    couleurs: [CHAUD.nuit, CHAUD.magentaVif, CHAUD.violetClair, CHAUD.ocre],
    pourquoi:
      'Presque noir, magenta fluo, chiffres géants, monospace. Le sombre peut être une fête : il suffit d’arrêter le violet triste et de monter la saturation.',
  },
] as const

/** En-tête minimal, recoloré par chaque ambiance. */
export function BarreLabo({
  fond,
  texte,
  accent,
  actif,
}: {
  fond: string
  texte: string
  accent: string
  actif: string
}) {
  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-sm"
      style={{ background: `${fond}f2`, borderColor: `${texte}22` }}
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 sm:px-8">
        <Link
          href="/labo"
          className="text-[13px] font-bold [font-family:var(--font-display)]"
          style={{ color: texte }}
        >
          Labo <span style={{ color: accent }}>Synelia</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1.5">
          {AMBIANCES.map((a) => (
            <Link
              key={a.cle}
              href={`/labo/${a.cle}`}
              className="rounded-full px-2.5 py-1 text-[12px] font-semibold transition-opacity hover:opacity-100"
              style={{
                background: a.cle === actif ? accent : 'transparent',
                color: a.cle === actif ? fond : texte,
                opacity: a.cle === actif ? 1 : 0.62,
              }}
            >
              {a.nom}
            </Link>
          ))}
        </nav>
        <Link
          href="/"
          className="ml-auto text-[12px] font-semibold underline decoration-1 underline-offset-4"
          style={{ color: texte, opacity: 0.65 }}
        >
          le site actuel →
        </Link>
      </div>
    </header>
  )
}

/** Conteneur large, commun aux trois ambiances. */
export function Large({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[1400px] px-5 sm:px-8 ${className}`}>{children}</div>
  )
}
