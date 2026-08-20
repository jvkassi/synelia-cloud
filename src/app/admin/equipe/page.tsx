'use client'

import { useState } from 'react'
import { KeyRound, Plus, ShieldCheck, UserMinus } from 'lucide-react'
import { cn, slugify } from '@/lib/utils'
import { MAINTENANT, dateHeure, relatif } from '@/lib/format'
import type { MembreEquipe } from '@/lib/mock'
import { MATRICE_RBAC, ROLES_FOURNISSEUR, can } from '@/lib/rbac'
import { ROLE_LABEL, type Role } from '@/lib/types'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Avatar, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { ConfirmDialog, Drawer, Modal } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { RoleMatrix } from '@/components/business/rbac-canvas'
import { useApp } from '@/components/app/contexte'
import { useActe, useAtelier } from '@/components/app/atelier'

const ONGLETS = [
  { id: 'membres', label: 'Membres de l’équipe' },
  { id: 'roles', label: 'Rôles fournisseur' },
  { id: 'astreinte', label: 'Astreinte' },
  { id: 'acces', label: 'Politique d’accès' },
]

const EQUIPES_CONNUES = [
  'Direction Innovation & Expertise',
  'Sponsor stratégique',
  'NOC Abidjan',
  'NOC Abidjan · astreinte',
  'Finance',
  'Conformité & sécurité',
  'Support niveau 2',
]

const RECRUE_VIDE = {
  nom: '',
  email: '',
  equipe: '',
  role: 'provider_operator' as Role,
  privilegie: false,
  astreinte: false,
}

const POLITIQUE_INITIALE = {
  mfa: true,
  elevationBornee: true,
  journalisationFine: true,
  revueTrimestrielle: true,
  sessionCourte: true,
  restrictionIp: false,
}

