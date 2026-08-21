'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRightLeft, Globe, Search, Server, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateCourte, money, num } from '@/lib/format'
import { SITE_LABEL } from '@/lib/types'
import { DOMAINES, SITES_WEB, entreesWebCloud, joursAvant, sitesDeLHebergement } from '@/lib/mock'
import type { Domaine } from '@/lib/types'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { Field, Input, Select } from '@/components/ui/field'
import { PageHeader, Card, CardHeader, Callout } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { useApp } from '@/components/app/contexte'
import { useCollection } from '@/components/app/atelier'
import { BoutonAction, BoutonFormulaire, useOperation } from '@/components/app/actions'

/** Tarifs annuels indicatifs, en francs CFA. */
const EXTENSIONS = [
  { ext: '.ci', prix: 18000, note: 'Extension ivoirienne — nous sommes bureau d’enregistrement accrédité' },
  { ext: '.africa', prix: 15000, note: 'Extension continentale' },
  { ext: '.com', prix: 9500, note: 'La plus recherchée' },
  { ext: '.net', prix: 9500 },
  { ext: '.org', prix: 9500 },
  { ext: '.tech', prix: 21000 },
]

export default function PortefeuilleWebCloud() {
  const { autorise, refus } = useApp()
  const executer = useOperation()
  const portefeuille = useCollection<Domaine>('domaines', DOMAINES)
  const [recherche, setRecherche] = useState('')
  const [extension, setExtension] = useState('.ci')
  const [aTransferer, setATransferer] = useState('')

  /** Un nom pris est un nom déjà dans le portefeuille : le reste est libre. */
  const nomComplet = `${recherche.trim().toLowerCase()}${extension}`
  const dejaPris = portefeuille.items.some((d) => d.nom === nomComplet)

  const enregistrer = (nom: string, ext: string) =>
    executer({
      action: 'service.admin',
      titre: `${nom} enregistré`,
      detail: 'Le titulaire déclaré au registre est votre organisation, jamais Synelia.',
      job: {
        type: 'domaine.register',
        label: `Enregistrement de ${nom}`,
        etapes: [
          'Vérifier la disponibilité au registre',
          'Déposer le nom',
          'Créer la zone DNS',
          'Activer la protection WHOIS',
        ],
        dureeEtapeMs: 1100,
      },
      effetFinal: () =>
        portefeuille.creer({
          id: portefeuille.identifiant('dom'),
          orgId: 'org-dba',
          nom,
          extension: ext,
          expiration: '2027-08-19',
          renouvellementAuto: true,
          whoisProtege: true,
          verrouTransfert: true,
        }),
    })

  const entrees = entreesWebCloud()
  const heberges = entrees.filter((e) => e.hebergement)
  const sansRenouvellement = entrees.filter(
    (e) => e.domaine && !e.domaine.renouvellementAuto,
  )
  const prochaine = entrees
    .filter((e) => e.domaine)
    .sort((a, b) => joursAvant(a.domaine!.expiration) - joursAvant(b.domaine!.expiration))[0]

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Web Cloud', href: '/app/web' },
          { label: 'Domaines' },
        ]}
        titre="Domaines"
        sousTitre="Un domaine est attaché à un serveur et à un seul. Sur ce serveur vivent vos sites, vos bases, vos accès fichiers et vos services partagés — tout se règle depuis la fiche du domaine, dans le panneau de gauche."
        actions={
          <>
            <BoutonFormulaire
              libelle="Enregistrer un domaine"
              size="md"
              variant="primary"
              icone={<Globe size={14} />}
              action="service.admin"
              titre="Enregistrer un nom de domaine"
              description="Le titulaire déclaré au registre est votre organisation. Vous pouvez demander le code de transfert à tout moment, sans justification."
              champs={[
                { id: 'nom', label: 'Nom recherché', placeholder: 'mon-entreprise', obligatoire: true },
                {
                  id: 'extension',
                  label: 'Extension',
                  type: 'select',
                  options: EXTENSIONS.map((x) => ({ value: x.ext, label: `${x.ext} · ${money(x.prix)} / an` })),
                },
                { id: 'whois', label: 'Protection WHOIS', type: 'switch', placeholder: 'Activée' },
                { id: 'auto', label: 'Renouvellement automatique', type: 'switch', placeholder: 'Activé' },
              ]}
              valeursDepart={{ extension: '.ci', whois: true, auto: true }}
              libelleValider="Enregistrer"
              operation={(v) => {
                const nom = `${String(v.nom).trim().toLowerCase()}${v.extension}`
                return {
                  titre: `${nom} enregistré`,
                  detail: `${money(EXTENSIONS.find((x) => x.ext === v.extension)?.prix ?? 9500)} par an, au prorata du mois en cours.`,
                  job: {
                    type: 'domaine.register',
                    label: `Enregistrement de ${nom}`,
                    etapes: [
                      'Vérifier la disponibilité au registre',
                      'Déposer le nom',
                      'Créer la zone DNS',
                      ...(v.whois ? ['Activer la protection WHOIS'] : []),
                    ],
                    dureeEtapeMs: 1100,
                  },
                  effetFinal: () =>
                    portefeuille.creer({
                      id: portefeuille.identifiant('dom'),
                      orgId: 'org-dba',
                      nom,
                      extension: String(v.extension),
                      expiration: '2027-08-19',
                      renouvellementAuto: Boolean(v.auto),
                      whoisProtege: Boolean(v.whois),
                      verrouTransfert: true,
                    }),
                }
              }}
            />
            <BoutonFormulaire
              libelle="Transférer"
              size="md"
              icone={<ArrowRightLeft size={14} />}
              action="service.admin"
              titre="Transférer un domaine vers Synelia"
              description="Nous copions la zone actuelle avant la bascule et vous la faites vérifier : votre site ne coupe pas."
              champs={[
                { id: 'domaine', label: 'Domaine à transférer', placeholder: 'mon-entreprise.ci', obligatoire: true },
                { id: 'code', label: 'Code d’autorisation', placeholder: 'fourni par votre bureau d’enregistrement actuel', obligatoire: true },
              ]}
              libelleValider="Lancer le transfert"
              operation={(v) => ({
                ton: 'info',
                titre: `Transfert de ${v.domaine} engagé`,
                detail: 'Cinq à sept jours pour un .com, jusqu’à dix jours ouvrés pour un .ci : le registre impose son délai.',
                job: {
                  type: 'domaine.transfer',
                  label: `Transfert de ${v.domaine}`,
                  etapes: [
                    'Vérifier le code d’autorisation',
                    'Recopier la zone actuelle',
                    'Demander le transfert au registre',
                    'Attendre la confirmation du registre',
                  ],
                },
                effetFinal: () =>
                  portefeuille.creer({
                    id: portefeuille.identifiant('dom'),
                    orgId: 'org-dba',
                    nom: String(v.domaine),
                    extension: `.${String(v.domaine).split('.').pop()}`,
                    expiration: '2027-08-19',
                    renouvellementAuto: true,
                    whoisProtege: true,
                    verrouTransfert: true,
                  }),
              })}
            />
          </>
        }
      />

      {sansRenouvellement.length > 0 && (
        <Callout
          ton="warn"
          titre={`${sansRenouvellement.length} domaine${sansRenouvellement.length > 1 ? 's' : ''} sans renouvellement automatique`}
        >
          {sansRenouvellement.map((e) => (
            <span key={e.id} className="mr-3 inline-block">
              <Link href={`/app/web/domaines/${encodeURIComponent(e.id)}`} className="font-mono font-semibold underline">
                {e.nom}
              </Link>{' '}
              <span className="tnum">— {joursAvant(e.domaine!.expiration)} jours</span>
            </span>
          ))}
          <span className="mt-1.5 block">
            À l’échéance, le nom retourne au registre et les services qui en dépendent s’arrêtent.
            C’est le seul incident que personne ne voit venir.
          </span>
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile libelle="Domaines" valeur={entrees.length} detail="dans le portefeuille" />
        <StatTile
          libelle="Avec hébergement"
          valeur={heberges.length}
          detail={`${entrees.length - heberges.length} sans serveur`}
        />
        <StatTile
          libelle="Sites en ligne"
          valeur={SITES_WEB.filter((s) => s.statut === 'en_ligne').length}
          detail={`sur ${SITES_WEB.length} installés`}
        />
        <StatTile
          libelle="Échéance la plus proche"
          valeur={prochaine ? `${joursAvant(prochaine.domaine!.expiration)} j` : '—'}
          detail={prochaine?.nom}
          ton={
            prochaine && joursAvant(prochaine.domaine!.expiration) <= 60 ? 'warn' : 'neutral'
          }
        />
      </div>

      <Card padding={false}>
        <div className="border-b border-g-100 px-4 py-3">
          <p className="text-[13px] font-bold text-ink">Portefeuille</p>
          <p className="mt-0.5 text-[12px] text-g-500">
            Une ligne par nom. Choisissez-en un dans le panneau pour ouvrir sa fiche complète.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse">
            <thead>
              <tr className="border-b border-g-300 bg-g-050">
                {['Nom', 'Hébergement', 'Sites', 'Espace', 'Échéance', 'État', ''].map((h) => (
                  <th key={h} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entrees.map((e) => {
                const sites = e.hebergement ? sitesDeLHebergement(e.hebergement.id) : []
                return (
                  <tr key={e.id} className="border-b border-g-100 last:border-0">
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/app/web/domaines/${encodeURIComponent(e.id)}`}
                        className="block font-mono text-[12.5px] font-semibold text-ink hover:text-p-700"
                      >
                        {e.nom}
                      </Link>
                      {e.provisoire && (
                        <span className="mt-0.5 block text-[11px] text-warn">Nom provisoire</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {e.hebergement ? (
                        <span className="flex items-center gap-1.5">
                          <Server size={12} className="text-p-700" />
                          <span className="text-[12px] font-semibold text-ink">
                            {e.hebergement.palier}
                          </span>
                          <span className="text-[11.5px] text-g-500">
                            {SITE_LABEL[e.hebergement.serveur.site]}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[12px] text-g-500">Aucun</span>
                      )}
                    </td>
                    <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                      {sites.length > 0 ? sites.length : '—'}
                    </td>
                    <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                      {e.hebergement
                        ? `${e.hebergement.espaceUtiliseGo.toFixed(1)} / ${e.hebergement.espaceTotalGo} Go`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-g-700">
                      {e.domaine ? (
                        <span className="tnum">
                          {dateCourte(e.domaine.expiration)}
                          <span
                            className={cn(
                              'ml-1.5 text-[11px] font-semibold',
                              joursAvant(e.domaine.expiration) <= 60 ? 'text-warn' : 'text-g-500',
                            )}
                          >
                            {joursAvant(e.domaine.expiration)} j
                          </span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={e.ton} size="sm">
                        {e.etat}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/app/web/domaines/${encodeURIComponent(e.id)}`}
                        className="text-[12px] font-semibold text-p-700 hover:text-m-600"
                      >
                        Gérer →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            titre="Enregistrer un nom de domaine"
            sousTitre="Le titulaire déclaré au registre est votre organisation, jamais Synelia. Vous pouvez demander le code de transfert à tout moment, sans justification."
          />
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Nom recherché" className="min-w-0 flex-1">
              <Input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="mon-entreprise"
              />
            </Field>
            <Field label="Extension" className="w-32">
              <Select value={extension} onChange={(e) => setExtension(e.target.value)}>
                {EXTENSIONS.map((x) => (
                  <option key={x.ext} value={x.ext}>
                    {x.ext}
                  </option>
                ))}
              </Select>
            </Field>
            <Button
              iconBefore={<Search size={14} />}
              disabled={!recherche.trim()}
              onClick={() =>
                executer({
                  ton: dejaPris ? 'warn' : 'ok',
                  titre: dejaPris ? `${nomComplet} est déjà dans votre portefeuille` : `${nomComplet} est disponible`,
                  detail: dejaPris
                    ? 'Ouvrez sa fiche pour le gérer.'
                    : `${money(EXTENSIONS.find((x) => x.ext === extension)?.prix ?? 9500)} par an — enregistrez-le depuis le bouton en haut de page.`,
                })
              }
            >
              Vérifier
            </Button>
          </div>

          <ul className="mt-4 divide-y divide-g-100 border-t border-g-100 pt-1">
            {EXTENSIONS.map((x) => (
              <li key={x.ext} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="font-mono text-[12.5px] font-bold text-ink">{x.ext}</span>
                  {x.note && (
                    <span className="ml-2 text-[11.5px] text-g-500">{x.note}</span>
                  )}
                </span>
                <span className="tnum shrink-0 text-[12.5px] font-semibold text-ink">
                  {money(x.prix)} / an
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            titre="Transférer un domaine vers Synelia"
            sousTitre="Le transfert ne coupe pas votre site : nous copions la zone actuelle avant la bascule, vous la vérifiez, puis le registre change de bureau d’enregistrement."
          />
          <ol className="space-y-2.5">
            {[
              'Déverrouillez le transfert chez votre bureau d’enregistrement actuel.',
              'Récupérez le code d’autorisation qu’il vous fournit.',
              'Collez-le ici : nous vérifions le code et recopions la zone.',
              'Vous validez la zone recopiée, puis nous lançons le transfert.',
            ].map((t, i) => (
              <li key={t} className="flex gap-2.5">
                <span className="tnum mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-p-100 text-[11px] font-bold text-p-700">
                  {i + 1}
                </span>
                <span className="text-[12.5px] leading-relaxed text-g-700">{t}</span>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-g-100 pt-4">
            <Field label="Domaine à transférer" className="min-w-0 flex-1">
              <Input
                value={aTransferer}
                onChange={(e) => setATransferer(e.target.value)}
                placeholder="mon-entreprise.ci"
              />
            </Field>
            <BoutonAction
              libelle="Vérifier l’éligibilité"
              size="md"
              desactive={!aTransferer.trim()}
              operation={{
                ton: 'info',
                titre: `${aTransferer} est transférable`,
                detail:
                  'Le domaine a plus de 60 jours et n’est pas verrouillé. Il vous reste à fournir le code d’autorisation.',
              }}
            />
          </div>

          <Callout ton="info" className="mt-3" titre="Durée réelle">
            Cinq à sept jours pour un <span className="font-mono">.com</span>, et jusqu’à dix jours
            ouvrés pour un <span className="font-mono">.ci</span> — le registre impose son propre
            délai, que nous ne pouvons pas raccourcir.
          </Callout>
        </Card>
      </div>

      <Card>
        <CardHeader
          titre="Pourquoi un domaine et un seul serveur"
          sousTitre="C’est la règle du produit, et elle a des conséquences qu’il vaut mieux connaître avant de commander."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              t: 'Ce que vous y gagnez',
              d: 'Un seul endroit pour tout ce qui concerne un nom : ses sites, ses bases, ses accès, sa messagerie, sa zone. Pas de nom qui réapparaît dans trois listes différentes.',
              i: <ShieldCheck size={15} />,
            },
            {
              t: 'Plusieurs sites, un serveur',
              d: 'Vous installez autant de sites que vous voulez, chacun sur son sous-domaine, avec sa version de PHP et son certificat. Ils partagent le processeur et la mémoire du serveur.',
              i: <Globe size={15} />,
            },
            {
              t: 'La contrepartie',
              d: 'Une boutique qui sature le serveur ralentit le blog installé à côté. Pour isoler un site, il faut un second hébergement — ou une application dédiée dans un projet.',
              i: <Server size={15} />,
            },
          ].map((c) => (
            <div key={c.t} className="rounded-[8px] border border-g-300 bg-g-050 p-3">
              <p className="flex items-center gap-1.5 text-p-700">{c.i}</p>
              <p className="mt-1.5 text-[12.5px] font-bold text-ink">{c.t}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-g-700">{c.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-g-500">
          Besoin d’isolation stricte, de conteneurs ou d’une base managée à part ?{' '}
          <Link href="/app/projets" className="font-semibold text-p-700 hover:text-m-600">
            Les projets applicatifs
          </Link>{' '}
          répondent à ce besoin — {num(SITES_WEB.length)} sites mutualisés ne remplacent pas une
          application dédiée.
        </p>
      </Card>
    </div>
  )
}
