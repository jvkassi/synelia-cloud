'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, Link2, RefreshCw, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateHeure, relatif } from '@/lib/format'
import { ORG_COURANTE, SERVICES_MANAGES, USERS } from '@/lib/mock'
import { ROLE_LABEL, type Role } from '@/lib/types'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { CodeBlock, CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, MonoTextarea, Select, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { Stepper, Timeline } from '@/components/composition/flow'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'etat', label: 'État de la fédération' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'correspondances', label: 'Correspondance des rôles' },
  { id: 'services', label: 'Services raccordés' },
  { id: 'journal', label: 'Journal des connexions' },
]

const PROTOCOLES = [
  {
    id: 'oidc',
    nom: 'OpenID Connect',
    detail: 'Le choix par défaut. Fonctionne avec Microsoft Entra ID, Google Workspace, Okta, Authentik.',
  },
  {
    id: 'saml',
    nom: 'SAML 2.0',
    detail: 'Pour les annuaires d’entreprise qui ne proposent que ce protocole, ou lorsque votre politique l’impose.',
  },
  {
    id: 'ldap',
    nom: 'LDAP / Active Directory',
    detail: 'Synchronisation d’un annuaire interne. Nécessite un tunnel vers votre réseau.',
  },
]

export default function Sso() {
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('etat')
  const [protocole, setProtocole] = useState('oidc')
  const [etape, setEtape] = useState(1)

  const federes = USERS.filter((u) => u.idpSource !== 'local').length
  const servicesSso = SERVICES_MANAGES.filter((s) => s.sso.actif).length

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Authentification unique' }]}
        titre={
          <span>
            Authentification <span className="text-m-600">unique</span>
          </span>
        }
        sousTitre="Vos collaborateurs se connectent avec l’identité de votre entreprise, et cette identité les suit dans tous les services managés — messagerie, partage de fichiers, ERP — sans aucun mot de passe supplémentaire à retenir ni à distribuer."
        meta={
          <>
            <Badge tone="ok" dot size="sm">
              Fédération active
            </Badge>
            <Badge tone="accent" size="sm">
              {servicesSso} services raccordés
            </Badge>
            <Badge tone="neutral" size="sm">
              {ORG_COURANTE.nom}
            </Badge>
          </>
        }
        actions={
          <GatedAction autorise={autorise('sso.configure')} message={refus('sso.configure')}>
            <Button variant="secondary" iconBefore={<RefreshCw size={14} />}>
              Tester la connexion
            </Button>
          </GatedAction>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          libelle="Comptes fédérés"
          valeur={federes}
          detail={`sur ${USERS.length} membres`}
          ton="ok"
        />
        <StatTile
          libelle="Services raccordés"
          valeur={servicesSso}
          detail={`sur ${SERVICES_MANAGES.length} services managés`}
          ton="accent"
        />
        <StatTile
          libelle="Connexions 24 h"
          valeur={184}
          detail="Dont 12 refusées"
        />
        <StatTile
          libelle="Deuxième facteur"
          valeur="Délégué"
          detail="Appliqué par votre annuaire"
          ton="ok"
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'etat' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Le trajet d’une connexion"
              sousTitre="Comprendre où se trouve le mot de passe est la première question de sécurité que pose un DSI. Voici la réponse, sans détour."
            />
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              {[
                {
                  n: 1,
                  t: 'Votre annuaire',
                  d: 'Microsoft Entra ID. C’est là que réside l’identité de vos collaborateurs, et nulle part ailleurs.',
                  accent: false,
                },
                {
                  n: 2,
                  t: 'Notre fournisseur d’identité',
                  d: 'Keycloak, à Abidjan. Il fait confiance à votre annuaire et délivre un jeton pour la session. Il ne stocke aucun mot de passe de vos collaborateurs.',
                  accent: true,
                },
                {
                  n: 3,
                  t: 'Ce portail',
                  d: 'Reçoit le jeton, en lit les rôles, affiche ce à quoi ils donnent droit. Aucun champ de mot de passe n’existe dans ce portail.',
                  accent: false,
                },
                {
                  n: 4,
                  t: 'Les services managés',
                  d: 'Nextcloud, Grommunio, Odoo. Ils acceptent le même jeton. Un clic sur « Ouvrir » et la session est déjà ouverte.',
                  accent: true,
                },
              ].map((e, i, arr) => (
                <div key={e.n} className="relative">
                  <div
                    className={cn(
                      'h-full rounded-[8px] border px-3.5 py-3',
                      e.accent ? 'border-m-600/40 bg-m-050' : 'border-g-300',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold',
                        e.accent ? 'bg-m-600 text-white' : 'bg-p-050 text-p-700',
                      )}
                    >
                      {e.n}
                    </span>
                    <p className="mt-2 text-[12.5px] font-bold text-ink">{e.t}</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-g-700">{e.d}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <ArrowRight
                      size={14}
                      className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-g-300 lg:block"
                    />
                  )}
                </div>
              ))}
            </div>
            <Callout ton="violet" className="mt-4" titre="Ce portail ne stocke aucun mot de passe">
              Il n’en affiche même pas le champ. Une réinitialisation, une politique de complexité, une
              expiration : tout cela se règle dans votre annuaire, qui reste seul maître de l’identité.
              Si vous coupez la fédération, l’accès de vos collaborateurs cesse immédiatement — sans que
              nous ayons à intervenir.
            </Callout>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Fédération configurée"
                sousTitre="Microsoft Entra ID · OpenID Connect"
                actions={
                  <Badge tone="ok" dot size="sm">
                    Opérationnelle
                  </Badge>
                }
              />
              <KeyValueList
                colonnes={1}
                items={[
                  { cle: 'Protocole', valeur: 'OpenID Connect (autorisation par code, avec PKCE)' },
                  { cle: 'Fournisseur', valeur: 'Microsoft Entra ID' },
                  {
                    cle: 'Domaine de découverte',
                    valeur: 'dba.africa — une adresse de ce domaine est redirigée automatiquement',
                  },
                  { cle: 'Deuxième facteur', valeur: 'Délégué à Entra ID (conditionnel par emplacement)' },
                  { cle: 'Provisionnement', valeur: 'À la première connexion, sur correspondance de groupe' },
                  { cle: 'Dernière synchronisation', valeur: relatif('2026-08-19T15:04:00Z') },
                  { cle: 'Certificat de signature', valeur: 'Valide jusqu’au 14 février 2027' },
                ]}
              />
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-g-100 pt-4">
                <GatedAction autorise={autorise('sso.configure')} message={refus('sso.configure')}>
                  <Button size="sm" variant="secondary" onClick={() => setOnglet('configuration')}>
                    Modifier la configuration
                  </Button>
                </GatedAction>
                <Button size="sm" variant="ghost" iconBefore={<RefreshCw size={12} />}>
                  Forcer une synchronisation
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeader
                titre="Vérifications automatiques"
                sousTitre="Contrôlées toutes les cinq minutes."
              />
              <div className="space-y-2">
                {[
                  { t: 'Point de découverte joignable', ok: true, d: 'La configuration OpenID de votre annuaire répond en 84 ms.' },
                  { t: 'Certificat de signature valide', ok: true, d: 'Expire dans 179 jours. Nous vous préviendrons 30 jours avant.' },
                  { t: 'Correspondance des groupes', ok: true, d: 'Les cinq groupes déclarés existent dans votre annuaire.' },
                  { t: 'Horloges synchronisées', ok: true, d: 'Un décalage supérieur à cinq minutes invaliderait les jetons.' },
                  { t: 'Réclamation de courriel présente', ok: true, d: 'Indispensable : c’est l’identifiant de rattachement.' },
                  { t: 'Déconnexion propagée', ok: false, d: 'La déconnexion depuis un service ne ferme pas la session dans votre annuaire. À activer côté Entra ID.' },
                ].map((v) => (
                  <div
                    key={v.t}
                    className={cn(
                      'rounded-[6px] border px-3 py-2.5',
                      v.ok ? 'border-g-300' : 'border-warn/40 bg-warn-bg',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                        {v.ok && <CheckCircle2 size={12} className="shrink-0 text-ok" />}
                        {v.t}
                      </span>
                      <Badge tone={v.ok ? 'ok' : 'warn'} size="sm">
                        {v.ok ? 'Conforme' : 'À corriger'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-500">{v.d}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'configuration' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Protocole"
              sousTitre="Un seul protocole à la fois. Changer de protocole exige de reconfigurer la fédération de bout en bout."
            />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {PROTOCOLES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProtocole(p.id)}
                  className={cn(
                    'rounded-[8px] border-2 px-3.5 py-3 text-left transition-colors',
                    protocole === p.id ? 'border-p-700 bg-p-050' : 'border-g-300 hover:border-p-400',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-ink">{p.nom}</span>
                    {protocole === p.id && <CheckCircle2 size={14} className="shrink-0 text-p-700" />}
                  </span>
                  <span className="mt-1 block text-[11.5px] leading-relaxed text-g-700">
                    {p.detail}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <Stepper
              etapes={[
                { numero: 1, titre: 'Déclarer l’application chez vous' },
                { numero: 2, titre: 'Renseigner les paramètres ici' },
                { numero: 3, titre: 'Tester puis activer' },
              ]}
              courante={etape}
              onChange={setEtape}
              className="mb-4"
            />

            {etape === 1 && (
              <div className="space-y-4">
                <CardHeader
                  titre="Déclarer Synelia Cloud dans votre annuaire"
                  sousTitre="Copiez ces valeurs dans la déclaration d’application de votre annuaire. Elles ne changeront pas."
                  className="mb-0"
                />
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <CopyField
                    label="URL de redirection"
                    value="https://identite.synelia.cloud/realms/org-dba/broker/entra/endpoint"
                  />
                  <CopyField
                    label="URL de déconnexion"
                    value="https://identite.synelia.cloud/realms/org-dba/protocol/openid-connect/logout"
                  />
                  <CopyField label="Identifiant de l’entité" value="synelia-cloud-org-dba" />
                  <CopyField
                    label="Réclamations attendues"
                    value="email, given_name, family_name, groups"
                  />
                </div>
                <Callout ton="info" titre="La réclamation de groupes est indispensable">
                  Sans elle, nous ne pouvons pas déduire le rôle d’un collaborateur, et toute connexion
                  aboutirait au rôle le plus restreint. Dans Entra ID, il faut l’ajouter explicitement
                  dans la configuration du jeton — elle n’y est pas par défaut.
                </Callout>
                <Button onClick={() => setEtape(2)}>Continuer</Button>
              </div>
            )}

            {etape === 2 && (
              <div className="space-y-4">
                <CardHeader
                  titre="Paramètres de votre annuaire"
                  sousTitre="Le secret est chiffré au repos et n’est jamais réaffiché après enregistrement."
                  className="mb-0"
                />
                {protocole === 'oidc' && (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Field
                      label="URL de découverte"
                      hint="se termine par /.well-known/openid-configuration"
                    >
                      <Input defaultValue="https://login.microsoftonline.com/8f2a91c4-d7b0-e544-3a17-c96e2f0d8b41/v2.0/.well-known/openid-configuration" />
                    </Field>
                    <Field label="Identifiant client">
                      <Input defaultValue="4d91a7c2-8b0e-4413-9c6e-2f0d8b41a17c" />
                    </Field>
                    <Field label="Secret client" hint="chiffré au repos, jamais réaffiché">
                      <Input type="password" defaultValue="••••••••••••••••••••••••" />
                    </Field>
                    <Field label="Portées demandées">
                      <Input defaultValue="openid profile email groups" />
                    </Field>
                    <Field
                      label="Domaines de découverte"
                      hint="une adresse de ces domaines est redirigée automatiquement vers votre annuaire"
                    >
                      <Input defaultValue="dba.africa, digitalbusinessafrica.ci" />
                    </Field>
                    <Field label="Réclamation portant les groupes">
                      <Input defaultValue="groups" />
                    </Field>
                  </div>
                )}
                {protocole === 'saml' && (
                  <div className="space-y-4">
                    <Field label="URL des métadonnées du fournisseur d’identité">
                      <Input placeholder="https://sso.exemple.ci/FederationMetadata.xml" />
                    </Field>
                    <Field
                      label="ou métadonnées collées"
                      hint="XML — utile si vos métadonnées ne sont pas exposées publiquement"
                    >
                      <MonoTextarea rows={6} placeholder="<EntityDescriptor …>" />
                    </Field>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Format de l’identifiant">
                        <Select defaultValue="email">
                          <option value="email">Adresse électronique</option>
                          <option value="persistent">Identifiant persistant</option>
                          <option value="transient">Identifiant transitoire</option>
                        </Select>
                      </Field>
                      <Field label="Attribut portant les groupes">
                        <Input defaultValue="http://schemas.xmlsoap.org/claims/Group" />
                      </Field>
                    </div>
                  </div>
                )}
                {protocole === 'ldap' && (
                  <div className="space-y-4">
                    <Callout ton="warn" titre="LDAP exige une connectivité réseau vers votre annuaire">
                      Nous ne joignons pas votre contrôleur de domaine depuis Internet. Il faut un
                      tunnel IPsec ou une interconnexion depuis un de vos Espaces Cloud. Comptez une
                      demi-journée de mise en place avec nos équipes.
                    </Callout>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Serveur" hint="joignable depuis un de vos espaces">
                        <Input placeholder="ldaps://dc01.interne.dba.africa:636" />
                      </Field>
                      <Field label="Base de recherche">
                        <Input placeholder="OU=Utilisateurs,DC=dba,DC=africa" />
                      </Field>
                      <Field label="Compte de liaison">
                        <Input placeholder="CN=svc-synelia,OU=Services,DC=dba,DC=africa" />
                      </Field>
                      <Field label="Mot de passe du compte de liaison">
                        <Input type="password" />
                      </Field>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => setEtape(1)}>
                    Retour
                  </Button>
                  <Button onClick={() => setEtape(3)}>Continuer</Button>
                </div>
              </div>
            )}

            {etape === 3 && (
              <div className="space-y-4">
                <CardHeader
                  titre="Tester avant d’activer"
                  sousTitre="Le test ouvre une fenêtre de connexion réelle, sans modifier la configuration active. Vous verrez exactement le jeton reçu et les rôles qui en découlent."
                  className="mb-0"
                />
                <div className="rounded-[8px] border border-g-300 bg-g-050 p-4">
                  <MicroLabel className="mb-2">Résultat du dernier test</MicroLabel>
                  <div className="space-y-1.5">
                    {[
                      { t: 'Redirection vers votre annuaire', ok: true },
                      { t: 'Authentification acceptée', ok: true },
                      { t: 'Jeton reçu et signature vérifiée', ok: true },
                      { t: 'Réclamation email présente', ok: true },
                      { t: 'Réclamation groups présente — 3 groupes', ok: true },
                      { t: 'Correspondance de rôle trouvée : Administrateur d’organisation', ok: true },
                    ].map((r) => (
                      <div key={r.t} className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="shrink-0 text-ok" />
                        <span className="text-[12px] text-ink">{r.t}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-g-500">
                    Test exécuté par Léa Konan le {dateHeure('2026-08-19T14:12:00Z')}
                  </p>
                </div>
                <div className="space-y-3">
                  <Switch
                    checked
                    label="Créer automatiquement les comptes à la première connexion"
                    description="Un collaborateur d’un groupe reconnu obtient son accès sans invitation préalable. Sans cela, chaque arrivée exige une invitation manuelle."
                  />
                  <Switch
                    checked
                    label="Désactiver les comptes disparus de l’annuaire"
                    description="À la synchronisation, un compte absent de votre annuaire est désactivé ici. C’est ce qui garantit qu’un départ coupe réellement les accès."
                  />
                  <Switch
                    checked={false}
                    label="Autoriser les comptes locaux en parallèle"
                    description="Utile pour un prestataire externe qui n’est pas dans votre annuaire. Chaque compte local est une exception à surveiller."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => setEtape(2)}>
                    Retour
                  </Button>
                  <GatedAction autorise={autorise('sso.configure')} message={refus('sso.configure')}>
                    <Button
                      onClick={() =>
                        pousser({
                          ton: 'ok',
                          titre: 'Fédération enregistrée',
                          detail: 'Les prochaines connexions passeront par votre annuaire. Votre session actuelle reste valide.',
                        })
                      }
                    >
                      Activer la fédération
                    </Button>
                  </GatedAction>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {onglet === 'correspondances' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Correspondance groupes → rôles"
              sousTitre="Un groupe de votre annuaire donne un rôle chez nous. C’est ce qui permet de gérer les accès depuis votre annuaire, sans repasser par ce portail à chaque mouvement d’équipe."
            />
            <div className="space-y-2">
              {[
                { groupe: 'SYN-CLOUD-ADMINS', role: 'org_admin' as Role, membres: 2, portee: 'Organisation' },
                { groupe: 'SYN-CLOUD-INFRA', role: 'infra_admin' as Role, membres: 4, portee: 'Organisation' },
                { groupe: 'SYN-CLOUD-DEV-PROD', role: 'app_admin' as Role, membres: 8, portee: 'EC-DBA-01' },
                { groupe: 'SYN-CLOUD-FINANCE', role: 'billing_admin' as Role, membres: 2, portee: 'Organisation' },
                { groupe: 'Tout le personnel', role: 'read_only' as Role, membres: 142, portee: 'Organisation' },
              ].map((c) => (
                <div
                  key={c.groupe}
                  className="flex flex-wrap items-center gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[12px] font-semibold text-ink">
                      {c.groupe}
                    </span>
                    <span className="block text-[10.5px] text-g-500">
                      {c.membres} membres dans votre annuaire
                    </span>
                  </span>
                  <ArrowRight size={13} className="shrink-0 text-g-300" />
                  <span className="flex shrink-0 items-center gap-1.5">
                    <Badge tone="violet" size="sm">
                      {ROLE_LABEL[c.role]}
                    </Badge>
                    <Badge tone="neutral" size="sm">
                      {c.portee}
                    </Badge>
                  </span>
                  <Button size="sm" variant="ghost">
                    Modifier
                  </Button>
                </div>
              ))}
            </div>
            <GatedAction autorise={autorise('sso.configure')} message={refus('sso.configure')}>
              <Button size="sm" variant="secondary" className="mt-3" iconBefore={<Link2 size={12} />}>
                Ajouter une correspondance
              </Button>
            </GatedAction>
            <Callout ton="warn" className="mt-4" titre="L’ordre compte">
              Les correspondances sont évaluées de haut en bas, et la première qui s’applique gagne.
              Placez « Tout le personnel » en dernier : sinon, tout le monde obtiendrait le rôle de
              consultation, y compris vos administrateurs.
            </Callout>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Sans correspondance"
                sousTitre="Ce qui arrive à quelqu’un qui s’authentifie sans appartenir à aucun groupe reconnu."
              />
              <div className="space-y-3">
                <Field label="Comportement par défaut">
                  <Select defaultValue="refus">
                    <option value="refus">Refuser la connexion (recommandé)</option>
                    <option value="lecture">Attribuer le rôle de consultation</option>
                    <option value="attente">Créer le compte en attente de validation</option>
                  </Select>
                </Field>
                <Callout ton="info" titre="Pourquoi refuser plutôt que donner la lecture">
                  Le rôle de consultation donne accès à la topologie de votre infrastructure, aux noms
                  de vos machines et à vos métriques. Ce n’est pas rien. Si votre annuaire contient des
                  comptes externes, un refus par défaut est le réglage prudent.
                </Callout>
              </div>
            </Card>

            <Card>
              <CardHeader
                titre="Simuler une connexion"
                sousTitre="Voir quel rôle obtiendrait une personne, sans qu’elle ait à se connecter."
              />
              <div className="space-y-4">
                <Field label="Adresse électronique">
                  <Input defaultValue="k.toure@dba.africa" />
                </Field>
                <Field label="Groupes de l’annuaire" hint="un par ligne">
                  <MonoTextarea rows={3} defaultValue={'SYN-CLOUD-DEV-PROD\nTout le personnel'} />
                </Field>
                <Button variant="secondary">Simuler</Button>
                <div className="rounded-[6px] border border-ok/40 bg-ok-bg px-3 py-2.5">
                  <p className="text-[12px] font-semibold text-ink">
                    Résultat : Administrateur d’application, portée EC-DBA-01
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-g-700">
                    Correspondance retenue : SYN-CLOUD-DEV-PROD, évaluée avant « Tout le personnel ».
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'services' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Services raccordés à l’authentification unique"
              sousTitre="Un clic sur « Ouvrir » depuis le portail, et la session est déjà ouverte dans le service. Aucun mot de passe distinct, aucune ressaisie."
            />
            <div className="space-y-2">
              {SERVICES_MANAGES.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-ink">{s.nom}</span>
                    <span className="block font-mono text-[11px] text-g-500">{s.domaine}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {s.sso.actif ? (
                      <Badge tone="accent" size="sm">
                        Authentification unique
                      </Badge>
                    ) : (
                      <Badge tone="warn" size="sm">
                        Mot de passe distinct
                      </Badge>
                    )}
                    <ButtonLink size="sm" variant="ghost" href="/app/web/emails">
                      Administrer
                    </ButtonLink>
                  </span>
                </div>
              ))}
            </div>
            {SERVICES_MANAGES.some((s) => !s.sso.actif) && (
              <Callout ton="warn" className="mt-4" titre="Un service n’est pas encore raccordé">
                Tant qu’un service utilise ses propres mots de passe, le départ d’un collaborateur
                n’en coupe pas l’accès automatiquement. C’est le trou dans la raquette qui explique la
                plupart des accès résiduels après un départ. Le raccordement se fait depuis
                l’administration du service et prend quelques minutes.
              </Callout>
            )}
          </Card>

          <Card>
            <CardHeader
              titre="Ce que le raccordement change concrètement"
              sousTitre="Sur un départ, sur une arrivée, sur un audit."
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  t: 'Une arrivée',
                  sans: 'Créer un compte dans chaque service, transmettre chaque mot de passe, espérer qu’ils soient changés.',
                  avec: 'Ajouter la personne au bon groupe de votre annuaire. Les accès s’ouvrent seuls, avec le bon rôle.',
                },
                {
                  t: 'Un départ',
                  sans: 'Désactiver le compte dans chaque service, un par un, et découvrir six mois plus tard celui qu’on avait oublié.',
                  avec: 'Désactiver le compte dans votre annuaire. Tous les accès cessent, y compris ceux dont vous ne vous souvenez plus.',
                },
                {
                  t: 'Un audit',
                  sans: 'Extraire la liste des comptes de chaque service et les rapprocher à la main.',
                  avec: 'Une seule source de vérité : votre annuaire. Le rapprochement est immédiat.',
                },
              ].map((x) => (
                <div key={x.t} className="rounded-[8px] border border-g-300 p-3.5">
                  <p className="text-[13px] font-bold text-ink">{x.t}</p>
                  <div className="mt-2.5">
                    <MicroLabel className="text-g-500">Sans authentification unique</MicroLabel>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-700">{x.sans}</p>
                  </div>
                  <div className="mt-2.5">
                    <MicroLabel className="text-m-600">Avec</MicroLabel>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink">{x.avec}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {onglet === 'journal' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Connexions récentes"
              sousTitre="Y compris les refus : c’est là que se voient les tentatives d’accès après un départ."
            />
            <Timeline
              evenements={[
                {
                  id: '1',
                  titre: 'Connexion réussie — Léa Konan',
                  detail: 'Via Entra ID · deuxième facteur validé · Abidjan (102.176.x.x)',
                  horodatage: dateHeure('2026-08-19T15:18:00Z'),
                  ton: 'ok',
                },
                {
                  id: '2',
                  titre: 'Connexion réussie — Kouassi Touré',
                  detail: 'Via Entra ID · rôle Administrateur d’application sur EC-DBA-01',
                  horodatage: dateHeure('2026-08-19T14:52:00Z'),
                  ton: 'ok',
                },
                {
                  id: '3',
                  titre: 'Connexion refusée — ancien.collaborateur@dba.africa',
                  detail: 'Compte désactivé dans votre annuaire le 12 août. Aucun accès accordé.',
                  horodatage: dateHeure('2026-08-19T11:04:00Z'),
                  ton: 'err',
                },
                {
                  id: '4',
                  titre: 'Connexion refusée — prestataire@externe.com',
                  detail: 'Aucun groupe reconnu. Comportement par défaut : refus.',
                  horodatage: dateHeure('2026-08-19T09:38:00Z'),
                  ton: 'warn',
                },
                {
                  id: '5',
                  titre: 'Ouverture de session Nextcloud — Mariam Diallo',
                  detail: 'Session propagée depuis le portail, sans ressaisie.',
                  horodatage: dateHeure('2026-08-19T08:22:00Z'),
                  ton: 'info',
                },
                {
                  id: '6',
                  titre: 'Synchronisation d’annuaire',
                  detail: '142 comptes examinés · 1 désactivé · 0 créé',
                  horodatage: dateHeure('2026-08-19T06:00:00Z'),
                  ton: 'neutral',
                },
              ]}
            />
            <ButtonLink size="sm" variant="ghost" className="mt-4" href="/app/securite">
              Voir le journal d’audit complet
            </ButtonLink>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader titre="Points d’attention" />
              <div className="space-y-2.5">
                <div className="rounded-[6px] border border-err/40 bg-err-bg px-3 py-2.5">
                  <p className="text-[12.5px] font-semibold text-ink">
                    Une tentative depuis un compte désactivé
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-700">
                    Le compte d’un collaborateur parti le 12 août a tenté de se connecter ce matin. La
                    fédération a fait son travail : accès refusé. Mais la tentative mérite un coup de
                    téléphone — soit la personne ignore qu’elle n’a plus accès, soit quelqu’un utilise
                    ses identifiants.
                  </p>
                </div>
                <div className="rounded-[6px] border border-warn/40 bg-warn-bg px-3 py-2.5">
                  <p className="text-[12.5px] font-semibold text-ink">
                    La déconnexion n’est pas propagée
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-700">
                    Se déconnecter du portail ne ferme pas la session dans votre annuaire. Sur un poste
                    partagé, la personne suivante peut donc se reconnecter sans ressaisir ses
                    identifiants. Le réglage se trouve côté Entra ID.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader titre="Journal exportable" sousTitre="Pour votre outil de corrélation ou votre commissaire aux comptes." />
              <div className="space-y-3">
                <Field label="Période">
                  <Select defaultValue="30">
                    <option value="7">7 derniers jours</option>
                    <option value="30">30 derniers jours</option>
                    <option value="90">90 derniers jours</option>
                    <option value="365">12 derniers mois</option>
                  </Select>
                </Field>
                <Field label="Format">
                  <Select defaultValue="csv">
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="syslog">Syslog (RFC 5424)</option>
                  </Select>
                </Field>
                <Switch
                  checked={false}
                  label="Envoi continu vers votre collecteur"
                  description="Nous poussons chaque événement d’authentification vers votre outil de corrélation, en temps réel, plutôt que par exports ponctuels."
                />
              </div>
              <GatedAction autorise={autorise('compliance.export')} message={refus('compliance.export')}>
                <Button size="sm" className="mt-3.5" variant="secondary" iconBefore={<ShieldCheck size={12} />}>
                  Exporter
                </Button>
              </GatedAction>
            </Card>
          </div>
        </div>
      )}

      <Card>
        <CardHeader
          titre="Détails techniques"
          sousTitre="Pour votre équipe sécurité, ou pour l’annexe technique d’un appel d’offres."
        />
        <CodeBlock
          langue="json"
          code={`{
  "fournisseur_identite": "Keycloak 26.x, hébergé à Abidjan (ABJ-1)",
  "royaume": "org-dba",
  "protocole": "OpenID Connect 1.0, flux d'autorisation par code avec PKCE",
  "duree_jeton_acces": "5 minutes",
  "duree_jeton_rafraichissement": "8 heures, révocable",
  "algorithme_signature": "RS256, rotation de clé trimestrielle",
  "deuxieme_facteur": "délégué au fournisseur d'identité de l'organisation",
  "stockage_mot_de_passe": "aucun — le portail n'affiche ni ne stocke de mot de passe",
  "propagation_deconnexion": "OIDC RP-Initiated Logout, back-channel disponible",
  "services_raccordes": ["Nextcloud", "Grommunio", "Jitsi", "Odoo", "Metabase", "GitLab"]
}`}
        />
      </Card>
    </div>
  )
}
