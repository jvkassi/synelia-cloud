import type { Metadata } from 'next'
import { ArrowRight, Check, Layers, Lock, Palette, Percent, Store, Webhook } from 'lucide-react'
import { cn } from '@/lib/utils'
import { money, pct } from '@/lib/format'
import { MODELE_PARTENAIRE, OFFRES, PAYS } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field'
import { Card, CardHeader, Callout } from '@/components/composition/card'
import { FormulaireSite } from '@/components/site/formulaire'
import {
  AppelFinal,
  Container,
  HeroCourt,
  SectionTitle,
  SiteSection,
} from '@/components/site/blocs'

export const metadata: Metadata = {
  title: 'Partenaires et revendeurs',
  description:
    'Modèle revendeur, marque blanche et opérateur : grille d’achat dédiée, thématisation complète du portail, tarification à deux étages, revshare mensuel calculé automatiquement.',
}

const PILOTAGE = [
  {
    icone: <Palette size={16} />,
    titre: 'Identité et thème',
    texte:
      'Logo, palette, domaine du portail, modèles d’e-mails transactionnels, en-tête de vos factures et devis. Prévisualisation en direct avant publication.',
  },
  {
    icone: <Percent size={16} />,
    titre: 'Grille tarifaire à deux étages',
    texte:
      'Votre prix d’achat Synelia, le prix de vente conseillé, et votre prix de vente effectif. La marge est calculée et affichée pour chaque offre et chaque service.',
  },
  {
    icone: <Layers size={16} />,
    titre: 'Périmètre de catalogue',
    texte:
      'Vous choisissez les offres et les services que vous proposez. Ce que vous n’activez pas n’apparaît jamais dans le portail de vos clients.',
  },
  {
    icone: <Lock size={16} />,
    titre: 'Clients finaux cloisonnés',
    texte:
      'Chaque client final est un tenant distinct. Vous ne voyez que les vôtres ; ils ne voient jamais Synelia. Le cloisonnement est appliqué au niveau des rôles, pas de l’affichage.',
  },
  {
    icone: <Store size={16} />,
    titre: 'Relevé de revshare',
    texte:
      'Calculé automatiquement chaque mois à partir de la consommation réelle de vos clients, avec historique, export et état de règlement.',
  },
  {
    icone: <Webhook size={16} />,
    titre: 'API et webhooks',
    texte:
      'Provisionnez depuis votre propre système d’information. Clés d’API à portée limitée, webhooks d’événements vers vos endpoints, documentation dédiée.',
  },
]

