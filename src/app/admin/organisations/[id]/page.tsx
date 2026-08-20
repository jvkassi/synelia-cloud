import type { Metadata } from 'next'
import { ORGANISATIONS } from '@/lib/mock'
import { VueOrganisation } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const o = ORGANISATIONS.find((x) => x.id === id)
  return { title: o ? `${o.nom} · Organisation` : 'Organisation' }
}

/**
 * Pas de `notFound()` : une organisation créée pendant la session n'existe pas
 * dans le jeu figé, et un 404 du serveur ferait croire à une panne. C'est la
 * vue cliente qui sait ce qu'elle trouve, et qui le dit.
 */
export default async function PageOrganisation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <VueOrganisation id={id} />
}
