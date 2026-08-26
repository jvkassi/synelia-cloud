'use client'

import { useState } from 'react'
import { money, num, pct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { GRILLE_GPU, MODELES_IA, POINTS_INFERENCE } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { Field, SegmentedControl, Slider, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, PageHeader } from '@/components/composition/card'
import { CostPreview } from '@/components/composition/flow'
import { StatTile } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { useApp, useEspace } from '@/components/app/contexte'

type TypeGpu = 'L40S' | 'A100' | 'H100'

export default function InferenceDediee() {
  const espace = useEspace()
  const { autorise, refus, pousser } = useApp()
  const [gpuChoisi, setGpuChoisi] = useState<TypeGpu>('L40S')
  const [replicas, setReplicas] = useState(2)
  const [veille, setVeille] = useState(true)

  const points = POINTS_INFERENCE.filter((p) => p.espaceId === espace.id)
  const peutDeployer = autorise('ia.endpoint.deploy')
  const grille = GRILLE_GPU.find((g) => g.gpu === gpuChoisi)!
  const coutMensuel = grille.coutHeure * 24 * 30 * replicas
  const coutMensuelReel = veille ? Math.round(coutMensuel * 0.42) : coutMensuel

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'IA & Agents', href: '/app/ia' },
          { label: 'Inférence dédiée' },
        ]}
        titre="Inférence dédiée"
        sousTitre="La passerelle mutualise des GPU entre tous les clients : c’est le meilleur rapport coût-usage tant que la file reste courte. Un point de service dédié réserve des cartes pour vous seul — latence stable, débit garanti, facturé à l’heure de GPU et non au jeton."
      />

      {points.length === 0 ? (
        <EmptyState
          titre="Aucun GPU réservé sur cet espace"
          phrase="Tout votre trafic passe par la file mutualisée. C’est le bon choix tant que moins de 5 % des requêtes attendent en file et que la latence p95 reste sous la seconde — au-delà, réserver des cartes devient moins cher que de subir l’attente."
          actionSecondaire={{ libelle: 'Comparer les modèles disponibles', href: '/app/ia/modeles' }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile libelle="Points de service" valeur={points.length} />
          <StatTile
            libelle="GPU réservés"
            valeur={points.reduce((a, p) => a + p.gpuParReplica * p.replicas, 0)}
            detail={points.map((p) => p.gpu).join(', ')}
          />
          <StatTile
            libelle="Coût horaire cumulé"
            valeur={money(points.reduce((a, p) => a + (p.statut === 'en_veille' ? 0 : p.coutHeure), 0))}
            detail="Les points en veille ne sont pas facturés"
          />
          <StatTile
            libelle="Occupation moyenne"
            valeur={pct(points.reduce((a, p) => a + p.utilisationGpuPct, 0) / points.length)}
            ton="ok"
            detail="Sous 30 %, une carte de moins suffirait"
          />
        </div>
      )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Réserver des GPU"
              sousTitre="Le modèle détermine la carte : un 70 milliards de paramètres ne tient pas dans 48 Go de mémoire vidéo."
            />
            <div className="space-y-4">
              <Field label="Modèle à servir" hint="Seuls les modèles à poids ouverts peuvent être déployés en dédié">
                <SegmentedControl
                  options={MODELES_IA.filter((m) => m.hebergement === 'souverain')
                    .slice(0, 3)
                    .map((m) => ({ value: m.slug, label: m.nom.split(' ')[0] }))}
                  value={MODELES_IA[0].slug}
                  onChange={() => undefined}
                  size="sm"
                />
              </Field>

              <div>
                <MicroLabel className="mb-2">Type de carte</MicroLabel>
                <div className="space-y-2">
                  {GRILLE_GPU.map((g) => (
                    <button
                      key={g.gpu}
                      type="button"
                      onClick={() => setGpuChoisi(g.gpu)}
                      className={cn(
                        'flex w-full flex-wrap items-center justify-between gap-3 rounded-[6px] border-2 px-3 py-2.5 text-left transition-colors',
                        gpuChoisi === g.gpu ? 'border-p-700 bg-p-050' : 'border-g-300 hover:border-p-400',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-semibold text-ink">
                          {g.gpu} · {g.vram}
                        </span>
                        <span className="block text-[11px] text-g-500">{g.convient}</span>
                      </span>
                      <span className="tnum shrink-0 text-[12.5px] font-semibold text-ink">
                        {money(g.coutHeure)}/h
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Slider
                label="Réplicas"
                value={replicas}
                onChange={setReplicas}
                min={1}
                max={8}
                unite="réplica(s)"
              />

              <Switch
                checked={veille}
                onChange={setVeille}
                label="Autoriser la mise en veille hors trafic"
                description="Estimé à 42 % du coût plein sur un profil de charge en heures ouvrées. Premier appel après une veille : une à trois minutes selon la taille du modèle."
              />
            </div>
          </Card>

          <div className="space-y-4">
            <CostPreview
              lignes={[
                {
                  libelle: `${grille.gpu} réservés`,
                  detail: `${replicas} réplica(s) × ${money(grille.coutHeure)} l’heure`,
                  montant: coutMensuelReel,
                  quantite: replicas,
                },
                {
                  libelle: 'Stockage des poids du modèle',
                  detail: 'Réplication sur les deux sites',
                  montant: 12_000,
                },
              ]}
            />
            <Callout ton="warn" titre="Comparez avant de réserver">
              À {money(coutMensuelReel)} par mois, la réservation ne se rentabilise qu’au-delà
              d’environ {num(Math.round(coutMensuelReel / 0.42))} millions de jetons mensuels au
              tarif mutualisé. En dessous, la file partagée coûte moins cher — même si elle fait
              parfois attendre.
            </Callout>
            <GatedAction autorise={peutDeployer} message={refus('ia.endpoint.deploy')}>
              <Button
                fullWidth
                onClick={() =>
                  pousser({
                    ton: 'info',
                    titre: 'Réservation lancée',
                    detail: `${replicas} réplica(s) ${grille.gpu} — mise en service dans une dizaine de minutes.`,
                  })
                }
              >
                Réserver et déployer
              </Button>
            </GatedAction>
          </div>
        </div>
    </div>
  )
}
