import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { driveById } from '@/lib/mock'
import { VueDrive } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const d = driveById(id)
  return { title: d ? `${d.domaine} · Drive` : 'Drive introuvable' }
}

export default async function PageDrive({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!driveById(id)) notFound()
  return <VueDrive id={id} />
}
