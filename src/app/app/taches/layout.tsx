import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = { title: 'Centre de tâches' }

export default function LayoutTaches({ children }: { children: ReactNode }) {
  return children
}
