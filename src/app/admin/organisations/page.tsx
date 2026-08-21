'use client'

import { useState } from 'react'
import { Building2, Pause, Play, Plus, UserCog } from 'lucide-react'
import { cn, slugify } from '@/lib/utils'
import { dateCourte, money, num } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { ConfirmDialog, Modal } from '@/components/ui/overlay'
import { Card, Callout, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { DataTable } from '@/components/composition/data-table'
import { CostPreview } from '@/components/composition/flow'
import { useApp } from '@/components/app/contexte'
import { useActe, useAtelier } from '@/components/app/atelier'
import type { Organisation, OrgType } from '@/lib/types'

const PLANS: Record<string, string> = {
  standard: 'Standard',
  avance: 'Avancé',
  entreprise: 'Entreprise',
}

const FORMULAIRE_VIDE = {
  nom: '',
  pays: 'Côte d’Ivoire',
  secteur: '',
  type: 'direct' as OrgType,
  resellerId: '',
  plan: 'standard',
  tva: '',
  emailAdmin: '',
  royaume: true,
  mfa: true,
  evaluation: false,
}

export default function Organisations() {
  const { autorise, refus } = useApp()
  const { organisations, revendeurs, utilisateurs, impayes } = useAtelier()
  const acte = useActe()

  const [creation, setCreation] = useState(false)
  const [form, setForm] = useState(FORMULAIRE_VIDE)
  const [fermeture, setFermeture] = useState<Organisation | null>(null)

  const liste = organisations.liste
  const actives = liste.filter((o) => o.statut === 'active')
  const suspendues = liste.filter((o) => o.statut === 'suspendue')
  const viaRevendeur = liste.filter((o) => o.type === 'client_revendeur')
  const caTotal = liste.reduce((a, o) => a + (o.caMensuel ?? 0), 0)
  const orgsImpayees = new Set(impayes.liste.map((i) => i.org))

  const ouvrirCreation = () => {
    setForm(FORMULAIRE_VIDE)
    setCreation(true)
  }

  const modifierForm = <C extends keyof typeof FORMULAIRE_VIDE>(
    champ: C,
    valeur: (typeof FORMULAIRE_VIDE)[C],
  ) => setForm((f) => ({ ...f, [champ]: valeur }))

  const nomValide = form.nom.trim().length >= 2
  const emailValide = /.+@.+\..+/.test(form.emailAdmin.trim())
  const revendeurValide = form.type !== 'client_revendeur' || form.resellerId !== ''
  const formValide = nomValide && emailValide && revendeurValide

  /** Un identifiant lisible, et unique même si deux raisons sociales se ressemblent. */
  const identifiantLibre = (nom: string) => {
    const base = `org-${slugify(nom).slice(0, 24) || 'nouvelle'}`
    if (!organisations.parId(base)) return base
    let n = 2
    while (organisations.parId(`${base}-${n}`)) n += 1
    return `${base}-${n}`
  }

  const creer = () => {
    const nom = form.nom.trim()
    const id = identifiantLibre(nom)
    const nouvelle: Organisation = {
      id,
      nom,
      pays: form.pays,
      secteur: form.secteur.trim() || undefined,
      tva: form.tva.trim() || undefined,
      type: form.type,
      resellerId: form.type === 'client_revendeur' ? form.resellerId : undefined,
      statut: 'active',
      // La date figée de la maquette : une organisation créée aujourd'hui doit
      // s'afficher « aujourd'hui » et non dans le futur.
      createdAt: '2026-08-19',
      espaces: form.evaluation ? 1 : 0,
      utilisateurs: 1,
      caMensuel: 0,
      consommationVcpu: form.evaluation ? 4 : 0,
      tenantPlan: PLANS[form.plan],
      domaine: `${slugify(nom).slice(0, 20) || 'client'}.ci`,
    }

    acte({
      faire: () => {
        organisations.ajouter(nouvelle)
        utilisateurs.ajouter({
          id: `usr-${slugify(nom).slice(0, 16)}-admin`,
          email: form.emailAdmin.trim(),
          nom: `Administrateur ${nom}`,
          mfaEnabled: form.mfa,
          idpSource: 'local',
          orgId: id,
          fonction: 'Administrateur de l’organisation',
          statut: 'invite',
        })
      },
      titre: `${nom} créée`,
      detail: form.royaume
        ? `Royaume d’identité provisionné, invitation envoyée à ${form.emailAdmin.trim()}.`
        : `Invitation envoyée à ${form.emailAdmin.trim()}. Aucun royaume dédié : les identités seront fédérées.`,
      action: 'organisation.create',
      cible: id,
      orgId: id,
      orgNom: nom,
    })
    setCreation(false)
  }

  const basculerStatut = (o: Organisation) => {
    const suspendre = o.statut === 'active'
    acte({
      faire: () =>
        organisations.modifier(o.id, { statut: suspendre ? 'suspendue' : 'active' }),
      ton: suspendre ? 'warn' : 'ok',
      titre: suspendre ? `${o.nom} suspendue` : `${o.nom} réactivée`,
      detail: suspendre
        ? 'Les accès sont coupés, les données conservées intactes. La décision est consignée à votre nom dans le journal du client.'
        : 'Les accès sont rétablis immédiatement. Aucune ressource n’a été détruite pendant la suspension.',
      action: suspendre ? 'organisation.suspend' : 'organisation.reactivate',
      cible: o.id,
      orgId: o.id,
      orgNom: o.nom,
    })
  }

  const fermer = (o: Organisation) => {
    acte({
      faire: () => {
        organisations.modifier(o.id, { statut: 'fermee', caMensuel: 0 })
        impayes.liste
          .filter((i) => i.org === o.nom)
          .forEach((i) => impayes.supprimer(i.facture))
      },
      ton: 'warn',
      titre: `${o.nom} fermée`,
      detail:
        'L’organisation reste visible trente jours en lecture seule, le temps d’exporter. Passé ce délai, elle disparaît du portail.',
      action: 'organisation.close',
      cible: o.id,
      orgId: o.id,
      orgNom: o.nom,
    })
    setFermeture(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Organisations"
        sousTitre="Chaque organisation est un cloisonnement complet : ses espaces, ses membres, ses données et sa facturation. Aucune donnée ne traverse la frontière entre deux organisations, y compris pour nos propres équipes."
        actions={
          <GatedAction autorise={autorise('reseller.manage')} message={refus('reseller.manage')}>
            <Button iconBefore={<Plus size={14} />} onClick={ouvrirCreation}>
              Créer une organisation
            </Button>
          </GatedAction>
        }
        meta={
          <>
            <Badge tone="neutral" size="sm">
              {liste.length} organisations
            </Badge>
            <Badge tone="neutral" size="sm">
              {revendeurs.liste.length} revendeurs
            </Badge>
            {suspendues.length > 0 && (
              <Badge tone="warn" dot size="sm">
                {suspendues.length} suspendue{suspendues.length > 1 ? 's' : ''}
              </Badge>
            )}
          </>
        }
      />

      {orgsImpayees.size > 0 && (
        <Callout ton="warn" titre={`${orgsImpayees.size} organisations en situation d’impayé`}>
          {[...orgsImpayees].join(', ')}. Notre politique interdit la suspension automatique : un
          impayé déclenche une relance écrite, puis un appel, puis une proposition d’échelonnement.
          La suspension est une décision humaine, prise en dernier recours et journalisée.
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile libelle="Organisations actives" valeur={actives.length} ton="ok" />
        <StatTile
          libelle="Via un revendeur"
          valeur={viaRevendeur.length}
          ton="accent"
          detail={`sur ${liste.length} organisations`}
        />
        <StatTile
          libelle="Suspendues"
          valeur={suspendues.length}
          ton={suspendues.length > 0 ? 'warn' : 'ok'}
          detail={suspendues.length > 0 ? suspendues.map((o) => o.nom).join(', ') : 'Aucune'}
        />
        <StatTile
          libelle="Chiffre d’affaires mensuel"
          valeur={money(caTotal)}
          detail="Toutes organisations confondues"
        />
        <StatTile
          libelle="Utilisateurs"
          valeur={num(liste.reduce((a, o) => a + (o.utilisateurs ?? 0), 0))}
          detail={`${utilisateurs.liste.length} identités connues`}
        />
      </div>

      <Card padding={false}>
        <div className="p-4">
          <DataTable<Organisation>
            lignes={liste}
            exportable
            parPage={12}
            placeholderRecherche="Rechercher une organisation, un pays, un secteur…"
            filtres={[
              {
                id: 'statut',
                libelle: 'Statut',
                options: [
                  { value: 'tous', label: 'Tous les statuts' },
                  { value: 'active', label: 'Active' },
                  { value: 'suspendue', label: 'Suspendue' },
                  { value: 'fermee', label: 'Fermée' },
                ],
              },
              {
                id: 'type',
                libelle: 'Type',
                options: [
                  { value: 'tous', label: 'Tous les types' },
                  { value: 'direct', label: 'Client direct' },
                  { value: 'client_revendeur', label: 'Client d’un revendeur' },
                  { value: 'revendeur', label: 'Revendeur' },
                ],
              },
              {
                id: 'pays',
                libelle: 'Pays',
                options: [
                  { value: 'tous', label: 'Tous les pays' },
                  ...[...new Set(liste.map((o) => o.pays))].map((p) => ({
                    value: p,
                    label: p,
                  })),
                ],
              },
            ]}
            selection={(l, fid, val) =>
              fid === 'statut'
                ? l.statut === val
                : fid === 'type'
                  ? l.type === val
                  : fid === 'pays'
                    ? l.pays === val
                    : true
            }
            href={(o) => `/admin/organisations/${o.id}`}
            colonnes={[
              {
                id: 'nom',
                entete: 'Organisation',
                cle: (o) => `${o.nom} ${o.pays} ${o.secteur ?? ''}`,
                rendu: (o) => (
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-p-050 text-p-700">
                      <Building2 size={13} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-semibold text-ink">
                        {o.nom}
                      </span>
                      <span className="block truncate text-[11px] text-g-500">
                        {o.pays}
                        {o.secteur ? ` · ${o.secteur}` : ''}
                      </span>
                    </span>
                  </span>
                ),
              },
              {
                id: 'type',
                entete: 'Type',
                cle: (o) => o.type,
                rendu: (o) => {
                  const rev = revendeurs.liste.find((r) => r.id === o.resellerId)
                  return (
                    <span className="block">
                      <Badge
                        tone={
                          o.type === 'revendeur'
                            ? 'accent'
                            : o.type === 'client_revendeur'
                              ? 'info'
                              : 'neutral'
                        }
                        size="sm"
                      >
                        {o.type === 'revendeur'
                          ? 'Revendeur'
                          : o.type === 'client_revendeur'
                            ? 'Via revendeur'
                            : 'Direct'}
                      </Badge>
                      {rev && (
                        <span className="mt-0.5 block text-[10.5px] text-g-500">{rev.nom}</span>
                      )}
                    </span>
                  )
                },
              },
              {
                id: 'plan',
                entete: 'Plan',
                cle: (o) => o.tenantPlan ?? '',
                masquable: true,
                rendu: (o) => (
                  <span className="text-[11.5px] text-g-700">{o.tenantPlan ?? '—'}</span>
                ),
              },
              {
                id: 'espaces',
                entete: 'Espaces',
                aligne: 'right',
                cle: (o) => o.espaces ?? 0,
                rendu: (o) => <span className="tnum text-[12px] text-g-700">{o.espaces ?? 0}</span>,
              },
              {
                id: 'utilisateurs',
                entete: 'Utilisateurs',
                aligne: 'right',
                cle: (o) => o.utilisateurs ?? 0,
                rendu: (o) => (
                  <span className="tnum text-[12px] text-g-700">{o.utilisateurs ?? 0}</span>
                ),
              },
              {
                id: 'vcpu',
                entete: 'vCPU alloué',
                aligne: 'right',
                cle: (o) => o.consommationVcpu ?? 0,
                rendu: (o) => (
                  <span className="tnum text-[12px] font-semibold text-ink">
                    {num(o.consommationVcpu ?? 0)}
                  </span>
                ),
              },
              {
                id: 'ca',
                entete: 'CA mensuel',
                aligne: 'right',
                cle: (o) => o.caMensuel ?? 0,
                rendu: (o) => (
                  <span className="tnum text-[12px] font-semibold text-ink">
                    {o.caMensuel ? money(o.caMensuel) : '—'}
                  </span>
                ),
              },
              {
                id: 'statut',
                entete: 'Statut',
                cle: (o) => o.statut,
                rendu: (o) => (
                  <span className="flex flex-col items-start gap-1">
                    <Badge
                      tone={
                        o.statut === 'active' ? 'ok' : o.statut === 'suspendue' ? 'warn' : 'neutral'
                      }
                      dot
                      size="sm"
                    >
                      {o.statut === 'active'
                        ? 'Active'
                        : o.statut === 'suspendue'
                          ? 'Suspendue'
                          : 'Fermée'}
                    </Badge>
                    {orgsImpayees.has(o.nom) && (
                      <Badge tone="err" size="sm">
                        Impayé
                      </Badge>
                    )}
                  </span>
                ),
              },
              {
                id: 'depuis',
                entete: 'Cliente depuis',
                aligne: 'right',
                cle: (o) => o.createdAt,
                masquable: true,
                masqueeParDefaut: true,
                rendu: (o) => (
                  <span className="text-[11.5px] text-g-500">{dateCourte(o.createdAt)}</span>
                ),
              },
              {
                id: 'actions',
                entete: '',
                aligne: 'right',
                rendu: (o) => (
                  <span className="flex items-center justify-end gap-1.5">
                    <ButtonLink size="sm" variant="ghost" href={`/admin/organisations/${o.id}`}>
                      Ouvrir
                    </ButtonLink>
                    {o.statut !== 'fermee' && (
                      <GatedAction
                        autorise={autorise('reseller.manage')}
                        message={refus('reseller.manage')}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          iconBefore={
                            o.statut === 'active' ? <Pause size={12} /> : <Play size={12} />
                          }
                          onClick={() => basculerStatut(o)}
                        >
                          {o.statut === 'active' ? 'Suspendre' : 'Réactiver'}
                        </Button>
                      </GatedAction>
                    )}
                    <GatedAction
                      autorise={autorise('reseller.manage')}
                      message={refus('reseller.manage')}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        iconBefore={<UserCog size={12} />}
                        onClick={() =>
                          acte({
                            ton: 'warn',
                            titre: `Demande d’élévation sur ${o.nom}`,
                            detail:
                              'Un accès temporaire de 4 heures est demandé. Il apparaît dans le journal d’audit du client, avec votre nom.',
                            action: 'access.elevation.request',
                            cible: o.id,
                            orgId: o.id,
                            orgNom: o.nom,
                          })
                        }
                      >
                        Élévation
                      </Button>
                    </GatedAction>
                    {o.statut !== 'fermee' && (
                      <GatedAction
                        autorise={autorise('reseller.manage')}
                        message={refus('reseller.manage')}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-err hover:bg-err-bg"
                          onClick={() => setFermeture(o)}
                        >
                          Fermer
                        </Button>
                      </GatedAction>
                    )}
                  </span>
                ),
              },
            ]}
            vide={{
              titre: 'Aucune organisation',
              phrase: 'Créez une organisation ou attendez la première souscription en ligne.',
            }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Callout ton="violet" titre="Le cloisonnement s’applique aussi à nous">
          Un membre de nos équipes ne voit pas les données d’une organisation sans élévation
          nominative, bornée dans le temps, et visible dans le journal d’audit du client. Ce n’est pas
          une politique interne que nous vous demandons de croire : c’est le mécanisme technique, et
          le client le constate lui-même dans son propre journal.
        </Callout>
        <Callout ton="info" titre="Suspendre n’est jamais automatique">
          Aucun impayé, aucun dépassement de quota, aucun signalement d’abus ne suspend une
          organisation sans décision humaine. Couper le service d’une entreprise, c’est arrêter son
          activité : cela mérite un nom, une date et un motif consignés, pas un traitement par lot
          nocturne.
        </Callout>
      </div>

      <Modal
        open={creation}
        onClose={() => setCreation(false)}
        title="Créer une organisation"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreation(false)}>
              Annuler
            </Button>
            <Button disabled={!formValide} onClick={creer}>
              Créer et inviter l’administrateur
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Raison sociale"
            required
            error={form.nom !== '' && !nomValide ? 'Deux caractères au minimum.' : undefined}
          >
            <Input
              value={form.nom}
              onChange={(e) => modifierForm('nom', e.target.value)}
              placeholder="Nom de l’entreprise"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Pays">
              <Select value={form.pays} onChange={(e) => modifierForm('pays', e.target.value)}>
                {[
                  'Côte d’Ivoire',
                  'Sénégal',
                  'Bénin',
                  'Togo',
                  'Burkina Faso',
                  'Mali',
                  'France',
                ].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Secteur">
              <Input
                value={form.secteur}
                onChange={(e) => modifierForm('secteur', e.target.value)}
                placeholder="Banque, industrie, administration…"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type de relation">
              <Select
                value={form.type}
                onChange={(e) => modifierForm('type', e.target.value as OrgType)}
              >
                <option value="direct">Client direct</option>
                <option value="client_revendeur">Client d’un revendeur</option>
                <option value="revendeur">Revendeur</option>
              </Select>
            </Field>
            <Field
              label="Revendeur rattaché"
              hint="uniquement si client d’un revendeur"
              error={
                form.type === 'client_revendeur' && form.resellerId === ''
                  ? 'À renseigner pour un client apporté.'
                  : undefined
              }
            >
              <Select
                value={form.resellerId}
                disabled={form.type !== 'client_revendeur'}
                onChange={(e) => modifierForm('resellerId', e.target.value)}
              >
                <option value="">Aucun</option>
                {revendeurs.liste.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nom}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Plan de service">
              <Select value={form.plan} onChange={(e) => modifierForm('plan', e.target.value)}>
                <option value="standard">Standard</option>
                <option value="avance">Avancé — support prioritaire</option>
                <option value="entreprise">Entreprise — interlocuteur dédié</option>
              </Select>
            </Field>
            <Field label="Numéro de contribuable" hint="détermine le régime de TVA">
              <Input
                value={form.tva}
                onChange={(e) => modifierForm('tva', e.target.value)}
                placeholder="CI-ABJ-2024-B-00000"
              />
            </Field>
          </div>
          <Field
            label="Adresse de l’administrateur"
            required
            hint="recevra l’invitation — aucun mot de passe n’est transmis par courriel"
            error={
              form.emailAdmin !== '' && !emailValide ? 'Adresse électronique invalide.' : undefined
            }
          >
            <Input
              type="email"
              value={form.emailAdmin}
              onChange={(e) => modifierForm('emailAdmin', e.target.value)}
              placeholder="admin@entreprise.ci"
            />
          </Field>
          <div className="space-y-3">
            <Switch
              checked={form.royaume}
              onChange={(v) => modifierForm('royaume', v)}
              label="Provisionner un royaume d’identité dédié"
              description="Cloisonnement complet des identités. La fédération avec l’annuaire du client se configure ensuite depuis son propre espace."
            />
            <Switch
              checked={form.mfa}
              onChange={(v) => modifierForm('mfa', v)}
              label="Exiger le deuxième facteur d’authentification"
              description="Appliqué à tous les membres dès la première connexion."
            />
            <Switch
              checked={form.evaluation}
              onChange={(v) => modifierForm('evaluation', v)}
              label="Créer un Espace Cloud d’évaluation"
              description="4 vCPU, 8 Go, 100 Go de disque, gratuit pendant 30 jours puis supprimé automatiquement après avertissement."
            />
          </div>
          <CostPreview
            lignes={[
              {
                libelle: `Plan de service ${PLANS[form.plan]}`,
                detail: form.plan === 'standard' ? 'Inclus, sans surcoût' : 'Facturé au mois',
                montant: form.plan === 'entreprise' ? 250000 : form.plan === 'avance' ? 85000 : 0,
              },
              ...(form.evaluation
                ? [
                    {
                      libelle: 'Espace Cloud d’évaluation',
                      detail: '30 jours offerts, puis facturation ou suppression',
                      montant: 0,
                    },
                  ]
                : []),
            ]}
          />
          <Callout ton="info" titre="Ce que la création déclenche">
            {form.royaume ? 'Un royaume d’identité isolé, une' : 'Une'} organisation dans le portail,
            un compte de facturation, et une invitation pour l’administrateur désigné. Aucune
            ressource technique n’est créée avant que le client ne souscrive lui-même une offre.
          </Callout>
        </div>
      </Modal>

      <ConfirmDialog
        open={fermeture !== null}
        onClose={() => setFermeture(null)}
        titre="Fermer une organisation"
        ressource={fermeture?.nom ?? ''}
        libelleAction="Fermer l’organisation"
        pertes={[
          'Tous les accès sont révoqués, y compris ceux des administrateurs de l’organisation',
          'La facturation s’arrête à la date du jour, au prorata',
          'Les données restent exportables trente jours, en lecture seule',
          'Passé ce délai, ressources et sauvegardes sont détruites sans possibilité de retour',
        ]}
        onConfirm={() => fermeture && fermer(fermeture)}
      />
    </div>
  )
}
