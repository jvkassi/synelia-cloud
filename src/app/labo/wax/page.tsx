import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CARTES_PRODUIT, ETUDES_CAS, INDICATEURS_HERO } from '@/lib/mock'
import { BarreLabo, CHAUD, Large } from '../vibes'

export const metadata: Metadata = {
  title: 'Labo · Wax',
  robots: { index: false, follow: false },
}

const C = CHAUD

/**
 * Ambiance « Wax ».
 *
 * Le parti pris : le motif de pagne ivoirien n'est pas une décoration posée en
 * fond, c'est le système graphique. Aplats francs, bandeaux de motif comme
 * séparateurs, typographie très grosse, et une couleur chaude — ocre, terre —
 * qui manquait complètement à la charte violet/magenta.
 *
 * Zéro dégradé, zéro flou.
 */
export default function Wax() {
  return (
    <div style={{ background: C.creme }}>
      <BarreLabo fond={C.creme} texte={C.encre} accent={C.magenta} actif="wax" />

      {/* ── Héros ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: C.creme }}>
        <Large className="relative py-14 sm:py-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span
                className="inline-block -rotate-1 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider"
                style={{ background: C.ocre, color: C.encre }}
              >
                Cloud souverain · Côte d’Ivoire
              </span>
              <h1
                className="mt-6 text-[46px] font-black leading-[0.92] tracking-[-0.03em] [font-family:var(--font-display)] sm:text-[86px]"
                style={{ color: C.encre }}
              >
                Votre cloud
                <br />
                est ici.
                <br />
                <span
                  className="inline-block px-3"
                  style={{ background: C.magenta, color: C.creme }}
                >
                  Pas ailleurs.
                </span>
              </h1>
              <p
                className="mt-7 max-w-lg text-[16px] font-medium leading-relaxed"
                style={{ color: `${C.encre}cc` }}
              >
                Serveurs, applications, sauvegardes et messagerie — hébergés à Abidjan et
                Grand-Bassam, opérés par une équipe que vous pouvez appeler. À 4 ms l’un de l’autre.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/offres/espace-cloud"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-bold transition-transform hover:-translate-y-0.5"
                  style={{ background: C.encre, color: C.creme }}
                >
                  Voir les offres <ArrowRight size={17} />
                </Link>
                <Link
                  href="/entreprises#contact"
                  className="inline-flex items-center gap-2 border-2 px-6 py-3.5 text-[15px] font-bold transition-colors"
                  style={{ borderColor: C.encre, color: C.encre }}
                >
                  Parler à quelqu’un
                </Link>
              </div>
            </div>

            {/* La photo, calée dans un cadre décalé sur une plaque de motif. */}
            <div className="relative">
              <div
                className="absolute -right-3 -top-3 h-full w-full rotate-2"
                style={{
                  backgroundImage: 'url(/photos/motif-wax.webp)',
                  backgroundSize: '260px',
                }}
                aria-hidden
              />
              <img
                src="/photos/equipe-jour.webp"
                alt="Une équipe réunie autour d’un ordinateur portable dans un bureau lumineux d’Abidjan."
                width={1376}
                height={768}
                className="relative w-full border-4 object-cover"
                style={{ borderColor: C.encre, aspectRatio: '4 / 3' }}
              />
            </div>
          </div>
        </Large>
      </section>

      {/* ── Bandeau de motif + chiffres ────────────────────────────────── */}
      <div
        className="h-6"
        style={{ backgroundImage: 'url(/photos/motif-wax.webp)', backgroundSize: '200px' }}
        aria-hidden
      />
      <section style={{ background: C.encre }}>
        <Large className="py-10">
          <dl className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {INDICATEURS_HERO.map((i, n) => (
              <div key={i.libelle} className="flex items-baseline gap-4">
                <span
                  className="text-[13px] font-black [font-family:var(--font-display)]"
                  style={{ color: [C.ocre, C.magentaVif, C.vert][n] }}
                >
                  0{n + 1}
                </span>
                <div>
                  <dt
                    className="tnum text-[34px] font-black leading-none [font-family:var(--font-display)]"
                    style={{ color: C.creme }}
                  >
                    {i.valeur}
                  </dt>
                  <dd className="mt-2 text-[13px] leading-snug" style={{ color: `${C.creme}b0` }}>
                    {i.libelle}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </Large>
      </section>

      {/* ── Catalogue en blocs colorés ─────────────────────────────────── */}
      <section style={{ background: C.creme }}>
        <Large className="py-16 sm:py-24">
          <h2
            className="max-w-3xl text-[34px] font-black leading-[1] tracking-[-0.02em] [font-family:var(--font-display)] sm:text-[54px]"
            style={{ color: C.encre }}
          >
            Des prix affichés.{' '}
            <span style={{ color: C.terre }}>Pas de « nous contacter ».</span>
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CARTES_PRODUIT.slice(0, 8).map((c, n) => {
              const teintes = [C.ocre, C.magenta, C.vert, C.terre]
              const t = teintes[n % 4]
              const sombre = t === C.magenta || t === C.vert || t === C.terre
              return (
                <Link
                  key={c.slug}
                  href={`/offres/${c.slug}`}
                  className="group flex flex-col justify-between p-6 transition-transform hover:-translate-y-1.5"
                  style={{
                    background: t,
                    color: sombre ? C.creme : C.encre,
                    minHeight: 220,
                  }}
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                      {c.famille}
                    </span>
                    <h3 className="mt-3 text-[21px] font-black leading-tight [font-family:var(--font-display)]">
                      {c.nom}
                    </h3>
                    <p className="mt-2.5 text-[13px] leading-relaxed opacity-85">{c.phrase}</p>
                  </div>
                  <p className="mt-5 flex items-center gap-2 text-[15px] font-black [font-family:var(--font-display)]">
                    {c.prix.toLocaleString('fr-FR')} F
                    <span className="text-[12px] font-semibold opacity-70">{c.unite}</span>
                    <ArrowRight
                      size={16}
                      className="ml-auto transition-transform group-hover:translate-x-1"
                    />
                  </p>
                </Link>
              )
            })}
          </div>
        </Large>
      </section>

      {/* ── Une étude de cas, en très gros ─────────────────────────────── */}
      <section style={{ background: C.ocre }}>
        <Large className="py-16 sm:py-24">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <p
              className="text-[86px] font-black leading-[0.85] tracking-[-0.04em] [font-family:var(--font-display)] sm:text-[130px]"
              style={{ color: C.encre }}
            >
              {ETUDES_CAS[0].chiffre}
            </p>
            <div>
              <p className="text-[17px] font-bold" style={{ color: C.encre }}>
                {ETUDES_CAS[0].chiffreLibelle}
              </p>
              <p
                className="mt-4 max-w-2xl text-[15px] leading-relaxed"
                style={{ color: `${C.encre}cc` }}
              >
                {ETUDES_CAS[0].texte}
              </p>
              <p className="mt-5 text-[13px] font-bold uppercase tracking-wider" style={{ color: C.terre }}>
                {ETUDES_CAS[0].client}
              </p>
            </div>
          </div>
        </Large>
      </section>

      {/* ── Appel final sur photo ──────────────────────────────────────── */}
      <section className="relative isolate" style={{ background: C.encre }}>
        <img
          src="/photos/abidjan-jour.webp"
          alt=""
          aria-hidden
          width={1376}
          height={768}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <Large className="py-16 sm:py-24">
          <div className="max-w-xl p-8 sm:p-10" style={{ background: C.encre }}>
            <h2
              className="text-[32px] font-black leading-[1] tracking-[-0.02em] [font-family:var(--font-display)] sm:text-[44px]"
              style={{ color: C.creme }}
            >
              Un atelier de cadrage,
              <br />
              <span style={{ color: C.ocre }}>une demi-journée, gratuit.</span>
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed" style={{ color: `${C.creme}c0` }}>
              Vous repartez avec un dimensionnement chiffré, même si vous ne signez pas.
            </p>
            <Link
              href="/entreprises#contact"
              className="mt-7 inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-bold transition-transform hover:-translate-y-0.5"
              style={{ background: C.magentaVif, color: C.creme }}
            >
              Réserver l’atelier <ArrowRight size={17} />
            </Link>
          </div>
        </Large>
      </section>

      <div
        className="h-6"
        style={{ backgroundImage: 'url(/photos/motif-wax.webp)', backgroundSize: '200px' }}
        aria-hidden
      />
    </div>
  )
}
