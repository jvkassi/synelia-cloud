'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Boxes,
  Check,
  ExternalLink,
  FileDown,
  MonitorPlay,
  Repeat,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { money, moneyPerMonth, pct } from '@/lib/format'
import { CATEGORIE_LABEL } from '@/lib/types'
import { CATALOGUE, CONTRAT_INTEGRATION, SERVICES_MANAGES } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { SolutionLogo } from '@/components/ui/display'
import { Slider } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { CostPreview } from '@/components/composition/flow'
import { useApp } from '@/components/app/contexte'
import { GatedAction } from '@/components/ui/display'

/** Formulations du contrat d'intégration adaptées à chaque service. */
const PRECISIONS: Record<number, (nom: string, oss: string) => string> = {
  1: (nom, oss) =>
    `Nous déployons une instance ${oss} isolée (mode dédié) ou un compte sur une instance partagée (mode mutualisé), sur le site que vous choisissez à la souscription.`,
  2: () =>
    'Le palier, le nombre de sièges et les quotas se modifient à chaud, sans interruption de service et avec application immédiate du prorata.',
  3: () =>
    'Sous-domaine Synelia fourni par défaut, ou votre propre domaine avec vérification DNS guidée et certificat renouvelé automatiquement.',
  4: (_nom, oss) =>
    `Client OIDC déclaré dans Keycloak, provisioning des comptes à la première connexion, et mapping de vos groupes d’annuaire vers les rôles applicatifs de ${oss}.`,
  5: () =>
    'Attribution et retrait de sièges depuis le portail, avec la vue « qui consomme quoi » et le coût par siège.',
  6: (nom) =>
    `Plan de sauvegarde appliqué dès le provisioning, restauration granulaire adaptée à ${nom}, et test de restauration périodique dont le résultat est daté.`,
  7: () =>
    'Sondes de supervision posées automatiquement, disponibilité mesurée par nos sondes et comparée à l’engagement contractuel du service.',
  8: (_nom, oss) =>
    `Versions ${oss} qualifiées avant déploiement, fenêtre de maintenance annoncée, changelog consultable et retour arrière disponible.`,
  9: () =>
    'Export dans un format standard, documenté et testé. Nous vérifions la réversibilité comme nous vérifions les restaurations.',
}

