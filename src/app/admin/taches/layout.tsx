import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = { title: 'Centre de tâches — plateforme' }

export default function LayoutTachesAdmin({ children }: { children: ReactNode }) {
  return children
}
