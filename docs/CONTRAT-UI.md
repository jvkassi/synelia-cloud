# Contrat d'interface — Synelia Cloud

Référence unique pour toute personne (ou agent) qui construit un écran.
**Ne créez aucun composant de base et aucune donnée : tout existe déjà.**

---

## 1. Règles absolues

1. **Français partout.** Libellés, messages d'erreur, commentaires de code.
   Apostrophe typographique `’` dans le texte visible.
2. **Ne jamais réimplémenter un produit externe** (§0.2 de la spécification).
   Pas d'explorateur de fichiers, pas de webmail, pas d'écran métier ERP, pas
   d'éditeur de contenu CMS, pas de constructeur de requêtes de logs. On
   construit *la carte qui y mène*.
3. **Observabilité encadrée** (§0.3) : uniquement `StatTile`, `SparkChart`
   (via `GrilleSparkCharts`), `EventList`, `LogPeek`, plus les liens de sortie
   `LiensSortie`. Rien d'autre.
4. **Magenta (`m-600`) avec parcimonie** : uniquement le mot d'accroche du héros
   marketing, le bouton `Ouvrir` d'un service managé (`variant="accent"`), et
   les libellés de flux SSO. Partout ailleurs, du violet.
5. **Montants en FCFA** via `money()`. Jamais de `toLocaleString`.
6. **Chiffres tabulaires** : classe `tnum` sur toute cellule numérique.
7. **Aucun `Math.random()` ni `new Date()`** dans le rendu — cela casserait
   l'hydratation. Utilisez `seededSeries`, `trendSeries` et la constante
   `MAINTENANT` de `@/lib/format`.
8. **Pas de `<img>` distant, pas de CDN, pas de police externe** autre que celles
   déjà chargées dans `src/app/layout.tsx`.

---

## 2. Classes utilitaires disponibles

### Couleurs (Tailwind v4, jetons `@theme`)

`p-900 p-800 p-700 p-600 p-400 p-300 p-100 p-050` · `m-600 m-700 m-050` ·
`ok ok-bg warn warn-bg err err-bg info info-bg` ·
`ink g-700 g-500 g-300 g-100 g-050`

Utilisation : `bg-p-700`, `text-g-500`, `border-g-300`, `bg-ok-bg`, etc.

### Typographie

`type-display` · `type-h1` · `type-h2` · `type-h3` · `type-body` ·
`type-small` · `type-micro` · `type-mono`

### Divers

`animate-fade-in` · `animate-scale-in` · `animate-slide-in-right` ·
`animate-pulse-dot` · `animate-marquee` · `skeleton` · `bg-grid-violet` ·
`bg-grid-light` · `no-scrollbar` · `tnum`

Rayons : `rounded-[6px]` (champs) · `rounded-[10px]` (cartes) ·
`rounded-[14px]` (panneaux) · `rounded-full` (pastilles).

Ombres : `shadow-[0_1px_2px_rgba(43,27,77,.06)]` au repos ·
`shadow-[0_4px_16px_rgba(43,27,77,.1)]` au survol.

---

## 3. Composants — signatures exactes

### `@/components/ui/button`

```tsx
<Button variant="primary|secondary|ghost|danger|accent" size="sm|md|lg"
        loading iconBefore={<Icon/>} iconAfter={<Icon/>} fullWidth onClick={} disabled />
<ButtonLink href="/x" external variant size iconBefore iconAfter fullWidth />
<IconButton label="Texte obligatoire" size variant>{icone}</IconButton>
```

### `@/components/ui/badge`

```tsx
<Badge tone="neutral|violet|accent|ok|warn|err|info" dot size="sm|md">Texte</Badge>
<StatusDot tone pulse label />
<MicroLabel>ÉTIQUETTE</MicroLabel>
```

### `@/components/ui/field` — `'use client'`

