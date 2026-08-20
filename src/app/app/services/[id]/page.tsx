import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SERVICES_MANAGES } from '@/lib/mock'
import { AdministrationService } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const s = SERVICES_MANAGES.find((x) => x.id === id)
  return { title: s ? `${s.nom} · Administration` : 'Service introuvable' }
}

export default async function PageAdministrationService({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!SERVICES_MANAGES.some((s) => s.id === id)) notFound()
  return <AdministrationService id={id} />
}
