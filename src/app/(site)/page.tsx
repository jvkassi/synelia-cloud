import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { money } from '@/lib/format'
import { surfaceMarque } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/button'
import { Badge, MicroLabel } from '@/components/ui/badge'
import {
  Accordeon,
  AppelFinal,
  CarrouselLogos,
  ChiffreCle,
  Citation,
  Container,
  LienFleche,
  Monogramme,
  PastilleEtat,
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
  DATACENTERS,
  EQUIPE,
  ETUDES_CAS,
  FAQ_ACCUEIL,
  INCIDENTS,
  INDICATEURS_HERO,
  MOYENS_PAIEMENT,
  PARCOURS_DEMARRAGE,
  PARCOURS_LIMITES,
  PORTES_ENTREE,
  STATUT_SERVICES,
  TEMOIGNAGES,
} from '@/lib/mock'

export const metadata: Metadata = {
  title: 'Infrastructure cloud souveraine en Côte d’Ivoire',
  description:
    'Espaces Cloud, machines virtuelles, Kubernetes managé, sauvegarde immuable, plan de reprise exercé, et solutions open source opérées par Synelia. Deux sites à Abidjan et Grand-Bassam, équipe et supervision 24/7 sur place.',
}

/**
 * L'état du moment, dérivé des mêmes sondes que `/statut`. Le héros affichait
 * une moyenne de disponibilité sans jamais dire ce qui se passe maintenant :
 * quand un service est dégradé, l'annoncer vaut mieux que le taire.
 */
function etatPlateforme() {
  const enPanne = STATUT_SERVICES.filter((s) =>
    Object.values(s.etats).some((e) => e === 'panne'),
  ).length
  const degrades = STATUT_SERVICES.filter((s) =>
    Object.values(s.etats).some((e) => e === 'degrade'),
  ).length
  const ouverts = INCIDENTS.filter((i) => i.statut !== 'resolu' && i.gravite !== 'maintenance')

  if (enPanne > 0) {
    return {
      ton: 'err' as const,
      texte: `${enPanne} service${enPanne > 1 ? 's' : ''} en panne sur ${STATUT_SERVICES.length}`,
    }
  }
  if (degrades > 0) {
    return {
      ton: 'warn' as const,
      texte: `${degrades} service${degrades > 1 ? 's' : ''} dégradé${degrades > 1 ? 's' : ''} sur ${STATUT_SERVICES.length}`,
    }
  }
  if (ouverts.length > 0) {
    const n = ouverts.length
    return { ton: 'warn' as const, texte: `${n} incident${n > 1 ? 's' : ''} en cours` }
  }
  return { ton: 'ok' as const, texte: `${STATUT_SERVICES.length} services opérationnels` }
}

/**
 * Données structurées — la vitrine n'en publiait aucune. `FAQPage` reprend
 * mot pour mot l'accordéon affiché : Google déclasse un balisage qui décrit
 * autre chose que le contenu visible.
 */
function donneesStructurees() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://cloud.synelia.tech/#organisation',
        name: 'Synelia Cloud',
        legalName: 'Synelia Group Afrique',
        url: 'https://cloud.synelia.tech/',
        description:
          'Infrastructure cloud souveraine opérée depuis deux datacenters ivoiriens : Espaces Cloud, machines virtuelles, Kubernetes managé, sauvegarde immuable, plan de reprise exercé et solutions open source opérées.',
        areaServed: { '@type': 'Country', name: 'Côte d’Ivoire' },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Abidjan',
          addressRegion: 'Cocody',
          addressCountry: 'CI',
        },
        location: DATACENTERS.map((d) => ({
          '@type': 'Place',
          name: d.nom,
          address: {
            '@type': 'PostalAddress',
            addressLocality: d.ville,
            addressCountry: 'CI',
          },
        })),
      },
      {
        '@type': 'WebSite',
        '@id': 'https://cloud.synelia.tech/#site',
        url: 'https://cloud.synelia.tech/',
        name: 'Synelia Cloud',
        inLanguage: 'fr-CI',
        publisher: { '@id': 'https://cloud.synelia.tech/#organisation' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ_ACCUEIL.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.reponse },
        })),
      },
    ],
  }
}

