import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AMBIANCES, CHAUD, Large } from './vibes'

export const metadata: Metadata = {
  title: 'Labo · ambiances',
  description: 'Trois directions graphiques complètes pour la vitrine, à comparer.',
  robots: { index: false, follow: false },
}

const C = CHAUD

const APERCUS: Record<string, { image: string; fond: string; texte: string }> = {
  wax: { image: '/photos/motif-wax.webp', fond: C.creme, texte: C.encre },
  ronde: { image: '/photos/formes-3d.webp', fond: C.cremeFonce, texte: C.encre },
  electrique: { image: '/photos/abidjan-jour.webp', fond: C.nuit, texte: C.creme },
}

export default function Labo() {
  return (
    <div style={{ background: C.creme, minHeight: '100vh' }}>
      <Large className="py-14 sm:py-20">
        <span
          className="inline-block px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider"
          style={{ background: C.ocre, color: C.encre }}
        >
          Labo · hors navigation, non indexé
        </span>
        <h1
          className="mt-6 max-w-4xl text-[38px] font-black leading-[0.95] tracking-[-0.03em] [font-family:var(--font-display)] sm:text-[66px]"
          style={{ color: C.encre }}
        >
          Trois ambiances complètes.
          <br />
          <span style={{ color: C.magenta }}>Pas trois héros.</span>
        </h1>
        <p
          className="mt-6 max-w-2xl text-[16px] leading-relaxed"
          style={{ color: `${C.encre}b0` }}
        >
          Chaque page a son propre en-tête, sa palette, sa typographie et ses images — on juge une
          direction, pas une variante. Aucune n’utilise de dégradé ni de flou. Les contenus sont les
          vrais, tirés du jeu de données.
        </p>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed" style={{ color: `${C.encre}88` }}>
          Ce qui change vraiment par rapport au site actuel : une couleur chaude — ocre, terre —
          absente de la charte violet/magenta, des photos de jour au lieu de salles serveurs
          nocturnes, et des visages qui sourient.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-7 lg:grid-cols-3">
          {AMBIANCES.map((a) => {
            const ap = APERCUS[a.cle]
            return (
              <Link
                key={a.cle}
                href={`/labo/${a.cle}`}
                className="group flex flex-col overflow-hidden rounded-[24px] border-2 transition-transform hover:-translate-y-2"
                style={{ borderColor: `${C.encre}18`, background: ap.fond }}
              >
                <img
                  src={ap.image}
                  alt=""
                  aria-hidden
                  width={1376}
                  height={768}
                  className="h-44 w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-1.5">
                    {a.couleurs.map((c) => (
                      <span
                        key={c}
                        className="h-4 w-4 rounded-full border"
                        style={{ background: c, borderColor: `${C.encre}22` }}
                      />
                    ))}
                  </div>
                  <h2
                    className="mt-4 text-[24px] font-black leading-tight [font-family:var(--font-display)]"
                    style={{ color: ap.texte }}
                  >
                    {a.nom}
                  </h2>
                  <p
                    className="mt-1.5 text-[13.5px] font-semibold"
                    style={{ color: `${ap.texte}99` }}
                  >
                    {a.tagline}
                  </p>
                  <p
                    className="mt-4 flex-1 text-[13.5px] leading-relaxed"
                    style={{ color: `${ap.texte}b0` }}
                  >
                    {a.pourquoi}
                  </p>
                  <span
                    className="mt-6 inline-flex items-center gap-2 text-[14px] font-bold"
                    style={{ color: a.couleurs[1] }}
                  >
                    Voir la page entière
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        <div
          className="mt-10 flex flex-wrap items-center gap-4 rounded-[20px] border-2 border-dashed p-6"
          style={{ borderColor: `${C.encre}22` }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold [font-family:var(--font-display)]" style={{ color: C.encre }}>
              Le site actuel, pour comparer
            </p>
            <p className="mt-1 text-[13px]" style={{ color: `${C.encre}99` }}>
              Violet sur violet, halos flous, photos de salles serveurs de nuit.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border-2 px-5 py-2.5 text-[13.5px] font-bold"
            style={{ borderColor: C.encre, color: C.encre }}
          >
            L’ouvrir <ArrowRight size={15} />
          </Link>
        </div>
      </Large>
    </div>
  )
}
