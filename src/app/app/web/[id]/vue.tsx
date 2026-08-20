'use client'

import { useState } from 'react'
import {
  ArrowRightLeft,
  Copy,
  Database,
  Download,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  Terminal,
} from 'lucide-react'
import { cn, seededSeries } from '@/lib/utils'
import { dateCourte, dateHeure, goHumain, num, relatif } from '@/lib/format'
import { HEBERGEMENTS, ZONES_DNS } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { CodeBlock, CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { ConfirmDialog } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { HealthBadge, QuotaBar, StatTile } from '@/components/composition/metrics'
import { GrilleSparkCharts, LogPeek } from '@/components/business/observabilite'
import { useApp } from '@/components/app/contexte'
import type { LigneLog } from '@/lib/types'

const TYPES: Record<string, { nom: string; teinte: string; admin: string }> = {
  wordpress: { nom: 'WordPress', teinte: '#21759B', admin: '/wp-admin' },
  prestashop: { nom: 'PrestaShop', teinte: '#DF0067', admin: '/admin-dba' },
  mutualise: { nom: 'Hébergement mutualisé', teinte: '#6B3FA0', admin: '' },
}

const ONGLETS = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'versions', label: 'Versions & extensions' },
  { id: 'staging', label: 'Pré-production' },
  { id: 'securite', label: 'Sécurité' },
  { id: 'bases', label: 'Bases & accès' },
  { id: 'sauvegardes', label: 'Sauvegardes' },
  { id: 'metriques', label: 'Trafic & performance' },
]

const JOURNAL_WAF: LigneLog[] = [
  { ts: '2026-08-19T15:12:04Z', niveau: 'WARN', source: 'waf', message: 'Règle 942100 (SQLi) — requête bloquée sur /recherche?q=… depuis 41.207.x.x' },
  { ts: '2026-08-19T15:09:41Z', niveau: 'WARN', source: 'waf', message: 'Règle 941110 (XSS) — paramètre commentaire assaini sur /article/218' },
  { ts: '2026-08-19T14:58:02Z', niveau: 'ERROR', source: 'bruteforce', message: 'Blocage IP 197.234.x.x — 24 tentatives de connexion en 60 s' },
  { ts: '2026-08-19T14:41:18Z', niveau: 'INFO', source: 'malware', message: 'Analyse quotidienne terminée — 18 402 fichiers, aucune signature détectée' },
  { ts: '2026-08-19T13:22:55Z', niveau: 'WARN', source: 'waf', message: 'Règle 930110 (traversée de répertoire) — requête bloquée sur /../../etc/passwd' },
  { ts: '2026-08-19T11:04:12Z', niveau: 'INFO', source: 'tls', message: 'Certificat vérifié — valide, chaîne complète, OCSP agrafé' },
  { ts: '2026-08-19T09:38:44Z', niveau: 'WARN', source: 'ratelimit', message: 'Limitation de débit appliquée sur /panier — 120 req/min dépassées' },
]

const EXTENSIONS = [
  { nom: 'Contact Form 7', version: '5.9.8', cible: '6.0.1', securite: true, actif: true },
  { nom: 'Yoast SEO', version: '22.4', cible: '23.1', securite: false, actif: true },
  { nom: 'WP Rocket', version: '3.16.1', cible: '3.16.4', securite: false, actif: true },
  { nom: 'WooCommerce', version: '9.1.2', cible: '9.1.2', securite: false, actif: true },
  { nom: 'Akismet', version: '5.3.2', cible: '5.3.2', securite: false, actif: false },
]

