'use client'

import { useState } from 'react'
import {
  Code2,
  Globe,
  Link2,
  MessageCircle,
  MessageSquare,
  Mic,
  PhoneCall,
  Plus,
  Radio,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { num, pct } from '@/lib/format'
import {
  CATEGORIE_OUTIL_LABEL,
  TYPE_CANAL_LABEL,
  type CategorieOutil,
  type OutilAgent,
  type TypeCanal,
} from '@/lib/types'
import { AGENTS_IA, CANAUX_AGENT, OUTILS_AGENT, ROUTEUR_OMNICANAL } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CodeBlock, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { Modal } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { DataTable, type Colonne } from '@/components/composition/data-table'
import { StatTile } from '@/components/composition/metrics'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'outils', label: 'Outils' },
  { id: 'canaux', label: 'Canaux' },
]

const ICONE_CANAL: Record<TypeCanal, React.ReactNode> = {
  widget: <Globe size={16} />,
  whatsapp: <MessageCircle size={16} />,
  telegram: <Send size={16} />,
  sms: <MessageSquare size={16} />,
  voix: <Mic size={16} />,
  ivr: <PhoneCall size={16} />,
  rest: <Code2 size={16} />,
  websocket: <Radio size={16} />,
}

const TON_CATEGORIE: Record<CategorieOutil, 'neutral' | 'violet' | 'info' | 'ok'> = {
  integre: 'neutral',
  interne: 'violet',
  openapi: 'info',
  mcp: 'ok',
}

const TON_ETAT = {
  connecte: 'ok',
  a_configurer: 'warn',
  erreur: 'err',
  indisponible: 'neutral',
} as const

const LIBELLE_ETAT = {
  connecte: 'Connecté',
  a_configurer: 'À configurer',
  erreur: 'En erreur',
  indisponible: 'Indisponible',
} as const

