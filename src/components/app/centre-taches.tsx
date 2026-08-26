'use client'

import Link from 'next/link'
import { ListChecks, RotateCcw, X } from 'lucide-react'
import { relatif } from '@/lib/format'
import { JOBS, JOBS_PLATEFORME } from '@/lib/mock'
import type { ProvisioningJob } from '@/lib/types'
import { LIBELLE_STATUT, TON_STATUT, porteeDuJob, progression } from '@/lib/workflows'
import { cn } from '@/lib/utils'
import { Button, ButtonLink } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, PageHeader, Section } from '@/components/composition/card'
import { EmptyState } from '@/components/composition/states'
import { StatTile } from '@/components/composition/metrics'
import { JobTracker } from '@/components/business/paas'
import { useApp } from './contexte'

/**
 * Centre de tâches — les deux espaces.
 *
 * Deux populations cohabitent ici, et la distinction est honnête plutôt que
 * masquée : en haut les tâches lancées pendant la session, qui avancent
 * réellement à l'écran ; en dessous les jobs du jeu de démonstration, figés.
 */
export function VueCentreTaches({ portee }: { portee: 'client' | 'fournisseur' }) {
  const { jobs, taches, relancer, oublier } = useApp()
  const fournisseur = portee === 'fournisseur'
  const figes = fournisseur ? JOBS_PLATEFORME : JOBS

  const miennes = jobs.filter((j) => porteeDuJob(j) === portee)
  const tous = [...miennes, ...figes]
  const compte = (s: ProvisioningJob['statut'][]) => tous.filter((j) => s.includes(j.statut)).length

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[
          { label: fournisseur ? 'Espace fournisseur' : 'Espace client', href: fournisseur ? '/admin' : '/app' },
          { label: 'Centre de tâches' },
        ]}
        titre="Centre de tâches"
        sousTitre="Toute action qui prend plus de quelques secondes devient un job traçable : la file, les étapes, la durée de chacune, et en cas d’échec un diagnostic lisible avec une reprise qui conserve vos choix."
        actions={
          <ButtonLink href={fournisseur ? '/admin/sante' : '/app'} variant="secondary">
            {fournisseur ? 'Santé du parc' : 'Tableau de bord'}
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile libelle="En file" valeur={compte(['queued'])} ton="info" />
        <StatTile libelle="En cours" valeur={compte(['running'])} ton="violet" />
        <StatTile libelle="Terminées" valeur={compte(['done'])} ton="ok" />
        <StatTile
          libelle="En échec"
          valeur={compte(['failed', 'rolled_back'])}
          ton={compte(['failed', 'rolled_back']) > 0 ? 'err' : 'neutral'}
        />
      </div>

      <Section
        titre="Mes tâches de cette session"
        sousTitre="Elles avancent en direct. Rien n’est conservé après un rechargement de page : la maquette ne persiste rien."
      >
        {miennes.length === 0 ? (
          <EmptyState
            icone={<ListChecks size={24} />}
            titre="Aucune tâche lancée pour l’instant"
            phrase="Créez un Espace Cloud, une machine, un projet applicatif ou lancez une restauration : l’opération apparaîtra ici, étape par étape, et vous pourrez quitter la page sans perdre le suivi."
            action={
              fournisseur
                ? { libelle: 'Voir la santé du parc', href: '/admin/sante' }
                : { libelle: 'Créer une machine', href: '/app/vms/new' }
            }
            actionSecondaire={
              fournisseur
                ? { libelle: 'Migration inter-backend', href: '/admin/migration' }
                : { libelle: 'Créer un Espace Cloud', href: '/app/espaces/new' }
            }
          />
        ) : (
          <div className="space-y-4">
            {miennes.map((job) => {
              const tache = taches.find((t) => t.id === job.id)
              const fini = job.statut === 'done'
              const rate = job.statut === 'failed' || job.statut === 'rolled_back'
              return (
                <div key={job.id} className="space-y-2">
                  <JobTracker job={job} />
                  {(fini || rate) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {rate && (
                        <Button
                          variant="secondary"
                          size="sm"
                          iconBefore={<RotateCcw size={13} />}
                          onClick={() => relancer(job.id)}
                        >
                          Reprendre à l’étape échouée
                        </Button>
                      )}
                      {tache?.href && (
                        <ButtonLink href={tache.href} variant="ghost" size="sm">
                          Voir la ressource
                        </ButtonLink>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        iconBefore={<X size={13} />}
                        onClick={() => oublier(job.id)}
                      >
                        Retirer de la liste
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <Section
        titre={fournisseur ? 'Jobs de la plateforme' : 'Jobs de mon organisation'}
        sousTitre="Jeu de démonstration : ces jobs illustrent les états possibles — file, exécution, réussite, échec avec rollback."
      >
        <div className="space-y-4">
          {figes
            .filter((j) => j.statut === 'running' || j.statut === 'failed')
            .map((j) => (
              <div key={j.id} className="space-y-2">
                <JobTracker job={j} />
                {!fournisseur && (
                  <ButtonLink href={`/app/taches/${j.id}`} variant="ghost" size="sm">
                    Ouvrir le suivi détaillé
                  </ButtonLink>
                )}
              </div>
            ))}

          <Card>
            <CardHeader titre="Autres jobs" sousTitre="Terminés ou en file d’attente." />
            <ul className="divide-y divide-g-100">
              {figes
                .filter((j) => j.statut !== 'running' && j.statut !== 'failed')
                .map((j) => (
                  <li key={j.id} className="py-2.5 first:pt-0 last:pb-0">
                    <LigneJob job={j} href={fournisseur ? undefined : `/app/taches/${j.id}`} />
                  </li>
                ))}
            </ul>
          </Card>
        </div>
      </Section>
    </div>
  )
}

function LigneJob({ job, href }: { job: ProvisioningJob; href?: string }) {
  const corps = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-ink">{job.label}</span>
          <span className="block text-[11.5px] text-g-500">
            Démarré {relatif(job.startedAt)}
          </span>
        </span>
        <Badge size="sm" tone={TON_STATUT[job.statut]} className="mt-0.5 shrink-0">
          {LIBELLE_STATUT[job.statut]}
        </Badge>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-g-100">
          <span
            className={cn(
              'block h-full rounded-full',
              job.statut === 'failed' ? 'bg-err' : 'bg-p-600',
            )}
            style={{ width: `${Math.round(progression(job) * 100)}%` }}
          />
        </span>
        <span className="tnum shrink-0 text-[10.5px] text-g-500">
          {job.taches.filter((t) => t.statut === 'ok').length}/{job.taches.length}
        </span>
      </div>
    </>
  )

  if (!href) return <div>{corps}</div>
  return (
    <Link href={href} className="block rounded-[6px] transition-colors hover:bg-p-050">
      {corps}
    </Link>
  )
}
