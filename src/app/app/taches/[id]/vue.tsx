'use client'

import Link from 'next/link'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { relatif } from '@/lib/format'
import type { ProvisioningJob } from '@/lib/types'
import { JOBS, JOBS_PLATEFORME, TACHES_PROVISIONING } from '@/lib/mock'
import { PageHeader, Card, CardHeader, Callout } from '@/components/composition/card'
import { ButtonLink } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/composition/states'
import { JobTracker } from '@/components/business/paas'
import { LIBELLE_STATUT_JOB, TON_STATUT_JOB } from '@/lib/workflows'
import { useAtelier, useCollection } from '@/components/app/atelier'
import { BoutonAction } from '@/components/app/actions'

/**
 * Les tâches nées pendant la session vivent dans l'atelier, pas dans le jeu
 * de données : la vue est donc cliente. Les jobs plateforme restent lisibles
 * ici, les liens de la maquette pointant vers les deux jeux.
 */
export function VueSuiviTache({ id }: { id: string }) {
  const jobs = useCollection<ProvisioningJob>('jobs', JOBS)
  const { reprendreJob } = useAtelier()
  const job = jobs.items.find((j) => j.id === id) ?? JOBS_PLATEFORME.find((j) => j.id === id)

  if (!job) {
    return (
      <div className="space-y-6">
        <PageHeader
          fil={[
            { label: 'Espace client', href: '/app' },
            { label: 'Centre de tâches', href: '/app/taches' },
            { label: 'Tâche introuvable' },
          ]}
          titre="Tâche introuvable"
        />
        <EmptyState
          titre="Cette tâche n’existe plus"
          phrase="Les tâches purgées disparaissent de la liste mais restent dans le journal d’audit, avec leur identifiant de corrélation."
          action={{ libelle: 'Retour au centre de tâches', href: '/app/taches' }}
        />
      </div>
    )
  }

  const autres = jobs.items.filter((j) => j.id !== job.id && j.orgId === job.orgId).slice(0, 4)

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Centre de tâches', href: '/app/taches' },
          { label: job.label },
        ]}
        titre="Suivi du provisioning"
        sousTitre="L’orchestrateur exécute les tâches séquentiellement. Vous pouvez quitter cette page à tout moment : le centre de tâches conserve le suivi et une notification signalera la fin."
        actions={
          <>
            {(job.statut === 'failed' || job.statut === 'rolled_back') && (
              <BoutonAction
                libelle="Reprendre à l’étape échouée"
                variant="primary"
                size="md"
                icone={<RotateCcw size={14} />}
                operation={{
                  titre: `Reprise de « ${job.label} »`,
                  detail:
                    'Le job repart de l’étape échouée. Les étapes déjà réussies ne sont pas rejouées.',
                  effet: () => reprendreJob(job.id),
                }}
              />
            )}
            <ButtonLink
              href="/app/taches"
              variant="secondary"
              iconBefore={<ArrowLeft size={14} />}
            >
              Centre de tâches
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <JobTracker job={job} />

          {job.statut === 'failed' && (
            <Callout ton="err" titre="Ce job a échoué et a été annulé proprement">
              La capacité réservée a été libérée automatiquement et aucune souscription facturable
              n’a été créée. Corrigez la cause indiquée ci-dessus puis relancez la souscription :
              vos choix de configuration sont conservés.
            </Callout>
          )}

          {job.statut === 'rolled_back' && (
            <Callout ton="warn" titre="Cette tâche a été annulée">
              Les étapes déjà exécutées ont été défaites dans l’ordre inverse. Aucune ressource ne
              reste réservée et rien n’a été facturé.
            </Callout>
          )}

          {job.statut === 'done' && (
            <Callout ton="ok" titre="Provisioning terminé">
              Le service est opérationnel. Le bouton{' '}
              <span className="font-semibold text-m-600">Ouvrir</span> de sa carte vous redirige
              désormais en SSO vers son interface d’origine.
            </Callout>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader
              titre="Les sept tâches de l’orchestrateur"
              sousTitre="Séquence appliquée à toute souscription du marketplace."
            />
            <ol className="space-y-1.5">
              {TACHES_PROVISIONING.map((t, i) => (
                <li key={t} className="flex items-start gap-2.5">
                  <span className="tnum mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-g-100 text-[9.5px] font-bold text-g-700">
                    {i + 1}
                  </span>
                  <span className="text-[12px] leading-snug text-g-700">{t}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 border-t border-g-100 pt-3 text-[11.5px] leading-relaxed text-g-500">
              États possibles : En file → En cours → Prêt. En cas d’échec, un diagnostic lisible est
              produit — jamais une trace brute — et un rollback automatique libère les ressources
              réservées.
            </p>
          </Card>

          {autres.length > 0 && (
            <Card>
              <CardHeader titre="Autres tâches récentes" />
              <ul className="space-y-2">
                {autres.map((j) => (
                  <li key={j.id}>
                    <Link
                      href={`/app/taches/${j.id}`}
                      className="group flex items-start justify-between gap-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] text-ink group-hover:text-p-700">
                          {j.label}
                        </span>
                        <span className="block text-[11px] text-g-500">{relatif(j.startedAt)}</span>
                      </span>
                      <Badge size="sm" tone={TON_STATUT_JOB[j.statut]} className="mt-0.5 shrink-0">
                        {LIBELLE_STATUT_JOB[j.statut]}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