```tsx
<Field label hint error required>{enfant}</Field>
<Label htmlFor hint required>Texte</Label>
<Input iconBefore={<Icon/>} suffix="vCPU" {...props HTML} />
<SearchInput value onChange placeholder />
<Textarea /> <MonoTextarea />
<Select value onChange><option/></Select>
<Checkbox label description checked onChange />
<Radio label description name checked onChange />
<Switch checked onChange={(v)=>{}} label description disabled />
<SegmentedControl options={[{value,label}]} value onChange size="sm|md" />
<Slider label value onChange min max step unite />
<Combobox options={[{value,label,meta}]} value onChange placeholder />
```

### `@/components/ui/overlay` — `'use client'`

```tsx
<Tooltip content side="top|bottom|left|right">{déclencheur}</Tooltip>
<Popover trigger={(open)=><span/>} align="left|right" width="w-72">
  {(close)=> <div/>}   {/* ou un ReactNode simple */}
</Popover>
<Modal open onClose title description footer size="sm|md|lg">{corps}</Modal>
<Drawer open onClose title description footer size="sm|md|lg|full">{corps}</Drawer>
<ConfirmDialog open onClose onConfirm titre ressource pertes={['…']} libelleAction />
```

### `@/components/ui/display` — `'use client'`

```tsx
<Avatar nom src size="xs|sm|md|lg|xl" teinte />
<SolutionLogo initiales="NC" teinte="#0082C9" size="sm|md|lg" />
<Breadcrumb items={[{label, href?}]} />
<Tabs tabs={[{id,label,badge?}]} active onChange />
<LinkTabs tabs={[{href,label,badge?}]} active={hrefCourant} />
<CopyField value label masque mono />
<CodeBlock code langue copiable />
<Pagination page total perPage onChange />
<Skeleton className /> <Spinner size />
<GatedAction autorise={bool} message="Cette action demande le rôle …">{bouton}</GatedAction>
```

### `@/components/composition/card`

```tsx
<Card padding hover>{…}</Card>
<CardHeader titre sousTitre actions />
<Section titre sousTitre actions>{…}</Section>
<PageHeader fil={[{label,href?}]} titre sousTitre actions meta />
<KeyValueList items={[{cle, valeur}]} colonnes={1|2|3} />
<Callout ton="info|ok|warn|err|violet" titre action>{texte}</Callout>
<NavCard href titre description icone meta />
```

### `@/components/composition/states`

```tsx
<SkeletonTable lignes colonnes /> <SkeletonCards nombre hauteur /> <SkeletonStats nombre />
<EmptyState titre phrase action={{libelle, href?|onClick?}} actionSecondaire={{libelle,href}} icone />
<ErrorState titre cause reprise seed />
<PermissionDenied message>{contenuGrisé}</PermissionDenied>
<DegradedState source="supervision" hauteur="h-40" />
```

### `@/components/composition/metrics`

```tsx
<Sparkline serie={number[]} couleur hauteur />
<StatTile libelle valeur unite variation variationUnite serie
          ton="violet|ok|warn|err|info|accent|neutral" detail />
<QuotaBar libelle utilise total unite seuil compact formateur={(v)=>string} />
<StackedBar segments={[{label,valeur,couleur}]} hauteur />
<GaugeCircle valeur max min libelle cible taille />
<HealthBadge etat="sain|operationnel|running|en_ligne|degrade|degraded|maintenance|provisioning|creating|building|migrating|updating|arrete|stopped|suspendue|echec|error|failed|erreur|maj_disponible|jamais_teste|ok|warn" size />
```

### `@/components/composition/data-table` — `'use client'`

```tsx
<DataTable
  lignes={T[]}                       // T doit avoir un champ `id: string`
  colonnes={[{
    id, entete,
    rendu: (l) => ReactNode,
    cle?: (l) => string|number,      // active tri + recherche
    aligne?: 'left'|'right'|'center',
    largeur?, masquable?, masqueeParDefaut?,
  }]}
  recherche placeholderRecherche
  filtres={[{id, libelle, options:[{value,label}]}]}
  selection={(ligne, filtreId, valeur) => boolean}   // requis si `filtres`
  actionsGroupees={(ids) => ReactNode}
  parPage chargement exportable densiteInitiale="compacte|confortable"
  href={(l) => `/app/…/${l.id}`}
  vide={{titre, phrase, action?:{libelle,href}}}
/>
```

