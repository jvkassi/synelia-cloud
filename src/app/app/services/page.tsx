import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, Plus } from 'lucide-react'
import { money, pct } from '@/lib/format'
import {
  SERVICES_MANAGES,
  SYNTHESE_CLIENT,
  serviceCatalogue,
} from '@/lib/mock'
import { ButtonLink } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader, Card, CardHeader, Callout } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { ServiceCard } from '@/components/business/service-card'

export const metadata: Metadata = {
  title: 'Mes services',
  description:
    'Vos services managés : état, version, sièges, sauvegarde et disponibilité. Ouvrir en SSO ou administrer dans le portail.',
}

export default function MesServices() {
  const services = SERVICES_MANAGES
  const coutTotal = services.reduce((a, s) => a + s.coutMensuel, 0)
  const aJour = services.filter((s) => s.statut === 'maj_disponible').length
  const degrades = services.filter((s) => s.statut === 'degrade' || s.statut === 'erreur').length

  if (services.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader titre="Mes services" />
        <EmptyState
          titre="Aucun service managé"
          phrase="Un service managé est une solution open source que Synelia provisionne, dimensionne, sauvegarde et supervise pour vous. Vous l’utilisez dans son interface d’origine, via une redirection SSO."
          action={{ libelle: 'Parcourir le marketplace', href: '/app/marketplace' }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Mes services' }]}
        titre="Mes services"
        sousTitre="Chaque carte porte deux boutons volontairement très différents. « Ouvrir » vous fait quitter le portail vers l’interface d’origine de la solution ; « Administrer » ouvre son écran de gestion ici."
        actions={
          <ButtonLink href="/app/marketplace" iconBefore={<Plus size={14} />}>
            Souscrire un service
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile libelle="Services souscrits" valeur={services.length} />
        <StatTile
          libelle="Sièges utilisés"
          valeur={`${SYNTHESE_CLIENT.siegesUtilises}/${SYNTHESE_CLIENT.siegesSouscrits}`}
          detail={pct(
            Math.round((SYNTHESE_CLIENT.siegesUtilises / SYNTHESE_CLIENT.siegesSouscrits) * 100),
          )}
          ton="ok"
        />
        <StatTile
          libelle="Mises à jour disponibles"
          valeur={aJour}
          ton="accent"
          detail={aJour > 0 ? 'Grommunio 2026.02.1' : 'Parc à jour'}
        />
        <StatTile
          libelle="Services dégradés"
          valeur={degrades}
          ton={degrades > 0 ? 'warn' : 'ok'}
          detail={degrades > 0 ? 'Coffre de mots de passe' : 'Tout est opérationnel'}
        />
        <StatTile
          libelle="Coût mensuel"
          valeur={money(coutTotal).replace(' FCFA', '')}
          unite="FCFA"
          detail="Hors taxes · TVA 18 % à la facturation"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.id} service={s} catalogue={serviceCatalogue(s.catalogSlug)} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Callout
          ton="violet"
          titre="Pourquoi « Ouvrir » est magenta"
          action={<ExternalLink size={14} className="text-m-600" />}
        >
          Le magenta et l’icône de lien externe signalent sans ambiguïté que vous quittez le portail.
          C’est le seul endroit de l’espace client où cette couleur est employée pour une action —
          cette parcimonie est ce qui rend le bouton immédiatement identifiable.
        </Callout>

        <Card>
          <CardHeader
            titre="Point d’entrée quotidien"
            sousTitre="Pour les membres qui n’ont pas besoin du tableau de bord d’infrastructure."
          />
          <p className="text-[12.5px] leading-relaxed text-g-700">
            Un comptable qui dispose d’un siège Drive et d’un siège messagerie n’a rien à faire sur
            un écran de capacité vCPU. Le lanceur d’applications ne montre que les services pour
            lesquels l’utilisateur a effectivement un siège, et peut être défini comme page d’accueil
            par défaut pour les rôles utilisateur.
          </p>
          <Link
            href="/app/lanceur"
            className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-p-700 hover:text-m-600"
          >
            Ouvrir le lanceur d’applications →
          </Link>
        </Card>
      </div>

      <Card>
        <CardHeader
          titre="Récapitulatif du parc"
          sousTitre="Vue tabulaire de vos instances, pour un contrôle rapide."
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse">
            <thead>
              <tr className="border-b border-g-300 bg-g-050">
                {[
                  'Service',
                  'Solution',
                  'Mode & site',
                  'Version',
                  'Sièges',
                  'Dispo. 30 j',
                  'Coût',
                ].map((h) => (
                  <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((s) => {
                const cat = serviceCatalogue(s.catalogSlug)
                return (
                  <tr key={s.id} className="border-b border-g-100 last:border-0 hover:bg-p-050/60">
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/app/services/${s.id}`}
                        className="text-[13px] font-medium text-ink hover:text-p-700"
                      >
                        {s.nom}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-[12.5px] text-g-700">{cat?.solutionOSS}</td>
                    <td className="px-3 py-2.5 text-[12.5px] text-g-700">
                      {s.mode === 'dedie' ? 'Dédié' : 'Mutualisé'} · {s.site}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[12px] text-ink">{s.version}</span>
                      {s.versionDisponible && (
                        <Badge tone="accent" size="sm" className="ml-1.5">
                          → {s.versionDisponible}
                        </Badge>
                      )}
                    </td>
                    <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">
                      {s.siegesUtilises}/{s.siegesSouscrits}
                    </td>
                    <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">
                      {s.uptime30j > 0 ? pct(s.uptime30j, 2) : '—'}
                    </td>
                    <td className="tnum px-3 py-2.5 text-[12.5px] font-semibold text-ink">
                      {money(s.coutMensuel)}
                    </td>
                  </tr>
                )
              })}
              <tr className="border-t border-g-300 bg-g-050">
                <td colSpan={6} className="px-3 py-2.5 text-[12.5px] font-semibold text-g-700">
                  Total mensuel hors taxes
                </td>
                <td className="tnum px-3 py-2.5 text-[13px] font-bold text-p-700">
                  {money(coutTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
