'use client'

import Link from 'next/link'
import { PROJETS } from '@/lib/mock'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, Callout, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'

export default function VariablesTousProjets() {
  const toutes = PROJETS.flatMap((p) => p.variables)
  const secrets = toutes.filter((v) => v.secret)
  const build = toutes.filter((v) => v.portee === 'build')

  // Une même clé définie dans plusieurs projets n'est pas une erreur, mais
  // savoir laquelle vaut où évite de chercher longtemps.
  const cles = new Map<string, string[]>()
  for (const p of PROJETS) {
    for (const v of p.variables) {
      cles.set(v.cle, [...(cles.get(v.cle) ?? []), p.nom])
    }
  }
  const partagees = [...cles.entries()].filter(([, projets]) => projets.length > 1)

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Applications', href: '/app/applications' },
          { label: 'Variables & secrets' },
        ]}
        titre="Variables & secrets"
        sousTitre="Les valeurs qu’un projet transmet à ses services. Choisissez un projet dans le panneau de gauche pour les lire, les révéler ou les modifier — aucune valeur secrète n’est affichée ici."
        meta={
          <>
            <Badge tone="neutral">{toutes.length} variables</Badge>
            <Badge tone="violet">{secrets.length} secrets</Badge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile libelle="Variables déclarées" valeur={toutes.length} detail="tous projets" />
        <StatTile
          libelle="Secrets"
          valeur={secrets.length}
          detail="dans le coffre de l’organisation"
          ton="info"
        />
        <StatTile
          libelle="Portée construction"
          valeur={build.length}
          detail="figées dans l’artefact"
        />
        <StatTile
          libelle="Clés partagées"
          valeur={partagees.length}
          detail="présentes dans plusieurs projets"
          ton={partagees.length > 0 ? 'warn' : 'neutral'}
        />
      </div>

      <Card>
        <CardHeader
          titre="Par projet"
          sousTitre="Le contenu ne s’ouvre que projet par projet : une liste globale des secrets serait une cible, pas un service."
        />
        <ul className="divide-y divide-g-100">
          {PROJETS.map((p) => {
            const s = p.variables.filter((v) => v.secret).length
            return (
              <li key={p.id} className="py-2.5 first:pt-0">
                <Link
                  href={`/app/applications/variables/${p.id}`}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold text-ink">{p.nom}</span>
                    <span className="block text-[11.5px] text-g-500">
                      {p.environnements.join(', ')}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <Badge tone="neutral" size="sm">
                      {p.variables.length} variable{p.variables.length > 1 ? 's' : ''}
                    </Badge>
                    {s > 0 && (
                      <Badge tone="violet" size="sm">
                        {s} secret{s > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </Card>

      {partagees.length > 0 && (
        <Card>
          <CardHeader
            titre="Clés portées par plusieurs projets"
            sousTitre="Même nom, valeurs indépendantes : rien n’est partagé entre projets, seule la convention de nommage l’est."
          />
          <ul className="divide-y divide-g-100">
            {partagees.map(([cle, projets]) => (
              <li key={cle} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-mono text-[12.5px] font-semibold text-ink">{cle}</span>
                <span className="text-[11.5px] text-g-500">{projets.join(' · ')}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Callout ton="violet" titre="Le portail ne relit jamais un secret pour vous">
        Une valeur secrète part dans le coffre chiffré et n’en ressort qu’au démarrage du
        conteneur. La révéler dans l’interface est possible, journalisé, et réservé aux rôles qui
        en ont le droit — l’événement porte l’auteur, l’heure et la clé concernée.
      </Callout>
    </div>
  )
}
