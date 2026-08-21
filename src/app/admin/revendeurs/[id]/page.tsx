import type { Metadata } from 'next'
import { RESELLERS } from '@/lib/mock'
import { VueRevendeur } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const r = RESELLERS.find((x) => x.id === id)
  return { title: r ? `${r.nom} · Partenaire` : 'Partenaire' }
}

/** Pas de `notFound()` : voir la note de /admin/organisations/[id]/page.tsx. */
export default async function PageRevendeur({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <VueRevendeur id={id} />
}
