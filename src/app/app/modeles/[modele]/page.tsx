import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MODELES } from '@/lib/mock/modeles'
import { VueModele } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ modele: string }>
}): Promise<Metadata> {
  const { modele } = await params
  const m = MODELES.find((x) => x.slug === modele)
  return {
    title: m ? `${m.nom} — ${m.solution}` : 'Modèle introuvable',
    description: m?.phrase,
  }
}

export default async function PageModele({ params }: { params: Promise<{ modele: string }> }) {
  const { modele } = await params
  if (!MODELES.some((m) => m.slug === modele)) notFound()
  return <VueModele slug={modele} />
}
