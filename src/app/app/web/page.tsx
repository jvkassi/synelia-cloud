'use client'

import Link from 'next/link'
import { ExternalLink, Plus, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateCourte, goHumain, relatif } from '@/lib/format'
import { HEBERGEMENTS } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { Card, CardHeader, Callout, PageHeader } from '@/components/composition/card'
import { HealthBadge, QuotaBar, StatTile } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { useApp } from '@/components/app/contexte'

const TYPE_LABEL: Record<string, { nom: string; teinte: string; admin: string }> = {
  wordpress: { nom: 'WordPress', teinte: '#21759B', admin: '/wp-admin' },
  prestashop: { nom: 'PrestaShop', teinte: '#DF0067', admin: '/admin-dba' },
  mutualise: { nom: 'Hébergement mutualisé', teinte: '#6B3FA0', admin: '' },
}

export default function Web() {
  const { autorise, refus } = useApp()

  const aMettreAJour = HEBERGEMENTS.filter(
    (h) => (h.versions?.extensionsAMettreAJour ?? 0) > 0 || !h.versions?.majAuto,
  ).length
  const sansWaf = HEBERGEMENTS.filter((h) => !h.securite.waf).length
  const certProche = HEBERGEMENTS.filter((h) => h.certificat.expire < '2026-10-15').length

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Hébergement web' }]}
        titre="Hébergement web"
        sousTitre="Nous exploitons le socle : moteur PHP, base de données, certificat, pare-feu applicatif, sauvegardes, environnement de pré-production. Le contenu de votre site se travaille dans son propre administrateur — nous vous y menons, nous ne le refaisons pas."
        actions={
          <GatedAction autorise={autorise('marketplace.subscribe')} message={refus('marketplace.subscribe')}>
            <ButtonLink href="/app/marketplace" iconBefore={<Plus size={14} />}>
              Nouvel hébergement
            </ButtonLink>
          </GatedAction>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile libelle="Sites hébergés" valeur={HEBERGEMENTS.length} ton="ok" />
        <StatTile
          libelle="Mises à jour en attente"
          valeur={aMettreAJour}
          ton={aMettreAJour > 0 ? 'warn' : 'ok'}
          detail={aMettreAJour > 0 ? 'Cœur ou extensions' : 'Tout est à jour'}
        />
        <StatTile
          libelle="Sites sans pare-feu applicatif"
          valeur={sansWaf}
          ton={sansWaf > 0 ? 'warn' : 'ok'}
          detail={sansWaf > 0 ? 'Exposition directe' : 'Tous protégés'}
        />
        <StatTile
          libelle="Certificats à renouveler"
          valeur={certProche}
          ton="ok"
          detail="Renouvellement automatique actif"
        />
      </div>

      {HEBERGEMENTS.length === 0 ? (
        <EmptyState
          titre="Aucun hébergement web"
          phrase="Un hébergement web comprend le moteur, la base, le certificat, le pare-feu applicatif et les sauvegardes. Vous choisissez la solution — WordPress, PrestaShop, ou un socle libre — et nous nous occupons du reste."
          action={{ libelle: 'Voir le catalogue', href: '/app/marketplace' }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {HEBERGEMENTS.map((h) => {
            const t = TYPE_LABEL[h.type]
            const majEnAttente = h.versions?.extensionsAMettreAJour ?? 0
            return (
              <Card key={h.id} className="flex flex-col" hover>
                <div className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] text-[10px] font-bold text-white"
                      style={{ background: t.teinte }}
                    >
                      {t.nom.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <Link
                        href={`/app/web/${h.id}`}
                        className="block truncate font-mono text-[13px] font-bold text-ink hover:text-p-700"
                      >
                        {h.domaine}
                      </Link>
                      <span className="block text-[11px] text-g-500">
                        {t.nom} · palier {h.palier}
                      </span>
                    </span>
                  </span>
                  <HealthBadge etat={h.statut} size="sm" />
                </div>

                <div className="mt-3 space-y-2">
                  <QuotaBar
                    libelle="Espace disque"
                    utilise={h.espaceUtiliseGo}
                    total={h.espaceTotalGo}
                    compact
                    seuil={80}
                    formateur={(v) => goHumain(v)}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  <Badge tone="neutral" size="sm">
                    PHP {h.runtime.php}
                  </Badge>
                  {h.runtime.node && (
                    <Badge tone="neutral" size="sm">
                      Node {h.runtime.node}
                    </Badge>
                  )}
                  {h.versions?.coeur ? (
                    <Badge tone="neutral" size="sm">
                      {t.nom} {h.versions.coeur}
                    </Badge>
                  ) : null}
                  <Badge tone="neutral" size="sm">
                    {h.bases} base{h.bases > 1 ? 's' : ''}
                  </Badge>
                  {h.staging && (
                    <Badge tone="violet" size="sm">
                      Pré-production
                    </Badge>
                  )}
                </div>

                <dl className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-g-100 pt-3">
                  <Meta
                    cle="Pare-feu applicatif"
                    valeur={h.securite.waf ? 'Actif' : 'Inactif'}
                    ton={h.securite.waf ? 'ok' : 'warn'}
                  />
                  <Meta
                    cle="Analyse antimalware"
                    valeur={h.securite.scanMalware ? 'Quotidienne' : 'Désactivée'}
                    ton={h.securite.scanMalware ? 'ok' : 'warn'}
                  />
                  <Meta
                    cle="Certificat TLS"
                    valeur={`${dateCourte(h.certificat.expire)}${h.certificat.auto ? ' · auto' : ''}`}
                    ton="ok"
                  />
                  <Meta
                    cle="Mises à jour du cœur"
                    valeur={h.versions?.majAuto ? 'Automatiques' : 'Manuelles'}
                    ton={h.versions?.majAuto ? 'ok' : 'warn'}
                  />
                </dl>

                {majEnAttente > 0 && (
                  <p className="mt-2.5 flex items-center gap-1.5 rounded-[6px] bg-warn-bg px-2.5 py-1.5 text-[11.5px] text-ink">
                    <ShieldAlert size={12} className="shrink-0 text-warn" />
                    {majEnAttente} extension{majEnAttente > 1 ? 's' : ''} à mettre à jour, dont une
                    correction de sécurité
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-g-100 pt-3.5">
                  {t.admin && (
                    <ButtonLink
                      size="sm"
                      variant="accent"
                      external
                      href={`https://${h.domaine}${t.admin}`}
                      iconAfter={<ExternalLink size={12} />}
                    >
                      Ouvrir l’administration
                    </ButtonLink>
                  )}
                  <ButtonLink size="sm" variant="secondary" href={`/app/web/${h.id}`}>
                    Gérer l’hébergement
                  </ButtonLink>
                  <ButtonLink
                    size="sm"
                    variant="ghost"
                    external
                    href={`https://${h.domaine}`}
                    iconAfter={<ExternalLink size={11} />}
                  >
                    Voir le site
                  </ButtonLink>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader
          titre="Dernières interventions du socle"
          sousTitre="Ce que nous avons fait pour vous, sans que vous ayez à le demander."
        />
        <div className="space-y-2">
          {[
            {
              quand: '2026-08-19T04:12:00Z',
              site: 'blog.dba.africa',
              quoi: 'Correctif de sécurité du cœur appliqué (6.6.1 → 6.6.2)',
              detail: 'Snapshot pris avant, vérification du démarrage après. Aucune interruption mesurée.',
              ton: 'ok' as const,
            },
            {
              quand: '2026-08-18T22:40:00Z',
              site: 'boutique.dba.africa',
              quoi: '1 284 requêtes bloquées par le pare-feu applicatif',
              detail: 'Tentatives d’injection sur le formulaire de recherche, depuis 42 adresses. Aucune n’a atteint la base.',
              ton: 'warn' as const,
            },
            {
              quand: '2026-08-18T03:00:00Z',
              site: 'Tous les sites',
              quoi: 'Sauvegarde quotidienne complète — fichiers et bases',
              detail: 'Conservation 30 jours, copie hors site à Grand-Bassam.',
              ton: 'ok' as const,
            },
            {
              quand: '2026-08-15T11:22:00Z',
              site: 'carrieres.dba.africa',
              quoi: 'Certificat TLS renouvelé automatiquement',
              detail: 'Nouvelle échéance au 30 septembre 2026. Aucune action de votre part.',
              ton: 'ok' as const,
            },
          ].map((e) => (
            <div
              key={e.quand}
              className="flex flex-wrap items-start justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
            >
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-ink">{e.quoi}</span>
                <span className="block text-[11.5px] leading-relaxed text-g-500">{e.detail}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone={e.ton} size="sm">
                  {e.site}
                </Badge>
                <span className="text-[10.5px] text-g-500">{relatif(e.quand)}</span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Callout ton="violet" titre="Nous ne construisons pas d’éditeur de contenu">
          Écrire un article, gérer un catalogue produits, régler un thème : ces écrans existent déjà
          dans WordPress et PrestaShop, et ils sont bien meilleurs que ce que nous pourrions faire.
          Notre travail s’arrête à la porte : version du cœur, moteur PHP, base, certificat,
          pare-feu, sauvegardes, pré-production. Le bouton « Ouvrir l’administration » vous connecte
          directement, sans ressaisir de mot de passe.
        </Callout>
        <Callout ton="info" titre="La pré-production, pour ne rien casser en direct">
          Un clic clone le site — fichiers, base, configuration — dans un environnement isolé. Vous y
          testez une mise à jour, une extension, un changement de thème. Quand c’est bon, la remise
          en production ne copie que ce qui a changé, et un snapshot est pris juste avant.
        </Callout>
      </div>
    </div>
  )
}

function Meta({
  cle,
  valeur,
  ton = 'neutral',
}: {
  cle: string
  valeur: string
  ton?: 'neutral' | 'ok' | 'warn'
}) {
  return (
    <div className="min-w-0">
      <dt className="type-micro text-g-500">{cle}</dt>
      <dd
        className={cn(
          'mt-0.5 truncate text-[12px] font-semibold',
          ton === 'ok' ? 'text-ok' : ton === 'warn' ? 'text-warn' : 'text-ink',
        )}
      >
        {valeur}
      </dd>
    </div>
  )
}