export default function Equipe() {
  const { autorise, refus } = useApp()
  const { equipe: registreEquipe, tickets, journal } = useAtelier()
  const acte = useActe()

  const [onglet, setOnglet] = useState('membres')
  const [detail, setDetail] = useState<MembreEquipe | null>(null)
  const [ajout, setAjout] = useState(false)
  const [retrait, setRetrait] = useState<MembreEquipe | null>(null)
  const [changementRole, setChangementRole] = useState<Role | null>(null)
  const [recrue, setRecrue] = useState(RECRUE_VIDE)
  const [politique, setPolitique] = useState(POLITIQUE_INITIALE)

  const EQUIPE_SYNELIA = registreEquipe.liste
  const AUDIT = journal.liste
  const privilegies = EQUIPE_SYNELIA.filter((m) => m.privilegie)
  const elevationsActives = EQUIPE_SYNELIA.filter((m) => m.elevation?.active)
  const equipes = [...new Set([...EQUIPES_CONNUES, ...EQUIPE_SYNELIA.map((m) => m.equipe)])]

  const ticketsDe = (nom: string) =>
    tickets.liste.filter((t) => t.assigneA === nom && !['resolu', 'ferme'].includes(t.statut))

  // Le membre ouvert dans le tiroir doit refléter ses propres modifications :
  // on le relit dans le registre plutôt que de garder la copie du clic.
  const ouvert = detail ? (registreEquipe.parId(detail.id) ?? null) : null

  const nomValide = recrue.nom.trim().split(/\s+/).filter(Boolean).length >= 2
  const emailValide = /^[^@\s]+@synelia\.tech$/i.test(recrue.email.trim())
  const equipeValide = recrue.equipe !== ''
  const recrueValide = nomValide && emailValide && equipeValide

  const ajouterMembre = () => {
    const nom = recrue.nom.trim()
    const id = `syn-${slugify(nom).slice(0, 20) || 'membre'}`
    acte({
      faire: () =>
        registreEquipe.ajouterEnFin({
          id,
          nom,
          email: recrue.email.trim().toLowerCase(),
          role: recrue.role,
          equipe: recrue.astreinte ? `${recrue.equipe} · astreinte` : recrue.equipe,
          dernierAcces: MAINTENANT,
          privilegie: recrue.privilegie,
        }),
      titre: `${nom} ajouté à l’équipe`,
      detail: `Rôle ${ROLE_LABEL[recrue.role]}, ${MATRICE_RBAC.filter((a) => can(recrue.role, a.id) === 'full').length} actions autorisées. L’invitation est envoyée ; le deuxième facteur devra être activé avant tout accès.`,
      action: 'team.member.add',
      cible: recrue.email.trim().toLowerCase(),
    })
    setRecrue(RECRUE_VIDE)
    setAjout(false)
  }

  const retirerMembre = (m: MembreEquipe) => {
    const siens = ticketsDe(m.nom)
    acte({
      faire: () => {
        registreEquipe.supprimer(m.id)
        siens.forEach((t) => tickets.modifier(t.id, { assigneA: undefined }))
      },
      ton: 'info',
      titre: `${m.nom} retiré de l’équipe`,
      detail: `Accès coupés, jetons révoqués, ${siens.length} ticket${siens.length > 1 ? 's' : ''} remis dans la file non assignée. Pensez à faire tourner les secrets partagés : cette étape n’est pas automatique.`,
      action: 'team.member.remove',
      cible: m.email,
    })
    setRetrait(null)
    if (detail?.id === m.id) setDetail(null)
  }

  const appliquerRole = (m: MembreEquipe, role: Role) => {
    acte({
      faire: () =>
        registreEquipe.modifier(m.id, {
          role,
          privilegie: role === 'provider_admin' ? m.privilegie : false,
        }),
      titre: `Rôle de ${m.nom} modifié`,
      detail: `${ROLE_LABEL[m.role]} → ${ROLE_LABEL[role]}, soit ${MATRICE_RBAC.filter((a) => can(role, a.id) === 'full').length} actions autorisées. Le changement prend effet à sa prochaine requête.`,
      action: 'team.role.change',
      cible: m.email,
    })
    setChangementRole(null)
  }

  const revoquerElevation = (m: MembreEquipe) => {
    acte({
      faire: () => registreEquipe.modifier(m.id, { elevation: { active: false } }),
      ton: 'info',
      titre: `Élévation de ${m.nom} révoquée`,
      detail: 'L’accès est coupé immédiatement et la révocation est journalisée.',
      action: 'access.elevation.revoke',
      cible: m.email,
    })
  }

  const fermerSessions = (m: MembreEquipe) => {
    acte({
      titre: `Sessions de ${m.nom} fermées`,
      detail:
        'Toutes ses sessions portail et interfaces d’exploitation sont invalidées. Il devra se réauthentifier, deuxième facteur compris.',
      action: 'team.sessions.revoke',
      cible: m.email,
    })
  }

  const basculerPrivilege = (m: MembreEquipe) => {
    const retirer = m.privilegie
    acte({
      faire: () => registreEquipe.modifier(m.id, { privilegie: !retirer }),
      ton: retirer ? 'ok' : 'warn',
      titre: retirer
        ? `Privilège retiré à ${m.nom}`
        : `${m.nom} passe compte privilégié`,
      detail: retirer
        ? 'Le privilège ne se retire jamais tout seul : c’est exactement ce que la revue trimestrielle sert à trouver.'
        : 'À réexaminer au prochain trimestre. Un privilège accordé pour un projet ponctuel se garde six mois de trop.',
      action: retirer ? 'team.privilege.revoke' : 'team.privilege.grant',
      cible: m.email,
    })
  }

  const enregistrerPolitique = () => {
    acte({
      faire: () => undefined,
      ton: 'info',
      titre: 'Politique d’accès enregistrée',
      detail: `Deuxième facteur ${politique.mfa ? 'obligatoire' : 'facultatif'}, session expirée après ${politique.sessionCourte ? '4 heures' : '8 heures'} d’inactivité, restriction par adresse ${politique.restrictionIp ? 'active' : 'écartée'}.`,
      action: 'team.policy.update',
      cible: 'politique-acces-equipe',
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Équipe Synelia"
        sousTitre="Qui a accès à quoi, du côté fournisseur. Les rôles sont volontairement étroits : un opérateur qui exploite la capacité n’a pas besoin de pouvoir modifier le catalogue, et personne n’a d’accès permanent aux données d’un client."
        actions={
          <GatedAction autorise={autorise('reseller.manage')} message={refus('reseller.manage')}>
            <Button iconBefore={<Plus size={14} />} onClick={() => setAjout(true)}>
              Ajouter un membre
            </Button>
          </GatedAction>
        }
        meta={
          <>
            <Badge tone="neutral" size="sm">
              {EQUIPE_SYNELIA.length} membres
            </Badge>
            <Badge tone="violet" size="sm">
              {privilegies.length} comptes privilégiés
            </Badge>
            {elevationsActives.length > 0 && (
              <Badge tone="warn" dot size="sm">
                {elevationsActives.length} élévation active
              </Badge>
            )}
          </>
        }
      />

      {elevationsActives.length > 0 && (
        <Callout ton="warn" titre={`${elevationsActives.length} élévation de privilège en cours`}>
          {elevationsActives
            .map(
              (m) =>
                `${m.nom} — ${m.elevation?.justification ?? 'sans motif renseigné'}${m.elevation?.jusqua ? `, jusqu’à ${dateHeure(m.elevation.jusqua)}` : ''}`,
            )
            .join(' · ')}
          . Chaque élévation apparaît aussi dans le journal d’audit de l’organisation concernée, avec le
          nom de l’intervenant et le motif.
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile libelle="Membres" valeur={EQUIPE_SYNELIA.length} />
        <StatTile
          libelle="Comptes privilégiés"
          valeur={privilegies.length}
          ton={privilegies.length > 3 ? 'warn' : 'violet'}
          detail={privilegies.length > 3 ? 'Beaucoup pour cette taille d’équipe' : 'Accès plateforme complet'}
        />
        <StatTile libelle="Équipes" valeur={equipes.length} />
        <StatTile
          libelle="Élévations actives"
          valeur={elevationsActives.length}
          ton={elevationsActives.length > 0 ? 'warn' : 'ok'}
        />
        <StatTile
          libelle="Deuxième facteur"
          valeur="100 %"
          ton="ok"
          detail="Obligatoire, sans exception"
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'membres' && (
        <div className="space-y-4">
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Membre', 'Équipe', 'Rôle', 'Privilégié', 'Tickets en cours', 'Élévation', 'Dernier accès', ''].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {EQUIPE_SYNELIA.map((m) => {
                    const siens = ticketsDe(m.nom)
                    return (
                      <tr key={m.id} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-2.5">
                            <Avatar nom={m.nom} size="sm" />
                            <span className="min-w-0">
                              <span className="block text-[12.5px] font-semibold text-ink">
                                {m.nom}
                              </span>
                              <span className="block text-[10.5px] text-g-500">{m.email}</span>
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-700">{m.equipe}</td>
                        <td className="px-3 py-2.5">
                          <Badge tone={m.privilegie ? 'violet' : 'neutral'} size="sm">
                            {ROLE_LABEL[m.role] ?? m.role}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          {m.privilegie ? (
                            <Badge tone="violet" dot size="sm">
                              Oui
                            </Badge>
                          ) : (
                            <span className="text-[11.5px] text-g-500">Non</span>
                          )}
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                          {siens.length}
                          {siens.some((t) => t.gravite === 'critique') && (
                            <Badge tone="err" size="sm" className="ml-1.5">
                              critique
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {m.elevation?.active ? (
                            <Badge tone="warn" dot size="sm">
                              Active
                            </Badge>
                          ) : (
                            <span className="text-[11.5px] text-g-500">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-500">
                          {relatif(m.dernierAcces)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="ghost" onClick={() => setDetail(m)}>
                              Détail
                            </Button>
                            <GatedAction
                              autorise={autorise('reseller.manage')}
                              message={refus('reseller.manage')}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                iconBefore={<UserMinus size={12} />}
                                onClick={() => setRetrait(m)}
                              >
                                Retirer
                              </Button>
                            </GatedAction>
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader titre="Répartition par équipe" />
              <div className="space-y-2">
                {equipes.map((e) => {
                  const membres = EQUIPE_SYNELIA.filter((m) => m.equipe === e)
                  return (
                    <div
                      key={e}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-semibold text-ink">{e}</span>
                        <span className="block text-[10.5px] text-g-500">
                          {membres.map((m) => m.nom.split(' ')[0]).join(', ')}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <Badge tone="neutral" size="sm">
                          {membres.length} membre{membres.length > 1 ? 's' : ''}
                        </Badge>
                        {membres.some((m) => m.privilegie) && (
                          <Badge tone="violet" size="sm">
                            {membres.filter((m) => m.privilegie).length} privilégié
                          </Badge>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card>
              <CardHeader
                titre="Actions récentes de l’équipe"
                sousTitre="Sur les ressources des clients. Ces lignes figurent aussi dans le journal de chaque organisation."
              />
              <div className="space-y-1.5">
                {AUDIT.filter((a) => EQUIPE_SYNELIA.some((m) => m.nom === a.actor.nom))
                  .slice(0, 6)
                  .map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-b border-g-100 pb-1.5 last:border-0"
                    >
                      <span className="min-w-0">
                        <span className="text-[12px] font-semibold text-ink">{a.actor.nom}</span>
                        <span className="ml-2 font-mono text-[11px] text-p-700">{a.action}</span>
                        <span className="block text-[10.5px] text-g-500">
                          {a.orgNom ?? 'Plateforme'} · {a.scope.label}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <Badge
                          tone={a.result === 'ok' ? 'ok' : a.result === 'refuse' ? 'warn' : 'err'}
                          size="sm"
                        >
                          {a.result === 'ok' ? 'Succès' : a.result === 'refuse' ? 'Refusé' : 'Erreur'}
                        </Badge>
                        <span className="text-[10.5px] text-g-500">{relatif(a.ts)}</span>
                      </span>
                    </div>
                  ))}
              </div>
              <ButtonLink size="sm" variant="ghost" className="mt-3" href="/admin/audit">
                Journal d’audit complet
              </ButtonLink>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'roles' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Matrice des permissions fournisseur"
              sousTitre="Les mêmes règles que côté client s’appliquent à nous : une action interdite n’est pas cachée, elle est désactivée et le refus est journalisé."
            />
            <RoleMatrix roles={ROLES_FOURNISSEUR} />
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Rôles fournisseur"
                sousTitre="Trois rôles seulement, aux périmètres nettement séparés."
              />
              <div className="space-y-2.5">
                {ROLES_FOURNISSEUR.map((r) => {
                  const actions = MATRICE_RBAC.filter((a) => can(r, a.id) === 'full')
                  const lecture = MATRICE_RBAC.filter((a) => can(r, a.id) === 'read')
                  const membres = EQUIPE_SYNELIA.filter((m) => m.role === r)
                  return (
                    <div key={r} className="rounded-[8px] border border-g-300 p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[13px] font-bold text-ink">{ROLE_LABEL[r]}</span>
                        <span className="flex flex-wrap items-center gap-1.5">
                          <Badge tone="ok" size="sm">
                            {actions.length} actions complètes
                          </Badge>
                          <Badge tone="neutral" size="sm">
                            {lecture.length} en lecture
                          </Badge>
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11.5px] leading-relaxed text-g-700">
                        {r === 'provider_admin'
                          ? 'Pilotage complet de la plateforme : capacité, catalogue, organisations, partenaires, finance. Le rôle le plus étendu, réservé à deux ou trois personnes.'
                          : r === 'provider_operator'
                            ? 'Exploitation quotidienne : capacité, provisionnements, tickets, supervision. Ne peut pas modifier le catalogue, la tarification ni les contrats partenaires.'
                            : 'Consultation seule sur l’ensemble de la plateforme. Le rôle à donner à un auditeur externe ou pendant une période d’intégration.'}
                      </p>
                      <p className="mt-2 text-[11px] text-g-500">
                        {membres.length} membre{membres.length > 1 ? 's' : ''} :{' '}
                        {membres.map((m) => m.nom).join(', ') || 'aucun'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card>
              <CardHeader
                titre="Séparation des pouvoirs"
                sousTitre="Ce qu’un rôle seul ne peut pas faire, délibérément."
              />
              <div className="space-y-2">
                {[
                  {
                    r: 'Modifier le catalogue et la tarification',
                    d: 'Réservé à l’administrateur de plateforme. Un opérateur qui pourrait changer un prix pourrait aussi consentir une remise non validée.',
                  },
                  {
                    r: 'Agréer ou retirer un partenaire',
                    d: 'Réservé à l’administrateur. Un agrément engage contractuellement l’entreprise.',
                  },
                  {
                    r: 'Suspendre une organisation',
                    d: 'Réservé à l’administrateur, avec saisie du nom exact et motif écrit. Une suspension arrête l’activité d’un client.',
                  },
                  {
                    r: 'Accéder au contenu des données d’un client',
                    d: 'Aucun rôle ne le permet par défaut. Il faut une élévation nominative, motivée, bornée, notifiée au client et journalisée dans son audit.',
                  },
                  {
                    r: 'Supprimer une entrée du journal d’audit',
                    d: 'Aucun rôle ne le permet, y compris l’administrateur de plateforme. Le chaînage cryptographique rend l’opération techniquement impossible.',
                  },
                ].map((x) => (
                  <div key={x.r} className="rounded-[6px] border border-p-300 bg-p-050 px-3 py-2.5">
                    <p className="flex items-start gap-1.5 text-[12.5px] font-semibold text-ink">
                      <ShieldCheck size={12} className="mt-0.5 shrink-0 text-p-700" />
                      {x.r}
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-700">{x.d}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'astreinte' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Rotation d’astreinte"
              sousTitre="Une personne d’astreinte par semaine, plus un second niveau joignable. L’astreinte est rémunérée et compensée en repos : une astreinte non payée est une astreinte non tenue."
            />
            <div className="overflow-x-auto rounded-[8px] border border-g-300">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Semaine', 'Premier niveau', 'Second niveau', 'Sollicitations', 'Statut'].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { s: '17 – 23 août', n1: 'Cheick Coulibaly', n2: 'Marina Gbagbo', n: 2, statut: 'en cours' },
                    { s: '24 – 30 août', n1: 'Marina Gbagbo', n2: 'Jean-Vincent Kassi', n: 0, statut: 'à venir' },
                    { s: '31 août – 6 sept.', n1: 'Cheick Coulibaly', n2: 'Marina Gbagbo', n: 0, statut: 'à venir' },
                    { s: '10 – 16 août', n1: 'Marina Gbagbo', n2: 'Cheick Coulibaly', n: 4, statut: 'terminée' },
                    { s: '3 – 9 août', n1: 'Cheick Coulibaly', n2: 'Marina Gbagbo', n: 1, statut: 'terminée' },
                  ].map((x) => (
                    <tr key={x.s} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5 text-[12.5px] font-semibold text-ink">{x.s}</td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2">
                          <Avatar nom={x.n1} size="sm" />
                          <span className="text-[12px] text-ink">{x.n1}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2">
                          <Avatar nom={x.n2} size="sm" />
                          <span className="text-[12px] text-g-700">{x.n2}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {x.n > 0 ? (
                          <Badge tone={x.n > 3 ? 'warn' : 'neutral'} size="sm">
                            {x.n} appel{x.n > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-[11.5px] text-g-500">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          tone={
                            x.statut === 'en cours' ? 'info' : x.statut === 'terminée' ? 'ok' : 'neutral'
                          }
                          dot={x.statut === 'en cours'}
                          size="sm"
                        >
                          {x.statut}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Callout ton="warn" className="mt-4" titre="Quatre sollicitations en une semaine">
              La semaine du 10 août, l’astreinte a été appelée quatre fois, dont deux la même nuit.
              C’est le signe d’un problème de fond, pas d’une malchance : deux de ces appels
              concernaient la même alerte mal calibrée. Une astreinte trop sollicitée finit par ne plus
              répondre, ou par démissionner.
            </Callout>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Règles d’astreinte"
                sousTitre="Ce que nous nous engageons à tenir envers les personnes d’astreinte."
              />
              <div className="space-y-2">
                {[
                  {
                    r: 'Astreinte rémunérée et compensée en repos',
                    d: 'Une semaine d’astreinte donne droit à une prime et à un jour de repos. Une astreinte non payée est une astreinte que personne ne prend au sérieux.',
                  },
                  {
                    r: 'Deux semaines d’astreinte maximum par mois',
                    d: 'Au-delà, la fatigue dégrade la qualité des interventions et la vie personnelle de la personne.',
                  },
                  {
                    r: 'Un second niveau toujours joignable',
                    d: 'La personne d’astreinte n’est jamais seule face à un incident majeur. Elle peut escalader sans avoir à se justifier.',
                  },
                  {
                    r: 'Aucune astreinte sans procédure écrite',
                    d: 'Chaque type d’alerte a une procédure documentée. Réveiller quelqu’un à 3 h sans lui dire quoi faire est une faute d’organisation.',
                  },
                  {
                    r: 'Une alerte non actionnable est un défaut à corriger',
                    d: 'Si la procédure est « attendre et voir », l’alerte ne devrait pas réveiller quelqu’un. Nous révisons les seuils plutôt que d’habituer l’équipe à ignorer.',
                  },
                ].map((x) => (
                  <div key={x.r} className="rounded-[6px] border border-g-300 px-3 py-2.5">
                    <p className="text-[12.5px] font-semibold text-ink">{x.r}</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-700">{x.d}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader
                titre="Sollicitations récentes"
                sousTitre="Chaque appel de nuit doit pouvoir se justifier le lendemain matin."
              />
              <div className="space-y-2">
                {[
                  {
                    q: '2026-08-16T22:14:00Z',
                    qui: 'Marina Gbagbo',
                    m: 'Sauvegarde en échec sur ONECI — intervention nécessaire',
                    j: true,
                  },
                  {
                    q: '2026-08-14T02:41:00Z',
                    qui: 'Marina Gbagbo',
                    m: 'Charge processeur supérieure à 80 % sur CL-GRA-01',
                    j: false,
                  },
                  {
                    q: '2026-08-14T01:08:00Z',
                    qui: 'Marina Gbagbo',
                    m: 'Charge processeur supérieure à 80 % sur CL-GRA-01 (même alerte)',
                    j: false,
                  },
                  {
                    q: '2026-08-11T23:52:00Z',
                    qui: 'Marina Gbagbo',
                    m: 'Perte de paquets sur le lien opérateur nord — incident réel',
                    j: true,
                  },
                ].map((x) => (
                  <div
                    key={x.q}
                    className={cn(
                      'rounded-[6px] border px-3 py-2.5',
                      x.j ? 'border-g-300' : 'border-warn/40 bg-warn-bg',
                    )}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="min-w-0 text-[12px] text-ink">{x.m}</span>
                      <Badge tone={x.j ? 'ok' : 'warn'} size="sm">
                        {x.j ? 'Justifiée' : 'Non justifiée'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[10.5px] text-g-500">
                      {x.qui} · {dateHeure(x.q)}
                    </p>
                  </div>
                ))}
              </div>
              <Callout ton="warn" className="mt-4" titre="Deux réveils pour la même alerte mal calibrée">
                Le seuil de charge processeur à 80 % est inadapté sur un socle dimensionné pour tourner
                à 75 %. Ces deux appels étaient évitables. Le seuil a été porté à 92 % avec une durée
                de dépassement de 20 minutes.
              </Callout>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'acces' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Politique d’accès de l’équipe"
              sousTitre="Ce que nous nous imposons, et qui vaut aussi pour la direction."
            />
            <div className="space-y-3.5">
              <Switch
                checked={politique.mfa}
                onChange={(v) => setPolitique((c) => ({ ...c, mfa: v }))}
                label="Deuxième facteur obligatoire"
                description="Sans exception, y compris pour la direction. Un compte privilégié sans deuxième facteur est la porte d’entrée la plus rentable pour un attaquant."
              />
              <Switch
                checked
                disabled
                label="Aucun accès permanent aux données des clients"
                description="Non désactivable. L’accès au contenu exige une élévation nominative, motivée, bornée et notifiée au client."
              />
              <Switch
                checked={politique.elevationBornee}
                onChange={(v) => setPolitique((c) => ({ ...c, elevationBornee: v }))}
                label="Élévation limitée à huit heures"
                description="Au-delà, il faut une nouvelle demande. Le système refuse une élévation sans date de fin."
              />
              <Switch
                checked={politique.journalisationFine}
                onChange={(v) => setPolitique((c) => ({ ...c, journalisationFine: v }))}
                label="Journalisation de chaque action pendant une élévation"
                description="Individuellement, pas globalement. Le client voit ce qui a été fait, pas seulement qu’un accès a eu lieu."
              />
              <Switch
                checked
                disabled
                label="Notification du client sur toute intervention"
                description="Non désactivable pour une intervention. Un accès dont le client n’est pas averti n’est pas légitime."
              />
              <Switch
                checked={politique.revueTrimestrielle}
                onChange={(v) => setPolitique((c) => ({ ...c, revueTrimestrielle: v }))}
                label="Révision trimestrielle des comptes privilégiés"
                description="Chaque compte privilégié est réexaminé : son détenteur en a-t-il encore besoin ? Le privilège qui s’accumule est le pire ennemi de la sécurité."
              />
              <Switch
                checked={politique.sessionCourte}
                onChange={(v) => setPolitique((c) => ({ ...c, sessionCourte: v }))}
                label="Session expirée après 4 heures d’inactivité"
                description="Plus court que pour les clients, parce que les droits sont plus étendus."
              />
              <Switch
                checked={politique.restrictionIp}
                onChange={(v) => setPolitique((c) => ({ ...c, restrictionIp: v }))}
                label="Restreindre l’accès aux adresses de l’entreprise"
                description="Écarté : nos équipes doivent pouvoir intervenir depuis n’importe où en astreinte. La contrainte serait contre-productive et contournée."
              />
            </div>
            <GatedAction autorise={autorise('reseller.manage')} message={refus('reseller.manage')}>
              <Button className="mt-4" variant="secondary" onClick={enregistrerPolitique}>
                Enregistrer la politique
              </Button>
            </GatedAction>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader
                titre="Révision des comptes privilégiés"
                sousTitre="Dernière revue trimestrielle : 4 juin 2026."
              />
              <div className="space-y-2">
                {privilegies.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-p-300 bg-p-050 px-3 py-2.5"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar nom={m.nom} size="sm" />
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-semibold text-ink">{m.nom}</span>
                        <span className="block text-[10.5px] text-g-500">
                          {m.equipe} · {ROLE_LABEL[m.role] ?? m.role}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <Badge tone="ok" size="sm">
                        Confirmé en juin
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setChangementRole(null)
                          setDetail(m)
                        }}
                      >
                        Réexaminer
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
              <Callout ton="violet" className="mt-4" titre="Deux comptes privilégiés retirés en juin">
                Deux personnes qui avaient obtenu un accès privilégié pour un projet ponctuel l’avaient
                conservé six mois après la fin du projet. C’est exactement ce que la revue trimestrielle
                sert à trouver : le privilège ne se retire jamais tout seul.
              </Callout>
            </Card>

            <Card>
              <CardHeader
                titre="Départ d’un membre de l’équipe"
                sousTitre="La procédure, exécutée le jour même du départ."
              />
              <ol className="space-y-2">
                {[
                  'Désactivation du compte dans l’annuaire interne — coupe tous les accès simultanément',
                  'Révocation de tous les jetons d’API émis à son nom',
                  'Fermeture des sessions actives, portail et interfaces d’exploitation',
                  'Retrait des rotations d’astreinte et réassignation de ses tickets',
                  'Révocation de ses clés SSH sur les socles techniques',
                  'Rotation des secrets partagés auxquels il avait accès',
                  'Consignation dans le journal d’audit, avec la date et l’auteur de l’opération',
                ].map((x, i) => (
                  <li key={x} className="flex gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-p-050 text-[10px] font-bold text-p-700">
                      {i + 1}
                    </span>
                    <span className="text-[11.5px] leading-relaxed text-ink">{x}</span>
                  </li>
                ))}
              </ol>
              <Callout ton="warn" className="mt-4" titre="La rotation des secrets partagés est l’étape oubliée">
                Désactiver un compte est facile et systématique. Faire tourner les secrets partagés
                qu’une personne connaissait — mots de passe de service, clés d’accès techniques — est
                fastidieux, et c’est précisément pour cela que c’est presque toujours négligé. C’est
                pourtant la seule étape qui protège d’un départ conflictuel.
              </Callout>
            </Card>
          </div>
        </div>
      )}

      <Drawer
        open={ouvert !== null}
        onClose={() => {
          setDetail(null)
          setChangementRole(null)
        }}
        title={ouvert?.nom ?? ''}
        size="md"
      >
        {ouvert && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar nom={ouvert.nom} size="lg" />
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-ink">{ouvert.nom}</p>
                <p className="text-[12px] text-g-500">{ouvert.email}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge tone={ouvert.privilegie ? 'violet' : 'neutral'} size="sm">
                    {ROLE_LABEL[ouvert.role] ?? ouvert.role}
                  </Badge>
                  {ouvert.privilegie && (
                    <Badge tone="violet" dot size="sm">
                      Compte privilégié
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <KeyValueList
              colonnes={1}
              items={[
                { cle: 'Équipe', valeur: ouvert.equipe },
                { cle: 'Rôle', valeur: ROLE_LABEL[ouvert.role] ?? ouvert.role },
                { cle: 'Compte privilégié', valeur: ouvert.privilegie ? 'Oui' : 'Non' },
                { cle: 'Dernier accès', valeur: `${dateHeure(ouvert.dernierAcces)} (${relatif(ouvert.dernierAcces)})` },
                { cle: 'Deuxième facteur', valeur: 'Actif — obligatoire' },
                {
                  cle: 'Tickets en cours',
                  valeur: String(ticketsDe(ouvert.nom).length),
                },
                {
                  cle: 'Élévation active',
                  valeur: ouvert.elevation?.active
                    ? `Oui, jusqu’à ${ouvert.elevation.jusqua ? dateHeure(ouvert.elevation.jusqua) : '—'}`
                    : 'Non',
                },
              ]}
            />

            {ouvert.elevation?.active && (
              <Callout ton="warn" titre="Élévation de privilège en cours">
                <span className="inline-flex items-start gap-1.5">
                  <KeyRound size={13} className="mt-0.5 shrink-0" />
                  <span>
                    Motif : {ouvert.elevation.justification ?? 'non renseigné'}. Cette élévation est
                    visible dans le journal d’audit de l’organisation concernée, avec le nom de{' '}
                    {ouvert.nom.split(' ')[0]} et ce motif. Elle expire d’elle-même.
                  </span>
                </span>
              </Callout>
            )}

            <div>
              <MicroLabel className="mb-2">Ce que ce rôle autorise</MicroLabel>
              <div className="space-y-1">
                {MATRICE_RBAC.filter((a) => can(ouvert.role, a.id) !== 'none')
                  .slice(0, 10)
                  .map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-[5px] bg-g-050 px-2.5 py-1.5"
                    >
                      <span className="min-w-0 truncate text-[11.5px] text-ink">{a.libelle}</span>
                      <Badge
                        tone={can(ouvert.role, a.id) === 'full' ? 'ok' : 'neutral'}
                        size="sm"
                      >
                        {can(ouvert.role, a.id) === 'full' ? 'Complet' : 'Lecture'}
                      </Badge>
                    </div>
                  ))}
              </div>
              <p className="mt-2 text-[11px] text-g-500">
                {MATRICE_RBAC.filter((a) => can(ouvert.role, a.id) !== 'none').length} actions au
                total. Aucune ne donne accès au contenu des données d’un client sans élévation.
              </p>
            </div>

            <div className="space-y-3 border-t border-g-100 pt-4">
              {changementRole !== null && (
                <div className="rounded-[8px] border border-p-300 bg-p-050 p-3">
                  <Field
                    label="Nouveau rôle"
                    hint="le droit minimum pour faire le travail"
                  >
                    <Select
                      value={changementRole}
                      onChange={(e) => setChangementRole(e.target.value as Role)}
                    >
                      {ROLES_FOURNISSEUR.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]} —{' '}
                          {MATRICE_RBAC.filter((a) => can(r, a.id) === 'full').length} actions
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      disabled={changementRole === ouvert.role}
                      onClick={() => appliquerRole(ouvert, changementRole)}
                    >
                      Appliquer
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setChangementRole(null)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                <GatedAction
                  autorise={autorise('reseller.manage')}
                  message={refus('reseller.manage')}
                >
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setChangementRole(ouvert.role)}
                  >
                    Changer le rôle
                  </Button>
                </GatedAction>
                <GatedAction
                  autorise={autorise('reseller.manage')}
                  message={refus('reseller.manage')}
                >
                  <Button size="sm" variant="ghost" onClick={() => basculerPrivilege(ouvert)}>
                    {ouvert.privilegie ? 'Retirer le privilège' : 'Passer privilégié'}
                  </Button>
                </GatedAction>
                {ouvert.elevation?.active && (
                  <Button size="sm" variant="ghost" onClick={() => revoquerElevation(ouvert)}>
                    Révoquer l’élévation
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => fermerSessions(ouvert)}>
                  Fermer les sessions actives
                </Button>
                <GatedAction
                  autorise={autorise('reseller.manage')}
                  message={refus('reseller.manage')}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-err hover:bg-err-bg"
                    iconBefore={<UserMinus size={12} />}
                    onClick={() => setRetrait(ouvert)}
                  >
                    Retirer de l’équipe
                  </Button>
                </GatedAction>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={ajout}
        onClose={() => setAjout(false)}
        title="Ajouter un membre de l’équipe"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAjout(false)}>
              Annuler
            </Button>
            <Button disabled={!recrueValide} onClick={ajouterMembre}>
              Ajouter et inviter
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Nom complet"
            required
            error={
              recrue.nom !== '' && !nomValide ? 'Prénom et nom sont attendus.' : undefined
            }
          >
            <Input
              value={recrue.nom}
              onChange={(e) => setRecrue((r) => ({ ...r, nom: e.target.value }))}
              placeholder="Prénom Nom"
              autoFocus
            />
          </Field>
          <Field
            label="Adresse professionnelle"
            required
            hint="doit appartenir au domaine synelia.tech"
            error={
              recrue.email !== '' && !emailValide
                ? 'Une adresse @synelia.tech est attendue.'
                : undefined
            }
          >
            <Input
              type="email"
              value={recrue.email}
              onChange={(e) => setRecrue((r) => ({ ...r, email: e.target.value }))}
              placeholder="prenom.nom@synelia.tech"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Équipe" required>
              <Select
                value={recrue.equipe}
                onChange={(e) => setRecrue((r) => ({ ...r, equipe: e.target.value }))}
              >
                <option value="">Sélectionner…</option>
                {equipes.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Rôle" hint="le droit minimum pour faire le travail">
              <Select
                value={recrue.role}
                onChange={(e) => setRecrue((r) => ({ ...r, role: e.target.value as Role }))}
              >
                {ROLES_FOURNISSEUR.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]} — {MATRICE_RBAC.filter((a) => can(r, a.id) === 'full').length}{' '}
                    actions
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="space-y-3">
            <Switch
              checked
              disabled
              label="Exiger le deuxième facteur avant tout accès"
              description="Non désactivable. La personne devra l’enregistrer à sa première connexion."
            />
            <Switch
              checked={recrue.privilegie}
              onChange={(v) => setRecrue((r) => ({ ...r, privilegie: v }))}
              label="Compte privilégié"
              description="Réservé aux quelques personnes qui pilotent réellement la plateforme. Chaque compte privilégié est réexaminé chaque trimestre."
            />
            <Switch
              checked={recrue.astreinte}
              onChange={(v) => setRecrue((r) => ({ ...r, astreinte: v }))}
              label="Inscrire dans la rotation d’astreinte"
              description="À activer après la période d’intégration et la formation aux procédures d’incident."
            />
          </div>
          <Callout ton="violet" titre="Commencer par le rôle de consultation">
            Sur une arrivée, le rôle de consultation permet de découvrir la plateforme sans risque de
            fausse manœuvre. L’élargissement vient ensuite, quand le besoin est constaté — l’inverse est
            beaucoup plus difficile à faire accepter.
          </Callout>
        </div>
      </Modal>

      <ConfirmDialog
        open={retrait !== null}
        onClose={() => setRetrait(null)}
        titre="Retirer un membre de l’équipe"
        ressource={retrait?.email ?? ''}
        libelleAction="Retirer et révoquer les accès"
        pertes={[
          'Le compte est désactivé dans l’annuaire interne — tous les accès sont coupés simultanément',
          'Tous ses jetons d’API et ses clés SSH sont révoqués',
          'Ses sessions actives sont fermées immédiatement',
          `Ses ${retrait ? ticketsDe(retrait.nom).length : 0} tickets en cours devront être réassignés`,
          'Les secrets partagés auxquels il avait accès devront être renouvelés — étape distincte, à ne pas oublier',
        ]}
        onConfirm={() => retrait && retirerMembre(retrait)}
      />
    </div>
  )
}
