import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { K8S_CLUSTERS } from '@/lib/mock'
import { VueCluster } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const c = K8S_CLUSTERS.find((x) => x.id === id)
  return { title: c ? `${c.nom} · Kubernetes` : 'Cluster introuvable' }
}

export default async function PageCluster({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!K8S_CLUSTERS.some((c) => c.id === id)) notFound()
  return <VueCluster id={id} />
}
