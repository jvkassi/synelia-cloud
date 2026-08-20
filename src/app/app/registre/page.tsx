'use client'

import { useState } from 'react'
import { AlertTriangle, Package, Trash2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateHeure, num, relatif } from '@/lib/format'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CodeBlock, CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { ConfirmDialog } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { QuotaBar, StatTile } from '@/components/composition/metrics'
import { DataTable } from '@/components/composition/data-table'
import { EmptyState } from '@/components/composition/states'
import { useApp } from '@/components/app/contexte'

interface Depot {
  id: string
  nom: string
  application: string
  tags: number
  tailleMo: number
  dernierPush: string
  auteur: string
  visibilite: 'privee' | 'interne'
  vulnerabilites: { critique: number; haute: number; moyenne: number }
  signee: boolean
}

const DEPOTS: Depot[] = [
  {
    id: 'dep-1',
    nom: 'org-dba/facturation-api',
    application: 'facturation-api',
    tags: 47,
    tailleMo: 284,
    dernierPush: '2026-08-19T14:52:00Z',
    auteur: 'ci-bot',
    visibilite: 'privee',
    vulnerabilites: { critique: 0, haute: 1, moyenne: 6 },
    signee: true,
  },
  {
    id: 'dep-2',
    nom: 'org-dba/facturation-web',
    application: 'facturation-api',
    tags: 51,
    tailleMo: 118,
    dernierPush: '2026-08-19T14:50:00Z',
    auteur: 'ci-bot',
    visibilite: 'privee',
    vulnerabilites: { critique: 0, haute: 0, moyenne: 2 },
    signee: true,
  },
  {
    id: 'dep-3',
    nom: 'org-dba/portail-vitrine',
    application: 'portail-vitrine',
    tags: 22,
    tailleMo: 64,
    dernierPush: '2026-08-18T09:14:00Z',
    auteur: 'ci-bot',
    visibilite: 'privee',
    vulnerabilites: { critique: 0, haute: 0, moyenne: 1 },
    signee: true,
  },
  {
    id: 'dep-4',
    nom: 'org-dba/analytics-collector',
    application: 'analytics-collector',
    tags: 34,
    tailleMo: 412,
    dernierPush: '2026-08-19T11:03:00Z',
    auteur: 'k.toure',
    visibilite: 'privee',
    vulnerabilites: { critique: 0, haute: 2, moyenne: 9 },
    signee: false,
  },
  {
    id: 'dep-5',
    nom: 'org-dba/batch-worker',
    application: 'batch-worker',
    tags: 19,
    tailleMo: 508,
    dernierPush: '2026-08-19T13:41:00Z',
    auteur: 'ci-bot',
    visibilite: 'privee',
    vulnerabilites: { critique: 1, haute: 3, moyenne: 11 },
    signee: false,
  },
  {
    id: 'dep-6',
    nom: 'org-dba/base-python',
    application: '—',
    tags: 8,
    tailleMo: 196,
    dernierPush: '2026-07-28T16:22:00Z',
    auteur: 'l.konan',
    visibilite: 'interne',
    vulnerabilites: { critique: 0, haute: 1, moyenne: 4 },
    signee: true,
  },
]

interface Tag {
  id: string
  tag: string
  digest: string
  tailleMo: number
  pousse: string
  utilise: string[]
  immuable: boolean
}