### `@/components/composition/flow`

```tsx
<Timeline evenements={[{id, titre, detail?, horodatage, ton?}]} />
<Stepper etapes={[{numero,titre}]} courante onChange />
<CostPreview lignes={[{libelle, detail?, montant, quantite?}]}
             periodicite="mensuelle|annuelle" jourDuMois compact />
<WizardShell etapes courante onChange titre panneau actions>{corps}</WizardShell>
```

### `@/components/business/observabilite` — `'use client'`

```tsx
<SparkChart titre serie unite couleur hauteur seuil />
<GrilleSparkCharts seed="clé-stable"
  metriques={[{titre, unite, min, max, couleur?, seuil?}]} degrade />
<LiensSortie centreon grafana logs />
<EventList evenements={EvenementSupervision[]} max={8} lienSortie hrefSortie />
<LogPeek lignes={LigneLog[]} max={20} titre hrefSortie />
```

### `@/components/business/service-card`

```tsx
<ServiceCard service={ManagedService} catalogue={CatalogService} compact />
<CatalogCard service={CatalogService} href />
<AppLauncherTile service catalogue />
```

### `@/components/business/infra` — `'use client'`

```tsx
<BackendGauge backend={Backend} compact />
<PlacementSlider backends={Backend[]} initial={[{backendId, percent}]} />
<SlaGauge composant engagement constate />
<Regle321 copies supports horsSite />
<AvertissementMigration lots machines />
```

### `@/components/business/paas` — `'use client'`

```tsx
<DeploymentPipeline deploiement={Deployment} journaux={{build:'…'}} />
<SecurityFindings findings={Deployment['findings']} />
<AnomalieCard anomalie={Anomalie} />
<BuildDiagnostic erreur traduction correctifs={string[]} />
<JobTracker job={ProvisioningJob} />
<ComponentCard composant={Component} />
<PreviewLink url pr branche />
```

### `@/components/business/rbac-canvas` — `'use client'`

```tsx
<RoleMatrix roles={Role[]} roleSurligne={Role} />
<TopologyCanvas initial={[{briqueId,nom,x,y}]} />
<Copilote />
```

### `@/components/site/blocs`

```tsx
<Container taille="md|lg">{…}</Container>
<SiteSection fond="blanc|clair|violet|violet-fonce" id>{…}</SiteSection>
<SectionTitle surtitre titre chapeau sombre centre />
<HeroCourt surtitre titre chapeau actions enfants />
<AppelFinal titre chapeau primaire={{libelle,href}} secondaire={{libelle,href}} />
<Accordeon items={[{question,reponse}]} />
<ChiffreCle valeur libelle sombre />
<VisuelRack />
<CarrouselLogos logos={[{nom,initiales,teinte}]} />
<LienFleche href sombre>{texte}</LienFleche>
```

### Contexte de l'espace client / fournisseur — `@/components/app/contexte`

```tsx
const { role, setRole, espaceId, setEspaceId, autorise, refus, pousser } = useApp()
const espace = useEspace()   // EspaceCloud sélectionné
```
`autorise('vm.create_delete')` → booléen · `refus('vm.create_delete')` → phrase
d'infobulle. Disponible uniquement dans un composant `'use client'` sous
`/app` ou `/admin`.

### Agir sur une ressource — `@/components/app/actions`

```tsx
<BoutonAction operation={{ action, titre, effet, job, effetFinal }} libelle confirmation />
<BoutonFormulaire champs={[…]} operation={(v) => ({ … })} libelle titre action />
const executer = useOperation()   // depuis un onClick existant
```
`useOperation()` enchaîne RBAC → mutation → notification → job → trace d'audit,
refus compris. N'écrivez pas cette séquence à la main.

### Opérations longues — le catalogue

**Toute opération qui prend plus de quelques secondes se déclare par son
identifiant de catalogue**, jamais par une liste d'étapes recopiée :

