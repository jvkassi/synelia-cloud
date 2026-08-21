'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ban, KeyRound, Pause, Play, Plus, ShieldAlert, UserCog } from 'lucide-react'
import { cn, slugify, trendSeries } from '@/lib/utils'
import { dateCourte, dateHeure, money, num, relatif } from '@/lib/format'
import { ESPACES, SERVICES_MANAGES } from '@/lib/mock'
import { MOYEN_LABEL, ROLE_LABEL, SITE_COURT, type Organisation, type Role } from '@/lib/types'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Avatar, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/field'
import { ConfirmDialog, Modal } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { QuotaBar, StatTile } from '@/components/composition/metrics'
import { Timeline } from '@/components/composition/flow'
import { useApp } from '@/components/app/contexte'
import { useActe, useAtelier } from '@/components/app/atelier'

const ONGLETS = [
  { id: 'synthese', label: 'Synthèse' },
  { id: 'ressources', label: 'Ressources' },
  { id: 'membres', label: 'Membres' },
  { id: 'facturation', label: 'Facturation' },
  { id: 'support', label: 'Support' },
  { id: 'audit', label: 'Audit' },
  { id: 'administration', label: 'Administration' },
]

/** Élévations d'accès posées pendant la session, par organisation. */
interface Elevation {
  id: string
  qui: string
  quand: string
  duree: string
  motif: string
  actif: boolean
}

const ELEVATIONS_INITIALES: Record<string, Elevation[]> = {
  'org-dba': [
    {
      id: 'elev-1',
      qui: 'Jean-Vincent Kassi',
      quand: '2026-08-19T13:00:00Z',
      duree: '4 h',
      motif: 'Ticket SYN-8814 — diagnostic de latence sur app-metier',
      actif: true,
    },
    {
      id: 'elev-2',
      qui: 'Aïcha Bamba',
      quand: '2026-08-12T09:20:00Z',
      duree: '2 h',
      motif: 'Ticket SYN-8702 — restauration accompagnée',
      actif: false,
    },
  ],
}

/**
 * Une organisation créée pendant la session n'existe pas dans le jeu figé :
 * la route est donc servie, et c'est cette vue qui dit ce qu'elle ne trouve
 * pas. Un 404 du serveur laisserait croire à une panne.
 */
function OrganisationIntrouvable({ id }: { id: string }) {
  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace fournisseur', href: '/admin' },
          { label: 'Organisations', href: '/admin/organisations' },
          { label: 'Introuvable' },
        ]}
        titre="Organisation introuvable"
        sousTitre={`Aucune organisation ne porte l’identifiant ${id}. Elle a peut-être été fermée, ou l’adresse a été recopiée à la main.`}
      />
      <Card>
        <p className="rounded-[8px] border border-dashed border-g-300 px-4 py-10 text-center text-[12.5px] text-g-500">
          Les organisations fermées disparaissent du portail à l’issue de leur période de
          réversibilité.
        </p>
        <ButtonLink variant="secondary" className="mt-4" href="/admin/organisations">
          Revenir à la liste
        </ButtonLink>
      </Card>
    </div>
  )
}

export function VueOrganisation({ id }: { id: string }) {
  const { organisations } = useAtelier()
  const org = organisations.parId(id)
  if (!org) return <OrganisationIntrouvable id={id} />
  return <FicheOrganisation org={org} />
}

