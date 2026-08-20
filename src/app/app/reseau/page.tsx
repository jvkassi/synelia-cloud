'use client'

import { useState } from 'react'
import { Download, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateHeure, num } from '@/lib/format'
import { NETWORKS, PUBLIC_IPS, SECURITY_GROUPS, VPN_TUNNELS } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { GatedAction, Tabs } from '@/components/ui/display'
import { Card, CardHeader, Callout, PageHeader } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { useApp, useEspace } from '@/components/app/contexte'

const ONGLETS = [
  { id: 'prives', label: 'Réseaux privés' },
  { id: 'ips', label: 'IP publiques' },
  { id: 'sg', label: 'Groupes de sécurité' },
  { id: 'vpn', label: 'VPN' },
]

export default function Reseau() {
  const espace = useEspace()
  const { autorise, refus } = useApp()
  const [onglet, setOnglet] = useState('prives')

  const reseaux = NETWORKS.filter((n) => n.espaceId === espace.id)
  const ips = PUBLIC_IPS.filter((i) => i.espaceId === espace.id)
  const groupes = SECURITY_GROUPS.filter((s) => s.espaceId === espace.id)
  const tunnels = VPN_TUNNELS.filter((v) => v.espaceId === espace.id)

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: espace.code, href: `/app/espaces/${espace.id}` },
          { label: 'Réseau & IP' },
        ]}
        titre="Réseau et adressage"
        sousTitre={`Plage allouée à ${espace.code} : ${espace.cidr}. Les réseaux privés découpent cette plage ; les groupes de sécurité filtrent le trafic.`}
        meta={
          <>
            <Badge tone="neutral">{espace.cidr}</Badge>
            <Badge tone="violet">{reseaux.length} réseaux privés</Badge>
            <Badge tone="ok">
              {ips.filter((i) => !i.attachedTo).length} IP disponibles sur {ips.length}
            </Badge>
          </>
        }
      />

      <Tabs tabs={ONGLETS} active={onglet} onChange={setOnglet} />

      {/* Réseaux privés */}
      {onglet === 'prives' && (
        <Card>
          <CardHeader
            titre="Réseaux privés"
            sousTitre="Un réseau par usage permet d’appliquer des groupes de sécurité distincts et de limiter la portée d’une compromission."
            actions={
              <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
                <Button size="sm" iconBefore={<Plus size={13} />}>
                  Créer un réseau
                </Button>
              </GatedAction>
            }
          />
          {reseaux.length === 0 ? (
            <EmptyState
              titre="Aucun réseau privé"
              phrase={`Découpez la plage ${espace.cidr} en sous-réseaux par usage — front, données, cache — pour appliquer des politiques de filtrage distinctes.`}
              action={{ libelle: 'Créer un réseau', href: '#' }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Nom', 'Plage', 'VLAN', 'DNS interne', 'Workloads rattachés', ''].map((h) => (
                      <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reseaux.map((r) => (
                    <tr key={r.id} className="border-b border-g-100 last:border-0 hover:bg-p-050/60">
                      <td className="px-3 py-2.5 text-[13px] font-medium text-ink">{r.nom}</td>
                      <td className="px-3 py-2.5 font-mono text-[12.5px] text-ink">{r.cidr}</td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">{r.vlan}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone={r.dnsInterne ? 'ok' : 'neutral'} size="sm">
                          {r.dnsInterne ? 'Actif' : 'Désactivé'}
                        </Badge>
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] text-g-700">{r.workloads}</td>
                      <td className="px-3 py-2.5 text-right">
                        <GatedAction
                          autorise={autorise('network.manage')}
                          message={refus('network.manage')}
                        >
                          <Button size="sm" variant="ghost">
                            Modifier
                          </Button>
                        </GatedAction>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 border-t border-g-100 pt-3 text-[11.5px] leading-relaxed text-g-500">
            Plage totale {espace.cidr} · {num(reseaux.length * 254)} adresses actuellement découpées
            sur les 1 024 disponibles. Le routage entre réseaux privés d’un même espace est
            automatique ; le filtrage se fait par groupe de sécurité.
          </p>
        </Card>
      )}

      {/* IP publiques */}
      {onglet === 'ips' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile libelle="IP réservées" valeur={ips.length} />
            <StatTile
              libelle="Attachées"
              valeur={ips.filter((i) => i.attachedTo).length}
              ton="ok"
            />
            <StatTile
              libelle="Disponibles"
              valeur={ips.filter((i) => !i.attachedTo).length}
              detail="Facturées même détachées"
            />
            <StatTile
              libelle="Protégées anti-DDoS"
              valeur={ips.filter((i) => i.antiDdos).length}
              ton="ok"
            />
          </div>

          <Card>
            <CardHeader
              titre="IP publiques"
              actions={
                <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
                  <Button size="sm" iconBefore={<Plus size={13} />}>
                    Commander une IP
                  </Button>
                </GatedAction>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-g-300 bg-g-050">
                    {['Adresse', 'Reverse DNS (PTR)', 'Ressource attachée', 'Anti-DDoS', 'Actions'].map(
                      (h) => (
                        <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {ips.map((ip) => (
                    <tr key={ip.id} className="border-b border-g-100 last:border-0">
                      <td className="px-3 py-2.5 font-mono text-[12.5px] font-semibold text-ink">
                        {ip.adresse}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11.5px] text-g-700">
                        {ip.ptr ?? <span className="text-g-500">non configuré</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {ip.attachedLabel ? (
                          <Badge tone="violet" size="sm">
                            {ip.attachedLabel}
                          </Badge>
                        ) : (
                          <Badge tone="neutral" size="sm">
                            Disponible
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={ip.antiDdos ? 'ok' : 'neutral'} size="sm">
                          {ip.antiDdos ? 'Actif' : 'Non'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex flex-wrap gap-1.5">
                          <GatedAction
                            autorise={autorise('network.manage')}
                            message={refus('network.manage')}
                          >
                            <Button size="sm" variant="ghost">
                              {ip.attachedTo ? 'Détacher' : 'Attacher'}
                            </Button>
                          </GatedAction>
                          <Button size="sm" variant="ghost">
                            Configurer le PTR
                          </Button>
                          <IconButton
                            label={
                              ip.attachedTo
                                ? 'Détachez l’IP avant de la libérer'
                                : 'Libérer l’IP'
                            }
                            size="sm"
                            disabled={Boolean(ip.attachedTo)}
                          >
                            <Trash2
                              size={13}
                              className={ip.attachedTo ? 'text-g-300' : 'text-err'}
                            />
                          </IconButton>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Callout ton="info" className="mt-4" titre="Reverse DNS et réputation">
              Un enregistrement PTR correct est indispensable si la machine envoie du courrier :
              sans lui, la plupart des serveurs destinataires rejettent ou classent en indésirable.
              Pour l’envoi transactionnel, préférez le relais SMTP, dont la réputation est gérée par
              nos équipes.
            </Callout>
          </Card>
        </div>
      )}

      {/* Groupes de sécurité */}
      {onglet === 'sg' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-3xl text-[13px] leading-relaxed text-g-700">
              Un groupe de sécurité est nommé par usage, pas par machine. La politique par défaut est
              affichée explicitement : c’est ce qui évite les surprises lors d’un audit.
            </p>
            <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
              <Button size="sm" iconBefore={<Plus size={13} />}>
                Créer un groupe
              </Button>
            </GatedAction>
          </div>

          {groupes.map((sg) => (
            <Card key={sg.id}>
              <CardHeader
                titre={sg.nom}
                sousTitre={sg.description}
                actions={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="neutral" size="sm">
                      {sg.attaches} ressource(s) attachée(s)
                    </Badge>
                    <Badge
                      tone={sg.defaultPolicy.ingress === 'deny' ? 'ok' : 'warn'}
                      size="sm"
                    >
                      {sg.defaultPolicy.ingress === 'deny' ? 'Refus' : 'Autorisation'} par défaut en
                      entrée
                    </Badge>
                    <Badge
                      tone={sg.defaultPolicy.egress === 'allow' ? 'neutral' : 'warn'}
                      size="sm"
                    >
                      Sortie {sg.defaultPolicy.egress === 'allow' ? 'autorisée' : 'refusée'}
                    </Badge>
                  </div>
                }
              />
              <div className="overflow-x-auto rounded-[6px] border border-g-300">
                <table className="w-full min-w-max border-collapse">
                  <thead>
                    <tr className="border-b border-g-300 bg-g-050">
                      {['Direction', 'Protocole', 'Ports', 'Source / destination', 'Description', ''].map(
                        (h) => (
                          <th key={h} className="type-micro px-3 py-1.5 text-left text-g-500">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sg.rules.map((r) => (
                      <tr key={r.id} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-1.5">
                          <Badge tone={r.direction === 'in' ? 'info' : 'neutral'} size="sm">
                            {r.direction === 'in' ? 'Entrée' : 'Sortie'}
                          </Badge>
                        </td>
                        <td className="px-3 py-1.5 font-mono text-[11.5px] uppercase text-ink">
                          {r.protocole}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-[11.5px] text-ink">
                          {r.ports ?? 'tous'}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-[11.5px] text-g-700">{r.cible}</td>
                        <td className="px-3 py-1.5 text-[11.5px] text-g-700">
                          {r.description ?? '—'}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <GatedAction
                            autorise={autorise('network.manage')}
                            message={refus('network.manage')}
                          >
                            <IconButton label="Supprimer la règle" size="sm">
                              <Trash2 size={12} className="text-err" />
                            </IconButton>
                          </GatedAction>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
                <Button size="sm" variant="ghost" className="mt-2.5" iconBefore={<Plus size={12} />}>
                  Ajouter une règle
                </Button>
              </GatedAction>
            </Card>
          ))}
        </div>
      )}

      {/* VPN */}
      {onglet === 'vpn' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Tunnels site-à-site IPsec"
              sousTitre="Interconnexion entre vos sites physiques et votre Espace Cloud."
              actions={
                <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
                  <Button size="sm" iconBefore={<Plus size={13} />}>
                    Nouveau tunnel
                  </Button>
                </GatedAction>
              }
            />
            {tunnels.filter((t) => t.type === 'ipsec').length === 0 ? (
              <EmptyState
                titre="Aucun tunnel IPsec"
                phrase="Un tunnel site-à-site relie votre réseau local à votre Espace Cloud, sans exposer de service sur Internet."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse">
                  <thead>
                    <tr className="border-b border-g-300 bg-g-050">
                      {['Tunnel', 'Passerelle distante', 'Réseaux annoncés', 'État', 'Dernière négociation'].map(
                        (h) => (
                          <th key={h} className="type-micro px-3 py-2 text-left text-g-500">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {tunnels
                      .filter((t) => t.type === 'ipsec')
                      .map((t) => (
                        <tr key={t.id} className="border-b border-g-100 last:border-0">
                          <td className="px-3 py-2.5 text-[13px] font-medium text-ink">{t.nom}</td>
                          <td className="px-3 py-2.5 font-mono text-[12px] text-g-700">
                            {t.passerelleDistante}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="flex flex-wrap gap-1">
                              {(t.reseauxAnnonces ?? []).map((r) => (
                                <Badge key={r} tone="neutral" size="sm">
                                  {r}
                                </Badge>
                              ))}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge
                              tone={
                                t.statut === 'up' ? 'ok' : t.statut === 'negociation' ? 'warn' : 'err'
                              }
                              dot
                              size="sm"
                            >
                              {t.statut === 'up'
                                ? 'Établi'
                                : t.statut === 'negociation'
                                  ? 'Négociation'
                                  : 'Rompu'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-[12px] text-g-700">
                            {t.derniereNegociation ? dateHeure(t.derniereNegociation) : '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            {tunnels.some((t) => t.statut === 'negociation') && (
              <Callout ton="warn" className="mt-4" titre="Un tunnel est en cours de négociation">
                Le tunnel vers l’agence de Yamoussoukro renégocie sa phase 2 depuis plusieurs
                minutes. Vérifiez que les paramètres de chiffrement et les réseaux annoncés
                correspondent de part et d’autre — un désaccord sur les sélecteurs de trafic est la
                cause la plus fréquente.
              </Callout>
            )}
          </Card>

          <Card>
            <CardHeader
              titre="Accès client SSL / OpenVPN"
              sousTitre="Profils nominatifs pour les postes de travail. Chaque profil est révocable individuellement."
              actions={
                <GatedAction autorise={autorise('network.manage')} message={refus('network.manage')}>
                  <Button size="sm" iconBefore={<Plus size={13} />}>
                    Générer un profil
                  </Button>
                </GatedAction>
              }
            />
            {tunnels
              .filter((t) => t.type === 'ssl')
              .map((t) => (
                <div key={t.id}>
                  <div className="mb-2.5 flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-semibold text-ink">{t.nom}</span>
                    <Badge tone={t.statut === 'up' ? 'ok' : 'err'} dot size="sm">
                      {t.statut === 'up' ? 'Service actif' : 'Service arrêté'}
                    </Badge>
                    <span className="text-[11.5px] text-g-500">
                      Pool d’adresses clientes : 10.99.0.0/24
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(t.profils ?? []).map((p) => (
                      <div
                        key={p.nom}
                        className={cn(
                          'flex flex-wrap items-center justify-between gap-3 rounded-[6px] border px-3 py-2',
                          p.revoque ? 'border-g-300 bg-g-050 opacity-70' : 'border-g-300',
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block font-mono text-[12.5px] font-semibold text-ink">
                            {p.nom}
                          </span>
                          <span className="block text-[11px] text-g-500">
                            {p.utilisateur} · créé le {p.cree}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {p.revoque ? (
                            <Badge tone="err" size="sm">
                              Révoqué
                            </Badge>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" iconBefore={<Download size={12} />}>
                                Télécharger le .ovpn
                              </Button>
                              <GatedAction
                                autorise={autorise('network.manage')}
                                message={refus('network.manage')}
                              >
                                <Button size="sm" variant="ghost">
                                  Révoquer
                                </Button>
                              </GatedAction>
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            <p className="mt-3 border-t border-g-100 pt-3 text-[11.5px] leading-relaxed text-g-500">
              La révocation est immédiate : le certificat client est ajouté à la liste de révocation
              et la session en cours est coupée. C’est la procédure à appliquer au départ d’un
              collaborateur ou à la fin d’une mission de prestataire.
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
