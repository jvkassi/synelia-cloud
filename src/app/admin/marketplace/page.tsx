'use client'

import { useState } from 'react'
import { CheckCircle2, ExternalLink, PauseCircle, PlayCircle, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateCourte, dateHeure, num, pct, relatif } from '@/lib/format'
import {
  CAMPAGNES_MAJ,
  CATALOGUE,
  CONTRAT_INTEGRATION,
  PARC_INSTANCES,
  TACHES_PROVISIONING,
} from '@/lib/mock'
import { CATEGORIE_LABEL, SITE_COURT } from '@/lib/types'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction, SolutionLogo, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { ConfirmDialog } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { HealthBadge, StatTile } from '@/components/composition/metrics'
import { DataTable } from '@/components/composition/data-table'
import { useApp } from '@/components/app/contexte'
import type { CampagneMaj, InstanceParc } from '@/lib/mock'

const ONGLETS = [
  { id: 'catalogue', label: 'Catalogue de services' },
  { id: 'parc', label: 'Parc d’instances' },
  { id: 'campagnes', label: 'Campagnes de mise à jour' },
  { id: 'contrat', label: 'Contrat d’intégration' },
]

export default function MarketplaceAdmin() {
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('catalogue')
  const [arret, setArret] = useState<CampagneMaj | null>(null)

  const certifies = CATALOGUE.filter((c) => c.certifie)
  const enRetard = PARC_INSTANCES.filter((i) => i.derniereMaj < '2026-05-01')
  const degrades = PARC_INSTANCES.filter((i) => i.sante !== 'ok')
  const campagnesActives = CAMPAGNES_MAJ.filter((c) => c.statut === 'en_cours')

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Marketplace"
        sousTitre="Ces solutions sont des logiciels libres tiers, et le resteront. Nous les provisionnons, dimensionnons, sauvegardons, supervisons, mettons à jour et facturons — nous ne réimplémentons aucun de leurs écrans, et nous n’en modifions pas le code."
        actions={
          <GatedAction autorise={autorise('catalog.edit')} message={refus('catalog.edit')}>
            <Button iconBefore={<Rocket size={14} />}>Certifier une solution</Button>
          </GatedAction>
        }
        meta={
          <>
            <Badge tone="neutral" size="sm">
              {CATALOGUE.length} solutions au catalogue
            </Badge>
            <Badge tone="ok" size="sm">
              {certifies.length} certifiées
            </Badge>
            <Badge tone="neutral" size="sm">
              {PARC_INSTANCES.length} instances exploitées
            </Badge>
          </>
        }
      />

      {enRetard.length > 0 && (
        <Callout ton="warn" titre={`${enRetard.length} instances ont plus de trois mois de retard de version`}>
          {enRetard
            .slice(0, 3)
            .map((i) => `${i.serviceNom} chez ${i.orgNom} (${i.version})`)
            .join(' · ')}
          {enRetard.length > 3 ? ` et ${enRetard.length - 3} autres` : ''}. Une version en retard
          accumule les correctifs de sécurité non appliqués. Une campagne de rattrapage par vagues, avec
          point d’arrêt, est la manœuvre la moins risquée.
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile libelle="Solutions certifiées" valeur={certifies.length} ton="ok" detail={`sur ${CATALOGUE.length} au catalogue`} />
        <StatTile libelle="Instances exploitées" valeur={PARC_INSTANCES.length} />
        <StatTile
          libelle="Instances dégradées"
          valeur={degrades.length}
          ton={degrades.length > 0 ? 'warn' : 'ok'}
        />
        <StatTile
          libelle="Retard de version"
          valeur={enRetard.length}
          ton={enRetard.length > 0 ? 'warn' : 'ok'}
          detail="Plus de 3 mois"
        />
        <StatTile
          libelle="Campagnes en cours"
          valeur={campagnesActives.length}
          ton={campagnesActives.length > 0 ? 'info' : 'ok'}
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'catalogue' && (
        <div className="space-y-4">
          <Callout ton="violet" titre="Ce que « certifiée » veut dire chez nous">
            La solution est déployable en un clic, sauvegardée par une politique éprouvée, supervisée
            par des sondes que nous avons écrites, raccordée à l’authentification unique, montée de
            version par vagues avec point d’arrêt, et exportable dans un format documenté que nous
            avons testé. Sans ces six points, une solution reste au catalogue en tant que
            « disponible », pas « certifiée ».
          </Callout>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {CATALOGUE.map((c) => {
              const instances = PARC_INSTANCES.filter((i) => i.catalogSlug === c.slug)
              return (
                <Card key={c.slug} className="flex flex-col" hover>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <SolutionLogo initiales={c.logoInitiales} teinte={c.logoTeinte} size="md" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-bold text-ink">{c.nom}</span>
                        <span className="block truncate text-[11px] text-g-500">{c.solutionOSS}</span>
                      </span>
                    </span>
                    {c.certifie ? (
                      <Badge tone="ok" size="sm">
                        Certifiée
                      </Badge>
                    ) : (
                      <Badge tone="warn" size="sm">
                        Disponible
                      </Badge>
                    )}
                  </div>

                  <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-g-700">
                    {c.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    <Badge tone="violet" size="sm">
                      {CATEGORIE_LABEL[c.categorie]}
                    </Badge>
                    {c.modes.map((m) => (
                      <Badge key={m} tone="neutral" size="sm">
                        {m === 'dedie' ? 'Dédié' : 'Mutualisé'}
                      </Badge>
                    ))}
                    <Badge tone="neutral" size="sm">
                      {c.paliers.length} paliers
                    </Badge>
                  </div>

                  <dl className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-g-100 pt-3">
                    <div>
                      <dt className="type-micro text-g-500">Instances</dt>
                      <dd className="tnum mt-0.5 text-[12px] font-semibold text-ink">
                        {instances.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="type-micro text-g-500">Engagement</dt>
                      <dd className="mt-0.5 text-[12px] text-ink">{c.sla}</dd>
                    </div>
                    <div>
                      <dt className="type-micro text-g-500">Versions suivies</dt>
                      <dd className="mt-0.5 truncate font-mono text-[11px] text-ink">
                        {c.versionsSupportees.join(', ')}
                      </dd>
                    </div>
                    <div>
                      <dt className="type-micro text-g-500">Réversibilité</dt>
                      <dd className="mt-0.5 truncate text-[11.5px] text-ink">
                        {c.reversibilite.formats[0]}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-g-100 pt-3.5">
                    <Button size="sm" variant="secondary">
                      Fiche technique
                    </Button>
                    <ButtonLink
                      size="sm"
                      variant="ghost"
                      external
                      href={c.urlDemo}
                      iconAfter={<ExternalLink size={11} />}
                    >
                      Projet amont
                    </ButtonLink>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {onglet === 'parc' && (
        <Card padding={false}>
          <div className="p-4">
            <DataTable<InstanceParc>
              lignes={PARC_INSTANCES}
              exportable
              parPage={12}
              densiteInitiale="compacte"
              placeholderRecherche="Rechercher une instance, une organisation, un service…"
              filtres={[
                {
                  id: 'service',
                  libelle: 'Service',
                  options: [
                    { value: 'tous', label: 'Tous les services' },
                    ...[...new Set(PARC_INSTANCES.map((i) => i.catalogSlug))].map((s) => ({
                      value: s,
                      label: CATALOGUE.find((c) => c.slug === s)?.nom ?? s,
                    })),
                  ],
                },
                {
                  id: 'sante',
                  libelle: 'Santé',
                  options: [
                    { value: 'tous', label: 'Toutes' },
                    { value: 'ok', label: 'Saine' },
                    { value: 'degrade', label: 'Dégradée' },
                    { value: 'maintenance', label: 'En maintenance' },
                    { value: 'erreur', label: 'En erreur' },
                  ],
                },
                {
                  id: 'mode',
                  libelle: 'Mode',
                  options: [
                    { value: 'tous', label: 'Tous les modes' },
                    { value: 'dedie', label: 'Dédié' },
                    { value: 'mutualise', label: 'Mutualisé' },
                  ],
                },
              ]}
              selection={(l, fid, val) =>
                fid === 'service'
                  ? l.catalogSlug === val
                  : fid === 'sante'
                    ? l.sante === val
                    : fid === 'mode'
                      ? l.mode === val
                      : true
              }
              colonnes={[
                {
                  id: 'service',
                  entete: 'Instance',
                  cle: (i) => `${i.serviceNom} ${i.orgNom}`,
                  rendu: (i) => {
                    const c = CATALOGUE.find((x) => x.slug === i.catalogSlug)
                    return (
                      <span className="flex items-center gap-2">
                        {c && (
                          <SolutionLogo initiales={c.logoInitiales} teinte={c.logoTeinte} size="sm" />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] font-semibold text-ink">
                            {i.serviceNom}
                          </span>
                          <span className="block truncate text-[10.5px] text-g-500">{i.orgNom}</span>
                        </span>
                      </span>
                    )
                  },
                },
                {
                  id: 'mode',
                  entete: 'Mode',
                  cle: (i) => i.mode,
                  rendu: (i) => (
                    <Badge tone={i.mode === 'dedie' ? 'violet' : 'neutral'} size="sm">
                      {i.mode === 'dedie' ? 'Dédié' : 'Mutualisé'}
                    </Badge>
                  ),
                },
                {
                  id: 'site',
                  entete: 'Site',
                  cle: (i) => i.site,
                  rendu: (i) => (
                    <span className="text-[11.5px] text-g-700">{SITE_COURT[i.site]}</span>
                  ),
                },
                {
                  id: 'version',
                  entete: 'Version',
                  cle: (i) => i.version,
                  rendu: (i) => (
                    <span className="font-mono text-[11.5px] text-ink">{i.version}</span>
                  ),
                },
                {
                  id: 'sieges',
                  entete: 'Sièges',
                  aligne: 'right',
                  cle: (i) => i.sieges,
                  rendu: (i) => <span className="tnum text-[11.5px] text-g-700">{i.sieges}</span>,
                },
                {
                  id: 'sauvegarde',
                  entete: 'Dernière sauvegarde',
                  cle: (i) => i.derniereSauvegarde,
                  rendu: (i) => (
                    <span className="text-[11.5px] text-g-500">
                      {relatif(i.derniereSauvegarde)}
                    </span>
                  ),
                },
                {
                  id: 'maj',
                  entete: 'Dernière mise à jour',
                  cle: (i) => i.derniereMaj,
                  rendu: (i) => (
                    <span
                      className={cn(
                        'text-[11.5px]',
                        i.derniereMaj < '2026-05-01' ? 'font-semibold text-warn' : 'text-g-500',
                      )}
                    >
                      {dateCourte(i.derniereMaj)}
                    </span>
                  ),
                },
                {
                  id: 'sante',
                  entete: 'Santé',
                  cle: (i) => i.sante,
                  rendu: (i) => (
                    <HealthBadge etat={i.sante === 'erreur' ? 'erreur' : i.sante} size="sm" />
                  ),
                },
                {
                  id: 'actions',
                  entete: '',
                  aligne: 'right',
                  rendu: (i) => (
                    <span className="flex items-center justify-end gap-1.5">
                      <ButtonLink
                        size="sm"
                        variant="ghost"
                        href={`/admin/organisations/${i.orgId}`}
                      >
                        Organisation
                      </ButtonLink>
                      {i.derniereMaj < '2026-05-01' && (
                        <GatedAction
                          autorise={autorise('catalog.edit')}
                          message={refus('catalog.edit')}
                        >
                          <Button size="sm" variant="secondary">
                            Planifier la mise à jour
                          </Button>
                        </GatedAction>
                      )}
                    </span>
                  ),
                },
              ]}
              vide={{
                titre: 'Aucune instance',
                phrase: 'Le parc se remplit dès la première souscription à un service managé.',
              }}
            />
          </div>
        </Card>
      )}

      {onglet === 'campagnes' && (
        <div className="space-y-4">
          <Callout ton="violet" titre="Une mise à jour par vagues, avec point d’arrêt">
            Nous ne mettons jamais à jour tout le parc d’un coup. Une instance pilote d’abord, un
            palier intermédiaire ensuite, le reste en dernier. Entre chaque vague, un point d’arrêt :
            si la vague précédente a produit une anomalie, la campagne s’arrête d’elle-même et rien de
            plus n’est touché.
          </Callout>

          {CAMPAGNES_MAJ.map((c) => {
            const solution = CATALOGUE.find((x) => x.slug === c.catalogSlug)
            return (
              <Card
                key={c.id}
                className={cn(
                  c.statut === 'en_cours'
                    ? 'border-info/40'
                    : c.statut === 'arretee'
                      ? 'border-err/40'
                      : '',
                )}
              >
                <CardHeader
                  titre={
                    <span className="flex flex-wrap items-center gap-2">
                      {solution && (
                        <SolutionLogo initiales={solution.logoInitiales} teinte={solution.logoTeinte} size="sm" />
                      )}
                      <span>{c.nom}</span>
                    </span>
                  }
                  sousTitre={`Version cible ${c.versionCible} · fenêtre ${c.fenetre} · ${c.instances} instances`}
                  actions={
                    <span className="flex flex-wrap items-center gap-1.5">
                      {c.pointArret && (
                        <Badge tone="violet" size="sm">
                          Point d’arrêt entre vagues
                        </Badge>
                      )}
                      <Badge
                        tone={
                          c.statut === 'terminee'
                            ? 'ok'
                            : c.statut === 'en_cours'
                              ? 'info'
                              : c.statut === 'arretee'
                                ? 'err'
                                : 'neutral'
                        }
                        dot
                        size="sm"
                      >
                        {c.statut === 'terminee'
                          ? 'Terminée'
                          : c.statut === 'en_cours'
                            ? 'En cours'
                            : c.statut === 'arretee'
                              ? 'Arrêtée'
                              : 'Planifiée'}
                      </Badge>
                    </span>
                  }
                />

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {c.vagues.map((v) => (
                    <div
                      key={v.numero}
                      className={cn(
                        'rounded-[8px] border px-3.5 py-3',
                        v.statut === 'terminee'
                          ? 'border-ok/40 bg-ok-bg'
                          : v.statut === 'en_cours'
                            ? 'border-info/40 bg-info-bg'
                            : v.statut === 'arretee'
                              ? 'border-err/40 bg-err-bg'
                              : 'border-g-300',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12.5px] font-bold text-ink">Vague {v.numero}</span>
                        {v.statut === 'terminee' ? (
                          <CheckCircle2 size={14} className="shrink-0 text-ok" />
                        ) : v.statut === 'en_cours' ? (
                          <PlayCircle size={14} className="shrink-0 text-info" />
                        ) : v.statut === 'arretee' ? (
                          <PauseCircle size={14} className="shrink-0 text-err" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11.5px] text-g-700">
                        {v.instances} instance{v.instances > 1 ? 's' : ''}
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-g-500">
                        {v.statut === 'terminee'
                          ? 'Appliquée et vérifiée'
                          : v.statut === 'en_cours'
                            ? 'En cours d’application'
                            : v.statut === 'arretee'
                              ? 'Arrêtée par le point de contrôle'
                              : 'En attente de la vague précédente'}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-g-100 pt-4">
                  {c.statut === 'planifiee' && (
                    <GatedAction autorise={autorise('catalog.edit')} message={refus('catalog.edit')}>
                      <Button
                        size="sm"
                        iconBefore={<PlayCircle size={13} />}
                        onClick={() =>
                          pousser({
                            ton: 'info',
                            titre: `${c.nom} démarrée`,
                            detail: 'La vague 1 démarre. Un snapshot est pris avant chaque instance, et le point d’arrêt bloquera la suite en cas d’anomalie.',
                          })
                        }
                      >
                        Démarrer la campagne
                      </Button>
                    </GatedAction>
                  )}
                  {c.statut === 'en_cours' && (
                    <>
                      <GatedAction
                        autorise={autorise('catalog.edit')}
                        message={refus('catalog.edit')}
                      >
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            pousser({
                              ton: 'ok',
                              titre: 'Vague suivante autorisée',
                              detail: 'Le point d’arrêt est levé. La vague suivante démarre à la prochaine fenêtre.',
                            })
                          }
                        >
                          Lever le point d’arrêt
                        </Button>
                      </GatedAction>
                      <Button
                        size="sm"
                        variant="ghost"
                        iconBefore={<PauseCircle size={13} />}
                        onClick={() => setArret(c)}
                      >
                        Arrêter la campagne
                      </Button>
                    </>
                  )}
                  {c.statut === 'arretee' && (
                    <Callout ton="err" titre="Campagne arrêtée par le point de contrôle">
                      Une anomalie a été détectée sur la vague en cours. Les instances déjà mises à
                      jour peuvent être ramenées à leur version antérieure depuis le snapshot pris
                      avant l’opération. Les instances non encore touchées ne l’ont pas été.
                    </Callout>
                  )}
                  <span className="text-[11.5px] text-g-500">
                    Un snapshot est pris avant chaque instance ; le retour arrière reste possible
                    pendant sept jours.
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {onglet === 'contrat' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Contrat d’intégration"
              sousTitre="Les neuf capacités qu’une solution doit exposer pour être certifiée. Chacune correspond à un écran du portail — et à rien d’autre : nous n’ajoutons jamais un dixième écran qui refait l’interface de la solution."
            />
            <div className="overflow-x-auto rounded-[8px] border border-g-300">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['#', 'Capacité', 'Écran du portail', 'Couverture du parc'].map((h) => (
                      <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CONTRAT_INTEGRATION.map((c) => {
                    const couverture = [100, 100, 100, 92, 100, 100, 100, 85, 77][c.num - 1]
                    return (
                      <tr key={c.num} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-p-050 text-[11px] font-bold text-p-700">
                            {c.num}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[12.5px] text-ink">{c.capacite}</td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-700">{c.ecran}</td>
                        <td className="w-48 px-3 py-2.5">
                          <span className="flex items-center gap-2">
                            <span className="relative block h-2 flex-1 overflow-hidden rounded-full bg-g-100">
                              <span
                                className={cn(
                                  'absolute inset-y-0 left-0 rounded-full',
                                  couverture === 100 ? 'bg-ok' : 'bg-warn',
                                )}
                                style={{ width: `${couverture}%` }}
                              />
                            </span>
                            <span
                              className={cn(
                                'tnum shrink-0 text-[11.5px] font-semibold',
                                couverture === 100 ? 'text-ok' : 'text-warn',
                              )}
                            >
                              {pct(couverture)}
                            </span>
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Callout ton="warn" className="mt-4" titre="Deux capacités ne sont pas encore couvertes partout">
              La réversibilité testée n’atteint que 77 % du catalogue : sur trois solutions, l’export
              existe mais nous ne l’avons pas encore validé par un test de réimport complet. Tant que
              ce test n’est pas fait, nous ne présentons pas la réversibilité comme acquise pour ces
              solutions. La montée de version par vagues plafonne à 85 % pour la même raison.
            </Callout>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Orchestrateur de provisioning"
                sousTitre="Les sept tâches exécutées à chaque souscription, dans cet ordre. Une tâche en échec arrête la séquence et déclenche le nettoyage des ressources déjà créées."
              />
              <ol className="space-y-2">
                {TACHES_PROVISIONING.map((t, i) => (
                  <li
                    key={t}
                    className="flex items-center gap-3 rounded-[6px] border border-g-300 px-3 py-2"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-p-050 text-[11px] font-bold text-p-700">
                      {i + 1}
                    </span>
                    <span className="min-w-0 text-[12.5px] text-ink">{t}</span>
                    <Badge tone="ok" size="sm" className="ml-auto shrink-0">
                      Idempotente
                    </Badge>
                  </li>
                ))}
              </ol>
              <Callout ton="info" className="mt-4" titre="Idempotente veut dire rejouable">
                Une tâche rejouée sur un système déjà dans l’état attendu ne fait rien et ne casse
                rien. C’est ce qui permet de reprendre un provisionnement à l’étape échouée plutôt que
                de tout recommencer, et de ne jamais créer deux fois la même ressource.
              </Callout>
            </Card>

            <Card>
              <CardHeader
                titre="Ce que nous ne faisons pas"
                sousTitre="La limite est aussi importante que la capacité."
              />
              <div className="space-y-2">
                {[
                  {
                    t: 'Nous ne modifions pas le code des solutions',
                    d: 'Aucun correctif maison, aucune extension propriétaire. Une solution modifiée devient impossible à mettre à jour, et son export cesse d’être compatible avec le projet amont.',
                  },
                  {
                    t: 'Nous ne réimplémentons aucun de leurs écrans',
                    d: 'Pas d’explorateur de fichiers, pas de webmail, pas d’écran métier d’ERP, pas d’éditeur de contenu. Le bouton « Ouvrir » mène à l’interface de la solution, en session déjà ouverte.',
                  },
                  {
                    t: 'Nous n’accédons pas au contenu des données',
                    d: 'Les fichiers, les courriels, les écritures comptables ne sont pas lisibles depuis le portail super admin. Une intervention exige une élévation nominative, autorisée par le client.',
                  },
                  {
                    t: 'Nous ne verrouillons pas la sortie',
                    d: 'Chaque solution certifiée dispose d’un export dans son format natif, documenté, testé par un réimport réel. Partir doit rester techniquement simple.',
                  },
                ].map((x) => (
                  <div key={x.t} className="rounded-[6px] border border-p-300 bg-p-050 px-3 py-2.5">
                    <p className="text-[12.5px] font-semibold text-ink">{x.t}</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-700">{x.d}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              titre="Réversibilité par solution"
              sousTitre="Format d’export, délai de mise à disposition, et si le réimport a été réellement testé."
            />
            <div className="overflow-x-auto rounded-[8px] border border-g-300">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Solution', 'Formats de sortie', 'Délai', 'Réimport testé'].map((h) => (
                      <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATALOGUE.map((c, i) => (
                    <tr key={c.slug} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2">
                          <SolutionLogo initiales={c.logoInitiales} teinte={c.logoTeinte} size="sm" />
                          <span className="min-w-0">
                            <span className="block text-[12px] font-semibold text-ink">{c.nom}</span>
                            <span className="block text-[10.5px] text-g-500">{c.solutionOSS}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex flex-wrap gap-1">
                          {c.reversibilite.formats.map((f) => (
                            <Badge key={f} tone="neutral" size="sm">
                              {f}
                            </Badge>
                          ))}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-g-700">
                        {c.reversibilite.delaiJours} jour{c.reversibilite.delaiJours > 1 ? 's' : ''}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={i % 6 === 5 ? 'warn' : 'ok'} size="sm">
                          {i % 6 === 5 ? 'Non testé' : 'Testé'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={arret !== null}
        onClose={() => setArret(null)}
        titre="Arrêter une campagne de mise à jour"
        ressource={arret?.nom ?? ''}
        libelleAction="Arrêter la campagne"
        pertes={[
          'Les vagues non démarrées ne seront pas exécutées',
          'Les instances déjà mises à jour restent sur la nouvelle version',
          'Le parc se retrouve avec deux versions en production, ce qui complique le support',
        ]}
        onConfirm={() => {
          pousser({
            ton: 'warn',
            titre: `${arret?.nom} arrêtée`,
            detail: 'Les instances déjà traitées peuvent être ramenées à leur version antérieure depuis leur snapshot, pendant sept jours.',
          })
          setArret(null)
        }}
      />
    </div>
  )
}
