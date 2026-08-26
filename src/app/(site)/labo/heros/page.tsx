import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { MicroLabel } from '@/components/ui/badge'
import { Container, PastilleEtat, VisuelRack } from '@/components/site/blocs'
import { INDICATEURS_HERO } from '@/lib/mock'

export const metadata: Metadata = {
  title: 'Labo — variantes de héros',
  description:
    'Quatre héros sans dégradé, à comparer côte à côte avant d’en retenir un pour la page d’accueil.',
  robots: { index: false, follow: false },
}

/**
 * Page de comparaison, hors navigation et non indexée.
 *
 * Le héros de l'accueil reposait sur deux halos flous et un voile en dégradé —
 * la signature visuelle que toutes les vitrines de SaaS partagent depuis dix
 * ans. Ces quatre variantes s'en passent entièrement : aucun `bg-gradient`,
 * aucun `blur`. Ce qui remplace le dégradé change à chaque fois : un aplat et
 * de la typographie, un cadre technique, une photo à bord franc, ou du blanc.
 *
 * À supprimer une fois la variante retenue reportée dans `(site)/page.tsx`.
 */

/** Le texte est le même partout : seule la mise en forme est en jeu. */
const ACCROCHE = {
  surtitre: 'Infrastructure cloud · Côte d’Ivoire',
  titre1: 'Votre infrastructure et vos applications,',
  titre2: 'hébergées et opérées',
  titre3: 'en Côte d’Ivoire.',
  chapeau:
    'Espaces Cloud, machines virtuelles, Kubernetes managé, messagerie et Drive : Synelia provisionne, dimensionne, sauvegarde et supervise depuis Abidjan et Grand-Bassam.',
  refus:
    'Ce que nous ne faisons pas : réimplémenter les logiciels que vous utilisez déjà. Nous les opérons, et vous les ouvrez dans leur propre interface.',
}

