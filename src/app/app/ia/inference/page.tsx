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
import { Field, SegmentedControl, Slider, Switch } from '@/components/ui/field'
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

export default function InferenceDediee() {
  const espace = useEspace()
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('dimensionnement')
  const [gpuChoisi, setGpuChoisi] = useState<TypeGpu>('L40S')
  const [replicas, setReplicas] = useState(2)
  const [veille, setVeille] = useState(true)
  const [aSupprimer, setASupprimer] = useState<PointInference | null>(null)

  const points = POINTS_INFERENCE.filter((p) => p.espaceId === espace.id)
  const [selection, setSelection] = useState(points[0]?.id ?? '')
  const point = points.find((p) => p.id === selection) ?? points[0]
  const modele = point ? MODELES_IA.find((m) => m.id === point.modeleId) : undefined

  // Sans aucun point réservé, la seule chose à montrer est la grille de
  // réservation : les onglets de dimensionnement n'auraient rien à décrire.
  const ongletActif = points.length === 0 ? 'nouveau' : onglet
  const peutDeployer = autorise('ia.endpoint.deploy')
  const grille = GRILLE_GPU.find((g) => g.gpu === gpuChoisi)!
  const coutMensuel = grille.coutHeure * 24 * 30 * replicas
  const coutMensuelReel = veille ? Math.round(coutMensuel * 0.42) : coutMensuel

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'IA & Modèles', href: '/app/ia' },
          { label: 'Inférence dédiée' },
        ]}
        titre="Inférence dédiée"
        sousTitre="La passerelle mutualise des GPU entre tous les clients : c’est le meilleur rapport coût-usage tant que la file reste courte. Un point de service dédié réserve des cartes pour vous seul — latence stable, débit garanti, facturé à l’heure de GPU et non au jeton."
        actions={
          <GatedAction autorise={peutDeployer} message={refus('ia.endpoint.deploy')}>
            <Button iconBefore={<Plus size={14} />} onClick={() => setOnglet('nouveau')}>
              Réserver des GPU
            </Button>
          </GatedAction>
        }
      />

      {points.length === 0 ? (
        <EmptyState
          titre="Aucun GPU réservé sur cet espace"
          phrase="Tout votre trafic passe par la file mutualisée. C’est le bon choix tant que moins de 5 % des requêtes attendent en file et que la latence p95 reste sous la seconde — au-delà, réserver des cartes devient moins cher que de subir l’attente."
          actionSecondaire={{ libelle: 'Comparer les modèles disponibles', href: '/app/ia/modeles' }}
        />
      ) : (
        <>
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
              valeur={`${Math.round(points.reduce((a, p) => a + p.utilisationGpuPct, 0) / points.length)} %`}
              ton="ok"
              detail="Sous 30 %, une carte de moins suffirait"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {points.map((p) => {
              const m = MODELES_IA.find((x) => x.id === p.modeleId)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelection(p.id)}
                  className={cn(
                    'rounded-[10px] border-2 bg-white p-4 text-left transition-colors',
                    point?.id === p.id ? 'border-p-700' : 'border-g-300 hover:border-p-400',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-[12.5px] font-semibold text-ink">
                        {p.nom}
                      </span>
                      <span className="block truncate text-[11px] text-g-500">{m?.nom}</span>
                    </span>
                    <Badge tone={TON_STATUT[p.statut]} dot size="sm">
                      {LIBELLE_STATUT[p.statut]}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-g-100 pt-2.5">
                    <span className="block">
                      <MicroLabel>Matériel</MicroLabel>
                      <span className="tnum block text-[12.5px] font-semibold text-ink">
                        {p.gpu} ×{p.gpuParReplica * p.replicas}
                      </span>
                    </span>
                    <span className="block">
                      <MicroLabel>Coût horaire</MicroLabel>
                      <span className="tnum block text-[12.5px] font-semibold text-ink">
                        {money(p.coutHeure)}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Badge tone="neutral" size="sm">
                      {SITE_LABEL[p.site]}
                    </Badge>
                    <Badge tone="neutral" size="sm">
                      {p.replicas} réplica{p.replicas > 1 ? 's' : ''}
                    </Badge>
                    {p.veilleAutorisee && (
                      <Badge tone="violet" size="sm">
                        Veille autorisée
                      </Badge>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />
        </>
      )}

      {ongletActif === 'dimensionnement' && point && modele && (
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

      {ongletActif === 'metriques' && point && (
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

      {ongletActif === 'nouveau' && (
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