export default function Accueil() {
  const etat = etatPlateforme()
  const temoin = TEMOIGNAGES[0]

  return (
    <>
      {/*
        Sérialisé à la main : `<` échappé pour qu'un futur libellé contenant
        une balise ne referme pas le script.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(donneesStructurees()).replace(/</g, '\\u003c'),
        }}
      />

      {/* ─── 1 · Héros ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-p-900">
        {/*
          La photo reste sous un voile opaque à gauche : c'est là que se trouve
          le texte, et un fond photographique sous du texte blanc fait tomber le
          contraste sous le seuil AA. À droite le voile s'éclaircit, où il n'y a
          que le visuel de baie.
        */}
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
          className="absolute -right-40 -top-32 h-96 w-96 rounded-full bg-m-600/20 blur-3xl"
          aria-hidden
        />
        <span
          className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-p-600/30 blur-3xl"
          aria-hidden
        />
        <Container className="relative py-16 sm:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
                <MicroLabel className="text-p-300">
                  Infrastructure cloud · Côte d’Ivoire
                </MicroLabel>
                <PastilleEtat ton={etat.ton} texte={etat.texte} href="/statut" />
              </div>
              <h1 className="mt-4 text-[34px] font-bold leading-[1.08] tracking-[-0.02em] [font-family:var(--font-display)] text-white sm:text-[52px]">
                Votre infrastructure et vos applications,
                <br />
                hébergées et opérées{' '}
                <span className="text-m-400">en Côte d’Ivoire.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-p-300">
                Espaces Cloud, machines virtuelles, Kubernetes managé, messagerie et Drive : Synelia
                provisionne, dimensionne, sauvegarde et supervise depuis Abidjan et Grand-Bassam.
                Deux sites nommés, une équipe joignable sur place, et un plan de reprise que nous
                exerçons chaque trimestre.
              </p>
              {/*
                Les vitrines de cloud promettent toutes la même chose. Dire ce
                qu'on ne fait pas situe l'offre plus vite qu'un argument de plus.
              */}
              <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-p-400">
                Ce que nous ne faisons pas : réimplémenter les logiciels que vous utilisez déjà. Nous
                les opérons, et vous les ouvrez dans leur propre interface.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink
                  href="/offres/espace-cloud"
                  size="lg"
                  variant="inverse"
                  iconAfter={<ArrowRight size={15} />}
                >
                  Découvrir les offres
                </ButtonLink>
                <ButtonLink
                  href="/entreprises#contact"
                  size="lg"
                  variant="ghostInverse"
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
          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
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
          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          {/*
            Le mobile money était relégué dans la FAQ. Sur ce marché, c'est
            souvent le premier moyen disponible : il vaut mieux le montrer à
            côté des prix qu'à la neuvième question.
          */}
          <div className="mt-10 rounded-[12px] border border-g-300 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <p className="text-[15px] font-bold [font-family:var(--font-display)] text-ink">
                Payé comme vous payez déjà
              </p>
              <p className="text-[12.5px] text-g-500">
                Facturation en FCFA, TVA 18 %, aucun frais de sortie
              </p>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MOYENS_PAIEMENT.map((m) => (
                <li key={m.nom} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[10.5px] font-bold"
                    style={{
                      background: surfaceMarque(m.teinte).fond,
                      color: surfaceMarque(m.teinte).texte,
                    }}
                    aria-hidden
                  >
                    {m.initiales}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-ink">{m.nom}</span>
                    <span className="block text-[12px] leading-snug text-g-700">{m.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </SiteSection>

      {/* ─── 5 · Bloc PRA ─────────────────────────────────────────────── */}
      <SiteSection fond="clair" className="border-y border-p-300 !bg-p-050">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
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
          {/*
            Le schéma dit où sont les copies et sur quel site. Les trois nombres
            au-dessus disent à quelle vitesse on repart ; ils ne disent pas d'où.
          */}
          <figure className="mt-10">
            <img
              src="/illustrations/sauvegarde-321.svg"
              alt="Schéma de la règle 3-2-1 appliquée par Synelia : la production dans l’Espace Cloud à Abidjan, un instantané local sur NVMe au site Synertech Vallon, une réplique hors site sur stockage objet au parc VITIB de Grand-Bassam, et une copie immuable verrouillée quatorze jours."
              width={760}
              height={306}
              className="w-full max-w-[760px] rounded-[14px]"
            />
          </figure>
        </Container>
      </SiteSection>

      {/* ─── 5 bis · Les deux sites ───────────────────────────────────── */}
      <SiteSection>
        <Container>
          <SectionTitle
            surtitre="Deux sites, nommés"
            titre="Abidjan et Grand-Bassam, à 4–6 ms l’un de l’autre"
            chapeau="« Cloud souverain » ne veut rien dire tant qu'on ne nomme pas les bâtiments. Voici les nôtres, la distance qui les sépare, et ce que cette distance permet : répliquer hors site sans sortir du territoire."
          />
          <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <figure>
              <img
                src="/illustrations/carte-sites.svg"
                alt="Carte de la Côte d’Ivoire situant les deux sites de Synelia : Abidjan (Synertech Vallon, à Cocody) et Grand-Bassam (parc VITIB), reliés par une liaison de 4 à 6 millisecondes."
                width={600}
                height={735}
                className="w-full"
              />
            </figure>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {[
                {
                  photo: '/photos/abidjan.webp',
                  alt: 'Vue aérienne du quartier du Plateau à Abidjan au crépuscule, le long de la lagune Ébrié.',
                  titre: 'Abidjan · Synertech Vallon',
                  detail: 'Cocody. Site principal : calcul, stockage bloc, réseau et supervision.',
                },
                {
                  photo: '/photos/grand-bassam.webp',
                  alt: 'Vue aérienne du littoral de Grand-Bassam, bordé de palmiers et de l’océan Atlantique.',
                  titre: 'Grand-Bassam · Parc VITIB',
                  detail: 'Site de réplication : stockage objet, copies immuables, bascule de PRA.',
                },
                {
                  photo: '/photos/noc-supervision.webp',
                  alt: 'Salle de supervision de nuit, murs d’écrans affichant des graphes et des cartes.',
                  titre: 'Supervision 24/7',
                  detail: 'Astreinte assurée depuis Abidjan, jamais déléguée à un centre d’appels.',
                },
                {
                  photo: '/photos/fibre-optique.webp',
                  alt: 'Gros plan sur un panneau de brassage optique et ses connecteurs.',
                  titre: 'Liaison inter-site',
                  detail: 'Deux chemins de fibre distincts. La réplication ne quitte pas le pays.',
                },
              ].map((c) => (
                <figure
                  key={c.titre}
                  className="overflow-hidden rounded-[12px] border border-g-300 bg-white shadow-[0_1px_2px_rgba(43,27,77,.06)]"
                >
                  <img
                    src={c.photo}
                    alt={c.alt}
                    width={1376}
                    height={768}
                    loading="lazy"
                    className="h-36 w-full object-cover"
                  />
                  <figcaption className="p-4">
                    <p className="text-[14px] font-bold [font-family:var(--font-display)] text-ink">
                      {c.titre}
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-g-700">{c.detail}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <p className="mt-6 text-[11.5px] leading-relaxed text-g-500">
            Vues d’illustration. Les visites de site se font sur rendez-vous, accompagnées, et se
            demandent depuis votre espace client.
          </p>
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
          <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {BLOC_SOUVERAINETE.map((b, i) => (
              <div key={b.titre} className="flex flex-col">
                {/*
                  Trois pictogrammes distincts, pas trois fois le même bouclier :
                  le lieu, la matrice de droits, l'export. L'icône doit aider à
                  distinguer les questions, sinon elle ne sert à rien.
                */}
                <img
                  src={b.illustration}
                  alt=""
                  aria-hidden
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
                <h3 className="mt-4 text-[17px] font-bold [font-family:var(--font-display)] text-ink">
                  <span className="tnum mr-1.5 text-g-500">0{i + 1}</span>
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
              className="max-w-3xl"
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
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
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

          {/*
            Trois nombres ne convainquent pas seuls : ils ne disent pas ce que
            la migration a coûté à l'équipe d'en face. On ouvre donc sur une
            voix, et on renvoie vers les récits complets.
          */}
          <div className="mt-8 grid grid-cols-1 items-center gap-6 rounded-[14px] border border-p-300 bg-p-050 p-6 lg:grid-cols-[1.35fr_0.65fr] sm:p-8">
            <Citation
              texte={temoin.citation}
              auteur={temoin.auteur}
              role={temoin.organisation}
              initiales={temoin.initiales}
            />
            <div className="lg:border-l lg:border-p-300 lg:pl-8">
              <p className="text-[13px] leading-relaxed text-g-700">
                Quatre clients racontent leur migration en détail — l’état des lieux avant, ce qui a
                été fait, et ce qui a dérapé en cours de route. Trois des quatre ont dépassé le
                délai annoncé.
              </p>
              <div className="mt-4">
                <LienFleche href="/temoignages">Lire les quatre récits</LienFleche>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
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

      {/* ─── 9 · Les personnes ────────────────────────────────────────── */}
      <SiteSection fond="clair">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <SectionTitle
                surtitre="L’équipe"
                titre="« Supervision 24/7 » veut dire huit personnes, à Abidjan"
                chapeau="Tout le monde écrit cette phrase. Chez nous elle recouvre une équipe d’exploitation qui vit sur votre fuseau, connaît votre parc et a les droits pour agir — pas seulement pour ouvrir un ticket."
              />
              <ul className="mt-7 space-y-2.5">
                {[
                  'L’ingénieur de garde est à Abidjan, jamais sur un autre continent.',
                  'Une semaine d’astreinte sur quatre, jamais deux d’affilée.',
                  'C’est nous qui vous appelons. Si vous nous apprenez la panne, nous avons manqué quelque chose.',
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2.5">
                    <Check size={14} className="mt-[3px] shrink-0 text-p-700" />
                    <span className="text-[13.5px] leading-relaxed text-g-700">{x}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <ButtonLink href="/equipe" variant="secondary" iconAfter={<ArrowRight size={14} />}>
                  Rencontrer l’équipe
                </ButtonLink>
                <LienFleche href="/histoire">Pourquoi nous avons construit ceci</LienFleche>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {EQUIPE.slice(0, 4).map((m, i) => (
                <li
                  key={m.nom}
                  className="flex flex-col rounded-[12px] border border-g-300 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <Monogramme initiales={m.initiales} index={i} taille="md" />
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-bold [font-family:var(--font-display)] text-ink">
                        {m.nom}
                      </span>
                      <span className="block text-[11.5px] leading-snug text-g-500">{m.site}</span>
                    </span>
                  </div>
                  <p className="mt-3 text-[12px] font-semibold text-p-700">{m.role}</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-g-700">{m.texte}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </SiteSection>

      {/* ─── 10 · Parcours de démarrage ───────────────────────────────── */}
      <SiteSection fond="violet-fonce" className="relative overflow-hidden">
        <span className="absolute inset-0 bg-grid-light opacity-50" aria-hidden />
        <Container className="relative">
          <SectionTitle
            sombre
            surtitre="Démarrage"
            titre="De la signature à la première reprise exercée"
            chapeau="La page vous a montré le produit et les chiffres. Voici le chemin entre les deux, avec ce que vous recevez à chaque jalon."
          />
          <ol className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-p-400/50 bg-p-400/40 sm:grid-cols-2 lg:grid-cols-4">
            {PARCOURS_DEMARRAGE.map((e, i) => (
              <li key={e.titre} className="flex flex-col bg-p-900/80 p-5">
                <div className="flex items-baseline gap-2.5">
                  <span className="tnum text-[13px] font-bold [font-family:var(--font-display)] text-m-400">
                    0{i + 1}
                  </span>
                  <span className="type-micro text-p-300">{e.jalon}</span>
                </div>
                <h3 className="mt-3 text-[16px] font-bold leading-tight [font-family:var(--font-display)] text-white">
                  {e.titre}
                </h3>
                <p className="mt-2.5 flex-1 text-[13px] leading-relaxed text-p-300">{e.texte}</p>
                <p className="mt-4 border-t border-white/10 pt-3">
                  <span className="type-micro text-p-300">Vous recevez</span>
                  <span className="mt-1 block text-[12.5px] font-semibold text-white">
                    {e.livrable}
                  </span>
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <p className="max-w-2xl text-[12.5px] leading-relaxed text-p-300">
              {PARCOURS_LIMITES} Les durées sont des ordres de grandeur constatés sur nos
              migrations, pas un engagement contractuel : celui-ci est daté dans le plan de bascule.
            </p>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <ButtonLink href="/entreprises#contact" variant="inverse">
                Demander un atelier de cadrage
              </ButtonLink>
              <LienFleche href="/docs" sombre>
                Lire la documentation de migration
              </LienFleche>
            </div>
          </div>
        </Container>
      </SiteSection>

      {/* ─── 11 · FAQ ─────────────────────────────────────────────────── */}
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

      {/* ─── 12 · Appel final ─────────────────────────────────────────── */}
      <AppelFinal />
    </>
  )
}
