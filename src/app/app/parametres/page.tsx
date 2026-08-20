'use client'

import { useState } from 'react'
import { Building2, Globe, Palette, Terminal, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateCourte, money } from '@/lib/format'
import { ESPACES, MES_ORGANISATIONS, ORG_COURANTE, RESELLERS } from '@/lib/mock'
import { ROLE_LABEL, SITE_LABEL } from '@/lib/types'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { CodeBlock, CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/field'
import { ConfirmDialog } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { useApp } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'organisation', label: 'Organisation' },
  { id: 'preferences', label: 'Préférences' },
  { id: 'api', label: 'Accès programmatique' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'fermeture', label: 'Réversibilité' },
]

export default function Parametres() {
  const { autorise, refus, pousser } = useApp()
  const [onglet, setOnglet] = useState('organisation')
  const [fermeture, setFermeture] = useState(false)

  const reseller = RESELLERS.find((r) => r.clientsFinaux.includes(ORG_COURANTE.id))

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Paramètres' }]}
        titre="Paramètres de l’organisation"
        sousTitre="Identité de l’organisation, préférences d’affichage, accès programmatique, notifications, et les moyens de partir avec vos données si vous le décidez."
        meta={
          <>
            <Badge tone="neutral" size="sm">
              {ORG_COURANTE.nom}
            </Badge>
            <Badge tone="neutral" size="sm">
              Cliente depuis {dateCourte(ORG_COURANTE.createdAt)}
            </Badge>
            <Badge tone={ORG_COURANTE.statut === 'active' ? 'ok' : 'warn'} dot size="sm">
              {ORG_COURANTE.statut === 'active' ? 'Active' : ORG_COURANTE.statut}
            </Badge>
          </>
        }
      />

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'organisation' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Identité"
              sousTitre="Ces informations figurent sur vos factures et vos contrats. Un changement de raison sociale exige un justificatif."
            />
            <div className="space-y-4">
              <Field label="Raison sociale">
                <Input defaultValue={ORG_COURANTE.nom} />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Pays">
                  <Select defaultValue={ORG_COURANTE.pays}>
                    <option value="Côte d’Ivoire">Côte d’Ivoire</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Bénin">Bénin</option>
                    <option value="Togo">Togo</option>
                    <option value="Burkina Faso">Burkina Faso</option>
                    <option value="France">France</option>
                  </Select>
                </Field>
                <Field label="Secteur">
                  <Input defaultValue={ORG_COURANTE.secteur ?? ''} />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Numéro de contribuable" hint="figure sur la facture, sert au régime de TVA">
                  <Input defaultValue={ORG_COURANTE.tva ?? ''} />
                </Field>
                <Field label="Domaine principal" hint="utilisé pour la découverte de la fédération d’identité">
                  <Input defaultValue={ORG_COURANTE.domaine ?? 'dba.africa'} />
                </Field>
              </div>
              <Field label="Adresse de facturation">
                <Textarea rows={3} defaultValue={'Plateau, Boulevard de la République\nImmeuble Alpha 2000, 8e étage\nAbidjan, Côte d’Ivoire'} />
              </Field>
            </div>
            <GatedAction autorise={autorise('sso.configure')} message={refus('sso.configure')}>
              <Button
                className="mt-4"
                onClick={() =>
                  pousser({
                    ton: 'ok',
                    titre: 'Informations enregistrées',
                    detail: 'Elles seront reprises sur votre prochaine facture.',
                  })
                }
              >
                Enregistrer
              </Button>
            </GatedAction>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader titre="Situation contractuelle" />
              <KeyValueList
                colonnes={1}
                items={[
                  { cle: 'Identifiant d’organisation', valeur: ORG_COURANTE.id },
                  {
                    cle: 'Type',
                    valeur:
                      ORG_COURANTE.type === 'direct'
                        ? 'Client direct'
                        : ORG_COURANTE.type === 'client_revendeur'
                          ? 'Client d’un revendeur'
                          : 'Revendeur',
                  },
                  {
                    cle: 'Contrat',
                    valeur: reseller
                      ? `Via ${reseller.nom}, revendeur agréé`
                      : 'Direct avec Synelia Cloud',
                  },
                  { cle: 'Plan de service', valeur: ORG_COURANTE.tenantPlan ?? 'Standard' },
                  { cle: 'Espaces Cloud', valeur: String(ESPACES.length) },
                  { cle: 'Cliente depuis', valeur: dateCourte(ORG_COURANTE.createdAt) },
                  {
                    cle: 'Dépense mensuelle',
                    valeur: ORG_COURANTE.caMensuel ? money(ORG_COURANTE.caMensuel) : '—',
                  },
                ]}
              />
              {reseller && (
                <Callout ton="info" className="mt-4" titre={`Votre contrat passe par ${reseller.nom}`}>
                  Votre facturation, votre support de premier niveau et votre relation commerciale sont
                  assurés par ce revendeur. Nous exploitons la plateforme ; votre interlocuteur reste
                  votre revendeur. En cas de manquement de sa part, vous pouvez nous saisir directement.
                </Callout>
              )}
            </Card>

            <Card>
              <CardHeader titre="Organisations auxquelles vous appartenez" sousTitre="Basculez sans vous reconnecter." />
              <div className="space-y-2">
                {MES_ORGANISATIONS.map(({ org, role }) => (
                  <div
                    key={org.id}
                    className={cn(
                      'flex flex-wrap items-center justify-between gap-3 rounded-[6px] border px-3 py-2.5',
                      org.id === ORG_COURANTE.id ? 'border-p-700 bg-p-050' : 'border-g-300',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Building2 size={13} className="shrink-0 text-p-700" />
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-semibold text-ink">
                          {org.nom}
                        </span>
                        <span className="block text-[11px] text-g-500">{ROLE_LABEL[role]}</span>
                      </span>
                    </span>
                    {org.id === ORG_COURANTE.id ? (
                      <Badge tone="violet" size="sm">
                        Organisation active
                      </Badge>
                    ) : (
                      <Button size="sm" variant="ghost">
                        Basculer
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <ButtonLink size="sm" variant="ghost" className="mt-3" href="/select-organisation">
                Voir le sélecteur complet
              </ButtonLink>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'preferences' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Affichage et régionalisation"
              sousTitre="Ces réglages s’appliquent à toute l’organisation. Chaque membre peut les surcharger dans son profil."
            />
            <div className="space-y-4">
              <Field label="Devise d’affichage" hint="la facturation reste dans la devise contractuelle">
                <Select defaultValue="XOF">
                  <option value="XOF">Franc CFA (FCFA) — devise contractuelle</option>
                  <option value="EUR">Euro (€) — conversion indicative</option>
                  <option value="USD">Dollar américain ($) — conversion indicative</option>
                </Select>
              </Field>
              <Field label="Langue">
                <Select defaultValue="fr">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </Select>
              </Field>
              <Field label="Fuseau horaire" hint="tous les horodatages du portail y sont convertis">
                <Select defaultValue="Africa/Abidjan">
                  <option value="Africa/Abidjan">Abidjan (GMT)</option>
                  <option value="Africa/Dakar">Dakar (GMT)</option>
                  <option value="Africa/Lagos">Lagos (GMT+1)</option>
                  <option value="Europe/Paris">Paris (GMT+1 / GMT+2)</option>
                  <option value="UTC">Temps universel coordonné</option>
                </Select>
              </Field>
              <Field label="Site physique par défaut" hint="proposé en premier à la création d’une ressource">
                <Select defaultValue="ABJ">
                  <option value="ABJ">{SITE_LABEL['ABJ']}</option>
                  <option value="GBM">{SITE_LABEL['GBM']}</option>
                </Select>
              </Field>
              <div className="space-y-3">
                <Switch
                  checked
                  label="Afficher le site physique sur chaque ressource"
                  description="Non désactivable. Savoir où tourne une ressource fait partie de ce que nous vous devons."
                />
                <Switch
                  checked
                  label="Afficher les montants hors taxes"
                  description="La TVA de 18 % est détaillée séparément dans chaque aperçu de coût."
                />
                <Switch checked={false} label="Densité compacte des tableaux par défaut" />
              </div>
            </div>
            <Button className="mt-4" variant="secondary">
              Enregistrer les préférences
            </Button>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader
                titre="Étiquettes de répartition"
                sousTitre="Les étiquettes servent à ventiler la dépense par service, projet ou client. Sans elles, la refacturation interne devient un exercice d’archéologie."
              />
              <div className="space-y-2">
                {[
                  { cle: 'centre-de-cout', valeurs: ['DSI', 'Marketing', 'Production', 'R&D'], obligatoire: true },
                  { cle: 'projet', valeurs: ['refonte-2026', 'boutique', 'analytics'], obligatoire: false },
                  { cle: 'environnement', valeurs: ['production', 'preproduction', 'developpement'], obligatoire: true },
                  { cle: 'responsable', valeurs: ['l.konan', 'k.toure', 'm.diallo'], obligatoire: false },
                ].map((t) => (
                  <div key={t.cle} className="rounded-[6px] border border-g-300 px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[12px] font-semibold text-ink">{t.cle}</span>
                      <span className="flex items-center gap-1.5">
                        {t.obligatoire && (
                          <Badge tone="violet" size="sm">
                            Obligatoire
                          </Badge>
                        )}
                        <Button size="sm" variant="ghost">
                          Modifier
                        </Button>
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {t.valeurs.map((v) => (
                        <Badge key={v} tone="neutral" size="sm">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Callout ton="info" className="mt-4" titre="Rendre une étiquette obligatoire">
                Une étiquette obligatoire bloque la création d’une ressource qui ne la porte pas. C’est
                contraignant sur le moment, et c’est ce qui rend la ventilation de la facture
                exploitable six mois plus tard.
              </Callout>
              <ButtonLink size="sm" variant="ghost" className="mt-3" href="/app/facturation">
                Voir la ventilation de la dépense
              </ButtonLink>
            </Card>

            <Card>
              <CardHeader
                titre="Personnalisation visuelle"
                sousTitre="Logo et couleur affichés dans votre espace client."
                actions={<Palette size={15} className="text-p-700" />}
              />
              <div className="space-y-4">
                <Field label="Logo de l’organisation" hint="PNG ou SVG, fond transparent, 200 × 60 px minimum">
                  <Input type="file" />
                </Field>
                <Field label="Couleur d’accentuation" hint="utilisée dans l’en-tête de votre espace">
                  <Input type="color" defaultValue="#5C2D91" className="h-10 w-24" />
                </Field>
              </div>
              <Callout ton="info" className="mt-4" titre="Personnalisation limitée volontairement">
                Nous ne laissons pas repeindre tout le portail : quand un incident survient, il faut
                que nos équipes et les vôtres regardent le même écran et se comprennent immédiatement.
                Un thème radicalement différent par organisation rendrait le support beaucoup plus
                lent.
              </Callout>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'api' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Jetons d’accès programmatique"
                sousTitre="Pour l’automatisation, l’infrastructure déclarative, l’intégration continue. Un jeton porte un rôle et une portée, comme un membre."
              />
              <div className="space-y-2">
                {[
                  { nom: 'terraform-production', role: 'Administrateur d’infrastructure', portee: 'EC-DBA-01', cree: '2025-09-14', dernier: 'il y a 2 h' },
                  { nom: 'ci-deploiement', role: 'Administrateur d’application', portee: 'Organisation', cree: '2026-02-08', dernier: 'il y a 28 min' },
                  { nom: 'export-facturation', role: 'Responsable facturation', portee: 'Organisation', cree: '2026-06-01', dernier: 'il y a 3 j' },
                ].map((j) => (
                  <div key={j.nom} className="rounded-[6px] border border-g-300 px-3 py-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block font-mono text-[12.5px] font-semibold text-ink">
                          {j.nom}
                        </span>
                        <span className="block text-[11px] text-g-500">
                          {j.role} · portée {j.portee}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <Badge tone="neutral" size="sm">
                          {j.dernier}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          Révoquer
                        </Button>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <GatedAction autorise={autorise('secrets.update')} message={refus('secrets.update')}>
                <Button size="sm" className="mt-3" variant="secondary">
                  Créer un jeton
                </Button>
              </GatedAction>
              <Callout ton="warn" className="mt-4" titre="Un jeton n’a pas de deuxième facteur">
                C’est un secret unique : quiconque le détient agit avec les droits qu’il porte. Donnez
                à chaque jeton le rôle le plus étroit possible, restreignez sa portée à un seul espace
                quand c’est faisable, et faites-les tourner. Un jeton d’administrateur d’organisation
                dans un fichier de configuration est un incident en attente.
              </Callout>
            </Card>

            <Card>
              <CardHeader
                titre="Utiliser l’interface programmatique"
                sousTitre="API REST documentée, plus une interface en ligne de commande."
                actions={<Terminal size={15} className="text-p-700" />}
              />
              <div className="space-y-3">
                <CopyField label="Adresse de l’API" value="https://api.synelia.cloud/v1" />
                <CopyField label="Organisation" value={ORG_COURANTE.id} />
              </div>
              <MicroLabel className="mt-4 mb-2">Exemple</MicroLabel>
              <CodeBlock
                langue="bash"
                code={`export SYNELIA_TOKEN="syn_…"

# Lister les machines d'un espace
curl -sS https://api.synelia.cloud/v1/espaces/ec-dba-01/vms \\
  -H "Authorization: Bearer $SYNELIA_TOKEN" | jq '.[] | {nom, statut, site}'

# Créer une machine (l'aperçu de coût est renvoyé avant validation)
synelia vm create --espace EC-DBA-01 --gabarit c2.medium \\
  --site ABJ-1 --etiquette centre-de-cout=DSI --dry-run`}
              />
              <div className="mt-3 flex flex-wrap gap-1.5">
                <ButtonLink size="sm" variant="secondary" href="/app/docs">
                  Documentation de l’API
                </ButtonLink>
                <ButtonLink size="sm" variant="ghost" external href="https://registry.terraform.io">
                  Fournisseur Terraform
                </ButtonLink>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              titre="Limites d’appel"
              sousTitre="Les mêmes pour tous, quelle que soit la taille de l’organisation."
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <StatTile libelle="Lectures" valeur="600" unite="/min" detail="Par jeton" />
              <StatTile libelle="Écritures" valeur="60" unite="/min" detail="Par jeton" />
              <StatTile libelle="Actions destructives" valeur="10" unite="/min" detail="Par organisation" ton="warn" />
              <StatTile libelle="Appels aujourd’hui" valeur="8 412" detail="Sur 3 jetons" />
            </div>
            <p className="mt-3.5 text-[11.5px] leading-relaxed text-g-500">
              Un dépassement renvoie un code 429 avec un en-tête indiquant le délai d’attente. Les
              actions destructives sont plus limitées que les autres : une boucle qui supprime est
              plus coûteuse à réparer qu’une boucle qui lit.
            </p>
          </Card>
        </div>
      )}

      {onglet === 'notifications' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              titre="Ce que nous vous envoyons"
              sousTitre="Nous préférons une alerte utile à dix notifications ignorées. Chaque catégorie est réglable séparément."
            />
            <div className="space-y-3.5">
              {[
                {
                  t: 'Incidents affectant vos ressources',
                  d: 'Uniquement quand une de vos ressources est concernée, pas à chaque incident de la plateforme.',
                  actif: true,
                  fige: true,
                },
                {
                  t: 'Sauvegarde en échec',
                  d: 'Dès le premier échec, pas après trois. Une sauvegarde qui échoue silencieusement est le pire des cas.',
                  actif: true,
                  fige: true,
                },
                {
                  t: 'Alertes de seuil',
                  d: 'Selon les règles que vous avez définies dans l’observabilité.',
                  actif: true,
                  fige: false,
                },
                {
                  t: 'Déploiement en échec',
                  d: 'Avec le diagnostic et le remède proposé, pas seulement la mention de l’échec.',
                  actif: true,
                  fige: false,
                },
                {
                  t: 'Facture disponible',
                  d: 'À l’émission, et un rappel trois jours avant l’échéance.',
                  actif: true,
                  fige: false,
                },
                {
                  t: 'Maintenance planifiée',
                  d: 'Sept jours avant, puis vingt-quatre heures avant.',
                  actif: true,
                  fige: true,
                },
                {
                  t: 'Mises à jour disponibles sur un service managé',
                  d: 'Avec le contenu de la mise à jour et la fenêtre proposée.',
                  actif: true,
                  fige: false,
                },
                {
                  t: 'Nouveautés produit',
                  d: 'Une fois par mois au maximum. Aucune relance commerciale.',
                  actif: false,
                  fige: false,
                },
              ].map((n) => (
                <Switch
                  key={n.t}
                  checked={n.actif}
                  label={n.t + (n.fige ? ' (non désactivable)' : '')}
                  description={n.d}
                />
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader titre="Canaux" sousTitre="Où les notifications arrivent." />
              <div className="space-y-4">
                <Field label="Adresse de contact technique" hint="reçoit les alertes et les incidents">
                  <Input type="email" defaultValue="ops@dba.africa" />
                </Field>
                <Field label="Adresse de contact facturation" hint="reçoit les factures et les échéances">
                  <Input type="email" defaultValue="compta@dba.africa" />
                </Field>
                <Field label="Numéro pour les SMS critiques" hint="réservé aux incidents majeurs, jamais utilisé pour le reste">
                  <Input defaultValue="+225 07 00 00 00 00" />
                </Field>
                <Field label="Webhook d’équipe" hint="Slack, Teams, Mattermost, ou n’importe quel point d’entrée HTTP">
                  <Input placeholder="https://hooks.exemple.ci/synelia" />
                </Field>
              </div>
              <Button className="mt-4" variant="secondary">
                Enregistrer les canaux
              </Button>
            </Card>

            <Card>
              <CardHeader
                titre="Fenêtres de maintenance"
                sousTitre="Nous planifions nos interventions dans la fenêtre que vous nous indiquez, sauf urgence de sécurité."
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Jour préféré">
                  <Select defaultValue="dimanche">
                    <option value="samedi">Samedi</option>
                    <option value="dimanche">Dimanche</option>
                    <option value="nuit">N’importe quelle nuit</option>
                  </Select>
                </Field>
                <Field label="Heure de début" hint="heure locale d’Abidjan">
                  <Select defaultValue="02">
                    <option value="00">00 h 00</option>
                    <option value="02">02 h 00</option>
                    <option value="04">04 h 00</option>
                  </Select>
                </Field>
              </div>
              <Callout ton="warn" className="mt-4" titre="L’exception des correctifs de sécurité">
                Une vulnérabilité critique activement exploitée est corrigée dès que possible, sans
                attendre votre fenêtre. Nous vous prévenons, mais nous n’attendons pas : le risque
                d’exploitation dépasse celui d’une interruption brève.
              </Callout>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'fermeture' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Réversibilité"
              sousTitre="Ce que vous pouvez récupérer, et par quel moyen. Nous préférons écrire cette page franchement plutôt que la rendre introuvable."
            />
            <div className="overflow-x-auto rounded-[8px] border border-g-300">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Donnée', 'Format de sortie', 'Moyen', 'Délai'].map((h) => (
                      <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { d: 'Images de machines virtuelles', f: 'QCOW2 ou OVA', m: 'Export via l’API ou l’interface', t: 'Immédiat, selon la taille' },
                    { d: 'Volumes de bloc', f: 'Image brute', m: 'Export vers votre stockage objet', t: 'Immédiat' },
                    { d: 'Stockage objet', f: 'Protocole compatible S3', m: 'rclone, aws-cli, mc — vos outils habituels', t: 'Immédiat' },
                    { d: 'Bases managées', f: 'Vidage SQL natif', m: 'pg_dump, mysqldump, mongodump', t: 'Immédiat' },
                    { d: 'Configuration Kubernetes', f: 'Manifestes YAML', m: 'kubectl, avec votre fichier de configuration', t: 'Immédiat' },
                    { d: 'Zones DNS', f: 'Fichier de zone BIND', m: 'Export depuis l’éditeur de zone', t: 'Immédiat' },
                    { d: 'Domaines', f: 'Code d’autorisation de transfert', m: 'Disponible dans les réglages du domaine', t: 'Immédiat' },
                    { d: 'Données des services managés', f: 'Format natif de la solution', m: 'Outils d’export de la solution (Nextcloud, Odoo, GitLab…)', t: 'Immédiat' },
                    { d: 'Journal d’audit', f: 'CSV, JSON, PDF signé', m: 'Export depuis Sécurité & audit', t: 'Quelques minutes' },
                    { d: 'Factures', f: 'PDF et CSV', m: 'Export depuis Facturation', t: 'Immédiat' },
                    { d: 'Points de sauvegarde', f: 'Archive restaurable', m: 'Sur demande, accompagnée par nos équipes', t: '2 jours ouvrés' },
                  ].map((x) => (
                    <tr key={x.d} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2 text-[12px] font-semibold text-ink">{x.d}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-g-700">{x.f}</td>
                      <td className="px-3 py-2 text-[11.5px] text-g-700">{x.m}</td>
                      <td className="px-3 py-2 text-[11.5px] text-g-500">{x.t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Callout ton="violet" className="mt-4" titre="Aucun format propriétaire">
              Rien de ce que nous stockons pour vous n’est enfermé dans un format que nous serions
              seuls à savoir lire. C’est un choix d’architecture, pas une faveur : nous préférons vous
              garder parce que le service est bon, pas parce que partir serait coûteux.
            </Callout>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                titre="Export complet"
                sousTitre="Un export unique de tout ce qui vous appartient, préparé par nos équipes."
              />
              <div className="space-y-4">
                <Field label="Destination">
                  <Select defaultValue="objet">
                    <option value="objet">Un compartiment de votre stockage objet</option>
                    <option value="externe">Un stockage compatible S3 externe</option>
                    <option value="physique">Support physique remis en main propre à Abidjan</option>
                  </Select>
                </Field>
                <Field label="Périmètre">
                  <Select defaultValue="tout">
                    <option value="tout">Tout l’organisation</option>
                    <option value="espace">Un Espace Cloud</option>
                    <option value="services">Les services managés uniquement</option>
                  </Select>
                </Field>
              </div>
              <GatedAction autorise={autorise('compliance.export')} message={refus('compliance.export')}>
                <Button className="mt-4" variant="secondary" iconBefore={<Globe size={14} />}>
                  Demander un export complet
                </Button>
              </GatedAction>
              <p className="mt-3 text-[11.5px] leading-relaxed text-g-500">
                Un export complet est gratuit une fois par an, et à la clôture du contrat. Au-delà,
                seul le coût du transfert sortant est facturé, au tarif du catalogue.
              </p>
            </Card>

            <Card className="border-err/30">
              <CardHeader
                titre="Clôture de l’organisation"
                sousTitre="Vous pouvez partir. Voici exactement ce qui se passe si vous le décidez."
              />
              <div className="space-y-2">
                {[
                  { j: 'Jour 0', d: 'Votre demande est enregistrée. Rien n’est supprimé. Vos ressources continuent de tourner.' },
                  { j: 'Jours 0 à 30', d: 'Période de récupération. Tous vos exports restent disponibles, l’accès au portail est maintenu en lecture. Vous pouvez annuler à tout moment.' },
                  { j: 'Jour 30', d: 'Les ressources actives sont arrêtées. Les données restent, les facturations à l’usage cessent.' },
                  { j: 'Jours 30 à 60', d: 'Les données sont conservées, en lecture seule. Une reprise reste possible sur simple demande.' },
                  { j: 'Jour 60', d: 'Effacement définitif et irréversible, avec attestation de destruction remise par écrit.' },
                ].map((e) => (
                  <div key={e.j} className="rounded-[6px] border border-g-300 px-3 py-2">
                    <p className="text-[12px] font-bold text-ink">{e.j}</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-700">{e.d}</p>
                  </div>
                ))}
              </div>
              <GatedAction autorise={autorise('payment.update')} message={refus('payment.update')}>
                <Button
                  className="mt-4"
                  variant="danger"
                  iconBefore={<Trash2 size={14} />}
                  onClick={() => setFermeture(true)}
                >
                  Demander la clôture
                </Button>
              </GatedAction>
              <p className="mt-3 text-[11.5px] leading-relaxed text-g-500">
                Aucune pénalité de sortie, aucun préavis contractuel au-delà du mois en cours. Le
                prorata du mois entamé reste dû, rien de plus.
              </p>
            </Card>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={fermeture}
        onClose={() => setFermeture(false)}
        titre="Demander la clôture de l’organisation"
        ressource={ORG_COURANTE.nom}
        libelleAction="Enregistrer la demande de clôture"
        pertes={[
          `${ESPACES.length} Espaces Cloud et toutes leurs ressources, arrêtés au jour 30`,
          'Toutes les données, effacées définitivement au jour 60',
          'Les accès de tous les membres de l’organisation',
          'Les domaines non transférés reviendront au registre à leur échéance',
        ]}
        onConfirm={() => {
          pousser({
            ton: 'info',
            titre: 'Demande de clôture enregistrée',
            detail: 'Rien n’est supprimé aujourd’hui. Vous avez 30 jours pour récupérer vos données et autant pour annuler.',
          })
          setFermeture(false)
        }}
      />
    </div>
  )
}