const TAGS: Record<string, Tag[]> = {
  'dep-1': [
    { id: 't1', tag: 'v2.4.1', digest: 'sha256:8f2a91c4d7', tailleMo: 284, pousse: '2026-08-19T14:52:00Z', utilise: ['Production', 'Pré-production'], immuable: true },
    { id: 't2', tag: 'v2.4.0', digest: 'sha256:1b74e0aa93', tailleMo: 283, pousse: '2026-08-14T10:18:00Z', utilise: [], immuable: true },
    { id: 't3', tag: 'v2.3.8', digest: 'sha256:c04d2f6b18', tailleMo: 281, pousse: '2026-08-06T08:44:00Z', utilise: ['Bac à sable'], immuable: true },
    { id: 't4', tag: 'latest', digest: 'sha256:8f2a91c4d7', tailleMo: 284, pousse: '2026-08-19T14:52:00Z', utilise: [], immuable: false },
    { id: 't5', tag: 'main-a3f91c2', digest: 'sha256:8f2a91c4d7', tailleMo: 284, pousse: '2026-08-19T14:52:00Z', utilise: [], immuable: true },
  ],
  'dep-5': [
    { id: 't1', tag: 'v1.8.0', digest: 'sha256:44ba1e9f02', tailleMo: 508, pousse: '2026-08-19T13:41:00Z', utilise: [], immuable: true },
    { id: 't2', tag: 'v1.7.4', digest: 'sha256:9e3c8d1a75', tailleMo: 502, pousse: '2026-08-11T07:12:00Z', utilise: ['Production'], immuable: true },
    { id: 't3', tag: 'latest', digest: 'sha256:44ba1e9f02', tailleMo: 508, pousse: '2026-08-19T13:41:00Z', utilise: [], immuable: false },
  ],
}

const ONGLETS = [
  { id: 'depots', label: 'Dépôts' },
  { id: 'acces', label: 'Accès & identifiants' },
  { id: 'retention', label: 'Rétention' },
  { id: 'politique', label: 'Politique d’admission' },
]

const QUOTA_GO = 200

