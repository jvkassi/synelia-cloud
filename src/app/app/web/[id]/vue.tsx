'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Activity,
  Clock,
  Database,
  Download,
  ExternalLink,
  FolderTree,
  Globe,
  HardDrive,
  KeyRound,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  ShoppingBag,
  Terminal,
  Trash2,
} from 'lucide-react'
import { cn, seededSeries, surfaceMarque } from '@/lib/utils'
import { dateHeure, money, num, relatif } from '@/lib/format'
import { SITE_LABEL } from '@/lib/types'
import type { BaseHebergement, SiteWeb } from '@/lib/types'
import {
  CATALOGUE_PARTAGE,
  LOGS_EXECUTION,
  TYPE_SITE_LABEL,
  basesDeLHebergement,
  comptesDeLHebergement,
  hebergementById,
  nomServi,
  partagesDeLHebergement,
  sitesDeLHebergement,
  tachesDeLHebergement,
} from '@/lib/mock'
import { configurationDuService } from '@/lib/configurations'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink, IconButton } from '@/components/ui/button'
import { CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, SegmentedControl, Select, Switch } from '@/components/ui/field'
import { Drawer, Tooltip } from '@/components/ui/overlay'
import { PageHeader, Card, CardHeader, Callout, KeyValueList } from '@/components/composition/card'
import { StatTile, QuotaBar, HealthBadge } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { GrilleSparkCharts, LogPeek } from '@/components/business/observabilite'
import { ConfigurationServicePanel } from '@/components/business/configuration-service'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'apercu', label: 'Vue d’ensemble' },
  { id: 'sites', label: 'Sites & sous-domaines' },
  { id: 'bases', label: 'Bases de données' },
  { id: 'fichiers', label: 'Accès fichiers' },
  { id: 'runtime', label: 'PHP & runtime' },
  { id: 'partages', label: 'Services partagés' },
  { id: 'dns', label: 'DNS & certificats' },
  { id: 'taches', label: 'Tâches planifiées' },
  { id: 'sauvegardes', label: 'Sauvegardes' },
  { id: 'journaux', label: 'Journaux' },
]

const TEINTE_SITE: Record<string, string> = {
  wordpress: '#21759B',
  prestashop: '#DF0067',
  php: '#777BB4',
  statique: '#4B2882',
  laravel: '#FF2D20',
}

