'use client'

import { useState } from 'react'
import { Ban, Lock, Plus, RotateCw } from 'lucide-react'
import { dateCourte, jetons, money, num, relatif } from '@/lib/format'
import { CLASSE_DONNEES_LABEL, type CleIA } from '@/lib/types'
import { CLES_IA, COFFRE_CLES_FOURNISSEURS, MODELES_IA, PASSERELLE_IA } from '@/lib/mock'
import { Badge, MicroLabel } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { CodeBlock, CopyField, GatedAction } from '@/components/ui/display'
import { Checkbox, Field, Input, Select } from '@/components/ui/field'
import { ConfirmDialog, Modal } from '@/components/ui/overlay'
import { Card, CardHeader, Callout, KeyValueList, PageHeader } from '@/components/composition/card'
import { DataTable, type Colonne } from '@/components/composition/data-table'
import { QuotaBar, StatTile } from '@/components/composition/metrics'
import { LogPeek } from '@/components/business/observabilite'
import { JOURNAL_PASSERELLE } from '@/lib/mock/ia'
import { useApp, useEspace } from '@/components/app/contexte'

const TON_STATUT = { active: 'ok', suspendue: 'warn', revoquee: 'neutral' } as const
const LIBELLE_STATUT = { active: 'Active', suspendue: 'Suspendue', revoquee: 'Révoquée' } as const

export default function CoffreCles() {
  return (
    <div className="space-y-5">
      <PageHeader
        fil={[
          { label: 'Espace client', href: '/app' },
          { label: 'IA & Agents', href: '/app/ia' },
          { label: 'Paramètres', href: '/app/ia/parametres' },
          { label: 'Coffre de clés' },
        ]}
        titre="Coffre-fort des clés fournisseurs"
        sousTitre="Les clés des éditeurs étrangers sont détenues par Synelia, chiffrées au repos, et ne sont jamais exposées à vos applications : vous appelez la passerelle avec votre propre clé, elle appelle le fournisseur avec la sienne."
      />

      <Card>
        <CardHeader
          titre="Coffre-fort des clés fournisseurs"
          sousTitre="Les clés des éditeurs étrangers sont détenues par Synelia, chiffrées au repos, et ne sont jamais exposées à vos applications : vous appelez la passerelle avec votre propre clé, elle appelle le fournisseur avec la sienne."
          actions={
            <Badge tone="violet" size="sm">
              <Lock size={10} className="mr-1 inline" aria-hidden />
              Chiffré au repos
            </Badge>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-g-300 bg-g-050">
                <th className="type-micro px-3 py-2.5 text-g-500">Fournisseur</th>
                <th className="type-micro px-3 py-2.5 text-g-500">Empreinte</th>
                <th className="type-micro px-3 py-2.5 text-g-500">Portée</th>
                <th className="type-micro px-3 py-2.5 text-g-500">Ajoutée</th>
                <th className="type-micro px-3 py-2.5 text-g-500">Rotation</th>
                <th className="type-micro px-3 py-2.5 text-g-500">État</th>
              </tr>
            </thead>
            <tbody>
              {COFFRE_CLES_FOURNISSEURS.map((c) => (
                <tr key={c.fournisseur} className="border-b border-g-100 last:border-0">
                  <td className="px-3 py-3 text-[12.5px] font-semibold text-ink">{c.fournisseur}</td>
                  <td className="px-3 py-3 font-mono text-[11.5px] text-g-500">{c.empreinte}</td>
                  <td className="px-3 py-3 text-[12px] text-g-700">{c.portee}</td>
                  <td className="px-3 py-3 text-[12px] text-g-500">{dateCourte(c.ajoutee)}</td>
                  <td className="px-3 py-3 text-[12px] text-g-500">{dateCourte(c.rotation)}</td>
                  <td className="px-3 py-3">
                    <Badge tone={c.statut === 'valide' ? 'ok' : 'warn'} dot size="sm">
                      {c.statut === 'valide' ? 'Valide' : 'À renouveler'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout ton="info" className="mt-4" titre="Pourquoi ces clés ne sont pas les vôtres">
          Mutualiser les contrats cadres vous évite d’ouvrir un compte chez chaque éditeur, de
          négocier quatre engagements et d’exposer quatre secrets de plus. La contrepartie est
          assumée : vous ne voyez pas ces clés, et vous dépendez de nous pour leur rotation. Les
          deux échéances de septembre et d’août sont suivies par l’exploitation, pas par vous.
        </Callout>
      </Card>
    </div>
  )
}
