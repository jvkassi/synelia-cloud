import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { projetById } from '@/lib/mock'
import { VueBackup } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projet: string }>
}): Promise<Metadata> {
  const { projet } = await params
  const p = projetById(projet)
  return { title: p ? `Sauvegardes · ${p.nom}` : 'Projet introuvable' }
}

export default async function Page({ params }: { params: Promise<{ projet: string }> }) {
  const { projet } = await params
  if (!projetById(projet)) notFound()
  return <VueBackup id={projet} />
}
