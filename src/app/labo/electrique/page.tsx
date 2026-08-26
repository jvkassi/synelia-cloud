import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BANDEAU_CONFIANCE, CARTES_PRODUIT, ETUDES_CAS } from '@/lib/mock'
import { BarreLabo, CHAUD, Large } from '../vibes'

export const metadata: Metadata = {
  title: 'Labo · Nuit électrique',
  robots: { index: false, follow: false },
}

const C = CHAUD

/**
 * Ambiance « Nuit électrique ».
 *
 * Le sombre du site actuel est triste parce qu'il est désaturé : du violet
 * moyen sur du violet foncé, tout au même niveau d'énergie. Ici le fond
 * descend presque au noir et les accents montent en saturation — magenta vif,
 * ocre. Le contraste fait le reste, sans un seul dégradé ni flou.
 */
export default function Electrique() {
  return (
    <div style={{ background: C.nuit }}>
      <BarreLabo fond={C.nuit} texte={C.creme} accent={C.magentaVif} actif="electrique" />

      {/* ── Héros ─────────────────────────────────────────────────────── */}
      <section style={{ background: C.nuit }}>
        <Large className="py-14 sm:py-20">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11.5px] font-bold"
              style={{ borderColor: `${C.magentaVif}55`, color: C.magentaVif }}
            >
              <span
                className="animate-pulse-dot h-1.5 w-1.5 rounded-full"
                style={{ background: C.magentaVif }}
              />
              15 services · 2 sites · 24/7
            </span>
          </div>

          <h1
            className="mt-7 text-[48px] font-black leading-[0.9] tracking-[-0.04em] [font-family:var(--font-display)] sm:text-[104px]"
            style={{ color: C.creme }}
          >
            DÉPLOYEZ
            <br />
            <span style={{ color: C.magentaVif }}>À ABIDJAN.</span>
          </h1>

          <div className="mt-9 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
            <p
              className="max-w-xl text-[17px] font-medium leading-relaxed"
              style={{ color: `${C.creme}bb` }}
            >
              Espaces Cloud, VM, Kubernetes managé, sauvegarde immuable. Provisionné en minutes,
              facturé en FCFA, opéré par une équipe sur place. Votre latence n’a plus à traverser un
              océan.
            </p>
            <div
              className="border font-mono text-[12px]"
              style={{ borderColor: `${C.creme}1f` }}
            >
              {[
                ['$ synelia espace créer --site abj', C.creme],
                ['✓ quota 24 vCPU · 96 Go · 4 To NVMe', C.vert],
                ['✓ réseau privé 10.42.0.0/16', C.vert],
                ['✓ plan de sauvegarde 3-2-1 attaché', C.vert],
                ['→ prêt en 3 min 12 s', C.magentaVif],
              ].map(([l, col], n) => (
                <p
                  key={n}
                  className="border-b px-4 py-2.5 last:border-b-0"
                  style={{ borderColor: `${C.creme}12`, color: col as string }}
                >
                  {l}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/offres/espace-cloud"
              className="inline-flex items-center gap-2 px-7 py-4 text-[15px] font-black uppercase tracking-wide transition-transform hover:-translate-y-0.5"
              style={{ background: C.magentaVif, color: C.nuit }}
            >
              Créer un compte <ArrowRight size={17} />
            </Link>
            <Link
              href="/entreprises#contact"
              className="inline-flex items-center gap-2 border px-7 py-4 text-[15px] font-black uppercase tracking-wide"
              style={{ borderColor: `${C.creme}33`, color: C.creme }}
            >
              Parler à un architecte
            </Link>
          </div>
        </Large>
      </section>

      {/* ── Chiffres géants ───────────────────────────────────────────── */}
      <section className="border-y" style={{ background: C.nuit, borderColor: `${C.creme}14` }}>
        <Large>
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {BANDEAU_CONFIANCE.map((c, n) => (
              <div
                key={c.libelle}
                className="border-b py-9 lg:border-b-0 lg:border-r lg:pl-8 lg:first:pl-0"
                style={{ borderColor: `${C.creme}14` }}
              >
                <dt
                  className="tnum text-[42px] font-black leading-none [font-family:var(--font-display)] sm:text-[54px]"
                  style={{ color: [C.magentaVif, C.ocre, C.vert, C.violetClair][n] }}
                >
                  {c.valeur}
                </dt>
                <dd
                  className="mt-3 max-w-[18ch] text-[12.5px] leading-snug"
                  style={{ color: `${C.creme}88` }}
                >
                  {c.libelle}
                </dd>
              </div>
            ))}
          </dl>
        </Large>
      </section>

      {/* ── Catalogue en liste dense ───────────────────────────────────── */}
      <section style={{ background: C.nuit }}>
        <Large className="py-16 sm:py-24">
          <h2
            className="text-[32px] font-black leading-none tracking-[-0.03em] [font-family:var(--font-display)] sm:text-[52px]"
            style={{ color: C.creme }}
          >
            LE CATALOGUE
          </h2>
          <div className="mt-10">
            {CARTES_PRODUIT.slice(0, 8).map((c, n) => (
              <Link
                key={c.slug}
                href={`/offres/${c.slug}`}
                className="group flex flex-wrap items-center gap-x-6 gap-y-2 border-t py-5 transition-colors"
                style={{ borderColor: `${C.creme}14` }}
              >
                <span
                  className="font-mono text-[12px]"
                  style={{ color: [C.magentaVif, C.ocre, C.vert, C.violetClair][n % 4] }}
                >
                  {String(n + 1).padStart(2, '0')}
                </span>
                <span
                  className="min-w-[13ch] text-[19px] font-black [font-family:var(--font-display)] transition-transform group-hover:translate-x-1"
                  style={{ color: C.creme }}
                >
                  {c.nom}
                </span>
                <span className="flex-1 text-[13.5px]" style={{ color: `${C.creme}77` }}>
                  {c.phrase}
                </span>
                <span
                  className="tnum font-mono text-[14px] font-bold"
                  style={{ color: C.creme }}
                >
                  {c.prix.toLocaleString('fr-FR')} F{c.unite}
                </span>
                <ArrowRight
                  size={17}
                  color={C.magentaVif}
                  className="transition-transform group-hover:translate-x-1.5"
                />
              </Link>
            ))}
          </div>
        </Large>
      </section>

      {/* ── Preuve ─────────────────────────────────────────────────────── */}
      <section style={{ background: C.magentaVif }}>
        <Large className="py-16 sm:py-24">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <p
              className="text-[80px] font-black leading-[0.82] tracking-[-0.05em] [font-family:var(--font-display)] sm:text-[128px]"
              style={{ color: C.nuit }}
            >
              {ETUDES_CAS[0].chiffre}
            </p>
            <div>
              <p className="text-[18px] font-black [font-family:var(--font-display)]" style={{ color: C.nuit }}>
                {ETUDES_CAS[0].chiffreLibelle}
              </p>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed" style={{ color: `${C.nuit}cc` }}>
                {ETUDES_CAS[0].texte}
              </p>
              <p className="mt-5 font-mono text-[12px] font-bold uppercase" style={{ color: `${C.nuit}99` }}>
                {ETUDES_CAS[0].client}
              </p>
            </div>
          </div>
        </Large>
      </section>

      {/* ── Appel final ────────────────────────────────────────────────── */}
      <section style={{ background: C.nuit }}>
        <Large className="py-16 sm:py-24">
          <h2
            className="max-w-3xl text-[32px] font-black leading-[1.02] tracking-[-0.03em] [font-family:var(--font-display)] sm:text-[52px]"
            style={{ color: C.creme }}
          >
            Une demi-journée avec nos architectes.{' '}
            <span style={{ color: C.ocre }}>Zéro franc.</span>
          </h2>
          <Link
            href="/entreprises#contact"
            className="mt-8 inline-flex items-center gap-2 px-7 py-4 text-[15px] font-black uppercase tracking-wide transition-transform hover:-translate-y-0.5"
            style={{ background: C.creme, color: C.nuit }}
          >
            Réserver l’atelier <ArrowRight size={17} />
          </Link>
        </Large>
      </section>
    </div>
  )
}
