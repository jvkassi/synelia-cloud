import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { certificatById } from '@/lib/mock'
import { VueCertificat } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const c = certificatById(id)
  return { title: c ? `${c.hote} · Certificat` : 'Certificat introuvable' }
}

export default async function PageCertificat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!certificatById(id)) notFound()
  return <VueCertificat id={id} />
}
