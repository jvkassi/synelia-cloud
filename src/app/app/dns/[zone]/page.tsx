import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ZONES_DNS } from '@/lib/mock'
import { VueZone } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ zone: string }>
}): Promise<Metadata> {
  const { zone } = await params
  const z = ZONES_DNS.find((x) => x.id === zone || x.domaine === zone)
  return { title: z ? `${z.domaine} · Zone DNS` : 'Zone introuvable' }
}

export default async function PageZone({ params }: { params: Promise<{ zone: string }> }) {
  const { zone } = await params
  const z = ZONES_DNS.find((x) => x.id === zone || x.domaine === zone)
  if (!z) notFound()
  return <VueZone zoneId={z.id} />
}
