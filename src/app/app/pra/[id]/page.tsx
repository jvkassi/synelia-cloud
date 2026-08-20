import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DR_PLANS } from '@/lib/mock'
import { VuePra } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const p = DR_PLANS.find((x) => x.id === id)
  return { title: p ? `${p.nom} · Plan de reprise` : 'Plan introuvable' }
}

export default async function PagePra({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!DR_PLANS.some((p) => p.id === id)) notFound()
  return <VuePra id={id} />
}
