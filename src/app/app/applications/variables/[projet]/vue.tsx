'use client'

import { useState } from 'react'
import { Eye, EyeOff, Plus } from 'lucide-react'
import { projetById } from '@/lib/mock'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { Card, CardHeader, Callout, KeyValueList } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { EnteteProjet } from '@/components/business/projets'
import { useApp } from '@/components/app/contexte'

export function VueVariables({ id }: { id: string }) {
  const projet = projetById(id)!
  const { autorise, refus } = useApp()
  const [reveles, setReveles] = useState<Record<string, boolean>>({})

  const secrets = projet.variables.filter((v) => v.secret)
  const build = projet.variables.filter((v) => v.portee === 'build')

  return (
    <div className="space-y-5">
      <EnteteProjet
        projet={projet}
        section="Variables & secrets"
        titre="Variables & secrets"
        sousTitre="Ce que les services de ce projet reçoivent au démarrage, ou pendant leur construction. Ni le portail ni l’image ne conservent une valeur secrète en clair."
        meta={
          <>
            <Badge tone="neutral">{projet.variables.length} variables</Badge>
            <Badge tone="violet">{secrets.length} secrets</Badge>
            <Badge tone="neutral">{projet.environnements.length} environnements</Badge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile libelle="Variables du projet" valeur={projet.variables.length} />
        <StatTile
          libelle="Secrets"
          valeur={secrets.length}
          detail="stockés dans le coffre"
          ton={secrets.length > 0 ? 'info' : 'neutral'}
        />
        <StatTile
          libelle="Portée construction"
          valeur={build.length}
          detail="figées dans l’artefact"
        />
        <StatTile
          libelle="Portée exécution"
          valeur={projet.variables.length - build.length}
          detail="relues à chaque démarrage"
        />
      </div>

      <Callout ton="violet" titre="Héritées par tous les services du projet">
        Une variable définie ici est injectée dans chaque service de l’environnement concerné. Un
        service peut la redéfinir pour lui seul ; la valeur du service gagne toujours.
      </Callout>

      <Card>
        <CardHeader
          titre="Variables et secrets du projet"
          sousTitre="Les valeurs secrètes ne sont jamais affichées par défaut, et leur révélation est journalisée."
          actions={
            <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
              <Button size="sm" iconBefore={<Plus size={13} />}>
                Ajouter une variable
              </Button>
            </GatedAction>
          }
        />
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-max border-collapse">
            <thead>
              <tr className="border-b border-g-300 bg-g-050">
                {['Clé', 'Valeur', 'Portée', 'Environnements', ''].map((h) => (
                  <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projet.variables.map((v, i) => (
                <tr key={`${v.cle}-${i}`} className="border-b border-g-100 last:border-0">
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[12.5px] font-semibold text-ink">{v.cle}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    {v.secret ? (
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[12px] text-g-700">
                          {reveles[`${v.cle}-${i}`] ? 'postgresql://app_metier:…' : '••••••••••••'}
                        </span>
                        <IconButton
                          label={
                            reveles[`${v.cle}-${i}`] ? 'Masquer la valeur' : 'Révéler la valeur'
                          }
                          size="sm"
                          onClick={() =>
                            setReveles((r) => ({ ...r, [`${v.cle}-${i}`]: !r[`${v.cle}-${i}`] }))
                          }
                        >
                          {reveles[`${v.cle}-${i}`] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </IconButton>
                      </span>
                    ) : (
                      <span className="font-mono text-[12px] text-g-700">{v.valeur}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={v.portee === 'build' ? 'info' : 'neutral'} size="sm">
                      {v.portee === 'build' ? 'Build' : 'Exécution'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex flex-wrap gap-1">
                      {v.environnements.map((e) => (
                        <Badge key={e} tone="neutral" size="sm">
                          {e}
                        </Badge>
                      ))}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-[11.5px] text-g-500">
                      {v.secret ? 'coffre de secrets' : 'clair'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader
          titre="Où vivent les secrets"
          sousTitre="Ce que le portail garantit, et ce qu’il ne fait pas."
        />
        <KeyValueList
          colonnes={2}
          items={[
            {
              cle: 'Stockage',
              valeur:
                'Chiffré au repos dans le coffre de l’organisation, jamais dans l’image construite.',
            },
            {
              cle: 'Injection',
              valeur:
                'Au démarrage du conteneur pour la portée exécution, au moment du build sinon.',
            },
            {
              cle: 'Révélation',
              valeur: 'Journalisée dans l’audit avec l’auteur, l’heure et la variable concernée.',
            },
            {
              cle: 'Rotation',
              valeur:
                'Changer une valeur exige un redéploiement pour prendre effet — le portail le propose.',
            },
          ]}
        />
      </Card>
    </div>
  )
}
