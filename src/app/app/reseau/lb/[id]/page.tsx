import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOAD_BALANCERS } from '@/lib/mock'
import { VueLb } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const l = LOAD_BALANCERS.find((x) => x.id === id)
  return { title: l ? `${l.nom} · Load balancer` : 'Load balancer introuvable' }
}

export default async function PageLb({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!LOAD_BALANCERS.some((l) => l.id === id)) notFound()
  return <VueLb id={id} />
}
