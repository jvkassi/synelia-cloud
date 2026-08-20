import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { messagerieById } from '@/lib/mock'
import { VueMessagerie } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const m = messagerieById(id)
  return { title: m ? `${m.domaine} · Messagerie` : 'Messagerie introuvable' }
}

export default async function PageMessagerie({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!messagerieById(id)) notFound()
  return <VueMessagerie id={id} />
}
