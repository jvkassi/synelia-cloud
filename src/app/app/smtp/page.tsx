'use client'

import { useState } from 'react'
import { Key, Plus, ShieldCheck, Webhook } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateCourte, num, pct, relatif } from '@/lib/format'
import { SMTP } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { CodeBlock, CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { Modal } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { GaugeCircle, QuotaBar, StackedBar, StatTile } from '@/components/composition/metrics'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'cles', label: 'Clés d’envoi' },
  { id: 'authentification', label: 'Authentification' },
  { id: 'journal', label: 'Journal de livraison' },
  { id: 'webhooks', label: 'Webhooks' },
]

const TON_STATUT: Record<string, 'ok' | 'warn' | 'err'> = {
  delivre: 'ok',
  differe: 'warn',
  rejete: 'err',
  plainte: 'err',
}

const LIBELLE_STATUT: Record<string, string> = {
  delivre: 'Délivré',
  differe: 'Différé',
  rejete: 'Rejeté',
  plainte: 'Plainte',
}

export default function Smtp() {
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('apercu')
  const [nouvelleCle, setNouvelleCle] = useState(false)

  const tauxLivraison = SMTP.livraison.find((l) => l.statut === 'delivre')?.pct ?? 0

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Relais SMTP' }]}
        titre="Relais SMTP"
        sousTitre="Un relais pour les courriels transactionnels de vos applications : factures, confirmations de commande, réinitialisations de mot de passe. Adresse IP dédiée, SPF, DKIM et DMARC configurés, réputation surveillée."
        actions={
          <GatedAction autorise={autorise('secrets.update')} message={refus('secrets.update')}>
            <Button iconBefore={<Plus size={14} />} onClick={() => setNouvelleCle(true)}>
              Nouvelle clé d’envoi
            </Button>
          </GatedAction>
        }
        meta={
          <>
            <Badge tone="ok" dot size="sm">
              Relais opérationnel
            </Badge>
            <Badge tone="neutral" size="sm">
              IP dédiée {SMTP.reputation.ip}
            </Badge>
            <Badge tone="neutral" size="sm">
              {SMTP.reputation.listesNoires === 0
                ? 'Aucune liste noire'
                : `${SMTP.reputation.listesNoires} liste noire`}
            </Badge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          libelle="Envoyés aujourd’hui"
          valeur={num(SMTP.quotas.envoyesJour)}
          detail={`sur ${num(SMTP.quotas.parJour)} autorisés`}
          ton={SMTP.quotas.envoyesJour / SMTP.quotas.parJour > 0.8 ? 'warn' : 'violet'}
        />
        <StatTile
          libelle="Taux de livraison"
          valeur={pct(tauxLivraison, 1)}
          ton={tauxLivraison > 95 ? 'ok' : 'warn'}
          detail="Sur les dernières 24 heures"
        />
        <StatTile
          libelle="Score de réputation"
          valeur={SMTP.reputation.score}
          unite="/100"
          ton={SMTP.reputation.score > 90 ? 'ok' : 'warn'}
          detail="Mesuré auprès des grands fournisseurs"
        />
        <StatTile
          libelle="Clés d’envoi actives"
          valeur={SMTP.cles.length}
          detail="Révocables indépendamment"
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'apercu' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader titre="Quotas" sousTitre="Trois limites, pour trois types d’abus différents." />
              <div className="space-y-3.5">
                <QuotaBar
                  libelle="Par jour"
                  utilise={SMTP.quotas.envoyesJour}
                  total={SMTP.quotas.parJour}
                  seuil={80}
                  formateur={(v) => num(v)}
                />
                <QuotaBar
                  libelle="Par heure"
                  utilise={1142}
                  total={SMTP.quotas.parHeure}
                  seuil={80}
                  formateur={(v) => num(v)}
                />
                <QuotaBar
                  libelle="Par minute"
                  utilise={38}
                  total={SMTP.quotas.parMinute}
                  seuil={80}
                  formateur={(v) => num(v)}
                />
              </div>
              <Callout ton="info" className="mt-4" titre="Pourquoi une limite par minute">
                Une boucle de code qui part en vrille peut envoyer dix mille courriels en quelques
                secondes et brûler la réputation de votre adresse IP pour des semaines. La limite par
                minute est le garde-fou qui vous laisse le temps de vous en apercevoir.
              </Callout>
            </Card>

            <Card>
              <CardHeader
                titre="Répartition des livraisons"
                sousTitre="Dernières 24 heures."
              />
              <StackedBar
                segments={SMTP.livraison.map((l) => ({
                  label: LIBELLE_STATUT[l.statut],
                  valeur: l.nombre,
                  couleur:
                    l.statut === 'delivre'
                      ? 'var(--color-ok)'
                      : l.statut === 'differe'
                        ? 'var(--color-warn)'
                        : l.statut === 'rejete'
                          ? 'var(--color-err)'
                          : 'var(--color-m-600)',
                }))}
              />
              <div className="mt-4 space-y-1.5 border-t border-g-100 pt-3.5">
                {SMTP.livraison.map((l) => (
                  <div key={l.statut} className="flex items-baseline justify-between gap-3">
                    <span className="text-[12px] text-g-700">{LIBELLE_STATUT[l.statut]}</span>
                    <span className="tnum shrink-0 text-[12px]">
                      <span className="font-semibold text-ink">{num(l.nombre)}</span>
                      <span className="ml-1.5 text-g-500">{pct(l.pct, 1)}</span>
                    </span>
                  </div>
                ))}
              </div>
              <Callout ton="warn" className="mt-4" titre="1,7 % de rejets, dont la cause est connue">
                88 rejets viennent d’adresses qui n’existent plus, toutes issues d’une liste
                d’abonnés importée en 2023. Nettoyer cette liste ferait passer le taux de livraison
                de 94,7 % à plus de 98 %, et améliorerait votre réputation auprès des fournisseurs.
              </Callout>
            </Card>

            <Card>
              <CardHeader titre="Réputation" sousTitre="Ce que les fournisseurs pensent de votre adresse IP." />
              <div className="flex justify-center py-2">
                <GaugeCircle
                  valeur={SMTP.reputation.score}
                  min={0}
                  max={100}
                  cible={85}
                  libelle="Score global"
                />
              </div>
              <KeyValueList
                className="mt-2"
                colonnes={1}
                items={[
                  {
                    cle: 'Adresse IP d’envoi',
                    valeur: `${SMTP.reputation.ip}${SMTP.reputation.dediee ? ' — dédiée à votre organisation' : ' — partagée'}`,
                  },
                  {
                    cle: 'Listes noires',
                    valeur:
                      SMTP.reputation.listesNoires === 0
                        ? 'Absente des 42 listes surveillées'
                        : `Présente dans ${SMTP.reputation.listesNoires} liste(s)`,
                  },
                  { cle: 'Enregistrement PTR', valeur: 'mail-dba.synelia.cloud — cohérent' },
                  { cle: 'Boucle de retour Microsoft', valeur: 'Inscrite — plaintes remontées en temps réel' },
                  { cle: 'Google Postmaster', valeur: 'Domaine vérifié · réputation « élevée »' },
                ]}
              />
            </Card>
          </div>

          <Card>
            <CardHeader
              titre="Connexion au relais"
              sousTitre="Chiffrement obligatoire. Le port 25 est fermé : il ne sert qu’aux échanges entre serveurs de courrier et attire les abus."
            />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <CopyField label="Hôte" value="smtp.synelia.cloud" />
                <CopyField label="Port (STARTTLS)" value="587" />
                <CopyField label="Port (TLS implicite)" value="465" />
                <CopyField label="Nom d’utilisateur" value="org-dba" />
                <CopyField label="Mot de passe" masque value="Utilisez une clé d’envoi, jamais ce mot de passe" />
              </div>
              <div>
                <MicroLabel className="mb-2">Exemple d’envoi</MicroLabel>
                <CodeBlock
                  langue="python"
                  code={`import smtplib, os
from email.message import EmailMessage

msg = EmailMessage()
msg["From"] = "facturation@dba.africa"
msg["To"] = "client@exemple.ci"
msg["Subject"] = "Votre facture INV-2091"
msg.set_content("Bonjour, votre facture est disponible.")

with smtplib.SMTP("smtp.synelia.cloud", 587) as s:
    s.starttls()
    s.login("org-dba", os.environ["SYNELIA_SMTP_KEY"])
    s.send_message(msg)`}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {onglet === 'cles' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Clés d’envoi"
              sousTitre="Une clé par application. Révoquer une clé coupe les envois de cette application seule, sans toucher aux autres."
              actions={
                <GatedAction autorise={autorise('secrets.update')} message={refus('secrets.update')}>
                  <Button size="sm" variant="secondary" iconBefore={<Plus size={13} />} onClick={() => setNouvelleCle(true)}>
                    Créer une clé
                  </Button>
                </GatedAction>
              }
            />
            <div className="space-y-2">
              {SMTP.cles.map((c) => (
                <div key={c.id} className="rounded-[6px] border border-g-300 px-3 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="flex min-w-0 items-start gap-2.5">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-p-050 text-p-700">
                        <Key size={13} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-semibold text-ink">{c.nom}</span>
                        <span className="block text-[11px] text-g-500">
                          Créée le {dateCourte(c.creee)} · dernier envoi {relatif(c.derniereUtilisation)}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <Button size="sm" variant="ghost">
                        Réinitialiser
                      </Button>
                      <Button size="sm" variant="ghost">
                        Révoquer
                      </Button>
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <QuotaBar
                      libelle="Quota journalier de cette clé"
                      utilise={c.envoyesJour}
                      total={c.quotaJour}
                      compact
                      seuil={80}
                      formateur={(v) => num(v)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Callout ton="violet" className="mt-4" titre="Un quota par clé, pas seulement global">
              Si la clé de votre boutique se met à envoyer en boucle, elle atteint son propre quota et
              s’arrête. Vos factures et vos réinitialisations de mot de passe continuent de partir.
              C’est la raison d’être des clés séparées.
            </Callout>
          </Card>
        </div>
      )}

      {onglet === 'authentification' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Authentification du domaine"
              sousTitre="Ces trois mécanismes prouvent que vos courriels viennent bien de vous. Sans eux, ils finissent en indésirables — ou sont utilisés pour usurper votre identité."
            />
            <div className="space-y-2">
              {[
                {
                  nom: 'SPF',
                  etat: SMTP.authentification.spf,
                  quoi: 'Déclare quels serveurs sont autorisés à envoyer pour votre domaine.',
                  valeur: 'v=spf1 include:spf.synelia.cloud -all',
                },
                {
                  nom: 'DKIM',
                  etat: SMTP.authentification.dkim,
                  quoi: 'Signe chaque courriel avec une clé privée ; le destinataire vérifie la signature via votre DNS.',
                  valeur: 'synelia._domainkey · RSA 2048 bits',
                },
                {
                  nom: 'DMARC',
                  etat: SMTP.authentification.dmarc,
                  quoi: 'Indique au destinataire quoi faire d’un courriel qui échoue SPF et DKIM, et vous envoie des rapports.',
                  valeur: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@dba.africa',
                },
              ].map((a) => (
                <div key={a.nom} className="rounded-[6px] border border-g-300 px-3 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[12.5px] font-bold text-ink">{a.nom}</span>
                      <Badge tone={a.etat === 'valide' ? 'ok' : 'violet'} size="sm">
                        {a.etat === 'valide' ? 'Valide' : a.etat}
                      </Badge>
                    </span>
                    <ButtonLink size="sm" variant="ghost" href="/app/domaines">
                      Voir dans la zone DNS
                    </ButtonLink>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-g-500">{a.quoi}</p>
                  <p className="mt-1.5 break-all rounded-[4px] bg-g-050 px-2 py-1 font-mono text-[10.5px] text-ink">
                    {a.valeur}
                  </p>
                </div>
              ))}
            </div>
            <Callout ton="warn" className="mt-4" titre="DMARC est en quarantaine, pas en rejet">
              Avec <span className="font-mono text-[12px]">p=quarantine</span>, un courriel usurpant
              votre domaine part en indésirables plutôt que d’être refusé. C’est la bonne étape
              intermédiaire : passez à <span className="font-mono text-[12px]">p=reject</span> quand
              vos rapports montrent que tous vos envois légitimes passent — sinon vous bloqueriez
              aussi vos propres courriels partis d’un outil oublié.
            </Callout>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader
                titre="Rapports DMARC"
                sousTitre="Reçus quotidiennement des grands fournisseurs, agrégés ici."
              />
              <div className="space-y-1.5">
                {[
                  { src: 'google.com', envois: 3842, conformes: 3842, pct: 100 },
                  { src: 'outlook.com', envois: 1204, conformes: 1198, pct: 99.5 },
                  { src: 'yahoo.com', envois: 412, conformes: 412, pct: 100 },
                  { src: 'orange.ci', envois: 288, conformes: 288, pct: 100 },
                  { src: '41.207.x.x (inconnu)', envois: 24, conformes: 0, pct: 0 },
                ].map((r) => (
                  <div key={r.src} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate font-mono text-[11.5px] text-ink">
                      {r.src}
                    </span>
                    <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-g-100">
                      <span
                        className={cn(
                          'absolute inset-y-0 left-0 rounded-full',
                          r.pct === 100 ? 'bg-ok' : r.pct > 50 ? 'bg-warn' : 'bg-err',
                        )}
                        style={{ width: `${Math.max(3, r.pct)}%` }}
                      />
                    </span>
                    <span className="tnum w-12 shrink-0 text-right text-[11.5px] text-g-700">
                      {num(r.envois)}
                    </span>
                    <span
                      className={cn(
                        'tnum w-14 shrink-0 text-right text-[11.5px] font-semibold',
                        r.pct === 100 ? 'text-ok' : r.pct > 50 ? 'text-warn' : 'text-err',
                      )}
                    >
                      {pct(r.pct, 1)}
                    </span>
                  </div>
                ))}
              </div>
              <Callout ton="err" className="mt-4" titre="24 tentatives d’usurpation détectées">
                Une adresse au Nigéria a envoyé 24 courriels prétendant venir de{' '}
                <span className="font-mono text-[12px]">dba.africa</span> sans passer par notre
                relais. Ils ont tous échoué SPF et DKIM, et ont donc été mis en quarantaine chez les
                destinataires. C’est exactement ce que DMARC est censé faire.
              </Callout>
            </Card>

            <Card>
              <CardHeader titre="Réglages d’envoi" />
              <div className="space-y-3.5">
                <Switch
                  checked
                  label="Signer tous les courriels avec DKIM"
                  description="Non désactivable : un courriel non signé est massivement filtré."
                />
                <Switch
                  checked
                  label="Refuser les adresses d’expéditeur hors de vos domaines"
                  description="Empêche une application compromise d’envoyer au nom d’un autre domaine que les vôtres."
                />
                <Switch
                  checked
                  label="Supprimer automatiquement les adresses en erreur permanente"
                  description="Une adresse qui rejette trois fois de suite en 5.1.1 est retirée de vos envois. Continuer à écrire à des adresses mortes dégrade votre réputation."
                />
                <Switch
                  checked={false}
                  label="Ajouter un en-tête de désabonnement en un clic"
                  description="Obligatoire pour les envois de masse chez Gmail et Yahoo. Inutile pour les courriels transactionnels."
                />
              </div>
              <GatedAction autorise={autorise('secrets.update')} message={refus('secrets.update')}>
                <Button className="mt-4" variant="secondary">
                  Enregistrer
                </Button>
              </GatedAction>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'journal' && (
        <Card padding={false}>
          <div className="border-b border-g-100 px-4 py-3.5">
            <CardHeader
              titre="Journal de livraison"
              sousTitre="Six dernières minutes. Le journal complet, avec recherche par destinataire et par code de réponse, est dans le moteur de recherche."
              className="mb-0"
              actions={
                <ButtonLink
                  size="sm"
                  variant="ghost"
                  external
                  href="https://logs.synelia.cloud/select/vmui"
                >
                  Journal complet
                </ButtonLink>
              }
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr className="border-b border-g-300 bg-g-050">
                  {['Horodatage', 'Destinataire', 'Sujet', 'Statut', 'Réponse du serveur'].map((h) => (
                    <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SMTP.journal.map((j) => (
                  <tr key={j.ts} className="border-b border-g-100 last:border-0">
                    <td className="px-3 py-2 font-mono text-[11px] text-g-500">
                      {j.ts.slice(11, 19)}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11.5px] text-ink">{j.destinataire}</td>
                    <td className="max-w-[28ch] truncate px-3 py-2 text-[12px] text-g-700">
                      {j.sujet}
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={TON_STATUT[j.statut]} dot size="sm">
                        {LIBELLE_STATUT[j.statut]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-g-500">{j.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-g-100 px-4 py-3">
            <p className="text-[11.5px] leading-relaxed text-g-500">
              Un <span className="font-mono">451 4.7.1</span> est un différé, pas un échec : le
              serveur destinataire vous demande de réessayer plus tard, et nous le faisons
              automatiquement pendant 48 heures. Un <span className="font-mono">550 5.1.1</span> est
              définitif — l’adresse n’existe pas.
            </p>
          </div>
        </Card>
      )}

      {onglet === 'webhooks' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Webhooks"
              sousTitre="Nous appelons votre application dès qu’un courriel change d’état. Vous gardez ainsi la trace des rejets sans interroger notre journal."
              actions={
                <Button size="sm" variant="secondary" iconBefore={<Plus size={13} />}>
                  Ajouter
                </Button>
              }
            />
            <div className="space-y-2">
              {SMTP.webhooks.map((w) => (
                <div key={w.id} className="rounded-[6px] border border-g-300 px-3 py-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="flex min-w-0 items-start gap-2">
                      <Webhook size={13} className="mt-0.5 shrink-0 text-p-700" />
                      <span className="min-w-0 break-all font-mono text-[11.5px] text-ink">
                        {w.url}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <Badge tone={w.actif ? 'ok' : 'neutral'} dot size="sm">
                        {w.actif ? 'Actif' : 'Désactivé'}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        Tester
                      </Button>
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {w.evenements.map((e) => (
                      <Badge key={e} tone="neutral" size="sm">
                        {LIBELLE_STATUT[e] ?? e}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Callout ton="info" className="mt-4" titre="Charge signée">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={13} />
                Chaque appel porte un en-tête{' '}
                <span className="font-mono text-[12px]">X-Synelia-Signature</span> calculé en HMAC
                SHA-256 sur le corps de la requête. Vérifiez-le : sans cela, n’importe qui connaissant
                votre URL peut vous envoyer de faux événements.
              </span>
            </Callout>
          </Card>

          <Card>
            <CardHeader titre="Format de la charge" sousTitre="JSON, un événement par appel." />
            <CodeBlock
              langue="json"
              code={`{
  "evenement": "rejete",
  "horodatage": "2026-08-19T15:16:44Z",
  "message_id": "<8f2a91c4@dba.africa>",
  "cle": "sk-2",
  "destinataire": "ancienne-adresse@yahoo.fr",
  "sujet": "Newsletter août",
  "code": "550",
  "code_etendu": "5.1.1",
  "detail": "User unknown",
  "definitif": true
}`}
            />
            <div className="mt-4 space-y-3 border-t border-g-100 pt-4">
              <Field label="Secret de signature" hint="à comparer côté application">
                <Input type="password" defaultValue="whsec_8f2a91c4d7b0e5443a17c96e2f0d8b41" readOnly />
              </Field>
              <Field label="Tentatives en cas d’échec" hint="délais croissants — 1 min, 5 min, 30 min, 2 h, 6 h">
                <Select defaultValue="5">
                  <option value="0">Aucune</option>
                  <option value="3">3 tentatives</option>
                  <option value="5">5 tentatives (recommandé)</option>
                </Select>
              </Field>
            </div>
          </Card>
        </div>
      )}

      <Modal
        open={nouvelleCle}
        onClose={() => setNouvelleCle(false)}
        title="Nouvelle clé d’envoi"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNouvelleCle(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                pousser({
                  ton: 'ok',
                  titre: 'Clé d’envoi créée',
                  detail: 'Copiez-la maintenant : elle ne sera plus affichée en clair après la fermeture de cette fenêtre.',
                })
                setNouvelleCle(false)
              }}
            >
              Créer la clé
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nom" hint="décrivez l’application qui utilisera cette clé">
            <Input placeholder="app-metier · notifications" />
          </Field>
          <Field
            label="Quota journalier"
            hint="au-delà, les envois de cette clé sont refusés — les autres clés continuent"
          >
            <Input type="number" defaultValue={5000} />
          </Field>
          <Field label="Adresse d’expéditeur autorisée" hint="doit appartenir à un de vos domaines">
            <Select defaultValue="facturation@dba.africa">
              <option value="facturation@dba.africa">facturation@dba.africa</option>
              <option value="noreply@dba.africa">noreply@dba.africa</option>
              <option value="contact@dba.africa">contact@dba.africa</option>
              <option value="*@dba.africa">Toute adresse de dba.africa</option>
            </Select>
          </Field>
          <Callout ton="warn" titre="La clé n’est affichée qu’une seule fois">
            Nous ne la stockons pas en clair : personne chez nous ne peut la retrouver, pas même le
            support. Si vous la perdez, réinitialisez-la — l’ancienne cesse alors immédiatement de
            fonctionner.
          </Callout>
        </div>
      </Modal>
    </div>
  )
}
