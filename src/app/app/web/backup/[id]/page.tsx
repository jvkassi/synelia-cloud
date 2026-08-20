import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sauvegardeWebById } from '@/lib/mock'
import { VueSauvegarde } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const s = sauvegardeWebById(id)
  return { title: s ? `${s.nomServi} · Sauvegardes` : 'Plan introuvable' }
}

export default async function PageSauvegarde({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!sauvegardeWebById(id)) notFound()
  return <VueSauvegarde id={id} />
}
