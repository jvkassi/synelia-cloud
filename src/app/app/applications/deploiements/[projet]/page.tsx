import type { Metadata } from 'next'
import { projetById } from '@/lib/mock'
import { VueDeploiements } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projet: string }>
}): Promise<Metadata> {
  const { projet } = await params
  const p = projetById(projet)
  return { title: p ? `Déploiements · ${p.nom}` : 'Projet introuvable' }
}

export default async function Page({ params }: { params: Promise<{ projet: string }> }) {
  const { projet } = await params
  return <VueDeploiements id={projet} />
}
