import type { Metadata } from 'next'
import { projetById } from '@/lib/mock'
import { VueProjet } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projet: string }>
}): Promise<Metadata> {
  const { projet } = await params
  const p = projetById(projet)
  return {
    title: p ? `${p.nom} · Projet` : 'Projet introuvable',
    description: p?.description,
  }
}

export default async function PageProjet({ params }: { params: Promise<{ projet: string }> }) {
  const { projet } = await params
  return <VueProjet id={projet} />
}