```tsx
job: { workflow: 'backup.restore', cible: `${p.resourceNom} · ${dateCourte(p.date)}` }
```

Le libellé (`{cible}` substitué), les étapes, leurs durées annoncées, les phrases
de départ et de fin et l'échec éventuel vivent dans `WORKFLOWS`
(`src/lib/mock/workflows.ts`). Ajouter une opération = une entrée là-bas.

- Le temps d'écran est constant (~11 s) et se répartit entre les étapes au
  prorata de leurs durées annoncées.
- `effetFinal` ne s'applique qu'en cas de succès : une opération qui échoue ne
  doit pas faire apparaître la ressource.
- `reprendreJob(id)` (de `useAtelier()`) reprend à l'étape échouée, sur le job
  lui-même.
- La forme `etapes: string[]` reste juste quand les étapes dépendent d'un choix
  de l'utilisateur. Sinon, catalogue.

---

## 4. Formatage — `@/lib/format`

```ts
money(172000)              // « 172 000 FCFA »
moneyPerMonth(85000)       // « 85 000 FCFA/mois »
num(12480) · pct(34) · pct(99.98, 2) · delta(6) // « ▲ 6 pts »
goHumain(512) · toHumain(7.1)
dateCourte('2026-07-12') · dateHeure(iso) · heure(iso) · relatif(iso)
duree(183)  // « 3 min 3 s »   dureeMin(192) // « 3 h 12 »
ventilationTva(145780) · prorata(148000, 19)
TVA_PCT // 18
MAINTENANT // '2026-08-19T15:20:00Z' — référence temporelle figée
```

## 5. Utilitaires — `@/lib/utils`

`cn(...)` · `correlationId(seed)` · `seededSeries(seed, n, min, max)` ·
`trendSeries(seed, n, from, to, jitter)` · `clamp` · `sumBy` · `groupBy` ·
`slugify` · `initials` · `paginate`

## 6. RBAC — `@/lib/rbac`

`MATRICE_RBAC` · `ROLES_ORDRE` · `ROLES_CLIENT` · `ROLES_FOURNISSEUR` ·
`can(role, actionId)` · `isAllowed` · `messageRefus(actionId)` · `rolesRequis`

Identifiants d'action utiles : `espace.create` · `espace.quota.update` ·
`vm.create_delete` · `vm.power` · `vm.hardware.update` · `network.manage` ·
`lb.create` · `backup.plan.write` · `backup.restore` · `dr.failover.real` ·
`dr.failover.test` · `app.deploy` · `app.rollback` · `component.restart` ·
`secrets.update` · `marketplace.subscribe` · `seat.assign` · `service.open` ·
`service.admin` · `member.invite` · `sso.configure` · `invoice.view` ·
`payment.update` · `audit.view` · `compliance.export` · `capacity.manage` ·
`catalog.edit` · `reseller.manage`

## 7. Données — `@/lib/mock`

Tout est exporté depuis `@/lib/mock` (barrel). Principales collections :

