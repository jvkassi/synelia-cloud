'use client'

import { useState } from 'react'
import { Globe2, MapPin } from 'lucide-react'
import { cn, seededSeries } from '@/lib/utils'
import { dateCourte, jetons, money, num } from '@/lib/format'
import { FAMILLE_MODELE_LABEL, type FamilleModele, type ModeleIA } from '@/lib/types'
import { MODELES_IA, PASSERELLE_IA } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { CodeBlock, Tabs } from '@/components/ui/display'
import { SegmentedControl } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { GrilleSparkCharts } from '@/components/business/observabilite'

const ONGLETS = [
  { id: 'fiche', label: 'Fiche' },
  { id: 'tarifs', label: 'Tarif' },
  { id: 'performance', label: 'Performance' },
  { id: 'appel', label: 'Comment l’appeler' },
]

type Filtre = 'tous' | 'souverain' | 'externe'

const FILTRES: Array<{ value: Filtre; label: string }> = [
  { value: 'tous', label: 'Tous' },
  { value: 'souverain', label: 'Souverains' },
  { value: 'externe', label: 'Externes' },
]

/** Requête de référence pour comparer les tarifs : 2 000 jetons entrent, 400 sortent. */
const REFERENCE = { entree: 2_000, sortie: 400, requetes: 1_000 }

function coutReference(m: ModeleIA): number {
  if (m.unite === 'minute') return Math.round(m.prixEntree * 60)
  const entree = (REFERENCE.entree * REFERENCE.requetes * m.prixEntree) / 1_000_000
  const sortie = (REFERENCE.sortie * REFERENCE.requetes * m.prixSortie) / 1_000_000
  return Math.round(entree + sortie)
}

const TON_STATUT = {
  disponible: 'ok',
  apercu: 'info',
  degrade: 'warn',
  retire: 'neutral',
} as const

const LIBELLE_STATUT = {
  disponible: 'Disponible',
  apercu: 'Aperçu',
  degrade: 'Dégradé',
  retire: 'Retiré',
} as const

