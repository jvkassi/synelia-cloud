'use client'

import { useState } from 'react'
import { Download, ExternalLink, Plus, RotateCcw, Trash2, Upload } from 'lucide-react'
import { cn, surfaceMarque } from '@/lib/utils'
import { dateHeure, num, relatif } from '@/lib/format'
import {
  MOTEUR_WEB_LABEL,
  MOTEUR_WEB_TEINTE,
  hebergementById,
  nomServi,
  serveurBasesById,
} from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, ButtonLink, IconButton } from '@/components/ui/button'
import { CopyField, GatedAction, Tabs } from '@/components/ui/display'
import { Field, Input, Select } from '@/components/ui/field'
import { Drawer } from '@/components/ui/overlay'
import { PageHeader, Card, CardHeader, Callout, KeyValueList } from '@/components/composition/card'
import { StatTile, QuotaBar } from '@/components/composition/metrics'
import { EmptyState } from '@/components/composition/states'
import { useApp } from '@/components/app/contexte'

export function VueServeurBases({ id }: { id: string }) {
  const { autorise, refus, pousser, lancer } = useApp()
  const [onglet, setOnglet] = useState('bases')
  const [creation, setCreation] = useState(false)

  const s = serveurBasesById(id)
  if (!s) return null
  const h = hebergementById(s.hebergementId)
  const surface = surfaceMarque(MOTEUR_WEB_TEINTE[s.moteur])
  const cle = s.moteur === 'redis' ? 'index' : 'base'

  const onglets = [
    { id: 'bases', label: s.moteur === 'redis' ? 'Index' : 'Bases' },
    ...(s.moteur === 'redis' ? [] : [{ id: 'utilisateurs', label: 'Utilisateurs' }]),
    { id: 'connexion', label: 'Connexion' },
    { id: 'sauvegarde', label: 'Sauvegarde' },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Databases', href: '/app/web/bases' },
          { label: MOTEUR_WEB_LABEL[s.moteur] },
        ]}
        titre={
          <span className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] text-[12px] font-bold"
              style={{ background: surface.fond, color: surface.texte }}
            >
              {MOTEUR_WEB_LABEL[s.moteur].slice(0, 2).toUpperCase()}
            </span>
            <span>
              {MOTEUR_WEB_LABEL[s.moteur]} {s.version}
            </span>
          </span>
        }
        sousTitre={`Installé sur ${s.serveur}${h ? `, le serveur de ${nomServi(h)}` : ''}. Accessible seulement depuis cette machine.`}
        meta={
          <>
            <Badge tone={s.actif ? 'ok' : 'neutral'} dot={s.actif}>
              {s.actif ? 'Actif' : 'À activer'}
            </Badge>
            <Badge tone="neutral">Port local {s.port}</Badge>
            {h && <Badge tone="violet">{h.palier}</Badge>}
            <Badge tone="neutral">Aucun accès distant</Badge>
          </>
        }
        actions={
          s.actif ? (
            <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
              <Button iconBefore={<Plus size={14} />} onClick={() => setCreation(true)}>
                Créer une {cle}
              </Button>
            </GatedAction>
          ) : (
            <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
              <Button
                iconBefore={<Plus size={14} />}
                onClick={() =>
                  lancer('web.db.enable', `${MOTEUR_WEB_LABEL[s.moteur]} · ${s.serveur}`)
                }
              >
                Activer {MOTEUR_WEB_LABEL[s.moteur]}
              </Button>
            </GatedAction>
          )
        }
      />

      {!s.actif ? (
        <Card>
          <EmptyState
            titre={`${MOTEUR_WEB_LABEL[s.moteur]} n’est pas encore installé`}
            phrase={`Le moteur est disponible sur ${s.serveur}. L’activer crée le service, ouvre son port sur la boucle locale et l’ajoute au plan de sauvegarde de l’hébergement. Aucun redémarrage d’Apache n’est nécessaire.`}
            action={{ libelle: 'Retour aux moteurs', href: '/app/web/bases' }}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              libelle={s.moteur === 'redis' ? 'Index' : 'Bases'}
              valeur={s.bases.length}
            />
            <StatTile
              libelle={s.moteur === 'redis' ? 'Mémoire' : 'Espace'}
              valeur={`${(s.utiliseMo / 1024).toFixed(2)} Go`}
              detail={`sur ${(s.quotaMo / 1024).toFixed(0)} Go`}
              ton={s.utiliseMo / s.quotaMo > 0.85 ? 'warn' : 'neutral'}
            />
            <StatTile
              libelle="Connexions"
              valeur={`${s.connexions?.actives ?? 0} / ${s.connexions?.max ?? 0}`}
              detail="actives sur maximum"
            />
            <StatTile
              libelle="Dernière sauvegarde"
              valeur={s.sauvegarde.derniere === '—' ? '—' : relatif(s.sauvegarde.derniere)}
              detail={s.sauvegarde.frequence}
              ton={s.sauvegarde.derniere === '—' ? 'neutral' : 'ok'}
            />
          </div>

          <Tabs tabs={onglets} active={onglet} onChange={setOnglet} />

          {onglet === 'bases' && (
            <Card padding={false}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-g-100 px-4 py-3">
                <p className="text-[13px] font-bold text-ink">
                  {s.bases.length} {cle}
                  {s.bases.length > 1 ? 's' : ''} · {(s.utiliseMo / 1024).toFixed(2)} Go
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button size="sm" variant="ghost" iconBefore={<Download size={12} />}>
                    Exporter
                  </Button>
                  <Button size="sm" variant="ghost" iconBefore={<Upload size={12} />}>
                    Importer
                  </Button>
                  {s.moteur !== 'redis' && (
                    <ButtonLink
                      href={`https://adminer.${h ? nomServi(h) : 'synelia.cloud'}`}
                      variant="ghost"
                      size="sm"
                      iconAfter={<ExternalLink size={12} />}
                    >
                      Ouvrir Adminer
                    </ButtonLink>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse">
                  <thead>
                    <tr className="border-b border-g-300 bg-g-050">
                      {[
                        cle === 'base' ? 'Base' : 'Index',
                        'Taille',
                        s.moteur === 'redis' ? 'Clés' : 'Tables',
                        ...(s.moteur === 'redis' ? [] : ['Jeu de caractères']),
                        'Utilisé par',
                        '',
                      ].map((c) => (
                        <th
                          key={c}
                          className="type-micro px-3 py-2 text-left font-semibold text-g-500"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.bases.map((b) => (
                      <tr key={b.nom} className="border-b border-g-100 last:border-0">
                        <td className="px-3 py-2.5 font-mono text-[12.5px] font-semibold text-ink">
                          {b.nom}
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                          {b.tailleMo >= 1024
                            ? `${(b.tailleMo / 1024).toFixed(2)} Go`
                            : `${b.tailleMo} Mo`}
                        </td>
                        <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                          {num(b.tables ?? b.cles ?? 0)}
                        </td>
                        {s.moteur !== 'redis' && (
                          <td className="px-3 py-2.5 font-mono text-[11.5px] text-g-500">
                            {b.collation}
                          </td>
                        )}
                        <td className="px-3 py-2.5 text-[12px] text-g-700">{b.utilise}</td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="flex items-center justify-end gap-1">
                            <IconButton
                              label={`Restaurer ${b.nom}`}
                              size="sm"
                              onClick={() => lancer('web.db.restore', b.nom)}
                            >
                              <RotateCcw size={13} />
                            </IconButton>
                            <GatedAction
                              autorise={autorise('service.admin')}
                              message={refus('service.admin')}
                            >
                              <IconButton label={`Supprimer ${b.nom}`} size="sm">
                                <Trash2 size={13} className="text-err" />
                              </IconButton>
                            </GatedAction>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {onglet === 'utilisateurs' && (
            <Card>
              <CardHeader
                titre="Comptes d’accès"
                sousTitre="Un compte par application, avec les droits les plus étroits possible. Le mot de passe n’est affiché qu’à la création."
                actions={
                  <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
                    <Button size="sm" variant="secondary" iconBefore={<Plus size={13} />}>
                      Créer un compte
                    </Button>
                  </GatedAction>
                }
              />
              <ul className="divide-y divide-g-100">
                {s.utilisateurs.map((u) => (
                  <li
                    key={u.nom}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-[12.5px] font-semibold text-ink">
                        {u.nom}
                      </span>
                      <span className="block text-[11px] text-g-500">sur {u.base}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge
                        tone={
                          u.droits === 'complet' ? 'violet' : u.droits === 'lecture' ? 'ok' : 'info'
                        }
                        size="sm"
                      >
                        {u.droits === 'complet'
                          ? 'Tous droits'
                          : u.droits === 'lecture'
                            ? 'Lecture seule'
                            : 'Écriture'}
                      </Badge>
                      <IconButton label={`Réinitialiser le mot de passe de ${u.nom}`} size="sm">
                        <RotateCcw size={13} />
                      </IconButton>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {onglet === 'connexion' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader
                  titre="Depuis vos sites, sur cette machine"
                  sousTitre="Ce sont les seules valeurs qui fonctionnent : le moteur n’écoute pas ailleurs."
                />
                <div className="space-y-3">
                  <div>
                    <MicroLabel>Hôte</MicroLabel>
                    <CopyField value={s.hoteInterne} mono className="mt-1" />
                  </div>
                  <div>
                    <MicroLabel>Port</MicroLabel>
                    <CopyField value={String(s.port)} mono className="mt-1" />
                  </div>
                  {s.bases[0] && (
                    <div>
                      <MicroLabel>Chaîne de connexion — {s.bases[0].nom}</MicroLabel>
                      <CopyField
                        value={
                          s.moteur === 'postgresql'
                            ? `postgresql://${s.utilisateurs[0]?.nom ?? 'utilisateur'}:MOT_DE_PASSE@${s.hoteInterne}:${s.port}/${s.bases[0].nom}`
                            : s.moteur === 'redis'
                              ? `redis://${s.hoteInterne}:${s.port}/0`
                              : `mysql://${s.utilisateurs[0]?.nom ?? 'utilisateur'}:MOT_DE_PASSE@${s.hoteInterne}:${s.port}/${s.bases[0].nom}`
                        }
                        mono
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader titre="Depuis l’extérieur" />
                <Callout ton="warn" titre="Ce n’est pas possible, et c’est voulu">
                  Le moteur est lié à la boucle locale du serveur. Aucune règle de pare-feu ne
                  l’ouvrira : c’est une propriété de l’offre mutualisée, pas un réglage. Pour
                  administrer vos tables, passez par Adminer, servi sur votre propre domaine et
                  derrière votre authentification.
                </Callout>
                <KeyValueList
                  className="mt-3"
                  items={[
                    { cle: 'Écoute', valeur: `${s.hoteInterne}:${s.port}` },
                    { cle: 'Exposition publique', valeur: 'Aucune' },
                    { cle: 'Tunnel SSH', valeur: h?.acces.ssh ? 'Possible si SSH est activé' : 'SSH désactivé' },
                    { cle: 'Alternative', valeur: 'Base managée, avec liste d’adresses autorisées' },
                  ]}
                />
              </Card>
            </div>
          )}

          {onglet === 'sauvegarde' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader
                  titre="Ce moteur dans le plan de l’hébergement"
                  sousTitre="Les bases sont sauvegardées avec les fichiers du serveur, dans la même exécution."
                />
                <KeyValueList
                  items={[
                    { cle: 'Fréquence', valeur: s.sauvegarde.frequence },
                    {
                      cle: 'Dernière',
                      valeur:
                        s.sauvegarde.derniere === '—'
                          ? '—'
                          : dateHeure(s.sauvegarde.derniere),
                    },
                    { cle: 'Rétention', valeur: `${s.sauvegarde.retentionJours} jours` },
                  ]}
                />
                <ButtonLink
                  href={`/app/web/backup`}
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                >
                  Voir le plan complet
                </ButtonLink>
              </Card>

              <Card>
                <CardHeader
                  titre="Restaurer"
                  sousTitre="Une base restaurée est écrite à côté de l’originale, jamais par-dessus."
                />
                <div className="space-y-3">
                  <Field label={`${cle === 'base' ? 'Base' : 'Index'} à restaurer`}>
                    <Select defaultValue={s.bases[0]?.nom}>
                      {s.bases.map((b) => (
                        <option key={b.nom} value={b.nom}>
                          {b.nom}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Point de restauration">
                    <Select defaultValue="hier">
                      <option value="hier">19 août 2026 · 03:04</option>
                      <option value="avant">18 août 2026 · 03:03</option>
                      <option value="semaine">12 août 2026 · 03:02</option>
                    </Select>
                  </Field>
                  <Field label="Nom de la copie" hint="l’originale reste intacte">
                    <Input defaultValue={`${s.bases[0]?.nom ?? 'base'}_restauree`} />
                  </Field>
                  <GatedAction autorise={autorise('backup.restore')} message={refus('backup.restore')}>
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() =>
                        lancer('web.db.restore', s.bases[0]?.nom ?? s.hoteInterne)
                      }
                    >
                      Lancer la restauration
                    </Button>
                  </GatedAction>
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      <Drawer
        open={creation}
        onClose={() => setCreation(false)}
        title={`Créer une ${cle}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreation(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                setCreation(false)
                pousser({
                  ton: 'ok',
                  titre: `${cle === 'base' ? 'Base' : 'Index'} créé`,
                  detail: `Disponible immédiatement sur ${s.hoteInterne}:${s.port}.`,
                })
              }}
            >
              Créer
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Nom" hint="lettres, chiffres et tirets bas">
            <Input placeholder={`${s.moteur === 'postgresql' ? 'app_prod' : 'monsite_wp'}`} />
          </Field>
          {s.moteur !== 'redis' && (
            <Field label="Jeu de caractères">
              <Select defaultValue="utf8mb4_unicode_ci">
                <option value="utf8mb4_unicode_ci">utf8mb4_unicode_ci</option>
                <option value="utf8mb4_general_ci">utf8mb4_general_ci</option>
                <option value="fr_FR.UTF-8">fr_FR.UTF-8</option>
              </Select>
            </Field>
          )}
          <Field label="Créer un compte dédié" hint="recommandé : un compte par application">
            <Input placeholder="monsite_rw" />
          </Field>
          <Callout ton="info" titre="Le mot de passe n’est affiché qu’une fois">
            Notez-le à la création. Nous ne le stockons pas en clair et ne pourrons pas vous le
            rappeler — seulement le réinitialiser.
          </Callout>
        </div>
      </Drawer>
    </div>
  )
}