export default function Registre() {
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('depots')
  const [ouvert, setOuvert] = useState<string | null>('dep-1')
  const [aSupprimer, setASupprimer] = useState<Depot | null>(null)

  const utiliseGo = DEPOTS.reduce((a, d) => a + d.tailleMo * d.tags, 0) / 1024
  const critiques = DEPOTS.reduce((a, d) => a + d.vulnerabilites.critique, 0)
  const nonSignees = DEPOTS.filter((d) => !d.signee).length
  const depot = ouvert ? DEPOTS.find((d) => d.id === ouvert) : undefined

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Registre d’images' }]}
        titre="Registre d’images"
        sousTitre="Vos images de conteneurs, hébergées à Abidjan, à côté de vos environnements d’exécution. Un artefact ne sort jamais de la plateforme entre le build et le déploiement : c’est la même image, au même condensat, que celle analysée. Le registre est commun à l’organisation, tous Espaces Cloud confondus."
        actions={
          <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
            <Button variant="secondary" iconBefore={<Upload size={14} />}>
              Instructions de poussée
            </Button>
          </GatedAction>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile libelle="Dépôts" valeur={DEPOTS.length} detail={`${DEPOTS.reduce((a, d) => a + d.tags, 0)} étiquettes au total`} />
        <StatTile
          libelle="Espace occupé"
          valeur={`${utiliseGo.toFixed(1)} Go`}
          detail={`sur ${QUOTA_GO} Go inclus`}
          ton={utiliseGo / QUOTA_GO > 0.8 ? 'warn' : 'violet'}
        />
        <StatTile
          libelle="Vulnérabilités critiques"
          valeur={critiques}
          ton={critiques > 0 ? 'err' : 'ok'}
          detail={critiques > 0 ? 'batch-worker · v1.8.0' : 'Aucune'}
        />
        <StatTile
          libelle="Images non signées"
          valeur={nonSignees}
          ton={nonSignees > 0 ? 'warn' : 'ok'}
          detail="Signature Cosign absente"
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <QuotaBar
              libelle="Quota de stockage du registre"
              utilise={Math.round(utiliseGo * 10) / 10}
              total={QUOTA_GO}
              unite="Go"
              seuil={80}
            />
          </div>
          <Button size="sm" variant="ghost">
            Augmenter le quota
          </Button>
        </div>
      </Card>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'depots' && (
        <div className="space-y-4">
          <Card padding={false}>
            <div className="p-4">
              <DataTable<Depot>
                lignes={DEPOTS}
                parPage={10}
                exportable
                placeholderRecherche="Rechercher un dépôt…"
                filtres={[
                  {
                    id: 'sante',
                    libelle: 'Sécurité',
                    options: [
                      { value: 'tous', label: 'Tous les dépôts' },
                      { value: 'critique', label: 'Vulnérabilité critique' },
                      { value: 'nonsigne', label: 'Non signé' },
                    ],
                  },
                ]}
                selection={(l, fid, val) => {
                  if (fid !== 'sante') return true
                  if (val === 'critique') return l.vulnerabilites.critique > 0
                  if (val === 'nonsigne') return !l.signee
                  return true
                }}
                colonnes={[
                  {
                    id: 'nom',
                    entete: 'Dépôt',
                    cle: (d) => d.nom,
                    rendu: (d) => (
                      <span className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-p-050 text-p-700">
                          <Package size={13} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[12.5px] font-semibold text-ink">
                            {d.nom}
                          </span>
                          <span className="block text-[11px] text-g-500">
                            {d.application === '—' ? 'Image de base partagée' : `Application ${d.application}`}
                          </span>
                        </span>
                      </span>
                    ),
                  },
                  {
                    id: 'tags',
                    entete: 'Étiquettes',
                    aligne: 'right',
                    cle: (d) => d.tags,
                    rendu: (d) => <span className="tnum text-[12px] text-ink">{d.tags}</span>,
                  },
                  {
                    id: 'taille',
                    entete: 'Taille (dernière)',
                    aligne: 'right',
                    cle: (d) => d.tailleMo,
                    rendu: (d) => (
                      <span className="tnum text-[12px] text-g-700">{num(d.tailleMo)} Mo</span>
                    ),
                  },
                  {
                    id: 'vulns',
                    entete: 'Vulnérabilités',
                    cle: (d) => d.vulnerabilites.critique * 100 + d.vulnerabilites.haute,
                    rendu: (d) => (
                      <span className="flex flex-wrap items-center gap-1">
                        {d.vulnerabilites.critique > 0 && (
                          <Badge tone="err" size="sm">
                            {d.vulnerabilites.critique} critique
                          </Badge>
                        )}
                        {d.vulnerabilites.haute > 0 && (
                          <Badge tone="warn" size="sm">
                            {d.vulnerabilites.haute} haute
                          </Badge>
                        )}
                        <Badge tone="neutral" size="sm">
                          {d.vulnerabilites.moyenne} moyenne
                        </Badge>
                      </span>
                    ),
                  },
                  {
                    id: 'signee',
                    entete: 'Signature',
                    aligne: 'center',
                    cle: (d) => (d.signee ? 1 : 0),
                    rendu: (d) =>
                      d.signee ? (
                        <Badge tone="ok" size="sm">
                          Cosign
                        </Badge>
                      ) : (
                        <Badge tone="warn" size="sm">
                          Absente
                        </Badge>
                      ),
                  },
                  {
                    id: 'push',
                    entete: 'Dernière poussée',
                    aligne: 'right',
                    cle: (d) => d.dernierPush,
                    rendu: (d) => (
                      <span className="block text-right">
                        <span className="block text-[12px] text-ink">{relatif(d.dernierPush)}</span>
                        <span className="block text-[10.5px] text-g-500">par {d.auteur}</span>
                      </span>
                    ),
                  },
                  {
                    id: 'actions',
                    entete: '',
                    aligne: 'right',
                    rendu: (d) => (
                      <span className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setOuvert(d.id === ouvert ? null : d.id)}
                        >
                          {d.id === ouvert ? 'Replier' : 'Étiquettes'}
                        </Button>
                        <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
                          <Button
                            size="sm"
                            variant="ghost"
                            iconBefore={<Trash2 size={12} />}
                            onClick={() => setASupprimer(d)}
                          >
                            Supprimer
                          </Button>
                        </GatedAction>
                      </span>
                    ),
                  },
                ]}
                vide={{
                  titre: 'Aucun dépôt',
                  phrase:
                    'Un dépôt est créé automatiquement au premier build d’une application, ou à la première poussée manuelle d’une image.',
                }}
              />
            </div>
          </Card>

          {depot && (
            <Card>
              <CardHeader
                titre={
                  <span className="font-mono text-[14px]">{depot.nom}</span>
                }
                sousTitre="Les étiquettes utilisées par un environnement en marche ne sont jamais purgées, même si la règle de rétention les désigne."
                actions={
                  <Badge tone={depot.signee ? 'ok' : 'warn'} size="sm">
                    {depot.signee ? 'Images signées' : 'Signature manquante'}
                  </Badge>
                }
              />
              {!TAGS[depot.id] ? (
                <EmptyState
                  titre="Étiquettes non chargées"
                  phrase="Le détail des étiquettes de ce dépôt est disponible depuis la page de l’application qui le produit."
                  action={{ libelle: 'Voir les projets', href: '/app/projets' }}
                />
              ) : (
                <div className="overflow-x-auto rounded-[8px] border border-g-300">
                  <table className="w-full min-w-max border-collapse">
                    <thead>
                      <tr className="border-b border-g-300 bg-g-050">
                        {['Étiquette', 'Condensat', 'Taille', 'Poussée', 'Utilisée par', ''].map((h) => (
                          <th
                            key={h}
                            className="type-micro px-3 py-2 text-left font-semibold text-g-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TAGS[depot.id].map((t) => (
                        <tr key={t.id} className="border-b border-g-100 last:border-0">
                          <td className="px-3 py-2.5">
                            <span className="flex items-center gap-2">
                              <span className="font-mono text-[12px] font-semibold text-ink">
                                {t.tag}
                              </span>
                              {t.immuable ? (
                                <Badge tone="violet" size="sm">
                                  Immuable
                                </Badge>
                              ) : (
                                <Badge tone="warn" size="sm">
                                  Mutable
                                </Badge>
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] text-g-500">{t.digest}</td>
                          <td className="tnum px-3 py-2.5 text-[12px] text-g-700">{t.tailleMo} Mo</td>
                          <td className="px-3 py-2.5 text-[11.5px] text-g-700">
                            {dateHeure(t.pousse)}
                          </td>
                          <td className="px-3 py-2.5">
                            {t.utilise.length === 0 ? (
                              <span className="text-[11.5px] text-g-500">Aucun environnement</span>
                            ) : (
                              <span className="flex flex-wrap gap-1">
                                {t.utilise.map((e) => (
                                  <Badge key={e} tone="ok" size="sm">
                                    {e}
                                  </Badge>
                                ))}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={t.utilise.length > 0}
                              onClick={() =>
                                pousser({
                                  ton: 'info',
                                  titre: `Étiquette ${t.tag} supprimée`,
                                  detail: 'Le condensat reste accessible tant qu’une autre étiquette le référence.',
                                })
                              }
                            >
                              Supprimer
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {depot.vulnerabilites.critique > 0 && (
                <Callout
                  ton="err"
                  className="mt-4"
                  titre="Une vulnérabilité critique bloque la promotion en production"
                >
                  <span className="font-mono text-[12px]">CVE-2026-21882</span> — élévation de
                  privilèges dans <span className="font-mono text-[12px]">libxml2 2.12.4</span>.
                  Corrigée en <span className="font-mono text-[12px]">2.12.7</span>, disponible dans
                  l’image de base <span className="font-mono text-[12px]">org-dba/base-python:3.12-slim-2</span>.
                  Reconstruisez sur cette base pour lever le blocage.
                </Callout>
              )}
            </Card>
          )}
        </div>
      )}

      {onglet === 'acces' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Se connecter au registre"
              sousTitre="Le jeton est propre à l’organisation et révocable à tout moment. Il n’ouvre aucun autre accès que le registre."
            />
            <div className="space-y-3">
              <CopyField label="Adresse du registre" value="registry.abj.synelia.cloud" />
              <CopyField label="Identifiant" value="org-dba" />
              <CopyField label="Jeton de poussée" masque value="synr_8f2a91c4d7b0e5443a17c96e2f0d8b41" />
            </div>
            <MicroLabel className="mt-4 mb-2">Depuis un poste ou un exécuteur d’intégration</MicroLabel>
            <CodeBlock
              langue="bash"
              code={`echo "$SYNELIA_REGISTRY_TOKEN" | docker login registry.abj.synelia.cloud \\
  --username org-dba --password-stdin

docker tag mon-app:local registry.abj.synelia.cloud/org-dba/mon-app:v1.0.0
docker push registry.abj.synelia.cloud/org-dba/mon-app:v1.0.0`}
            />
            <Callout ton="info" className="mt-4" titre="Le registre est privé par défaut">
              Aucune image n’est accessible sans authentification, et la sortie vers un registre
              externe est refusée par la politique de l’organisation. Un artefact analysé ici est
              exactement celui qui sera déployé.
            </Callout>
          </Card>

          <Card>
            <CardHeader titre="Jetons actifs" sousTitre="Révoquer un jeton coupe immédiatement les poussées qui l’utilisent." />
            <div className="space-y-2">
              {[
                { nom: 'ci-bot · intégration continue', cree: '2025-11-04', dernier: '2026-08-19T14:52:00Z', portee: 'push + pull' },
                { nom: 'poste l.konan', cree: '2026-03-18', dernier: '2026-08-14T09:20:00Z', portee: 'pull' },
                { nom: 'runner-forge-01', cree: '2026-06-02', dernier: '2026-08-19T11:03:00Z', portee: 'push + pull' },
              ].map((j) => (
                <div
                  key={j.nom}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-ink">{j.nom}</span>
                    <span className="block text-[11px] text-g-500">
                      Créé le {j.cree} · dernier usage {relatif(j.dernier)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge tone="neutral" size="sm">
                      {j.portee}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      Révoquer
                    </Button>
                  </span>
                </div>
              ))}
            </div>
            <KeyValueList
              className="mt-4 border-t border-g-100 pt-4"
              colonnes={1}
              items={[
                { cle: 'Chiffrement au repos', valeur: 'AES-256, clés gérées par la plateforme' },
                { cle: 'Transport', valeur: 'TLS 1.3 obligatoire, HTTP refusé' },
                { cle: 'Localisation des données', valeur: 'Abidjan · ABJ-1 (aucune réplication hors zone)' },
                { cle: 'Analyse automatique', valeur: 'À chaque poussée, résultat sous 90 secondes' },
              ]}
            />
          </Card>
        </div>
      )}

      {onglet === 'retention' && (
        <Card>
          <CardHeader
            titre="Règles de rétention"
            sousTitre="La rétention libère de l’espace sans jamais toucher à une étiquette utilisée par un environnement en marche."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Conserver les N dernières étiquettes par dépôt" hint="au-delà, les plus anciennes sont purgées">
              <Input type="number" defaultValue={20} />
            </Field>
            <Field label="Purger les étiquettes non référencées après" hint="jours depuis la poussée">
              <Input type="number" defaultValue={90} />
            </Field>
          </div>
          <div className="mt-4 space-y-3.5 border-t border-g-100 pt-4">
            <Switch
              checked
              label="Protéger les étiquettes de version sémantique"
              description="Les étiquettes de la forme vX.Y.Z ne sont jamais purgées automatiquement — elles constituent votre historique de livraison."
            />
            <Switch
              checked
              label="Protéger les étiquettes utilisées par un environnement"
              description="Non désactivable. Purger l’image d’un environnement en marche rendrait tout redémarrage impossible."
            />
            <Switch
              checked={false}
              label="Purger les images de développement quotidiennement"
              description="Les étiquettes de la forme branche-commit produites par l’intégration continue sont supprimées après 7 jours."
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-g-100 pt-4">
            <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
              <Button
                onClick={() =>
                  pousser({
                    ton: 'ok',
                    titre: 'Règles de rétention enregistrées',
                    detail: 'La prochaine passe de purge est prévue cette nuit à 02 h 00 GMT.',
                  })
                }
              >
                Enregistrer
              </Button>
            </GatedAction>
            <Button variant="ghost">Simuler la purge</Button>
            <span className="text-[11.5px] text-g-500">
              La simulation liste ce qui serait supprimé, sans rien supprimer.
            </span>
          </div>
        </Card>
      )}

      {onglet === 'politique' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Politique d’admission"
              sousTitre="Conditions qu’une image doit remplir pour être déployée. Une condition non remplie arrête le déploiement avant qu’il ne touche l’environnement."
            />
            <div className="space-y-2">
              {[
                { regle: 'Aucune vulnérabilité critique non corrigée', appliquee: 'Production, Pré-production', ton: 'ok' as const, statut: 'Active' },
                { regle: 'Image signée par Cosign', appliquee: 'Production', ton: 'warn' as const, statut: 'Avertissement seulement' },
                { regle: 'Aucun secret détecté dans les couches', appliquee: 'Tous les environnements', ton: 'ok' as const, statut: 'Active' },
                { regle: 'Image de base issue du registre interne', appliquee: 'Production', ton: 'ok' as const, statut: 'Active' },
                { regle: 'Utilisateur non root dans le manifeste', appliquee: 'Production', ton: 'warn' as const, statut: 'Avertissement seulement' },
                { regle: 'Taille de l’image inférieure à 1 Go', appliquee: 'Aucun', ton: 'neutral' as const, statut: 'Inactive' },
              ].map((r) => (
                <div
                  key={r.regle}
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-3 rounded-[6px] border px-3 py-2.5',
                    r.ton === 'ok' ? 'border-g-300' : r.ton === 'warn' ? 'border-warn/40 bg-warn-bg' : 'border-g-300 bg-g-050',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-ink">{r.regle}</span>
                    <span className="block text-[11px] text-g-500">Appliquée à : {r.appliquee}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge tone={r.ton} size="sm">
                      {r.statut}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      Modifier
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader titre="Dérogation temporaire" sousTitre="Une dérogation est nominative, datée et journalisée dans l’audit." />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Règle">
                <Select defaultValue="cosign">
                  <option value="cosign">Image signée par Cosign</option>
                  <option value="critique">Aucune vulnérabilité critique</option>
                  <option value="root">Utilisateur non root</option>
                </Select>
              </Field>
              <Field label="Environnement">
                <Select defaultValue="preprod">
                  <option value="preprod">Pré-production</option>
                  <option value="prod">Production</option>
                </Select>
              </Field>
              <Field label="Expire le">
                <Input type="date" defaultValue="2026-08-26" />
              </Field>
            </div>
            <Callout ton="warn" className="mt-4" titre="Une dérogation n’est pas un contournement">
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle size={13} />
                Elle est bornée dans le temps, attachée à votre nom, et visible de tous les
                administrateurs de l’organisation. Elle apparaît aussi dans le rapport de conformité
                de la période concernée.
              </span>
            </Callout>
            <GatedAction autorise={autorise('secrets.update')} message={refus('secrets.update')}>
              <Button className="mt-3.5" variant="secondary">
                Demander la dérogation
              </Button>
            </GatedAction>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={aSupprimer !== null}
        onClose={() => setASupprimer(null)}
        titre="Supprimer un dépôt d’images"
        ressource={aSupprimer?.nom ?? ''}
        pertes={[
          `${aSupprimer?.tags ?? 0} étiquettes et tous leurs condensats`,
          'L’historique des analyses de sécurité de ce dépôt',
          'Toute possibilité de retour arrière vers une version antérieure',
        ]}
        onConfirm={() => {
          pousser({
            ton: 'err',
            titre: `Dépôt ${aSupprimer?.nom} supprimé`,
            detail: 'Les environnements qui référençaient ces images ne pourront plus redémarrer.',
          })
          setASupprimer(null)
        }}
      />
    </div>
  )
}
