'use client'

import { money, num, pct } from '@/lib/format'
import { FLUX_ORCHESTRATION } from '@/lib/mock'
import { Callout, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { useEspace } from '@/components/app/contexte'

export default function Orchestration() {
  const espace = useEspace()
  const flux = FLUX_ORCHESTRATION.filter((f) => f.espaceId === espace.id)
  const publies = flux.filter((f) => f.statut === 'publie')
  const executions = flux.reduce((a, f) => a + f.executions7j, 0)
  const cout = flux.reduce((a, f) => a + f.coutParExecution * f.executions7j, 0)
  const succes =
    publies.reduce((a, f) => a + f.tauxSuccesPct, 0) / Math.max(publies.length, 1)

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'IA & Agents', href: '/app/ia' },
          { label: 'Orchestration' },
        ]}
        titre="Orchestration"
        sousTitre="Un agent seul traite une intention. Un flux en enchaîne plusieurs : il anonymise, classe, aiguille, boucle, reprend ce qui a échoué et s’arrête devant un humain quand l’enjeu le demande. Choisissez un flux dans le panneau pour ouvrir son studio."
      />

      {flux.length === 0 ? (
        <EmptyState
          titre="Aucun flux sur cet espace"
          phrase="Un flux coordonne plusieurs agents autour d’un parcours : classer, instruire, synthétiser, faire valider. Tant qu’il n’en existe pas, chaque agent travaille seul et rien ne se passe le relais."
          actionSecondaire={{ libelle: 'Voir les agents', href: '/app/ia/agents' }}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              libelle="Flux publiés"
              valeur={publies.length}
              detail={`${flux.length - publies.length} en brouillon`}
              ton="ok"
            />
            <StatTile libelle="Exécutions 7 jours" valeur={num(executions)} />
            <StatTile
              libelle="Taux de succès moyen"
              valeur={pct(succes, 1)}
              ton={succes > 90 ? 'ok' : 'warn'}
              detail="Flux publiés seulement"
            />
            <StatTile
              libelle="Coût sur 7 jours"
              valeur={money(cout)}
              detail="Toutes exécutions confondues"
            />
          </div>

          <EmptyState
            titre="Choisissez un flux"
            phrase="Le panneau de gauche liste les flux de cet Espace. Le studio les montre de haut en bas, avec sur chaque étape ce qu’elle dure, ce qu’elle coûte et ce qu’elle rate."
          />

          <Callout ton="violet" titre="Deux étapes figurent dans tous les flux">
            L’anonymisation, en coupure avant tout appel modèle, et le filtrage par habilitation,
            appliqué avant tout calcul de similarité. Elles sont posées par la plateforme : ni
            déplaçables, ni supprimables. Faire dépendre l’étanchéité d’un réglage reviendrait à ne
            pas l’avoir.
          </Callout>
        </>
      )}
    </div>
  )
}
