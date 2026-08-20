'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Boxes, Globe, Layers, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { money, relatif } from '@/lib/format'
import type { TypeServiceProjet } from '@/lib/types'
import {
  PROJETS,
  SYNTHESE_PROJETS,
  TYPE_SERVICE_LABEL,
  ZONE_APPLICATIVE,
  servicesDuProjet,
  syntheseProjet,
} from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { CopyField, GatedAction } from '@/components/ui/display'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Card, CardHeader, Callout, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { Drawer } from '@/components/ui/overlay'
import { ICONE_TYPE } from '@/components/business/projets'
import { useApp } from '@/components/app/contexte'

export default function Projets() {
  const { autorise, refus } = useApp()
  const [creation, setCreation] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Projets' }]}
        titre="Projets"
        sousTitre="Un projet regroupe les services qui forment un même système : l’application, sa base, son cache, ses tâches de fond. C’est la maille qui répond à « qu’est-ce qui casse si j’arrête ça ? »."
        actions={
          <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
            <Button iconBefore={<Plus size={14} />} onClick={() => setCreation(true)}>
              Créer un projet
            </Button>
          </GatedAction>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile libelle="Projets" valeur={SYNTHESE_PROJETS.projets} />
        <StatTile
          libelle="Services déployés"
          valeur={SYNTHESE_PROJETS.services}
          detail="applications, bases, tâches"
        />
        <StatTile
          libelle="Services en échec"
          valeur={SYNTHESE_PROJETS.enEchec}
          ton={SYNTHESE_PROJETS.enEchec > 0 ? 'err' : 'ok'}
          detail={SYNTHESE_PROJETS.enEchec > 0 ? 'à traiter' : 'rien à signaler'}
        />
        <StatTile
          libelle="Coût mensuel"
          valeur={money(SYNTHESE_PROJETS.coutMensuel).replace(' FCFA', '')}
          unite="FCFA"
        />
      </div>

      <Callout ton="violet" titre={`Votre zone offerte : ${ZONE_APPLICATIVE.zone}`}>
        Chaque service déployé reçoit une adresse en{' '}
        <span className="font-mono text-[12px]">{ZONE_APPLICATIVE.wildcard}</span>, certificat
        compris. Votre première mise en ligne ne dépend donc d’aucun achat de domaine. Vous
        brancherez le vôtre quand vous voudrez, depuis{' '}
        <Link href="/app/applications/routage" className="font-semibold text-p-700 hover:text-m-600">
          Domaines &amp; routage
        </Link>
        .
      </Callout>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PROJETS.map((p) => {
          const s = syntheseProjet(p.id)
          const services = servicesDuProjet(p.id)
          const alerte = s.enEchec > 0 ? 'err' : s.degrades > 0 ? 'warn' : 'ok'

          return (
            <Card key={p.id} hover className="flex flex-col">
              <CardHeader
                titre={
                  <Link href={`/app/applications/projets/${p.id}`} className="hover:text-p-700">
                    {p.nom}
                  </Link>
                }
                sousTitre={p.description}
                actions={
                  <Badge tone={alerte} dot size="sm">
                    {s.enEchec > 0
                      ? `${s.enEchec} en échec`
                      : s.degrades > 0
                        ? `${s.degrades} dégradé${s.degrades > 1 ? 's' : ''}`
                        : 'Nominal'}
                  </Badge>
                }
              />

              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(TYPE_SERVICE_LABEL) as TypeServiceProjet[])
                  .filter((t) => s.parType[t])
                  .map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 rounded-[6px] border border-g-300 bg-g-050 px-2 py-1 text-[11.5px] font-semibold text-g-700"
                    >
                      <span className="text-p-700">{ICONE_TYPE[t]}</span>
                      {s.parType[t]} {TYPE_SERVICE_LABEL[t].toLowerCase()}
                      {s.parType[t] > 1 && t !== 'base' ? 's' : ''}
                    </span>
                  ))}
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                <MicroLabel className="mr-1">Environnements</MicroLabel>
                {p.environnements.map((e) => (
                  <Badge key={e} tone="neutral" size="sm">
                    {e}
                  </Badge>
                ))}
              </div>

              <ul className="mt-3.5 space-y-1 border-t border-g-100 pt-3">
                {services.slice(0, 4).map((svc) => (
                  <li key={svc.id} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/app/applications/projets/${p.id}/${svc.id}`}
                      className="flex min-w-0 items-center gap-2 hover:text-p-700"
                    >
                      <span
                        className={cn(
                          'shrink-0',
                          svc.statut === 'failed'
                            ? 'text-err'
                            : svc.statut === 'degraded'
                              ? 'text-warn'
                              : svc.statut === 'stopped'
                                ? 'text-g-500'
                                : 'text-ok',
                        )}
                      >
                        {ICONE_TYPE[svc.type]}
                      </span>
                      <span className="truncate font-mono text-[12px] font-semibold text-ink">
                        {svc.nom}
                      </span>
                      <span className="shrink-0 text-[11px] text-g-500">{svc.environnement}</span>
                    </Link>
                    <span className="shrink-0 text-[11px] text-g-500">
                      {relatif(svc.derniereMaj)}
                    </span>
                  </li>
                ))}
                {services.length > 4 && (
                  <li className="pt-0.5 text-[11.5px] text-g-500">
                    et {services.length - 4} autre{services.length - 4 > 1 ? 's' : ''} service
                    {services.length - 4 > 1 ? 's' : ''}
                  </li>
                )}
              </ul>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-g-100 pt-3">
                <span className="flex items-center gap-3 text-[11.5px] text-g-500">
                  <span className="inline-flex items-center gap-1">
                    <Globe size={12} />
                    {s.domaines} domaine{s.domaines > 1 ? 's' : ''}
                  </span>
                  <span className="tnum font-semibold text-ink">{money(s.coutMensuel)}/mois</span>
                </span>
                <ButtonLink href={`/app/applications/projets/${p.id}`} variant="secondary" size="sm">
                  Ouvrir le projet
                </ButtonLink>
              </div>
            </Card>
          )
        })}
      </div>

      <Drawer
        open={creation}
        onClose={() => setCreation(false)}
        title="Créer un projet"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreation(false)}>
              Annuler
            </Button>
            <Button onClick={() => setCreation(false)}>Créer le projet</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Callout ton="info" titre="Un projet ne consomme rien par lui-même">
            Créer un projet ne facture rien : c’est un contenant. La facturation commence au premier
            service déployé, au prorata journalier.
          </Callout>
          <Field label="Nom du projet" hint="Visible par tous les membres qui ont accès au projet.">
            <Input placeholder="Plateforme de facturation" />
          </Field>
          <Field
            label="Description"
            hint="Une phrase suffit. Elle répond à « à quoi sert ce système ? » pour la personne qui prendra l’astreinte."
          >
            <Textarea rows={3} placeholder="API de facturation, sa base et ses relances par lot." />
          </Field>
          <Field
            label="Environnements"
            hint="Un environnement porte ses propres services et ses propres variables. Vous pourrez en ajouter ensuite."
          >
            <Input defaultValue="Production, Préproduction" />
          </Field>
          <div className="rounded-[8px] border border-g-300 bg-g-050 p-3">
            <MicroLabel>Adresse offerte pour ce projet</MicroLabel>
            <CopyField value={`<service>-<env>.${ZONE_APPLICATIVE.zone}`} className="mt-1.5" />
            <p className="mt-2 text-[11.5px] leading-relaxed text-g-500">
              Chaque service recevra son adresse dans cette zone, avec certificat automatique. Rien
              à acheter, rien à configurer.
            </p>
          </div>
        </div>
      </Drawer>

      <Card>
        <CardHeader
          titre="Ce que contient un projet"
          sousTitre="Cinq types de services, tous facturés au prorata journalier."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              type: 'application' as const,
              phrase:
                'Dépôt Git ou image Docker, construite puis déployée avec journal de build, analyse de sécurité et bascule sans coupure.',
            },
            {
              type: 'base' as const,
              phrase:
                'PostgreSQL, MySQL, MariaDB, MongoDB, Redis ou ClickHouse, avec URI de connexion interne, sauvegarde et restauration.',
            },
            {
              type: 'statique' as const,
              phrase:
                'Sortie de build servie par un cache en bordure. Pas de processus applicatif, donc rien à surveiller côté mémoire.',
            },
            {
              type: 'cron' as const,
              phrase:
                'Commande exécutée selon une expression cron, avec historique daté, durée et journal de chaque exécution.',
            },
            {
              type: 'worker' as const,
              phrase:
                'Processus de file sans port exposé : profondeur de file, débit, échecs et concurrence réglable.',
            },
          ].map((t) => (
            <div key={t.type} className="rounded-[8px] border border-g-300 p-3">
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-p-050 text-p-700">
                  {ICONE_TYPE[t.type]}
                </span>
                <span className="text-[12.5px] font-bold text-ink">
                  {TYPE_SERVICE_LABEL[t.type]}
                </span>
              </span>
              <p className="mt-2 text-[11.5px] leading-relaxed text-g-700">{t.phrase}</p>
            </div>
          ))}
          <div className="flex flex-col justify-center rounded-[8px] border border-dashed border-p-300 bg-p-050 p-3">
            <span className="flex items-center gap-2 text-[12.5px] font-bold text-p-700">
              <Layers size={14} />
              Composer plusieurs briques
            </span>
            <p className="mt-2 text-[11.5px] leading-relaxed text-g-700">
              L’assistant de création propose aussi un canvas : on pose les briques, on relie les
              dépendances, la plateforme génère le tout.
            </p>
            <ButtonLink href="/app/applications/nouveau" variant="ghost" size="sm" className="mt-2 self-start">
              Ouvrir l’assistant
              <Boxes size={13} />
            </ButtonLink>
          </div>
        </div>
      </Card>
    </div>
  )
}
