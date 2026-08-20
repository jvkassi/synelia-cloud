'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Handshake, Palette, Pause, Play, Plus, TrendingUp } from 'lucide-react'
import { slugify, surfaceMarque } from '@/lib/utils'
import { money, pct } from '@/lib/format'
import { MODELE_PARTENAIRE, OFFRES } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { ConfirmDialog, Modal } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { useApp } from '@/components/app/contexte'
import { useActe, useAtelier } from '@/components/app/atelier'
import type { Reseller } from '@/lib/types'

const ONGLETS = [
  { id: 'partenaires', label: 'Partenaires' },
  { id: 'modele', label: 'Modèle de partenariat' },
  { id: 'regles', label: 'Règles de conduite' },
]

const FORMULAIRE_VIDE = {
  nom: '',
  niveau: 'Revendeur',
  revsharePct: 22,
  domaine: '',
  primary: '#1B3A5C',
  accent: '#E8952B',
  contact: '',
  catalogueTechnique: true,
  releveDetaille: true,
  facturationDirecte: false,
}

export default function Revendeurs() {
  const { autorise, refus } = useApp()
  const { revendeurs, organisations, revshare } = useAtelier()
  const acte = useActe()

  const [onglet, setOnglet] = useState('partenaires')
  const [creation, setCreation] = useState(false)
  const [form, setForm] = useState(FORMULAIRE_VIDE)
  const [retrait, setRetrait] = useState<Reseller | null>(null)

  const liste = revendeurs.liste
  const caTotal = liste.reduce((a, r) => a + r.caGenere, 0)
  const margeTotal = liste.reduce((a, r) => a + r.marge, 0)
  const clientsTotal = liste.reduce((a, r) => a + r.clientsFinaux.length, 0)
  const revshareDu = revshare.liste
    .filter((r) => r.statut !== 'réglé')
    .reduce((a, r) => a + r.montant, 0)

  const modifierForm = <C extends keyof typeof FORMULAIRE_VIDE>(
    champ: C,
    valeur: (typeof FORMULAIRE_VIDE)[C],
  ) => setForm((f) => ({ ...f, [champ]: valeur }))

  const nomValide = form.nom.trim().length >= 2
  const domaineValide = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(form.domaine.trim())
  const contactValide = /.+@.+\..+/.test(form.contact.trim())
  const formValide = nomValide && domaineValide && contactValide

  const agreer = () => {
    const nom = form.nom.trim()
    const base = slugify(nom).slice(0, 20) || 'partenaire'
    let idOrg = `org-${base}`
    let n = 2
    while (organisations.parId(idOrg)) {
      idOrg = `org-${base}-${n}`
      n += 1
    }
    const idRevendeur = `res-${idOrg.slice(4)}`
    const partenaire: Reseller = {
      id: idRevendeur,
      orgId: idOrg,
      nom,
      theme: {
        logoUrl: `/logos/${base}.svg`,
        primary: form.primary,
        accent: form.accent,
        domaine: form.domaine.trim().toLowerCase(),
      },
      // Grille d'achat amorcée sur les offres publiées, à la remise du niveau
      // choisi : un partenaire agréé sans grille ne peut rien vendre.
      grille: OFFRES.filter((o) => o.statut === 'publiee' && !o.surDevis).map((o) => ({
        offerId: o.id,
        prixAchat: o.prix.revendeur,
        prixVente: o.prix.direct,
      })),
      catalogue: form.catalogueTechnique ? ['drive-pro', 'email-pro', 'visio'] : [],
      revsharePct: form.revsharePct,
      clientsFinaux: [],
      caGenere: 0,
      marge: 0,
      statut: 'onboarding',
    }

    acte({
      faire: () => {
        revendeurs.ajouter(partenaire)
        organisations.ajouter({
          id: idOrg,
          nom,
          pays: 'Côte d’Ivoire',
          secteur: 'Partenaire revendeur',
          type: 'revendeur',
          statut: 'active',
          createdAt: '2026-08-19',
          espaces: 0,
          utilisateurs: 1,
          caMensuel: 0,
          consommationVcpu: 0,
          tenantPlan: 'Partenaire',
          domaine: form.domaine.trim().toLowerCase(),
        })
      },
      titre: `${nom} agréé`,
      detail: `Portail servi sur ${form.domaine.trim().toLowerCase()}, grille d’achat amorcée sur ${partenaire.grille.length} offres, invitation envoyée à ${form.contact.trim()}. L’agrément reste en phase d’intégration jusqu’à la première certification.`,
      action: 'reseller.create',
      cible: idRevendeur,
      orgId: idOrg,
      orgNom: nom,
    })
    setForm(FORMULAIRE_VIDE)
    setCreation(false)
  }

  const basculerAgrement = (r: Reseller) => {
    const suspendre = r.statut !== 'suspendu'
    acte({
      faire: () => revendeurs.modifier(r.id, { statut: suspendre ? 'suspendu' : 'actif' }),
      ton: suspendre ? 'warn' : 'ok',
      titre: suspendre ? `Agrément de ${r.nom} suspendu` : `Agrément de ${r.nom} rétabli`,
      detail: suspendre
        ? 'Il ne peut plus souscrire de nouvelle offre. Ses clients finaux continuent d’être servis normalement — une suspension d’agrément ne se répercute jamais sur eux.'
        : 'Il peut de nouveau souscrire. Sa grille d’achat est celle qui était garantie avant la suspension.',
      action: suspendre ? 'reseller.suspend' : 'reseller.reactivate',
      cible: r.id,
      orgNom: r.nom,
    })
  }

  const retirerAgrement = (r: Reseller) => {
    acte({
      faire: () => {
        revendeurs.supprimer(r.id)
        organisations.modifier(r.orgId, { statut: 'fermee' })
        r.clientsFinaux.forEach((idClient) =>
          organisations.modifier(idClient, { type: 'direct', resellerId: undefined }),
        )
      },
      ton: 'warn',
      titre: `Agrément de ${r.nom} retiré`,
      detail: `${r.clientsFinaux.length} client${r.clientsFinaux.length > 1 ? 's' : ''} final${r.clientsFinaux.length > 1 ? 'aux' : ''} basculé${r.clientsFinaux.length > 1 ? 's' : ''} en direct, sans rupture de service. Chacun reste libre de choisir un autre partenaire.`,
      action: 'reseller.delete',
      cible: r.id,
      orgNom: r.nom,
    })
    setRetrait(null)
  }

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
              {liste.length} partenaires agréés
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
        <StatTile libelle="Partenaires agréés" valeur={liste.length} ton="ok" />
        <StatTile
          libelle="Clients finaux"
          valeur={clientsTotal}
          detail={`sur ${organisations.liste.length} organisations`}
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
          {liste.length === 0 && (
            <Card>
              <p className="rounded-[8px] border border-dashed border-g-300 px-4 py-10 text-center text-[12.5px] text-g-500">
                Aucun partenaire agréé. Un revendeur porte la relation commerciale et le premier
                niveau de support : c’est ce qui permet de couvrir un pays sans y ouvrir de bureau.
              </p>
            </Card>
          )}
          {liste.map((r) => {
            const clients = organisations.liste.filter((o) => r.clientsFinaux.includes(o.id))
            const releves = revshare.liste.filter((x) => x.reseller === r.nom)
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
                      <Badge
                        tone={
                          r.statut === 'actif'
                            ? 'ok'
                            : r.statut === 'onboarding'
                              ? 'info'
                              : 'warn'
                        }
                        dot
                        size="sm"
                      >
                        {r.statut === 'actif'
                          ? 'Agrément actif'
                          : r.statut === 'onboarding'
                            ? 'En intégration'
                            : 'Agrément suspendu'}
                      </Badge>
                      <Badge tone="accent" size="sm">
                        {pct(r.revsharePct)} de partage
                      </Badge>
                      <ButtonLink size="sm" variant="secondary" href={`/admin/revendeurs/${r.id}`}>
                        Ouvrir la fiche
                      </ButtonLink>
                      <GatedAction
                        autorise={autorise('reseller.manage')}
                        message={refus('reseller.manage')}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          iconBefore={
                            r.statut === 'suspendu' ? <Play size={12} /> : <Pause size={12} />
                          }
                          onClick={() => basculerAgrement(r)}
                        >
                          {r.statut === 'suspendu' ? 'Rétablir' : 'Suspendre'}
                        </Button>
                      </GatedAction>
                      <GatedAction
                        autorise={autorise('reseller.manage')}
                        message={refus('reseller.manage')}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-err hover:bg-err-bg"
                          onClick={() => setRetrait(r)}
                        >
                          Retirer l’agrément
                        </Button>
                      </GatedAction>
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
            <Button disabled={!formValide} onClick={agreer}>
              Agréer le partenaire
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Raison sociale du partenaire"
            required
            error={form.nom !== '' && !nomValide ? 'Deux caractères au minimum.' : undefined}
          >
            <Input
              value={form.nom}
              onChange={(e) => modifierForm('nom', e.target.value)}
              placeholder="Nom de l’entreprise partenaire"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Niveau de partenariat">
              <Select
                value={form.niveau}
                onChange={(e) => modifierForm('niveau', e.target.value)}
              >
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
                max={60}
                value={form.revsharePct}
                onChange={(e) =>
                  modifierForm(
                    'revsharePct',
                    Math.min(60, Math.max(0, Number(e.target.value) || 0)),
                  )
                }
                suffix="%"
              />
            </Field>
          </div>
          <Field
            label="Domaine du portail sous sa marque"
            required
            hint="il devra créer un CNAME vers nos serveurs"
            error={
              form.domaine !== '' && !domaineValide
                ? 'Un nom de domaine complet est attendu — cloud.partenaire.ci.'
                : undefined
            }
          >
            <Input
              value={form.domaine}
              onChange={(e) => modifierForm('domaine', e.target.value)}
              placeholder="cloud.partenaire.ci"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Couleur principale">
              <Input
                type="color"
                value={form.primary}
                onChange={(e) => modifierForm('primary', e.target.value)}
                className="h-10"
              />
            </Field>
            <Field label="Couleur d’accentuation">
              <Input
                type="color"
                value={form.accent}
                onChange={(e) => modifierForm('accent', e.target.value)}
                className="h-10"
              />
            </Field>
          </div>
          <Field
            label="Contact administratif"
            required
            hint="recevra l’invitation d’administrateur"
            error={
              form.contact !== '' && !contactValide ? 'Adresse électronique invalide.' : undefined
            }
          >
            <Input
              type="email"
              value={form.contact}
              onChange={(e) => modifierForm('contact', e.target.value)}
              placeholder="direction@partenaire.ci"
            />
          </Field>
          <div className="space-y-3">
            <Switch
              checked={form.catalogueTechnique}
              onChange={(v) => modifierForm('catalogueTechnique', v)}
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
              checked={form.releveDetaille}
              onChange={(v) => modifierForm('releveDetaille', v)}
              label="Relevé de partage mensuel détaillé"
              description="Ligne par ligne, client par client, vérifiable."
            />
            <Switch
              checked={form.facturationDirecte}
              onChange={(v) => modifierForm('facturationDirecte', v)}
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

      <ConfirmDialog
        open={retrait !== null}
        onClose={() => setRetrait(null)}
        titre="Retirer un agrément"
        ressource={retrait?.nom ?? ''}
        libelleAction="Retirer l’agrément"
        pertes={[
          'Le portail sous sa marque cesse d’être servi',
          'Sa grille d’achat est retirée : plus aucune souscription nouvelle n’est possible',
          `Ses ${retrait?.clientsFinaux.length ?? 0} clients finaux basculent en direct, sans rupture de service`,
          'Chaque client reste libre de choisir un autre partenaire — nous ne préemptons pas ce choix',
        ]}
        onConfirm={() => retrait && retirerAgrement(retrait)}
      />
    </div>
  )
}
