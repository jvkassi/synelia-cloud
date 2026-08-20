import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { siteById } from '@/lib/mock'
import { VueApplication } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const s = siteById(id)
  return { title: s ? `${s.hote} · Application` : 'Application introuvable' }
}

export default async function PageApplication({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!siteById(id)) notFound()
  return <VueApplication id={id} />
}
