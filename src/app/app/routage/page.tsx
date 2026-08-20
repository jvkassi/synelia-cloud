'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Globe, Plus, RefreshCw, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateCourte, relatif } from '@/lib/format'
import type { DomaineApplicatif } from '@/lib/types'
import { SITE_LABEL } from '@/lib/types'
import {
  DOMAINES_APPLICATIFS,
  SERVICES_PROJET,
  ZONE_APPLICATIVE,
  projetById,
  serviceProjetById,
} from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CopyField, GatedAction } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { DataTable, type Colonne } from '@/components/composition/data-table'
import { Drawer } from '@/components/ui/overlay'
import { useApp } from '@/components/app/contexte'

const ETAT_VERIF = {
  ok: { ton: 'ok' as const, label: 'Vérifié' },
  attente: { ton: 'warn' as const, label: 'En attente' },
  echec: { ton: 'err' as const, label: 'En échec' },
}

const ETAT_CERT = {
  actif: { ton: 'ok' as const, label: 'Actif' },
  en_emission: { ton: 'info' as const, label: 'Émission' },
  echec: { ton: 'err' as const, label: 'Échec' },
  aucun: { ton: 'neutral' as const, label: 'Aucun' },
}

export default function Routage() {
  const { autorise, refus } = useApp()
  const [ajout, setAjout] = useState(false)

  const aVerifier = DOMAINES_APPLICATIFS.filter((d) => d.verification && d.verification.etat !== 'ok')
  const generes = DOMAINES_APPLICATIFS.filter((d) => d.origine === 'genere')

  const colonnes: Array<Colonne<DomaineApplicatif>> = [
    {
      id: 'hote',
      entete: 'Hôte',
      cle: (d) => d.hote,
      rendu: (d) => (
        <span className="block">
          <span className="block font-mono text-[12.5px] font-semibold text-ink">
            {d.hote}
            {d.chemin !== '/' && <span className="text-g-500">{d.chemin}</span>}
          </span>
          <span className="block text-[11px] text-g-500">
            {d.https ? 'HTTPS forcé' : 'HTTP seulement'} · port {d.portConteneur}
          </span>
        </span>
      ),
    },
    {
      id: 'origine',
      entete: 'Origine',
      cle: (d) => d.origine,
      rendu: (d) => (
        <Badge tone={d.origine === 'genere' ? 'violet' : 'neutral'} size="sm">
          {d.origine === 'genere' ? 'Zone offerte' : 'Votre domaine'}
        </Badge>
      ),
    },
    {
      id: 'service',
      entete: 'Service visé',
      cle: (d) => serviceProjetById(d.serviceId)?.nom ?? '',
      rendu: (d) => {
        const svc = serviceProjetById(d.serviceId)
        if (!svc) return <span className="text-g-500">service supprimé</span>
        const projet = projetById(svc.projetId)
        return (
          <Link
            href={`/app/projets/${svc.projetId}/${svc.id}`}
            className="block hover:text-p-700"
          >
            <span className="block font-mono text-[12px] font-semibold text-ink">{svc.nom}</span>
            <span className="block text-[11px] text-g-500">
              {projet?.nom} · {svc.environnement}
            </span>
          </Link>
        )
      },
    },
    {
      id: 'certificat',
      entete: 'Certificat',
      cle: (d) => d.certificat.etat,
      rendu: (d) => (
        <span className="block">
          <Badge tone={ETAT_CERT[d.certificat.etat].ton} size="sm">
            {ETAT_CERT[d.certificat.etat].label}
          </Badge>
          {d.certificat.expire && (
            <span className="mt-0.5 block text-[11px] text-g-500">
              renouvellement le {dateCourte(d.certificat.expire)}
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'verification',
      entete: 'Vérification DNS',
      cle: (d) => d.verification?.etat ?? 'ok',
      rendu: (d) =>
        d.verification ? (
          <span className="block">
            <Badge tone={ETAT_VERIF[d.verification.etat].ton} dot size="sm">
              {ETAT_VERIF[d.verification.etat].label}
            </Badge>
            {d.verification.verifieLe && (
              <span className="mt-0.5 block text-[11px] text-g-500">
                {relatif(d.verification.verifieLe)}
              </span>
            )}
          </span>
        ) : (
          <span className="text-[11.5px] text-g-500">sans objet</span>
        ),
    },
    {
      id: 'actions',
      entete: '',
      aligne: 'right',
      rendu: (d) => {
        const svc = serviceProjetById(d.serviceId)
        return svc ? (
          <Link
            href={`/app/projets/${svc.projetId}/${svc.id}`}
            className="text-[12px] font-semibold text-p-700 hover:text-m-600"
          >
            Gérer →
          </Link>
        ) : null
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Domaines & routage' }]}
        titre="Domaines & routage"
        sousTitre="Chaque service déployé reçoit une adresse dans votre zone offerte. Pour utiliser votre propre domaine, vous créez un enregistrement DNS vers nos adresses d’entrée, puis vous l’associez à un service et à un port."
        actions={
          <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
            <Button iconBefore={<Plus size={14} />} onClick={() => setAjout(true)}>
              Brancher un domaine
            </Button>
          </GatedAction>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile libelle="Domaines routés" valeur={DOMAINES_APPLICATIFS.length} />
        <StatTile
          libelle="Adresses offertes"
          valeur={generes.length}
          detail={ZONE_APPLICATIVE.zone}
        />
        <StatTile
          libelle="À vérifier"
          valeur={aVerifier.length}
          ton={aVerifier.length > 0 ? 'warn' : 'ok'}
          detail={aVerifier.length > 0 ? 'enregistrement DNS attendu' : 'tout est vérifié'}
        />
        <StatTile
          libelle="Quota de la zone"
          valeur={`${ZONE_APPLICATIVE.quotaDomaines.utilises}/${ZONE_APPLICATIVE.quotaDomaines.total}`}
          detail="sous-domaines"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            titre="Votre zone offerte"
            sousTitre="Attribuée à l’organisation dès la souscription, sans supplément."
            actions={
              <Badge tone="violet" size="sm">
                Incluse
              </Badge>
            }
          />
          <div className="space-y-3">
            <div>
              <MicroLabel>Zone</MicroLabel>
              <CopyField value={ZONE_APPLICATIVE.zone} className="mt-1.5" />
            </div>
            <div>
              <MicroLabel>Certificat générique</MicroLabel>
              <CopyField value={ZONE_APPLICATIVE.wildcard} className="mt-1.5" />
            </div>
            <KeyValueList
              colonnes={1}
              items={[
                { cle: 'Émetteur', valeur: ZONE_APPLICATIVE.certificat.emetteur },
                {
                  cle: 'Renouvellement',
                  valeur: ZONE_APPLICATIVE.certificat.renouvellementAuto
                    ? `automatique · prochain le ${dateCourte(ZONE_APPLICATIVE.certificat.expire)}`
                    : 'manuel',
                },
                {
                  cle: 'Nommage',
                  valeur: (
                    <span className="font-mono text-[12px]">
                      &lt;service&gt;-&lt;env&gt;.{ZONE_APPLICATIVE.zone}
                    </span>
                  ),
                },
              ]}
            />
          </div>
          <Callout ton="violet" className="mt-3.5" titre="Pourquoi c’est offert">
            Votre première mise en ligne ne doit pas dépendre d’un achat de domaine ni d’un délai de
            propagation. Vous déployez, l’adresse répond en HTTPS, et vous branchez votre domaine
            quand il est prêt — sans redéployer.
          </Callout>
        </Card>

        <Card>
          <CardHeader
            titre="Adresses d’entrée"
            sousTitre="Les valeurs à viser depuis votre DNS externe, par site physique."
          />
          <div className="space-y-3">
            {ZONE_APPLICATIVE.ingress.map((i) => (
              <div key={i.site} className="rounded-[8px] border border-g-300 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-bold text-ink">{SITE_LABEL[i.site]}</span>
                  <Badge tone="neutral" size="sm">
                    {i.site}
                  </Badge>
                </div>
                <div className="mt-2 space-y-2">
                  <div>
                    <MicroLabel>Enregistrement A (IPv4)</MicroLabel>
                    <CopyField value={i.ip} className="mt-1" />
                  </div>
                  <div>
                    <MicroLabel>Enregistrement AAAA (IPv6)</MicroLabel>
                    <CopyField value={i.ipv6} className="mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-g-500">
            Un sous-domaine peut aussi pointer par CNAME vers{' '}
            <span className="font-mono">{ZONE_APPLICATIVE.zone}</span>. Sur un apex — le domaine nu,
            sans <span className="font-mono">www</span> — la norme DNS l’interdit : il faut un
            enregistrement A.
          </p>
        </Card>
      </div>

      {aVerifier.length > 0 && (
        <Card className="border-warn/40">
          <CardHeader
            titre={`${aVerifier.length} domaine${aVerifier.length > 1 ? 's' : ''} en attente de vérification`}
            sousTitre="Tant que l’enregistrement DNS n’est pas visible depuis nos résolveurs, aucun certificat ne peut être émis."
          />
          <div className="space-y-3">
            {aVerifier.map((d) => (
              <div
                key={d.id}
                className={cn(
                  'rounded-[8px] border p-3',
                  d.verification!.etat === 'echec'
                    ? 'border-err/40 bg-err-bg'
                    : 'border-warn/40 bg-warn-bg',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block font-mono text-[13px] font-bold text-ink">{d.hote}</span>
                    <span className="block text-[11.5px] leading-relaxed text-g-700">
                      {d.verification!.detail}
                    </span>
                  </span>
                  <Badge tone={ETAT_VERIF[d.verification!.etat].ton} size="sm">
                    {ETAT_VERIF[d.verification!.etat].label}
                  </Badge>
                </div>

                <div className="mt-2.5 rounded-[6px] border border-g-300 bg-white p-2.5">
                  <MicroLabel>Enregistrement attendu</MicroLabel>
                  <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-[11.5px]">
                    <span className="text-g-500">Type</span>
                    <span className="font-semibold text-ink">
                      {d.verification!.enregistrement.type}
                    </span>
                    <span className="text-g-500">Nom</span>
                    <span className="break-all font-semibold text-ink">
                      {d.verification!.enregistrement.nom}
                    </span>
                    <span className="text-g-500">Valeur</span>
                    <span className="font-semibold text-ink">
                      {d.verification!.enregistrement.valeur}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
                    <Button size="sm" variant="secondary" iconBefore={<RefreshCw size={12} />}>
                      Vérifier maintenant
                    </Button>
                  </GatedAction>
                  {d.verification!.verifieLe && (
                    <span className="text-[11px] text-g-500">
                      dernière tentative {relatif(d.verification!.verifieLe)}
                    </span>
                  )}
                  {d.verification!.correlationId && (
                    <span className="font-mono text-[10.5px] text-g-500">
                      identifiant de corrélation {d.verification!.correlationId}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <DataTable
        lignes={DOMAINES_APPLICATIFS}
        colonnes={colonnes}
        placeholderRecherche="Rechercher un hôte, un service…"
        filtres={[
          {
            id: 'origine',
            libelle: 'Origine',
            options: [
              { value: 'genere', label: 'Zone offerte' },
              { value: 'personnalise', label: 'Votre domaine' },
            ],
          },
          {
            id: 'certificat',
            libelle: 'Certificat',
            options: [
              { value: 'actif', label: 'Actif' },
              { value: 'en_emission', label: 'En émission' },
              { value: 'echec', label: 'En échec' },
              { value: 'aucun', label: 'Aucun' },
            ],
          },
        ]}
        selection={(d, id, v) =>
          id === 'origine' ? d.origine === v : d.certificat.etat === v
        }
        exportable
        vide={{
          titre: 'Aucun domaine routé',
          phrase:
            'Déployez un service : il recevra automatiquement son adresse dans votre zone offerte.',
          action: { libelle: 'Voir les projets', href: '/app/projets' },
        }}
      />

      <Card>
        <CardHeader
          titre="Ce que le routage garantit"
          sousTitre="Et ce qu'il ne remplace pas."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <KeyValueList
            colonnes={1}
            items={[
              {
                cle: 'Terminaison TLS',
                valeur:
                  'Assurée à l’entrée, avec TLS 1.2 minimum et redirection HTTP vers HTTPS quand vous l’activez.',
              },
              {
                cle: 'Certificats',
                valeur:
                  'Émis et renouvelés automatiquement. Une alerte part 21 jours avant l’échéance si le renouvellement échoue.',
              },
              {
                cle: 'Répartition',
                valeur:
                  'Le trafic est réparti entre les instances saines du service, avec retrait automatique d’une instance qui échoue à sa sonde.',
              },
            ]}
          />
          <KeyValueList
            colonnes={1}
            items={[
              {
                cle: 'Zones DNS',
                valeur: (
                  <>
                    Le routage applicatif ne gère pas vos zones. Pour héberger un domaine et ses
                    enregistrements chez nous, voyez{' '}
                    <Link
                      href="/app/web"
                      className="font-semibold text-p-700 hover:text-m-600"
                    >
                      Domaines &amp; DNS
                    </Link>
                    .
                  </>
                ),
              },
              {
                cle: 'Pare-feu applicatif',
                valeur:
                  'Le WAF OWASP se règle sur le load balancer de l’Espace Cloud, pas ici : ce sont deux couches distinctes.',
              },
              {
                cle: 'Enregistrement de domaine',
                valeur:
                  'Nous sommes bureau d’enregistrement, mais l’achat est une démarche séparée du routage.',
              },
            ]}
          />
        </div>
      </Card>

      <TiroirBranchement open={ajout} onClose={() => setAjout(false)} />
    </div>
  )
}

function TiroirBranchement({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [hote, setHote] = useState('')
  const [serviceId, setServiceId] = useState(SERVICES_PROJET[0].id)
  const [etape, setEtape] = useState<'saisie' | 'dns'>('saisie')

  const service = serviceProjetById(serviceId)!
  const exposables = SERVICES_PROJET.filter(
    (s) => s.type === 'application' || s.type === 'statique',
  )
  const apex = hote.split('.').filter(Boolean).length <= 2

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Brancher votre domaine"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          {etape === 'saisie' ? (
            <Button onClick={() => setEtape('dns')} disabled={!hote.trim()}>
              Continuer
            </Button>
          ) : (
            <Button
              iconBefore={<RefreshCw size={13} />}
              onClick={() => {
                setEtape('saisie')
                onClose()
              }}
            >
              Vérifier et activer
            </Button>
          )}
        </div>
      }
    >
      {etape === 'saisie' ? (
        <div className="space-y-4">
          <Field
            label="Domaine ou sous-domaine"
            hint="Sans http:// ni barre oblique finale. Le domaine peut être enregistré n’importe où."
          >
            <Input
              value={hote}
              onChange={(e) => setHote(e.target.value)}
              placeholder="api.mon-entreprise.ci"
              className="font-mono"
            />
          </Field>

          <Field
            label="Service visé"
            hint="Seuls les services exposés sur le web apparaissent : une base ou un worker n’ont pas d’adresse publique."
          >
            <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {exposables.map((s) => {
                const p = projetById(s.projetId)
                return (
                  <option key={s.id} value={s.id}>
                    {p?.nom} · {s.nom} · {s.environnement}
                  </option>
                )
              })}
            </Select>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Chemin" hint="Laissez / pour tout le trafic.">
              <Input defaultValue="/" className="font-mono" />
            </Field>
            <Field label="Port du conteneur">
              <Input type="number" defaultValue={service.portConteneur ?? 80} />
            </Field>
          </div>

          <Field label="Certificat">
            <Select defaultValue="acme">
              <option value="acme">Émission automatique (Let’s Encrypt)</option>
              <option value="fourni">Certificat que je fournis</option>
            </Select>
          </Field>

          <Switch checked onChange={() => {}} label="Rediriger HTTP vers HTTPS" />

          <Callout ton="info" titre="Rien n’est coupé pendant la bascule">
            L’adresse offerte du service continue de répondre. Votre domaine s’ajoute, il ne
            remplace pas.
          </Callout>
        </div>
      ) : (
        <div className="space-y-4">
          <Callout ton="info" titre="Créez cet enregistrement, puis vérifiez">
            La vérification interroge nos résolveurs. Selon le TTL fixé chez votre bureau
            d’enregistrement, la propagation prend de quelques minutes à quelques heures.
          </Callout>

          <div className="rounded-[8px] border border-g-300 p-3">
            <MicroLabel>Enregistrement DNS à créer</MicroLabel>
            <div className="mt-2 space-y-2">
              <div>
                <MicroLabel>Type</MicroLabel>
                <CopyField value={apex ? 'A' : 'A'} className="mt-1" />
              </div>
              <div>
                <MicroLabel>Nom</MicroLabel>
                <CopyField value={hote || 'api.mon-entreprise.ci'} className="mt-1" />
              </div>
              <div>
                <MicroLabel>
                  Valeur — entrée {ZONE_APPLICATIVE.ingress[0].site} (
                  {SITE_LABEL[ZONE_APPLICATIVE.ingress[0].site]})
                </MicroLabel>
                <CopyField value={ZONE_APPLICATIVE.ingress[0].ip} className="mt-1" />
              </div>
            </div>
          </div>

          {apex && (
            <Callout ton="warn" titre="Ce domaine ressemble à un apex">
              Sur un domaine nu, la norme DNS interdit le CNAME : utilisez bien l’enregistrement A
              ci-dessus. Pensez aussi à créer <span className="font-mono">www</span> et à le faire
              rediriger.
            </Callout>
          )}

          <div className="rounded-[8px] border border-g-300 bg-g-050 p-3">
            <span className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
              <ShieldCheck size={14} className="text-p-700" />
              Après vérification
            </span>
            <ul className="mt-1.5 space-y-1 text-[11.5px] leading-relaxed text-g-700">
              <li>Le certificat est émis dans la minute, sans intervention.</li>
              <li>
                Le domaine apparaît sur{' '}
                <span className="font-mono">
                  {service.nom} · {service.environnement}
                </span>
                , à côté de son adresse offerte.
              </li>
              <li>Le renouvellement est automatique, avec alerte en cas d’échec.</li>
            </ul>
          </div>
        </div>
      )}
    </Drawer>
  )
}
