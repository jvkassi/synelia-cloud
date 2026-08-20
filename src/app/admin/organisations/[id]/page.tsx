import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ORGANISATIONS } from '@/lib/mock'
import { VueOrganisation } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const o = ORGANISATIONS.find((x) => x.id === id)
  return { title: o ? `${o.nom} · Organisation` : 'Organisation introuvable' }
}

export default async function PageOrganisation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!ORGANISATIONS.some((o) => o.id === id)) notFound()
  return <VueOrganisation id={id} />
}
