import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CATALOGUE } from '@/lib/mock'
import { AssistantSouscription } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>
}): Promise<Metadata> {
  const { service } = await params
  const s = CATALOGUE.find((c) => c.slug === service)
  return { title: s ? `Souscrire à ${s.nom}` : 'Service introuvable' }
}

export default async function PageSouscription({
  params,
}: {
  params: Promise<{ service: string }>
}) {
  const { service } = await params
  if (!CATALOGUE.some((c) => c.slug === service)) notFound()
  return <AssistantSouscription slug={service} />
}
