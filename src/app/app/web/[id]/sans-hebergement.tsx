'use client'

import { useState } from 'react'
import { ArrowRightLeft, Globe, Lock, ServerCog, ShieldCheck } from 'lucide-react'
import { dateCourte } from '@/lib/format'
import { abonnementDeLEntree, type EntreeWebCloud } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { PageHeader, Card, CardHeader, Callout, KeyValueList } from '@/components/composition/card'
import { EmptyState } from '@/components/composition/states'
import { CarteAbonnement } from '@/components/business/abonnement'
import { EditeurZone } from '@/components/business/editeur-zone'
import { useApp } from '@/components/app/contexte'

/**
 * Fiche d'un domaine auquel aucun serveur n'est attaché.
 *
 * Deux onglets suffisent : l'état au registre, et la zone. Afficher les dix
 * onglets d'un hébergement en les grisant serait pire que de ne pas les
 * afficher — le client croirait avoir perdu quelque chose.
 */
export function FicheSansHebergement({ entree }: { entree: EntreeWebCloud }) {
  const { autorise, refus } = useApp()
  const [onglet, setOnglet] = useState('apercu')
  const d = entree.domaine
  const abonnement = abonnementDeLEntree(entree)

  const onglets = [
    { id: 'apercu', label: 'Vue d’ensemble' },
    { id: 'zone', label: 'Zone DNS' },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Domaines', href: '/app/web' },
          { label: entree.nom },
        ]}
        titre={<span className="break-words font-mono">{entree.nom}</span>}
        sousTitre="Ce nom vous appartient, mais aucun serveur ne lui est encore attaché. Vous pouvez lui en attacher un, ou laisser sa zone pointer ailleurs."
        meta={
          <>
            <Badge tone="neutral">{d?.extension}</Badge>
            <Badge tone="ok">Enregistré</Badge>
            {entree.zone ? (
              <Badge tone="violet">Zone gérée chez nous</Badge>
            ) : (
              <Badge tone="warn">DNS externe</Badge>
            )}
            {d?.verrouTransfert && <Badge tone="neutral">Transfert verrouillé</Badge>}
          </>
        }
        actions={
          <>
            <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
              <Button iconBefore={<ServerCog size={14} />}>Attacher un hébergement</Button>
            </GatedAction>
            <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
              <Button variant="secondary" iconBefore={<ArrowRightLeft size={14} />}>
                Transférer
              </Button>
            </GatedAction>
          </>
        }
      />

      <Tabs tabs={onglets} active={onglet} onChange={setOnglet} />

      {onglet === 'apercu' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader
                titre="État du nom de domaine"
                sousTitre="Trois états distincts, qui ne disent pas la même chose : l'un vient du registre, l'un de la résolution, l'un de la protection contre le vol de nom."
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Etat
                  icone={<Globe size={14} />}
                  libelle="Statut au registre"
                  valeur="Enregistré"
                  ton="ok"
                  aide="Le nom est bien à vous auprès du registre de l’extension."
                />
                <Etat
                  icone={<ShieldCheck size={14} />}
                  libelle="État technique"
                  valeur={entree.zone ? 'Résolution active' : 'Servi ailleurs'}
                  ton={entree.zone ? 'ok' : 'warn'}
                  aide={
                    entree.zone
                      ? 'Nos serveurs de noms répondent pour ce domaine.'
                      : 'Les serveurs de noms d’un autre fournisseur répondent pour ce domaine.'
                  }
                />
                <Etat
                  icone={<Lock size={14} />}
                  libelle="Protection au transfert"
                  valeur={d?.verrouTransfert ? 'Verrouillé' : 'Déverrouillé'}
                  ton={d?.verrouTransfert ? 'ok' : 'warn'}
                  aide={
                    d?.verrouTransfert
                      ? 'Aucun transfert sortant ne peut aboutir sans que vous leviez le verrou.'
                      : 'Un transfert sortant peut être demandé. À reverrouiller après une opération.'
                  }
                />
              </div>

              <KeyValueList
                className="mt-4 border-t border-g-100 pt-4"
                items={[
                  { cle: 'Extension', valeur: d?.extension ?? '—' },
                  { cle: 'Échéance', valeur: d ? dateCourte(d.expiration) : '—' },
                  {
                    cle: 'WHOIS',
                    valeur: d?.whoisProtege ? 'Coordonnées masquées' : 'Coordonnées publiques',
                  },
                  {
                    cle: 'Serveurs de noms',
                    valeur: entree.zone ? entree.zone.ns.join(' · ') : 'Fournisseur externe',
                  },
                ]}
              />
            </Card>

            <Card>
              <CardHeader
                titre="Lui attacher un hébergement"
                sousTitre="Un domaine est attaché à un serveur et à un seul. L’attacher crée le serveur, son Apache, son PHP et son serveur de bases."
              />
              <Callout ton="info" titre="Ce que l’attachement fait, concrètement">
                Nous créons le serveur, nous posons le certificat, nous ajoutons les
                enregistrements <span className="font-mono">A</span> de la zone vers son adresse, et
                vous pouvez installer vos sites sur autant de sous-domaines que vous voulez. Rien
                n’est perdu si vous détachez plus tard : la zone reste.
              </Callout>
              <div className="mt-3">
                <MicroLabel>Adresse à viser depuis un DNS externe</MicroLabel>
                <CopyField value="102.176.20.13" mono className="mt-1.5" />
              </div>
              <ButtonLink href="/app/web" variant="secondary" size="sm" className="mt-4">
                Comparer les paliers d’hébergement
              </ButtonLink>
            </Card>
          </div>

          <div className="space-y-4">
            {abonnement && (
              <CarteAbonnement
                offre={abonnement.offre}
                prixMensuel={abonnement.prixMensuel}
                debut={abonnement.debut}
                echeance={abonnement.echeance}
                joursRestants={abonnement.joursRestants}
                renouvellementAuto={abonnement.renouvellementAuto}
                frequence={abonnement.frequence}
              />
            )}

            <Card>
              <CardHeader
                titre="Services associés"
                sousTitre="Ce qui pourrait tourner sur ce nom."
              />
              <ul className="space-y-2.5 text-[12.5px]">
                <Associe libelle="Hébergement" etat="Aucun" action="Attacher" />
                <Associe libelle="Messagerie partagée" etat="Aucune" action="Activer" />
                <Associe libelle="Drive partagé" etat="Aucun" action="Activer" />
                <Associe
                  libelle="Zone DNS"
                  etat={entree.zone ? 'Gérée chez nous' : 'Externe'}
                  action={entree.zone ? 'Modifier' : 'Rapatrier'}
                />
              </ul>
            </Card>
          </div>
        </div>
      )}

      {onglet === 'zone' &&
        (entree.zone ? (
          <EditeurZone zoneId={entree.zone.id} />
        ) : (
          <EmptyState
            titre="La zone de ce domaine est servie ailleurs"
            phrase="Les serveurs de noms déclarés au registre appartiennent à un autre fournisseur. Rapatriez la zone pour l’éditer ici : nous la recopions, vous vérifiez, puis vous changez les serveurs de noms."
            action={{ libelle: 'Rapatrier la zone', href: '#' }}
          />
        ))}
    </div>
  )
}

function Etat({
  icone,
  libelle,
  valeur,
  ton,
  aide,
}: {
  icone: React.ReactNode
  libelle: string
  valeur: string
  ton: 'ok' | 'warn'
  aide: string
}) {
  return (
    <div className="rounded-[8px] border border-g-300 bg-g-050 p-3">
      <p className="flex items-center gap-1.5">
        <span className="text-p-700">{icone}</span>
        <span className="type-micro text-g-500">{libelle}</span>
      </p>
      <p className="mt-1.5">
        <Badge tone={ton}>{valeur}</Badge>
      </p>
      <p className="mt-2 text-[11.5px] leading-snug text-g-700">{aide}</p>
    </div>
  )
}

function Associe({
  libelle,
  etat,
  action,
}: {
  libelle: string
  etat: string
  action: string
}) {
  return (
    <li className="flex items-center justify-between gap-2 border-b border-g-100 pb-2 last:border-0 last:pb-0">
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink">{libelle}</span>
        <span className="block text-[11.5px] text-g-500">{etat}</span>
      </span>
      <button
        type="button"
        className="shrink-0 text-[12px] font-semibold text-p-700 hover:text-m-600"
      >
        {action} →
      </button>
    </li>
  )
}
