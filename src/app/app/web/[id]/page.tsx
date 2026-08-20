import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { entreeWebCloudById } from '@/lib/mock'
import { VueDomaine } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const e = entreeWebCloudById(decodeURIComponent(id))
  return { title: e ? `${e.nom} · Web Cloud` : 'Domaine introuvable' }
}

export default async function PageDomaine({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const nom = decodeURIComponent(id)
  if (!entreeWebCloudById(nom)) notFound()
  return <VueDomaine id={nom} />
}
