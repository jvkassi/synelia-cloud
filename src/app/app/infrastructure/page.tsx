'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowRight, Plus } from 'lucide-react'
import { num, pct, toHumain } from '@/lib/format'
import { SITE_COURT } from '@/lib/types'
import {
  BASES_MANAGEES,
  BUCKETS,
  DR_PLANS,
  ESPACES,
  K8S_CLUSTERS,
  LOAD_BALANCERS,
  ORG_COURANTE,
  SYNTHESE_CLIENT,
  VMS,
  VOLUMES,
} from '@/lib/mock'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { Card, CardHeader, Callout, PageHeader } from '@/components/composition/card'
import { QuotaBar, StatTile } from '@/components/composition/metrics'
import { useApp } from '@/components/app/contexte'

/**
 * Accueil de l'univers Infrastructure.
 *
 * C'est la seule section sans le sélecteur d'Espace du panneau de gauche, et
 * c'est volontaire : elle regarde tout le parc à la fois, et sert précisément à
 * choisir dans quel Espace on va travailler ensuite. Toutes les autres sections
 * partent de ce choix.
 */
export default function AccueilInfrastructure() {
  const { espaceId, setEspaceId, autorise, refus } = useApp()
  const router = useRouter()
  const espaces = ESPACES.filter((e) => e.orgId === ORG_COURANTE.id)
  const s = SYNTHESE_CLIENT

  const ouvrir = (id: string) => {
    setEspaceId(id)
    router.push(`/app/espaces/${id}`)
  }

  // Ce qui demande une décision, rassemblé une fois : un quota qu'on va buter,
  // une machine qu'aucun plan ne sauvegarde, un plan de reprise jamais joué.
  const aSurveiller = [
    ...espaces
      .map((e) => ({
        e,
        ratio: Math.max(
          e.usage.vcpu / e.quota.vcpu,
          e.usage.ramGo / e.quota.ramGo,
          e.usage.stockageTo / e.quota.stockageTo,
        ),
      }))
      .filter(({ ratio }) => ratio >= 0.85)
      .map(({ e, ratio }) => ({
        quoi: `${e.code} — quota à ${pct(ratio * 100)}`,
        detail:
          'À ce niveau, une création de machine peut être refusée. L’extension s’applique à chaud.',
        href: `/app/espaces/${e.id}`,
      })),
    ...VMS.filter((v) => !v.backupPlanId).map((v) => ({
      quoi: `${v.nom} — aucun plan de sauvegarde`,
      detail: 'La machine tourne, mais rien n’en garde de copie restaurable.',
      href: `/app/vms/${v.id}`,
    })),
    ...DR_PLANS.filter((p) => p.exercices.length === 0).map((p) => ({
      quoi: `${p.nom} — jamais testé`,
      detail: 'Un plan de reprise qu’on n’a jamais joué est une intention, pas une garantie.',
      href: `/app/pra/${p.id}`,
    })),
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Infrastructure' }]}
        titre="Infrastructure"
        sousTitre="Le parc entier, tous Espaces Cloud confondus. Les autres sections travaillent, elles, dans un seul Espace : celui que vous choisissez dans le panneau de gauche. C’est ici qu’on décide lequel."
        actions={
          <GatedAction autorise={autorise('espace.create')} message={refus('espace.create')}>
            <ButtonLink href="/app/espaces/new" iconBefore={<Plus size={14} />}>
              Créer un Espace Cloud
            </ButtonLink>
          </GatedAction>
        }
      />

      {aSurveiller.length > 0 && (
        <Callout
          ton="warn"
          titre={`${aSurveiller.length} point${aSurveiller.length > 1 ? 's' : ''} à surveiller`}
        >
          <ul className="mt-1 space-y-1.5">
            {aSurveiller.map((a) => (
              <li key={a.quoi} className="flex items-start gap-2">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-warn" />
                <span>
                  <Link href={a.href} className="font-semibold underline">
                    {a.quoi}
                  </Link>{' '}
                  — {a.detail}
                </span>
              </li>
            ))}
          </ul>
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          libelle="Espaces Cloud"
          valeur={espaces.length}
          detail={`${new Set(espaces.map((e) => e.site)).size} site(s) physique(s)`}
        />
        <StatTile
          libelle="Machines virtuelles"
          valeur={VMS.length}
          detail={`${VMS.filter((v) => v.statut === 'running').length} en marche`}
        />
        <StatTile
          libelle="Clusters Kubernetes"
          valeur={K8S_CLUSTERS.length}
          detail={`${LOAD_BALANCERS.length} répartiteur(s) de charge`}
        />
        <StatTile
          libelle="Stockage consommé"
          valeur={`${s.usage.stockageTo}/${s.quota.stockageTo}`}
          unite="To"
          ton="warn"
          detail="Premier facteur limitant"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {espaces.map((e) => {
          const machines = VMS.filter((v) => v.espaceId === e.id)
          const clusters = K8S_CLUSTERS.filter((c) => c.espaceId === e.id)
          const repartiteurs = LOAD_BALANCERS.filter((l) => l.espaceId === e.id)
          const volumes = VOLUMES.filter((v) => v.espaceId === e.id)
          const bases = BASES_MANAGEES.filter((b) => b.espaceId === e.id)
          const courant = e.id === espaceId

          return (
            <Card key={e.id}>
              <CardHeader
                titre={e.code}
                sousTitre={`${e.offreNom} · ${SITE_COURT[e.site]} · ${e.cidr}`}
                actions={
                  courant ? (
                    <Badge tone="violet" size="sm">
                      Espace courant
                    </Badge>
                  ) : undefined
                }
              />

              <div className="mt-3 space-y-2">
                <QuotaBar libelle="vCPU" utilise={e.usage.vcpu} total={e.quota.vcpu} compact />
                <QuotaBar
                  libelle="Mémoire"
                  utilise={e.usage.ramGo}
                  total={e.quota.ramGo}
                  unite="Go"
                  formateur={(v) => num(v)}
                  compact
                />
                <QuotaBar
                  libelle="Stockage"
                  utilise={e.usage.stockageTo}
                  total={e.quota.stockageTo}
                  formateur={toHumain}
                  compact
                />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-g-100 pt-3 text-[12px]">
                {[
                  ['Machines', machines.length],
                  ['Clusters', clusters.length],
                  ['Répartiteurs', repartiteurs.length],
                  ['Volumes', volumes.length],
                  ['Bases managées', bases.length],
                  ['Projets', e.projets],
                ].map(([libelle, valeur]) => (
                  <div key={libelle} className="flex items-baseline justify-between gap-2">
                    <dt className="text-g-500">{libelle}</dt>
                    <dd className="tnum font-semibold text-ink">{valeur}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-3">
                <Button
                  variant={courant ? 'secondary' : 'primary'}
                  onClick={() => ouvrir(e.id)}
                  iconAfter={<ArrowRight size={14} />}
                  fullWidth
                >
                  {courant ? 'Ouvrir la fiche' : 'Travailler dans cet Espace'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            titre="Protection des données"
            sousTitre="Ce que la section Sauvegardes & PRA détaille plan par plan."
          />
          <dl className="mt-3 space-y-1.5 text-[12.5px]">
            {[
              ['Machines sans plan de sauvegarde', VMS.filter((v) => !v.backupPlanId).length],
              ['Plans de reprise', DR_PLANS.length],
              ['Plans jamais testés', DR_PLANS.filter((p) => p.exercices.length === 0).length],
              ['Compartiments S3 verrouillés (WORM)', BUCKETS.filter((b) => b.objectLock?.actif).length],
            ].map(([libelle, valeur]) => (
              <div key={libelle} className="flex items-baseline justify-between gap-2">
                <dt className="text-g-500">{libelle}</dt>
                <dd className="tnum font-semibold text-ink">{valeur}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/app/sauvegarde"
            className="mt-3 inline-block text-[12.5px] font-semibold text-p-700 hover:text-m-600"
          >
            Sauvegardes &amp; PRA →
          </Link>
        </Card>

        <Callout ton="violet" titre="Pourquoi un Espace se choisit à gauche">
          Une machine, un cluster, un répartiteur, un volume appartiennent à un Espace Cloud : son
          quota, sa plage réseau, son site. Le choix vaut pour toutes les sections à la fois, plutôt
          que d’être reposé à chaque écran. Cet accueil est la seule vue qui les traverse tous.
        </Callout>
      </div>
    </div>
  )
}
