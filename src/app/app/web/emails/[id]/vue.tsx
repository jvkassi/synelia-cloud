'use client'

import { useState } from 'react'
import { ExternalLink, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { money, relatif } from '@/lib/format'
import { messagerieById } from '@/lib/mock'
import { configurationDuService } from '@/lib/configurations'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink, IconButton } from '@/components/ui/button'
import { CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { Drawer } from '@/components/ui/overlay'
import { PageHeader, Card, CardHeader, Callout, KeyValueList } from '@/components/composition/card'
import { StatTile, QuotaBar } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { ConfigurationServicePanel } from '@/components/business/configuration-service'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'boites', label: 'Boîtes aux lettres' },
  { id: 'alias', label: 'Alias & redirections' },
  { id: 'expedition', label: 'Authentification d’expédition' },
  { id: 'antispam', label: 'Antispam' },
  { id: 'reglages', label: 'Réglages du service' },
]

export function VueMessagerie({ id }: { id: string }) {
  const { autorise, refus, lancer } = useApp()
  const [onglet, setOnglet] = useState('boites')
  const [creation, setCreation] = useState(false)
  const [antivirus, setAntivirus] = useState(true)
  const [rapport, setRapport] = useState(true)
  const [mfaExige, setMfaExige] = useState(true)

  const m = messagerieById(id)
  if (!m) return null
  const config = configurationDuService('email-pro')
  const utilise = m.boites.reduce((a, b) => a + b.utiliseGo, 0)
  const total = m.boites.reduce((a, b) => a + b.quotaGo, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Emails', href: '/app/web/emails' },
          { label: m.domaine },
        ]}
        titre={<span className="break-words font-mono">{m.domaine}</span>}
        sousTitre={`Messagerie ${m.solutionOSS} opérée par Synelia. Les boîtes se créent ici, le courrier se lit dans le webmail.`}
        meta={
          <>
            <Badge tone={m.actif ? 'ok' : 'neutral'} dot={m.actif}>
              {m.actif ? 'Active' : 'À activer'}
            </Badge>
            <Badge tone="neutral">{m.palier}</Badge>
            <Badge tone="neutral">{m.solutionOSS}</Badge>
            <Badge tone="violet">{money(m.prixSiege)} / boîte / mois</Badge>
          </>
        }
        actions={
          m.actif ? (
            <>
              <GatedAction autorise={autorise('seat.assign')} message={refus('seat.assign')}>
                <Button variant="secondary" iconBefore={<Plus size={14} />} onClick={() => setCreation(true)}>
                  Créer une boîte
                </Button>
              </GatedAction>
              <ButtonLink
                href={`https://${m.hoteWebmail}`}
                variant="accent"
                iconAfter={<ExternalLink size={13} />}
              >
                Ouvrir le webmail
              </ButtonLink>
            </>
          ) : (
            <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
              <Button iconBefore={<Plus size={14} />}>Activer la messagerie</Button>
            </GatedAction>
          )
        }
      />

      {!m.actif ? (
        <Card>
          <EmptyState
            titre="La messagerie n’est pas activée sur ce domaine"
            phrase={`L’activation crée les boîtes, pose MX, SPF, DKIM et DMARC dans la zone de ${m.domaine}, et déclare le client SSO. Comptez ${money(m.prixSiege)} par boîte et par mois, facturés au prorata.`}
            action={{
              libelle: 'Activer la messagerie',
              onClick: () => lancer('web.email.activate', m.domaine),
            }}
            actionSecondaire={{ libelle: 'Retour aux messageries', href: '/app/web/emails' }}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              libelle="Boîtes"
              valeur={`${m.boites.length} / ${m.boitesIncluses}`}
              detail={`${m.boites.filter((b) => b.statut === 'active').length} actives`}
            />
            <StatTile
              libelle="Stockage"
              valeur={`${utilise.toFixed(0)} Go`}
              detail={`sur ${total} Go`}
              ton={utilise / total > 0.85 ? 'warn' : 'neutral'}
            />
            <StatTile
              libelle="Sans double facteur"
              valeur={m.boites.filter((b) => !b.mfa).length}
              detail="à corriger"
              ton={m.boites.some((b) => !b.mfa) ? 'warn' : 'ok'}
            />
            <StatTile libelle="En quarantaine" valeur={m.antispam.quarantaine} detail="7 derniers jours" />
          </div>

          <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

          {onglet === 'boites' && (
            <Card padding={false}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse">
                  <thead>
                    <tr className="border-b border-g-300 bg-g-050">
                      {['Adresse', 'Titulaire', 'Quota', 'Double facteur', 'Dernière connexion', 'État', ''].map(
                        (c) => (
                          <th
                            key={c}
                            className="type-micro px-3 py-2 text-left font-semibold text-g-500"
                          >
                            {c}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {m.boites.map((b) => (
                      <tr key={b.adresse} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5 font-mono text-[12px] font-semibold text-ink">
                          {b.adresse}
                        </td>
                        <td className="px-3 py-2.5 text-[12px] text-g-700">{b.nom}</td>
                        <td className="px-3 py-2.5">
                          <QuotaBar
                            libelle=""
                            utilise={b.utiliseGo}
                            total={b.quotaGo}
                            compact
                            formateur={(v) => `${v.toFixed(1)} Go`}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone={b.mfa ? 'ok' : 'warn'} size="sm">
                            {b.mfa ? 'Actif' : 'Absent'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-[11.5px] text-g-700">
                          {b.derniereConnexion ? relatif(b.derniereConnexion) : 'jamais'}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            tone={b.statut === 'active' ? 'ok' : b.statut === 'suspendue' ? 'warn' : 'neutral'}
                            size="sm"
                          >
                            {b.statut === 'active' ? 'Active' : b.statut === 'suspendue' ? 'Suspendue' : 'Archivée'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="flex items-center justify-end gap-1">
                            <IconButton label={`Réinitialiser ${b.adresse}`} size="sm">
                              <RotateCcw size={13} />
                            </IconButton>
                            <GatedAction autorise={autorise('seat.assign')} message={refus('seat.assign')}>
                              <IconButton label={`Supprimer ${b.adresse}`} size="sm">
                                <Trash2 size={13} className="text-err" />
                              </IconButton>
                            </GatedAction>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {onglet === 'alias' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader
                  titre="Alias"
                  sousTitre="Une adresse qui distribue vers une ou plusieurs boîtes existantes. Un alias ne consomme pas de siège."
                  actions={
                    <Button size="sm" variant="secondary" iconBefore={<Plus size={13} />}>
                      Ajouter
                    </Button>
                  }
                />
                <ul className="divide-y divide-g-100">
                  {m.alias.map((a) => (
                    <li key={a.de} className="py-2.5 first:pt-0">
                      <p className="font-mono text-[12.5px] font-semibold text-ink">{a.de}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-g-500">
                        → {a.vers.join(', ')}
                      </p>
                    </li>
                  ))}
                </ul>
                {m.attrapeTout && (
                  <Callout ton="warn" className="mt-3" titre="Attrape-tout actif">
                    Tout courrier adressé à une boîte inexistante de{' '}
                    <span className="font-mono">{m.domaine}</span> arrive dans{' '}
                    <span className="font-mono">{m.attrapeTout}</span>. Pratique, mais cela attire le
                    courrier indésirable : à désactiver dès que les adresses sont stabilisées.
                  </Callout>
                )}
              </Card>

              <Card>
                <CardHeader
                  titre="Redirections"
                  sousTitre="Le message part vers une adresse externe. Avec copie, un exemplaire reste dans la boîte."
                  actions={
                    <Button size="sm" variant="secondary" iconBefore={<Plus size={13} />}>
                      Ajouter
                    </Button>
                  }
                />
                {m.redirections.length === 0 ? (
                  <p className="text-[12.5px] text-g-500">Aucune redirection.</p>
                ) : (
                  <ul className="divide-y divide-g-100">
                    {m.redirections.map((r) => (
                      <li
                        key={r.de}
                        className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[12.5px] font-semibold text-ink">
                            {r.de}
                          </span>
                          <span className="block truncate font-mono text-[11px] text-g-500">
                            → {r.vers}
                          </span>
                        </span>
                        <Badge tone={r.copie ? 'ok' : 'neutral'} size="sm">
                          {r.copie ? 'Avec copie' : 'Sans copie'}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <Callout ton="info" className="mt-3" titre="Attention à la réputation">
                  Rediriger vers une boîte grand public fait relayer par nos serveurs un courrier que
                  nous n’avons pas écrit. Si ce courrier est du spam, c’est notre adresse d’envoi qui
                  en porte la note.
                </Callout>
              </Card>
            </div>
          )}

          {onglet === 'expedition' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader
                  titre="État de l’authentification"
                  sousTitre="Ces trois mécanismes disent aux serveurs destinataires qui a le droit d’écrire en votre nom."
                />
                <div className="space-y-2.5">
                  {[
                    {
                      nom: 'SPF',
                      etat: m.authentification.spf,
                      quoi: 'Liste les serveurs autorisés à envoyer pour ce domaine.',
                    },
                    {
                      nom: 'DKIM',
                      etat: m.authentification.dkim,
                      quoi: 'Signe chaque message avec une clé publiée dans la zone.',
                    },
                    {
                      nom: 'DMARC',
                      etat: m.authentification.dmarc,
                      quoi: 'Dit quoi faire des messages qui échouent aux deux premiers.',
                    },
                  ].map((x) => (
                    <div
                      key={x.nom}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-[6px] border border-g-300 px-3 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-bold text-ink">{x.nom}</span>
                        <span className="block text-[11.5px] leading-snug text-g-500">{x.quoi}</span>
                      </span>
                      <Badge
                        tone={
                          x.etat === 'valide'
                            ? 'ok'
                            : x.etat.includes('quarantine') || x.etat.includes('reject')
                              ? 'ok'
                              : x.etat.includes('none')
                                ? 'warn'
                                : 'err'
                        }
                        size="sm"
                      >
                        {x.etat}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="secondary" size="sm" className="mt-3">
                  Vérifier la publication
                </Button>
              </Card>

              <Card>
                <CardHeader
                  titre="Durcir DMARC"
                  sousTitre="Trois paliers, à franchir dans l’ordre et jamais dans la précipitation."
                />
                <ol className="space-y-2.5">
                  {[
                    {
                      t: 'p=none',
                      d: 'On observe. Les rapports arrivent, rien n’est rejeté. C’est le point de départ, pas l’arrivée.',
                    },
                    {
                      t: 'p=quarantine',
                      d: 'Les messages non authentifiés partent en indésirable chez le destinataire.',
                    },
                    {
                      t: 'p=reject',
                      d: 'Ils sont refusés à la porte. À n’activer qu’après plusieurs semaines de rapports propres.',
                    },
                  ].map((x, i) => (
                    <li key={x.t} className="flex gap-2.5">
                      <span className="tnum mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-p-100 text-[11px] font-bold text-p-700">
                        {i + 1}
                      </span>
                      <span>
                        <span className="font-mono text-[12px] font-bold text-ink">{x.t}</span>
                        <span className="ml-1.5 text-[12px] leading-relaxed text-g-700">{x.d}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="mt-3 border-t border-g-100 pt-3">
                  <MicroLabel>Enregistrement actuel</MicroLabel>
                  <CopyField
                    value={`v=DMARC1; ${m.authentification.dmarc}; rua=mailto:dmarc@${m.domaine}`}
                    mono
                    className="mt-1"
                  />
                </div>
              </Card>
            </div>
          )}

          {onglet === 'antispam' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader
                  titre="Filtrage entrant"
                  sousTitre="Le niveau s’applique à toutes les boîtes du domaine. Chaque titulaire garde ses propres règles de tri dans le webmail."
                />
                <div className="space-y-3">
                  <Field label="Niveau">
                    <Select defaultValue={m.antispam.niveau}>
                      <option value="permissif">Permissif — presque rien n’est retenu</option>
                      <option value="standard">Standard — recommandé</option>
                      <option value="strict">Strict — retient aussi les envois de masse légitimes</option>
                    </Select>
                  </Field>
                  <Switch
                    label="Antivirus des pièces jointes"
                    description="Analyse avant remise. Une pièce infectée est retirée et le message annoté."
                    checked={antivirus}
                    onChange={setAntivirus}
                  />
                  <Switch
                    label="Rapport quotidien de quarantaine"
                    description="Chaque titulaire reçoit la liste de ce qui a été retenu pour lui."
                    checked={rapport}
                    onChange={setRapport}
                  />
                </div>
              </Card>

              <Card>
                <CardHeader
                  titre="Quarantaine"
                  sousTitre={`${m.antispam.quarantaine} messages retenus ces sept derniers jours.`}
                />
                <KeyValueList
                  items={[
                    { cle: 'Rétention', valeur: '30 jours, puis suppression' },
                    { cle: 'Libération', valeur: 'Par le titulaire, depuis son rapport quotidien' },
                    { cle: 'Liste blanche', valeur: 'Par domaine ou par adresse, ici' },
                    { cle: 'Faux positifs signalés', valeur: '3 ce mois' },
                  ]}
                />
                <Callout ton="info" className="mt-3" titre="Pourquoi le portail ne montre pas les messages">
                  Ouvrir la quarantaine dans le portail donnerait à un administrateur le contenu du
                  courrier de ses collègues. La libération appartient au titulaire de la boîte.
                </Callout>
              </Card>
            </div>
          )}

          {onglet === 'reglages' && config && (
            <ConfigurationServicePanel
              config={config}
              autorise={autorise('service.admin')}
              messageRefus={refus('service.admin')}
            />
          )}
        </>
      )}

      <Drawer
        open={creation}
        onClose={() => setCreation(false)}
        title="Créer une boîte aux lettres"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreation(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                setCreation(false)
                lancer('web.email.create', `nouvelle boîte · ${m.domaine}`)
              }}
            >
              Créer la boîte
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Adresse">
            <div className="flex items-center gap-1.5">
              <Input placeholder="prenom.nom" className="min-w-0 flex-1" />
              <span className="shrink-0 font-mono text-[12.5px] text-g-500">@{m.domaine}</span>
            </div>
          </Field>
          <Field label="Titulaire">
            <Input placeholder="Prénom Nom" />
          </Field>
          <Field label="Quota" hint={`${m.boites.length + 1} boîtes sur ${m.boitesIncluses} incluses`}>
            <Select defaultValue="25">
              <option value="10">10 Go</option>
              <option value="25">25 Go</option>
              <option value="50">50 Go</option>
            </Select>
          </Field>
          <Switch
            label="Exiger le double facteur"
            description="Recommandé. Le titulaire le configure à sa première connexion."
            checked={mfaExige}
            onChange={setMfaExige}
          />
          <Callout ton="info" titre="Aucun mot de passe ici">
            L’identité est détenue par Keycloak. Le titulaire reçoit un lien de première connexion et
            choisit lui-même son mot de passe : le portail n’en voit jamais la valeur.
          </Callout>
        </div>
      </Drawer>
    </div>
  )
}
