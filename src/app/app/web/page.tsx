'use client'

import Link from 'next/link'
import { Globe, HardDrive, Plus, Server, ShoppingBag } from 'lucide-react'
import { cn, surfaceMarque } from '@/lib/utils'
import { dateHeure, money, num } from '@/lib/format'
import { SITE_LABEL } from '@/lib/types'
import {
  HEBERGEMENTS,
  SERVICES_PARTAGES,
  SITES_WEB,
  TYPE_SITE_LABEL,
  nomServi,
  partagesDeLHebergement,
  sitesDeLHebergement,
} from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { PageHeader, Card, CardHeader, Callout } from '@/components/composition/card'
import { StatTile, QuotaBar, HealthBadge } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { useApp } from '@/components/app/contexte'

/** Teinte de la vignette d'un site, par famille de solution. */
const TEINTE_SITE: Record<string, string> = {
  wordpress: '#21759B',
  prestashop: '#DF0067',
  php: '#777BB4',
  statique: '#4B2882',
  laravel: '#FF2D20',
}

export default function HebergementsWeb() {
  const { autorise, refus } = useApp()

  const espace = HEBERGEMENTS.reduce((a, h) => a + h.espaceUtiliseGo, 0)
  const espaceTotal = HEBERGEMENTS.reduce((a, h) => a + h.espaceTotalGo, 0)
  const majEnAttente = SITES_WEB.reduce((a, s) => a + (s.majEnAttente ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Hébergements web' }]}
        titre="Hébergements web"
        sousTitre="Un hébergement, c’est un domaine et un serveur, liés strictement. Sur ce serveur cohabitent vos sites — chacun sur son sous-domaine —, vos bases, et les services partagés rattachés au domaine : messagerie et drive."
        actions={
          <GatedAction autorise={autorise('marketplace.subscribe')} message={refus('marketplace.subscribe')}>
            <Button iconBefore={<Plus size={14} />}>Commander un hébergement</Button>
          </GatedAction>
        }
        meta={
          <>
            <Badge tone="neutral">{HEBERGEMENTS.length} hébergements</Badge>
            <Badge tone="neutral">{SITES_WEB.length} sites</Badge>
            <Badge tone="neutral">{SERVICES_PARTAGES.length} services partagés</Badge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile libelle="Hébergements" valeur={HEBERGEMENTS.length} detail="un serveur chacun" />
        <StatTile libelle="Sites en ligne" valeur={SITES_WEB.filter((s) => s.statut === 'en_ligne').length} detail={`sur ${SITES_WEB.length} installés`} />
        <StatTile
          libelle="Espace occupé"
          valeur={`${espace.toFixed(1)} Go`}
          detail={`sur ${num(espaceTotal)} Go alloués`}
        />
        <StatTile
          libelle="Mises à jour en attente"
          valeur={majEnAttente}
          ton={majEnAttente > 0 ? 'warn' : 'ok'}
          detail="cœur et extensions"
        />
      </div>

      {HEBERGEMENTS.length === 0 ? (
        <EmptyState
          titre="Aucun hébergement"
          phrase="Un hébergement mutualisé vous donne un serveur avec Apache, PHP et un moteur de base, sur lequel vous installez autant de sites que nécessaire. Le nom de domaine peut être acheté plus tard."
          action={{ libelle: 'Commander un hébergement', href: '#' }}
        />
      ) : (
        <div className="space-y-4">
          {HEBERGEMENTS.map((h) => {
            const sites = sitesDeLHebergement(h.id)
            const partages = partagesDeLHebergement(h.id)
            return (
              <Card key={h.id}>
                <CardHeader
                  titre={
                    <span className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/app/web/${h.id}`}
                        className="break-words font-mono text-[15px] font-bold text-ink hover:text-p-700"
                      >
                        {nomServi(h)}
                      </Link>
                      {!h.domaine && (
                        <Badge tone="warn" size="sm">
                          Domaine à acheter
                        </Badge>
                      )}
                      <HealthBadge etat={h.statut === 'en_ligne' ? 'ok' : h.statut === 'maintenance' ? 'maintenance' : 'suspendu'} />
                      <Badge tone="neutral" size="sm">
                        {h.palier}
                      </Badge>
                    </span>
                  }
                  sousTitre={`Serveur ${h.serveur.nom} · ${h.serveur.vcpu} vCPU · ${h.serveur.ramGo} Go · ${h.serveur.diskGo} Go · ${SITE_LABEL[h.serveur.site]} · ${h.serveur.serveurWeb} · PHP ${h.php.versionDefaut}`}
                  actions={
                    <ButtonLink href={`/app/web/${h.id}`} variant="secondary" size="sm">
                      Gérer
                    </ButtonLink>
                  }
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {/* Le serveur, parce que c'est lui qui plafonne tout le reste */}
                  <div className="rounded-[8px] border border-g-300 bg-g-050 p-3">
                    <MicroLabel className="flex items-center gap-1.5">
                      <Server size={11} /> Serveur
                    </MicroLabel>
                    <div className="mt-2 space-y-2">
                      <QuotaBar libelle="Processeur" utilise={h.serveur.chargeCpuPct} total={100} unite="%" compact seuil={85} />
                      <QuotaBar libelle="Mémoire" utilise={h.serveur.ramUtiliseePct} total={100} unite="%" compact seuil={90} />
                      <QuotaBar
                        libelle="Disque"
                        utilise={h.espaceUtiliseGo}
                        total={h.espaceTotalGo}
                        seuil={85}
                        compact
                        formateur={(v) => `${v.toFixed(1)} Go`}
                      />
                    </div>
                    <p className="mt-2.5 font-mono text-[11px] text-g-500">
                      {h.serveur.ip} · {h.serveur.os}
                    </p>
                  </div>

                  {/* Les sites, un par sous-domaine */}
                  <div className="lg:col-span-2">
                    <MicroLabel className="flex items-center gap-1.5">
                      <Globe size={11} /> Sites installés
                    </MicroLabel>
                    {sites.length === 0 ? (
                      <p className="mt-2 text-[12.5px] text-g-500">
                        Aucun site installé. Le serveur est prêt : installez WordPress, PrestaShop
                        ou déposez vos fichiers par SFTP.
                      </p>
                    ) : (
                      <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {sites.map((s) => {
                          const surface = surfaceMarque(TEINTE_SITE[s.type] ?? '#4B2882')
                          return (
                            <li key={s.id}>
                              <Link
                                href={`/app/web/${h.id}?site=${s.id}`}
                                className="flex items-start gap-2.5 rounded-[8px] border border-g-300 bg-white p-2.5 transition-colors hover:border-p-400 hover:bg-p-050"
                              >
                                <span
                                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-[9.5px] font-bold"
                                  style={{ background: surface.fond, color: surface.texte }}
                                  aria-hidden
                                >
                                  {TYPE_SITE_LABEL[s.type].slice(0, 2).toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-mono text-[12px] font-semibold text-ink">
                                    {s.hote}
                                  </span>
                                  <span className="block text-[11px] text-g-500">
                                    {TYPE_SITE_LABEL[s.type]}
                                    {s.version ? ` ${s.version}` : ''} · PHP {s.phpVersion} ·{' '}
                                    {num(s.visitesMois)} visites/mois
                                  </span>
                                </span>
                                <span className="flex shrink-0 flex-col items-end gap-1">
                                  {s.statut === 'installation' ? (
                                    <Badge tone="info" size="sm" dot>
                                      Installation
                                    </Badge>
                                  ) : s.ssl.etat === 'actif' ? (
                                    <Badge tone="ok" size="sm">
                                      TLS
                                    </Badge>
                                  ) : (
                                    <Badge tone="warn" size="sm">
                                      TLS en cours
                                    </Badge>
                                  )}
                                  {(s.majEnAttente ?? 0) > 0 && (
                                    <Badge tone="warn" size="sm">
                                      {s.majEnAttente} maj
                                    </Badge>
                                  )}
                                </span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Services partagés fixés au domaine */}
                <div className="mt-4 border-t border-g-100 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <MicroLabel className="flex items-center gap-1.5">
                      <ShoppingBag size={11} /> Services partagés sur ce domaine
                    </MicroLabel>
                    <Link
                      href="/app/web/services"
                      className="text-[12px] font-semibold text-p-700 hover:text-m-600"
                    >
                      Voir le catalogue partagé →
                    </Link>
                  </div>
                  {partages.length === 0 ? (
                    <p className="mt-2 text-[12px] text-g-500">
                      Ni messagerie ni drive sur ce domaine pour l’instant.
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {partages.map((p) => (
                        <span
                          key={p.id}
                          className="flex items-center gap-2 rounded-[6px] border border-g-300 bg-white px-2.5 py-1.5"
                        >
                          <span className="text-[12px] font-semibold text-ink">{p.nom}</span>
                          <span className="font-mono text-[11px] text-g-500">{p.hote}</span>
                          <span className="tnum text-[11px] text-g-700">
                            {p.usage.utilise}/{p.usage.total} {p.usage.unite}
                          </span>
                          {p.sante === 'maj_disponible' && (
                            <Badge tone="accent" size="sm">
                              Mise à jour
                            </Badge>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-g-500">
                  <span className="flex items-center gap-1.5">
                    <HardDrive size={11} />
                    Dernière sauvegarde {dateHeure(h.sauvegarde.derniere)} · {h.sauvegarde.taille}
                    {h.sauvegarde.immuable && ' · immuable'}
                  </span>
                  <span className={cn(h.sauvegarde.statut === 'ok' ? 'text-ok' : 'text-err')}>
                    {h.sauvegarde.statut === 'ok' ? 'Sauvegarde conforme' : 'Dernière sauvegarde en échec'}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Callout ton="info" titre="Partagé ou dédié : comment choisir">
        Sur un hébergement, tout partage le même serveur — c’est ce qui rend l’offre abordable, et
        c’est aussi sa limite : un pic de trafic sur un site se ressent sur les autres. Quand une
        application demande sa propre capacité, sa propre version de moteur ou son propre plan de
        sauvegarde, elle relève d’un projet applicatif et non d’un hébergement.{' '}
        <Link href="/app/modeles" className="font-semibold text-p-700 hover:text-m-600">
          Voir la bibliothèque de modèles dédiés →
        </Link>
      </Callout>

      <Card>
        <CardHeader
          titre="Ce que coûte un hébergement"
          sousTitre="Prix mensuels hors taxes, en francs CFA. Le nom de domaine est facturé à l’année, séparément."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { nom: 'Démarrage', specs: '2 vCPU · 4 Go · 40 Go · 1 site', prix: 4500 },
            { nom: 'Pro', specs: '2 vCPU · 4 Go · 80 Go · 5 sites', prix: 12000, recommande: true },
            { nom: 'Agence', specs: '4 vCPU · 8 Go · 200 Go · 25 sites', prix: 38000 },
          ].map((p) => (
            <div
              key={p.nom}
              className={cn(
                'rounded-[8px] border-2 p-3',
                p.recommande ? 'border-p-700 bg-p-050' : 'border-g-300 bg-white',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold text-ink">{p.nom}</p>
                {p.recommande && (
                  <Badge tone="violet" size="sm">
                    Le plus pris
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-[11.5px] text-g-700">{p.specs}</p>
              <p className="tnum mt-2 text-[16px] font-bold text-p-700">{money(p.prix)}<span className="text-[11px] font-semibold text-g-500">/mois</span></p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