export default function CatalogueModeles() {
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [famille, setFamille] = useState<FamilleModele | 'toutes'>('toutes')
  const [selection, setSelection] = useState(MODELES_IA[0].id)
  const [onglet, setOnglet] = useState('fiche')

  const visibles = MODELES_IA.filter(
    (m) =>
      (filtre === 'tous' || m.hebergement === filtre) &&
      (famille === 'toutes' || m.famille === famille),
  )
  const modele = MODELES_IA.find((m) => m.id === selection)
  const familles = Array.from(new Set(MODELES_IA.map((m) => m.famille)))

  const souverains = MODELES_IA.filter((m) => m.hebergement === 'souverain')
  const moinsCher = [...MODELES_IA]
    .filter((m) => m.famille === 'texte')
    .sort((a, b) => coutReference(a) - coutReference(b))[0]

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'IA & Agents', href: '/app/ia' },
          { label: 'Catalogue de modèles' },
        ]}
        titre="Catalogue de modèles"
        sousTitre="Un modèle se choisit sur quatre critères : où le calcul a lieu, ce qu’il coûte au million de jetons, la latence du premier jeton, et ce qu’il sait faire. Le reste est de la littérature d’éditeur."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile libelle="Modèles au catalogue" valeur={MODELES_IA.length} />
        <StatTile
          libelle="Servis depuis nos datacenters"
          valeur={souverains.length}
          ton="ok"
          detail="Abidjan et Grand-Bassam"
        />
        <StatTile
          libelle="Le moins cher en génération"
          valeur={moinsCher?.nom ?? '—'}
          detail={`${money(coutReference(moinsCher))} pour 1 000 requêtes de référence`}
        />
        <StatTile
          libelle="Latence médiane de la passerelle"
          valeur={`${num(PASSERELLE_IA.latenceP50Ms)} ms`}
          detail={`p95 ${num(PASSERELLE_IA.latenceP95Ms)} ms`}
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl options={FILTRES} value={filtre} onChange={setFiltre} size="sm" />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFamille('toutes')}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors',
                famille === 'toutes'
                  ? 'border-p-700 bg-p-050 text-p-700'
                  : 'border-g-300 text-g-500 hover:text-g-700',
              )}
            >
              Toutes familles
            </button>
            {familles.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFamille(f)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors',
                  famille === f
                    ? 'border-p-700 bg-p-050 text-p-700'
                    : 'border-g-300 text-g-500 hover:text-g-700',
                )}
              >
                {FAMILLE_MODELE_LABEL[f]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {visibles.length === 0 ? (
        <EmptyState
          titre="Aucun modèle ne correspond à ce filtre"
          phrase="Toutes les familles ne sont pas disponibles dans les deux modes d’hébergement : la transcription et le reclassement ne sont servis que sur nos GPU."
          action={{ libelle: 'Retirer les filtres', onClick: () => { setFiltre('tous'); setFamille('toutes') } }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelection(m.id)}
              className={cn(
                'rounded-[10px] border-2 bg-white p-4 text-left transition-colors',
                selection === m.id ? 'border-p-700' : 'border-g-300 hover:border-p-400',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-bold text-ink">{m.nom}</span>
                  <span className="block truncate text-[11px] text-g-500">{m.editeur}</span>
                </span>
                <Badge tone={TON_STATUT[m.statut]} size="sm" dot={m.statut !== 'disponible'}>
                  {LIBELLE_STATUT[m.statut]}
                </Badge>
              </div>

              <span className="mt-3 flex items-center gap-1.5 text-[11.5px]">
                {m.hebergement === 'souverain' ? (
                  <>
                    <MapPin size={12} className="shrink-0 text-ok" />
                    <span className="truncate text-ok">{m.residence}</span>
                  </>
                ) : (
                  <>
                    <Globe2 size={12} className="shrink-0 text-warn" />
                    <span className="truncate text-warn">{m.residence}</span>
                  </>
                )}
              </span>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-g-100 pt-2.5">
                <span className="block">
                  <MicroLabel>Entrée / M jetons</MicroLabel>
                  <span className="tnum block text-[12.5px] font-semibold text-ink">
                    {m.unite === 'minute' ? `${money(m.prixEntree)}/min` : money(m.prixEntree)}
                  </span>
                </span>
                <span className="block">
                  <MicroLabel>Latence p50</MicroLabel>
                  <span className="tnum block text-[12.5px] font-semibold text-ink">
                    {num(m.latenceP50Ms)} ms
                  </span>
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Badge tone="neutral" size="sm">
                  {FAMILLE_MODELE_LABEL[m.famille]}
                </Badge>
                {m.contexteJetons > 0 && (
                  <Badge tone="neutral" size="sm">
                    {jetons(m.contexteJetons)} de contexte
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {modele && (
        <>
          <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

          {onglet === 'fiche' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader titre={modele.nom} sousTitre={modele.description} />
                <KeyValueList
                  colonnes={1}
                  items={[
                    { cle: 'Identifiant d’appel', valeur: <span className="font-mono text-[12px]">{modele.slug}</span> },
                    { cle: 'Éditeur', valeur: modele.editeur },
                    { cle: 'Famille', valeur: FAMILLE_MODELE_LABEL[modele.famille] },
                    { cle: 'Taille', valeur: modele.parametres ?? '—' },
                    { cle: 'Licence', valeur: modele.licence },
                    {
                      cle: 'Fenêtre de contexte',
                      valeur: modele.contexteJetons > 0 ? `${num(modele.contexteJetons)} jetons` : 'Sans objet',
                    },
                    { cle: 'Résidence du calcul', valeur: modele.residence },
                  ]}
                />
              </Card>
              <div className="space-y-4">
                <Card>
                  <CardHeader titre="Ce à quoi il sert" />
                  <ul className="space-y-1.5">
                    {modele.usages.map((u) => (
                      <li key={u} className="flex items-start gap-2 text-[12.5px] text-ink">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-p-600" />
                        {u}
                      </li>
                    ))}
                  </ul>
                </Card>
                {modele.hebergement === 'externe' ? (
                  <Callout ton="warn" titre="Ce modèle fait sortir vos données du territoire">
                    Chaque appel part vers cette juridiction — {modele.residence}. La classe de données
                    « réglementée » y est refusée par la politique de résidence, et chaque sortie est
                    comptée dans le journal d’audit. Le contrat cadre Synelia interdit au fournisseur
                    de réutiliser vos requêtes pour l’entraînement, mais il ne les rapatrie pas pour
                    autant.
                  </Callout>
                ) : (
                  <Callout ton="ok" titre="Le calcul a lieu en Côte d’Ivoire">
                    La requête entre et sort de {modele.site === 'ABJ' ? 'Abidjan' : 'Grand-Bassam'} :
                    aucune donnée ne franchit la frontière, aucun sous-traitant étranger n’intervient,
                    et la latence n’inclut pas d’aller-retour transatlantique.
                  </Callout>
                )}
                {modele.statut === 'degrade' && (
                  <Callout ton="warn" titre="Service dégradé, retrait programmé">
                    {modele.remplacePar && (
                      <>
                        Successeur annoncé : <span className="font-mono text-[12px]">{modele.remplacePar}</span>.{' '}
                      </>
                    )}
                    {modele.finDeVie && <>Retrait du catalogue le {dateCourte(modele.finDeVie)}. </>}
                    Les règles de routage qui pointent encore vers ce modèle basculeront
                    automatiquement sur leur repli déclaré.
                  </Callout>
                )}
                {modele.statut === 'apercu' && (
                  <Callout ton="info" titre="En aperçu — aucun engagement de disponibilité">
                    Un modèle en aperçu tourne sur un nœud unique, peut être redémarré sans préavis
                    et ne compte pas dans le calcul du SLA. Utilisez-le pour éprouver un usage, pas
                    pour le mettre en production.
                  </Callout>
                )}
              </div>
            </div>
          )}

          {onglet === 'tarifs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatTile
                  libelle={modele.unite === 'minute' ? 'Par minute d’audio' : 'Jetons d’entrée'}
                  valeur={money(modele.prixEntree)}
                  detail={modele.unite === 'minute' ? 'Facturé à la seconde près' : 'Par million de jetons'}
                />
                <StatTile
                  libelle="Jetons de sortie"
                  valeur={modele.prixSortie > 0 ? money(modele.prixSortie) : 'Sans objet'}
                  detail={modele.prixSortie > 0 ? 'Par million de jetons' : 'Ce modèle ne génère pas de texte'}
                />
                <StatTile
                  libelle="Requête de référence"
                  valeur={money(coutReference(modele))}
                  detail={
                    modele.unite === 'minute'
                      ? 'Pour 60 minutes d’audio'
                      : '1 000 requêtes de 2 000 jetons entrants et 400 sortants'
                  }
                />
              </div>

              <Card>
                <CardHeader
                  titre="Comparaison sur la même charge"
                  sousTitre="Mille requêtes de 2 000 jetons entrants et 400 jetons sortants, tarif public en FCFA hors taxes."
                />
                <div className="space-y-1.5">
                  {[...MODELES_IA]
                    .filter((m) => m.famille === modele.famille && m.unite === modele.unite)
                    .sort((a, b) => coutReference(a) - coutReference(b))
                    .map((m) => {
                      const max = Math.max(
                        ...MODELES_IA.filter((x) => x.famille === modele.famille).map(coutReference),
                      )
                      const largeur = max > 0 ? (coutReference(m) / max) * 100 : 0
                      return (
                        <div key={m.id} className="flex flex-wrap items-center gap-3">
                          <span className="w-full min-w-0 truncate text-[12.5px] text-ink sm:w-52">
                            {m.nom}
                          </span>
                          <span className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-g-100">
                              <span
                                className={cn(
                                  'block h-full rounded-full',
                                  m.hebergement === 'souverain' ? 'bg-p-600' : 'bg-warn',
                                )}
                                style={{ width: `${Math.max(largeur, 2)}%` }}
                              />
                            </span>
                            <span className="tnum w-24 shrink-0 text-right text-[12px] font-semibold text-ink">
                              {money(coutReference(m))}
                            </span>
                          </span>
                        </div>
                      )
                    })}
                </div>
                <Callout ton="info" className="mt-4" titre="Le prix n’est pas le seul critère">
                  Un modèle deux fois moins cher qui demande deux essais pour donner la bonne réponse
                  coûte davantage. Mesurez sur votre propre charge avant d’arbitrer : la clé
                  d’exploration existe pour cela, et sa dépense est plafonnée.
                </Callout>
              </Card>
            </div>
          )}

          {onglet === 'performance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile libelle="Latence du premier jeton" valeur={`${num(modele.latenceP50Ms)} ms`} ton={modele.latenceP50Ms < 500 ? 'ok' : 'warn'} detail="Médiane sur 24 h" />
                <StatTile
                  libelle="Débit"
                  valeur={modele.debitJetonsSec > 0 ? `${num(modele.debitJetonsSec)} jet/s` : '—'}
                  detail={modele.debitJetonsSec > 0 ? 'Par flux, à charge nominale' : 'Sans objet pour ce modèle'}
                />
                <StatTile
                  libelle="Disponibilité 30 j"
                  valeur={modele.statut === 'apercu' ? 'Non mesurée' : modele.statut === 'degrade' ? '97,2 %' : '99,95 %'}
                  ton={modele.statut === 'disponible' ? 'ok' : 'warn'}
                />
                <StatTile
                  libelle="Distance réseau"
                  valeur={modele.hebergement === 'souverain' ? '< 5 ms' : '180 à 240 ms'}
                  detail={modele.hebergement === 'souverain' ? 'Depuis vos VM d’Abidjan' : 'Aller-retour vers le fournisseur'}
                />
              </div>
              <Card>
                <CardHeader
                  titre="Vingt-quatre dernières heures"
                  sousTitre="Mesures relevées à la sortie de la passerelle, telles que vos applications les subissent."
                />
                <GrilleSparkCharts
                  seed={`ia-${modele.id}`}
                  metriques={[
                    { titre: 'Latence du premier jeton', unite: 'ms', min: modele.latenceP50Ms * 0.7, max: modele.latenceP50Ms * 2.4, seuil: modele.latenceP50Ms * 2 },
                    { titre: 'Requêtes par minute', unite: 'req/min', min: 12, max: 148 },
                    { titre: 'Jetons par seconde', unite: 'jet/s', min: Math.max(modele.debitJetonsSec * 0.6, 10), max: Math.max(modele.debitJetonsSec * 1.3, 40) },
                    { titre: 'Taux d’erreur', unite: '%', min: 0, max: modele.statut === 'degrade' ? 6 : 1.2, seuil: 1, couleur: 'var(--color-warn)' },
                  ]}
                  degrade={modele.statut === 'degrade'}
                />
              </Card>
              <Card>
                <CardHeader titre="File d’attente" sousTitre="Temps passé en file avant le début du traitement, hors génération." />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StatTile libelle="Médiane" valeur="18 ms" ton="ok" serie={seededSeries(`${modele.id}-q50`, 24, 8, 40)} />
                  <StatTile libelle="p95" valeur="240 ms" serie={seededSeries(`${modele.id}-q95`, 24, 120, 480)} />
                  <StatTile
                    libelle="Requêtes mises en file"
                    valeur="2,4 %"
                    detail="Au-delà de 5 %, un point d’inférence dédié se justifie"
                  />
                </div>
              </Card>
            </div>
          )}

          {onglet === 'appel' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader
                  titre="En ligne de commande"
                  sousTitre="La passerelle parle le dialecte OpenAI : seuls l’URL de base et la clé changent."
                />
                <CodeBlock
                  langue="bash"
                  code={
                    modele.famille === 'embedding' || modele.famille === 'reranker'
                      ? `curl ${PASSERELLE_IA.base}/embeddings \\
  -H "Authorization: Bearer $SYNELIA_IA_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${modele.slug}",
    "input": ["Facture impayée depuis 70 jours"]
  }'`
                      : modele.famille === 'transcription'
                        ? `curl ${PASSERELLE_IA.base}/audio/transcriptions \\
  -H "Authorization: Bearer $SYNELIA_IA_KEY" \\
  -F model="${modele.slug}" \\
  -F language=fr \\
  -F file=@appel-2026-08-19.mp3`
                        : `curl ${PASSERELLE_IA.base}/chat/completions \\
  -H "Authorization: Bearer $SYNELIA_IA_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${modele.slug}",
    "messages": [
      {"role": "user", "content": "Résume ce dossier en cinq lignes."}
    ]
  }'`
                  }
                />
              </Card>
              <div className="space-y-4">
                <Card>
                  <CardHeader
                    titre="Depuis Python"
                    sousTitre="La bibliothèque officielle openai fonctionne telle quelle."
                  />
                  <CodeBlock
                    langue="python"
                    code={`from openai import OpenAI

client = OpenAI(
    base_url="${PASSERELLE_IA.base}",
    api_key=os.environ["SYNELIA_IA_KEY"],
)

reponse = client.chat.completions.create(
    model="${modele.slug}",
    messages=[{"role": "user", "content": "Bonjour"}],
    extra_headers={"x-synelia-classe": "interne"},
)`}
                  />
                </Card>
                <Callout ton="violet" titre="L’en-tête qui compte">
                  <span className="font-mono text-[12px]">x-synelia-classe</span> déclare la
                  sensibilité du contenu envoyé. C’est lui qui décide si la requête a le droit de
                  sortir du territoire, quel garde-fou s’applique et quelle durée de conservation
                  vaut pour la trace. Sans cet en-tête, la passerelle retient la classe la plus
                  contraignante autorisée par la clé.
                </Callout>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
