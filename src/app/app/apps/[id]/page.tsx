import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { APPLICATIONS } from '@/lib/mock'
import { VueApplication } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const a = APPLICATIONS.find((x) => x.id === id)
  return { title: a ? `${a.nom} · Application` : 'Application introuvable' }
}

export default async function PageApplication({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!APPLICATIONS.some((a) => a.id === id)) notFound()
  return <VueApplication id={id} />
}