function FicheOrganisation({ org }: { org: Organisation }) {
  const { autorise, refus } = useApp()
  const {
    organisations,
    revendeurs,
    utilisateurs,
    adhesions,
    factures: registreFactures,
    impayes,
    tickets: registreTickets,
    souscriptions: registreSouscriptions,
    journal,
  } = useAtelier()
  const acte = useActe()

  const [onglet, setOnglet] = useState('synthese')
  const [elevation, setElevation] = useState(false)
  const [suspension, setSuspension] = useState(false)
  const [cloture, setCloture] = useState(false)
  const [invitation, setInvitation] = useState(false)
  const [elevations, setElevations] = useState<Elevation[]>(ELEVATIONS_INITIALES[org.id] ?? [])
  const [demande, setDemande] = useState({
    motif: '',
    duree: '4',
    perimetre: 'lecture',
    ticket: '',
    notifier: true,
  })
  const [nouveauMembre, setNouveauMembre] = useState({ nom: '', email: '' })
  const [reglages, setReglages] = useState({
    plan: org.tenantPlan ?? 'Standard',
    plafond: org.caMensuel ? org.caMensuel * 2 : 500000,
    quotaEspaces: 10,
    libreService: true,
    marketplace: true,
    souverain: false,
  })

  const reseller = revendeurs.liste.find((r) => r.id === org.resellerId)
  const membres = adhesions.liste
    .filter((m) => m.orgId === org.id)
    .map((m) => ({ membership: m, user: utilisateurs.parId(m.userId) }))
    .filter((x): x is { membership: (typeof adhesions.liste)[number]; user: NonNullable<typeof x.user> } => Boolean(x.user))
  const factures = registreFactures.liste.filter((f) => f.orgId === org.id)
  const impayees = factures.filter((f) => f.statut === 'impayee')
  const tickets = registreTickets.liste.filter((t) => t.orgId === org.id)
  const audit = journal.liste.filter((a) => a.orgId === org.id)
  const espaces = org.id === 'org-dba' ? ESPACES : []
  const services = org.id === 'org-dba' ? SERVICES_MANAGES : []
  const souscriptions = registreSouscriptions.liste.filter((s) => s.orgId === org.id)
  const impayeReleve = impayes.liste.find((i) => i.org === org.nom)

  const portee = { type: 'org' as const, id: org.id, label: org.nom }

  const basculerStatut = () => {
    const suspendre = org.statut === 'active'
    acte({
      faire: () => organisations.modifier(org.id, { statut: suspendre ? 'suspendue' : 'active' }),
      ton: suspendre ? 'err' : 'ok',
      titre: suspendre ? `${org.nom} suspendue` : `${org.nom} réactivée`,
      detail:
        'L’opération est journalisée dans l’audit de l’organisation et dans celui de la plateforme.',
      action: suspendre ? 'organisation.suspend' : 'organisation.reactivate',
      cible: org.id,
      orgId: org.id,
      orgNom: org.nom,
      portee,
    })
    setSuspension(false)
  }

  const cloturer = () => {
    acte({
      faire: () => {
        organisations.modifier(org.id, { statut: 'fermee', caMensuel: 0 })
        impayes.liste
          .filter((i) => i.org === org.nom)
          .forEach((i) => impayes.supprimer(i.facture))
      },
      ton: 'warn',
      titre: `Clôture de ${org.nom} engagée`,
      detail:
        'Trente jours de récupération, trente jours de conservation en lecture, puis effacement avec attestation.',
      action: 'organisation.close',
      cible: org.id,
      orgId: org.id,
      orgNom: org.nom,
      portee,
    })
    setCloture(false)
  }

  const demanderElevation = () => {
    const duree = `${demande.duree} h`
    acte({
      faire: () =>
        setElevations((l) => [
          {
            id: `elev-session-${l.length + 1}`,
            qui: 'Jean-Vincent Kassi',
            quand: '2026-08-19T15:20:00Z',
            duree,
            motif: demande.motif.trim() || 'Motif non renseigné',
            actif: true,
          },
          ...l,
        ]),
      ton: 'warn',
      titre: 'Élévation accordée',
      detail: `Une entrée apparaît immédiatement dans le journal d’audit de ${org.nom}, avec votre nom et le motif.`,
      action: 'access.elevation.grant',
      cible: org.id,
      orgId: org.id,
      orgNom: org.nom,
      portee,
    })
    setDemande({ motif: '', duree: '4', perimetre: 'lecture', ticket: '', notifier: true })
    setElevation(false)
  }

  const revoquerElevation = (e: Elevation) => {
    acte({
      faire: () => setElevations((l) => l.map((x) => (x.id === e.id ? { ...x, actif: false } : x))),
      titre: 'Élévation révoquée',
      detail: `L’accès de ${e.qui} est coupé immédiatement, avant son expiration.`,
      action: 'access.elevation.revoke',
      cible: org.id,
      orgId: org.id,
      orgNom: org.nom,
      portee,
    })
  }

  /**
   * La seule intervention du fournisseur sur les identités d'un client : lui
   * rendre un administrateur quand il a perdu le dernier. Tout le reste — créer,
   * changer de rôle, révoquer — appartient à l'organisation elle-même, depuis son
   * propre espace. Le faire à sa place serait exactement ce que le cloisonnement
   * est censé empêcher.
   */
  const retablirAdministrateur = () => {
    const nom = nouveauMembre.nom.trim()
    const idUtilisateur = `usr-${slugify(nom).slice(0, 20) || 'admin'}-secours`
    acte({
      faire: () => {
        utilisateurs.ajouter({
          id: idUtilisateur,
          email: nouveauMembre.email.trim(),
          nom,
          mfaEnabled: true,
          idpSource: 'local',
          orgId: org.id,
          statut: 'invite',
        })
        adhesions.ajouter({
          id: `mb-${idUtilisateur}`,
          userId: idUtilisateur,
          orgId: org.id,
          role: 'org_admin',
          scopeType: 'org',
          scopeLabel: 'Toute l’organisation',
        })
        organisations.modifier(org.id, (o) => ({ utilisateurs: (o.utilisateurs ?? 0) + 1 }))
      },
      ton: 'warn',
      titre: `Administrateur rétabli pour ${org.nom}`,
      detail: `${nom} reçoit une invitation à ${nouveauMembre.email.trim()}, avec deuxième facteur obligatoire. L’opération figure en tête du journal d’audit du client.`,
      action: 'member.recovery',
      cible: idUtilisateur,
      orgId: org.id,
      orgNom: org.nom,
      portee,
    })
    setNouveauMembre({ nom: '', email: '' })
    setInvitation(false)
  }

  const relancer = (f: (typeof factures)[number]) => {
    acte({
      faire: () =>
        impayes.modifier(f.numero, (i) => ({ relances: i.relances + 1 })),
      ton: 'info',
      titre: `Relance envoyée sur ${f.numero}`,
      detail:
        'Courriel au contact de facturation et à l’administrateur. Une relance n’est jamais suivie d’une coupure automatique.',
      action: 'invoice.dunning',
      cible: f.numero,
      orgId: org.id,
      orgNom: org.nom,
      portee,
    })
  }

  const encaisser = (f: (typeof factures)[number]) => {
    acte({
      faire: () => {
        registreFactures.modifier(f.id, { statut: 'payee', moyen: f.moyen ?? 'virement' })
        impayes.supprimer(f.numero)
      },
      titre: `${f.numero} encaissée`,
      detail: `${money(f.total, f.devise)} rapprochés. La facture sort du recouvrement.`,
      action: 'invoice.payment.record',
      cible: f.numero,
      orgId: org.id,
      orgNom: org.nom,
      portee,
    })
  }

  const enregistrerReglages = () => {
    acte({
      faire: () => organisations.modifier(org.id, { tenantPlan: reglages.plan }),
      titre: 'Paramètres enregistrés',
      detail: `Plan ${reglages.plan}, plafond ${money(reglages.plafond)}, ${reglages.quotaEspaces} Espaces Cloud au maximum. La modification est journalisée dans l’audit du client, avec votre nom.`,
      action: 'organisation.settings.update',
      cible: org.id,
      orgId: org.id,
      orgNom: org.nom,
      portee,
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace fournisseur', href: '/admin' },
          { label: 'Organisations', href: '/admin/organisations' },
          { label: org.nom },
        ]}
        titre={org.nom}
        sousTitre={`${org.pays}${org.secteur ? ` · ${org.secteur}` : ''} · cliente depuis le ${dateCourte(org.createdAt)}${reseller ? ` · contrat via ${reseller.nom}` : ' · contrat direct'}`}
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
            <Badge
              tone={
                org.type === 'revendeur'
                  ? 'accent'
                  : org.type === 'client_revendeur'
                    ? 'info'
                    : 'neutral'
              }
              size="sm"
            >
              {org.type === 'revendeur'
                ? 'Revendeur'
                : org.type === 'client_revendeur'
                  ? 'Client d’un revendeur'
                  : 'Client direct'}
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
            <GatedAction autorise={autorise('reseller.manage')} message={refus('reseller.manage')}>
              <Button
                variant="secondary"
                iconBefore={<UserCog size={14} />}
                onClick={() => setElevation(true)}
              >
                Demander une élévation
              </Button>
            </GatedAction>
            <GatedAction autorise={autorise('reseller.manage')} message={refus('reseller.manage')}>
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
                {
                  cle: 'Contrat',
                  valeur: reseller ? `Via ${reseller.nom} (${reseller.revsharePct} % de partage)` : 'Direct',
                },
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
              actions={
                <GatedAction
                  autorise={autorise('reseller.manage')}
                  message={refus('reseller.manage')}
                >
                  <Button
                    size="sm"
                    variant="secondary"
                    iconBefore={<Plus size={12} />}
                    onClick={() => setInvitation(true)}
                  >
                    Rétablir un administrateur
                  </Button>
                </GatedAction>
              }
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
              Nous ne créons, ne modifions et ne révoquons jamais un membre à la place d’une
              organisation : elle le fait depuis son propre espace. La seule exception est la
              récupération du dernier administrateur perdu — elle exige une vérification d’identité
              auprès du signataire du contrat, et l’opération apparaît en tête de son journal d’audit.
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                acte({
                                  ton: 'info',
                                  titre: `${f.numero} téléchargée`,
                                  detail: `Facture ${f.periode}, ${money(f.total, f.devise)}. Le téléchargement figure dans le journal du client.`,
                                  action: 'invoice.download',
                                  cible: f.numero,
                                  orgId: org.id,
                                  orgNom: org.nom,
                                  portee,
                                })
                              }
                            >
                              PDF
                            </Button>
                            {f.statut === 'impayee' && (
                              <GatedAction
                                autorise={autorise('reseller.manage')}
                                message={refus('reseller.manage')}
                              >
                                <Button size="sm" variant="secondary" onClick={() => relancer(f)}>
                                  Relancer
                                </Button>
                              </GatedAction>
                            )}
                            {f.statut === 'impayee' && (
                              <GatedAction
                                autorise={autorise('reseller.manage')}
                                message={refus('reseller.manage')}
                              >
                                <Button size="sm" variant="ghost" onClick={() => encaisser(f)}>
                                  Encaisser
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
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    acte({
                      faire: () =>
                        impayes.modifier(impayeReleve.facture, (i) => ({
                          relances: i.relances + 1,
                        })),
                      titre: 'Appel consigné',
                      detail: `Quatrième étape du recouvrement pour ${impayeReleve.facture}. Le compteur de relances passe à ${impayeReleve.relances + 1}.`,
                      action: 'dunning.call.log',
                      cible: impayeReleve.facture,
                      orgId: org.id,
                      orgNom: org.nom,
                      portee,
                    })
                  }
                >
                  Enregistrer un appel
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    acte({
                      ton: 'info',
                      titre: 'Échelonnement proposé',
                      detail: `${money(impayeReleve.montant)} en trois mensualités, sans frais. La proposition attend l’accord écrit du client.`,
                      action: 'dunning.installment.offer',
                      cible: impayeReleve.facture,
                      orgId: org.id,
                      orgNom: org.nom,
                      portee,
                    })
                  }
                >
                  Proposer un échelonnement
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    acte({
                      faire: () => impayes.supprimer(impayeReleve.facture),
                      ton: 'warn',
                      titre: 'Avoir commercial passé',
                      detail: `${money(impayeReleve.montant)} annulés sur ${impayeReleve.facture}. La créance sort du recouvrement et l’écart apparaîtra au rapprochement.`,
                      action: 'invoice.credit_note',
                      cible: impayeReleve.facture,
                      orgId: org.id,
                      orgNom: org.nom,
                      portee,
                    })
                  }
                >
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
            {audit.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12.5px] text-g-500">
                Aucun événement consigné pour cette organisation. Le journal se remplit dès la
                première action — la sienne comme la nôtre.
              </p>
            ) : (
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
                  {audit.map((a) => (
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
            )}
          </Card>
        </div>
      )}

      {onglet === 'administration' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Plan de service et limites"
              sousTitre="Ce que nous pouvons ajuster côté fournisseur, sans toucher aux ressources du client."
            />
            <div className="space-y-4">
              <Field label="Plan de service">
                <Select
                  value={reglages.plan}
                  onChange={(e) => setReglages((r) => ({ ...r, plan: e.target.value }))}
                >
                  <option value="Standard">Standard</option>
                  <option value="Avancé">Avancé — support prioritaire</option>
                  <option value="Entreprise">Entreprise — interlocuteur dédié</option>
                </Select>
              </Field>
              <Field
                label="Plafond de dépense mensuelle"
                hint="au-delà, la création de nouvelles ressources est bloquée et le client averti"
              >
                <Input
                  type="number"
                  min={0}
                  value={reglages.plafond}
                  suffix="FCFA"
                  onChange={(e) =>
                    setReglages((r) => ({ ...r, plafond: Math.max(0, Number(e.target.value)) }))
                  }
                />
              </Field>
              <Field label="Quota maximal d’Espaces Cloud">
                <Input
                  type="number"
                  min={1}
                  value={reglages.quotaEspaces}
                  onChange={(e) =>
                    setReglages((r) => ({
                      ...r,
                      quotaEspaces: Math.max(1, Number(e.target.value)),
                    }))
                  }
                />
              </Field>
              <div className="space-y-3">
                <Switch
                  checked={reglages.libreService}
                  onChange={(v) => setReglages((r) => ({ ...r, libreService: v }))}
                  label="Autoriser le libre-service"
                  description="Le client peut créer et supprimer ses propres ressources sans passer par nous. Désactiver revient à imposer un ticket pour chaque création."
                />
                <Switch
                  checked={reglages.marketplace}
                  onChange={(v) => setReglages((r) => ({ ...r, marketplace: v }))}
                  label="Autoriser la marketplace"
                  description="Souscription en autonomie aux services managés du catalogue."
                />
                <Switch
                  checked={reglages.souverain}
                  onChange={(v) => setReglages((r) => ({ ...r, souverain: v }))}
                  label="Restreindre aux socles souverains"
                  description="Les ressources de cette organisation ne seront placées que sur des socles libres et localisés en Côte d’Ivoire. À activer pour les organisations soumises à une contrainte réglementaire."
                />
              </div>
            </div>
            <GatedAction autorise={autorise('reseller.manage')} message={refus('reseller.manage')}>
              <Button className="mt-4" onClick={enregistrerReglages}>
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
              {elevations.length === 0 ? (
                <p className="rounded-[6px] border border-dashed border-g-300 px-3 py-6 text-center text-[12px] text-g-500">
                  Aucune de nos équipes n’a accédé aux ressources de cette organisation.
                </p>
              ) : (
                <div className="space-y-2">
                  {elevations.map((e) => (
                    <div
                      key={e.id}
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
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-1.5"
                          onClick={() => revoquerElevation(e)}
                        >
                          Révoquer maintenant
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                    autorise={autorise('reseller.manage')}
                    message={refus('reseller.manage')}
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
                    autorise={autorise('reseller.manage')}
                    message={refus('reseller.manage')}
                  >
                    <Button
                      size="sm"
                      variant="danger"
                      className="mt-2"
                      disabled={org.statut === 'fermee'}
                      onClick={() => setCloture(true)}
                    >
                      {org.statut === 'fermee'
                        ? 'Clôture déjà engagée'
                        : 'Ouvrir la procédure de clôture'}
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
              disabled={
                demande.motif.trim().length < 12 ||
                (demande.perimetre === 'intervention' && demande.ticket.trim() === '')
              }
              onClick={demanderElevation}
            >
              Demander l’accès
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Motif"
            required
            hint="visible par le client dans son journal d’audit — soyez précis"
            error={
              demande.motif !== '' && demande.motif.trim().length < 12
                ? 'Un motif d’un mot ne renseigne personne : douze caractères au minimum.'
                : undefined
            }
          >
            <Textarea
              rows={3}
              value={demande.motif}
              onChange={(e) => setDemande((d) => ({ ...d, motif: e.target.value }))}
              placeholder="Ticket SYN-8814 — diagnostic de la latence signalée sur app-metier, lecture des métriques et journaux de l’environnement de production."
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Durée" hint="l’accès expire automatiquement">
              <Select
                value={demande.duree}
                onChange={(e) => setDemande((d) => ({ ...d, duree: e.target.value }))}
              >
                <option value="1">1 heure</option>
                <option value="4">4 heures</option>
                <option value="8">8 heures</option>
              </Select>
            </Field>
            <Field label="Périmètre">
              <Select
                value={demande.perimetre}
                onChange={(e) => setDemande((d) => ({ ...d, perimetre: e.target.value }))}
              >
                <option value="lecture">Lecture seule des métadonnées et métriques</option>
                <option value="logs">Lecture, journaux applicatifs inclus</option>
                <option value="intervention">Intervention — modification de ressources</option>
              </Select>
            </Field>
          </div>
          <Field
            label="Ticket associé"
            hint="obligatoire pour une intervention"
            required={demande.perimetre === 'intervention'}
          >
            <Input
              value={demande.ticket}
              onChange={(e) => setDemande((d) => ({ ...d, ticket: e.target.value }))}
              placeholder="SYN-8814"
            />
          </Field>
          <Switch
            checked={demande.perimetre === 'intervention' ? true : demande.notifier}
            disabled={demande.perimetre === 'intervention'}
            onChange={(v) => setDemande((d) => ({ ...d, notifier: v }))}
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
        onConfirm={basculerStatut}
      />

      <ConfirmDialog
        open={cloture}
        onClose={() => setCloture(false)}
        titre="Clôturer l’organisation"
        ressource={org.nom}
        libelleAction="Engager la clôture"
        pertes={[
          'Trente jours pour récupérer les données, en libre-service et sans frais de sortie',
          'Trente jours supplémentaires de conservation en lecture seule',
          'Puis effacement des ressources et des sauvegardes, avec attestation de destruction',
          'La facturation s’arrête à la date d’engagement, au prorata',
        ]}
        onConfirm={cloturer}
      />

      <Modal
        open={invitation}
        onClose={() => setInvitation(false)}
        title="Rétablir un administrateur"
        description="Procédure de récupération — à n’ouvrir qu’après vérification d’identité auprès du signataire du contrat."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInvitation(false)}>
              Annuler
            </Button>
            <Button
              disabled={
                nouveauMembre.nom.trim().length < 2 ||
                !/.+@.+\..+/.test(nouveauMembre.email.trim())
              }
              onClick={retablirAdministrateur}
            >
              Envoyer l’invitation
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Callout ton="warn" titre="Ce n’est pas une création de compte ordinaire">
            Nous ne gérons pas les membres d’une organisation à sa place. Cette procédure existe pour
            un seul cas : le client a perdu l’accès de son dernier administrateur et ne peut plus se
            le rendre lui-même.
          </Callout>
          <Field label="Nom du bénéficiaire" required>
            <Input
              value={nouveauMembre.nom}
              onChange={(e) => setNouveauMembre((m) => ({ ...m, nom: e.target.value }))}
              placeholder="Nom figurant au contrat"
              autoFocus
            />
          </Field>
          <Field
            label="Adresse électronique"
            required
            hint="doit appartenir au domaine de l’organisation"
          >
            <Input
              type="email"
              value={nouveauMembre.email}
              onChange={(e) => setNouveauMembre((m) => ({ ...m, email: e.target.value }))}
              placeholder={`admin@${org.domaine ?? 'entreprise.ci'}`}
            />
          </Field>
          <KeyValueList
            colonnes={1}
            items={[
              { cle: 'Rôle attribué', valeur: ROLE_LABEL.org_admin },
              { cle: 'Deuxième facteur', valeur: 'Obligatoire dès la première connexion' },
              { cle: 'Portée', valeur: 'Toute l’organisation' },
              { cle: 'Trace', valeur: 'En tête du journal d’audit du client, à votre nom' },
            ]}
          />
        </div>
      </Modal>
    </div>
  )
}
