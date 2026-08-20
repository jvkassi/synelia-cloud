'use client'

import Link from 'next/link'
import { ExternalLink, Mail, Plus, ShieldCheck, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { money, relatif } from '@/lib/format'
import {
  CATALOGUE_PARTAGE,
  HEBERGEMENTS,
  SERVICES_PARTAGES,
  nomServi,
  partagesDeLHebergement,
} from '@/lib/mock'
import { MODELES } from '@/lib/mock/modeles'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { PageHeader, Card, CardHeader, Callout } from '@/components/composition/card'
import { StatTile, QuotaBar, HealthBadge } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { useApp } from '@/components/app/contexte'

export default function ServicesPartages() {
  const { autorise, refus, pousser } = useApp()

  const parDomaine = HEBERGEMENTS.map((h) => ({
    hebergement: h,
    services: partagesDeLHebergement(h.id),
  })).filter((d) => d.services.length > 0)

  const sansService = HEBERGEMENTS.filter((h) => partagesDeLHebergement(h.id).length === 0)

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Hébergements web', href: '/app/web' },
          { label: 'Services partagés' },
        ]}
        titre="Services partagés"
        sousTitre="Messagerie, drive et visio rattachés à un domaine. L’instance est mutualisée entre plusieurs clients, ce qui les rend abordables ; en échange, elles se règlent au niveau du domaine et non du service."
        meta={
          <>
            <Badge tone="neutral">{SERVICES_PARTAGES.length} services actifs</Badge>
            <Badge tone="neutral">sur {parDomaine.length} domaines</Badge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile libelle="Services actifs" valeur={SERVICES_PARTAGES.length} detail="messagerie, drive" />
        <StatTile
          libelle="Boîtes aux lettres"
          valeur={SERVICES_PARTAGES.filter((s) => s.slug === 'email-pro').reduce((a, s) => a + s.usage.utilise, 0)}
          detail={`sur ${SERVICES_PARTAGES.filter((s) => s.slug === 'email-pro').reduce((a, s) => a + s.usage.total, 0)} souscrites`}
        />
        <StatTile
          libelle="Espace de drive"
          valeur={`${SERVICES_PARTAGES.filter((s) => s.slug === 'drive-pro').reduce((a, s) => a + s.usage.utilise, 0)} Go`}
          detail="occupés"
        />
        <StatTile
          libelle="Mises à jour proposées"
          valeur={SERVICES_PARTAGES.filter((s) => s.sante === 'maj_disponible').length}
          ton={SERVICES_PARTAGES.some((s) => s.sante === 'maj_disponible') ? 'warn' : 'ok'}
          detail="fenêtre à confirmer"
        />
      </div>

      <Callout ton="violet" titre="Partagé, dédié : la frontière">
        Un service partagé vit sur une instance commune et s’adresse à un domaine :{' '}
        <span className="font-mono">nom@votredomaine.ci</span>. C’est le bon choix jusqu’à quelques
        dizaines de comptes. Au-delà — ou dès qu’une contrainte de rétention, de quota ou
        d’annuaire apparaît — il faut une instance isolée, que l’on déploie dans un projet depuis la
        bibliothèque de modèles.{' '}
        <Link href="/app/modeles" className="font-semibold text-p-700 hover:text-m-600">
          Voir les modèles dédiés →
        </Link>
      </Callout>

      {parDomaine.length === 0 ? (
        <EmptyState
          titre="Aucun service partagé"
          phrase="Une messagerie sur votre domaine se met en service en quelques minutes : nous créons les enregistrements MX, SPF, DKIM et DMARC, et vous n’avez qu’à créer les boîtes."
          action={{ libelle: 'Voir les hébergements', href: '/app/web' }}
        />
      ) : (
        <div className="space-y-4">
          {parDomaine.map(({ hebergement, services }) => (
            <Card key={hebergement.id}>
              <CardHeader
                titre={
                  <span className="flex flex-wrap items-center gap-2.5">
                    <Link
                      href={`/app/web/${hebergement.id}`}
                      className="font-mono text-[14px] font-bold text-ink hover:text-p-700"
                    >
                      {nomServi(hebergement)}
                    </Link>
                    <Badge tone="neutral" size="sm">
                      {services.length} service{services.length > 1 ? 's' : ''}
                    </Badge>
                  </span>
                }
                sousTitre={`Servi par ${hebergement.serveur.nom}. Les services partagés de ce domaine se règlent depuis sa fiche d’hébergement.`}
                actions={
                  <ButtonLink href={`/app/web/${hebergement.id}`} variant="secondary" size="sm">
                    Configurer
                  </ButtonLink>
                }
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {services.map((s) => (
                  <div key={s.id} className="rounded-[8px] border border-g-300 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-ink">{s.nom}</p>
                        <p className="mt-0.5 font-mono text-[11.5px] text-g-500">{s.hote}</p>
                      </div>
                      <HealthBadge
                        etat={
                          s.sante === 'maj_disponible'
                            ? 'maj_disponible'
                            : s.sante === 'degrade'
                              ? 'degrade'
                              : s.sante === 'maintenance'
                                ? 'maintenance'
                                : 'ok'
                        }
                      />
                    </div>
                    <p className="mt-1.5 text-[11.5px] text-g-500">
                      {s.solution} {s.version} · sauvegardé {relatif(s.derniereSauvegarde)}
                    </p>
                    <QuotaBar
                      className="mt-2.5"
                      libelle={s.usage.libelle}
                      utilise={s.usage.utilise}
                      total={s.usage.total}
                      unite={s.usage.unite}
                      seuil={85}
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <GatedAction autorise={autorise('service.open')} message={refus('service.open')}>
                        <ButtonLink
                          href={s.urlOuverture}
                          variant="accent"
                          size="sm"
                          iconAfter={<ExternalLink size={12} />}
                        >
                          Ouvrir
                        </ButtonLink>
                      </GatedAction>
                      <ButtonLink
                        href={`/app/web/${hebergement.id}`}
                        variant="secondary"
                        size="sm"
                      >
                        Administrer
                      </ButtonLink>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {sansService.length > 0 && (
        <Card>
          <CardHeader
            titre="Domaines sans service partagé"
            sousTitre="Ces hébergements servent des sites, mais n’ont ni messagerie ni drive."
          />
          <ul className="space-y-2">
            {sansService.map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-g-300 px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate font-mono text-[12.5px] font-semibold text-ink">
                    {nomServi(h)}
                  </span>
                  <span className="block text-[11px] text-g-500">
                    {h.domaine ? h.palier : 'Nom provisoire — domaine à acheter'}
                  </span>
                </span>
                <ButtonLink href={`/app/web/${h.id}`} variant="ghost" size="sm">
                  Ajouter un service →
                </ButtonLink>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader
          titre="Le catalogue partagé"
          sousTitre="Trois services, et c’est volontaire : au-delà, la mutualisation nuit plus qu’elle n’aide."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {CATALOGUE_PARTAGE.map((c) => {
            const icone =
              c.slug === 'email-pro' ? (
                <Mail size={15} />
              ) : c.slug === 'visio' ? (
                <Video size={15} />
              ) : (
                <ShieldCheck size={15} />
              )
            const actifs = SERVICES_PARTAGES.filter((s) => s.slug === c.slug).length
            return (
              <div key={c.slug} className="flex flex-col rounded-[8px] border border-g-300 p-3.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-p-050 text-p-700">
                  {icone}
                </span>
                <p className="mt-2.5 text-[13.5px] font-bold text-ink">{c.nom}</p>
                <p className="mt-0.5 text-[11.5px] text-g-500">{c.solution}</p>
                <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-g-700">{c.phrase}</p>
                <p className="mt-2 font-mono text-[11px] text-g-500">
                  {c.sousDomaine}.votredomaine.ci
                </p>
                <p className="tnum mt-2 text-[16px] font-bold text-p-700">
                  {money(c.prix)}
                  <span className="text-[10.5px] font-semibold text-g-500">{c.unite}</span>
                </p>
                {actifs > 0 && (
                  <p className="mt-1 text-[11px] text-ok">
                    Actif sur {actifs} domaine{actifs > 1 ? 's' : ''}
                  </p>
                )}
                <GatedAction
                  autorise={autorise('marketplace.subscribe')}
                  message={refus('marketplace.subscribe')}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    className="mt-2.5"
                    iconBefore={<Plus size={13} />}
                    onClick={() =>
                      pousser({
                        ton: 'info',
                        titre: `${c.nom} — choisissez le domaine`,
                        detail: 'Un service partagé s’attache à un hébergement. Ouvrez sa fiche pour l’activer.',
                      })
                    }
                  >
                    Activer
                  </Button>
                </GatedAction>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <CardHeader
          titre="Les équivalents dédiés"
          sousTitre="Même besoin, instance isolée. Le prix est plus élevé, le contrôle est total."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {MODELES.filter((m) => ['zimbra', 'nextcloud', 'jitsi'].includes(m.slug)).map((m) => {
            const partage = CATALOGUE_PARTAGE.find(
              (c) =>
                (m.slug === 'zimbra' && c.slug === 'email-pro') ||
                (m.slug === 'nextcloud' && c.slug === 'drive-pro') ||
                (m.slug === 'jitsi' && c.slug === 'visio'),
            )
            return (
              <Link
                key={m.slug}
                href={`/app/modeles/${m.slug}`}
                className="group rounded-[8px] border border-g-300 p-3.5 transition-colors hover:border-p-400 hover:bg-p-050"
              >
                <MicroLabel>{m.solution}</MicroLabel>
                <p className="mt-1 text-[13.5px] font-bold text-ink group-hover:text-p-700">
                  {m.nom}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-g-700">{m.phrase}</p>
                <p className="tnum mt-2 text-[15px] font-bold text-p-700">
                  {money(m.prixIndicatif)}
                  <span className="text-[10.5px] font-semibold text-g-500">/mois</span>
                </p>
                {partage && (
                  <p className={cn('mt-1 text-[11px] text-g-500')}>
                    contre {money(partage.prix)}
                    {partage.unite} en partagé
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