function Indicateurs({ sombre }: { sombre?: boolean }) {
  return (
    <dl
      className={`mt-10 grid max-w-lg grid-cols-3 gap-6 border-t pt-6 ${
        sombre ? 'border-white/15' : 'border-g-300'
      }`}
    >
      {INDICATEURS_HERO.map((i) => (
        <div key={i.libelle}>
          <dt
            className={`tnum text-[20px] font-bold leading-none [font-family:var(--font-display)] sm:text-[24px] ${
              sombre ? 'text-white' : 'text-ink'
            }`}
          >
            {i.valeur}
          </dt>
          <dd
            className={`mt-1.5 text-[11.5px] leading-snug ${sombre ? 'text-p-300' : 'text-g-700'}`}
          >
            {i.libelle}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function Actions({ inverse }: { inverse?: boolean }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <ButtonLink
        href="/offres/espace-cloud"
        size="lg"
        variant={inverse ? 'inverse' : 'primary'}
        iconAfter={<ArrowRight size={15} />}
      >
        Découvrir les offres
      </ButtonLink>
      <ButtonLink
        href="/entreprises#contact"
        size="lg"
        variant={inverse ? 'ghostInverse' : 'secondary'}
      >
        Parler à un architecte
      </ButtonLink>
    </div>
  )
}

/*
 * A · Aplat et typographie
 * Un seul violet, aucune profondeur simulée. Ce qui structure l'écran, ce sont
 * des filets d'un pixel et une grille assumée — la logique d'une page de
 * journal. La photo occupe une colonne à bord franc, sans masque dégradé.
 */
function VarianteA() {
  return (
    <section className="bg-p-900">
      <Container className="py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="lg:border-r lg:border-white/15 lg:pr-10">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-white/15 pb-4">
              <MicroLabel className="text-p-300">{ACCROCHE.surtitre}</MicroLabel>
              <PastilleEtat ton="warn" texte="1 service dégradé sur 15" href="/statut" />
            </div>
            <h1 className="mt-6 text-[34px] font-bold leading-[1.05] tracking-[-0.02em] [font-family:var(--font-display)] text-white sm:text-[54px]">
              {ACCROCHE.titre1}
              <br />
              {ACCROCHE.titre2}{' '}
              <span className="border-b-4 border-m-600 pb-1 text-white">{ACCROCHE.titre3}</span>
            </h1>
            <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-p-300">
              {ACCROCHE.chapeau}
            </p>
            <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-p-400">
              {ACCROCHE.refus}
            </p>
            <Actions inverse />
            <Indicateurs sombre />
          </div>
          <figure className="self-stretch">
            <img
              src="/photos/datacenter-allee.webp"
              alt=""
              aria-hidden
              width={1376}
              height={768}
              className="h-full min-h-[280px] w-full object-cover"
            />
          </figure>
        </div>
      </Container>
    </section>
  )
}

/*
 * B · Cadre technique
 * Le héros se présente comme une fiche d'exploitation : libellés en
 * monospace, filets, valeurs alignées. Le public visé — une DSI — lit ce
 * vocabulaire tous les jours, et il ne ressemble à aucune vitrine de SaaS.
 */
function VarianteB() {
  const lignes = [
    ['site.primaire', 'ABJ · Synertech Vallon (Cocody)'],
    ['site.repli', 'GBM · Parc VITIB'],
    ['latence.inter_site', '4–6 ms · 2 chemins de fibre'],
    ['pra.dernier_exercice', '12/07/2026 · réussi'],
    ['astreinte', 'Abidjan · 24/7 · non déléguée'],
  ]
  return (
    <section className="border-y border-p-700 bg-p-900">
      <Container className="py-16 sm:py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
              <MicroLabel className="text-p-300">{ACCROCHE.surtitre}</MicroLabel>
              <PastilleEtat ton="warn" texte="1 service dégradé sur 15" href="/statut" />
            </div>
            <h1 className="mt-5 text-[32px] font-bold leading-[1.06] tracking-[-0.02em] [font-family:var(--font-display)] text-white sm:text-[48px]">
              {ACCROCHE.titre1}
              <br />
              {ACCROCHE.titre2}{' '}
              <span className="text-m-400">{ACCROCHE.titre3}</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-p-300">
              {ACCROCHE.chapeau}
            </p>
            <Actions inverse />
          </div>
          <div className="border border-p-600 bg-p-800">
            <div className="flex items-center justify-between border-b border-p-600 px-4 py-2.5">
              <span className="font-mono text-[11px] text-p-300">synelia · plateforme</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-white">
                <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-ok" />
                en ligne
              </span>
            </div>
            <dl className="divide-y divide-p-600/60">
              {lignes.map(([cle, val]) => (
                <div
                  key={cle}
                  className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5"
                >
                  <dt className="font-mono text-[11.5px] text-p-400">{cle}</dt>
                  <dd className="font-mono text-[11.5px] font-semibold text-white">{val}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-p-600 px-4 py-3">
              <p className="font-mono text-[11px] leading-relaxed text-p-300">
                {ACCROCHE.refus}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

/*
 * C · Photo pleine largeur, texte sur aplat
 * La photo prend tout l'écran et le texte vit dans un bloc parfaitement
 * opaque. C'est ce qui remplace le voile en dégradé : le contraste ne dépend
 * plus d'un réglage d'opacité qu'un changement de photo ferait tomber sous le
 * seuil, il est garanti par un aplat.
 */
function VarianteC() {
  return (
    <section className="relative isolate bg-p-900">
      <img
        src="/photos/datacenter-allee.webp"
        alt=""
        aria-hidden
        width={1376}
        height={768}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <Container className="py-14 sm:py-20">
        <div className="max-w-2xl bg-p-900 p-7 sm:p-10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <MicroLabel className="text-p-300">{ACCROCHE.surtitre}</MicroLabel>
            <PastilleEtat ton="warn" texte="1 service dégradé sur 15" href="/statut" />
          </div>
          <h1 className="mt-5 text-[32px] font-bold leading-[1.06] tracking-[-0.02em] [font-family:var(--font-display)] text-white sm:text-[46px]">
            {ACCROCHE.titre1}
            <br />
            {ACCROCHE.titre2} <span className="text-m-400">{ACCROCHE.titre3}</span>
          </h1>
          <p className="mt-6 text-[15px] leading-relaxed text-p-300">{ACCROCHE.chapeau}</p>
          <Actions inverse />
          <Indicateurs sombre />
        </div>
      </Container>
    </section>
  )
}

/*
 * D · Clair
 * L'inverse de la convention du site : fond blanc, texte encre, couleur
 * réservée à l'accroche et au filet. Un ton d'institution plutôt que de
 * jeune pousse — ce qui, pour un cloud souverain, n'est pas le mauvais
 * registre. Le magenta y tient le contraste sans réserve.
 */
function VarianteD() {
  return (
    <section className="border-b border-g-300 bg-white">
      <Container className="py-16 sm:py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
              <MicroLabel className="text-m-600">{ACCROCHE.surtitre}</MicroLabel>
              <PastilleEtat ton="warn" texte="1 service dégradé sur 15" href="/statut" clair />
            </div>
            <h1 className="mt-5 text-[34px] font-bold leading-[1.05] tracking-[-0.02em] [font-family:var(--font-display)] text-ink sm:text-[52px]">
              {ACCROCHE.titre1}
              <br />
              {ACCROCHE.titre2}{' '}
              <span className="text-m-600">{ACCROCHE.titre3}</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-g-700">
              {ACCROCHE.chapeau}
            </p>
            <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-g-500">
              {ACCROCHE.refus}
            </p>
            <Actions />
            <Indicateurs />
          </div>
          <figure className="border border-g-300 bg-p-050 p-5">
            <img
              src="/illustrations/carte-sites.svg"
              alt="Carte de la Côte d’Ivoire situant Abidjan et Grand-Bassam, reliés par une liaison de 4 à 6 millisecondes."
              width={600}
              height={735}
              className="w-full"
            />
          </figure>
        </div>
      </Container>
    </section>
  )
}

/*
 * Référence · l'actuel
 * Conservé en dernier pour la comparaison : c'est lui qui porte les deux halos
 * flous et le voile en dégradé.
 */
function VarianteActuelle() {
  return (
    <section className="relative overflow-hidden bg-p-900">
      <img
        src="/photos/datacenter-allee.webp"
        alt=""
        aria-hidden
        width={1376}
        height={768}
        className="absolute inset-0 h-full w-full object-cover opacity-30"
      />
      <span
        className="absolute inset-0 bg-gradient-to-r from-p-900 via-p-900/95 to-p-900/60"
        aria-hidden
      />
      <span className="absolute inset-0 bg-grid-light opacity-60" aria-hidden />
      <span
        className="animate-derive absolute -right-40 -top-32 h-96 w-96 rounded-full bg-m-600/20 blur-3xl"
        aria-hidden
      />
      <span
        className="animate-derive-lente absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-p-600/30 blur-3xl"
        aria-hidden
      />
      <Container className="relative py-16 sm:py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
              <MicroLabel className="text-p-300">{ACCROCHE.surtitre}</MicroLabel>
              <PastilleEtat ton="warn" texte="1 service dégradé sur 15" href="/statut" />
            </div>
            <h1 className="mt-4 text-[34px] font-bold leading-[1.08] tracking-[-0.02em] [font-family:var(--font-display)] text-white sm:text-[52px]">
              {ACCROCHE.titre1}
              <br />
              {ACCROCHE.titre2} <span className="text-m-400">{ACCROCHE.titre3}</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-p-300">
              {ACCROCHE.chapeau}
            </p>
            <Actions inverse />
            <Indicateurs sombre />
          </div>
          <VisuelRack />
        </div>
      </Container>
    </section>
  )
}

const VARIANTES = [
  {
    cle: 'A',
    nom: 'Aplat et typographie',
    pourquoi:
      'Un seul violet, des filets d’un pixel, la photo en colonne à bord franc. La structure vient de la grille, pas d’un effet.',
    rendu: <VarianteA />,
  },
  {
    cle: 'B',
    nom: 'Cadre technique',
    pourquoi:
      'Le héros se lit comme une fiche d’exploitation. Vocabulaire d’ingénieur, et aucune ressemblance avec une vitrine de SaaS.',
    rendu: <VarianteB />,
  },
  {
    cle: 'C',
    nom: 'Photo pleine largeur, texte sur aplat',
    pourquoi:
      'La photo porte tout l’écran ; le contraste est garanti par un bloc opaque, pas par un réglage d’opacité fragile.',
    rendu: <VarianteC />,
  },
  {
    cle: 'D',
    nom: 'Clair',
    pourquoi:
      'Fond blanc, la carte des deux sites comme visuel. Registre d’institution plutôt que de jeune pousse.',
    rendu: <VarianteD />,
  },
  {
    cle: '0',
    nom: 'Actuel — pour comparaison',
    pourquoi:
      'Celui en ligne aujourd’hui : deux halos flous et un voile en dégradé.',
    rendu: <VarianteActuelle />,
  },
]

export default function LaboHeros() {
  return (
    <>
      <div className="border-b border-g-300 bg-g-050">
        <Container className="py-10">
          <MicroLabel className="text-m-600">Labo · hors navigation</MicroLabel>
          <h1 className="mt-2 text-[26px] font-bold [font-family:var(--font-display)] text-ink sm:text-[32px]">
            Quatre héros sans un seul dégradé
          </h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-g-700">
            Même texte partout, seule la mise en forme change. Aucune des quatre premières n’utilise
            de <code className="font-mono text-[13px]">bg-gradient</code> ni de{' '}
            <code className="font-mono text-[13px]">blur</code>. La dernière est celle en ligne
            aujourd’hui, gardée pour comparer. Dites-moi la lettre et je la reporte sur l’accueil.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {VARIANTES.map((v) => (
              <li key={v.cle}>
                <a
                  href={`#variante-${v.cle}`}
                  className="inline-flex items-center gap-2 rounded-[8px] border border-g-300 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:border-p-400 hover:bg-p-050"
                >
                  <span className="font-mono text-m-600">{v.cle}</span>
                  {v.nom}
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </div>

      {VARIANTES.map((v) => (
        <div key={v.cle} id={`variante-${v.cle}`} className="scroll-mt-4">
          <div className="border-y border-g-300 bg-white">
            <Container className="py-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-[15px] font-bold text-m-600">{v.cle}</span>
                <span className="text-[15px] font-bold [font-family:var(--font-display)] text-ink">
                  {v.nom}
                </span>
                <span className="text-[12.5px] text-g-500">{v.pourquoi}</span>
              </div>
            </Container>
          </div>
          {v.rendu}
        </div>
      ))}
    </>
  )
}