export default function Partenaires() {
  const cloudPro = OFFRES.find((o) => o.id === 'off-pro')!
  const achat = cloudPro.prix.revendeur
  const conseille = cloudPro.prix.direct
  const marge = conseille - achat
  const margePct = Math.round((marge / conseille) * 100)

  return (
    <>
      <HeroCourt
        surtitre="Partenaires & revendeurs"
        titre={
          <>
            Vendez du cloud souverain
            <br />
            <span className="text-m-400">sous votre marque.</span>
          </>
        }
        chapeau="Trois niveaux de partenariat, une grille d’achat dédiée, et un portail que vous pouvez entièrement thématiser à vos couleurs et à votre domaine. Vos clients ne voient jamais Synelia — et vous ne voyez que vos clients."
        actions={
          <>
            <ButtonLink href="#candidature" size="lg" variant="inverse">
              Devenir partenaire
            </ButtonLink>
            <Badge tone="ok">Aucun volume minimum la première année</Badge>
          </>
        }
      />

      <SiteSection>
        <Container>
          <SectionTitle
            surtitre="Trois niveaux"
            titre="Choisissez votre degré d’intégration"
            chapeau="Du simple apport d’affaires à l’intégration complète dans votre catalogue et votre facturation."
          />
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {MODELE_PARTENAIRE.map((m, i) => (
              <div
                key={m.niveau}
                className={cn(
                  'flex flex-col rounded-[14px] border-2 bg-white p-6',
                  i === 1 ? 'border-p-700 shadow-[0_8px_32px_rgba(43,27,77,.12)]' : 'border-g-300',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[19px] font-bold [font-family:var(--font-display)] text-ink">
                    {m.niveau}
                  </h3>
                  {i === 1 && (
                    <Badge tone="violet" size="sm">
                      Le plus choisi
                    </Badge>
                  )}
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-g-700">{m.description}</p>
                <dl className="mt-5 space-y-2.5 border-t border-g-100 pt-4">
                  <div>
                    <dt className="type-micro text-g-500">Remise</dt>
                    <dd className="mt-0.5 text-[15px] font-bold [font-family:var(--font-display)] text-p-700">
                      {m.remise}
                    </dd>
                  </div>
                  <div>
                    <dt className="type-micro text-g-500">Engagement</dt>
                    <dd className="mt-0.5 text-[12.5px] text-g-700">{m.engagement}</dd>
                  </div>
                </dl>
                <ul className="mt-4 flex-1 space-y-1.5 border-t border-g-100 pt-4">
                  {m.inclus.map((x) => (
                    <li key={x} className="flex items-start gap-2 text-[12.5px] text-g-700">
                      <Check size={13} className="mt-0.5 shrink-0 text-ok" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </SiteSection>

      <SiteSection fond="clair">
        <Container>
          <SectionTitle
            surtitre="Architecture du modèle"
            titre="Une hiérarchie à trois niveaux, cloisonnée"
            chapeau="Le cloisonnement n’est pas un réglage d’affichage : il est appliqué au niveau du modèle de rôles. Un Reseller Admin ne peut techniquement pas atteindre un tenant qui ne lui est pas rattaché."
          />
          <div className="mt-8 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
            {[
              {
                niveau: 'Synelia',
                role: 'Provider Admin · Provider Operator',
                voit: 'Toute la plateforme : backends, capacité, catalogue, tous les tenants, toute la facturation.',
                teinte: 'border-p-700 bg-p-050',
              },
              {
                niveau: 'Vous, le revendeur',
                role: 'Reseller Admin',
                voit: 'Votre thème, votre grille tarifaire, votre périmètre de catalogue, vos clients finaux, votre revshare. Aucun accès aux backends ni aux autres revendeurs.',
                teinte: 'border-m-600 bg-m-050',
              },
              {
                niveau: 'Votre client final',
                role: 'Org Admin et rôles dérivés',
                voit: 'Son propre espace client, à votre marque. Il ne sait pas que Synelia existe, et ne voit ni votre grille d’achat ni votre marge.',
                teinte: 'border-g-300 bg-white',
              },
            ].map((n, i) => (
              <div key={n.niveau} className="relative">
                <div className={cn('h-full rounded-[10px] border-2 p-5', n.teinte)}>
                  <MicroLabel className="text-g-500">Niveau {i + 1}</MicroLabel>
                  <h3 className="mt-1.5 text-[16px] font-bold [font-family:var(--font-display)] text-ink">
                    {n.niveau}
                  </h3>
                  <p className="mt-1 font-mono text-[11.5px] text-g-500">{n.role}</p>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-g-700">{n.voit}</p>
                </div>
                {i < 2 && (
                  <ArrowRight
                    size={18}
                    className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-g-300 lg:block"
                  />
                )}
              </div>
            ))}
          </div>
        </Container>
      </SiteSection>

      <SiteSection>
        <Container>
          <SectionTitle
            surtitre="Votre portail"
            titre="Ce que vous pilotez, sans passer par nous"
          />
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PILOTAGE.map((p) => (
              <div key={p.titre} className="rounded-[10px] border border-g-300 bg-white p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-p-100 text-p-700">
                  {p.icone}
                </span>
                <h3 className="mt-3 type-h3">{p.titre}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-g-700">{p.texte}</p>
              </div>
            ))}
          </div>
        </Container>
      </SiteSection>

      <SiteSection fond="clair">
        <Container>
          <SectionTitle
            surtitre="Exemple chiffré"
            titre="Une offre Cloud Pro, de bout en bout"
            chapeau="Les montants sont les tarifs publics et la grille revendeur réels du catalogue. Hors taxes, par mois et par souscription."
          />
          <Card className="mt-7">
            <CardHeader
              titre={`${cloudPro.nom} — ${cloudPro.specs}`}
              actions={<Badge tone="violet">{cloudPro.souscriptionsActives} souscriptions actives</Badge>}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Ligne', 'Montant mensuel', 'Sur 12 mois', 'Commentaire'].map((h) => (
                      <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      l: 'Prix de vente conseillé (tarif public)',
                      m: conseille,
                      c: 'Ce que paierait votre client en direct chez Synelia',
                    },
                    {
                      l: 'Votre prix d’achat Synelia',
                      m: achat,
                      c: `Grille revendeur, soit ${pct(Math.round(((conseille - achat) / conseille) * 100))} de remise`,
                    },
                    {
                      l: 'Votre marge brute',
                      m: marge,
                      c: `${pct(margePct)} du prix de vente`,
                      fort: true,
                    },
                  ].map((r) => (
                    <tr
                      key={r.l}
                      className={cn('border-b border-g-100 last:border-0', r.fort && 'bg-ok-bg')}
                    >
                      <td
                        className={cn(
                          'px-3 py-2.5 text-[13px]',
                          r.fort ? 'font-bold text-ink' : 'text-g-700',
                        )}
                      >
                        {r.l}
                      </td>
                      <td
                        className={cn(
                          'tnum px-3 py-2.5 text-[13px]',
                          r.fort ? 'font-bold text-ok' : 'font-semibold text-ink',
                        )}
                      >
                        {money(r.m)}
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">
                        {money(r.m * 12)}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-g-500">{r.c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Callout ton="info" className="mt-4" titre="Et le revshare ?">
              En marque blanche, vous pouvez soit acheter à la grille et facturer vous-même votre
              client (le tableau ci-dessus), soit laisser Synelia facturer et percevoir un revshare
              mensuel — 18 à 22 % du chiffre d’affaires généré, calculé automatiquement à partir de
              la consommation réelle. Le second modèle évite de porter le risque d’impayé.
            </Callout>
          </Card>
        </Container>
      </SiteSection>

      <SiteSection id="candidature">
        <Container taille="md">
          <SectionTitle
            centre
            surtitre="Candidature"
            titre="Devenir partenaire Synelia"
            chapeau="Un chargé de partenariat vous répond sous un jour ouvré pour établir votre grille et votre périmètre."
          />
          <Card className="mt-8">
            <FormulaireSite
              libelle="Envoyer ma candidature"
              titreSucces="Candidature enregistrée"
              phraseSucces="Un chargé de partenariat instruit votre dossier : périmètre de catalogue, grille d’achat, niveau de thématisation du portail."
              suite={[
                'Instruction du dossier sous un jour ouvré — activité, cibles, offres déjà distribuées.',
                'Atelier de cadrage sans frais, qui fixe votre grille et votre périmètre de catalogue.',
                'Ouverture de votre portail thématisé et de votre compte revendeur, sans volume minimum la première année.',
              ]}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Raison sociale" required>
                  <Input required placeholder="Votre société" />
                </Field>
                <Field label="Pays d’exercice" required>
                  <Select defaultValue={PAYS[0]}>
                    {PAYS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Contact" required>
                  <Input required placeholder="Nom et fonction" autoComplete="name" />
                </Field>
                <Field label="E-mail professionnel" required>
                  <Input required type="email" placeholder="contact@societe.ci" autoComplete="email" />
                </Field>
              </div>
              <Field label="Niveau de partenariat souhaité" required>
                <Select required defaultValue="">
                  <option value="">Sélectionner…</option>
                  {MODELE_PARTENAIRE.map((m) => (
                    <option key={m.niveau} value={m.niveau}>
                      {m.niveau}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nombre de clients actifs" hint="ordre de grandeur">
                  <Input type="number" min={0} placeholder="25" />
                </Field>
                <Field label="Chiffre d’affaires annuel IT" hint="en FCFA, facultatif">
                  <Input type="number" min={0} step={1000000} placeholder="120000000" />
                </Field>
              </div>
              <Field
                label="Votre activité et vos cibles"
                hint="secteurs, géographies, offres déjà distribuées"
                required
              >
                <Textarea
                  required
                  rows={5}
                  placeholder="Intégrateur réseau et sécurité basé à Abidjan, 18 collaborateurs, une trentaine de clients dans la banque et l’assurance. Nous distribuons déjà des solutions de sauvegarde et souhaitons ajouter une offre IaaS et messagerie souveraine."
                />
              </Field>
              <Checkbox
                required
                label="J’accepte d’être contacté par Synelia au sujet de cette candidature"
                description="Vos informations ne sont utilisées que pour l’instruction de votre dossier de partenariat."
              />
            </FormulaireSite>
          </Card>
        </Container>
      </SiteSection>

      <AppelFinal
        titre="Une question avant de candidater ?"
        chapeau="Nos chargés de partenariat répondent aux questions de grille, de cloisonnement, de facturation et d’intégration API. L’atelier de cadrage partenaire est sans frais."
        primaire={{ libelle: 'Nous écrire', href: '/entreprises#contact' }}
        secondaire={{ libelle: 'Voir les tarifs publics', href: '/tarifs' }}
      />
    </>
  )
}
