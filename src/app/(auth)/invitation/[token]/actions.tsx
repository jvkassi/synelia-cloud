'use client'

import { useState } from 'react'
import { ShieldX } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/button'
import { Callout } from '@/components/composition/card'
import { ConfirmDialog } from '@/components/ui/overlay'

/**
 * Accepter mène à l'espace client ; refuser est définitif et doit le dire.
 * Le refus n'ouvre pas un formulaire : il demande une confirmation, puis
 * remplace le bloc d'action par ce qui s'est réellement passé.
 */
export function ActionsInvitation({
  organisation,
  invitantNom,
}: {
  organisation: string
  invitantNom: string
}) {
  const [confirmation, setConfirmation] = useState(false)
  const [refusee, setRefusee] = useState(false)

  if (refusee) {
    return (
      <Callout ton="info" titre="Invitation refusée">
        <span className="inline-flex items-start gap-1.5">
          <ShieldX size={13} className="mt-0.5 shrink-0" />
          <span>
            Aucun accès n’a été créé sur {organisation} et le lien de cette invitation est désormais
            inutilisable. {invitantNom} est prévenu du refus, sans motif : vous n’avez pas à en
            fournir. Si c’était une erreur, demandez-lui une nouvelle invitation.
          </span>
        </span>
      </Callout>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <ButtonLink href="/app" size="lg" fullWidth>
          Accepter l’invitation
        </ButtonLink>
        <Button variant="secondary" size="lg" fullWidth onClick={() => setConfirmation(true)}>
          Refuser
        </Button>
      </div>

      <ConfirmDialog
        open={confirmation}
        onClose={() => setConfirmation(false)}
        onConfirm={() => setRefusee(true)}
        titre="Refuser cette invitation"
        ressource={organisation}
        libelleAction="Refuser l’invitation"
        pertes={[
          'Le lien de cette invitation devient inutilisable immédiatement',
          `${invitantNom} est prévenu du refus, sans motif`,
          'Aucun accès n’est créé, et rien n’est journalisé dans votre nom au-delà du refus lui-même',
          'Reprendre l’accès plus tard exigera une nouvelle invitation',
        ]}
      />
    </>
  )
}
