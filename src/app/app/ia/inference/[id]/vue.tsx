'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { cn, seededSeries } from '@/lib/utils'
import { SITE_LABEL, type PointInference } from '@/lib/types'
import { dateCourte, money, num } from '@/lib/format'
import { GRILLE_GPU, MODELES_IA, POINTS_INFERENCE } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { GatedAction, Tabs } from '@/components/ui/display'
import { Slider, Switch } from '@/components/ui/field'
import { ConfirmDialog } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { CostPreview } from '@/components/composition/flow'
import { GaugeCircle, StatTile } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { GrilleSparkCharts } from '@/components/business/observabilite'
import { useApp, useEspace } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'dimensionnement', label: 'Dimensionnement' },
  { id: 'metriques', label: 'Métriques' },
  { id: 'nouveau', label: 'Réserver des GPU' },
]

const TON_STATUT = { en_ligne: 'ok', demarrage: 'info', en_veille: 'neutral', erreur: 'err' } as const
const LIBELLE_STATUT = {
  en_ligne: 'En ligne',
  demarrage: 'Démarrage',
  en_veille: 'En veille',
  erreur: 'Erreur',
} as const

type TypeGpu = 'L40S' | 'A100' | 'H100'

export function VuePoint({ pointId }: { pointId: string }) {
  const espace = useEspace()
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('dimensionnement')
  const [aSupprimer, setASupprimer] = useState<PointInference | null>(null)

  const points = POINTS_INFERENCE.filter((p) => p.espaceId === espace.id)
  const point = points.find((p) => p.id === pointId)
  const modele = point ? MODELES_IA.find((m) => m.id === point.modeleId) : undefined

  const peutDeployer = autorise('ia.endpoint.deploy')

  // Garde après les crochets : la vue dit ce qu'elle ne trouve pas.
  if (!point || !modele) {
    return (
      <EmptyState
        titre="Point de service introuvable"
        phrase="Ce point n’existe pas, ou il appartient à un autre Espace Cloud que celui sélectionné. Le panneau de gauche liste ceux que vous pouvez ouvrir."
        action={{ libelle: 'Voir les points de service', href: '/app/ia/inference' }}
      />
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'IA & Agents', href: '/app/ia' },
          { label: 'Inférence dédiée', href: '/app/ia/inference' },
          { label: point.nom },
        ]}
        titre={point.nom}
        sousTitre={`${modele.nom} servi sur ${point.gpu} ×${point.gpuParReplica} par réplica, à ${SITE_LABEL[point.site]}. Facturé à l’heure de GPU, pas au jeton.`}
      />

      <Tabs
        tabs={[
          { id: 'dimensionnement', label: 'Dimensionnement' },
          { id: 'metriques', label: 'Métriques' },
        ]}
        active={onglet}
        onChange={setOnglet}
      />

      {onglet === 'dimensionnement' && point && modele && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre={point.nom}
              sousTitre={`${modele.nom} servi sur ${point.gpu} ×${point.gpuParReplica} par réplica, à ${SITE_LABEL[point.site]}.`}
              actions={
                <GatedAction autorise={peutDeployer} message={refus('ia.endpoint.deploy')}>
                  <IconButton
                    label={`Supprimer le point de service ${point.nom}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => setASupprimer(point)}
                  >
                    <Trash2 size={13} />
                  </IconButton>
                </GatedAction>
              }
            />
            <KeyValueList
              colonnes={1}
              items={[
                { cle: 'Modèle servi', valeur: <span className="font-mono text-[12px]">{modele.slug}</span> },
                { cle: 'Matériel', valeur: `${point.gpu} — ${point.gpuParReplica} carte(s) par réplica` },
                { cle: 'Réplicas', valeur: `${point.replicas} en service, entre ${point.replicasMin} et ${point.replicasMax}` },
                { cle: 'Site', valeur: SITE_LABEL[point.site] },
                {
                  cle: 'Mise en veille',
                  valeur: point.veilleAutorisee
                    ? `Autorisée — ${point.demarrageAFroidS} s de démarrage à froid`
                    : 'Interdite — au moins un réplica reste chaud en permanence',
                },
                { cle: 'Créé le', valeur: dateCourte(point.creeLe) },
                { cle: 'Coût horaire actuel', valeur: point.statut === 'en_veille' ? 'Non facturé (en veille)' : money(point.coutHeure) },
              ]}
            />
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader
                titre="Mise à l’échelle"
                sousTitre="Un réplica se réserve entier : les GPU ne se partagent pas à la demi-carte."
              />
              <div className="space-y-4">
                <Slider
                  label="Réplicas minimum"
                  value={point.replicasMin}
                  onChange={() => undefined}
                  min={0}
                  max={8}
                  unite="réplica(s)"
                />
                <Slider
                  label="Réplicas maximum"
                  value={point.replicasMax}
                  onChange={() => undefined}
                  min={1}
                  max={12}
                  unite="réplica(s)"
                />
                <Switch
                  checked={point.veilleAutorisee}
                  label="Autoriser la mise en veille"
                  description={`À zéro réplica, plus rien n’est facturé, mais la première requête attend ${point.demarrageAFroidS} secondes le temps de charger les poids en mémoire vidéo. À éviter sur un chemin utilisateur.`}
                />
              </div>
              <Callout ton="info" className="mt-4" titre="Occupation observée">
                {point.utilisationGpuPct} % en moyenne sur sept jours.{' '}
                {point.utilisationGpuPct < 30
                  ? 'Un réplica de moins tiendrait la charge et économiserait un tiers de la facture.'
                  : point.utilisationGpuPct > 80
                    ? 'Au-delà de 80 %, la latence commence à se dégrader aux heures de pointe : prévoyez un réplica de plus.'
                    : 'La marge est correcte : assez de réserve pour absorber un pic, pas de carte payée pour rien.'}
              </Callout>
            </Card>

            <Card>
              <CardHeader titre="Occupation des cartes" />
              <div className="flex flex-wrap items-center justify-around gap-4">
                <GaugeCircle valeur={point.utilisationGpuPct} libelle="GPU" cible={80} />
                <GaugeCircle valeur={68} libelle="Mémoire vidéo" cible={90} />
              </div>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'metriques' && point && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              libelle="Latence du premier jeton"
              valeur={`${num(point.latenceP50Ms)} ms`}
              ton="ok"
              detail="Sans file d’attente partagée"
              serie={seededSeries(`${point.id}-lat`, 24, point.latenceP50Ms * 0.8, point.latenceP50Ms * 1.6)}
            />
            <StatTile
              libelle="Débit"
              valeur={point.debitJetonsSec > 0 ? `${num(point.debitJetonsSec)} jet/s` : '—'}
              detail="Tous flux confondus"
              serie={seededSeries(`${point.id}-deb`, 24, 40, Math.max(point.debitJetonsSec, 60))}
            />
            <StatTile
              libelle="Occupation GPU"
              valeur={`${point.utilisationGpuPct} %`}
              ton={point.utilisationGpuPct > 85 ? 'warn' : 'ok'}
              serie={seededSeries(`${point.id}-gpu`, 24, 10, 92)}
            />
            <StatTile
              libelle="Coût des 30 derniers jours"
              valeur={money(point.coutHeure * 24 * 30 * (point.statut === 'en_veille' ? 0.24 : 1))}
              detail={point.veilleAutorisee ? 'Veille déduite' : 'Réservation permanente'}
            />
          </div>
          <Card>
            <CardHeader
              titre="Vingt-quatre dernières heures"
              sousTitre="Mesures propres à ce point de service — la file mutualisée n’y entre pas."
            />
            <GrilleSparkCharts
              seed={`inf-${point.id}`}
              metriques={[
                { titre: 'Latence du premier jeton', unite: 'ms', min: point.latenceP50Ms * 0.7, max: point.latenceP50Ms * 2, seuil: point.latenceP50Ms * 1.8 },
                { titre: 'Occupation GPU', unite: '%', min: 8, max: 96, seuil: 85 },
                { titre: 'Mémoire vidéo utilisée', unite: '%', min: 52, max: 88 },
                { titre: 'Requêtes par minute', unite: 'req/min', min: 4, max: 96 },
              ]}
            />
          </Card>
          <Callout ton="violet" titre="Réservé ne veut pas dire illimité">
            Un point de service dédié plafonne au débit de ses cartes. Au-delà, les requêtes
            attendent — sur votre propre file, cette fois. La bascule vers la file mutualisée n’est
            pas automatique : elle se déclare comme un repli dans les règles de routage.
          </Callout>
        </div>
      )}


      <ConfirmDialog
        open={aSupprimer !== null}
        onClose={() => setASupprimer(null)}
        onConfirm={() => {
          pousser({
            ton: 'warn',
            titre: 'Point de service supprimé',
            detail: `${aSupprimer?.nom} — les GPU retournent au pool mutualisé.`,
          })
          setASupprimer(null)
        }}
        titre="Supprimer ce point de service"
        ressource={aSupprimer?.nom ?? ''}
        libelleAction="Supprimer"
        pertes={[
          'Les réplicas sont arrêtés et les GPU rendus au pool mutualisé sous cinq minutes',
          'Les règles de routage qui pointent vers ce point basculent sur leur repli, ou échouent si elles n’en ont pas',
          'La latence garantie disparaît : le trafic repart dans la file partagée',
          'La réservation est facturée jusqu’à l’heure entamée',
        ]}
      />
    </div>
  )
}
