import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, KeyRound, LifeBuoy, Receipt } from 'lucide-react'
import { pct } from '@/lib/format'
import {
  UTILISATEUR_COURANT,
  serviceCatalogue,
  servicesAvecSiege,
  siegesDeLUtilisateur,
} from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/display'
import { Card, Callout, PageHeader } from '@/components/composition/card'
import { EmptyState } from '@/components/composition/states'
import { AppLauncherTile } from '@/components/business/service-card'

export const metadata: Metadata = {
  title: 'Lanceur d’applications',
  description:
    'Vos services managés accessibles en un clic, en SSO. Uniquement ceux pour lesquels vous disposez d’un siège.',
}

const RACCOURCIS = [
  {
    href: '/app/support',
    icone: <LifeBuoy size={16} />,
    titre: 'Mes tickets',
    detail: 'Suivre une demande, en ouvrir une nouvelle',
  },
  {
    href: '/app/securite',
    icone: <KeyRound size={16} />,
    titre: 'Mon mot de passe',
    detail: 'Géré dans votre fournisseur d’identité',
  },
  {
    href: '/app/facturation',
    icone: <Receipt size={16} />,
    titre: 'Ma consommation',
    detail: 'Dépense du mois et factures',
  },
]

export default function Lanceur() {
  const services = servicesAvecSiege(UTILISATEUR_COURANT.id)
  const sieges = siegesDeLUtilisateur(UTILISATEUR_COURANT.id)

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Lanceur d’applications' }]}
        titre="Vos applications"
        sousTitre="Un clic ouvre le service dans son interface d’origine, en SSO, dans un nouvel onglet. Vous ne voyez ici que les services pour lesquels un siège vous a été attribué."
        meta={
          <>
            <span className="flex items-center gap-2">
              <Avatar nom={UTILISATEUR_COURANT.nom} size="sm" />
              <span className="text-[12.5px] text-g-700">
                {UTILISATEUR_COURANT.nom} · {UTILISATEUR_COURANT.fonction}
              </span>
            </span>
            <Badge tone="violet">
              {sieges.length} siège{sieges.length > 1 ? 's' : ''} attribué
              {sieges.length > 1 ? 's' : ''}
            </Badge>
          </>
        }
      />

      {services.length === 0 ? (
        <EmptyState
          titre="Aucun siège ne vous a encore été attribué"
          phrase="Un siège vous donne accès à un service managé. Demandez à votre administrateur d’organisation de vous en attribuer, ou parcourez le catalogue pour découvrir ce qui est disponible."
          action={{ libelle: 'Parcourir le marketplace', href: '/app/marketplace' }}
          actionSecondaire={{ libelle: 'Contacter le support', href: '/app/support' }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((s) => (
            <AppLauncherTile
              key={s.id}
              service={s}
              catalogue={serviceCatalogue(s.catalogSlug)}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {RACCOURCIS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="group flex items-center gap-3 rounded-[10px] border border-g-300 bg-white p-4 transition-colors hover:border-p-400 hover:bg-p-050"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-p-100 text-p-700">
              {r.icone}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-ink group-hover:text-p-700">
                {r.titre}
              </span>
              <span className="block text-[11.5px] text-g-500">{r.detail}</span>
            </span>
          </Link>
        ))}
      </div>

      {sieges.length > 0 && (
        <Card>
          <MicroLabel className="mb-3">Vos sièges et votre consommation</MicroLabel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr className="border-b border-g-300 bg-g-050">
                  {['Service', 'Solution', 'Quota consommé', 'Dernière activité', ''].map((h) => (
                    <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sieges.map((st) => {
                  const svc = services.find((s) => s.id === st.managedServiceId)
                  if (!svc) return null
                  const cat = serviceCatalogue(svc.catalogSlug)
                  return (
                    <tr key={st.id} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5 text-[13px] font-medium text-ink">{svc.nom}</td>
                      <td className="px-3 py-2.5 text-[12.5px] text-g-700">{cat?.solutionOSS}</td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">
                        {st.quotaTotal
                          ? `${st.quotaUtilise} / ${st.quotaTotal} Go · ${pct(Math.round(((st.quotaUtilise ?? 0) / st.quotaTotal) * 100))}`
                          : 'Non applicable'}
                      </td>
                      <td className="px-3 py-2.5 text-[12.5px] text-g-700">
                        {st.derniereActivite ? st.derniereActivite.slice(0, 10) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <a
                          href={svc.urlNative}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-m-600 hover:underline"
                        >
                          Ouvrir
                          <ExternalLink size={11} />
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Callout ton="violet" titre="Cet écran peut être votre page d’accueil">
        Si votre rôle est uniquement utilisateur, le lanceur est plus utile que le tableau de bord
        d’infrastructure — un comptable qui dispose d’un siège Drive et d’un siège messagerie n’a
        rien à faire sur un écran de capacité vCPU. Votre administrateur peut définir le lanceur
        comme page d’accueil par défaut pour les rôles concernés, depuis les paramètres de
        l’organisation.
      </Callout>
    </div>
  )
}
