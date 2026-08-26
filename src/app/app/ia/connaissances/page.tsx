'use client'

import { useState } from 'react'
import { Cloud, FolderGit2, Globe, HardDrive, Plus, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateHeure, goHumain, jetons, money, num, pct, relatif } from '@/lib/format'
import type { BaseConnaissance } from '@/lib/types'
import {
  BASES_CONNAISSANCE,
  CLES_IA,
  CONNECTEURS_CONNAISSANCE,
  DECOUPAGE_DEFAUT,
  FILTRES_METADONNEES,
  MODELES_IA,
} from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CodeBlock, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Select, Slider, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { EmptyState, ErrorState } from '@/components/composition/states'
import { PASSERELLE_IA } from '@/lib/mock/ia'
import { useApp, useEspace } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'source', label: 'Source & indexation' },
  { id: 'acces', label: 'Accès' },
  { id: 'interroger', label: 'Interroger' },
]

const ICONE_SOURCE = {
  s3: <Cloud size={13} />,
  drive: <HardDrive size={13} />,
  web: <Globe size={13} />,
  git: <FolderGit2 size={13} />,
}

const TON_STATUT = { a_jour: 'ok', indexation: 'info', erreur: 'err', jamais_indexee: 'neutral' } as const
const LIBELLE_STATUT = {
  a_jour: 'À jour',
  indexation: 'Indexation en cours',
  erreur: 'Index partiel',
  jamais_indexee: 'Jamais indexée',
} as const

const LIBELLE_FREQUENCE = {
  manuelle: 'Manuelle',
  quotidienne: 'Quotidienne, à 04 h 00',
  horaire: 'Toutes les heures',
} as const

/** Coût d'une réindexation complète, au tarif de la vectorisation. */
function coutIndexation(base: BaseConnaissance): number {
  const modele = MODELES_IA.find((m) => m.slug === base.modeleEmbedding)
  const jetonsEstimes = base.fragments * 420
  return Math.round(((modele?.prixEntree ?? 45) * jetonsEstimes) / 1_000_000)
}

