'use client'

import { useState, type ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/composition/card'

/**
 * Formulaire de la vitrine — envoi simulé, mais réellement traité.
 *
 * La maquette n'a pas de serveur ; ce qu'elle peut faire honnêtement, c'est
 * exiger les champs obligatoires, accuser réception avec une référence, et dire
 * ce qui se passe ensuite. Un bouton d'envoi qui ne produit rien à l'écran est
 * la pire des deux options.
 */
let compteur = 0

export function FormulaireSite({
  children,
  libelle,
  titreSucces,
  phraseSucces,
  suite,
  complement,
}: {
  children: ReactNode
  libelle: string
  titreSucces: string
  phraseSucces: string
  /** Ce qui se passe ensuite, étape par étape. */
  suite: string[]
  /** Badges ou mentions affichés sous le bouton. */
  complement?: ReactNode
}) {
  const [reference, setReference] = useState<string | null>(null)

  if (reference) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-[8px] border border-ok/40 bg-ok-bg px-4 py-3.5">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-ok" />
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-ink">{titreSucces}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-g-700">{phraseSucces}</p>
            <p className="mt-2 font-mono text-[12px] text-p-700">Référence {reference}</p>
          </div>
        </div>
        <ol className="space-y-1.5">
          {suite.map((x, i) => (
            <li key={x} className="flex items-start gap-2.5">
              <span className="tnum mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-g-100 text-[9.5px] font-bold text-g-700">
                {i + 1}
              </span>
              <span className="text-[12px] leading-snug text-g-700">{x}</span>
            </li>
          ))}
        </ol>
        <Callout ton="info" titre="Cette maquette n’envoie aucun courriel">
          Le formulaire est fonctionnel à l’écran — champs obligatoires, accusé de réception,
          référence — mais aucune donnée ne quitte votre navigateur : il n’y a pas de serveur derrière
          cette démonstration.
        </Callout>
        <Button variant="secondary" fullWidth onClick={() => setReference(null)}>
          Remplir une autre demande
        </Button>
      </div>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        compteur += 1
        setReference(`SYN-2026-${String(4180 + compteur).padStart(4, '0')}`)
      }}
    >
      {children}
      <Button type="submit" size="lg" fullWidth>
        {libelle}
      </Button>
      {complement}
    </form>
  )
}
