import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MOTEUR_WEB_LABEL, serveurBasesById } from '@/lib/mock'
import { VueServeurBases } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const s = serveurBasesById(id)
  return {
    title: s ? `${MOTEUR_WEB_LABEL[s.moteur]} · ${s.serveur}` : 'Moteur introuvable',
  }
}

export default async function PageServeurBases({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!serveurBasesById(id)) notFound()
  return <VueServeurBases id={id} />
}
