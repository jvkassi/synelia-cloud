'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ban, KeyRound, Pause, Play, ShieldAlert, UserCog } from 'lucide-react'
import { cn, trendSeries } from '@/lib/utils'
import { dateCourte, dateHeure, goHumain, money, num, pct, relatif } from '@/lib/format'
import {
  AUDIT,
  ESPACES,
  FACTURES,
  IMPAYES,
  ORGANISATIONS,
  SERVICES_MANAGES,
  SOUSCRIPTIONS,
  TICKETS_PLATEFORME,
  USERS,
  membresDeLOrg,
} from '@/lib/mock'
import { MOYEN_LABEL, ROLE_LABEL, SITE_COURT, type Role } from '@/lib/types'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Avatar, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/field'
import { ConfirmDialog, Modal } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { QuotaBar, StatTile } from '@/components/composition/metrics'
import { Timeline } from '@/components/composition/flow'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'synthese', label: 'Synthèse' },
  { id: 'ressources', label: 'Ressources' },
  { id: 'membres', label: 'Membres' },
  { id: 'facturation', label: 'Facturation' },
  { id: 'support', label: 'Support' },
  { id: 'audit', label: 'Audit' },
  { id: 'administration', label: 'Administration' },
]

export function VueOrganisation({ id }: { id: string }) {
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('synthese')
  const [elevation, setElevation] = useState(false)
  const [suspension, setSuspension] = useState(false)

  const org = ORGANISATIONS.find((o) => o.id === id)!
  const membres = membresDeLOrg(org.id)
  const factures = FACTURES.filter((f) => f.orgId === org.id)
  const impayees = factures.filter((f) => f.statut === 'impayee')
  const tickets = TICKETS_PLATEFORME.filter((t) => t.orgId === org.id)
  const audit = AUDIT.filter((a) => a.orgId === org.id)
  const espaces = org.id === 'org-dba' ? ESPACES : []
  const services = org.id === 'org-dba' ? SERVICES_MANAGES : []
  const souscriptions = SOUSCRIPTIONS.filter((s) => s.orgId === org.id)
  const impayeReleve = IMPAYES.find((i) => i.org === org.nom)

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace super admin', href: '/admin' },
          { label: 'Organisations', href: '/admin/organisations' },
          { label: org.nom },
        ]}
        titre={org.nom}
        sousTitre={`${org.pays}${org.secteur ? ` · ${org.secteur}` : ''} · cliente en direct depuis le ${dateCourte(org.createdAt)}`}
        meta={
          <>
            <Badge
              tone={org.statut === 'active' ? 'ok' : org.statut === 'suspendue' ? 'warn' : 'neutral'}
              dot
              size="sm"
            >
              {org.statut === 'active'
                ? 'Active'
                : org.statut === 'suspendue'
                  ? 'Suspendue'
                  : 'Fermée'}
            </Badge>
            {org.tenantPlan && (
              <Badge tone="neutral" size="sm">
                Plan {org.tenantPlan}
              </Badge>
            )}
            <Badge tone="neutral" size="sm">
              {org.id}
            </Badge>
          </>
        }
        actions={
          <>
            <GatedAction autorise={autorise('org.manage')} message={refus('org.manage')}>
              <Button
                variant="secondary"
                iconBefore={<UserCog size={14} />}
                onClick={() => setElevation(true)}
              >
                Demander une élévation
              </Button>
            </GatedAction>
            <GatedAction autorise={autorise('org.manage')} message={refus('org.manage')}>
              <Button
                variant={org.statut === 'active' ? 'ghost' : 'secondary'}
                iconBefore={org.statut === 'active' ? <Pause size={13} /> : <Play size={13} />}
                onClick={() => setSuspension(true)}
              >
                {org.statut === 'active' ? 'Suspendre' : 'Réactiver'}
              </Button>
            </GatedAction>
          </>
        }
      />

      <Callout ton="violet" titre="Vous ne voyez ici que des métadonnées">
        Nombre de ressources, quotas, montants, tickets, journal d’audit. Le contenu des données du
        client — fichiers, courriels, bases, dépôts — n’est pas accessible depuis cet écran, et ne le
        devient qu’avec une élévation nominative et bornée, visible dans le journal d’audit du client.
      </Callout>

      {impayeReleve && (
        <Callout ton="err" titre={`Impayé de ${money(impayeReleve.montant)}`}>
          Facture {impayeReleve.facture}, {impayeReleve.retardJours} jours de retard,{' '}
          {impayeReleve.relances} relance{impayeReleve.relances > 1 ? 's' : ''} envoyée
          {impayeReleve.relances > 1 ? 's' : ''}. Avant d’envisager une suspension, un appel et une
          proposition d’échelonnement sont la marche à suivre — c’est notre engagement, et c’est aussi
          ce qui récupère le plus de créances.
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatTile libelle="Espaces Cloud" valeur={org.espaces ?? 0} />
        <StatTile libelle="Utilisateurs" valeur={org.utilisateurs ?? 0} detail={`${membres.length} membres connus`} />
        <StatTile
          libelle="vCPU alloué"
          valeur={num(org.consommationVcpu ?? 0)}
          serie={trendSeries(`org-${org.id}-vcpu`, 30, (org.consommationVcpu ?? 0) * 0.7, org.consommationVcpu ?? 0)}
        />
        <StatTile
          libelle="CA mensuel"
          valeur={org.caMensuel ? money(org.caMensuel) : '—'}
          ton="ok"
        />
        <StatTile
          libelle="Factures impayées"
          valeur={impayees.length}
          ton={impayees.length > 0 ? 'err' : 'ok'}
        />
        <StatTile
          libelle="Tickets ouverts"
          valeur={tickets.filter((t) => !['resolu', 'ferme'].includes(t.statut)).length}
          ton={tickets.some((t) => t.gravite === 'critique') ? 'err' : 'violet'}
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'synthese' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader titre="Fiche" />
            <KeyValueList
              colonnes={1}
              items={[
                { cle: 'Identifiant', valeur: org.id },
                { cle: 'Raison sociale', valeur: org.nom },
                { cle: 'Pays', valeur: org.pays },
                { cle: 'Secteur', valeur: org.secteur ?? '—' },
                { cle: 'Numéro de contribuable', valeur: org.tva ?? '—' },
                { cle: 'Domaine principal', valeur: org.domaine ?? '—' },
                { cle: 'Plan de service', valeur: org.tenantPlan ?? 'Standard' },
                { cle: 'Contrat', valeur: 'Direct, sans intermédiaire' },
                { cle: 'Créée le', valeur: dateCourte(org.createdAt) },
                { cle: 'Royaume d’identité', valeur: `identite.synelia.cloud/realms/${org.id}` },
              ]}
            />
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader
                titre="Consommation face aux quotas"
                sousTitre="Une organisation qui frôle son quota doit être contactée avant d’être bloquée."
              />
              {espaces.length === 0 ? (
                <p className="rounded-[6px] border border-dashed border-g-300 px-3 py-4 text-center text-[12px] text-g-500">
                  Le détail des quotas de cette organisation n’est pas chargé dans cette vue.
                </p>
              ) : (
                <div className="space-y-3">
                  <QuotaBar
                    libelle="Processeur"
                    utilise={espaces.reduce((a, e) => a + e.usage.vcpu, 0)}
                    total={espaces.reduce((a, e) => a + e.quota.vcpu, 0)}
                    unite="vCPU"
                    seuil={85}
                    formateur={(v) => num(v)}
                  />
                  <QuotaBar
                    libelle="Mémoire"
                    utilise={espaces.reduce((a, e) => a + e.usage.ramGo, 0)}
                    total={espaces.reduce((a, e) => a + e.quota.ramGo, 0)}
                    unite="Go"
                    seuil={85}
                    formateur={(v) => num(v)}
                  />
                  <QuotaBar
                    libelle="Stockage"
                    utilise={Math.round(espaces.reduce((a, e) => a + e.usage.stockageTo, 0) * 10) / 10}
                    total={espaces.reduce((a, e) => a + e.quota.stockageTo, 0)}
                    unite="To"
                    seuil={85}
                  />
                </div>
              )}
              <ButtonLink size="sm" variant="ghost" className="mt-3.5" href="/admin/capacite">
                Voir le placement de cette organisation
              </ButtonLink>
            </Card>

            <Card>
              <CardHeader titre="Souscriptions" sousTitre="Engagements en cours." />
              {souscriptions.length === 0 ? (
                <p className="rounded-[6px] border border-dashed border-g-300 px-3 py-4 text-center text-[12px] text-g-500">
                  Aucune souscription active.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {souscriptions.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-b border-g-100 pb-1.5 last:border-0"
                    >
                      <span className="min-w-0 truncate text-[12px] text-ink">{s.cible.label}</span>
                      <span className="tnum shrink-0 text-[12px] font-semibold text-ink">
                        {money(s.quantite * s.prixApplique)}
                        <span className="ml-1.5 text-[10px] font-normal text-g-500">
                          {s.periodicite === 'annuelle' ? 'annuel' : 'mensuel'}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {onglet === 'ressources' && (
        <div className="space-y-4">
          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3.5">
              <CardHeader
                titre="Espaces Cloud"
                sousTitre="Nom, quota, usage, site physique et plage réseau. Le contenu des machines n’est pas visible d’ici."
                className="mb-0"
              />
            </div>
            {espaces.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12.5px] text-g-500">
                Aucun Espace Cloud chargé pour cette organisation dans cette vue de démonstration.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse">
                  <thead>
                    <tr className="border-b border-g-300 bg-g-050">
                      {['Espace', 'Offre', 'Site', 'Réseau', 'vCPU', 'Mémoire', 'Stockage', 'Projets', 'Statut'].map(
                        (h) => (
                          <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {espaces.map((e) => (
                      <tr key={e.id} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5 font-mono text-[12px] font-semibold text-ink">
                          {e.code}
                        </td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-700">{e.offreNom}</td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-700">{SITE_COURT[e.site]}</td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-g-500">{e.cidr}</td>
                        <td className="tnum px-3 py-2.5 text-[11.5px] text-g-700">
                          {e.usage.vcpu}/{e.quota.vcpu}
                        </td>
                        <td className="tnum px-3 py-2.5 text-[11.5px] text-g-700">
                          {e.usage.ramGo}/{e.quota.ramGo} Go
                        </td>
                        <td className="tnum px-3 py-2.5 text-[11.5px] text-g-700">
                          {e.usage.stockageTo}/{e.quota.stockageTo} To
                        </td>
                        <td className="tnum px-3 py-2.5 text-[11.5px] text-g-700">{e.projets}</td>
                        <td className="px-3 py-2.5">
                          <Badge tone={e.statut === 'active' ? 'ok' : 'warn'} dot size="sm">
                            {e.statut === 'active'
                              ? 'Active'
                              : e.statut === 'suspendue'
                                ? 'Suspendue'
                                : 'Provisioning'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {services.length > 0 && (
            <Card padding={false}>
              <div className="border-b border-g-100 px-4 py-3.5">
                <CardHeader
                  titre="Services managés souscrits"
                  sousTitre="Nous exploitons ces solutions tierces. Nous n’accédons pas à leur contenu."
                  className="mb-0"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse">
                  <thead>
                    <tr className="border-b border-g-300 bg-g-050">
                      {['Service', 'Mode', 'Version', 'Sièges', 'Site', 'SSO', 'Statut'].map((h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.id} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5">
                          <span className="block text-[12.5px] font-semibold text-ink">{s.nom}</span>
                          <span className="block font-mono text-[10.5px] text-g-500">
                            {s.domaine}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone={s.mode === 'dedie' ? 'violet' : 'neutral'} size="sm">
                            {s.mode === 'dedie' ? 'Dédié' : 'Mutualisé'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-g-700">
                          {s.version}
                          {s.versionDisponible && (
                            <Badge tone="accent" size="sm" className="ml-1.5">
                              {s.versionDisponible} dispo
                            </Badge>
                          )}
                        </td>
                        <td className="tnum px-3 py-2.5 text-[11.5px] text-g-700">
                          {s.siegesUtilises}/{s.siegesSouscrits}
                        </td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-700">{SITE_COURT[s.site]}</td>
                        <td className="px-3 py-2.5">
                          <Badge tone={s.sso.actif ? 'accent' : 'warn'} size="sm">
                            {s.sso.actif ? 'Actif' : 'Absent'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            tone={
                              s.statut === 'operationnel'
                                ? 'ok'
                                : s.statut === 'erreur'
                                  ? 'err'
                                  : 'warn'
                            }
                            dot
                            size="sm"
                          >
                            {s.statut}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {onglet === 'membres' && (
        <Card padding={false}>
          <div className="border-b border-g-100 px-4 py-3.5">
            <CardHeader
              titre="Membres de l’organisation"
              sousTitre="Nous voyons les identités et leurs rôles, jamais leurs mots de passe — ils n’existent pas chez nous."
              className="mb-0"
            />
          </div>
          {membres.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12.5px] text-g-500">
              Aucun membre chargé pour cette organisation dans cette vue de démonstration.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Membre', 'Rôle', 'Portée', 'Identité', 'Deuxième facteur', 'Dernière connexion'].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {membres.map(({ membership: m, user: u }) => (
                    <tr key={m.id} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2.5">
                          <Avatar nom={u.nom} size="sm" />
                          <span className="min-w-0">
                            <span className="block text-[12.5px] font-semibold text-ink">
                              {u.nom}
                            </span>
                            <span className="block text-[10.5px] text-g-500">{u.email}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={m.role === 'org_admin' ? 'violet' : 'neutral'} size="sm">
                          {ROLE_LABEL[m.role]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-g-700">
                        {m.scopeLabel ?? 'Toute l’organisation'}
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-g-700">
                        {u.idpSource === 'local' ? 'Compte Synelia' : u.idpSource.toUpperCase()}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={u.mfaEnabled ? 'ok' : 'warn'} size="sm">
                          {u.mfaEnabled ? 'Actif' : 'Absent'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-g-500">
                        {u.lastLoginAt ? relatif(u.lastLoginAt) : 'Jamais'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-g-100 px-4 py-3">
            <p className="text-[11.5px] leading-relaxed text-g-500">
              Nous ne modifions jamais les rôles d’une organisation à sa place. Si un client perd
              l’accès de son dernier administrateur, la procédure de récupération exige une
              vérification d’identité auprès du signataire du contrat, et l’opération est journalisée
              dans son audit.
            </p>
          </div>
        </Card>
      )}

      {onglet === 'facturation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <StatTile
              libelle="CA mensuel"
              valeur={org.caMensuel ? money(org.caMensuel) : '—'}
              ton="ok"
            />
            <StatTile
              libelle="Factures émises"
              valeur={factures.filter((f) => f.statut !== 'brouillon').length}
            />
            <StatTile
              libelle="Impayées"
              valeur={impayees.length}
              ton={impayees.length > 0 ? 'err' : 'ok'}
              detail={
                impayees.length > 0
                  ? money(impayees.reduce((a, f) => a + f.total, 0))
                  : 'Aucun impayé'
              }
            />
            <StatTile
              libelle="Souscriptions"
              valeur={souscriptions.length}
              detail={`${souscriptions.filter((s) => s.periodicite === 'annuelle').length} annuelles`}
            />
          </div>

          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3.5">
              <CardHeader titre="Factures" className="mb-0" />
            </div>
            {factures.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12.5px] text-g-500">
                Aucune facture pour cette organisation.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse">
                  <thead>
                    <tr className="border-b border-g-300 bg-g-050">
                      {['Numéro', 'Période', 'Hors taxes', 'Total TTC', 'Échéance', 'Règlement', 'Statut', ''].map(
                        (h) => (
                          <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {factures.map((f) => (
                      <tr key={f.id} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5 font-mono text-[12px] font-semibold text-ink">
                          {f.numero}
                        </td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-700">{f.periode}</td>
                        <td className="tnum px-3 py-2.5 text-[11.5px] text-g-700">
                          {money(f.sousTotal, f.devise)}
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12px] font-bold text-ink">
                          {money(f.total, f.devise)}
                        </td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-700">
                          {f.echeance ? dateCourte(f.echeance) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-700">
                          {f.moyen ? MOYEN_LABEL[f.moyen] : '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            tone={
                              f.statut === 'payee'
                                ? 'ok'
                                : f.statut === 'impayee'
                                  ? 'err'
                                  : f.statut === 'brouillon'
                                    ? 'info'
                                    : 'neutral'
                            }
                            dot
                            size="sm"
                          >
                            {f.statut}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="ghost">
                              PDF
                            </Button>
                            {f.statut === 'impayee' && (
                              <GatedAction
                                autorise={autorise('org.manage')}
                                message={refus('org.manage')}
                              >
                                <Button size="sm" variant="secondary">
                                  Relancer
                                </Button>
                              </GatedAction>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {impayeReleve && (
            <Card>
              <CardHeader
                titre="Recouvrement"
                sousTitre="La chronologie des relances, et ce qui reste à tenter avant d’envisager une suspension."
              />
              <Timeline
                evenements={[
                  {
                    id: '1',
                    titre: 'Facture émise',
                    detail: `${impayeReleve.facture} · ${money(impayeReleve.montant)}`,
                    horodatage: dateCourte(impayeReleve.echeance),
                    ton: 'neutral',
                  },
                  {
                    id: '2',
                    titre: 'Première relance automatique',
                    detail: 'Courriel au contact de facturation, 3 jours après l’échéance',
                    horodatage: '+3 jours',
                    ton: 'info',
                  },
                  {
                    id: '3',
                    titre: 'Deuxième relance',
                    detail: 'Courriel au contact de facturation et à l’administrateur',
                    horodatage: '+15 jours',
                    ton: 'warn',
                  },
                  {
                    id: '4',
                    titre: 'Appel téléphonique',
                    detail: 'À passer — proposer un échelonnement plutôt que d’attendre',
                    horodatage: '+30 jours',
                    ton: 'err',
                  },
                ]}
              />
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-g-100 pt-4">
                <Button size="sm" variant="secondary">
                  Enregistrer un appel
                </Button>
                <Button size="sm" variant="ghost">
                  Proposer un échelonnement
                </Button>
                <Button size="sm" variant="ghost">
                  Passer un avoir commercial
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {onglet === 'support' && (
        <Card padding={false}>
          <div className="border-b border-g-100 px-4 py-3.5">
            <CardHeader
              titre="Tickets de cette organisation"
              sousTitre="Historique complet, y compris les tickets fermés."
              className="mb-0"
              actions={
                <ButtonLink size="sm" variant="ghost" href="/admin/tickets">
                  File complète
                </ButtonLink>
              }
            />
          </div>
          {tickets.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12.5px] text-g-500">
              Aucun ticket pour cette organisation.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Ticket', 'Gravité', 'Statut', 'Assigné à', 'Engagement', 'Ouvert'].map((h) => (
                      <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5">
                        <span className="block font-mono text-[10.5px] text-g-500">{t.numero}</span>
                        <span className="block text-[12px] font-semibold text-ink">{t.sujet}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          tone={
                            t.gravite === 'critique'
                              ? 'err'
                              : t.gravite === 'majeure'
                                ? 'warn'
                                : 'neutral'
                          }
                          dot
                          size="sm"
                        >
                          {t.gravite}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          tone={
                            t.statut === 'resolu' || t.statut === 'ferme'
                              ? 'ok'
                              : t.statut === 'attente_client'
                                ? 'warn'
                                : 'info'
                          }
                          size="sm"
                        >
                          {t.statut.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-g-700">
                        {t.assigneA ?? 'Non assigné'}
                      </td>
                      <td className="px-3 py-2.5">
                        {t.slaRestantMin !== undefined ? (
                          <span
                            className={cn(
                              'tnum text-[11.5px] font-semibold',
                              t.slaRestantMin < 120 ? 'text-err' : 'text-g-700',
                            )}
                          >
                            {t.slaRestantMin} min
                          </span>
                        ) : (
                          <span className="text-[11.5px] text-g-500">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-g-500">
                        {relatif(t.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {onglet === 'audit' && (
        <div className="space-y-4">
          <Callout ton="violet" titre="Ce journal est celui du client">
            Les mêmes lignes apparaissent dans son propre écran de sécurité. Nos actions y figurent au
            même titre que les siennes, avec le nom de l’intervenant — c’est ce qui rend l’élévation de
            privilège vérifiable plutôt que déclarative.
          </Callout>

          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Horodatage', 'Acteur', 'Rôle', 'Action', 'Cible', 'Portée', 'Résultat', 'Adresse'].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(audit.length > 0 ? audit : AUDIT.slice(0, 10)).map((a) => (
                    <tr key={a.id} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2 text-[11px] text-g-700">{dateHeure(a.ts)}</td>
                      <td className="px-3 py-2">
                        <span className="block text-[11.5px] font-semibold text-ink">
                          {a.actor.nom}
                        </span>
                        <span className="block text-[10px] text-g-500">{a.actor.type}</span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-g-700">
                        {ROLE_LABEL[a.role] ?? a.role}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-p-700">{a.action}</td>
                      <td className="max-w-[20ch] truncate px-3 py-2 font-mono text-[11px] text-ink">
                        {a.target}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-g-500">{a.scope.label}</td>
                      <td className="px-3 py-2">
                        <Badge
                          tone={a.result === 'ok' ? 'ok' : a.result === 'refuse' ? 'warn' : 'err'}
                          dot
                          size="sm"
                        >
                          {a.result === 'ok' ? 'Succès' : a.result === 'refuse' ? 'Refusé' : 'Erreur'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] text-g-500">{a.ip ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {onglet === 'administration' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Plan de service et limites"
              sousTitre="Ce que nous pouvons ajuster côté super admin, sans toucher aux ressources du client."
            />
            <div className="space-y-4">
              <Field label="Plan de service">
                <Select defaultValue={org.tenantPlan ?? 'Standard'}>
                  <option value="Standard">Standard</option>
                  <option value="Avancé">Avancé — support prioritaire</option>
                  <option value="Entreprise">Entreprise — interlocuteur dédié</option>
                </Select>
              </Field>
              <Field
                label="Plafond de dépense mensuelle"
                hint="au-delà, la création de nouvelles ressources est bloquée et le client averti"
              >
                <Input type="number" defaultValue={org.caMensuel ? org.caMensuel * 2 : 500000} />
              </Field>
              <Field label="Quota maximal d’Espaces Cloud">
                <Input type="number" defaultValue={10} />
              </Field>
              <div className="space-y-3">
                <Switch
                  checked
                  label="Autoriser le libre-service"
                  description="Le client peut créer et supprimer ses propres ressources sans passer par nous. Désactiver revient à imposer un ticket pour chaque création."
                />
                <Switch
                  checked
                  label="Autoriser la marketplace"
                  description="Souscription en autonomie aux services managés du catalogue."
                />
                <Switch
                  checked={false}
                  label="Restreindre aux socles souverains"
                  description="Les ressources de cette organisation ne seront placées que sur des socles libres et localisés en Côte d’Ivoire. À activer pour les organisations soumises à une contrainte réglementaire."
                />
              </div>
            </div>
            <GatedAction autorise={autorise('org.manage')} message={refus('org.manage')}>
              <Button
                className="mt-4"
                onClick={() =>
                  pousser({
                    ton: 'ok',
                    titre: 'Paramètres enregistrés',
                    detail: 'La modification est journalisée dans l’audit du client, avec votre nom.',
                  })
                }
              >
                Enregistrer
              </Button>
            </GatedAction>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader
                titre="Élévations récentes"
                sousTitre="Chaque accès de nos équipes aux ressources de cette organisation."
              />
              <div className="space-y-2">
                {[
                  {
                    qui: 'Jean-Vincent Kassi',
                    quand: '2026-08-19T13:00:00Z',
                    duree: '4 h',
                    motif: 'Ticket SYN-8814 — diagnostic de latence sur app-metier',
                    actif: true,
                  },
                  {
                    qui: 'Aïcha Bamba',
                    quand: '2026-08-12T09:20:00Z',
                    duree: '2 h',
                    motif: 'Ticket SYN-8702 — restauration accompagnée',
                    actif: false,
                  },
                ].map((e) => (
                  <div
                    key={e.quand}
                    className={cn(
                      'rounded-[6px] border px-3 py-2.5',
                      e.actif ? 'border-warn/40 bg-warn-bg' : 'border-g-300',
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                        <KeyRound size={12} className="shrink-0 text-g-500" />
                        {e.qui}
                      </span>
                      <Badge tone={e.actif ? 'warn' : 'neutral'} dot={e.actif} size="sm">
                        {e.actif ? 'Active' : 'Expirée'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-g-700">{e.motif}</p>
                    <p className="mt-0.5 text-[10.5px] text-g-500">
                      {dateHeure(e.quand)} · durée {e.duree}
                    </p>
                    {e.actif && (
                      <Button size="sm" variant="ghost" className="mt-1.5">
                        Révoquer maintenant
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-err/30">
              <CardHeader
                titre="Actions irréversibles"
                sousTitre="Chacune exige la saisie du nom exact de l’organisation."
              />
              <div className="space-y-2">
                <div className="rounded-[6px] border border-g-300 px-3 py-2.5">
                  <p className="text-[12.5px] font-semibold text-ink">
                    Suspendre l’organisation
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-700">
                    Les accès sont coupés, les ressources continuent de tourner et de facturer. Une
                    suspension arrête l’activité d’une entreprise : elle exige un motif écrit et reste
                    visible dans son journal d’audit.
                  </p>
                  <GatedAction
                    autorise={autorise('org.manage')}
                    message={refus('org.manage')}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2"
                      iconBefore={<Pause size={12} />}
                      onClick={() => setSuspension(true)}
                    >
                      Suspendre
                    </Button>
                  </GatedAction>
                </div>
                <div className="rounded-[6px] border border-err/40 bg-err-bg px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                    <Ban size={12} className="shrink-0 text-err" />
                    Clôturer l’organisation
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-700">
                    Réservé au cas où le client le demande, ou après résiliation contractuelle.
                    Déclenche le calendrier de réversibilité : 30 jours de récupération, 30 jours de
                    conservation en lecture, puis effacement avec attestation.
                  </p>
                  <GatedAction
                    autorise={autorise('org.manage')}
                    message={refus('org.manage')}
                  >
                    <Button size="sm" variant="danger" className="mt-2">
                      Ouvrir la procédure de clôture
                    </Button>
                  </GatedAction>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      <Modal
        open={elevation}
        onClose={() => setElevation(false)}
        title="Demander une élévation de privilège"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setElevation(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                pousser({
                  ton: 'warn',
                  titre: 'Élévation demandée',
                  detail: `Une entrée apparaît immédiatement dans le journal d’audit de ${org.nom}, avec votre nom et le motif.`,
                })
                setElevation(false)
              }}
            >
              Demander l’accès
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Motif" hint="visible par le client dans son journal d’audit — soyez précis">
            <Textarea
              rows={3}
              placeholder="Ticket SYN-8814 — diagnostic de la latence signalée sur app-metier, lecture des métriques et journaux de l’environnement de production."
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Durée" hint="l’accès expire automatiquement">
              <Select defaultValue="4">
                <option value="1">1 heure</option>
                <option value="4">4 heures</option>
                <option value="8">8 heures</option>
              </Select>
            </Field>
            <Field label="Périmètre">
              <Select defaultValue="lecture">
                <option value="lecture">Lecture seule des métadonnées et métriques</option>
                <option value="logs">Lecture, journaux applicatifs inclus</option>
                <option value="intervention">Intervention — modification de ressources</option>
              </Select>
            </Field>
          </div>
          <Field label="Ticket associé" hint="obligatoire pour une intervention">
            <Input placeholder="SYN-8814" />
          </Field>
          <Switch
            checked
            label="Notifier l’administrateur de l’organisation"
            description="Non désactivable pour une intervention. Un accès dont le client n’est pas averti n’est pas un accès légitime."
          />
          <Callout ton="warn" titre="Ce que le client verra">
            Une ligne dans son journal d’audit : votre nom, votre rôle, le motif, la durée, le
            périmètre, et l’horodatage. Chaque action que vous ferez pendant l’élévation y sera
            également consignée, individuellement.
          </Callout>
        </div>
      </Modal>

      <ConfirmDialog
        open={suspension}
        onClose={() => setSuspension(false)}
        titre={
          org.statut === 'active' ? 'Suspendre l’organisation' : 'Réactiver l’organisation'
        }
        ressource={org.nom}
        libelleAction={org.statut === 'active' ? 'Suspendre l’organisation' : 'Réactiver'}
        pertes={
          org.statut === 'active'
            ? [
                `Les ${org.utilisateurs ?? 0} membres perdent immédiatement l’accès au portail et aux services managés`,
                'Les ressources continuent de tourner et de facturer — une suspension n’est pas un arrêt',
                'L’activité de l’entreprise s’arrête : cette décision est consignée avec votre nom et son motif',
              ]
            : [
                'Les accès de tous les membres sont rétablis immédiatement',
                'La facturation reprend son cours normal',
              ]
        }
        onConfirm={() => {
          pousser({
            ton: org.statut === 'active' ? 'err' : 'ok',
            titre:
              org.statut === 'active'
                ? `${org.nom} suspendue`
                : `${org.nom} réactivée`,
            detail: 'L’opération est journalisée dans l’audit de l’organisation et dans celui de la plateforme.',
          })
          setSuspension(false)
        }}
      />
    </div>
  )
}
