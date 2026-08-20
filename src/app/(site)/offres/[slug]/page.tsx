import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowDown, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { money } from '@/lib/format'
import { FICHES_PRODUIT } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Card, KeyValueList } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { Accordeon, AppelFinal, Container, SiteSection } from '@/components/site/blocs'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const f = FICHES_PRODUIT.find((x) => x.slug === slug)
  return {
    title: f ? `${f.nom} — ${f.accroche}` : 'Offre introuvable',
    description: f?.resume,
  }
}

export default async function FicheProduit({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const f = FICHES_PRODUIT.find((x) => x.slug === slug)
  if (!f) notFound()

  return (
    <>
      {/* Héros court */}
      <section className="relative overflow-hidden border-b border-g-300 bg-p-900">
        <span className="absolute inset-0 bg-grid-light opacity-60" aria-hidden />
        <span
          className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-m-600/20 blur-3xl"
          aria-hidden
        />
        <Container className="relative py-14 sm:py-16">
          <MicroLabel className="text-p-300">{f.surtitre}</MicroLabel>
          <h1 className="mt-3 text-[32px] font-bold leading-[1.1] [font-family:var(--font-display)] text-white sm:text-[44px]">
            {f.nom}
          </h1>
          <p className="mt-3 max-w-2xl text-[18px] font-semibold leading-snug text-m-600 sm:text-[22px]">
            {f.accroche}
          </p>
          <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-p-300">{f.resume}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <ButtonLink href="/signup" size="lg" variant="inverse">
              Créer un compte
            </ButtonLink>
            <ButtonLink
              href="/entreprises#contact"
              size="lg"
              variant="ghostInverse"
            >
              Demander un devis
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Ce que c'est, en trois puces */}
      <SiteSection className="!py-10">
        <Container>
          <div className="grid gap-5 sm:grid-cols-3">
            {f.puces.map((p, i) => (
              <div key={p} className="flex gap-3">
                <span className="tnum mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-p-100 text-[12px] font-bold text-p-700">
                  {i + 1}
                </span>
                <p className="text-[13.5px] leading-relaxed text-g-700">{p}</p>
              </div>
            ))}
          </div>
        </Container>
      </SiteSection>

      {/* Paliers */}
      <SiteSection fond="clair">
        <Container>
          <h2 className="type-h2">Paliers et tarifs</h2>
          <p className="mt-2 text-[13.5px] text-g-700">
            Prix mensuels hors taxes, en francs CFA. TVA 18 % appliquée à la facturation. Facturation
            au prorata journalier sur toute création ou suppression en cours de mois.
          </p>
          <div
            className={cn(
              'mt-6 grid gap-4',
              f.paliers.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3',
            )}
          >
            {f.paliers.map((p) => (
              <div
                key={p.nom}
                className={cn(
                  'flex flex-col rounded-[10px] border-2 bg-white p-5',
                  p.recommande
                    ? 'border-p-700 shadow-[0_4px_16px_rgba(43,27,77,.1)]'
                    : 'border-g-300',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="type-h3">{p.nom}</h3>
                  {p.recommande && (
                    <Badge tone="violet" size="sm">
                      Recommandé
                    </Badge>
                  )}
                </div>
                <p className="mt-1.5 flex-1 text-[12px] leading-snug text-g-700">{p.specs}</p>
                <p className="tnum mt-4 border-t border-g-100 pt-4 text-[22px] font-bold leading-none [font-family:var(--font-display)] text-p-700">
                  {p.surDevis ? <span className="text-[16px]">Sur devis</span> : money(p.prix ?? 0)}
                  {!p.surDevis && (
                    <span className="block text-[11px] font-semibold text-g-500">{p.unite}</span>
                  )}
                </p>
                <ButtonLink
                  href={p.surDevis ? '/entreprises#contact' : '/signup'}
                  variant={p.recommande ? 'primary' : 'secondary'}
                  fullWidth
                  className="mt-4"
                  size="sm"
                >
                  {p.surDevis ? 'Demander un devis' : 'Souscrire'}
                </ButtonLink>
              </div>
            ))}
          </div>
        </Container>
      </SiteSection>

      {/* Caractéristiques détaillées, en accordéon par thème */}
      <SiteSection>
        <Container>
          <h2 className="type-h2">Caractéristiques détaillées</h2>
          <div className="mt-6 divide-y divide-g-300 overflow-hidden rounded-[10px] border border-g-300 bg-white">
            {f.caracteristiques.map((c, i) => (
              <details key={c.theme} className="group" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-g-050">
                  <span className="flex items-center gap-3">
                    <span className="text-[14px] font-bold [font-family:var(--font-display)] text-ink">
                      {c.theme}
                    </span>
                    <Badge tone="neutral" size="sm">
                      {c.items.length} points
                    </Badge>
                  </span>
                  <ChevronDown
                    size={16}
                    className="shrink-0 text-g-500 transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="border-t border-g-100 bg-g-050 px-4 py-4">
                  <KeyValueList
                    colonnes={2}
                    items={c.items.map((it) => ({ cle: it.libelle, valeur: it.valeur }))}
                  />
                </div>
              </details>
            ))}
          </div>
        </Container>
      </SiteSection>

      {/* SLA */}
      <SiteSection fond="clair">
        <Container>
          <h2 className="type-h2">Niveau de service associé</h2>
          <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-g-700">
            La disponibilité est mesurée par nos sondes avec un pas d’une minute et publiée
            mensuellement dans votre espace client. Les fenêtres de maintenance annoncées au moins
            sept jours à l’avance sont exclues du calcul.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile libelle="Disponibilité engagée" valeur={f.sla.dispo} ton="ok" />
            <StatTile libelle="Première réponse" valeur={f.sla.reponse} />
            <StatTile libelle="Résolution visée" valeur={f.sla.resolution} />
            <StatTile libelle="Crédits" valeur={f.sla.credits} ton="violet" />
          </div>
        </Container>
      </SiteSection>

      {/* Schéma d'architecture typique */}
      <SiteSection>
        <Container>
          <h2 className="type-h2">{f.architecture.titre}</h2>
          <p className="mt-2 text-[13.5px] text-g-700">
            Configuration que nous déployons le plus souvent sur cette offre. Elle sert de point de
            départ à l’atelier de cadrage, pas de contrainte.
          </p>
          <div className="mt-7 mx-auto max-w-2xl">
            {f.architecture.couches.map((c, i) => (
              <div key={c.nom}>
                <div
                  className={cn(
                    'rounded-[10px] border-2 px-4 py-3.5',
                    i === 0
                      ? 'border-m-600 bg-m-050'
                      : i === f.architecture.couches.length - 1
                        ? 'border-ok bg-ok-bg'
                        : 'border-p-300 bg-p-050',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[13px] font-bold [font-family:var(--font-display)] text-ink">
                      {c.nom}
                    </p>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {c.elements.map((e) => (
                        <span
                          key={e}
                          className="rounded-full border border-g-300 bg-white px-2.5 py-1 text-[11.5px] font-medium text-g-700"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {i < f.architecture.couches.length - 1 && (
                  <div className="flex justify-center py-1.5">
                    <ArrowDown size={16} className="text-g-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[12px] text-g-500">
            Chaque ressource affiche son emplacement physique — site ABJ ou GBM — partout dans le
            portail.
          </p>
        </Container>
      </SiteSection>

      {/* FAQ */}
      <SiteSection fond="clair">
        <Container taille="md">
          <h2 className="type-h2 text-center">Questions fréquentes sur cette offre</h2>
          <Accordeon items={f.faq} className="mt-6" />
        </Container>
      </SiteSection>

      <AppelFinal
        titre={`Prêt à déployer votre ${f.nom.toLowerCase()} ?`}
        chapeau="Créez un compte pour explorer l’assistant de création dans un portail peuplé de données de démonstration, ou faites chiffrer votre besoin réel par un architecte."
        primaire={{ libelle: 'Créer un compte', href: '/signup' }}
        secondaire={{ libelle: 'Demander un devis', href: '/entreprises#contact' }}
      />
    </>
  )
}
