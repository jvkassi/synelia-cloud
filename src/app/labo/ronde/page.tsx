import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { CARTES_PRODUIT, INDICATEURS_HERO, PORTES_ENTREE } from '@/lib/mock'
import { BarreLabo, CHAUD, Large } from '../vibes'

export const metadata: Metadata = {
  title: 'Labo · Ronde & claire',
  robots: { index: false, follow: false },
}

const C = CHAUD

/**
 * Ambiance « Ronde & claire ».
 *
 * Le parti pris : de la lumière. Fond crème plutôt que blanc clinique, rayons
 * de bordure très généreux, ombres portées franches et colorées plutôt que des
 * ombres grises, volumes 3D en pâte à modeler. Chaque carte a une couleur ;
 * rien n'est gris.
 *
 * Zéro dégradé, zéro flou.
 */
export default function Ronde() {
  const pastilles = [C.violet, C.magentaVif, C.ocre, C.vert]

  return (
    <div style={{ background: C.creme }}>
      <BarreLabo fond={C.creme} texte={C.encre} accent={C.violet} actif="ronde" />

      {/* ── Héros ─────────────────────────────────────────────────────── */}
      <section style={{ background: C.creme }}>
        <Large className="py-14 sm:py-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {['Abidjan', 'Grand-Bassam', '4 ms entre les deux'].map((t, n) => (
                  <span
                    key={t}
                    className="rounded-full px-3.5 py-1.5 text-[12.5px] font-bold"
                    style={{ background: `${pastilles[n]}1f`, color: pastilles[n] }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <h1
                className="mt-6 text-[42px] font-black leading-[1] tracking-[-0.03em] [font-family:var(--font-display)] sm:text-[70px]"
                style={{ color: C.encre }}
              >
                Le cloud,
                <br />
                sans la{' '}
                <span className="relative inline-block">
                  <span className="relative z-10" style={{ color: C.magentaVif }}>
                    migraine
                  </span>
                  <span
                    className="absolute inset-x-0 bottom-1 z-0 h-3.5 -rotate-1 rounded-full"
                    style={{ background: `${C.ocre}66` }}
                    aria-hidden
                  />
                </span>
                .
              </h1>
              <p
                className="mt-6 max-w-lg text-[16.5px] leading-relaxed"
                style={{ color: `${C.encre}b8` }}
              >
                Vous cliquez, on provisionne. Vous grandissez, on redimensionne. Vous appelez, on
                décroche — à Abidjan, pas dans un centre d’appels à l’autre bout du monde.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/offres/espace-cloud"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-[15px] font-bold transition-transform hover:-translate-y-1"
                  style={{
                    background: C.violet,
                    color: C.creme,
                    boxShadow: `0 6px 0 0 ${C.encre}`,
                  }}
                >
                  Commencer <ArrowRight size={17} />
                </Link>
                <Link
                  href="/simulateur"
                  className="inline-flex items-center gap-2 rounded-full border-2 px-7 py-4 text-[15px] font-bold"
                  style={{ borderColor: `${C.encre}22`, color: C.encre }}
                >
                  Estimer mon budget
                </Link>
              </div>
              <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
                {INDICATEURS_HERO.map((i, n) => (
                  <div key={i.libelle}>
                    <dt
                      className="tnum text-[26px] font-black leading-none [font-family:var(--font-display)]"
                      style={{ color: pastilles[n] }}
                    >
                      {i.valeur}
                    </dt>
                    <dd className="mt-1.5 max-w-[15ch] text-[12px] leading-snug" style={{ color: `${C.encre}99` }}>
                      {i.libelle}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div
              className="rounded-[36px] p-3"
              style={{ background: C.cremeFonce, boxShadow: `0 10px 0 0 ${C.encre}14` }}
            >
              <img
                src="/photos/formes-3d.webp"
                alt="Volumes géométriques arrondis en violet, magenta et ocre, flottant sur un fond crème."
                width={1376}
                height={768}
                className="w-full rounded-[28px]"
              />
            </div>
          </div>
        </Large>
      </section>

      {/* ── Deux portes, en grosses cartes ─────────────────────────────── */}
      <section style={{ background: C.cremeFonce }}>
        <Large className="py-16 sm:py-24">
          <h2
            className="max-w-2xl text-[32px] font-black leading-[1.05] tracking-[-0.02em] [font-family:var(--font-display)] sm:text-[46px]"
            style={{ color: C.encre }}
          >
            Par quoi vous commencez ?
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {PORTES_ENTREE.map((p, n) => {
              const t = n === 0 ? C.violet : C.magentaVif
              return (
                <div
                  key={p.titre}
                  className="flex flex-col rounded-[28px] p-7 sm:p-9"
                  style={{ background: C.creme, boxShadow: `0 8px 0 0 ${t}` }}
                >
                  <span
                    className="self-start rounded-full px-3 py-1 text-[11.5px] font-bold uppercase tracking-wider"
                    style={{ background: `${t}1f`, color: t }}
                  >
                    {n === 0 ? 'Pour les techniques' : 'Pour les métiers'}
                  </span>
                  <h3
                    className="mt-4 text-[26px] font-black leading-tight [font-family:var(--font-display)]"
                    style={{ color: C.encre }}
                  >
                    {p.titre}
                  </h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: `${C.encre}b0` }}>
                    {p.accroche}
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {p.items.map((it) => (
                      <li key={it} className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                          style={{ background: t }}
                        >
                          <Check size={12} color={C.creme} strokeWidth={3} />
                        </span>
                        <span className="text-[14px]" style={{ color: `${C.encre}cc` }}>
                          {it}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={p.cta.href}
                    className="mt-7 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14.5px] font-bold transition-transform hover:-translate-y-1"
                    style={{ background: t, color: C.creme }}
                  >
                    {p.cta.libelle} <ArrowRight size={16} />
                  </Link>
                </div>
              )
            })}
          </div>
        </Large>
      </section>

      {/* ── Catalogue en pastilles ─────────────────────────────────────── */}
      <section style={{ background: C.creme }}>
        <Large className="py-16 sm:py-24">
          <h2
            className="text-[30px] font-black leading-tight tracking-[-0.02em] [font-family:var(--font-display)] sm:text-[42px]"
            style={{ color: C.encre }}
          >
            Tout est affiché, tout se change à chaud
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CARTES_PRODUIT.slice(0, 8).map((c, n) => {
              const t = pastilles[n % 4]
              return (
                <Link
                  key={c.slug}
                  href={`/offres/${c.slug}`}
                  className="group flex flex-col rounded-[22px] border-2 p-5 transition-transform hover:-translate-y-1.5"
                  style={{ borderColor: `${C.encre}12`, background: C.creme }}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-[14px] text-[15px] font-black [font-family:var(--font-display)]"
                    style={{ background: `${t}20`, color: t }}
                  >
                    {c.nom.slice(0, 1)}
                  </span>
                  <h3
                    className="mt-4 text-[16px] font-bold leading-snug [font-family:var(--font-display)]"
                    style={{ color: C.encre }}
                  >
                    {c.nom}
                  </h3>
                  <p className="mt-2 flex-1 text-[12.5px] leading-relaxed" style={{ color: `${C.encre}9c` }}>
                    {c.phrase}
                  </p>
                  <p
                    className="mt-4 text-[14px] font-black [font-family:var(--font-display)]"
                    style={{ color: t }}
                  >
                    {c.prix.toLocaleString('fr-FR')} F
                    <span className="text-[11.5px] font-semibold opacity-70">{c.unite}</span>
                  </p>
                </Link>
              )
            })}
          </div>
        </Large>
      </section>

      {/* ── Appel final ────────────────────────────────────────────────── */}
      <section style={{ background: C.violet }}>
        <Large className="py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              className="text-[32px] font-black leading-[1.05] tracking-[-0.02em] [font-family:var(--font-display)] sm:text-[46px]"
              style={{ color: C.creme }}
            >
              On en parle une demi-journée ?
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed" style={{ color: `${C.creme}c4` }}>
              L’atelier de cadrage ne se facture pas. Vous repartez avec un chiffrage, même si vous
              ne signez pas.
            </p>
            <Link
              href="/entreprises#contact"
              className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-[16px] font-bold transition-transform hover:-translate-y-1"
              style={{ background: C.ocre, color: C.encre, boxShadow: `0 6px 0 0 ${C.encre}55` }}
            >
              Réserver <ArrowRight size={18} />
            </Link>
          </div>
        </Large>
      </section>
    </div>
  )
}
