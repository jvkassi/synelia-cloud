import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ESPACES } from '@/lib/mock'
import { VueEspace } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const e = ESPACES.find((x) => x.id === id)
  return { title: e ? `${e.code} · Espace Cloud` : 'Espace introuvable' }
}

export default async function PageEspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!ESPACES.some((e) => e.id === id)) notFound()
  return <VueEspace id={id} />
}
