'use client'

import { useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, Lock, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { num, pct } from '@/lib/format'
import { CLASSE_DONNEES_LABEL } from '@/lib/types'
import { GARDE_FOUS, MATRICE_RESIDENCE, MODELES_IA, REGLES_ROUTAGE, modeleParSlug } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink, IconButton } from '@/components/ui/button'
import { GatedAction, Tabs } from '@/components/ui/display'
import { Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'regles', label: 'Règles de routage' },
  { id: 'gardefous', label: 'Garde-fous' },
  { id: 'residence', label: 'Résidence des données' },
]

const LIBELLE_ACTION = {
  bloquer: 'Bloque la requête',
  masquer: 'Masque avant l’appel',
  journaliser: 'Journalise seulement',
} as const

const TON_ACTION = { bloquer: 'err', masquer: 'violet', journaliser: 'info' } as const

const LIBELLE_SENS = { entree: 'Entrée', sortie: 'Sortie', les_deux: 'Entrée et sortie' } as const

export default function RoutageGardeFous() {
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('regles')
  const [regles, setRegles] = useState(() =>
    Object.fromEntries(REGLES_ROUTAGE.map((r) => [r.id, r.actif])),
  )
  const [gardes, setGardes] = useState(() =>
    Object.fromEntries(GARDE_FOUS.map((g) => [g.id, g.actif])),
  )

  const peutModifier = autorise('ia.routing.update')
  const requetes24h = REGLES_ROUTAGE.reduce((a, r) => a + r.requetes24h, 0)
  const replis24h = REGLES_ROUTAGE.reduce((a, r) => a + r.replisDeclenches24h, 0)
  const sortiesAutorisees = REGLES_ROUTAGE.filter((r) => !r.residenceImposee && regles[r.id]).length

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'IA & Modèles', href: '/app/ia' },
          { label: 'Routage & garde-fous' },
        ]}
        titre="Routage & garde-fous"
        sousTitre="Vos applications demandent une capacité, pas un modèle précis. Les règles ci-dessous décident lequel répond, vers quoi basculer quand il ne répond plus, et ce qui n’a pas le droit de sortir du territoire."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile libelle="Requêtes routées 24 h" valeur={num(requetes24h)} />
        <StatTile
          libelle="Replis déclenchés"
          valeur={num(replis24h)}
          ton={replis24h > 2_000 ? 'warn' : 'ok'}
          detail={`${pct((replis24h / requetes24h) * 100, 2)} des requêtes`}
        />
        <StatTile
          libelle="Règles autorisant une sortie"
          valeur={sortiesAutorisees}
          ton={sortiesAutorisees > 0 ? 'warn' : 'ok'}
          detail={`sur ${REGLES_ROUTAGE.length} règles`}
        />
        <StatTile
          libelle="Garde-fous actifs"
          valeur={Object.values(gardes).filter(Boolean).length}
          detail={`sur ${GARDE_FOUS.length} disponibles`}
          ton="ok"
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'regles' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Règles, dans l’ordre d’évaluation"
              sousTitre="La première règle qui correspond gagne. Une requête qui n’en satisfait aucune part sur le modèle par défaut de sa clé."
              actions={
                <GatedAction autorise={peutModifier} message={refus('ia.routing.update')}>
                  <Button size="sm" variant="secondary" iconBefore={<Plus size={13} />}>
                    Ajouter une règle
                  </Button>
                </GatedAction>
              }
            />
            <div className="space-y-2.5">
              {REGLES_ROUTAGE.map((r, i) => {
                const cible = modeleParSlug(r.cible)
                const actif = regles[r.id]
                return (
                  <div
                    key={r.id}
                    className={cn(
                      'rounded-[8px] border px-3.5 py-3',
                      actif ? 'border-g-300 bg-white' : 'border-g-300 bg-g-050',
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <span className="flex min-w-0 items-start gap-3">
                        <span className="tnum mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-p-050 text-[11.5px] font-bold text-p-700">
                          {r.ordre}
                        </span>
                        <span className="min-w-0">
                          <span
                            className={cn(
                              'block text-[13px] font-semibold',
                              actif ? 'text-ink' : 'text-g-500',
                            )}
                          >
                            {r.nom}
                          </span>
                          <span className="block text-[12px] text-g-500">{r.quand}</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        {r.residenceImposee && (
                          <Badge tone="ok" size="sm">
                            <Lock size={10} className="mr-1 inline" aria-hidden />
                            Territoire imposé
                          </Badge>
                        )}
                        <GatedAction autorise={peutModifier} message={refus('ia.routing.update')}>
                          <IconButton
                            label={`Remonter la règle ${r.nom}`}
                            variant="ghost"
                            size="sm"
                            disabled={i === 0}
                          >
                            <ArrowUp size={13} />
                          </IconButton>
                        </GatedAction>
                        <GatedAction autorise={peutModifier} message={refus('ia.routing.update')}>
                          <IconButton
                            label={`Descendre la règle ${r.nom}`}
                            variant="ghost"
                            size="sm"
                            disabled={i === REGLES_ROUTAGE.length - 1}
                          >
                            <ArrowDown size={13} />
                          </IconButton>
                        </GatedAction>
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-g-100 pt-2.5">
                      <MicroLabel>Chaîne</MicroLabel>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={cible?.hebergement === 'souverain' ? 'ok' : 'warn'} size="sm">
                          {cible?.nom ?? r.cible}
                        </Badge>
                        {r.repli.map((slug) => {
                          const m = modeleParSlug(slug)
                          return (
                            <span key={slug} className="flex items-center gap-1.5">
                              <ArrowRight size={11} className="text-g-500" aria-hidden />
                              <Badge tone={m?.hebergement === 'souverain' ? 'neutral' : 'warn'} size="sm">
                                {m?.nom ?? slug}
                              </Badge>
                            </span>
                          )
                        })}
                        {r.repli.length === 0 && (
                          <span className="text-[11.5px] text-g-500">
                            Aucun repli — l’appel échoue en 503 si le modèle est indisponible
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
                      <span className="tnum text-[11.5px] text-g-500">
                        {num(r.requetes24h)} requêtes en 24 h ·{' '}
                        {r.replisDeclenches24h > 0
                          ? `${num(r.replisDeclenches24h)} replis`
                          : 'aucun repli'}
                      </span>
                      <GatedAction autorise={peutModifier} message={refus('ia.routing.update')}>
                        <Switch
                          checked={actif}
                          onChange={(v) => {
                            setRegles((s) => ({ ...s, [r.id]: v }))
                            pousser({
                              ton: v ? 'ok' : 'warn',
                              titre: v ? 'Règle activée' : 'Règle désactivée',
                              detail: r.nom,
                            })
                          }}
                          label="Active"
                        />
                      </GatedAction>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Callout ton="violet" titre="Ce qu’un repli change, et ce qu’il ne change pas">
            Basculer sur un autre modèle rétablit le service, pas la qualité : les réponses changent
            de style, parfois de format. Si votre application analyse la sortie, testez-la avec chaque
            modèle de la chaîne, pas seulement avec le premier. Un repli non éprouvé n’est pas un
            repli, c’est une panne différée.
          </Callout>
        </div>
      )}

      {onglet === 'gardefous' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {GARDE_FOUS.map((g) => (
              <Card key={g.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-bold text-ink">{g.nom}</span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      <Badge tone={TON_ACTION[g.action]} size="sm">
                        {LIBELLE_ACTION[g.action]}
                      </Badge>
                      <Badge tone="neutral" size="sm">
                        {LIBELLE_SENS[g.sens]}
                      </Badge>
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-right">
                    <span className="block text-[15px] font-bold text-ink">
                      {num(g.declenchements24h)}
                    </span>
                    <span className="type-micro block text-g-500">déclenchements 24 h</span>
                  </span>
                </div>
                <p className="mt-3 text-[12.5px] leading-relaxed text-g-500">{g.description}</p>
                <div className="mt-3 border-t border-g-100 pt-3">
                  <GatedAction autorise={peutModifier} message={refus('ia.routing.update')}>
                    <Switch
                      checked={gardes[g.id]}
                      onChange={(v) => setGardes((s) => ({ ...s, [g.id]: v }))}
                      label={gardes[g.id] ? 'Appliqué à toutes les clés' : 'Inactif'}
                    />
                  </GatedAction>
                </div>
              </Card>
            ))}
          </div>

          <Callout ton="warn" titre="Un garde-fou se paie en faux positifs">
            Le filtre de secrets refuse vingt-sept requêtes légitimes par jour, souvent des extraits
            de configuration collés dans un ticket. C’est le prix à payer pour qu’une chaîne de
            connexion ne parte jamais chez un fournisseur étranger. Le désactiver retire la
            protection : il n’y a pas de réglage intermédiaire qui garde l’un sans l’autre.
          </Callout>
        </div>
      )}

      {onglet === 'residence' && (
        <div className="space-y-4">
          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3">
              <CardHeader
                titre="Où chaque classe de données a le droit d’être traitée"
                sousTitre="Politique validée le 12 mai 2026. Elle prime sur les règles de routage : une règle qui la contredirait est refusée à l’enregistrement."
                className="mb-0"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    <th className="type-micro px-4 py-2.5 text-g-500">Classe</th>
                    <th className="type-micro px-4 py-2.5 text-g-500">Exemples</th>
                    <th className="type-micro px-4 py-2.5 text-center text-g-500">Territoire</th>
                    <th className="type-micro px-4 py-2.5 text-center text-g-500">Union européenne</th>
                    <th className="type-micro px-4 py-2.5 text-center text-g-500">Hors UE</th>
                  </tr>
                </thead>
                <tbody>
                  {MATRICE_RESIDENCE.map((l) => (
                    <tr key={l.classe} className="border-b border-g-100 last:border-0">
                      <td className="px-4 py-3">
                        <span className="block text-[12.5px] font-semibold text-ink">
                          {CLASSE_DONNEES_LABEL[l.classe]}
                        </span>
                        <span className="block text-[11px] text-g-500">{l.note}</span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-g-500">{l.exemples}</td>
                      {[l.souverain, l.ue, l.horsUe].map((permis, i) => (
                        <td key={i} className="px-4 py-3 text-center">
                          <Badge tone={permis ? 'ok' : 'err'} size="sm">
                            {permis ? 'Autorisé' : 'Refusé'}
                          </Badge>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Modèles concernés"
                sousTitre="Ce que la politique autorise, modèle par modèle."
              />
              <div className="space-y-1.5">
                {MODELES_IA.filter((m) => m.statut !== 'retire').map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-g-100 pb-1.5 last:border-0"
                  >
                    <span className="min-w-0 truncate text-[12.5px] text-ink">{m.nom}</span>
                    <Badge tone={m.hebergement === 'souverain' ? 'ok' : 'warn'} size="sm">
                      {m.hebergement === 'souverain'
                        ? 'Toutes classes'
                        : m.residence.startsWith('Union') || m.residence.startsWith('France')
                          ? 'Publique et interne'
                          : 'Publique seulement'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Callout ton="ok" titre="Ce que « souverain » veut dire ici">
                Le calcul a lieu sur des GPU que nous exploitons, dans nos salles d’Abidjan et de
                Grand-Bassam, sous droit ivoirien. Les poids des modèles sont ouverts et téléchargés
                une fois : aucun appel sortant n’est nécessaire pour servir une requête. Ce n’est pas
                le cas des modèles externes, quelle que soit leur juridiction.
              </Callout>
              <Callout
                ton="info"
                titre="Trajectoire publiée"
                action={
                  <ButtonLink size="sm" variant="secondary" href="/souverainete">
                    Voir la trajectoire
                  </ButtonLink>
                }
              >
                La part de trafic traitée sur le territoire, la liste des sous-traitants étrangers et
                le calendrier de sortie sont publiés sur la page souveraineté du site. Nous
                n’affirmons pas que rien ne sort : nous publions ce qui sort, vers où, et pourquoi.
              </Callout>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