export function VueHebergement({ id }: { id: string }) {
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('apercu')
  const [siteOuvert, setSiteOuvert] = useState<SiteWeb | null>(null)
  const [baseOuverte, setBaseOuverte] = useState<BaseHebergement | null>(null)
  const [partageOuvert, setPartageOuvert] = useState<string | null>(null)

  const h = hebergementById(id)
  if (!h) return null

  const sites = sitesDeLHebergement(id)
  const bases = basesDeLHebergement(id)
  const comptes = comptesDeLHebergement(id)
  const taches = tachesDeLHebergement(id)
  const partages = partagesDeLHebergement(id)
  const nom = nomServi(h)

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Hébergements web', href: '/app/web' },
          { label: nom },
        ]}
        titre={<span className="break-words font-mono">{nom}</span>}
        sousTitre={`Un domaine, un serveur. ${sites.length} site${sites.length > 1 ? 's' : ''} et ${bases.length} base${bases.length > 1 ? 's' : ''} cohabitent sur ${h.serveur.nom}, à ${SITE_LABEL[h.serveur.site]}.`}
        meta={
          <>
            <HealthBadge etat={h.statut === 'en_ligne' ? 'ok' : h.statut === 'maintenance' ? 'maintenance' : 'suspendu'} />
            <Badge tone="neutral">{h.palier}</Badge>
            <Badge tone="neutral">{h.serveur.serveurWeb}</Badge>
            <Badge tone="neutral">PHP {h.php.versionDefaut}</Badge>
            <Badge tone="violet">{SITE_LABEL[h.serveur.site]}</Badge>
            {!h.domaine && <Badge tone="warn">Domaine à acheter</Badge>}
          </>
        }
        actions={
          <>
            <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
              <Button variant="secondary" size="sm" iconBefore={<Plus size={13} />}>
                Installer un site
              </Button>
            </GatedAction>
            <ButtonLink
              href={`https://${nom}`}
              variant="accent"
              size="sm"
              iconAfter={<ExternalLink size={13} />}
            >
              Ouvrir le site
            </ButtonLink>
          </>
        }
      />

      {!h.domaine && (
        <Callout
          ton="warn"
          titre="L’hébergement tourne sur un nom provisoire"
          action={
            <ButtonLink href="/app/domaines" size="sm" variant="secondary">
              Acheter un domaine
            </ButtonLink>
          }
        >
          Vos sites sont servis sur <span className="font-mono">{h.domaineProvisoire}</span>, avec un
          certificat valide. Dès que vous enregistrez votre nom, il suffit de le pointer sur{' '}
          <span className="font-mono">{h.serveur.ip}</span> : les sites, les bases et les accès
          restent en place, seuls les sous-domaines changent.
        </Callout>
      )}

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'apercu' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              libelle="Sites"
              valeur={sites.length}
              detail={`${sites.filter((s) => s.statut === 'en_ligne').length} en ligne`}
            />
            <StatTile
              libelle="Visites du mois"
              valeur={num(sites.reduce((a, s) => a + s.visitesMois, 0))}
              serie={seededSeries(h.id, 14, 600, 1800)}
            />
            <StatTile
              libelle="Espace occupé"
              valeur={`${h.espaceUtiliseGo.toFixed(1)} Go`}
              detail={`sur ${h.espaceTotalGo} Go`}
              ton={h.espaceUtiliseGo / h.espaceTotalGo > 0.85 ? 'warn' : 'neutral'}
            />
            <StatTile
              libelle="Dernière sauvegarde"
              valeur={relatif(h.sauvegarde.derniere)}
              ton={h.sauvegarde.statut === 'ok' ? 'ok' : 'err'}
              detail={h.sauvegarde.taille}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                titre="Le serveur de cet hébergement"
                sousTitre="Un domaine est attaché à un serveur et à un seul. Tout ce qui est installé ici partage ces ressources — c’est la contrepartie du prix."
                actions={
                  <GatedAction autorise={autorise('vm.power')} message={refus('vm.power')}>
                    <Button variant="secondary" size="sm" iconBefore={<RefreshCw size={13} />}>
                      Redémarrer Apache
                    </Button>
                  </GatedAction>
                }
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <QuotaBar libelle="Processeur" utilise={h.serveur.chargeCpuPct} total={100} unite="%" seuil={85} />
                  <QuotaBar libelle="Mémoire" utilise={h.serveur.ramUtiliseePct} total={100} unite="%" seuil={90} />
                  <QuotaBar
                    libelle="Disque"
                    utilise={h.espaceUtiliseGo}
                    total={h.espaceTotalGo}
                    seuil={85}
                    formateur={(v) => `${v.toFixed(1)} Go`}
                  />
                </div>
                <KeyValueList
                  colonnes={1}
                  items={[
                    { cle: 'Nom', valeur: <span className="font-mono">{h.serveur.nom}</span> },
                    { cle: 'Gabarit', valeur: `${h.serveur.vcpu} vCPU · ${h.serveur.ramGo} Go · ${h.serveur.diskGo} Go` },
                    { cle: 'Adresse IPv4', valeur: <span className="font-mono">{h.serveur.ip}</span> },
                    { cle: 'Adresse IPv6', valeur: <span className="font-mono text-[12px]">{h.serveur.ipv6}</span> },
                    { cle: 'Système', valeur: `${h.serveur.os} · ${h.serveur.serveurWeb}` },
                    { cle: 'Site physique', valeur: SITE_LABEL[h.serveur.site] },
                    { cle: 'En service depuis', valeur: `${h.serveur.uptimeJours} jours` },
                  ]}
                />
              </div>
              <Callout ton="info" className="mt-4" titre="Pointer votre domaine ici">
                Créez un enregistrement <span className="font-mono">A</span> vers{' '}
                <span className="font-mono">{h.serveur.ip}</span> et un{' '}
                <span className="font-mono">AAAA</span> vers{' '}
                <span className="font-mono text-[11.5px]">{h.serveur.ipv6}</span>. Si votre zone est
                gérée chez nous, l’onglet DNS le fait en une action.
              </Callout>
            </Card>

            <Card>
              <CardHeader
                titre="Actions courantes"
                sousTitre="Les gestes du quotidien, sans passer par les onglets."
              />
              <div className="space-y-2">
                {[
                  { l: 'Installer WordPress', i: <Globe size={13} />, o: 'sites' },
                  { l: 'Créer une base', i: <Database size={13} />, o: 'bases' },
                  { l: 'Ajouter un accès SFTP', i: <FolderTree size={13} />, o: 'fichiers' },
                  { l: 'Changer la version de PHP', i: <Terminal size={13} />, o: 'runtime' },
                  { l: 'Programmer une tâche', i: <Clock size={13} />, o: 'taches' },
                  { l: 'Restaurer une sauvegarde', i: <HardDrive size={13} />, o: 'sauvegardes' },
                ].map((a) => (
                  <button
                    key={a.l}
                    type="button"
                    onClick={() => setOnglet(a.o)}
                    className="flex w-full items-center gap-2.5 rounded-[6px] border border-g-300 px-2.5 py-2 text-left text-[12.5px] font-semibold text-g-700 transition-colors hover:border-p-400 hover:bg-p-050 hover:text-p-700"
                  >
                    <span className="text-p-700">{a.i}</span>
                    {a.l}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              titre="Trafic et temps de réponse"
              sousTitre="Mesuré par nos sondes sur les sites de cet hébergement."
              actions={
                <ButtonLink
                  href="https://grafana.synelia.cloud"
                  variant="ghost"
                  size="sm"
                  iconAfter={<ExternalLink size={12} />}
                >
                  Ouvrir dans Grafana
                </ButtonLink>
              }
            />
            <GrilleSparkCharts
              seed={h.id}
              metriques={[
                { titre: 'Visites', unite: '/h', min: 40, max: 320 },
                { titre: 'Temps de réponse', unite: 'ms', min: 120, max: 480 },
                { titre: 'Processeur', unite: '%', min: 12, max: 68, seuil: 85 },
                { titre: 'Erreurs 5xx', unite: '/h', min: 0, max: 6 },
              ]}
            />
          </Card>
        </div>
      )}

      {onglet === 'sites' && (
        <div className="space-y-4">
          <Callout ton="info" titre="Un site, un sous-domaine, un dossier">
            Chaque site vit dans son dossier et répond sur son propre sous-domaine. Ils partagent le
            serveur, mais pas leur base, ni leur version de PHP, ni leur certificat. Le contenu
            s’édite dans WordPress ou PrestaShop, jamais dans ce portail.
          </Callout>

          <Card padding={false}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-g-100 px-4 py-3">
              <p className="text-[13px] font-bold text-ink">{sites.length} sites installés</p>
              <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
                <Button size="sm" iconBefore={<Plus size={13} />}>
                  Installer un site
                </Button>
              </GatedAction>
            </div>
            {sites.length === 0 ? (
              <EmptyState
                className="m-4"
                titre="Aucun site installé"
                phrase="Installez WordPress ou PrestaShop en une action, ou déposez vos fichiers par SFTP dans un nouveau dossier."
                action={{ libelle: 'Installer un site', href: '#' }}
              />
            ) : (
              <ul className="divide-y divide-g-100">
                {sites.map((s) => {
                  const surface = surfaceMarque(TEINTE_SITE[s.type] ?? '#4B2882')
                  const base = bases.find((b) => b.id === s.baseId)
                  return (
                    <li key={s.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] text-[10px] font-bold"
                        style={{ background: surface.fond, color: surface.texte }}
                        aria-hidden
                      >
                        {TYPE_SITE_LABEL[s.type].slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`https://${s.hote}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[13px] font-bold text-ink hover:text-p-700"
                          >
                            {s.hote}
                          </a>
                          <Badge tone="neutral" size="sm">
                            {TYPE_SITE_LABEL[s.type]}
                            {s.version ? ` ${s.version}` : ''}
                          </Badge>
                          {s.statut === 'installation' ? (
                            <Badge tone="info" size="sm" dot>
                              Installation en cours
                            </Badge>
                          ) : (
                            <Badge tone={s.ssl.etat === 'actif' ? 'ok' : 'warn'} size="sm">
                              {s.ssl.etat === 'actif' ? 'TLS actif' : 'TLS en émission'}
                            </Badge>
                          )}
                          {(s.majEnAttente ?? 0) > 0 && (
                            <Badge tone="warn" size="sm">
                              {s.majEnAttente} mise{(s.majEnAttente ?? 0) > 1 ? 's' : ''} à jour
                            </Badge>
                          )}
                          {s.preproduction?.actif && (
                            <Badge tone="violet" size="sm">
                              Préproduction
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-[11.5px] text-g-500">
                          <span className="font-mono">{s.racine}</span> · PHP {s.phpVersion} ·{' '}
                          {(s.espaceMo / 1024).toFixed(1)} Go · {num(s.visitesMois)} visites/mois
                          {base ? ` · base ${base.nom}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setSiteOuvert(s)}>
                          Configurer
                        </Button>
                        <ButtonLink
                          href={`https://${s.hote}/wp-admin`}
                          variant="ghost"
                          size="sm"
                          iconAfter={<ExternalLink size={12} />}
                        >
                          Administrer
                        </ButtonLink>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              titre="Installer une solution"
              sousTitre="Installation en place, sur un sous-domaine de cet hébergement. Pour une instance isolée avec ses propres ressources, passez par un projet applicatif."
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { nom: 'WordPress', v: '6.7.1', t: '#21759B', p: 'Site vitrine, blog, contenu éditorial.' },
                { nom: 'PrestaShop', v: '8.1.7', t: '#DF0067', p: 'Boutique avec paiements mobile money.' },
                { nom: 'Laravel', v: '11', t: '#FF2D20', p: 'Application PHP sur mesure.' },
                { nom: 'Site statique', v: '—', t: '#4B2882', p: 'HTML, ou sortie d’un générateur.' },
              ].map((o) => {
                const surface = surfaceMarque(o.t)
                return (
                  <div key={o.nom} className="rounded-[8px] border border-g-300 p-3">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[10px] font-bold"
                      style={{ background: surface.fond, color: surface.texte }}
                      aria-hidden
                    >
                      {o.nom.slice(0, 2).toUpperCase()}
                    </span>
                    <p className="mt-2 text-[13px] font-bold text-ink">{o.nom}</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-g-500">{o.p}</p>
                    <p className="mt-1.5 font-mono text-[11px] text-g-500">version {o.v}</p>
                    <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
                      <Button variant="secondary" size="sm" fullWidth className="mt-2.5">
                        Installer
                      </Button>
                    </GatedAction>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {onglet === 'bases' && (
        <div className="space-y-4">
          <Callout ton="info" titre="Ces bases tournent sur le serveur de l’hébergement">
            MariaDB et PostgreSQL sont installés sur la machine, à côté d’Apache. C’est simple et
            compris dans le prix, mais sans haute disponibilité ni réplique de lecture : pour cela,
            il faut une base managée, qui vit sur son propre socle.
          </Callout>

          <Card padding={false}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-g-100 px-4 py-3">
              <p className="text-[13px] font-bold text-ink">
                {bases.length} bases · {(bases.reduce((a, b) => a + b.tailleMo, 0) / 1024).toFixed(1)} Go
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <ButtonLink
                  href={`https://adminer.${nom}`}
                  variant="ghost"
                  size="sm"
                  iconAfter={<ExternalLink size={12} />}
                >
                  Ouvrir Adminer
                </ButtonLink>
                <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
                  <Button size="sm" iconBefore={<Plus size={13} />}>
                    Créer une base
                  </Button>
                </GatedAction>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Base', 'Moteur', 'Taille', 'Jeu de caractères', 'Utilisateurs', 'Site', ''].map((c) => (
                      <th key={c} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bases.map((b) => {
                    const site = sites.find((s) => s.id === b.siteId)
                    return (
                      <tr key={b.id} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5 font-mono text-[12.5px] font-semibold text-ink">
                          {b.nom}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone={b.moteur === 'mariadb' ? 'info' : 'violet'} size="sm">
                            {b.moteur === 'mariadb' ? 'MariaDB' : 'PostgreSQL'} {b.version}
                          </Badge>
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">
                          {b.tailleMo >= 1024 ? `${(b.tailleMo / 1024).toFixed(1)} Go` : `${b.tailleMo} Mo`}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11.5px] text-g-500">
                          {b.jeuCaracteres}
                        </td>
                        <td className="px-3 py-2.5 text-[12px] text-g-700">
                          {b.utilisateurs.length}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11.5px] text-g-500">
                          {site?.hote ?? '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button variant="secondary" size="sm" onClick={() => setBaseOuverte(b)}>
                            Gérer
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {onglet === 'fichiers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                titre="Comptes de transfert"
                sousTitre="Un compte par intervenant, cantonné à son dossier. Le mot de passe n’est jamais réaffiché : il se remplace."
                actions={
                  <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
                    <Button size="sm" iconBefore={<Plus size={13} />}>
                      Ajouter un compte
                    </Button>
                  </GatedAction>
                }
              />
              <ul className="divide-y divide-g-100">
                {comptes.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-start gap-3 py-2.5 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[12.5px] font-semibold text-ink">
                          {c.utilisateur}
                        </span>
                        {c.protocoles.map((p) => (
                          <Badge key={p} tone="neutral" size="sm">
                            {p.toUpperCase()}
                          </Badge>
                        ))}
                        {c.clesSsh > 0 && (
                          <Badge tone="ok" size="sm">
                            {c.clesSsh} clé{c.clesSsh > 1 ? 's' : ''} SSH
                          </Badge>
                        )}
                        <Badge tone={c.statut === 'actif' ? 'ok' : 'neutral'} size="sm" dot>
                          {c.statut === 'actif' ? 'Actif' : 'Suspendu'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11.5px] text-g-500">
                        <span className="font-mono">{c.racine}</span> ·{' '}
                        {c.quotaGo === null
                          ? `${c.utiliseGo.toFixed(1)} Go, sans quota`
                          : `${c.utiliseGo.toFixed(1)} Go sur ${c.quotaGo} Go`}
                        {c.derniereConnexion
                          ? ` · dernière connexion ${relatif(c.derniereConnexion)}`
                          : ' · jamais connecté'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button variant="secondary" size="sm">
                        Remplacer le mot de passe
                      </Button>
                      <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
                        <IconButton label={`Supprimer ${c.utilisateur}`} size="sm">
                          <Trash2 size={13} className="text-err" />
                        </IconButton>
                      </GatedAction>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader
                titre="Protocoles ouverts"
                sousTitre="Ce qui est fermé ne peut pas être attaqué."
              />
              <div className="space-y-3">
                <Switch
                  checked={h.acces.sftp}
                  label="SFTP"
                  description="Transfert sur SSH, chiffré. Le choix par défaut."
                />
                <Switch
                  checked={h.acces.ftps}
                  label="FTPS"
                  description="FTP sur TLS. Pour un vieux client qui ne parle pas SSH."
                />
                <Switch
                  checked={h.acces.ftp}
                  label="FTP simple"
                  description="Mot de passe en clair sur le réseau. Fermé par défaut, et nous le déconseillons."
                />
                <Switch
                  checked={h.acces.ssh}
                  label="Shell SSH"
                  description={`Accès en ligne de commande sur le port ${h.acces.portSsh}, par clé uniquement.`}
                />
              </div>
              <div className="mt-4 border-t border-g-100 pt-3">
                <MicroLabel>Se connecter</MicroLabel>
                <CopyField
                  className="mt-2"
                  label="Commande SFTP"
                  value={`sftp -P ${h.acces.portSsh} dba-admin@${h.serveur.ip}`}
                  mono
                />
                <ButtonLink href="/app/securite" variant="ghost" size="sm" className="mt-2">
                  Gérer les clés SSH →
                </ButtonLink>
              </div>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'runtime' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader
                titre="Version de PHP"
                sousTitre="Une version par défaut pour le serveur, et une version propre à chaque site si besoin."
              />
              <Field label="Version par défaut" hint="S’applique aux sites qui n’ont pas de réglage propre.">
                <Select defaultValue={h.php.versionDefaut}>
                  {h.php.versionsDisponibles.map((v) => (
                    <option key={v} value={v}>
                      PHP {v}
                      {v === '8.4' ? ' — la plus récente' : v === '8.1' ? ' — fin de support en 2026' : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="mt-3 space-y-2">
                {sites
                  .filter((s) => s.type !== 'statique')
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-g-300 px-2.5 py-2"
                    >
                      <span className="min-w-0 truncate font-mono text-[12px] text-ink">{s.hote}</span>
                      <Select defaultValue={s.phpVersion} className="h-7 w-24 shrink-0 text-[12px]">
                        {h.php.versionsDisponibles.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ))}
              </div>
            </Card>

            <Card>
              <CardHeader titre="Limites d’exécution" sousTitre="Relever une limite consomme de la mémoire du serveur." />
              <div className="space-y-3">
                <Field label="Mémoire par requête" hint="memory_limit">
                  <Input defaultValue={`${h.php.limites.memoryLimitMo}M`} />
                </Field>
                <Field label="Taille d’envoi maximale" hint="upload_max_filesize et post_max_size">
                  <Input defaultValue={`${h.php.limites.uploadMaxMo}M`} />
                </Field>
                <Field label="Durée maximale d’un script" hint="max_execution_time, en secondes">
                  <Input defaultValue={String(h.php.limites.maxExecutionS)} />
                </Field>
                <Switch
                  checked={h.php.limites.opcache}
                  label="OPcache"
                  description="Garde le bytecode compilé en mémoire. À laisser actif en production."
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                titre="Extensions"
                sousTitre="Ce qui est requis par un site installé ne peut pas être désactivé."
              />
              <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                {h.php.extensions.map((e) => (
                  <div
                    key={e.nom}
                    className="flex items-start justify-between gap-2 rounded-[6px] border border-g-300 px-2.5 py-1.5"
                  >
                    <span className="min-w-0">
                      <span className="block font-mono text-[12px] font-semibold text-ink">
                        {e.nom}
                      </span>
                      {e.requisePar && (
                        <span className="block text-[10.5px] text-g-500">requise par {e.requisePar}</span>
                      )}
                    </span>
                    {e.requisePar && e.active ? (
                      <Tooltip content={`Requise par ${e.requisePar}`}>
                        <span className="shrink-0">
                          <Badge tone="ok" size="sm">
                            Verrouillée
                          </Badge>
                        </span>
                      </Tooltip>
                    ) : (
                      <Switch checked={e.active} className="shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'partages' && (
        <div className="space-y-4">
          <Callout ton="violet" titre="Ces services sont fixés à votre domaine">
            Une messagerie ou un drive partagé s’adresse à un domaine, pas à un projet : les boîtes
            sont <span className="font-mono">nom@{nom}</span> et l’instance est mutualisée entre
            plusieurs clients. Quand il faut une instance isolée — quota important, rétention
            réglementaire, intégration à l’annuaire —, on passe au modèle dédié.{' '}
            <Link href="/app/modeles" className="font-semibold text-p-700 hover:text-m-600">
              Voir les modèles dédiés →
            </Link>
          </Callout>

          {partages.length === 0 ? (
            <EmptyState
              titre="Aucun service partagé sur ce domaine"
              phrase="Une messagerie sur votre domaine se met en service en quelques minutes : nous créons les enregistrements MX, SPF, DKIM et DMARC, et vous n’avez qu’à créer les boîtes."
              action={{ libelle: 'Voir le catalogue partagé', href: '/app/web/services' }}
            />
          ) : (
            <div className="space-y-4">
              {partages.map((p) => {
                const config = configurationDuService(p.slug)
                const ouvert = partageOuvert === p.id
                return (
                  <Card key={p.id}>
                    <CardHeader
                      titre={
                        <span className="flex flex-wrap items-center gap-2.5">
                          {p.nom}
                          <Badge tone="neutral" size="sm">
                            {p.solution} {p.version}
                          </Badge>
                          <HealthBadge
                            etat={
                              p.sante === 'maj_disponible'
                                ? 'maj_disponible'
                                : p.sante === 'degrade'
                                  ? 'degrade'
                                  : p.sante === 'maintenance'
                                    ? 'maintenance'
                                    : 'ok'
                            }
                          />
                        </span>
                      }
                      sousTitre={`${p.hote} · ${p.usage.utilise} ${p.usage.unite} sur ${p.usage.total} · dernière sauvegarde ${relatif(p.derniereSauvegarde)}`}
                      actions={
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPartageOuvert(ouvert ? null : p.id)}
                          >
                            {ouvert ? 'Replier la configuration' : 'Configurer'}
                          </Button>
                          <GatedAction autorise={autorise('service.open')} message={refus('service.open')}>
                            <ButtonLink
                              href={p.urlOuverture}
                              variant="accent"
                              size="sm"
                              iconAfter={<ExternalLink size={13} />}
                            >
                              Ouvrir
                            </ButtonLink>
                          </GatedAction>
                        </>
                      }
                    />
                    <QuotaBar
                      libelle={p.usage.libelle}
                      utilise={p.usage.utilise}
                      total={p.usage.total}
                      unite={p.usage.unite}
                      seuil={85}
                    />
                    {ouvert && config && (
                      <div className="mt-4 border-t border-g-100 pt-4">
                        <ConfigurationServicePanel
                          config={config}
                          autorise={autorise('service.admin')}
                          messageRefus={refus('service.admin')}
                        />
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

          <Card>
            <CardHeader
              titre="Ajouter un service partagé"
              sousTitre="Le catalogue partagé est court par nature : au-delà de ces trois-là, un service demande son instance."
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CATALOGUE_PARTAGE.map((c) => {
                const dejaActif = partages.some((p) => p.slug === c.slug)
                return (
                  <div key={c.slug} className="rounded-[8px] border border-g-300 p-3">
                    <p className="text-[13px] font-bold text-ink">{c.nom}</p>
                    <p className="mt-0.5 text-[11.5px] text-g-500">{c.solution}</p>
                    <p className="mt-1.5 text-[12px] leading-snug text-g-700">{c.phrase}</p>
                    <p className="mt-2 font-mono text-[11px] text-g-500">
                      {c.sousDomaine}.{nom}
                    </p>
                    <p className="tnum mt-1.5 text-[14px] font-bold text-p-700">
                      {money(c.prix)}
                      <span className="text-[10.5px] font-semibold text-g-500">{c.unite}</span>
                    </p>
                    {dejaActif ? (
                      <Badge tone="ok" size="sm" className="mt-2.5">
                        Déjà actif
                      </Badge>
                    ) : (
                      <GatedAction
                        autorise={autorise('marketplace.subscribe')}
                        message={refus('marketplace.subscribe')}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          className="mt-2.5"
                          onClick={() =>
                            pousser({
                              ton: 'info',
                              titre: `Mise en service de ${c.nom}`,
                              detail: `Sur ${c.sousDomaine}.${nom} — suivez l’avancement dans le centre de tâches.`,
                            })
                          }
                        >
                          Activer
                        </Button>
                      </GatedAction>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {onglet === 'dns' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Zone DNS"
                sousTitre={
                  h.domaine
                    ? 'La zone est servie par nos quatre serveurs de noms, répartis sur les deux sites.'
                    : 'Aucune zone tant que le domaine n’est pas enregistré.'
                }
                actions={
                  h.domaine ? (
                    <ButtonLink href="/app/dns/zone-1" variant="secondary" size="sm">
                      Éditer la zone
                    </ButtonLink>
                  ) : undefined
                }
              />
              {h.domaine ? (
                <div className="space-y-2">
                  {[
                    { t: 'A', n: '@', v: h.serveur.ip },
                    { t: 'A', n: 'www', v: h.serveur.ip },
                    { t: 'AAAA', n: '@', v: h.serveur.ipv6 },
                    { t: 'MX', n: '@', v: 'mail.synelia.cloud (priorité 10)' },
                    { t: 'TXT', n: '@', v: 'v=spf1 include:_spf.synelia.cloud ~all' },
                    { t: 'CNAME', n: 'drive', v: 'drive.partage.synelia.cloud' },
                  ].map((e, i) => (
                    <div
                      key={`${e.t}-${e.n}-${i}`}
                      className="flex flex-wrap items-center gap-2 rounded-[6px] border border-g-300 px-2.5 py-1.5"
                    >
                      <Badge tone="neutral" size="sm">
                        {e.t}
                      </Badge>
                      <span className="font-mono text-[12px] font-semibold text-ink">{e.n}</span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-g-500">
                        {e.v}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  titre="Pas encore de zone"
                  phrase="Enregistrez votre nom de domaine, et la zone sera créée automatiquement avec les enregistrements de cet hébergement déjà renseignés."
                  action={{ libelle: 'Chercher un domaine', href: '/app/domaines' }}
                />
              )}
            </Card>

            <Card>
              <CardHeader
                titre="Certificats TLS"
                sousTitre="Un certificat par site, émis et renouvelé automatiquement. L’alerte tombe 21 jours avant l’échéance."
              />
              <ul className="divide-y divide-g-100">
                {sites.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0">
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-[12.5px] font-semibold text-ink">
                        {s.hote}
                      </span>
                      <span className="block text-[11px] text-g-500">
                        {s.ssl.etat === 'actif'
                          ? `${s.ssl.emetteur} · expire le ${s.ssl.expire}`
                          : s.ssl.etat === 'en_emission'
                            ? 'Émission en cours — quelques minutes'
                            : 'Aucun certificat'}
                      </span>
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        tone={s.ssl.etat === 'actif' ? 'ok' : s.ssl.etat === 'en_emission' ? 'info' : 'warn'}
                        size="sm"
                        dot
                      >
                        {s.ssl.etat === 'actif' ? 'Valide' : s.ssl.etat === 'en_emission' ? 'En émission' : 'Absent'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Renouveler
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <Callout ton="ok" className="mt-3" titre="Renouvellement automatique actif">
                Nous renouvelons trente jours avant l’échéance. Un échec ouvre un ticket
                automatiquement, avant que le site ne devienne inaccessible.
              </Callout>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'taches' && (
        <div className="space-y-4">
          <Card padding={false}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-g-100 px-4 py-3">
              <p className="text-[13px] font-bold text-ink">
                {taches.filter((t) => t.actif).length} tâches actives sur {taches.length}
              </p>
              <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
                <Button size="sm" iconBefore={<Plus size={13} />}>
                  Programmer une tâche
                </Button>
              </GatedAction>
            </div>
            {taches.length === 0 ? (
              <EmptyState
                className="m-4"
                titre="Aucune tâche planifiée"
                phrase="WordPress et PrestaShop ont besoin d’une tâche périodique pour leurs traitements de fond. Nous la créons automatiquement à l’installation."
                action={{ libelle: 'Programmer une tâche', href: '#' }}
              />
            ) : (
              <ul className="divide-y divide-g-100">
                {taches.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">{t.libelle}</span>
                        <Badge tone="neutral" size="sm">
                          <span className="font-mono">{t.expression}</span>
                        </Badge>
                        <span className="text-[11.5px] text-g-500">{t.lisible}</span>
                        <Badge tone={t.statut === 'ok' ? 'ok' : 'err'} size="sm" dot>
                          {t.statut === 'ok' ? 'Dernière exécution réussie' : 'Dernière exécution en échec'}
                        </Badge>
                        {!t.actif && (
                          <Badge tone="neutral" size="sm">
                            Désactivée
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-g-500">{t.commande}</p>
                      <p className="mt-1 text-[11px] text-g-500">
                        Exécutée {relatif(t.derniereExecution)} en {t.dureeS} s · prochaine{' '}
                        {dateHeure(t.prochaine)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Switch checked={t.actif} />
                      <Button variant="secondary" size="sm">
                        Exécuter maintenant
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {taches.some((t) => t.statut === 'echec') && (
            <Callout ton="err" titre="Une tâche échoue">
              L’export des commandes vers l’ERP sort en code 1 depuis le 17/08. La sortie complète
              est dans l’onglet Journaux. Une tâche en échec ne bloque pas les autres.
            </Callout>
          )}
        </div>
      )}

      {onglet === 'sauvegardes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              libelle="Dernière sauvegarde"
              valeur={relatif(h.sauvegarde.derniere)}
              ton={h.sauvegarde.statut === 'ok' ? 'ok' : 'err'}
              detail={dateHeure(h.sauvegarde.derniere)}
            />
            <StatTile libelle="Taille" valeur={h.sauvegarde.taille} detail="dernière exécution" />
            <StatTile
              libelle="Rétention"
              valeur={`${h.sauvegarde.retentionJours} j`}
              detail={h.sauvegarde.immuable ? 'copies immuables' : 'copies modifiables'}
              ton={h.sauvegarde.immuable ? 'ok' : 'warn'}
            />
            <StatTile libelle="Points disponibles" valeur={h.sauvegarde.retentionJours} detail="un par jour" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Plan de sauvegarde"
                sousTitre="Le plan couvre les fichiers de tous les sites, toutes les bases du serveur, et la configuration de l’hébergement."
              />
              <div className="space-y-3">
                <Field label="Fréquence">
                  <SegmentedControl
                    options={[
                      { value: 'quotidienne', label: 'Quotidienne' },
                      { value: 'bihebdomadaire', label: 'Deux fois par semaine' },
                      { value: 'hebdomadaire', label: 'Hebdomadaire' },
                    ]}
                    value={h.sauvegarde.frequence}
                    onChange={() => undefined}
                    size="sm"
                  />
                </Field>
                <Field label="Heure d’exécution" hint="Choisie hors des heures de trafic de vos sites.">
                  <Input defaultValue={h.sauvegarde.heure} />
                </Field>
                <Field label="Rétention" hint="Au-delà, les points les plus anciens sont purgés.">
                  <Select defaultValue={String(h.sauvegarde.retentionJours)}>
                    <option value="14">14 jours</option>
                    <option value="30">30 jours</option>
                    <option value="90">90 jours</option>
                    <option value="365">365 jours</option>
                  </Select>
                </Field>
                <Switch
                  checked={h.sauvegarde.immuable}
                  label="Copies immuables"
                  description="Une copie immuable ne peut être ni modifiée ni supprimée avant la fin de sa rétention, même par un administrateur compromis. C’est la seule protection qui résiste à un rançongiciel."
                />
                <KeyValueList
                  colonnes={1}
                  items={[{ cle: 'Destination', valeur: h.sauvegarde.destination }]}
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                titre="Points de restauration"
                sousTitre="Restaurez tout l’hébergement, un seul site, ou une seule base."
                actions={
                  <GatedAction autorise={autorise('backup.restore')} message={refus('backup.restore')}>
                    <Button size="sm" iconBefore={<HardDrive size={13} />}>
                      Restaurer
                    </Button>
                  </GatedAction>
                }
              />
              <ul className="divide-y divide-g-100">
                {[
                  { d: '2026-08-19T02:34:00Z', t: '31,8 Go', s: 'ok' as const },
                  { d: '2026-08-18T02:31:00Z', t: '31,6 Go', s: 'ok' as const },
                  { d: '2026-08-17T02:33:00Z', t: '31,4 Go', s: 'ok' as const },
                  { d: '2026-08-16T02:30:00Z', t: '31,1 Go', s: 'ok' as const },
                  { d: '2026-08-15T02:36:00Z', t: '30,9 Go', s: 'ok' as const },
                ].map((p) => (
                  <li key={p.d} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0">
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold text-ink">
                        {dateHeure(p.d)}
                      </span>
                      <span className="block text-[11px] text-g-500">
                        {p.t} · immuable jusqu’au {h.sauvegarde.retentionJours} e jour
                      </span>
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button variant="ghost" size="sm" iconBefore={<Download size={12} />}>
                        Télécharger
                      </Button>
                      <Button variant="secondary" size="sm">
                        Restaurer
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <ButtonLink href="/app/sauvegarde" variant="ghost" size="sm" className="mt-3">
                Voir tous les points et la conformité 3-2-1 →
              </ButtonLink>
            </Card>
          </div>

          <Callout ton="info" titre="Ce que la sauvegarde ne remplace pas">
            Une sauvegarde restaure un état passé ; elle ne protège pas d’une erreur qu’on n’a pas
            vue. C’est pourquoi chaque site dispose d’une préproduction : on y essaie la mise à jour
            avant de la publier.
          </Callout>
        </div>
      )}

      {onglet === 'journaux' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Vingt dernières lignes"
              sousTitre="Assez pour comprendre un incident en cours. L’historique complet et la recherche sont dans VictoriaLogs."
            />
            <LogPeek lignes={LOGS_EXECUTION} max={20} titre="Journal d’Apache et de PHP" />
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[
              { t: 'Accès Apache', d: 'Requêtes servies, codes de retour, temps de réponse.', l: '4,2 Go sur 30 jours' },
              { t: 'Erreurs PHP', d: 'Avertissements et erreurs fatales, par site.', l: '186 Mo sur 30 jours' },
              { t: 'Tâches planifiées', d: 'Sortie standard et code de retour de chaque exécution.', l: '42 Mo sur 30 jours' },
            ].map((j) => (
              <Card key={j.t}>
                <CardHeader titre={j.t} sousTitre={j.d} />
                <p className="text-[12px] text-g-500">{j.l}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ButtonLink
                    href="https://vlogs.synelia.cloud"
                    variant="secondary"
                    size="sm"
                    iconAfter={<ExternalLink size={12} />}
                  >
                    Ouvrir
                  </ButtonLink>
                  <Button variant="ghost" size="sm" iconBefore={<Download size={12} />}>
                    Exporter
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Callout ton="info" titre="Pas de constructeur de requêtes ici">
            Le portail montre les dernières lignes et donne l’accès. Interroger des journaux
            demande un outil spécialisé, et VictoriaLogs le fait mieux que ce que nous
            reconstruirions.
          </Callout>
        </div>
      )}

      {/* Configuration d'un site, en panneau latéral */}
      <Drawer
        open={siteOuvert !== null}
        onClose={() => setSiteOuvert(null)}
        title={siteOuvert ? `Configurer ${siteOuvert.hote}` : ''}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSiteOuvert(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                pousser({
                  ton: 'ok',
                  titre: 'Réglages appliqués',
                  detail: `${siteOuvert?.hote} — rechargement d’Apache sans coupure.`,
                })
                setSiteOuvert(null)
              }}
            >
              Appliquer
            </Button>
          </>
        }
      >
        {siteOuvert && (
          <div className="space-y-4">
            <KeyValueList
              items={[
                { cle: 'Solution', valeur: `${TYPE_SITE_LABEL[siteOuvert.type]} ${siteOuvert.version ?? ''}` },
                { cle: 'Racine du site', valeur: <span className="font-mono text-[12px]">{siteOuvert.racine}</span> },
                { cle: 'Espace occupé', valeur: `${(siteOuvert.espaceMo / 1024).toFixed(2)} Go` },
                { cle: 'Visites du mois', valeur: num(siteOuvert.visitesMois) },
              ]}
            />
            <Field label="Version de PHP pour ce site">
              <Select defaultValue={siteOuvert.phpVersion}>
                {h.php.versionsDisponibles.map((v) => (
                  <option key={v} value={v}>
                    PHP {v}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="space-y-2.5">
              <MicroLabel>Sécurité</MicroLabel>
              <Switch
                checked={siteOuvert.securite.waf}
                label="Pare-feu applicatif"
                description="Règles OWASP adaptées à la solution installée."
              />
              <Switch
                checked={siteOuvert.securite.bruteForce}
                label="Anti-force brute"
                description="Sur les pages d’authentification et les points d’API."
              />
              <Switch
                checked={siteOuvert.securite.scanMalware}
                label="Analyse antimalware quotidienne"
                description="Mise en quarantaine et alerte, sans suppression automatique."
              />
            </div>
            {siteOuvert.preproduction && (
              <Callout ton="violet" titre="Préproduction">
                {siteOuvert.preproduction.actif
                  ? `Copie active sur ${siteOuvert.preproduction.hote}, synchronisée le ${siteOuvert.preproduction.derniereSync}. Comparez puis publiez, ou jetez la copie.`
                  : 'Aucune copie active. Cloner la production prend quelques minutes et n’interrompt rien.'}
              </Callout>
            )}
            <Callout ton="info" titre="Le contenu ne s’édite pas ici">
              Pages, articles, produits et thèmes se gèrent dans{' '}
              {TYPE_SITE_LABEL[siteOuvert.type]}, dont l’écosystème est incomparablement plus riche
              que ce que nous pourrions reconstruire.
            </Callout>
          </div>
        )}
      </Drawer>

      {/* Gestion d'une base */}
      <Drawer
        open={baseOuverte !== null}
        onClose={() => setBaseOuverte(null)}
        title={baseOuverte ? `Base ${baseOuverte.nom}` : ''}
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setBaseOuverte(null)}>
            Fermer
          </Button>
        }
      >
        {baseOuverte && (
          <div className="space-y-4">
            <KeyValueList
              items={[
                {
                  cle: 'Moteur',
                  valeur: `${baseOuverte.moteur === 'mariadb' ? 'MariaDB' : 'PostgreSQL'} ${baseOuverte.version}`,
                },
                {
                  cle: 'Taille',
                  valeur:
                    baseOuverte.tailleMo >= 1024
                      ? `${(baseOuverte.tailleMo / 1024).toFixed(2)} Go`
                      : `${baseOuverte.tailleMo} Mo`,
                },
                { cle: 'Jeu de caractères', valeur: baseOuverte.jeuCaracteres },
              ]}
            />
            <div>
              <MicroLabel>Chaîne de connexion depuis le serveur</MicroLabel>
              <CopyField
                className="mt-2"
                value={
                  baseOuverte.moteur === 'mariadb'
                    ? `mysql://${baseOuverte.utilisateurs[0].nom}@localhost/${baseOuverte.nom}`
                    : `postgresql://${baseOuverte.utilisateurs[0].nom}@127.0.0.1:5432/${baseOuverte.nom}`
                }
                mono
              />
              <p className="mt-1.5 text-[11.5px] text-g-500">
                La base n’écoute pas sur l’extérieur. Vos sites l’atteignent en local ; pour un accès
                distant, il faut ouvrir un tunnel SSH.
              </p>
            </div>
            <div>
              <MicroLabel>Utilisateurs</MicroLabel>
              <ul className="mt-2 space-y-1.5">
                {baseOuverte.utilisateurs.map((u) => (
                  <li
                    key={u.nom}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-g-300 px-2.5 py-1.5"
                  >
                    <span className="font-mono text-[12px] font-semibold text-ink">{u.nom}</span>
                    <span className="flex items-center gap-2">
                      <Badge tone={u.droits === 'tous' ? 'violet' : 'neutral'} size="sm">
                        {u.droits === 'tous'
                          ? 'Tous droits'
                          : u.droits === 'lecture'
                            ? 'Lecture seule'
                            : 'Lecture et écriture'}
                      </Badge>
                      <span className="font-mono text-[11px] text-g-500">{u.hote}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" iconBefore={<Download size={13} />}>
                Exporter en SQL
              </Button>
              <Button variant="secondary" size="sm" iconBefore={<KeyRound size={13} />}>
                Ajouter un utilisateur
              </Button>
              <ButtonLink
                href={`https://adminer.${nom}`}
                variant="ghost"
                size="sm"
                iconAfter={<ExternalLink size={12} />}
              >
                Ouvrir dans Adminer
              </ButtonLink>
            </div>
            <Callout ton="info" titre="Pas d’explorateur de tables dans le portail">
              Le portail donne la chaîne de connexion, la taille, les utilisateurs et l’export. Pour
              écrire des requêtes, Adminer ou votre client habituel font mieux.
            </Callout>
          </div>
        )}
      </Drawer>
    </div>
  )
}
