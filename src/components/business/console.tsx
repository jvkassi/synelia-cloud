'use client'

import type { ReactNode } from 'react'
import { Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer } from '@/components/ui/overlay'
import { useOperation } from '@/components/app/actions'

/**
 * Panneau plein écran simulant une session de terminal — console KVM d'une
 * VM, shell dans un nœud Kubernetes, shell dans un conteneur applicatif.
 * Le portail encapsule le protocole réel, il ne le réimplémente pas : le
 * contenu est un texte statique, pas un terminal interactif.
 */
export function ConsoleDrawer({
  open,
  onClose,
  titre,
  description,
  statut,
  barre,
  contenu,
  footerExtra,
}: {
  open: boolean
  onClose: () => void
  titre: string
  description: string
  statut: ReactNode
  barre?: ReactNode
  contenu: string
  footerExtra?: ReactNode
}) {
  const executer = useOperation()

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={titre}
      description={description}
      size="full"
      footer={
        <>
          <span className="mr-auto text-[12px] text-g-500">
            Session chiffrée · déconnexion automatique après 15 minutes d’inactivité
          </span>
          {footerExtra}
          <Button
            variant="ghost"
            iconBefore={<Maximize2 size={13} />}
            onClick={() =>
              executer({
                ton: 'info',
                titre: 'Ouverture en plein écran',
                detail: 'La session s’ouvre dans un onglet dédié, hors du portail.',
              })
            }
          >
            Plein écran
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </>
      }
    >
      <div className="flex h-full min-h-[60vh] flex-col overflow-hidden rounded-[8px] border border-g-300 bg-p-900">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse-dot" />
          <span className="type-micro text-p-300">{statut}</span>
        </div>
        {barre}
        <pre className="flex-1 overflow-auto px-4 py-3 font-mono text-[13px] leading-relaxed text-[#C9E4CA]">
          {contenu}
        </pre>
      </div>
    </Drawer>
  )
}
