'use client'

import Link from 'next/link'
import { AlertTriangle, ShieldCheck, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dateCourte, money } from '@/lib/format'
import {
  CERTIFICATS,
  OFFRES_CERTIFICAT,
  TYPE_CERTIFICAT_LABEL,
  joursAvant,
} from '@/lib/mock'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { Field, Input, Select } from '@/components/ui/field'
import { PageHeader, Card, CardHeader, Callout } from '@/components/composition/card'
import { StatTile } from '@/components/composition/metrics'
import { useApp } from '@/components/app/contexte'

export default function ListeCertificats() {
  const { autorise, refus } = useApp()
  const payants = CERTIFICATS.filter((c) => c.prixAnnuel > 0)
  const sansAuto = CERTIFICATS.filter((c) => !c.renouvellementAuto && c.etat === 'actif')
  const proches = CERTIFICATS.filter((c) => joursAvant(c.expire) <= 30 && c.etat === 'actif')

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'Web Cloud', href: '/app/web' },
          { label: 'SSL' },
        ]}
        titre="Certificats TLS"
        sousTitre="Let’s Encrypt est posé et renouvelé sans rien demander. Les certificats à validation d’organisation ou joker se commandent ici, et se posent sur les hôtes que vous désignez."
        actions={
          <GatedAction autorise={autorise('service.admin')} message={refus('service.admin')}>
            <Button iconBefore={<ShoppingCart size={14} />}>Commander un certificat</Button>
          </GatedAction>
        }
      />

      {(sansAuto.length > 0 || proches.length > 0) && (
        <Callout
          ton={sansAuto.length > 0 ? 'err' : 'warn'}
          titre={
            sansAuto.length > 0
              ? `${sansAuto.length} certificat sans renouvellement automatique`
              : `${proches.length} certificat arrive à échéance`
          }
        >
          <ul className="mt-1 space-y-1">
            {[...sansAuto, ...proches.filter((c) => c.renouvellementAuto)].map((c) => (
              <li key={c.id} className="flex items-start gap-2">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                <span>
                  <Link href={`/app/web/ssl/${c.id}`} className="font-mono font-semibold underline">
                    {c.hote}
                  </Link>
                  <span className="ml-1.5 text-g-700">
                    expire dans {joursAvant(c.expire)} jours
                    {c.renouvellementAuto ? '' : ' et ne se renouvellera pas seul'}.
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          libelle="Certificats actifs"
          valeur={CERTIFICATS.filter((c) => c.etat === 'actif').length}
          detail={`${CERTIFICATS.filter((c) => c.etat === 'en_emission').length} en émission`}
        />
        <StatTile
          libelle="Gratuits"
          valeur={CERTIFICATS.filter((c) => c.prixAnnuel === 0).length}
          detail="Let’s Encrypt"
          ton="ok"
        />
        <StatTile
          libelle="Payants"
          valeur={payants.length}
          detail={`${money(payants.reduce((a, c) => a + c.prixAnnuel, 0))} / an`}
        />
        <StatTile
          libelle="Échéance la plus proche"
          valeur={`${Math.min(...CERTIFICATS.map((c) => joursAvant(c.expire)))} j`}
          ton="warn"
        />
      </div>

      <Card padding={false}>
        <div className="border-b border-g-100 px-4 py-3">
          <p className="text-[13px] font-bold text-ink">Certificats posés</p>
          <p className="mt-0.5 text-[12px] text-g-500">
            Choisissez-en un dans le panneau pour voir sa chaîne, ses hôtes et son historique.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse">
            <thead>
              <tr className="border-b border-g-300 bg-g-050">
                {['Hôte', 'Type', 'Émetteur', 'Émis le', 'Expire le', 'Restant', 'Renouvellement', 'Coût', ''].map(
                  (c) => (
                    <th key={c} className="type-micro px-3 py-2 text-left font-semibold text-g-500">
                      {c}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {CERTIFICATS.map((c) => {
                const j = joursAvant(c.expire)
                return (
                  <tr key={c.id} className="border-b border-g-100 last:border-0">
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/app/web/ssl/${c.id}`}
                        className="font-mono text-[12.5px] font-semibold text-ink hover:text-p-700"
                      >
                        {c.hote}
                      </Link>
                      {c.hotesSupplementaires && (
                        <span className="mt-0.5 block font-mono text-[11px] text-g-500">
                          + {c.hotesSupplementaires.join(', ')}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={c.prixAnnuel === 0 ? 'ok' : 'violet'} size="sm">
                        {TYPE_CERTIFICAT_LABEL[c.type]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-g-700">{c.emetteur}</td>
                    <td className="px-3 py-2.5 text-[11.5px] text-g-700">{dateCourte(c.emisLe)}</td>
                    <td className="px-3 py-2.5 text-[11.5px] text-g-700">{dateCourte(c.expire)}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'tnum text-[12px] font-bold',
                          j <= 14 ? 'text-err' : j <= 30 ? 'text-warn' : 'text-g-700',
                        )}
                      >
                        {j} j
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={c.renouvellementAuto ? 'ok' : 'err'} size="sm">
                        {c.renouvellementAuto ? 'Automatique' : 'Manuel'}
                      </Badge>
                    </td>
                    <td className="tnum px-3 py-2.5 text-[12px] text-g-700">
                      {c.prixAnnuel === 0 ? 'Inclus' : `${money(c.prixAnnuel)} / an`}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/app/web/ssl/${c.id}`}
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

      <Card>
        <CardHeader
          titre="Commander un certificat"
          sousTitre="Le gratuit convient à presque tout. Les payants servent quand il faut une garantie financière, le nom de l’entreprise dans le certificat, ou tous les sous-domaines d’un coup."
        />
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Hôte à couvrir" className="min-w-0 flex-1">
            <Input placeholder="boutique.dba.africa" />
          </Field>
          <Field label="Type" className="w-56">
            <Select defaultValue="letsencrypt">
              {OFFRES_CERTIFICAT.map((o) => (
                <option key={o.type} value={o.type}>
                  {o.nom} — {o.prix === 0 ? 'inclus' : `${money(o.prix)} / an`}
                </option>
              ))}
            </Select>
          </Field>
          <Button>Vérifier et commander</Button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {OFFRES_CERTIFICAT.map((o) => (
            <div
              key={o.type}
              className={cn(
                'rounded-[8px] border p-3',
                o.prix === 0 ? 'border-ok bg-ok-bg' : 'border-g-300 bg-white',
              )}
            >
              <p className="flex items-center gap-1.5 text-p-700">
                <ShieldCheck size={14} />
                <span className="text-[12.5px] font-bold text-ink">{o.nom}</span>
              </p>
              <p className="tnum mt-1.5 text-[16px] font-bold text-ink">
                {o.prix === 0 ? 'Inclus' : `${money(o.prix)}`}
                {o.prix > 0 && <span className="text-[11px] font-semibold text-g-500"> / an</span>}
              </p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-g-700">{o.pour}</p>
              <dl className="mt-2 space-y-0.5 border-t border-g-100 pt-2 text-[11px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-g-500">Délai</dt>
                  <dd className="text-right font-semibold text-ink">{o.delai}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-g-500">Garantie</dt>
                  <dd className="text-right font-semibold text-ink">{o.garantie}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <Callout ton="info" className="mt-3" titre="Un certificat payant ne chiffre pas mieux">
          Le chiffrement est identique. Ce que vous achetez, c’est une vérification d’identité par
          l’autorité et une garantie financière — utile pour une boutique, inutile pour un blog.
        </Callout>
      </Card>
    </div>
  )
}
