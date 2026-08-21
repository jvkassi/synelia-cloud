'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Handshake, Palette, Plus, TrendingUp } from 'lucide-react'
import { cn, surfaceMarque } from '@/lib/utils'
import { money, num, pct } from '@/lib/format'
import { MODELE_PARTENAIRE, ORGANISATIONS, RELEVES_REVSHARE, RESELLERS } from '@/lib/mock'
import type { Reseller } from '@/lib/types'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { Modal } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { useApp } from '@/components/app/contexte'
import { useCollection } from '@/components/app/atelier'
import { useOperation } from '@/components/app/actions'

const ONGLETS = [
  { id: 'partenaires', label: 'Partenaires' },
  { id: 'modele', label: 'Modèle de partenariat' },
  { id: 'regles', label: 'Règles de conduite' },
]

export default function Revendeurs() {
  const { autorise, refus } = useApp()
  const partenaires = useCollection<Reseller>('revendeurs', RESELLERS)
  const executer = useOperation()
  const [onglet, setOnglet] = useState('partenaires')
  const [creation, setCreation] = useState(false)
  const [nom, setNom] = useState('')
  const [niveau, setNiveau] = useState('revendeur')
  const [revsharePct, setRevsharePct] = useState(22)
  const [domaine, setDomaine] = useState('')
  const [primary, setPrimary] = useState('#1B3A5C')
  const [accent, setAccent] = useState('#E8952B')
  const [contact, setContact] = useState('')
  const [catalogueComplet, setCatalogueComplet] = useState(true)
  const [releveDetaille, setReleveDetaille] = useState(true)
  const [facturationDirecte, setFacturationDirecte] = useState(false)

  const agreer = () => {
    executer({
      action: 'reseller.manage',
      titre: `${nom.trim()} agréé`,
      detail:
        'Le portail sous sa marque est provisionné et son organisation revendeur est créée. Le contact administratif reçoit son invitation.',
      job: {
        type: 'reseller.onboard',
        label: `Agrément · ${nom.trim()}`,
        etapes: [
          'Création de l’organisation revendeur',
          'Application de la grille d’achat',
          'Provisionnement du portail thématisé',
          domaine ? `Émission du certificat pour ${domaine}` : 'Émission du certificat du portail',
          'Invitation du contact administratif',
        ],
      },
      effet: () =>
        partenaires.creer({
          id: partenaires.identifiant('res'),
          orgId: partenaires.identifiant('org'),
          nom: nom.trim(),
          theme: { logoUrl: '', primary, accent, domaine: domaine || 'portail.partenaire.ci' },
          grille: [],
          catalogue: catalogueComplet ? ['*'] : [],
          revsharePct,
          clientsFinaux: [],
          caGenere: 0,
          marge: 0,
          statut: 'onboarding',
        }),
    })
    setNom('')
    setDomaine('')
    setContact('')
    setCreation(false)
  }

  const caTotal = partenaires.items.reduce((a, r) => a + r.caGenere, 0)
  const margeTotal = partenaires.items.reduce((a, r) => a + r.marge, 0)
  const clientsTotal = partenaires.items.reduce((a, r) => a + r.clientsFinaux.length, 0)
  const revshareDu = RELEVES_REVSHARE.filter((r) => r.statut !== 'réglé').reduce(
    (a, r) => a + r.montant,
    0,
  )

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Revendeurs et partenaires"
        sousTitre="Un revendeur porte la relation commerciale, la facturation et le support de premier niveau. Nous exploitons la plateforme derrière lui, sous sa marque s’il le souhaite. Nous ne court-circuitons jamais un partenaire sur son propre client."
        actions={
          <GatedAction autorise={autorise('reseller.manage')} message={refus('reseller.manage')}>
            <Button iconBefore={<Plus size={14} />} onClick={() => setCreation(true)}>
              Agréer un partenaire
            </Button>
          </GatedAction>
        }
        meta={
          <>
            <Badge tone="neutral" size="sm">
              {partenaires.items.length} partenaires agréés
            </Badge>
            <Badge tone="neutral" size="sm">
              {clientsTotal} clients finaux
            </Badge>
            {revshareDu > 0 && (
              <Badge tone="warn" size="sm">
                {money(revshareDu)} de partage à verser
              </Badge>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile libelle="Partenaires agréés" valeur={partenaires.items.length} ton="ok" />
        <StatTile
          libelle="Clients finaux"
          valeur={clientsTotal}
          detail={`sur ${ORGANISATIONS.length} organisations`}
        />
        <StatTile
          libelle="Chiffre d’affaires apporté"
          valeur={money(caTotal)}
          ton="ok"
          detail="Cumulé, tous partenaires"
        />
        <StatTile
          libelle="Marge partenaires"
          valeur={money(margeTotal)}
          ton="accent"
          detail="Ce qu’ils gagnent sur nos offres"
        />
        <StatTile
          libelle="Partage à verser"
          valeur={money(revshareDu)}
          ton={revshareDu > 0 ? 'warn' : 'ok'}
          detail="Période en cours de calcul"
        />
      </div>

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {onglet === 'partenaires' && (
        <div className="space-y-4">
          {partenaires.items.map((r) => {
            const clients = ORGANISATIONS.filter((o) => r.clientsFinaux.includes(o.id))
            const releves = RELEVES_REVSHARE.filter((x) => x.reseller === r.nom)
            return (
              <Card key={r.id}>
                <CardHeader
                  titre={
                    <span className="flex flex-wrap items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-[11px] font-bold"
                        style={{
                          background: surfaceMarque(r.theme.primary).fond,
                          color: surfaceMarque(r.theme.primary).texte,
                        }}
                      >
                        {r.nom.slice(0, 2).toUpperCase()}
                      </span>
                      <span>{r.nom}</span>
                    </span>
                  }
                  sousTitre={`${clients.length} clients finaux · ${r.catalogue.length} offres au catalogue · partage de ${r.revsharePct} %`}
                  actions={
                    <span className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="accent" size="sm">
                        {pct(r.revsharePct)} de partage
                      </Badge>
                      <ButtonLink size="sm" variant="secondary" href={`/admin/revendeurs/${r.id}`}>
                        Ouvrir la fiche
                      </ButtonLink>
                    </span>
                  }
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <StatTile
                        libelle="CA apporté"
                        valeur={money(r.caGenere)}
                        ton="ok"
                      />
                      <StatTile libelle="Marge dégagée" valeur={money(r.marge)} ton="accent" />
                      <StatTile libelle="Clients finaux" valeur={clients.length} />
                      <StatTile
                        libelle="Offres revendues"
                        valeur={r.catalogue.length}
                        detail="sur le catalogue complet"
                      />
                    </div>

                    <MicroLabel className="mt-4 mb-2">Clients finaux</MicroLabel>
                    <div className="space-y-1.5">
                      {clients.map((o) => (
                        <Link
                          key={o.id}
                          href={`/admin/organisations/${o.id}`}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2 transition-colors hover:border-p-400"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[12.5px] font-semibold text-ink">
                              {o.nom}
                            </span>
                            <span className="block text-[10.5px] text-g-500">
                              {o.pays}
                              {o.secteur ? ` · ${o.secteur}` : ''}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="tnum text-[12px] font-semibold text-ink">
                              {o.caMensuel ? money(o.caMensuel) : '—'}
                            </span>
                            <Badge
                              tone={
                                o.statut === 'active'
                                  ? 'ok'
                                  : o.statut === 'suspendue'
                                    ? 'warn'
                                    : 'neutral'
                              }
                              dot
                              size="sm"
                            >
                              {o.statut}
                            </Badge>
                          </span>
                        </Link>
                      ))}
                      {clients.length === 0 && (
                        <p className="rounded-[6px] border border-dashed border-g-300 px-3 py-4 text-center text-[12px] text-g-500">
                          Aucun client final rattaché pour l’instant.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-g-300 shadow-none">
                      <CardHeader
                        titre="Marque du partenaire"
                        sousTitre="Le portail est servi sous son domaine et ses couleurs."
                        actions={<Palette size={14} className="text-p-700" />}
                        className="mb-2.5"
                      />
                      <KeyValueList
                        colonnes={1}
                        items={[
                          { cle: 'Domaine', valeur: r.theme.domaine },
                          { cle: 'Couleur principale', valeur: r.theme.primary },
                          { cle: 'Couleur d’accentuation', valeur: r.theme.accent },
                        ]}
                      />
                      <div className="mt-3 flex gap-1.5">
                        <span
                          className="h-6 flex-1 rounded-[4px]"
                          style={{ background: r.theme.primary }}
                        />
                        <span
                          className="h-6 flex-1 rounded-[4px]"
                          style={{ background: r.theme.accent }}
                        />
                      </div>
                    </Card>

                    <Card className="border-g-300 shadow-none">
                      <CardHeader
                        titre="Derniers relevés"
                        sousTitre="Partage de revenus."
                        className="mb-2.5"
                      />
                      {releves.length === 0 ? (
                        <p className="text-[11.5px] text-g-500">Aucun relevé pour ce partenaire.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {releves.slice(0, 4).map((x) => (
                            <div
                              key={x.periode}
                              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-g-100 pb-1.5 last:border-0"
                            >
                              <span className="min-w-0 text-[11.5px] text-ink">{x.periode}</span>
                              <span className="flex shrink-0 items-center gap-2">
                                <span className="tnum text-[11.5px] font-semibold text-ink">
                                  {money(x.montant)}
                                </span>
                                <Badge tone={x.statut === 'réglé' ? 'ok' : 'info'} size="sm">
                                  {x.statut}
                                </Badge>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <ButtonLink size="sm" variant="ghost" className="mt-2.5" href="/admin/revshare">
                        Tous les relevés
                      </ButtonLink>
                    </Card>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {onglet === 'modele' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {MODELE_PARTENAIRE.map((m) => (
              <Card key={m.niveau} className="flex flex-col">
                <CardHeader
                  titre={m.niveau}
                  sousTitre={m.engagement}
                  actions={<Handshake size={15} className="text-p-700" />}
                />
                <p className="text-[12.5px] leading-relaxed text-g-700">{m.description}</p>
                <MicroLabel className="mt-4 mb-2">Ce que l’agrément inclut</MicroLabel>
                <ul className="space-y-1.5">
                  {m.inclus.map((x) => (
                    <li key={x} className="text-[11.5px] leading-relaxed text-ink">
                      · {x}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto border-t border-g-100 pt-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="type-micro text-g-500">Remise sur le tarif public</span>
                    <span className="text-[13px] font-bold text-m-600">{m.remise}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader
              titre="Ce que l’agrément apporte concrètement"
              sousTitre="Au-delà de la remise, ce qui fait qu’un partenaire peut réellement vendre."
              actions={<TrendingUp size={15} className="text-p-700" />}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  t: 'Portail sous sa marque',
                  d: 'Son domaine, son logo, ses couleurs. Le client final voit le partenaire, pas nous — sauf mention légale obligatoire de l’exploitant, que nous ne masquons jamais.',
                },
                {
                  t: 'Accès au catalogue technique',
                  d: 'Fiches techniques détaillées, spécifications d’architecture, réponses aux questions d’appel d’offres. De quoi répondre à un cahier des charges sans nous solliciter.',
                },
                {
                  t: 'Support de deuxième niveau',
                  d: 'Le partenaire assure le premier niveau. Au-delà, il ouvre un ticket chez nous avec le même engagement de délai que ses propres clients.',
                },
                {
                  t: 'Formation et certification',
                  d: 'Deux sessions par an, prises en charge. Un partenaire qui ne maîtrise pas la plateforme finit par nous remonter tous ses tickets, ce qui ne sert personne.',
                },
                {
                  t: 'Protection du compte',
                  d: 'Un client apporté par un partenaire ne peut pas être démarché en direct par nos équipes. Cette règle est dans le contrat, pas seulement dans les intentions.',
                },
                {
                  t: 'Prix garanti sur l’engagement',
                  d: 'Le prix d’achat du partenaire est garanti pour la durée de l’engagement de son client, même si notre grille évolue.',
                },
                {
                  t: 'Accompagnement avant-vente',
                  d: 'Nos ingénieurs participent aux rendez-vous techniques d’un dossier significatif, en soutien du partenaire et sous sa conduite.',
                },
                {
                  t: 'Relevé de partage mensuel',
                  d: 'Détail par client, par offre et par ligne. Un partenaire doit pouvoir vérifier son relevé, pas le prendre pour argent comptant.',
                },
              ].map((x) => (
                <div key={x.t} className="rounded-[8px] border border-g-300 p-3.5">
                  <p className="text-[12.5px] font-bold text-ink">{x.t}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-g-700">{x.d}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {onglet === 'regles' && (
        <div className="space-y-4">
          <Callout ton="violet" titre="Un réseau de partenaires se détruit par un seul manquement">
            Court-circuiter un partenaire sur son client, casser son prix, ou récupérer son compte au
            renouvellement : chacune de ces pratiques rapporte une fois et coûte le réseau entier. Nous
            avons écrit ces règles pour nous les imposer, et un partenaire peut les invoquer
            contractuellement.
          </Callout>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader titre="Ce que nous nous interdisons" />
              <div className="space-y-2">
                {[
                  {
                    r: 'Démarcher en direct un client apporté par un partenaire',
                    d: 'Si ce client nous contacte, nous le renvoyons vers son partenaire et nous en informons celui-ci. Sans exception, y compris à l’échéance du contrat.',
                  },
                  {
                    r: 'Vendre au prix direct sous le prix de vente d’un partenaire sur son client',
                    d: 'Le prix direct est public : un partenaire sait donc à quoi s’en tenir. Nous ne consentons pas de remise exceptionnelle qui viendrait le sous-coter.',
                  },
                  {
                    r: 'Modifier une remise partenaire sans préavis',
                    d: 'Toute évolution de la grille partenaire fait l’objet de six mois de préavis, et ne s’applique pas aux engagements en cours.',
                  },
                  {
                    r: 'Récupérer un compte à la sortie d’un partenaire',
                    d: 'Si un partenaire cesse son activité, le client choisit : un autre partenaire, ou le direct. Nous ne préemptons pas ce choix.',
                  },
                  {
                    r: 'Communiquer sur un client final sans l’accord du partenaire',
                    d: 'Y compris pour une étude de cas ou une référence commerciale. C’est son client, pas le nôtre.',
                  },
                ].map((x) => (
                  <div key={x.r} className="rounded-[6px] border border-p-300 bg-p-050 px-3 py-2.5">
                    <p className="text-[12.5px] font-semibold text-ink">{x.r}</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-700">{x.d}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader titre="Ce que nous attendons du partenaire" />
              <div className="space-y-2">
                {[
                  {
                    r: 'Assurer réellement le premier niveau de support',
                    d: 'Un partenaire qui nous remonte tous les tickets sans les qualifier ne remplit pas son rôle, et son client s’en aperçoit avant nous.',
                  },
                  {
                    r: 'Ne pas survendre des capacités inexistantes',
                    d: 'Promettre une fonctionnalité que la plateforme n’a pas engage notre nom autant que le sien. Le catalogue technique existe pour éviter cela.',
                  },
                  {
                    r: 'Répercuter les communications d’incident',
                    d: 'Quand un incident touche un client final, le partenaire doit le prévenir. Nous lui envoyons l’information ; le relais lui appartient.',
                  },
                  {
                    r: 'Maintenir au moins une personne certifiée',
                    d: 'La certification est gratuite et se renouvelle chaque année. Sans personne certifiée, l’agrément est suspendu.',
                  },
                  {
                    r: 'Ne pas facturer au client des prestations que nous assurons déjà',
                    d: 'Facturer une sauvegarde incluse dans l’offre, ou une supervision que nous fournissons, est un motif de retrait d’agrément.',
                  },
                ].map((x) => (
                  <div key={x.r} className="rounded-[6px] border border-g-300 px-3 py-2.5">
                    <p className="text-[12.5px] font-semibold text-ink">{x.r}</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-g-700">{x.d}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              titre="Recours du client final"
              sousTitre="Ce qui se passe quand un partenaire ne tient pas son rôle."
            />
            <ol className="space-y-2.5">
              {[
                {
                  t: 'Le client peut nous saisir directement',
                  d: 'Même si son contrat passe par un partenaire. Nous n’opposons jamais « voyez avec votre revendeur » à un client dont le service est en panne.',
                },
                {
                  t: 'Nous traitons l’incident technique sans attendre',
                  d: 'La panne d’abord, la question contractuelle ensuite. Laisser un service en panne au motif que le contrat passe par un tiers est indéfendable.',
                },
                {
                  t: 'Nous en informons le partenaire',
                  d: 'Il doit savoir que son client nous a saisis, et pourquoi. Ce n’est pas une dénonciation : c’est ce qui lui permet de corriger.',
                },
                {
                  t: 'Un manquement répété entraîne un retrait d’agrément',
                  d: 'Après avertissement écrit et délai de correction. Le client est alors libre de choisir un autre partenaire ou le direct, sans rupture de service.',
                },
              ].map((x, i) => (
                <li key={x.t} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-p-050 text-[11px] font-bold text-p-700">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-ink">{x.t}</span>
                    <span className="block text-[11.5px] leading-relaxed text-g-500">{x.d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}

      <Modal
        open={creation}
        onClose={() => setCreation(false)}
        title="Agréer un partenaire"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreation(false)}>
              Annuler
            </Button>
            <Button disabled={nom.trim().length === 0} onClick={agreer}>
              Agréer le partenaire
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Raison sociale du partenaire" required>
            <Input
              placeholder="Nom de l’entreprise partenaire"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Niveau de partenariat">
              <Select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
                {MODELE_PARTENAIRE.map((m) => (
                  <option key={m.niveau} value={m.niveau}>
                    {m.niveau} — remise {m.remise}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Partage de revenus" hint="pourcentage reversé au partenaire">
              <Input
                type="number"
                min={0}
                max={40}
                value={revsharePct}
                suffix="%"
                onChange={(e) => setRevsharePct(Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Domaine du portail sous sa marque" hint="il devra créer un CNAME vers nos serveurs">
            <Input
              placeholder="cloud.partenaire.ci"
              value={domaine}
              onChange={(e) => setDomaine(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Couleur principale">
              <Input
                type="color"
                value={primary}
                className="h-10"
                onChange={(e) => setPrimary(e.target.value)}
              />
            </Field>
            <Field label="Couleur d’accentuation">
              <Input
                type="color"
                value={accent}
                className="h-10"
                onChange={(e) => setAccent(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Contact administratif" hint="recevra l’invitation d’administrateur">
            <Input
              type="email"
              placeholder="direction@partenaire.ci"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </Field>
          <div className="space-y-3">
            <Switch
              checked={catalogueComplet}
              onChange={setCatalogueComplet}
              label="Accès au catalogue technique complet"
              description="Fiches détaillées, spécifications d’architecture, réponses aux questions d’appel d’offres."
            />
            <Switch
              checked
              disabled
              label="Protection des comptes apportés"
              description="Non désactivable. Un client apporté par ce partenaire ne pourra pas être démarché en direct par nos équipes."
            />
            <Switch
              checked={releveDetaille}
              onChange={setReleveDetaille}
              label="Relevé de partage mensuel détaillé"
              description="Ligne par ligne, client par client, vérifiable."
            />
            <Switch
              checked={facturationDirecte}
              onChange={setFacturationDirecte}
              label="Facturation directe des clients finaux par le partenaire"
              description="Le partenaire facture lui-même ses clients et nous règle en gros. Exige une garantie financière."
            />
          </div>
          <Callout ton="info" titre="Ce que l’agrément engage de notre côté">
            La protection des comptes qu’il apporte, un prix d’achat garanti sur la durée des
            engagements de ses clients, six mois de préavis sur toute évolution de grille, et un support
            de deuxième niveau au même engagement de délai que nos clients directs.
          </Callout>
        </div>
      </Modal>
    </div>
  )
}
