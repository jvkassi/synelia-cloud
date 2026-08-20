'use client'

import { useState } from 'react'
import { Download, FileCheck2, Fingerprint, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateHeure, pct, relatif } from '@/lib/format'
import { AUDIT, CONFORMITE, ORG_COURANTE, USERS } from '@/lib/mock'
import { ROLE_LABEL, type Role } from '@/lib/types'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { CodeBlock, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { Drawer } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { DataTable } from '@/components/composition/data-table'
import { Regle321 } from '@/components/business/infra'
import { useApp } from '@/components/app/contexte'
import type { AuditEvent } from '@/lib/types'

const ONGLETS = [
  { id: 'audit', label: 'Journal d’audit' },
  { id: 'posture', label: 'Posture de sécurité' },
  { id: 'conformite', label: 'Conformité des sauvegardes' },
  { id: 'export', label: 'Export & rétention' },
]

export default function Securite() {
  const { autorise, refus, perm, pousser } = useApp()
  const [onglet, setOnglet] = useState('audit')
  const [detail, setDetail] = useState<string | null>(null)

  const peutVoir = perm('audit.view') !== 'none'
  const refuses = AUDIT.filter((a) => a.result === 'refuse').length
  const evenement = AUDIT.find((a) => a.id === detail)

  const conforme321 = (c: (typeof CONFORMITE)[number]) =>
    c.regle321.copies && c.regle321.supports && c.regle321.horsSite
  const conformes = CONFORMITE.filter(conforme321).length

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Sécurité & audit' }]}
        titre="Sécurité et audit"
        sousTitre="Tout ce qui est fait sur votre organisation est enregistré : qui, quoi, quand, depuis quelle adresse, avec quel résultat. Les refus aussi — c’est souvent la ligne la plus utile du journal."
        actions={
          <GatedAction autorise={autorise('compliance.export')} message={refus('compliance.export')}>
            <Button variant="secondary" iconBefore={<Download size={14} />}>
              Exporter le journal
            </Button>
          </GatedAction>
        }
        meta={
          <>
            <Badge tone="neutral" size="sm">
              {ORG_COURANTE.nom}
            </Badge>
            <Badge tone="neutral" size="sm">
              Rétention 24 mois
            </Badge>
            <Badge tone="ok" size="sm">
              Journal inaltérable
            </Badge>
          </>
        }
      />

      {!peutVoir && (
        <Callout ton="warn" titre="Votre rôle ne donne pas accès au journal d’audit">
          Le journal d’audit contient les noms, les adresses et les actions de tous les membres de
          l’organisation. Sa consultation est réservée aux rôles{' '}
          <span className="font-semibold">{ROLE_LABEL['org_admin']}</span> et{' '}
          <span className="font-semibold">{ROLE_LABEL['read_only']}</span>. Les statistiques
          ci-dessous restent visibles, sans les détails nominatifs.
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          libelle="Événements 30 jours"
          valeur={AUDIT.length * 84}
          detail="Toutes actions, tous membres"
        />
        <StatTile
          libelle="Actions refusées"
          valeur={refuses}
          ton={refuses > 0 ? 'warn' : 'ok'}
          detail={refuses > 0 ? 'Rôle insuffisant ou compte désactivé' : 'Aucun refus'}
        />
        <StatTile
          libelle="Deuxième facteur"
          valeur={pct(
            Math.round((USERS.filter((u) => u.mfaEnabled).length / USERS.length) * 100),
          )}
          ton={USERS.every((u) => u.mfaEnabled) ? 'ok' : 'warn'}
          detail={`${USERS.filter((u) => !u.mfaEnabled).length} membre(s) sans deuxième facteur`}
        />
        <StatTile
          libelle="Règle 3-2-1 respectée"
          valeur={`${conformes}/${CONFORMITE.length}`}
          ton={conformes === CONFORMITE.length ? 'ok' : 'warn'}
          detail="Ressources protégées conformément"
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'audit' && (
        <div className="space-y-4">
          {refuses > 0 && (
            <Callout ton="warn" titre={`${refuses} action refusée dans la période`}>
              Un refus n’est pas un incident de sécurité en soi : c’est le contrôle d’accès qui
              fonctionne. Mais un refus répété sur la même action par la même personne signale
              généralement un rôle mal calibré — quelqu’un a besoin d’un droit qu’il n’a pas, et
              contourne probablement en demandant à un collègue de le faire pour lui.
            </Callout>
          )}

          <Card padding={false}>
            <div className="p-4">
              <DataTable<AuditEvent>
                lignes={peutVoir ? AUDIT : []}
                parPage={12}
                exportable
                densiteInitiale="compacte"
                placeholderRecherche="Rechercher une action, un acteur, une ressource…"
                filtres={[
                  {
                    id: 'resultat',
                    libelle: 'Résultat',
                    options: [
                      { value: 'tous', label: 'Tous les résultats' },
                      { value: 'ok', label: 'Succès' },
                      { value: 'refuse', label: 'Refusé' },
                      { value: 'erreur', label: 'Erreur' },
                    ],
                  },
                  {
                    id: 'famille',
                    libelle: 'Famille d’action',
                    options: [
                      { value: 'tous', label: 'Toutes les familles' },
                      { value: 'auth', label: 'Authentification' },
                      { value: 'vm', label: 'Machines' },
                      { value: 'app', label: 'Applications' },
                      { value: 'backup', label: 'Sauvegarde' },
                      { value: 'member', label: 'Membres' },
                      { value: 'capacity', label: 'Capacité' },
                    ],
                  },
                ]}
                selection={(l, fid, val) => {
                  if (fid === 'resultat') return l.result === val
                  if (fid === 'famille') return l.action.startsWith(val)
                  return true
                }}
                colonnes={[
                  {
                    id: 'ts',
                    entete: 'Horodatage',
                    cle: (a) => a.ts,
                    rendu: (a) => (
                      <span className="block">
                        <span className="block text-[11.5px] text-ink">{dateHeure(a.ts)}</span>
                        <span className="block text-[10px] text-g-500">{relatif(a.ts)}</span>
                      </span>
                    ),
                  },
                  {
                    id: 'acteur',
                    entete: 'Acteur',
                    cle: (a) => `${a.actor.nom} ${a.actor.email}`,
                    rendu: (a) => (
                      <span className="block">
                        <span className="block text-[11.5px] font-semibold text-ink">
                          {a.actor.nom}
                        </span>
                        <span className="block text-[10px] text-g-500">
                          {ROLE_LABEL[a.role] ?? a.role}
                          {a.actor.type !== 'user' ? ` · ${a.actor.type}` : ''}
                        </span>
                      </span>
                    ),
                  },
                  {
                    id: 'action',
                    entete: 'Action',
                    cle: (a) => a.action,
                    rendu: (a) => (
                      <span className="font-mono text-[11px] text-p-700">{a.action}</span>
                    ),
                  },
                  {
                    id: 'cible',
                    entete: 'Ressource',
                    cle: (a) => a.target,
                    rendu: (a) => (
                      <span className="block max-w-[24ch] truncate font-mono text-[11px] text-ink">
                        {a.target}
                      </span>
                    ),
                  },
                  {
                    id: 'resultat',
                    entete: 'Résultat',
                    cle: (a) => a.result,
                    rendu: (a) => (
                      <Badge
                        tone={a.result === 'ok' ? 'ok' : a.result === 'refuse' ? 'warn' : 'err'}
                        dot
                        size="sm"
                      >
                        {a.result === 'ok' ? 'Succès' : a.result === 'refuse' ? 'Refusé' : 'Erreur'}
                      </Badge>
                    ),
                  },
                  {
                    id: 'ip',
                    entete: 'Adresse',
                    cle: (a) => a.ip ?? '',
                    masquable: true,
                    rendu: (a) => (
                      <span className="font-mono text-[10.5px] text-g-500">{a.ip ?? '—'}</span>
                    ),
                  },
                  {
                    id: 'detail',
                    entete: '',
                    aligne: 'right',
                    rendu: (a) => (
                      <Button size="sm" variant="ghost" onClick={() => setDetail(a.id)}>
                        Détail
                      </Button>
                    ),
                  },
                ]}
                vide={
                  peutVoir
                    ? {
                        titre: 'Aucun événement',
                        phrase: 'Aucun événement ne correspond à ces filtres.',
                      }
                    : {
                        titre: 'Rôle insuffisant',
                        phrase:
                          'La consultation du journal d’audit est réservée à l’administrateur d’organisation et au rôle de consultation. Demandez l’attribution de l’un de ces rôles à votre administrateur.',
                        action: { libelle: 'Voir les membres', href: '/app/membres' },
                      }
                }
              />
            </div>
          </Card>

          <Callout ton="violet" titre="Pourquoi le journal ne peut pas être modifié">
            Chaque entrée est écrite une seule fois, avec une empreinte cryptographique chaînée à la
            précédente. Modifier ou supprimer une ligne casserait la chaîne, ce qui serait
            immédiatement détectable. Personne ne peut réécrire l’histoire — ni vous, ni nous. C’est
            la seule façon de rendre un journal d’audit utile pour une certification ou un litige.
          </Callout>
        </div>
      )}

      {onglet === 'posture' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Points de contrôle"
                sousTitre="Constats issus de votre configuration réelle, pas d’une liste de bonnes pratiques génériques."
              />
              <div className="space-y-2">
                {[
                  {
                    t: 'Deuxième facteur obligatoire',
                    etat: 'warn' as const,
                    d: `${USERS.filter((u) => !u.mfaEnabled).length} membre(s) s’authentifient encore avec un mot de passe seul. Le rendre obligatoire au niveau de l’organisation force son activation à la prochaine connexion.`,
                    action: { l: 'Voir les membres', h: '/app/membres' },
                  },
                  {
                    t: 'Fédération d’identité active',
                    etat: 'ok' as const,
                    d: 'Vos collaborateurs s’authentifient via Microsoft Entra ID. Un départ dans votre annuaire coupe l’accès sans intervention de notre part.',
                    action: { l: 'Voir la fédération', h: '/app/sso' },
                  },
                  {
                    t: 'Services managés raccordés',
                    etat: 'warn' as const,
                    d: 'Un service utilise encore ses propres mots de passe. Tant que c’est le cas, un départ n’en coupe pas l’accès automatiquement.',
                    action: { l: 'Voir les projets', h: '/app/projets' },
                  },
                  {
                    t: 'Aucune adresse IP publique sans groupe de sécurité',
                    etat: 'ok' as const,
                    d: 'Toutes les adresses publiques attribuées sont protégées par un groupe de sécurité avec des règles explicites.',
                    action: { l: 'Voir le réseau', h: '/app/reseau' },
                  },
                  {
                    t: 'Chiffrement des volumes',
                    etat: 'ok' as const,
                    d: 'Tous les volumes de bloc et objets sont chiffrés au repos en AES-256.',
                    action: { l: 'Voir le stockage', h: '/app/stockage' },
                  },
                  {
                    t: 'Plan de reprise testé',
                    etat: 'warn' as const,
                    d: 'Un plan de reprise n’a jamais été testé. Un plan non testé est une hypothèse, pas une garantie.',
                    action: { l: 'Voir les plans', h: '/app/pra' },
                  },
                  {
                    t: 'Clés d’accès sans rotation',
                    etat: 'warn' as const,
                    d: 'Deux clés d’accès au stockage objet ont plus de douze mois. Une clé qui ne tourne jamais finit par se retrouver dans un dépôt Git.',
                    action: { l: 'Voir le stockage objet', h: '/app/objet' },
                  },
                  {
                    t: 'Journal d’audit exporté',
                    etat: 'neutral' as const,
                    d: 'Aucun envoi continu vers un collecteur externe. Utile si votre politique exige une conservation hors de la plateforme.',
                    action: { l: 'Configurer l’export', h: '#' },
                  },
                ].map((c) => (
                  <div
                    key={c.t}
                    className={cn(
                      'rounded-[6px] border px-3 py-2.5',
                      c.etat === 'ok'
                        ? 'border-g-300'
                        : c.etat === 'warn'
                          ? 'border-warn/40 bg-warn-bg'
                          : 'border-g-300 bg-g-050',
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[12.5px] font-semibold text-ink">{c.t}</span>
                      <span className="flex items-center gap-1.5">
                        <Badge tone={c.etat} size="sm">
                          {c.etat === 'ok' ? 'Conforme' : c.etat === 'warn' ? 'À traiter' : 'Optionnel'}
                        </Badge>
                        <ButtonLink size="sm" variant="ghost" href={c.action.h}>
                          {c.action.l}
                        </ButtonLink>
                      </span>
                    </div>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-g-700">{c.d}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader
                  titre="Politique d’organisation"
                  sousTitre="Ces réglages s’appliquent à tous les membres, tous les espaces, toutes les applications."
                />
                <div className="space-y-3.5">
                  <Switch
                    checked={false}
                    label="Rendre le deuxième facteur obligatoire"
                    description="Les membres qui ne l’ont pas activé devront le faire à leur prochaine connexion, avant d’accéder à quoi que ce soit."
                  />
                  <Switch
                    checked
                    label="Exiger la saisie du nom exact pour une suppression"
                    description="Non désactivable. Aucune ressource ne se supprime par un simple clic sur « Oui »."
                  />
                  <Switch
                    checked
                    label="Journaliser les actions refusées"
                    description="Non désactivable. Un refus non journalisé est une information perdue."
                  />
                  <Switch
                    checked
                    label="Exiger une approbation pour un déploiement en production"
                    description="Une personne différente de l’auteur doit approuver. C’est la séparation des tâches attendue par la plupart des référentiels."
                  />
                  <Switch
                    checked={false}
                    label="Restreindre l’accès au portail à une liste d’adresses"
                    description="Efficace, mais bloque aussi vos accès en déplacement. À réserver aux organisations dont tous les accès passent par un réseau maîtrisé."
                  />
                  <Switch
                    checked
                    label="Expirer les sessions inactives après 8 heures"
                  />
                </div>
                <GatedAction autorise={autorise('sso.configure')} message={refus('sso.configure')}>
                  <Button className="mt-4" variant="secondary">
                    Enregistrer la politique
                  </Button>
                </GatedAction>
              </Card>

              <Card>
                <CardHeader titre="Élévations de privilège actives" sousTitre="Y compris celles de nos équipes." />
                <div className="rounded-[6px] border border-info/40 bg-info-bg px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                    <Fingerprint size={13} className="shrink-0 text-info" />
                    Aucune élévation active sur votre organisation
                  </p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-g-700">
                    Quand un membre de nos équipes a besoin d’un accès étendu à vos ressources — pour
                    traiter un ticket, par exemple — cet accès est demandé, limité dans le temps,
                    visible ici, et journalisé de bout en bout. Vous savez qui est intervenu, quand,
                    et sur quoi.
                  </p>
                </div>
                <ButtonLink size="sm" variant="ghost" className="mt-3" href="/app/support">
                  Voir les tickets en cours
                </ButtonLink>
              </Card>
            </div>
          </div>
        </div>
      )}

      {onglet === 'conformite' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Règle 3-2-1"
              sousTitre="Trois copies des données, sur deux supports différents, dont une hors site. C’est le minimum au-delà duquel une sauvegarde cesse d’être une garantie."
            />
            <Regle321
              copies={CONFORMITE.every((c) => c.regle321.copies)}
              supports={CONFORMITE.every((c) => c.regle321.supports)}
              horsSite={CONFORMITE.every((c) => c.regle321.horsSite)}
            />
          </Card>

          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3.5">
              <CardHeader
                titre="Conformité par ressource"
                sousTitre="Une ressource non conforme n’est pas nécessairement en danger — mais elle l’est plus qu’elle ne devrait."
                className="mb-0"
                actions={
                  <Badge tone={conformes === CONFORMITE.length ? 'ok' : 'warn'} size="sm">
                    {conformes} conformes sur {CONFORMITE.length}
                  </Badge>
                }
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Ressource', 'Type', 'Copies', 'Supports', 'Hors site', 'Dernière sauvegarde', 'Conformité'].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {CONFORMITE.map((c) => (
                    <tr key={c.ressourceId} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2 font-mono text-[11.5px] font-semibold text-ink">
                        {c.ressourceNom}
                      </td>
                      <td className="px-3 py-2 text-[11.5px] text-g-700">{c.type}</td>
                      <td className="px-3 py-2">
                        <Badge tone={c.regle321.copies ? 'ok' : 'err'} size="sm">
                          {c.regle321.copies ? '3 copies' : 'Moins de 3'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={c.regle321.supports ? 'ok' : 'err'} size="sm">
                          {c.regle321.supports ? '2 supports' : 'Un seul'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={c.regle321.horsSite ? 'ok' : 'err'} size="sm">
                          {c.regle321.horsSite ? 'Oui' : 'Non'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-[11.5px] text-g-500">
                        {c.dernierSucces ? relatif(c.dernierSucces) : 'Jamais'}
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={conforme321(c) ? 'ok' : 'warn'} dot size="sm">
                          {conforme321(c) ? 'Conforme 3-2-1' : 'Non conforme'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {conformes < CONFORMITE.length && (
            <Callout ton="warn" titre="Ce qui manque, concrètement">
              <span className="inline-flex items-start gap-1.5">
                <ShieldAlert size={13} className="mt-0.5 shrink-0" />
                <span>
                  Les ressources non conformes n’ont pas de copie hors site, ou n’ont qu’un seul
                  support. En cas d’incendie dans la salle où elles se trouvent, elles sont perdues.
                  Une copie hors site vers Grand-Bassam s’ajoute depuis le plan de sauvegarde, et
                  coûte le prix du stockage — soit une fraction de ce que coûterait la perte.
                </span>
              </span>
            </Callout>
          )}
        </div>
      )}

      {onglet === 'export' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Export du journal"
              sousTitre="Pour un audit, une certification, ou une remise à votre commissaire aux comptes."
            />
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Du">
                  <Input type="date" defaultValue="2026-07-19" />
                </Field>
                <Field label="Au">
                  <Input type="date" defaultValue="2026-08-19" />
                </Field>
              </div>
              <Field label="Format">
                <Select defaultValue="csv">
                  <option value="csv">CSV — pour un tableur</option>
                  <option value="json">JSON — pour un traitement automatisé</option>
                  <option value="pdf">PDF signé — pour une remise formelle</option>
                  <option value="syslog">Syslog RFC 5424 — pour un collecteur</option>
                </Select>
              </Field>
              <Field label="Périmètre">
                <Select defaultValue="tout">
                  <option value="tout">Toutes les actions</option>
                  <option value="refus">Refus uniquement</option>
                  <option value="admin">Actions d’administration uniquement</option>
                  <option value="acces">Authentification et accès uniquement</option>
                </Select>
              </Field>
              <Switch
                checked
                label="Inclure l’empreinte de chaînage"
                description="Permet à un tiers de vérifier que l’export n’a pas été modifié après extraction. Attendu par la plupart des auditeurs."
              />
            </div>
            <GatedAction autorise={autorise('compliance.export')} message={refus('compliance.export')}>
              <Button
                className="mt-4"
                iconBefore={<FileCheck2 size={14} />}
                onClick={() =>
                  pousser({
                    ton: 'ok',
                    titre: 'Export en préparation',
                    detail: 'Vous recevrez un lien de téléchargement par courriel dans quelques minutes. Le lien expire après 24 heures.',
                  })
                }
              >
                Générer l’export
              </Button>
            </GatedAction>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader titre="Rétention" sousTitre="Ce que nous conservons, et pendant combien de temps." />
              <KeyValueList
                colonnes={1}
                items={[
                  { cle: 'Journal d’audit', valeur: '24 mois en ligne, puis archivage froid 5 ans' },
                  { cle: 'Journaux d’authentification', valeur: '12 mois en ligne' },
                  { cle: 'Journaux applicatifs', valeur: '30 jours en ligne, extensible à 90 jours' },
                  { cle: 'Journaux de sauvegarde', valeur: 'Aussi longtemps que le point de reprise existe' },
                  { cle: 'Factures', valeur: '10 ans — obligation légale' },
                  { cle: 'Tickets de support', valeur: '36 mois' },
                ]}
              />
              <Callout ton="info" className="mt-4" titre="Rétention et effacement">
                Une demande d’effacement d’une donnée personnelle n’efface pas le journal d’audit :
                celui-ci relève d’une obligation de traçabilité, qui prime. En revanche, nous pouvons
                pseudonymiser un acteur dans les exports remis à des tiers.
              </Callout>
            </Card>

            <Card>
              <CardHeader
                titre="Vérifier l’intégrité d’un export"
                sousTitre="À exécuter sur le poste de votre auditeur, sans nous faire confiance."
              />
              <CodeBlock
                langue="bash"
                code={`# Vérifier la chaîne d'empreintes d'un export
synelia-audit verify audit-org-dba-2026-07-19_2026-08-19.csv \\
  --empreinte-attendue 8f2a91c4d7b0e5443a17c96e2f0d8b41

# Sortie attendue
# 1 344 entrées vérifiées
# chaîne intacte du 2026-07-19T00:00:00Z au 2026-08-19T15:20:00Z
# aucune insertion, modification ni suppression détectée`}
              />
              <p className="mt-3 text-[11.5px] leading-relaxed text-g-500">
                L’outil de vérification est libre et son code est publié. Vous n’avez pas à nous croire
                sur parole : n’importe qui peut recalculer la chaîne à partir de l’export.
              </p>
            </Card>
          </div>
        </div>
      )}

      <Drawer
        open={evenement !== undefined}
        onClose={() => setDetail(null)}
        title="Détail de l’événement"
        size="md"
      >
        {evenement && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                tone={
                  evenement.result === 'ok'
                    ? 'ok'
                    : evenement.result === 'refuse'
                      ? 'warn'
                      : 'err'
                }
                dot
              >
                {evenement.result === 'ok'
                  ? 'Succès'
                  : evenement.result === 'refuse'
                    ? 'Refusé'
                    : 'Erreur'}
              </Badge>
              <Badge tone="neutral" size="sm">
                {evenement.id}
              </Badge>
            </div>

            <KeyValueList
              colonnes={1}
              items={[
                { cle: 'Horodatage', valeur: `${dateHeure(evenement.ts)} (${relatif(evenement.ts)})` },
                { cle: 'Acteur', valeur: `${evenement.actor.nom} (${evenement.actor.email})` },
                {
                  cle: 'Rôle au moment de l’action',
                  valeur: ROLE_LABEL[evenement.role] ?? evenement.role,
                },
                { cle: 'Portée', valeur: evenement.scope.label },
                { cle: 'Action', valeur: evenement.action },
                { cle: 'Ressource visée', valeur: evenement.target },
                { cle: 'Adresse source', valeur: evenement.ip ?? '—' },
                { cle: 'Organisation', valeur: ORG_COURANTE.nom },
                { cle: 'Motif', valeur: evenement.detail ?? '—' },
              ]}
            />

            {evenement.result === 'refuse' && (
              <Callout ton="warn" titre="Pourquoi cette action a été refusée">
                Le rôle de l’acteur n’autorisait pas cette action. Le portail affichait le bouton
                désactivé, avec une infobulle nommant le rôle requis — l’action a donc été tentée par
                un autre chemin, ou l’attribution de rôle a changé entre l’affichage et le clic. Dans
                les deux cas, l’action n’a eu aucun effet.
              </Callout>
            )}

            <div>
              <MicroLabel className="mb-2">Entrée brute du journal</MicroLabel>
              <CodeBlock
                langue="json"
                code={JSON.stringify(
                  {
                    id: evenement.id,
                    ts: evenement.ts,
                    org: ORG_COURANTE.id,
                    acteur: evenement.actor,
                    role: evenement.role,
                    portee: evenement.scope,
                    action: evenement.action,
                    cible: evenement.target,
                    resultat: evenement.result,
                    ip: evenement.ip ?? null,
                    detail: evenement.detail ?? null,
                    empreinte_precedente: '8f2a91c4d7b0e544',
                    empreinte: '1b74e0aa93c04d2f',
                  },
                  null,
                  2,
                )}
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