export function FicheService({ slug }: { slug: string }) {
  const service = CATALOGUE.find((c) => c.slug === slug)!
  const dejaSouscrit = SERVICES_MANAGES.find((s) => s.catalogSlug === slug)
  const { autorise, refus } = useApp()

  const paliers = service.paliers
  const [palierCode, setPalierCode] = useState(
    (paliers.find((p) => p.recommande) ?? paliers[0]).code,
  )
  const [sieges, setSieges] = useState(20)
  const [modeDedie, setModeDedie] = useState(service.modes.includes('dedie'))

  const palier = paliers.find((p) => p.code === palierCode)!
  const majoration = modeDedie && service.modes.includes('mutualise') ? 1.2 : 1
  const parSiege = palier.prixSiege !== undefined
  const coutMensuel = Math.round(
    parSiege ? palier.prixSiege! * sieges * majoration : palier.prixMois! * majoration,
  )

  const lignesCout = useMemo(() => {
    const l: Array<{ libelle: string; detail?: string; montant: number; quantite?: number }> = []
    if (parSiege) {
      l.push({
        libelle: `${service.nom} · palier ${palier.nom}`,
        detail: `${money(palier.prixSiege!)} par siège et par mois`,
        montant: palier.prixSiege! * sieges,
        quantite: sieges,
      })
    } else {
      l.push({
        libelle: `${service.nom} · palier ${palier.nom}`,
        detail: palier.specs,
        montant: palier.prixMois!,
      })
    }
    if (majoration > 1) {
      l.push({
        libelle: 'Majoration mode dédié (+20 %)',
        detail: 'Instance isolée, capacité réservée',
        montant: Math.round((coutMensuel / majoration) * 0.2),
      })
    }
    return l
  }, [service.nom, palier, sieges, parSiege, majoration, coutMensuel])

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Marketplace', href: '/app/marketplace' },
          { label: service.nom },
        ]}
        titre={
          <span className="flex items-center gap-3">
            <SolutionLogo initiales={service.logoInitiales} teinte={service.logoTeinte} size="lg" />
            {service.nom}
          </span>
        }
        sousTitre={service.description}
        meta={
          <>
            <Badge tone="neutral">{CATEGORIE_LABEL[service.categorie]}</Badge>
            <Badge tone="violet">{service.solutionOSS}</Badge>
            <Badge tone={service.certifie ? 'ok' : 'neutral'}>
              {service.certifie ? 'Certifié Synelia' : 'Communauté'}
            </Badge>
            {service.modes.map((m) => (
              <Badge key={m} tone="neutral" size="sm">
                {m === 'dedie' ? 'Dédié' : 'Mutualisé'}
              </Badge>
            ))}
            <span className="text-[12px] text-g-500">SLA {service.sla}</span>
          </>
        }
        actions={
          dejaSouscrit ? (
            <>
              <ButtonLink
                href={dejaSouscrit.urlNative}
                external
                variant="accent"
                iconAfter={<ExternalLink size={13} />}
              >
                Ouvrir
              </ButtonLink>
              <ButtonLink href={`/app/services/${dejaSouscrit.id}`} variant="secondary">
                Administrer
              </ButtonLink>
            </>
          ) : (
            <GatedAction
              autorise={autorise('marketplace.subscribe')}
              message={refus('marketplace.subscribe')}
            >
              <ButtonLink href={`/app/marketplace/${slug}/souscrire`}>Souscrire</ButtonLink>
            </GatedAction>
          )
        }
      />

      {dejaSouscrit && (
        <Callout ton="ok" titre={`Votre organisation utilise déjà ${service.nom}`}>
          Instance {dejaSouscrit.mode === 'dedie' ? 'dédiée' : 'mutualisée'} sur le site{' '}
          {dejaSouscrit.site}, version {dejaSouscrit.version}, {dejaSouscrit.siegesUtilises} sièges
          utilisés sur {dejaSouscrit.siegesSouscrits}. Souscrire à nouveau créerait une seconde
          instance indépendante.
        </Callout>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          {/* Bloc 2 — ce que vous obtenez */}
          <Card>
            <CardHeader
              titre="Ce que vous obtenez"
              sousTitre={`L’interface de ${service.solutionOSS}, telle que ses auteurs l’ont conçue.`}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {service.captures.map((c, i) => (
                <div
                  key={c}
                  className="overflow-hidden rounded-[8px] border border-g-300 bg-g-050"
                >
                  <div
                    className="flex h-7 items-center gap-1.5 border-b border-g-300 px-2.5"
                    style={{ background: `${service.logoTeinte}14` }}
                  >
                    <span className="flex gap-1">
                      {['#E5534B', '#E3B341', '#3FB950'].map((t) => (
                        <span
                          key={t}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: t }}
                        />
                      ))}
                    </span>
                    <span className="truncate font-mono text-[9px] text-g-500">
                      {service.urlDemo.replace('https://', '')}
                    </span>
                  </div>
                  <div className="space-y-1.5 p-2.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ background: service.logoTeinte, width: `${58 + i * 12}%` }}
                    />
                    <div className="h-1.5 w-full rounded-full bg-g-300" />
                    <div className="h-1.5 w-4/5 rounded-full bg-g-300" />
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      {Array.from({ length: 6 }).map((_, k) => (
                        <div key={k} className="h-5 rounded-[3px] bg-white ring-1 ring-g-300" />
                      ))}
                    </div>
                  </div>
                  <p className="border-t border-g-300 px-2.5 py-1.5 text-[11px] font-medium text-g-700">
                    {c}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-[6px] bg-g-050 px-3 py-2.5">
              <MonitorPlay size={14} className="mt-0.5 shrink-0 text-g-500" />
              <p className="text-[11.5px] leading-relaxed text-g-700">
                Représentation schématique. En production, vous utilisez{' '}
                <span className="font-semibold">
                  l’interface de la solution open source, opérée par Synelia
                </span>{' '}
                — avec son écosystème complet, ses applications mobiles et sa documentation
                d’origine. Le portail ne réimplémente aucun de ses écrans.
              </p>
            </div>
          </Card>

          {/* Bloc 3 — ce que Synelia opère (le plus important) */}
          <Card className="border-p-300">
            <CardHeader
              titre="Ce que Synelia opère pour vous"
              sousTitre="Les neuf capacités du contrat d’intégration, appliquées à ce service."
              actions={<Badge tone="violet">Inclus dans le prix</Badge>}
            />
            <ol className="space-y-2.5">
              {CONTRAT_INTEGRATION.map((c) => (
                <li key={c.num} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok text-white">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">{c.capacite}</p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-g-700">
                      {PRECISIONS[c.num]?.(service.nom, service.solutionOSS)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-4 rounded-[8px] border-l-4 border-p-600 bg-p-050 px-3.5 py-3">
              <p className="text-[12.5px] leading-relaxed text-g-700">
                <span className="font-semibold text-ink">
                  Vous pourriez installer {service.solutionOSS} vous-même.
                </span>{' '}
                Ce que vous achetez ici, c’est l’exploitation : le dimensionnement à chaud, la
                fédération d’identité, la sauvegarde immuable avec restauration testée, la
                supervision avec engagement de service, les montées de version qualifiées, et la
                garantie de pouvoir repartir avec vos données dans un format standard.
              </p>
            </div>
          </Card>

          {/* Bloc 4 — paliers et limites */}
          <Card>
            <CardHeader
              titre="Paliers et limites"
              sousTitre={
                service.modes.length > 1
                  ? 'Le mode dédié majore de 20 % le prix affiché.'
                  : 'Ce service n’existe qu’en mode dédié.'
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    <th className="type-micro px-3 py-2 text-left text-g-500">Palier</th>
                    <th className="type-micro px-3 py-2 text-left text-g-500">Dimensionnement</th>
                    <th className="type-micro px-3 py-2 text-left text-g-500">Ce qui est inclus</th>
                    <th className="type-micro px-3 py-2 text-right text-g-500">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {paliers.map((p) => (
                    <tr
                      key={p.code}
                      className={cn(
                        'border-b border-g-100 last:border-0',
                        p.recommande && 'bg-p-050',
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                          {p.nom}
                          {p.recommande && (
                            <Badge tone="violet" size="sm">
                              Recommandé
                            </Badge>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[12.5px] text-g-700">{p.specs}</td>
                      <td className="px-3 py-2.5">
                        <ul className="space-y-0.5">
                          {p.limites.map((l) => (
                            <li key={l} className="text-[12px] text-g-700">
                              · {l}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="tnum whitespace-nowrap px-3 py-2.5 text-right">
                        <span className="text-[13.5px] font-bold text-p-700">
                          {money(p.prixSiege ?? p.prixMois ?? 0)}
                        </span>
                        <span className="block text-[10.5px] text-g-500">
                          {p.prixSiege !== undefined ? '/siège/mois' : '/mois'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2.5 text-[11.5px] text-g-500">
              Prix hors taxes. TVA 18 % appliquée à la facturation. Versions supportées :{' '}
              {service.versionsSupportees.join(' · ')}.
            </p>
          </Card>

          {/* Bloc 5 — sauvegarde et réversibilité */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader
                titre={
                  <span className="flex items-center gap-2">
                    <Boxes size={15} className="text-p-700" />
                    Sauvegarde et restauration
                  </span>
                }
              />
              <KeyValueList
                colonnes={1}
                items={[
                  { cle: 'Plan appliqué par défaut', valeur: service.backupPolicyDefault },
                  {
                    cle: 'Granularité de restauration',
                    valeur: (
                      <ul className="space-y-0.5">
                        {service.granulariteRestauration.map((g) => (
                          <li key={g} className="text-[12.5px]">
                            · {g}
                          </li>
                        ))}
                      </ul>
                    ),
                  },
                  {
                    cle: 'Test de restauration',
                    valeur: 'Échantillon mensuel restauré et vérifié, résultat daté et consultable.',
                  },
                ]}
              />
            </Card>

            <Card>
              <CardHeader
                titre={
                  <span className="flex items-center gap-2">
                    <Repeat size={15} className="text-p-700" />
                    Réversibilité
                  </span>
                }
              />
              <KeyValueList
                colonnes={1}
                items={[
                  {
                    cle: 'Formats d’export',
                    valeur: (
                      <span className="flex flex-wrap gap-1.5">
                        {service.reversibilite.formats.map((f) => (
                          <Badge key={f} tone="neutral" size="sm">
                            {f}
                          </Badge>
                        ))}
                      </span>
                    ),
                  },
                  {
                    cle: 'Délai de mise à disposition',
                    valeur: `${service.reversibilite.delaiJours} jours ouvrés après la demande`,
                  },
                  {
                    cle: 'Documentation de reprise',
                    valeur: (
                      <a
                        href={service.reversibilite.docUrl}
                        className="inline-flex items-center gap-1 font-semibold text-p-700 hover:text-m-600"
                      >
                        <FileDown size={12} />
                        Procédure documentée
                      </a>
                    ),
                  },
                ]}
              />
              <p className="mt-2 text-[11.5px] leading-relaxed text-g-500">
                Partir doit être possible pour que rester soit un choix. Nous testons ces exports.
              </p>
            </Card>
          </div>

          {/* Bloc 6 — migration entrante */}
          <Card>
            <CardHeader
              titre="Migration entrante"
              sousTitre={service.migrationDelais}
            />
            <div className="flex flex-wrap gap-2">
              {service.migrationEntrante.map((m) => (
                <span
                  key={m}
                  className="flex items-center gap-2 rounded-[6px] border border-g-300 bg-g-050 px-2.5 py-1.5 text-[12.5px] text-g-700"
                >
                  <ArrowUpRight size={12} className="text-p-700" />
                  {m}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-g-700">
              Les migrations sont menées par l’équipe Synelia à Abidjan, avec pré-synchronisation
              puis bascule finale sur un créneau que vous choisissez. Un retour arrière reste
              possible pendant les quarante-huit heures qui suivent la bascule. Le chiffrage fait
              l’objet d’un devis distinct de l’abonnement.
            </p>
          </Card>

          <Card>
            <CardHeader titre="Paramètres que vous piloterez depuis le portail" />
            <KeyValueList
              colonnes={2}
              items={service.parametresSpecifiques.map((p) => ({
                cle: p.titre,
                valeur: p.description,
              }))}
            />
            <p className="mt-2 text-[11.5px] text-g-500">
              Uniquement des politiques, jamais du contenu. Le contenu se gère dans{' '}
              {service.solutionOSS}.
            </p>
          </Card>
        </div>

        {/* Panneau collant */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <MicroLabel>Configurer votre souscription</MicroLabel>

            <div className="mt-3 space-y-1.5">
              {paliers.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => setPalierCode(p.code)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-[6px] border px-2.5 py-2 text-left transition-colors',
                    palierCode === p.code
                      ? 'border-p-700 bg-p-050'
                      : 'border-g-300 hover:border-p-400',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-semibold text-ink">
                      {p.nom}
                    </span>
                    <span className="block truncate text-[11px] text-g-500">{p.specs}</span>
                  </span>
                  <span className="tnum shrink-0 text-[12px] font-bold text-p-700">
                    {money(p.prixSiege ?? p.prixMois ?? 0)}
                  </span>
                </button>
              ))}
            </div>

            {service.modes.length > 1 && (
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {(['dedie', 'mutualise'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModeDedie(m === 'dedie')}
                    className={cn(
                      'rounded-[6px] border px-2 py-1.5 text-[12px] font-semibold transition-colors',
                      (m === 'dedie') === modeDedie
                        ? 'border-p-700 bg-p-050 text-p-700'
                        : 'border-g-300 text-g-700 hover:border-p-400',
                    )}
                  >
                    {m === 'dedie' ? 'Dédié' : 'Mutualisé'}
                  </button>
                ))}
              </div>
            )}

            {parSiege && (
              <div className="mt-4">
                <Slider
                  label="Nombre de sièges"
                  value={sieges}
                  onChange={setSieges}
                  min={5}
                  max={200}
                  step={5}
                  unite="sièges"
                />
              </div>
            )}
          </Card>

          <CostPreview lignes={lignesCout} />

          <GatedAction
            autorise={autorise('marketplace.subscribe')}
            message={refus('marketplace.subscribe')}
          >
            <ButtonLink
              href={`/app/marketplace/${slug}/souscrire`}
              size="lg"
              fullWidth
            >
              Souscrire · {moneyPerMonth(coutMensuel)}
            </ButtonLink>
          </GatedAction>

          <Card padding={false}>
            <div className="px-3.5 py-3">
              <MicroLabel>Engagements</MicroLabel>
              <dl className="mt-2 space-y-1.5">
                <Petit cle="SLA" valeur={service.sla} />
                <Petit
                  cle="Sites disponibles"
                  valeur="Abidjan · Grand-Bassam"
                />
                <Petit cle="Sans engagement" valeur="Résiliable en fin de mois" />
                <Petit
                  cle="Remise annuelle"
                  valeur={`−15 % soit ${money(Math.round(coutMensuel * 0.85))}/mois`}
                />
              </dl>
            </div>
            <div className="border-t border-g-100 px-3.5 py-2.5">
              <Link
                href="/app/docs"
                className="text-[12px] font-semibold text-p-700 hover:text-m-600"
              >
                Documentation française du service →
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function Petit({ cle, valeur }: { cle: string; valeur: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-[11.5px] text-g-500">{cle}</dt>
      <dd className="tnum text-right text-[11.5px] font-semibold text-ink">{valeur}</dd>
    </div>
  )
}