export function VueHebergement({ id }: { id: string }) {
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('apercu')
  const [confirmation, setConfirmation] = useState<'remise' | 'php' | null>(null)

  const h = HEBERGEMENTS.find((x) => x.id === id)!
  const t = TYPES[h.type]
  const zone = ZONES_DNS.find((z) => h.domaine.endsWith(z.domaine))
  const majEnAttente = h.versions?.extensionsAMettreAJour ?? 0

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Hébergement web', href: '/app/web' },
          { label: h.domaine },
        ]}
        titre={<span className="font-mono">{h.domaine}</span>}
        sousTitre={`${t.nom} sur palier ${h.palier} · site hébergé à Abidjan, base de données dans le même rack que le serveur web.`}
        meta={
          <>
            <HealthBadge etat={h.statut} size="sm" />
            <Badge tone="neutral" size="sm">
              PHP {h.runtime.php}
            </Badge>
            {h.versions?.coeur ? (
              <Badge tone="neutral" size="sm">
                {t.nom} {h.versions.coeur}
              </Badge>
            ) : null}
            {h.staging && (
              <Badge tone="violet" size="sm">
                Pré-production disponible
              </Badge>
            )}
          </>
        }
        actions={
          <>
            {t.admin && (
              <ButtonLink
                variant="accent"
                external
                href={`https://${h.domaine}${t.admin}`}
                iconAfter={<ExternalLink size={13} />}
              >
                Ouvrir l’administration
              </ButtonLink>
            )}
            <ButtonLink
              variant="secondary"
              external
              href={`https://${h.domaine}`}
              iconAfter={<ExternalLink size={12} />}
            >
              Voir le site
            </ButtonLink>
          </>
        }
      />

      {majEnAttente > 0 && (
        <Callout ton="warn" titre={`${majEnAttente} mises à jour d’extensions en attente`}>
          Dont une correction de sécurité sur <span className="font-mono text-[12px]">Contact Form 7</span>{' '}
          (CVE-2026-3812, injection de code via le champ de téléversement). Nous ne mettons pas à jour
          les extensions de notre initiative : une extension cassée, c’est votre site qui tombe. Passez
          par la pré-production, puis remettez en production.
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          libelle="Espace disque"
          valeur={goHumain(h.espaceUtiliseGo)}
          detail={`sur ${goHumain(h.espaceTotalGo)}`}
          ton={h.espaceUtiliseGo / h.espaceTotalGo > 0.8 ? 'warn' : 'violet'}
        />
        <StatTile
          libelle="Visites 24 h"
          valeur={num(seededSeries(`visites-${h.id}`, 1, 1800, 9400)[0])}
          serie={seededSeries(`visites24-${h.id}`, 24, 40, 480)}
        />
        <StatTile
          libelle="Temps de réponse médian"
          valeur={`${seededSeries(`ttfb-${h.id}`, 1, 120, 380)[0]} ms`}
          ton="ok"
          serie={seededSeries(`ttfb24-${h.id}`, 24, 90, 420)}
        />
        <StatTile
          libelle="Requêtes bloquées 24 h"
          valeur={num(seededSeries(`waf-${h.id}`, 1, 240, 1600)[0])}
          ton={h.securite.waf ? 'ok' : 'warn'}
          detail={h.securite.waf ? 'Par le pare-feu applicatif' : 'Pare-feu inactif'}
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'apercu' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader titre="Caractéristiques" />
            <KeyValueList
              colonnes={1}
              items={[
                { cle: 'Solution', valeur: `${t.nom}${h.versions?.coeur ? ` ${h.versions?.coeur}` : ''}` },
                { cle: 'Palier', valeur: h.palier },
                {
                  cle: 'Environnement d’exécution',
                  valeur: `PHP ${h.runtime.php}${h.runtime.node ? ` · Node ${h.runtime.node}` : ''}`,
                },
                { cle: 'Bases de données', valeur: `${h.bases} base${h.bases > 1 ? 's' : ''} MariaDB 11.4` },
                { cle: 'Site physique', valeur: 'Abidjan · ABJ-1' },
                {
                  cle: 'Certificat TLS',
                  valeur: `Let’s Encrypt, expire le ${dateCourte(h.certificat.expire)}${h.certificat.auto ? ' — renouvellement automatique' : ''}`,
                },
                { cle: 'Zone DNS', valeur: zone ? zone.domaine : 'Externe à la plateforme' },
                {
                  cle: 'Sauvegardes',
                  valeur: 'Quotidiennes, conservation 30 jours, copie hors site à Grand-Bassam',
                },
              ]}
            />
            <div className="mt-4 space-y-2 border-t border-g-100 pt-4">
              <QuotaBar
                libelle="Espace disque"
                utilise={h.espaceUtiliseGo}
                total={h.espaceTotalGo}
                seuil={80}
                formateur={(v) => goHumain(v)}
              />
              <QuotaBar
                libelle="Trafic mensuel sortant"
                utilise={148}
                total={500}
                unite="Go"
                seuil={85}
              />
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader
                titre="Accès techniques"
                sousTitre="SFTP et SSH sont limités à votre espace disque, sans accès aux autres sites."
              />
              <div className="space-y-3">
                <CopyField label="Hôte SFTP / SSH" value={`sftp.abj.synelia.cloud`} />
                <CopyField label="Identifiant" value={`${h.id}-dba`} />
                <CopyField label="Chemin racine" value={`/home/${h.id}-dba/www`} />
              </div>
              <MicroLabel className="mt-4 mb-2">Depuis un terminal</MicroLabel>
              <CodeBlock
                langue="bash"
                code={`ssh ${h.id}-dba@sftp.abj.synelia.cloud
# clé publique à déposer depuis l'onglet Sécurité — pas de mot de passe`}
              />
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button size="sm" variant="secondary" iconBefore={<Terminal size={12} />}>
                  Terminal web
                </Button>
                <Button size="sm" variant="ghost" iconBefore={<Download size={12} />}>
                  Télécharger la configuration SFTP
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeader titre="Domaines rattachés" />
              <div className="space-y-2">
                {[
                  { d: h.domaine, principal: true, tls: true },
                  { d: `www.${h.domaine}`, principal: false, tls: true },
                ].map((x) => (
                  <div
                    key={x.d}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2"
                  >
                    <span className="font-mono text-[12px] text-ink">{x.d}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {x.principal && (
                        <Badge tone="violet" size="sm">
                          Principal
                        </Badge>
                      )}
                      <Badge tone="ok" size="sm">
                        TLS actif
                      </Badge>
                    </span>
                  </div>
                ))}
              </div>
              <ButtonLink size="sm" variant="ghost" className="mt-2.5" href="/app/domaines">
                Gérer les domaines et la zone DNS
              </ButtonLink>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'versions' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Version du cœur"
              sousTitre="Nous appliquons les correctifs de sécurité du cœur automatiquement, après snapshot. Les versions majeures restent votre décision."
            />
            <div className="space-y-3.5">
              <Switch
                checked={h.versions?.majAuto ?? false}
                label="Appliquer automatiquement les correctifs de sécurité du cœur"
                description="Snapshot avant, vérification du démarrage après, retour arrière automatique si le site ne répond plus. C’est la seule mise à jour que nous faisons sans vous demander."
              />
              <Switch
                checked={false}
                label="Appliquer automatiquement les versions majeures"
                description="Déconseillé sur un site en production avec des extensions tierces : une version majeure change des interfaces internes, et une extension non maintenue peut cesser de fonctionner."
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-p-300 bg-p-050 px-3 py-2.5">
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-ink">
                  {t.nom} {h.versions?.coeur} — version installée
                </span>
                <span className="block text-[11.5px] text-g-500">
                  Dernière version disponible : {h.type === 'wordpress' ? '6.6.2' : '8.2.0'} · dernier
                  correctif appliqué le {dateCourte('2026-08-19')}
                </span>
              </span>
              <Badge tone="ok" size="sm">
                À jour
              </Badge>
            </div>
          </Card>

          <Card>
            <CardHeader
              titre="Environnement d’exécution"
              sousTitre="Changer de version de PHP redémarre le moteur. Comptez quelques secondes d’indisponibilité."
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Version de PHP" hint="8.1 est en fin de support de sécurité">
                <Select defaultValue={h.runtime.php}>
                  <option value="8.1">PHP 8.1 (fin de support décembre 2026)</option>
                  <option value="8.2">PHP 8.2</option>
                  <option value="8.3">PHP 8.3 (recommandé)</option>
                  <option value="8.4">PHP 8.4</option>
                </Select>
              </Field>
              <Field label="Mémoire par processus">
                <Select defaultValue="256">
                  <option value="128">128 Mo</option>
                  <option value="256">256 Mo</option>
                  <option value="512">512 Mo</option>
                </Select>
              </Field>
              <Field label="Durée maximale d’exécution" hint="secondes">
                <Input type="number" defaultValue={60} />
              </Field>
            </div>
            <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
              <Button className="mt-3.5" variant="secondary" onClick={() => setConfirmation('php')}>
                Appliquer
              </Button>
            </GatedAction>
            {h.runtime.php === '8.1' && (
              <Callout ton="warn" className="mt-4" titre="PHP 8.1 arrive en fin de support">
                Après décembre 2026, plus aucun correctif de sécurité ne sera publié pour cette
                version. Testez PHP 8.3 en pré-production : dans la grande majorité des cas, la
                migration ne demande aucune modification de code.
              </Callout>
            )}
          </Card>

          {h.type === 'wordpress' && (
            <Card padding={false}>
              <div className="border-b border-g-100 px-4 py-3.5">
                <CardHeader
                  titre="Extensions"
                  sousTitre="Nous listons l’état ; la mise à jour se déclenche depuis la pré-production, jamais directement en production."
                  className="mb-0"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse">
                  <thead>
                    <tr className="border-b border-g-300 bg-g-050">
                      {['Extension', 'Installée', 'Disponible', 'État', ''].map((x) => (
                        <th
                          key={x}
                          className="type-micro px-3 py-2 text-left font-semibold text-g-500"
                        >
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {EXTENSIONS.map((e) => (
                      <tr key={e.nom} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-2">
                            <span className="text-[12.5px] font-semibold text-ink">{e.nom}</span>
                            {!e.actif && (
                              <Badge tone="neutral" size="sm">
                                Désactivée
                              </Badge>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11.5px] text-g-700">{e.version}</td>
                        <td className="px-3 py-2.5 font-mono text-[11.5px] text-g-700">{e.cible}</td>
                        <td className="px-3 py-2.5">
                          {e.version === e.cible ? (
                            <Badge tone="ok" size="sm">
                              À jour
                            </Badge>
                          ) : e.securite ? (
                            <Badge tone="err" dot size="sm">
                              Correction de sécurité
                            </Badge>
                          ) : (
                            <Badge tone="warn" size="sm">
                              Mise à jour disponible
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={e.version === e.cible}
                            onClick={() => {
                              setOnglet('staging')
                              pousser({
                                ton: 'info',
                                titre: `${e.nom} sera testée en pré-production`,
                                detail: 'Clonez le site, appliquez la mise à jour, vérifiez, puis remettez en production.',
                              })
                            }}
                          >
                            Tester en pré-production
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {onglet === 'staging' && (
        <div className="space-y-4">
          {!h.staging ? (
            <Card>
              <CardHeader
                titre="Pré-production non incluse"
                sousTitre={`Le palier ${h.palier} n’inclut pas d’environnement de pré-production.`}
              />
              <Callout ton="info" titre="Pourquoi c’est utile">
                Sans pré-production, chaque mise à jour d’extension est un pari fait en direct sur le
                site que vos visiteurs consultent. Avec, vous clonez, vous testez, et vous ne
                remettez en production que ce qui fonctionne. Le palier Business l’inclut.
              </Callout>
              <ButtonLink className="mt-3.5" variant="secondary" href="/app/marketplace">
                Comparer les paliers
              </ButtonLink>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader
                  titre="Environnement de pré-production"
                  sousTitre="Une copie isolée du site : fichiers, base, configuration. Elle n’est pas indexée et exige un mot de passe."
                  actions={
                    <ButtonLink
                      size="sm"
                      variant="secondary"
                      external
                      href={`https://staging-${h.id}.synelia.cloud`}
                      iconAfter={<ExternalLink size={12} />}
                    >
                      Ouvrir la pré-production
                    </ButtonLink>
                  }
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatTile libelle="Dernier clonage" valeur="il y a 2 j" detail={dateCourte('2026-08-17')} />
                  <StatTile libelle="Écarts de fichiers" valeur={18} detail="Depuis le clonage" ton="warn" />
                  <StatTile libelle="Écarts en base" valeur={4} detail="Tables modifiées" ton="warn" />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-g-100 pt-4">
                  <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
                    <Button
                      variant="secondary"
                      iconBefore={<Copy size={13} />}
                      onClick={() =>
                        pousser({
                          ton: 'info',
                          titre: 'Clonage lancé',
                          detail: 'La copie prend deux à trois minutes selon la taille de la base. Le site en production n’est pas affecté.',
                        })
                      }
                    >
                      Cloner la production vers la pré-production
                    </Button>
                  </GatedAction>
                  <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
                    <Button
                      iconBefore={<ArrowRightLeft size={13} />}
                      onClick={() => setConfirmation('remise')}
                    >
                      Remettre en production
                    </Button>
                  </GatedAction>
                </div>
                <Callout ton="violet" className="mt-4" titre="La remise en production est réversible">
                  Un snapshot complet du site en production est pris juste avant la bascule. Si
                  quelque chose ne va pas, le retour arrière est immédiat et ne demande rien d’autre
                  qu’un clic. C’est ce filet qui rend l’opération tenable un vendredi soir.
                </Callout>
              </Card>

              <Card>
                <CardHeader
                  titre="Écarts détectés"
                  sousTitre="Ce qui sera copié de la pré-production vers la production."
                />
                <div className="space-y-2">
                  {[
                    { quoi: 'wp-content/plugins/contact-form-7/', type: 'Fichiers', detail: '142 fichiers modifiés — mise à jour 5.9.8 → 6.0.1', ton: 'ok' as const },
                    { quoi: 'wp-content/themes/dba-2026/style.css', type: 'Fichiers', detail: '1 fichier modifié — ajustements de mise en page', ton: 'ok' as const },
                    { quoi: 'wp_options', type: 'Base', detail: '6 lignes — configuration de l’extension', ton: 'ok' as const },
                    { quoi: 'wp_posts', type: 'Base', detail: '128 lignes en production absentes de la pré-production — articles publiés depuis le clonage', ton: 'warn' as const },
                  ].map((d) => (
                    <div
                      key={d.quoi}
                      className={cn(
                        'flex flex-wrap items-start justify-between gap-3 rounded-[6px] border px-3 py-2.5',
                        d.ton === 'warn' ? 'border-warn/40 bg-warn-bg' : 'border-g-300',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block font-mono text-[12px] font-semibold text-ink">
                          {d.quoi}
                        </span>
                        <span className="block text-[11.5px] text-g-500">{d.detail}</span>
                      </span>
                      <Badge tone={d.type === 'Base' ? 'violet' : 'neutral'} size="sm">
                        {d.type}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Callout ton="warn" className="mt-4" titre="Attention aux contenus publiés depuis le clonage">
                  128 articles ont été publiés en production depuis le clonage. Une remise en
                  production complète les écraserait. Ne remettez que les fichiers, en décochant la
                  base, ou re-clonez d’abord puis réappliquez votre mise à jour.
                </Callout>
                <div className="mt-3.5 space-y-3">
                  <Switch checked label="Copier les fichiers" />
                  <Switch checked={false} label="Copier la base de données" description="Décoché : les contenus publiés en production sont préservés." />
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {onglet === 'securite' && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader titre="Protections actives" />
              <div className="space-y-3.5">
                <Switch
                  checked={h.securite.waf}
                  label="Pare-feu applicatif"
                  description="Filtre les requêtes avant qu’elles n’atteignent le moteur : injections SQL, scripts intersites, traversées de répertoire. Jeu de règles OWASP mis à jour en continu."
                />
                <Switch
                  checked={h.securite.scanMalware}
                  label="Analyse antimalware quotidienne"
                  description="Comparaison des empreintes de fichiers avec la version officielle du cœur et des extensions. Toute divergence est signalée, jamais supprimée automatiquement."
                />
                <Switch
                  checked={h.securite.bruteForce ?? false}
                  label="Protection contre les attaques par force brute"
                  description="Blocage progressif d’une adresse après plusieurs échecs de connexion. Vos propres adresses de bureau peuvent être exemptées."
                />
                <Switch
                  checked
                  label="Redirection HTTPS obligatoire"
                  description="Toute requête HTTP est redirigée en 301. L’en-tête HSTS est envoyé avec une durée d’un an."
                />
                <Switch
                  checked={false}
                  label="Bloquer l’accès à l’administration hors de vos adresses"
                  description="Restreint /wp-admin et /wp-login.php à une liste d’adresses. Très efficace, mais bloque aussi vos accès en déplacement."
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                titre="Certificat TLS"
                sousTitre="Émis et renouvelé automatiquement, sans intervention."
              />
              <KeyValueList
                colonnes={1}
                items={[
                  { cle: 'Autorité', valeur: 'Let’s Encrypt' },
                  { cle: 'Domaines couverts', valeur: `${h.domaine}, www.${h.domaine}` },
                  { cle: 'Expire le', valeur: dateCourte(h.certificat.expire) },
                  {
                    cle: 'Renouvellement',
                    valeur: h.certificat.auto
                      ? 'Automatique, 30 jours avant l’échéance'
                      : 'Manuel — pensez à le renouveler',
                  },
                  { cle: 'Protocoles', valeur: 'TLS 1.2 et 1.3 · TLS 1.0/1.1 refusés' },
                  { cle: 'Agrafage OCSP', valeur: 'Actif' },
                  { cle: 'Enregistrement CAA', valeur: zone?.dnssec ? 'Présent, limité à Let’s Encrypt' : 'Absent' },
                ]}
              />
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-g-100 pt-4">
                <Button size="sm" variant="secondary" iconBefore={<RefreshCw size={12} />}>
                  Forcer le renouvellement
                </Button>
                <Button size="sm" variant="ghost">
                  Importer un certificat existant
                </Button>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              titre="Journal de sécurité"
              sousTitre="Vingt dernières lignes. Le journal complet est interrogeable dans le moteur de recherche."
              actions={
                <Badge tone={h.securite.waf ? 'ok' : 'warn'} size="sm">
                  {h.securite.waf ? 'Pare-feu actif' : 'Pare-feu inactif'}
                </Badge>
              }
            />
            <LogPeek
              lignes={JOURNAL_WAF}
              max={20}
              titre={`${h.domaine} · pare-feu applicatif`}
              hrefSortie="https://logs.synelia.cloud/select/vmui"
            />
            {!h.securite.waf && (
              <Callout ton="warn" className="mt-4" titre="Ce site n’a pas de pare-feu applicatif">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldAlert size={13} />
                  Les requêtes arrivent directement au moteur PHP. Sur un site public avec un
                  formulaire, c’est la première protection à activer — elle est incluse dans votre
                  palier.
                </span>
              </Callout>
            )}
          </Card>
        </div>
      )}

      {onglet === 'bases' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Bases de données"
              sousTitre="Hébergées dans le même rack que le serveur web : la latence entre les deux se compte en dizaines de microsecondes."
            />
            <div className="space-y-2">
              {Array.from({ length: h.bases }, (_, i) => (
                <div
                  key={i}
                  className="rounded-[6px] border border-g-300 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <Database size={13} className="shrink-0 text-p-700" />
                      <span className="font-mono text-[12.5px] font-semibold text-ink">
                        {h.id.replace('-', '_')}_{i === 0 ? 'main' : `aux${i}`}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <Badge tone="neutral" size="sm">
                        MariaDB 11.4
                      </Badge>
                      <Badge tone="neutral" size="sm">
                        {goHumain(i === 0 ? 4.2 : 0.8)}
                      </Badge>
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-2">
                    <CopyField label="Hôte" value={`db-${h.id}.abj.synelia.cloud`} />
                    <CopyField
                      label="Chaîne de connexion"
                      masque
                      value={`mysql://${h.id}:••••••••@db-${h.id}.abj.synelia.cloud:3306/${h.id.replace('-', '_')}_${i === 0 ? 'main' : `aux${i}`}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <ButtonLink
                size="sm"
                variant="secondary"
                external
                href="https://pma.abj.synelia.cloud"
                iconAfter={<ExternalLink size={12} />}
              >
                Ouvrir l’administration de la base
              </ButtonLink>
              <Button size="sm" variant="ghost" iconBefore={<Download size={12} />}>
                Exporter un vidage SQL
              </Button>
            </div>
            <Callout ton="info" className="mt-4" titre="Nous n’avons pas refait phpMyAdmin">
              Parcourir des tables, écrire du SQL, importer un vidage : l’outil existe, il est
              installé, et il fait très bien son travail. Nous vous y menons authentifié.
            </Callout>
          </Card>

          <Card>
            <CardHeader
              titre="Clés SSH autorisées"
              sousTitre="Aucun mot de passe SSH : seules les clés publiques déposées ici ouvrent un accès."
            />
            <div className="space-y-2">
              {[
                { nom: 'poste-l.konan', empreinte: 'SHA256:8f2a91c4d7b0e5443a17c96e2f0d8b41', ajoutee: '2025-11-04', dernier: '2026-08-19T09:12:00Z' },
                { nom: 'runner-forge-01', empreinte: 'SHA256:1b74e0aa93c04d2f6b18e5f0a2c7d941', ajoutee: '2026-06-02', dernier: '2026-08-18T22:04:00Z' },
              ].map((k) => (
                <div key={k.nom} className="rounded-[6px] border border-g-300 px-3 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[12.5px] font-semibold text-ink">{k.nom}</span>
                    <Button size="sm" variant="ghost">
                      Révoquer
                    </Button>
                  </div>
                  <p className="mt-0.5 break-all font-mono text-[10.5px] text-g-500">{k.empreinte}</p>
                  <p className="mt-0.5 text-[11px] text-g-500">
                    Ajoutée le {dateCourte(k.ajoutee)} · dernier accès {relatif(k.dernier)}
                  </p>
                </div>
              ))}
            </div>
            <Field className="mt-3.5" label="Ajouter une clé publique" hint="format OpenSSH — commence par ssh-ed25519 ou ssh-rsa">
              <Input placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI… nom@poste" />
            </Field>
            <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
              <Button size="sm" className="mt-2.5" variant="secondary">
                Autoriser cette clé
              </Button>
            </GatedAction>
          </Card>
        </div>
      )}

      {onglet === 'sauvegardes' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <StatTile libelle="Dernière sauvegarde" valeur="il y a 12 h" detail={dateHeure('2026-08-19T03:00:00Z')} ton="ok" />
            <StatTile libelle="Points de restauration" valeur={30} detail="Conservation 30 jours" />
            <StatTile libelle="Copie hors site" valeur="Grand-Bassam" ton="ok" detail="À 42 km d’Abidjan" />
            <StatTile libelle="Dernier test de restauration" valeur="9 août" ton="ok" detail="Réussi en 8 min" />
          </div>

          <Card padding={false}>
            <div className="border-b border-g-100 px-4 py-3.5">
              <CardHeader
                titre="Points de restauration"
                sousTitre="Fichiers et base sont sauvegardés ensemble : restaurer les deux garantit un site cohérent."
                className="mb-0"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Date', 'Type', 'Taille', 'Contenu', 'Vérifié', ''].map((x) => (
                      <th key={x} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { d: '2026-08-19T03:00:00Z', t: 'Complète', taille: 32.6, verif: true },
                    { d: '2026-08-18T03:00:00Z', t: 'Incrémentale', taille: 1.2, verif: true },
                    { d: '2026-08-17T03:00:00Z', t: 'Incrémentale', taille: 0.8, verif: true },
                    { d: '2026-08-16T03:00:00Z', t: 'Incrémentale', taille: 2.4, verif: true },
                    { d: '2026-08-12T03:00:00Z', t: 'Complète', taille: 31.9, verif: true },
                    { d: '2026-08-05T03:00:00Z', t: 'Complète', taille: 30.4, verif: true },
                  ].map((p) => (
                    <tr key={p.d} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5">
                        <span className="block text-[12px] text-ink">{dateHeure(p.d)}</span>
                        <span className="block text-[10.5px] text-g-500">{relatif(p.d)}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={p.t === 'Complète' ? 'violet' : 'neutral'} size="sm">
                          {p.t}
                        </Badge>
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12px] text-g-700">{goHumain(p.taille)}</td>
                      <td className="px-3 py-2.5 text-[11.5px] text-g-700">Fichiers + base</td>
                      <td className="px-3 py-2.5">
                        <Badge tone="ok" size="sm">
                          Intégrité vérifiée
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="ghost" iconBefore={<Download size={12} />}>
                            Télécharger
                          </Button>
                          <GatedAction
                            autorise={autorise('backup.restore')}
                            message={refus('backup.restore')}
                          >
                            <Button size="sm" variant="secondary">
                              Restaurer
                            </Button>
                          </GatedAction>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Callout ton="violet" titre="Restaurer dans la pré-production plutôt qu’en production">
            Sur une suppression accidentelle, la manœuvre la plus sûre est de restaurer le point de
            reprise dans la pré-production, d’y récupérer ce qui manque, puis de le remettre en
            production. Vous récupérez ce qui a été perdu sans annuler ce qui a été fait entre-temps.
          </Callout>
        </div>
      )}

      {onglet === 'metriques' && (
        <div className="space-y-4">
          <GrilleSparkCharts
            seed={`web-${h.id}`}
            metriques={[
              { titre: 'Visites', unite: '', min: 40, max: 480 },
              { titre: 'Temps de réponse', unite: 'ms', min: 90, max: 420, seuil: 800 },
              { titre: 'Trafic sortant', unite: 'Mo/s', min: 0.4, max: 6.2, couleur: 'var(--color-m-600)' },
              { titre: 'Erreurs 5xx', unite: '', min: 0, max: 4, seuil: 5, couleur: 'var(--color-err)' },
            ]}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader titre="Pages les plus consultées" sousTitre="Sur les dernières 24 heures." />
              <div className="space-y-1.5">
                {[
                  { p: '/', v: 3842, ms: 118 },
                  { p: '/produits', v: 2104, ms: 284 },
                  { p: '/produits/categorie/textile', v: 1288, ms: 342 },
                  { p: '/panier', v: 806, ms: 196 },
                  { p: '/contact', v: 412, ms: 104 },
                ].map((x) => (
                  <div key={x.p} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate font-mono text-[11.5px] text-ink">
                      {x.p}
                    </span>
                    <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-g-100">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full bg-p-600"
                        style={{ width: `${(x.v / 3842) * 100}%` }}
                      />
                    </span>
                    <span className="tnum w-14 shrink-0 text-right text-[11.5px] text-g-700">
                      {num(x.v)}
                    </span>
                    <span
                      className={cn(
                        'tnum w-14 shrink-0 text-right text-[11.5px]',
                        x.ms > 300 ? 'text-warn' : 'text-g-500',
                      )}
                    >
                      {x.ms} ms
                    </span>
                  </div>
                ))}
              </div>
              <ButtonLink
                size="sm"
                variant="ghost"
                external
                className="mt-3"
                href="https://matomo.synelia.cloud"
                iconAfter={<ExternalLink size={11} />}
              >
                Ouvrir l’analyse d’audience complète
              </ButtonLink>
            </Card>

            <Card>
              <CardHeader
                titre="Ce qui ralentit ce site"
                sousTitre="Constats issus des mesures, pas de recommandations génériques."
              />
              <div className="space-y-2.5">
                {[
                  {
                    t: 'Le cache de pages est désactivé',
                    d: 'Chaque visite reconstruit la page côté PHP. Sur /produits, cela représente 240 ms des 284 ms mesurées. Activer le cache ramènerait la page sous 40 ms pour un visiteur non connecté.',
                    ton: 'warn' as const,
                  },
                  {
                    t: '18 requêtes SQL sur la page d’accueil',
                    d: 'Dont 12 identiques, répétées par une extension. C’est le comportement classique d’un widget mal implémenté.',
                    ton: 'warn' as const,
                  },
                  {
                    t: 'Les images ne sont pas servies en WebP',
                    d: '4,2 Mo d’images JPEG sur la page d’accueil. La conversion automatique est disponible dans votre palier et ferait gagner environ 2,6 Mo.',
                    ton: 'info' as const,
                  },
                ].map((x) => (
                  <div
                    key={x.t}
                    className={cn(
                      'rounded-[6px] border px-3 py-2.5',
                      x.ton === 'warn' ? 'border-warn/40 bg-warn-bg' : 'border-info/40 bg-info-bg',
                    )}
                  >
                    <p className="text-[12.5px] font-semibold text-ink">{x.t}</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-700">{x.d}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmation === 'remise'}
        onClose={() => setConfirmation(null)}
        titre="Remettre la pré-production en production"
        ressource={h.domaine}
        libelleAction="Remettre en production"
        pertes={[
          'Les fichiers de production divergents sont remplacés par ceux de la pré-production',
          'Le site est momentanément en mode maintenance (environ 40 secondes)',
          'Les contenus publiés depuis le clonage restent en place si la base n’est pas copiée',
        ]}
        onConfirm={() => {
          pousser({
            ton: 'ok',
            titre: 'Remise en production effectuée',
            detail: 'Snapshot pris avant la bascule — le retour arrière reste possible pendant sept jours.',
          })
          setConfirmation(null)
        }}
      />

      <ConfirmDialog
        open={confirmation === 'php'}
        onClose={() => setConfirmation(null)}
        titre="Changer la version de PHP"
        ressource={h.domaine}
        libelleAction="Appliquer et redémarrer"
        pertes={[
          'Le moteur PHP redémarre — quelques secondes d’indisponibilité',
          'Une extension incompatible peut provoquer une erreur 500 immédiate',
          'Le retour à la version précédente est possible, mais demande un second redémarrage',
        ]}
        onConfirm={() => {
          pousser({
            ton: 'ok',
            titre: 'Version de PHP appliquée',
            detail: 'Le moteur a redémarré et le site répond en 200. Surveillez les journaux dans les prochaines minutes.',
          })
          setConfirmation(null)
        }}
      />
    </div>
  )
}
