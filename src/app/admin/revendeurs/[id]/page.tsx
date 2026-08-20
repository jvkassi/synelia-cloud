import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RESELLERS } from '@/lib/mock'
import { VueRevendeur } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const r = RESELLERS.find((x) => x.id === id)
  return { title: r ? `${r.nom} · Partenaire` : 'Partenaire introuvable' }
}

export default async function PageRevendeur({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!RESELLERS.some((r) => r.id === id)) notFound()
  return <VueRevendeur id={id} />
}