export default function OutilsEtCanaux() {
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('outils')
  const [declaration, setDeclaration] = useState(false)

  const peutDeclarer = autorise('ia.tool.register')
  const actifs = OUTILS_AGENT.filter((o) => o.statut === 'actif')
  const appels = OUTILS_AGENT.reduce((a, o) => a + o.appels24h, 0)
  const ecrivains = OUTILS_AGENT.filter((o) => o.effet === 'ecriture')
  const connectes = CANAUX_AGENT.filter((c) => c.etat === 'connecte')
  const messages = CANAUX_AGENT.reduce((a, c) => a + c.messages24h, 0)

  const colonnes: Array<Colonne<OutilAgent>> = [
    {
      id: 'nom',
      entete: 'Outil',
      cle: (o) => o.nom,
      rendu: (o) => (
        <span className="block">
          <span className="block font-mono text-[12.5px] font-semibold text-ink">{o.nom}</span>
          <span className="block text-[11px] text-g-500">{o.fournisseur}</span>
        </span>
      ),
    },
    {
      id: 'categorie',
      entete: 'Origine',
      cle: (o) => o.categorie,
      rendu: (o) => (
        <Badge tone={TON_CATEGORIE[o.categorie]} size="sm">
          {o.categorie === 'integre'
            ? 'Plateforme'
            : o.categorie === 'interne'
              ? 'API interne'
              : o.categorie === 'openapi'
                ? 'OpenAPI'
                : 'MCP'}
        </Badge>
      ),
    },
    {
      id: 'effet',
      entete: 'Effet',
      cle: (o) => o.effet,
      rendu: (o) => (
        <span className="flex flex-wrap gap-1.5">
          <Badge tone={o.effet === 'ecriture' ? 'warn' : 'neutral'} size="sm">
            {o.effet === 'ecriture' ? 'Écrit' : 'Lit'}
          </Badge>
          {o.confirmationRequise && (
            <Badge tone="violet" size="sm">
              Confirmation
            </Badge>
          )}
        </span>
      ),
    },
    {
      id: 'signature',
      entete: 'Signature',
      masquable: true,
      masqueeParDefaut: true,
      cle: (o) => o.signature,
      rendu: (o) => (
        <span className="block max-w-md truncate font-mono text-[11px] text-g-500">
          {o.signature}
        </span>
      ),
    },
    {
      id: 'auth',
      entete: 'Authentification',
      masquable: true,
      cle: (o) => o.authentification,
      rendu: (o) => <span className="text-[11.5px] text-g-500">{o.authentification}</span>,
    },
    {
      id: 'agents',
      entete: 'Agents',
      aligne: 'right',
      cle: (o) => AGENTS_IA.filter((a) => a.outils.includes(o.id)).length,
      rendu: (o) => {
        const n = AGENTS_IA.filter((a) => a.outils.includes(o.id)).length
        return <span className="tnum text-[12px] text-g-700">{n}</span>
      },
    },
    {
      id: 'appels',
      entete: 'Appels 24 h',
      aligne: 'right',
      cle: (o) => o.appels24h,
      rendu: (o) => num(o.appels24h),
    },
    {
      id: 'erreurs',
      entete: 'Erreurs',
      aligne: 'right',
      cle: (o) => o.tauxErreurPct,
      rendu: (o) => (
        <span className={cn('tnum text-[12px]', o.tauxErreurPct > 5 ? 'font-semibold text-err' : 'text-g-700')}>
          {pct(o.tauxErreurPct, 1)}
        </span>
      ),
    },
    {
      id: 'latence',
      entete: 'Latence',
      aligne: 'right',
      masquable: true,
      cle: (o) => o.latenceP50Ms,
      rendu: (o) => `${num(o.latenceP50Ms)} ms`,
    },
    {
      id: 'statut',
      entete: 'État',
      cle: (o) => o.statut,
      rendu: (o) => (
        <Badge
          tone={o.statut === 'actif' ? 'ok' : o.statut === 'erreur' ? 'err' : 'neutral'}
          dot
          size="sm"
        >
          {o.statut === 'actif' ? 'Actif' : o.statut === 'erreur' ? 'En erreur' : 'Inactif'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'IA & Agents', href: '/app/ia' },
          { label: 'Outils & canaux' },
        ]}
        titre="Outils & canaux"
        sousTitre="Deux directions opposées, réunies parce qu’elles décident ensemble de ce qu’un agent peut faire : les outils sont ce qu’il appelle, les canaux sont ce qui l’appelle. Un agent sans outil ne sait que parler ; un agent sans canal ne parle à personne."
        actions={
          <GatedAction autorise={peutDeclarer} message={refus('ia.tool.register')}>
            <Button iconBefore={<Plus size={14} />} onClick={() => setDeclaration(true)}>
              Déclarer un outil
            </Button>
          </GatedAction>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          libelle="Outils actifs"
          valeur={actifs.length}
          detail={`sur ${OUTILS_AGENT.length} déclarés`}
        />
        <StatTile
          libelle="Appels d’outils 24 h"
          valeur={num(appels)}
          detail={`${ecrivains.length} outils écrivent, le reste lit`}
        />
        <StatTile
          libelle="Canaux connectés"
          valeur={connectes.length}
          detail={`sur ${CANAUX_AGENT.length} disponibles`}
          ton="ok"
        />
        <StatTile libelle="Messages 24 h" valeur={num(messages)} detail="Tous canaux confondus" />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'outils' && (
        <div className="space-y-4">
          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3">
              <CardHeader
                titre="Catalogue d’outils"
                sousTitre="Un outil déclaré ici n’est pas pour autant accessible : il faut encore l’attribuer explicitement à un agent."
                className="mb-0"
              />
            </div>
            <DataTable
              lignes={OUTILS_AGENT}
              colonnes={colonnes}
              recherche
              placeholderRecherche="Rechercher un outil, un fournisseur…"
              filtres={[
                {
                  id: 'categorie',
                  libelle: 'Origine',
                  options: [
                    { value: 'integre', label: 'Plateforme' },
                    { value: 'interne', label: 'API interne' },
                    { value: 'openapi', label: 'OpenAPI' },
                    { value: 'mcp', label: 'Serveur MCP' },
                  ],
                },
                {
                  id: 'effet',
                  libelle: 'Effet',
                  options: [
                    { value: 'lecture', label: 'Lit seulement' },
                    { value: 'ecriture', label: 'Écrit' },
                  ],
                },
              ]}
              selection={(o, id, valeur) =>
                id === 'categorie' ? o.categorie === valeur : o.effet === valeur
              }
              parPage={13}
              exportable
            />
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Callout ton="warn" titre="Ce qui écrit demande une décision">
              {ecrivains.length} outils de ce catalogue modifient quelque chose : un ticket, un
              fichier, un message envoyé. Tous demandent une confirmation humaine sauf l’ouverture de
              ticket, où le coût d’un ticket de trop est plus faible que celui d’un client qui
              attend. Ce réglage se justifie outil par outil ; il ne se met pas par défaut.
            </Callout>
            <Callout ton="violet" titre="La portée se vérifie côté API">
              Écrire dans la consigne « ne consulte que la facture du client appelant » ne protège
              rien. Ce qui protège, c’est un jeton dont la portée ne permet pas d’en lire une autre.
              Chaque outil de ce catalogue porte son mode d’authentification pour cette raison :
              c’est là que se joue le cloisonnement, pas dans le texte de la consigne.
            </Callout>
            <Callout ton="err" titre="Un outil en erreur ne se voit pas dans les réponses">
              Le serveur MCP des journaux dépasse son délai sur 6,4 % des appels depuis le 17 août.
              L’agent n’en dit rien : il répond avec ce qu’il a, c’est-à-dire moins. Sans cette page,
              la dégradation se lirait seulement dans la qualité perçue, semaines plus tard.
            </Callout>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Importer un schéma OpenAPI"
                sousTitre="La plateforme lit le schéma et propose les opérations. Vous cochez celles que l’agent aura le droit d’appeler — les autres restent invisibles pour lui."
              />
              <CodeBlock
                langue="bash"
                code={`# Le schéma est lu une fois, à l'import, puis figé.
# Une opération ajoutée côté API n'apparaît pas toute seule.

POST /v1/outils
{
  "type": "openapi",
  "nom": "crm_client",
  "schema_url": "https://crm.dba.africa/openapi.json",
  "operations": ["getClient", "getHistorique", "getEncours"],
  "auth": { "type": "oauth2", "secret": "{{ vault:org-dba/crm#secret }}" }
}`}
              />
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-g-500">
                Sur le CRM interne, six opérations sur trente sont exposées. Les vingt-quatre autres
                — toutes celles qui écrivent — sont volontairement absentes du schéma importé.
              </p>
            </Card>

            <Card>
              <CardHeader
                titre="Rattacher un serveur MCP"
                sousTitre="Un serveur MCP expose ses propres ressources et outils. La plateforme n’en garde que ce que vous autorisez, avec un jeton de portée limitée."
              />
              <CodeBlock
                langue="bash"
                code={`POST /v1/outils
{
  "type": "mcp",
  "nom": "supervision",
  "url": "https://mcp.centreon.synelia.tech/sse",
  "portee": "lecture",
  "outils_autorises": ["hotes", "services", "statut", "historique"],
  "auth": { "type": "bearer", "secret": "{{ vault:org-dba/mcp/centreon#token }}" }
}`}
              />
              <div className="mt-3 border-t border-g-100 pt-3">
                <MicroLabel className="mb-2">Serveurs MCP rattachés</MicroLabel>
                <div className="space-y-1.5">
                  {OUTILS_AGENT.filter((o) => o.categorie === 'mcp').map((o) => (
                    <div
                      key={o.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-g-300 px-2.5 py-2"
                    >
                      <span className="font-mono text-[12px] text-ink">{o.nom}</span>
                      <span className="flex items-center gap-2">
                        <span className="tnum text-[11px] text-g-500">
                          {num(o.appels24h)} appels · {pct(o.tauxErreurPct, 1)}
                        </span>
                        <Badge tone={o.statut === 'actif' ? 'ok' : 'err'} dot size="sm">
                          {o.statut === 'actif' ? 'Actif' : 'En erreur'}
                        </Badge>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'canaux' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CANAUX_AGENT.map((c) => (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-p-050 text-p-700">
                      {ICONE_CANAL[c.type]}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink">
                        {TYPE_CANAL_LABEL[c.type]}
                      </span>
                      <span className="block truncate text-[11px] text-g-500">{c.fournisseur}</span>
                    </span>
                  </span>
                  <Badge tone={TON_ETAT[c.etat]} dot size="sm">
                    {LIBELLE_ETAT[c.etat]}
                  </Badge>
                </div>

                <p className="mt-3 break-all font-mono text-[11px] text-g-700">{c.identifiant}</p>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-g-100 pt-2.5">
                  <span className="block">
                    <MicroLabel>Messages 24 h</MicroLabel>
                    <span className="tnum block text-[12.5px] font-semibold text-ink">
                      {c.messages24h > 0 ? num(c.messages24h) : '—'}
                    </span>
                  </span>
                  <span className="block">
                    <MicroLabel>Latence</MicroLabel>
                    <span className="tnum block text-[12.5px] font-semibold text-ink">
                      {c.latenceMs > 0 ? `${num(c.latenceMs)} ms` : '—'}
                    </span>
                  </span>
                </div>

                <p className="mt-2.5 text-[11.5px] leading-relaxed text-g-500">{c.note}</p>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {c.contexteOmnicanal && (
                    <Badge tone="violet" size="sm">
                      <Link2 size={10} className="mr-1 inline" aria-hidden />
                      Contexte partagé
                    </Badge>
                  )}
                  {c.agents.length > 0 ? (
                    <Badge tone="neutral" size="sm">
                      {c.agents.length} agent{c.agents.length > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <Badge tone="neutral" size="sm">
                      Aucun agent
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Routeur de contexte omnicanal"
                sousTitre="Une conversation commencée par SMS et poursuivie sur WhatsApp reste la même conversation."
              />
              <KeyValueList
                colonnes={1}
                items={[
                  { cle: 'Clé de rapprochement', valeur: ROUTEUR_OMNICANAL.cle },
                  {
                    cle: 'Fenêtre de reprise',
                    valeur: `${ROUTEUR_OMNICANAL.fenetreHeures} heures — au-delà, un nouveau fil commence`,
                  },
                  {
                    cle: 'Canaux couverts',
                    valeur: `${ROUTEUR_OMNICANAL.canauxCouverts} sur ${CANAUX_AGENT.length}`,
                  },
                  {
                    cle: 'Reprises sur 24 h',
                    valeur: `${num(ROUTEUR_OMNICANAL.reprises24h)} conversations recollées`,
                  },
                ]}
              />
              <Callout ton="warn" className="mt-4" titre="Ce que le rapprochement suppose">
                Le numéro de téléphone identifie l’appareil, pas la personne. Un téléphone partagé,
                une carte SIM rendue, un standard d’entreprise : dans ces cas, le routeur recolle
                deux conversations qui n’auraient pas dû l’être. C’est pourquoi la fenêtre est courte
                et pourquoi aucune donnée de classe réglementée n’est reprise d’un canal à l’autre.
              </Callout>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader
                  titre="Ce que chaque canal impose"
                  sousTitre="Un même agent ne répond pas pareil selon le tuyau. Ces contraintes ne se contournent pas."
                />
                <div className="space-y-2.5">
                  {[
                    {
                      canal: 'SMS',
                      contrainte:
                        '160 caractères par segment, trois segments au plus. Au-delà, l’agent renvoie un lien plutôt qu’un roman découpé.',
                    },
                    {
                      canal: 'WhatsApp',
                      contrainte:
                        'Tout message sortant hors fenêtre de 24 h doit passer par un modèle validé par Meta. Comptez 48 h de validation.',
                    },
                    {
                      canal: 'Voix et serveur vocal',
                      contrainte:
                        'La réponse est lue à voix haute : pas de liste à puces, pas de référence de document, des phrases courtes.',
                    },
                    {
                      canal: 'WebSocket',
                      contrainte:
                        'Une connexion ouverte compte dans le quota de débit, pas dans celui des requêtes. Mille connexions inactives coûtent quand même.',
                    },
                  ].map((x) => (
                    <div key={x.canal} className="rounded-[6px] border border-g-300 px-3 py-2.5">
                      <p className="text-[12.5px] font-semibold text-ink">{x.canal}</p>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-500">
                        {x.contrainte}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Callout ton="info" titre="Le serveur vocal attend son plan de numérotation">
                Le trunk SIP est ouvert depuis le 12 août, mais aucun appel n’arrive : le plan de
                numérotation reste à écrire avec l’exploitant téléphonie. Un canal à moitié branché
                est affiché comme tel plutôt que masqué — c’est la seule façon que quelqu’un s’en
                occupe.
              </Callout>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={declaration}
        onClose={() => setDeclaration(false)}
        title="Déclarer un outil"
        description="Un outil déclaré n’est utilisable qu’une fois attribué à un agent. La déclaration ne donne aucun accès par elle-même."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeclaration(false)}>
              Annuler
            </Button>
            <GatedAction autorise={peutDeclarer} message={refus('ia.tool.register')}>
              <Button
                onClick={() => {
                  setDeclaration(false)
                  pousser({
                    ton: 'ok',
                    titre: 'Outil déclaré',
                    detail: 'Attribuez-le à un agent pour qu’il devienne appelable.',
                  })
                }}
              >
                Déclarer
              </Button>
            </GatedAction>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Origine" hint="Détermine ce que la plateforme attend ensuite">
            <Select defaultValue="openapi">
              <option value="openapi">Schéma OpenAPI — une API que vous exposez déjà</option>
              <option value="mcp">Serveur MCP — outils et ressources décrits par le protocole</option>
              <option value="interne">API interne — déclaration manuelle de la signature</option>
            </Select>
          </Field>
          <Field label="Nom appelable" hint="En minuscules, sans espace : c’est ce que le modèle écrira" required>
            <Input placeholder="crm_client" />
          </Field>
          <Field label="URL du schéma ou du serveur" required>
            <Input placeholder="https://crm.dba.africa/openapi.json" />
          </Field>
          <Field label="Secret d’authentification" hint="Référencez le coffre, ne collez pas la valeur">
            <Input placeholder="{{ vault:org-dba/crm#secret }}" />
          </Field>
          <Switch
            checked
            label="Exiger une confirmation humaine"
            description="Recommandé pour tout outil qui modifie quelque chose. Un agent qui écrit sans confirmation engage votre organisation à la vitesse d’une boucle."
          />
          <Callout ton="info" titre="Les opérations se choisissent après l’import">
            La plateforme lit le schéma, liste les opérations et vous laisse cocher celles que les
            agents pourront appeler. Tout ce qui n’est pas coché reste invisible pour eux.
          </Callout>
        </div>
      </Modal>
    </div>
  )
}
