import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CATALOGUE } from '@/lib/mock'
import { FicheService } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>
}): Promise<Metadata> {
  const { service } = await params
  const s = CATALOGUE.find((c) => c.slug === service)
  return {
    title: s ? `${s.nom} · Marketplace` : 'Service introuvable',
    description: s?.description,
  }
}

export default async function PageFicheService({
  params,
}: {
  params: Promise<{ service: string }>
}) {
  const { service } = await params
  const catalogue = CATALOGUE.find((c) => c.slug === service)
  if (!catalogue) notFound()
  return <FicheService slug={service} />
}
