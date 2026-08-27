'use client'

import { cn, seededSeries } from '@/lib/utils'
import { dateCourte, jetons, money, num, pct } from '@/lib/format'
import { SITE_LABEL } from '@/lib/types'
import {
  AGENTS_PLATEFORME,
  CONTRATS_FOURNISSEURS,
  FLOTTE_MODELES,
  PARC_GPU,
  SYNTHESE_AGENTS_PLATEFORME,
  SYNTHESE_IA_PLATEFORME,
  modeleParSlug,
} from '@/lib/mock'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardHeader, Callout, PageHeader } from '@/components/composition/card'
import { QuotaBar, StackedBar, StatTile } from '@/components/composition/metrics'
import { LiensSortie } from '@/components/business/observabilite'

const TON_CONTRAT = { actif: 'ok', depassement: 'warn', renegociation: 'info' } as const
const LIBELLE_CONTRAT = {
  actif: 'Actif',
  depassement: 'Engagement dépassé',
  renegociation: 'En renégociation',
} as const

export default function ParcGpuEtIA() {
  const s = SYNTHESE_IA_PLATEFORME
  const occupation = (s.gpuAllouees / s.gpuTotal) * 100
  const revente = CONTRATS_FOURNISSEURS.reduce(
    (a, c) => a + (c.consommeMois * c.prixReventeMoyen) / c.prixAchatMoyen,
    0,
  )

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[{ label: 'Espace fournisseur', href: '/admin' }, { label: 'Parc GPU & IA' }]}
        titre="Parc GPU & intelligence artificielle"
        sousTitre="La contrainte du calcul IA est la mémoire vidéo, pas le vCPU : une carte libre ne sert que si le modèle y tient. S’y ajoutent les contrats d’achat chez les fournisseurs étrangers, revendus au jeton."
        actions={<LiensSortie centreon grafana />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          libelle="GPU installés"
          valeur={s.gpuTotal}
          detail={`${s.gpuIndisponibles} en panne ou en maintenance`}
        />
        <StatTile
          libelle="Occupation"
          valeur={pct(occupation)}
          ton={occupation > 85 ? 'warn' : 'ok'}
          detail={`${s.gpuAllouees} cartes allouées`}
          serie={seededSeries('gpu-occ', 24, 62, 88)}
        />
        <StatTile
          libelle="Jetons servis 30 j"
          valeur={jetons(s.jetons30j)}
          detail={`${pct(s.partSouverainePct, 1)} sur nos propres GPU`}
        />
        <StatTile
          libelle="Chiffre d’affaires IA"
          valeur={money(s.caIaMensuel)}
          detail={`Achat externe ${money(s.coutAchatExterne)}`}
          ton="ok"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            titre="Cartes par site"
            sousTitre="Une carte indisponible n’est pas seulement une perte de capacité : elle casse la répartition d’un modèle qui s’étale sur plusieurs GPU."
          />
          <div className="space-y-3.5">
            {PARC_GPU.map((g) => (
              <div key={`${g.site}-${g.gpu}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-ink">{g.gpu}</span>
                    <Badge tone="neutral" size="sm">
                      {SITE_LABEL[g.site]}
                    </Badge>
                    <span className="text-[11px] text-g-500">{g.vram}</span>
                  </span>
                  <span className="tnum text-[12px] text-g-500">
                    {g.libres} libre{g.libres > 1 ? 's' : ''}
                    {g.indisponibles > 0 && ` · ${g.indisponibles} hors service`}
                  </span>
                </div>
                <QuotaBar
                  utilise={g.allouees}
                  total={g.total}
                  compact
                  seuil={88}
                  formateur={(v) => `${num(v)} cartes`}
                  className="mt-1.5"
                />
              </div>
            ))}
          </div>
          <Callout ton="warn" className="mt-4" titre="Trois cartes hors service à Abidjan">
            Deux H100 et une A100 sont sorties du pool depuis le 16 août — mémoire vidéo instable
            sous charge, remplacement sous garantie en cours. La capacité restante absorbe la charge
            actuelle, sans marge pour une nouvelle réservation en H100.
          </Callout>
        </Card>

        <Card>
          <CardHeader
            titre="Modèles servis"
            sousTitre="Réplicas déployés sur l’ensemble de la plateforme, tous clients confondus."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-g-300">
                  <th className="type-micro py-2 text-g-500">Modèle</th>
                  <th className="type-micro py-2 text-g-500">Matériel</th>
                  <th className="type-micro py-2 text-right text-g-500">Orgs</th>
                  <th className="type-micro py-2 text-right text-g-500">Jetons 30 j</th>
                  <th className="type-micro py-2 text-right text-g-500">Charge</th>
                </tr>
              </thead>
              <tbody>
                {FLOTTE_MODELES.map((m) => (
                  <tr key={m.slug} className="border-b border-g-100 last:border-0">
                    <td className="py-2.5">
                      <span className="block text-[13px] text-ink">
                        {modeleParSlug(m.slug)?.nom ?? m.slug}
                      </span>
                      <span className="block text-[11px] text-g-500">
                        {m.replicas} réplica{m.replicas > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-[12px] text-g-700">{m.gpu}</td>
                    <td className="tnum py-2.5 text-right text-[13px] text-g-700">{m.orgs}</td>
                    <td className="tnum py-2.5 text-right text-[13px] text-g-700">
                      {m.jetons30j > 0 ? jetons(m.jetons30j) : '—'}
                    </td>
                    <td className="py-2.5 text-right">
                      <Badge
                        tone={m.utilisationPct > 85 ? 'warn' : m.utilisationPct < 30 ? 'neutral' : 'ok'}
                        size="sm"
                      >
                        {pct(m.utilisationPct)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout ton="info" className="mt-4" titre="Pixtral sature à 88 % sur un nœud unique">
            Le modèle est en aperçu, donc sans engagement — mais trois organisations l’appellent déjà
            en production. Soit on l’élargit à deux réplicas et on le passe en disponibilité
            générale, soit on l’annonce comme non tenu. Le laisser tel quel est le seul choix qui ne
            se défend pas.
          </Callout>
        </Card>
      </div>

      <Card>
        <CardHeader
          titre="Agents et orchestration"
          sousTitre="La consommation ne vient plus seulement d’appels directs : deux tiers des jetons servis passent aujourd’hui par un agent ou un flux, ce qui change la nature de la charge — plus de petits appels enchaînés, moins de gros appels isolés."
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            libelle="Agents déployés"
            valeur={SYNTHESE_AGENTS_PLATEFORME.agents}
            detail={`${SYNTHESE_AGENTS_PLATEFORME.publies} publiés`}
          />
          <StatTile
            libelle="Flux d’orchestration"
            valeur={SYNTHESE_AGENTS_PLATEFORME.flux}
            detail={`${num(SYNTHESE_AGENTS_PLATEFORME.executions30j)} exécutions sur 30 j`}
          />
          <StatTile
            libelle="Trafic orchestré"
            valeur={pct(SYNTHESE_AGENTS_PLATEFORME.partOrchestreePct, 1)}
            ton="ok"
            detail="Part des jetons issus d’un agent"
          />
          <StatTile
            libelle="Outils déclarés"
            valeur={SYNTHESE_AGENTS_PLATEFORME.outilsDeclares}
            detail={`dont ${SYNTHESE_AGENTS_PLATEFORME.serveursMcp} serveurs MCP`}
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-g-300 bg-g-050">
                <th className="type-micro px-3 py-2.5 text-g-500">Organisation</th>
                <th className="type-micro px-3 py-2.5 text-right text-g-500">Agents</th>
                <th className="type-micro px-3 py-2.5 text-right text-g-500">Publiés</th>
                <th className="type-micro px-3 py-2.5 text-right text-g-500">Flux</th>
                <th className="type-micro px-3 py-2.5 text-right text-g-500">Exécutions 30 j</th>
                <th className="type-micro px-3 py-2.5 text-g-500">Canaux ouverts</th>
              </tr>
            </thead>
            <tbody>
              {AGENTS_PLATEFORME.map((o) => (
                <tr key={o.org} className="border-b border-g-100 last:border-0">
                  <td className="px-3 py-3 text-[13px] font-semibold text-ink">{o.org}</td>
                  <td className="tnum px-3 py-3 text-right text-[13px] text-g-700">{o.agents}</td>
                  <td className="tnum px-3 py-3 text-right text-[13px] text-g-700">{o.publies}</td>
                  <td className="tnum px-3 py-3 text-right text-[13px] text-g-700">{o.flux}</td>
                  <td className="tnum px-3 py-3 text-right text-[13px] font-semibold text-ink">
                    {num(o.executions30j)}
                  </td>
                  <td className="px-3 py-3 text-[12px] text-g-500">{o.canaux}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout ton="warn" className="mt-4" titre="Vingt-et-un agents créés ne sont jamais publiés">
          Sur 43 agents, 13 restent en brouillon — pour la plupart parce que leur jeu d’épreuves ne
          passe pas le seuil de 80 %. C’est le garde-fou qui fonctionne, mais c’est aussi une
          promesse commerciale non tenue chez le client. Un accompagnement sur la constitution des
          jeux d’épreuves aurait plus d’effet sur l’adoption que n’importe quelle remise.
        </Callout>
      </Card>

      <Card>
        <CardHeader
          titre="Contrats d’achat chez les fournisseurs externes"
          sousTitre="Prix moyens pondérés au million de jetons, en FCFA. La marge inclut le coût de la passerelle et du transit."
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-g-300 bg-g-050">
                <th className="type-micro px-3 py-2.5 text-g-500">Fournisseur</th>
                <th className="type-micro px-3 py-2.5 text-g-500">Résidence</th>
                <th className="type-micro px-3 py-2.5 text-right text-g-500">Engagement</th>
                <th className="type-micro px-3 py-2.5 text-right text-g-500">Consommé</th>
                <th className="type-micro px-3 py-2.5 text-right text-g-500">Achat / M</th>
                <th className="type-micro px-3 py-2.5 text-right text-g-500">Revente / M</th>
                <th className="type-micro px-3 py-2.5 text-right text-g-500">Marge</th>
                <th className="type-micro px-3 py-2.5 text-g-500">État</th>
              </tr>
            </thead>
            <tbody>
              {CONTRATS_FOURNISSEURS.map((c) => (
                <tr key={c.id} className="border-b border-g-100 last:border-0">
                  <td className="px-3 py-3">
                    <span className="block text-[13px] font-semibold text-ink">{c.fournisseur}</span>
                    <span className="block text-[11px] text-g-500">
                      Échéance {dateCourte(c.echeance)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={c.residence === 'États-Unis' ? 'warn' : 'neutral'} size="sm">
                      {c.residence}
                    </Badge>
                  </td>
                  <td className="tnum px-3 py-3 text-right text-[13px] text-g-700">
                    {money(c.engagementMensuel)}
                  </td>
                  <td
                    className={cn(
                      'tnum px-3 py-3 text-right text-[13px]',
                      c.consommeMois > c.engagementMensuel ? 'font-semibold text-warn' : 'text-g-700',
                    )}
                  >
                    {money(c.consommeMois)}
                  </td>
                  <td className="tnum px-3 py-3 text-right text-[13px] text-g-700">
                    {money(c.prixAchatMoyen)}
                  </td>
                  <td className="tnum px-3 py-3 text-right text-[13px] text-g-700">
                    {money(c.prixReventeMoyen)}
                  </td>
                  <td className="tnum px-3 py-3 text-right text-[13px] font-semibold text-ink">
                    {pct(c.margePct, 1)}
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={TON_CONTRAT[c.statut]} dot size="sm">
                      {LIBELLE_CONTRAT[c.statut]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <p className="type-micro mb-2 text-g-500">Répartition de l’achat externe</p>
            <StackedBar
              segments={CONTRATS_FOURNISSEURS.map((c, i) => ({
                label: c.fournisseur,
                valeur: c.consommeMois,
                couleur: ['var(--color-p-700)', 'var(--color-p-600)', 'var(--color-p-400)', 'var(--color-g-500)'][i],
              }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              libelle="Achat du mois"
              valeur={money(s.coutAchatExterne)}
              detail="Quatre contrats cadres"
            />
            <StatTile
              libelle="Revente estimée"
              valeur={money(Math.round(revente))}
              ton="ok"
              detail={`Marge brute ${money(Math.round(revente - s.coutAchatExterne))}`}
            />
          </div>
        </div>
        <Callout ton="warn" className="mt-4" titre="Mistral dépasse son engagement de 8,7 %">
          Le contrat prévoit 2 400 000 FCFA par mois ; nous en consommons 2 610 000. Le dépassement se
          facture hors palier, à un prix unitaire supérieur de 22 % — la marge sur ce fournisseur
          tombe donc sous les 28 % à la fin du mois. Renégocier le palier avant l’échéance de juin
          2027 vaut mieux que de router ailleurs : Mistral est le seul modèle externe hébergé en
          France, donc le seul autorisé sur les données de classe interne par plusieurs de nos clients.
        </Callout>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Callout ton="violet" titre="La souveraineté est aussi un argument de marge">
          Un jeton servi sur nos propres GPU coûte l’amortissement de la carte et l’électricité ; un
          jeton acheté chez un fournisseur étranger coûte son prix de gros. À{' '}
          {pct(s.partSouverainePct, 1)} de trafic souverain, la marge moyenne de l’activité IA tient
          largement au-dessus de celle de l’IaaS. Chaque point gagné sur cette part améliore les deux
          discours à la fois — celui du commerce et celui de la conformité.
        </Callout>
        <Callout
          ton="info"
          titre="Ce que le parc ne sait pas encore faire"
          action={
            <ButtonLink size="sm" variant="secondary" href="/admin/capacite">
              Voir la capacité générale
            </ButtonLink>
          }
        >
          Pas de partitionnement de carte : un client qui réserve une H100 la mobilise entière, même
          pour un modèle de douze milliards de paramètres. C’est la première source de gâchis
          identifiée sur le parc, et le chantier qui suit le remplacement des cartes défectueuses.
        </Callout>
      </div>
    </div>
  )
}