`ORGANISATIONS ORG_COURANTE RESELLERS USERS MEMBERSHIPS UTILISATEUR_COURANT
MES_ORGANISATIONS EQUIPE_SYNELIA` ·
`ESPACES ESPACE_DEFAUT BACKENDS PLACEMENTS VMS K8S_CLUSTERS NETWORKS
PUBLIC_IPS SECURITY_GROUPS VPN_TUNNELS LOAD_BALANCERS VOLUMES BUCKETS
CLES_S3 BASES_MANAGEES` ·
`BACKUP_PLANS RESTORE_POINTS CONFORMITE CAPACITE_SAUVEGARDE AGENTS_SAUVEGARDE` ·
`APPLICATIONS ENVIRONNEMENTS COMPOSANTS DEPLOIEMENTS ANOMALIES
SUGGESTIONS_COPILOTE LOGS_BUILD LOGS_EXECUTION BRIQUES_CANVAS ANALYSE_DEPOT` ·
`CATALOGUE SERVICES_MANAGES SIEGES PARC_INSTANCES CAMPAGNES_MAJ
CONTRAT_INTEGRATION TACHES_PROVISIONING` ·
`OFFRES SOUSCRIPTIONS FACTURES DEVIS TICKETS TICKETS_PLATEFORME
ENGAGEMENTS_SLA CREDITS_SLA ARTICLES_KB` ·
`HEBERGEMENTS DOMAINES ZONES_DNS MODELES_DNS SMTP` ·
`AUDIT JOBS JOBS_PLATEFORME EVENEMENTS_SUPERVISION ALERTES_PLATEFORME
REGLES_ALERTES STATUT_SERVICES INCIDENTS CONFORMITE_PLATEFORME` ·
`SYNTHESE_CLIENT SYNTHESE_PLATEFORME TOP_ORGANISATIONS VENTILATION_DEPENSE
SHOWBACK_ESPACES SHOWBACK_APPLICATIONS CONSOMMATION_JOURS MARGE_BACKENDS
RELEVES_REVSHARE IMPAYES servicesAvecSiege()` ·
Vitrine : `MEGAMENU INDICATEURS_HERO BANDEAU_CONFIANCE PORTES_ENTREE
CARTES_PRODUIT BLOC_SAUVEGARDE BLOC_SOUVERAINETE NIVEAUX_SOUVERAINETE
TRAJECTOIRE_SORTIE ETUDES_CAS FAQ_ACCUEIL FAMILLES_TARIFS FICHES_PRODUIT
DATACENTERS MODELE_PARTENAIRE RESSOURCES SECTIONS_DOCS TARIFS_UNITAIRES
HYPOTHESES_COMPARATEUR REFERENCES_COMPARATEUR OFFRES_ENTREPRISE SECTEURS
TAILLES_ORG PAYS PAGES_LEGALES`

Sélecteurs : `espaceById espaceByCode backendById vmById vmsDeLEspace
clusterById lbById bucketById baseById placementsDeLEspace reseauxDeLEspace
ipsDeLEspace sgDeLEspace lbDeLEspace volumesDeLEspace planById
appById envById envsDeLApp composantsDeLEnv deploiementsDeLEnv
deploiementsDeLApp deploiementById anomaliesDeLApp serviceCatalogue
serviceManage servicesDeLOrg siegesDuService siegesDeLUtilisateur
instancesDuService offreById factureById ticketById facturesDeLOrg
ticketsDeLOrg hebergementById zoneById domaineById orgById userById
membresDeLOrg resellerById`

Types : tout depuis `@/lib/types` (`Organisation`, `EspaceCloud`, `VM`,
`ManagedService`, `CatalogService`, `Deployment`, `Role`, `Site`,
`SITE_LABEL`, `SITE_COURT`, `ROLE_LABEL`, `BACKEND_LABEL`,
`CATEGORIE_LABEL`, `MOYEN_LABEL`, …).

---

## 8. Conventions Next.js

- App Router. Composant serveur par défaut ; `'use client'` **uniquement** si
  l'écran a un état local, et alors le fichier entier devient client.
- Page = `src/app/**/page.tsx`, export par défaut. Ajoutez
  `export const metadata = { title: '…' }` sur les pages serveur.
- Paramètres dynamiques Next 15 : `params` est une **promesse**.
  ```tsx
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
  ```
- `notFound()` de `next/navigation` si la ressource est introuvable.
- Pour une page interactive avec route dynamique : la page serveur `await`
  les params, puis rend un composant client `./vue.tsx` en lui passant l'`id`.
- Pas de `generateStaticParams` — inutile ici.

## 9. Structure attendue d'un écran

```tsx
<div className="space-y-6">
  <PageHeader fil={[…]} titre="…" sousTitre="…" actions={<Button/>} />
  {/* rangée de StatTile si pertinent */}
  {/* contenu principal : DataTable, onglets, cartes */}
</div>
```

Toujours prévoir : l'état vide via `vide={…}` du `DataTable` ou `EmptyState`,
et l'affichage de l'emplacement physique (`SITE_COURT[site]`) partout où une
ressource est listée — c'est un argument de souveraineté (§1.6).
