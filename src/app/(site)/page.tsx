import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { money } from '@/lib/format'
import { ButtonLink } from '@/components/ui/button'
import { Badge, MicroLabel } from '@/components/ui/badge'
import {
  Accordeon,
  AppelFinal,
  CarrouselLogos,
  ChiffreCle,
  Container,
  LienFleche,
  SectionTitle,
  SiteSection,
  VisuelRack,
} from '@/components/site/blocs'
import {
  BANDEAU_CONFIANCE,
  BLOC_PRA,
  BLOC_SOUVERAINETE,
  CARTES_PRODUIT,
  CATALOGUE,
  ETUDES_CAS,
  FAQ_ACCUEIL,
  INDICATEURS_HERO,
  PORTES_ENTREE,
} from '@/lib/mock'

export const metadata: Metadata = {
  title: 'Infrastructure cloud souveraine en Côte d’Ivoire',
  description:
    'Espaces Cloud, machines virtuelles, Kubernetes managé, sauvegarde immuable, plan de reprise exercé, et solutions open source opérées par Synelia. Deux sites à Abidjan et Grand-Bassam, équipe et supervision 24/7 sur place.',
}

export default function Accueil() {
  return (
    <>
      {/* ─── 1 · Héros ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-p-900">
        <span className="absolute inset-0 bg-grid-light opacity-60" aria-hidden />
        <span
          className="absolute -right-40 -top-32 h-96 w-96 rounded-full bg-m-600/20 blur-3xl"
          aria-hidden
        />
        <span
          className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-p-600/30 blur-3xl"
          aria-hidden
        />
        <Container className="relative py-16 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <MicroLabel className="text-p-300">
                Infrastructure cloud · Côte d’Ivoire
              </MicroLabel>
              <h1 className="mt-4 text-[34px] font-bold leading-[1.08] tracking-[-0.02em] [font-family:var(--font-display)] text-white sm:text-[52px]">
                Votre infrastructure,
                <br />
                vos applications,
                <br />
                <span className="text-m-600">sur votre territoire.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-p-300">
                Synelia Cloud provisionne, dimensionne, sauvegarde et supervise votre infrastructure
                et vos outils de travail depuis deux datacenters ivoiriens. Nous n’hébergeons pas
                seulement vos données : nous nous engageons sur leur disponibilité, leur restauration
                et votre capacité à repartir.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink
                  href="/offres/espace-cloud"
                  size="lg"
                  className="bg-white text-p-700 hover:bg-p-050"
                  iconAfter={<ArrowRight size={15} />}
                >
                  Découvrir les offres
                </ButtonLink>
                <ButtonLink
                  href="/entreprises#contact"
                  size="lg"
                  variant="ghost"
                  className="border border-p-400 text-white hover:bg-white/10"
                >
                  Parler à un architecte
                </ButtonLink>
              </div>
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
                {INDICATEURS_HERO.map((i) => (
                  <div key={i.libelle}>
                    <dt className="tnum text-[20px] font-bold leading-none [font-family:var(--font-display)] text-white sm:text-[24px]">
                      {i.valeur}
                    </dt>
                    <dd className="mt-1.5 text-[11.5px] leading-snug text-p-300">{i.libelle}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <VisuelRack />
          </div>
        </Container>
      </section>

      {/* ─── 2 · Bandeau de confiance ─────────────────────────────────── */}
      <section className="bg-p-700">
        <Container className="py-10">
          <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {BANDEAU_CONFIANCE.map((c) => (
              <ChiffreCle key={c.libelle} valeur={c.valeur} libelle={c.libelle} sombre />
            ))}
          </dl>
        </Container>
      </section>

      {/* ─── 3 · Deux portes d'entrée ─────────────────────────────────── */}
      <SiteSection>
        <Container>
          <SectionTitle
            centre
            surtitre="Deux besoins, une plateforme"
            titre="Par quoi commencez-vous ?"
            chapeau="La plupart des plateformes vous font choisir entre de l’infrastructure brute et des logiciels prêts à l’emploi. Ici, les deux cohabitent dans le même portail, avec la même facturation, les mêmes rôles et la même sauvegarde."
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {PORTES_ENTREE.map((p, i) => (
              <div
                key={p.titre}
                className="group relative flex flex-col overflow-hidden rounded-[14px] border border-g-300 bg-white p-6 shadow-[0_1px_2px_rgba(43,27,77,.06)] transition-all hover:border-p-400 hover:shadow-[0_8px_32px_rgba(43,27,77,.12)] sm:p-8"
              >
                <span
                  className={`absolute inset-x-0 top-0 h-1 ${i === 0 ? 'bg-p-700' : 'bg-m-600'}`}
                  aria-hidden
                />
                <MicroLabel className={i === 0 ? 'text-p-700' : 'text-m-600'}>
                  {i === 0 ? 'Profil technique' : 'Profil métier'}
                </MicroLabel>
                <h3 className="mt-3 text-[22px] font-bold leading-tight [font-family:var(--font-display)] text-ink">
                  {p.titre}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-g-700">{p.accroche}</p>
                <ul className="mt-5 flex-1 space-y-2">
                  {p.items.map((it) => (
                    <li key={it} className="flex items-start gap-2.5">
                      <Check
                        size={14}
                        className={`mt-[3px] shrink-0 ${i === 0 ? 'text-p-700' : 'text-m-600'}`}
                      />
                      <span className="text-[13.5px] text-g-700">{it}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-g-100 pt-5">
                  <span className="text-[12.5px] font-semibold text-g-500">{p.prix}</span>
                  <ButtonLink
                    href={p.cta.href}
                    variant={i === 0 ? 'primary' : 'secondary'}
                    iconAfter={<ArrowRight size={14} />}
                  >
                    {p.cta.libelle}
                  </ButtonLink>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </SiteSection>

      {/* ─── 4 · Catalogue par besoin ─────────────────────────────────── */}
      <SiteSection fond="clair">
        <Container>
          <SectionTitle
            surtitre="Catalogue"
            titre="Des prix d’entrée affichés, pas des « nous contacter »"
            chapeau="Chaque produit publie son palier d’entrée. Les configurations sur mesure existent, mais vous savez d’abord à quoi vous avez affaire."
          />
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CARTES_PRODUIT.map((c) => (
              <Link
                key={c.slug}
                href={`/offres/${c.slug}`}
                className="group flex flex-col rounded-[10px] border border-g-300 bg-white p-4 shadow-[0_1px_2px_rgba(43,27,77,.06)] transition-all hover:border-p-400 hover:shadow-[0_4px_16px_rgba(43,27,77,.1)]"
              >
                <Badge tone="neutral" size="sm" className="self-start">
                  {c.famille}
                </Badge>
                <h3 className="mt-3 text-[15px] font-bold [font-family:var(--font-display)] text-ink group-hover:text-p-700">
                  {c.nom}
                </h3>
                <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-g-700">{c.phrase}</p>
                <p className="mt-4 border-t border-g-100 pt-3">
                  <span className="text-[11px] text-g-500">À partir de </span>
                  <span className="tnum block text-[15px] font-bold [font-family:var(--font-display)] text-p-700">
                    {money(c.prix)}
                    <span className="text-[11px] font-semibold text-g-500">{c.unite}</span>
                  </span>
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <ButtonLink href="/tarifs" variant="secondary">
              Comparer tous les tarifs
            </ButtonLink>
            <LienFleche href="/simulateur">Estimer mon budget en trois minutes</LienFleche>
          </div>
        </Container>
      </SiteSection>

      {/* ─── 5 · Bloc PRA ─────────────────────────────────────────────── */}
      <SiteSection fond="clair" className="border-y border-p-300 !bg-p-050">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <MicroLabel className="text-m-600">Produit d’appel</MicroLabel>
              <h2 className="mt-3 text-[28px] font-bold leading-tight [font-family:var(--font-display)] text-ink sm:text-[36px]">
                {BLOC_PRA.titre}
              </h2>
              <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-g-700">
                {BLOC_PRA.texte}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <ButtonLink href="/entreprises#contact" size="lg">
                  {BLOC_PRA.cta}
                </ButtonLink>
                <LienFleche href="/offres/pra">Voir la fiche PRA / DRaaS</LienFleche>
              </div>
            </div>
            <div className="grid gap-3">
              {BLOC_PRA.indicateurs.map((i) => (
                <div
                  key={i.libelle}
                  className="flex items-baseline justify-between gap-4 rounded-[10px] border border-p-300 bg-white px-5 py-4"
                >
                  <div>
                    <p className="tnum text-[26px] font-bold leading-none [font-family:var(--font-display)] text-p-700">
                      {i.valeur}
                    </p>
                    <p className="mt-1.5 text-[12.5px] text-g-700">{i.libelle}</p>
                  </div>
                  <Badge tone="ok" size="sm">
                    {i.cible}
                  </Badge>
                </div>
              ))}
              <p className="mt-1 text-[11.5px] leading-relaxed text-g-500">
                Chiffres médians constatés sur les plans de reprise que nous exploitons. Chaque
                exercice produit un rapport daté, opposable à un auditeur.
              </p>
            </div>
          </div>
        </Container>
      </SiteSection>

      {/* ─── 6 · Bloc souveraineté ────────────────────────────────────── */}
      <SiteSection>
        <Container>
          <SectionTitle
            surtitre="Souveraineté"
            titre="Trois questions auxquelles nous répondons par écrit"
            chapeau="La souveraineté n’est pas un argument, c’est une série de vérifications. Voici les nôtres, et ce que nous documentons pour chacune."
          />
          <div className="mt-9 grid gap-5 lg:grid-cols-3">
            {BLOC_SOUVERAINETE.map((b, i) => (
              <div key={b.titre} className="flex flex-col">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-p-100 text-p-700">
                  <ShieldCheck size={18} />
                </span>
                <h3 className="mt-4 text-[17px] font-bold [font-family:var(--font-display)] text-ink">
                  <span className="tnum mr-1.5 text-g-300">0{i + 1}</span>
                  {b.titre}
                </h3>
                <p className="mt-2.5 flex-1 text-[13.5px] leading-relaxed text-g-700">{b.texte}</p>
                <div className="mt-4">
                  <LienFleche href={b.lien.href}>{b.lien.libelle}</LienFleche>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </SiteSection>

      {/* ─── 7 · Marketplace ──────────────────────────────────────────── */}
      <SiteSection fond="clair">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle
              surtitre="Marketplace"
              titre="Des solutions open source, opérées par Synelia, réversibles"
              chapeau="Nous ne réimplémentons pas ces produits : nous les provisionnons, les dimensionnons, gérons les sièges, les sauvegardons, les supervisons et les facturons. Vous les utilisez dans leur interface d’origine, via une redirection SSO."
            />
            <ButtonLink href="/marketplace" variant="secondary">
              Voir le catalogue
            </ButtonLink>
          </div>
          <div className="mt-9">
            <CarrouselLogos
              logos={CATALOGUE.map((c) => ({
                nom: c.solutionOSS.split(' · ')[0],
                initiales: c.logoInitiales,
                teinte: c.logoTeinte,
              }))}
            />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                titre: 'Provisionné et dimensionné',
                texte: 'Instance dédiée ou mutualisée, site au choix, palier et sièges modifiables à chaud.',
              },
              {
                titre: 'Sauvegardé et supervisé',
                texte: 'Plan appliqué dès le provisioning, restauration granulaire testée, SLA par service.',
              },
              {
                titre: 'Réversible et documenté',
                texte: 'Format d’export standard, délai annoncé, procédure de reprise éprouvée.',
              },
            ].map((x) => (
              <div key={x.titre} className="rounded-[10px] border border-g-300 bg-white p-4">
                <p className="text-[13.5px] font-bold [font-family:var(--font-display)] text-ink">
                  {x.titre}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-g-700">{x.texte}</p>
              </div>
            ))}
          </div>
        </Container>
      </SiteSection>

      {/* ─── 8 · Preuve ───────────────────────────────────────────────── */}
      <SiteSection>
        <Container>
          <SectionTitle
            surtitre="Preuve"
            titre="Trois chiffres, trois contextes réels"
            chapeau="Les organisations concernées sont anonymisées, les ordres de grandeur sont ceux que nous constatons."
          />
          <div className="mt-9 grid gap-5 lg:grid-cols-3">
            {ETUDES_CAS.map((e) => (
              <article
                key={e.client}
                className="flex flex-col rounded-[14px] border border-g-300 bg-white p-6"
              >
                <Badge tone="violet" size="sm" className="self-start">
                  {e.secteur}
                </Badge>
                <p className="tnum mt-5 text-[38px] font-bold leading-none [font-family:var(--font-display)] text-p-700">
                  {e.chiffre}
                </p>
                <p className="mt-2 text-[13px] font-semibold text-ink">{e.chiffreLibelle}</p>
                <p className="mt-4 flex-1 text-[13px] leading-relaxed text-g-700">{e.texte}</p>
                <p className="mt-5 border-t border-g-100 pt-4 text-[12px] text-g-500">{e.client}</p>
              </article>
            ))}
          </div>
        </Container>
      </SiteSection>

      {/* ─── 9 · FAQ ──────────────────────────────────────────────────── */}
      <SiteSection fond="clair">
        <Container taille="md">
          <SectionTitle
            centre
            surtitre="Questions fréquentes"
            titre="Ce qu’on nous demande avant de signer"
          />
          <Accordeon items={FAQ_ACCUEIL} className="mt-9" />
          <p className="mt-6 text-center text-[13px] text-g-700">
            Une question qui n’est pas là ?{' '}
            <Link href="/entreprises#contact" className="font-semibold text-p-700 hover:text-m-600">
              Posez-la à un architecte
            </Link>
            .
          </p>
        </Container>
      </SiteSection>

      {/* ─── 10 · Appel final ─────────────────────────────────────────── */}
      <AppelFinal />
    </>
  )
}
