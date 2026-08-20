import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HEBERGEMENTS } from '@/lib/mock'
import { VueHebergement } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const h = HEBERGEMENTS.find((x) => x.id === id)
  return { title: h ? `${h.domaine} · Hébergement web` : 'Hébergement introuvable' }
}

export default async function PageHebergement({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!HEBERGEMENTS.some((h) => h.id === id)) notFound()
  return <VueHebergement id={id} />
}
