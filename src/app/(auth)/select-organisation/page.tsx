import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import { dateCourte } from '@/lib/format'
import { ROLE_LABEL } from '@/lib/types'
import { MES_ORGANISATIONS } from '@/lib/mock'
import { Avatar } from '@/components/ui/display'
import { Badge } from '@/components/ui/badge'
import { Callout } from '@/components/composition/card'

export const metadata: Metadata = { title: 'Choisir une organisation' }

export default function SelectionOrganisation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1">Choisir une organisation</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-g-500">
          Vous appartenez à {MES_ORGANISATIONS.length} organisations. Votre rôle et donc vos droits
          diffèrent selon celle que vous ouvrez.
        </p>
      </div>

      <div className="space-y-2.5">
        {MES_ORGANISATIONS.map(({ org, role }) => (
          <Link
            key={org.id}
            href="/app"
            className="group flex items-center gap-4 rounded-[10px] border border-g-300 bg-white p-4 transition-all hover:border-p-400 hover:shadow-[0_4px_16px_rgba(43,27,77,.1)]"
          >
            <Avatar nom={org.nom} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-ink group-hover:text-p-700">
                {org.nom}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Badge tone="violet" size="sm">
                  {ROLE_LABEL[role]}
                </Badge>
                <span className="text-[12px] text-g-500">{org.secteur ?? org.pays}</span>
                <span className="text-[12px] text-g-500">
                  {org.espaces ?? 0} Espace{(org.espaces ?? 0) > 1 ? 's' : ''} Cloud ·{' '}
                  {org.utilisateurs ?? 0} utilisateurs
                </span>
              </div>
              <p className="mt-1 text-[11px] text-g-500">
                Membre depuis {dateCourte(org.createdAt)}
                {org.domaine && ` · ${org.domaine}`}
              </p>
            </div>
            <ArrowRight
              size={16}
              className="shrink-0 text-g-300 transition-all group-hover:translate-x-0.5 group-hover:text-p-700"
            />
          </Link>
        ))}

        <Link
          href="/signup/organisation"
          className="group flex items-center gap-4 rounded-[10px] border border-dashed border-g-300 bg-g-050 p-4 transition-colors hover:border-p-400 hover:bg-p-050"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-p-700 ring-1 ring-g-300">
            <Plus size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-ink group-hover:text-p-700">
              Créer une nouvelle organisation
            </p>
            <p className="mt-0.5 text-[12px] text-g-500">
              Vous en deviendrez Org Admin, avec sa propre facturation et ses propres Espaces Cloud.
            </p>
          </div>
        </Link>
      </div>

      <Callout ton="info" titre="Basculer plus tard">
        Vous pourrez changer d’organisation à tout moment depuis le sélecteur de la barre supérieure,
        sans vous reconnecter. Votre rôle est recalculé à chaque bascule.
      </Callout>
    </div>
  )
}
