import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BUCKETS } from '@/lib/mock'
import { VueBucket } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const b = BUCKETS.find((x) => x.id === id)
  return { title: b ? `${b.nom} · Bucket S3` : 'Bucket introuvable' }
}

export default async function PageBucket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!BUCKETS.some((b) => b.id === id)) notFound()
  return <VueBucket id={id} />
}
