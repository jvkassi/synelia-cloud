import Link from 'next/link'
import { AlertTriangle, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateCourte, money } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader } from '@/components/composition/card'

/**
 * Ce qui expire, quand, et ce qu'on peut y faire.
 *
 * C'est l'information qu'un client ne voit jamais venir : une échéance sans
 * renouvellement automatique se rappelle à lui le jour où le service s'arrête.
 * On la met donc en colonne de droite sur la fiche de la ressource, et pas au
 * fond de la facturation.
 */
export function CarteAbonnement({
  offre,
  prixMensuel,
  debut,
  echeance,
  joursRestants,
  renouvellementAuto,
  frequence,
  className,
}: {
  offre: string
  prixMensuel?: number
  /** Début de la période en cours, pour calculer la part écoulée. */
  debut: string
  echeance: string
  joursRestants: number
  renouvellementAuto: boolean
  frequence: string
  className?: string
}) {
  const total = Math.max(1, joursRestants + ecoules(debut, echeance, joursRestants))
  const pctEcoule = Math.min(100, Math.max(0, Math.round(((total - joursRestants) / total) * 100)))

  // Une échéance proche n'est un risque que si rien ne la renouvelle.
  const urgent = joursRestants <= 30 && !renouvellementAuto
  const attention = joursRestants <= 90 && !renouvellementAuto

  return (
    <Card className={className}>
      <CardHeader
        titre={
          <span className="flex items-center gap-2">
            <CalendarClock size={15} className="text-p-700" />
            Abonnement
          </span>
        }
      />

      <div
        className={cn(
          'rounded-[8px] border p-3',
          urgent ? 'border-err/40' : attention ? 'border-warn/40' : 'border-g-300 bg-g-050',
        )}
      >
        <p className="flex items-baseline gap-1.5">
          <span
            className={cn(
              'tnum text-[26px] font-bold leading-none [font-family:var(--font-display)]',
              urgent ? 'text-err' : attention ? 'text-warn' : 'text-ink',
            )}
          >
            {joursRestants}
          </span>
          <span className="text-[13px] font-semibold text-g-700">
            jour{joursRestants > 1 ? 's' : ''} avant échéance
          </span>
        </p>

        <div
          className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-g-300"
          role="img"
          aria-label={`${pctEcoule} % de la période écoulée`}
        >
          <div
            className={cn(
              'h-full rounded-full',
              urgent ? 'bg-err' : attention ? 'bg-warn' : 'bg-p-600',
            )}
            style={{ width: `${pctEcoule}%` }}
          />
        </div>
        <p className="tnum mt-1.5 text-[12px] text-g-700">{pctEcoule} % de la période écoulée</p>

        {urgent && (
          <p className="mt-2 flex items-start gap-1.5 text-[12px] font-semibold leading-snug text-err">
            <AlertTriangle size={13} className="mt-px shrink-0" />
            Renouvellement automatique désactivé — le service s’arrêtera à l’échéance.
          </p>
        )}
      </div>

      <dl className="mt-3 space-y-2 text-[13px]">
        <Ligne cle="Offre" valeur={offre} />
        {prixMensuel !== undefined && (
          <Ligne cle="Tarif" valeur={`${money(prixMensuel)} / mois`} />
        )}
        <Ligne cle="Début de période" valeur={dateCourte(debut)} />
        <Ligne cle="Échéance" valeur={dateCourte(echeance)} />
        <Ligne cle="Fréquence" valeur={frequence} />
        <div className="flex items-start justify-between gap-3">
          <dt className="text-g-500">Renouvellement</dt>
          <dd>
            <Badge tone={renouvellementAuto ? 'ok' : 'warn'} size="sm">
              {renouvellementAuto ? 'Automatique' : 'Manuel'}
            </Badge>
          </dd>
        </div>
      </dl>

      <div className="mt-3 space-y-1.5 border-t border-g-100 pt-3">
        <Link
          href="/app/facturation"
          className="block text-[12px] font-semibold text-p-700 hover:underline"
        >
          Gérer le renouvellement →
        </Link>
        <Link
          href="/app/parametres"
          className="block text-[12px] font-semibold text-g-500 hover:text-err"
        >
          Résilier le service →
        </Link>
      </div>
    </Card>
  )
}

function Ligne({ cle, valeur }: { cle: string; valeur: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-g-500">{cle}</dt>
      <dd className="min-w-0 text-right font-semibold text-ink">{valeur}</dd>
    </div>
  )
}

/**
 * Jours déjà écoulés dans la période. On part de la durée réelle entre le début
 * et l'échéance plutôt que d'une année supposée : une offre mensuelle et une
 * offre triennale ne se lisent pas sur la même barre.
 */
function ecoules(debut: string, echeance: string, joursRestants: number): number {
  const jour = 86_400_000
  const duree = Math.round((new Date(echeance).getTime() - new Date(debut).getTime()) / jour)
  return Math.max(0, duree - joursRestants)
}