export default function BasesDeConnaissance() {
  const espace = useEspace()
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('source')

  const bases = BASES_CONNAISSANCE.filter((b) => b.espaceId === espace.id)
  const [selection, setSelection] = useState(bases[0]?.id ?? '')
  const base = bases.find((b) => b.id === selection) ?? bases[0]

  const peutEcrire = autorise('ia.knowledge.write')

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'IA & Agents', href: '/app/ia' },
          { label: 'Bases de connaissances' },
        ]}
        titre="Bases de connaissances"
        sousTitre="Une base de connaissances indexe vos documents pour que vos applications les retrouvent par le sens, pas par mot-clé. Nous lisons la source à l’endroit où elle vit — Drive, bucket S3, dépôt git, site web — et nous n’en gardons que les vecteurs."
        actions={
          <GatedAction autorise={peutEcrire} message={refus('ia.knowledge.write')}>
            <Button iconBefore={<Plus size={14} />}>Créer une base</Button>
          </GatedAction>
        }
      />

      {bases.length === 0 ? (
        <EmptyState
          titre="Aucune base de connaissances sur cet espace"
          phrase="Sans base de connaissances, un modèle répond avec ce qu’il a appris pendant son entraînement — donc jamais avec vos procédures, vos contrats ni votre historique de support. C’est le premier écart à combler avant d’espérer des réponses utiles."
          action={{ libelle: 'Créer une base', href: '#' }}
          actionSecondaire={{ libelle: 'Voir le catalogue de modèles', href: '/app/ia/modeles' }}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile libelle="Bases" valeur={bases.length} />
            <StatTile
              libelle="Documents indexés"
              valeur={num(bases.reduce((a, b) => a + b.documents, 0))}
              detail={`${num(bases.reduce((a, b) => a + b.fragments, 0))} fragments`}
            />
            <StatTile
              libelle="Volume vectorisé"
              valeur={goHumain(bases.reduce((a, b) => a + b.tailleMo, 0) / 1024)}
            />
            <StatTile
              libelle="Bases à jour"
              valeur={bases.filter((b) => b.statut === 'a_jour').length}
              ton={bases.some((b) => b.statut === 'erreur') ? 'warn' : 'ok'}
              detail={`sur ${bases.length}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bases.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelection(b.id)}
                className={cn(
                  'rounded-[10px] border-2 bg-white p-4 text-left transition-colors',
                  base?.id === b.id ? 'border-p-700' : 'border-g-300 hover:border-p-400',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[12.5px] font-semibold text-ink">
                      {b.nom}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-g-500">
                      <span className="shrink-0 text-g-500">{ICONE_SOURCE[b.source.type]}</span>
                      <span className="truncate">{b.source.libelle}</span>
                    </span>
                  </span>
                  <Badge tone={TON_STATUT[b.statut]} dot size="sm">
                    {LIBELLE_STATUT[b.statut]}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-g-100 pt-2.5">
                  <span className="block">
                    <MicroLabel>Documents</MicroLabel>
                    <span className="tnum block text-[12.5px] font-semibold text-ink">
                      {num(b.documents)}
                    </span>
                  </span>
                  <span className="block">
                    <MicroLabel>Fragments</MicroLabel>
                    <span className="tnum block text-[12.5px] font-semibold text-ink">
                      {num(b.fragments)}
                    </span>
                  </span>
                </div>
                <p className="mt-2.5 text-[11px] text-g-500">
                  Indexée {relatif(b.derniereIndexation)} · {LIBELLE_FREQUENCE[b.frequence]}
                </p>
              </button>
            ))}
          </div>

          {base && (
            <>
              <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

              {onglet === 'source' && (
                <div className="space-y-4">
                  {base.statut === 'erreur' && base.erreur && (
                    <ErrorState
                      titre="La dernière indexation ne s’est pas terminée"
                      cause={base.erreur}
                      reprise="Corrigez l’accès à la source, puis relancez une indexation complète. En attendant, la base répond avec l’index précédent — les réponses seront datées, pas fausses."
                      seed={base.id}
                    />
                  )}

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader
                        titre="Source"
                        sousTitre="Les documents restent chez vous. Nous les lisons, les découpons et n’en conservons que des vecteurs."
                      />
                      <KeyValueList
                        colonnes={1}
                        items={[
                          { cle: 'Emplacement', valeur: base.source.libelle },
                          {
                            cle: 'Type',
                            valeur:
                              base.source.type === 's3'
                                ? 'Bucket de stockage objet'
                                : base.source.type === 'drive'
                                  ? 'Dossier Drive partagé'
                                  : base.source.type === 'web'
                                    ? 'Exploration de site'
                                    : 'Dépôt git',
                          },
                          { cle: 'Documents', valeur: num(base.documents) },
                          { cle: 'Fragments', valeur: num(base.fragments) },
                          { cle: 'Taille de l’index', valeur: goHumain(base.tailleMo / 1024) },
                          {
                            cle: 'Modèle de vectorisation',
                            valeur: (
                              <span className="font-mono text-[12px]">{base.modeleEmbedding}</span>
                            ),
                          },
                          { cle: 'Dimensions', valeur: num(base.dimension) },
                          {
                            cle: 'Mode de découpage',
                            valeur:
                              base.modeDecoupage === 'parent_enfant'
                                ? 'Parent-enfant — on cherche sur le petit, on donne le grand'
                                : base.modeDecoupage === 'qr'
                                  ? 'Question-réponse — un fragment par échange'
                                  : 'Général — un fragment par bloc de texte',
                          },
                          {
                            cle: 'Méthode d’index',
                            valeur:
                              base.methodeIndex === 'haute_qualite'
                                ? 'Haute qualité — vecteurs, coût de vectorisation'
                                : 'Économique — dix mots-clés par fragment, sans coût',
                          },
                        ]}
                      />
                      <Callout ton="info" className="mt-4" titre="Pas de visionneuse ici">
                        Ce portail ne rouvre pas vos documents : ni aperçu, ni éditeur, ni recherche
                        plein texte. Pour lire une procédure, ouvrez-la dans le Drive où elle vit.
                        Cette page pilote l’index, pas le contenu.
                      </Callout>
                    </Card>

                    <div className="space-y-4">
                      <Card>
                        <CardHeader
                          titre="Indexation"
                          sousTitre="Une réindexation complète relit toute la source et recalcule tous les vecteurs."
                          actions={
                            <GatedAction autorise={peutEcrire} message={refus('ia.knowledge.write')}>
                              <Button
                                size="sm"
                                variant="secondary"
                                iconBefore={<RefreshCw size={13} />}
                                onClick={() =>
                                  pousser({
                                    ton: 'info',
                                    titre: 'Réindexation lancée',
                                    detail: `${base.nom} — suivez l’avancement dans le centre de tâches.`,
                                  })
                                }
                              >
                                Réindexer
                              </Button>
                            </GatedAction>
                          }
                        />
                        <div className="space-y-3.5">
                          <Field label="Fréquence" hint="Une source qui bouge peu n’a pas besoin d’être relue toutes les heures">
                            <Select defaultValue={base.frequence}>
                              <option value="manuelle">Manuelle</option>
                              <option value="quotidienne">Quotidienne, à 04 h 00</option>
                              <option value="horaire">Toutes les heures</option>
                            </Select>
                          </Field>
                          <Switch
                            checked
                            label="Indexation incrémentale"
                            description="Seuls les documents modifiés depuis la dernière passe sont relus. Une réindexation complète reste possible à la demande."
                          />
                          <Switch
                            checked={false}
                            label="Supprimer les vecteurs des documents disparus"
                            description="Sinon, un document retiré de la source continue d’alimenter les réponses. Désactivé par défaut : une suppression accidentelle à la source ne doit pas vider l’index."
                          />
                        </div>
                      </Card>

                      <Card>
                        <CardHeader titre="Dernière passe" />
                        <div className="grid grid-cols-2 gap-3">
                          <StatTile libelle="Terminée le" valeur={dateHeure(base.derniereIndexation)} />
                          <StatTile
                            libelle="Coût d’une passe complète"
                            valeur={money(coutIndexation(base))}
                            detail={`Environ ${jetons(base.fragments * 420)} vectorisés`}
                          />
                        </div>
                      </Card>

                      <Card>
                        <CardHeader
                          titre="Découpage"
                          sousTitre="Un document entier ne tient pas dans une requête : il est coupé en fragments, et c’est le fragment qui est retrouvé, pas le document."
                        />
                        <div className="space-y-4">
                          <Slider
                            label="Taille d’un fragment"
                            value={DECOUPAGE_DEFAUT.tailleFragment}
                            onChange={() => undefined}
                            min={120}
                            max={1_200}
                            step={20}
                            unite="jetons"
                          />
                          <Slider
                            label="Recouvrement entre fragments"
                            value={DECOUPAGE_DEFAUT.recouvrement}
                            onChange={() => undefined}
                            min={0}
                            max={200}
                            step={10}
                            unite="jetons"
                          />
                          <Field label="Stratégie de coupe">
                            <Select defaultValue="titre" disabled={!peutEcrire}>
                              <option value="titre">{DECOUPAGE_DEFAUT.strategie}</option>
                              <option value="fixe">Longueur fixe, sans tenir compte de la structure</option>
                              <option value="phrase">Par phrase, pour des textes courts</option>
                            </Select>
                          </Field>
                        </div>
                        <Callout ton="warn" className="mt-4" titre="Changer ces valeurs impose de tout réindexer">
                          Les fragments existants ne se recoupent pas à la volée : modifier la taille
                          ou le recouvrement déclenche une passe complète, facturée{' '}
                          {money(coutIndexation(base))} sur cette base. Le recouvrement évite qu’une
                          phrase coupée en deux perde son sens des deux côtés.
                        </Callout>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {onglet === 'acces' && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader
                      titre="Clés autorisées"
                      sousTitre="Une base n’est interrogeable que par les clés qui la citent. Aucune découverte implicite."
                    />
                    <div className="space-y-2">
                      {CLES_IA.filter((c) => c.espaceId === espace.id).map((c) => {
                        const autorisee = base.clesAutorisees.includes(c.id)
                        return (
                          <div
                            key={c.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-[12.5px] font-semibold text-ink">
                                {c.nom}
                              </span>
                              <span className="block font-mono text-[11px] text-g-500">
                                {c.prefixe}…
                              </span>
                            </span>
                            <Badge tone={autorisee ? 'ok' : 'neutral'} size="sm">
                              {autorisee ? 'Autorisée' : 'Sans accès'}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                  <div className="space-y-4">
                    <Card>
                      <CardHeader titre="Cloisonnement" />
                      <div className="space-y-3.5">
                        <Switch
                          checked
                          label="Filtrer les fragments par périmètre de l’appelant"
                          description="Les métadonnées de chaque document portent son périmètre. Un utilisateur du support ne verra jamais remonter un fragment de contrat réservé à la direction, même si sa question y mène."
                        />
                        <Switch
                          checked
                          label="Citer les sources dans la réponse"
                          description="Chaque fragment utilisé est renvoyé avec son document d’origine. Sans citation, une réponse plausible est indistinguable d’une réponse inventée."
                        />
                      </div>
                    </Card>
                    <Callout ton="violet" titre="La vectorisation ne chiffre rien">
                      Un vecteur n’est pas un document chiffré : on peut en reconstituer une partie du
                      sens. Une base construite sur des données réglementées reste une base de données
                      réglementée — elle est servie depuis Abidjan, sauvegardée avec l’espace, et
                      soumise aux mêmes durées de conservation.
                    </Callout>
                  </div>
                </div>
              )}

              {onglet === 'interroger' && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader
                      titre="Recherche puis génération"
                      sousTitre="Deux appels : on retrouve les fragments, puis on les donne au modèle avec la question."
                    />
                    <CodeBlock
                      langue="bash"
                      code={`# 1 — retrouver les fragments pertinents
curl ${PASSERELLE_IA.base}/knowledge/${base.nom}/search \\
  -H "Authorization: Bearer $SYNELIA_IA_KEY" \\
  -d '{"query": "délai de rétractation", "top_k": 8, "rerank": true}'

# 2 — générer la réponse à partir des fragments cités
curl ${PASSERELLE_IA.base}/chat/completions \\
  -H "Authorization: Bearer $SYNELIA_IA_KEY" \\
  -d '{
    "model": "synelia/llama-3.3-70b-instruct",
    "knowledge": ["${base.nom}"],
    "messages": [{"role": "user", "content": "Quel est le délai de rétractation ?"}]
  }'`}
                    />
                  </Card>
                  <div className="space-y-4">
                    <Card>
                      <CardHeader
                        titre="Réglages de recherche"
                        sousTitre="Les valeurs par défaut conviennent à la plupart des corpus."
                      />
                      <KeyValueList
                        colonnes={1}
                        items={[
                          {
                            cle: 'Mode de recherche',
                            valeur:
                              base.modeRecherche === 'hybride'
                                ? 'Hybride — sens et mots-clés, fusionnés'
                                : base.modeRecherche === 'plein_texte'
                                  ? 'Plein texte — mots-clés seulement'
                                  : 'Vectorielle — sens seulement',
                          },
                          { cle: 'Fragments remontés', valeur: '8 par requête' },
                          { cle: 'Taille d’un fragment', valeur: '420 jetons, recouvrement de 60' },
                          { cle: 'Reclassement', valeur: 'Actif — synelia/bge-reranker-v2-m3' },
                          { cle: 'Score minimal', valeur: '0,32 — en dessous, rien n’est renvoyé' },
                          { cle: 'Latence médiane', valeur: '64 ms, reclassement compris' },
                          {
                            cle: 'Citations',
                            valeur: base.citations
                              ? 'Chaque fragment est rendu avec son document d’origine'
                              : 'Désactivées — les réponses ne citent pas leur source',
                          },
                        ]}
                      />
                      {!base.citations && (
                        <Callout ton="warn" className="mt-4" titre="Sans citation, rien n’est vérifiable">
                          Une réponse plausible et une réponse inventée se ressemblent. La citation est
                          ce qui permet à un lecteur de trancher en dix secondes. Elle est désactivée
                          ici parce que la source est un historique de tickets, dont on ne veut pas
                          exposer les références aux clients — c’est un arbitrage, pas un oubli.
                        </Callout>
                      )}
                    </Card>
                    <Callout ton="info" titre="Quand la base ne sait pas">
                      Sous le score minimal, la recherche renvoie une liste vide et le modèle reçoit
                      la consigne de répondre qu’il n’a pas l’information. C’est le comportement à
                      préférer : une réponse absente se traite, une réponse inventée se propage.
                    </Callout>
                  </div>

                  <Card className="lg:col-span-2">
                    <CardHeader
                      titre="Filtres de métadonnées"
                      sousTitre="Restreindre la recherche avant de chercher coûte moins cher que trier après. Chaque document porte ces attributs, hérités de sa source ou lus dans son contenu."
                    />
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px] text-left">
                        <thead>
                          <tr className="border-b border-g-300">
                            <th className="type-micro py-2 text-g-500">Attribut</th>
                            <th className="type-micro py-2 text-g-500">Exemple de filtre</th>
                            <th className="type-micro py-2 text-right text-g-500">Couverture</th>
                          </tr>
                        </thead>
                        <tbody>
                          {FILTRES_METADONNEES.map((f) => (
                            <tr key={f.cle} className="border-b border-g-100 last:border-0">
                              <td className="py-2.5">
                                <span className="block font-mono text-[12px] font-semibold text-ink">
                                  {f.cle}
                                </span>
                                <span className="block text-[11px] text-g-500">{f.libelle}</span>
                              </td>
                              <td className="py-2.5 font-mono text-[11.5px] text-g-700">
                                {f.exemple}
                              </td>
                              <td className="py-2.5 text-right">
                                <Badge tone={f.couverture > 90 ? 'ok' : 'warn'} size="sm">
                                  {pct(f.couverture)}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Callout ton="warn" className="mt-4" titre="Un filtre à 62 % de couverture est un piège">
                      Filtrer sur <span className="font-mono text-[12px]">version</span> écarte
                      silencieusement les 38 % de documents qui ne portent pas l’attribut — y compris
                      ceux qui contenaient la réponse. Un filtre ne vaut que si l’attribut est
                      renseigné partout ; sinon il faut le remplir d’abord.
                    </Callout>
                  </Card>
                </div>
              )}
            </>
          )}
        </>
      )}

      <Card>
        <CardHeader
          titre="Connecteurs d’ingestion"
          sousTitre="D’où les documents peuvent venir. Nous lisons la source là où elle vit et n’en gardons que les vecteurs — pas de seconde copie de vos documents chez nous."
        />
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {CONNECTEURS_CONNAISSANCE.map((c) => (
            <div key={c.id} className="rounded-[8px] border border-g-300 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 truncate text-[12.5px] font-semibold text-ink">
                  {c.nom}
                </span>
                <Badge tone={c.etat === 'disponible' ? 'ok' : 'info'} size="sm">
                  {c.etat === 'disponible' ? 'Disponible' : 'Aperçu'}
                </Badge>
              </div>
              <p className="mt-1 font-mono text-[10.5px] text-g-500">{c.formats}</p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-g-500">{c.note}</p>
            </div>
          ))}
        </div>
        <Callout ton="violet" className="mt-4" titre="Le téléversement direct est le dernier recours">
          Déposer des fichiers une fois donne un index qui vieillit sans prévenir : la procédure
          révisée en octobre restera absente jusqu’à ce que quelqu’un y repense. Branchez une source
          vivante partout où c’est possible, même au prix d’une configuration d’accès.
        </Callout>
      </Card>
    </div>
  )
}
