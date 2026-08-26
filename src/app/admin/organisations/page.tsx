'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Plus, ShieldAlert, UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateCourte, money, num, relatif } from '@/lib/format'
import { IMPAYES, ORGANISATIONS, RESELLERS, USERS } from '@/lib/mock'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { Modal } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { DataTable } from '@/components/composition/data-table'
import { CostPreview } from '@/components/composition/flow'
import { useApp } from '@/components/app/contexte'
import type { Organisation } from '@/lib/types'

export default function Organisations() {
  const { autorise, refus, pousser, lancer } = useApp()
  const [creation, setCreation] = useState(false)
  const [nomOrg, setNomOrg] = useState('')

  const actives = ORGANISATIONS.filter((o) => o.statut === 'active')
  const suspendues = ORGANISATIONS.filter((o) => o.statut === 'suspendue')
  const viaRevendeur = ORGANISATIONS.filter((o) => o.type === 'client_revendeur')
  const caTotal = ORGANISATIONS.reduce((a, o) => a + (o.caMensuel ?? 0), 0)
  const orgsImpayees = new Set(IMPAYES.map((i) => i.org))

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Organisations"
        sousTitre="Chaque organisation est un cloisonnement complet : ses espaces, ses membres, ses données et sa facturation. Aucune donnée ne traverse la frontière entre deux organisations, y compris pour nos propres équipes."
        actions={
          <GatedAction autorise={autorise('reseller.manage')} message={refus('reseller.manage')}>
            <Button
              iconBefore={<Plus size={14} />}
              onClick={() => {
                setNomOrg('')
                setCreation(true)
              }}
            >
              Créer une organisation
            </Button>
          </GatedAction>
        }
        meta={
          <>
            <Badge tone="neutral" size="sm">
              {ORGANISATIONS.length} organisations
            </Badge>
            <Badge tone="neutral" size="sm">
              {RESELLERS.length} revendeurs
            </Badge>
            {suspendues.length > 0 && (
              <Badge tone="warn" dot size="sm">
                {suspendues.length} suspendue
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
          detail={`sur ${ORGANISATIONS.length} organisations`}
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
          valeur={num(ORGANISATIONS.reduce((a, o) => a + (o.utilisateurs ?? 0), 0))}
          detail={`${USERS.length} identités connues`}
        />
      </div>

      <Card padding={false}>
        <div className="p-4">
          <DataTable<Organisation>
            lignes={ORGANISATIONS}
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
                  ...[...new Set(ORGANISATIONS.map((o) => o.pays))].map((p) => ({
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
                  const rev = RESELLERS.find((r) => r.id === o.resellerId)
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
                    <GatedAction
                      autorise={autorise('reseller.manage')}
                      message={refus('reseller.manage')}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        iconBefore={<UserCog size={12} />}
                        onClick={() =>
                          pousser({
                            ton: 'warn',
                            titre: `Demande d’élévation sur ${o.nom}`,
                            detail: 'Un accès temporaire de 4 heures est demandé. Il apparaîtra dans le journal d’audit du client, avec votre nom.',
                          })
                        }
                      >
                        Élévation
                      </Button>
                    </GatedAction>
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
            <Button
              disabled={!nomOrg.trim()}
              onClick={() => {
                lancer('org.create', nomOrg.trim())
                setCreation(false)
              }}
            >
              Créer et inviter l’administrateur
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Raison sociale">
            <Input
              placeholder="Nom de l’entreprise"
              value={nomOrg}
              onChange={(e) => setNomOrg(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Pays">
              <Select defaultValue="Côte d’Ivoire">
                <option value="Côte d’Ivoire">Côte d’Ivoire</option>
                <option value="Sénégal">Sénégal</option>
                <option value="Bénin">Bénin</option>
                <option value="Togo">Togo</option>
                <option value="Burkina Faso">Burkina Faso</option>
                <option value="Mali">Mali</option>
                <option value="France">France</option>
              </Select>
            </Field>
            <Field label="Secteur">
              <Input placeholder="Banque, industrie, administration…" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type de relation">
              <Select defaultValue="direct">
                <option value="direct">Client direct</option>
                <option value="client_revendeur">Client d’un revendeur</option>
                <option value="revendeur">Revendeur</option>
              </Select>
            </Field>
            <Field label="Revendeur rattaché" hint="uniquement si client d’un revendeur">
              <Select defaultValue="">
                <option value="">Aucun</option>
                {RESELLERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nom}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Plan de service">
              <Select defaultValue="standard">
                <option value="standard">Standard</option>
                <option value="avance">Avancé — support prioritaire</option>
                <option value="entreprise">Entreprise — interlocuteur dédié</option>
              </Select>
            </Field>
            <Field label="Numéro de contribuable" hint="détermine le régime de TVA">
              <Input placeholder="CI-ABJ-2024-B-00000" />
            </Field>
          </div>
          <Field
            label="Adresse de l’administrateur"
            hint="recevra l’invitation — aucun mot de passe n’est transmis par courriel"
          >
            <Input type="email" placeholder="admin@entreprise.ci" />
          </Field>
          <div className="space-y-3">
            <Switch
              checked
              label="Provisionner un royaume d’identité dédié"
              description="Cloisonnement complet des identités. La fédération avec l’annuaire du client se configure ensuite depuis son propre espace."
            />
            <Switch
              checked
              label="Exiger le deuxième facteur d’authentification"
              description="Appliqué à tous les membres dès la première connexion."
            />
            <Switch
              checked={false}
              label="Créer un Espace Cloud d’évaluation"
              description="4 vCPU, 8 Go, 100 Go de disque, gratuit pendant 30 jours puis supprimé automatiquement après avertissement."
            />
          </div>
          <CostPreview
            lignes={[
              { libelle: 'Plan de service Standard', detail: 'Inclus, sans surcoût', montant: 0 },
              {
                libelle: 'Espace Cloud d’évaluation',
                detail: '30 jours offerts, puis facturation ou suppression',
                montant: 0,
              },
            ]}
          />
          <Callout ton="info" titre="Ce que la création déclenche">
            Un royaume d’identité isolé, une organisation dans le portail, un compte de facturation,
            et une invitation pour l’administrateur désigné. Aucune ressource technique n’est créée
            avant que le client ne souscrive lui-même une offre.
          </Callout>
        </div>
      </Modal>
    </div>
  )
}
