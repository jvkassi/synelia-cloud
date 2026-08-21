import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TYPE_SERVICE_LABEL, projetById, serviceProjetById } from '@/lib/mock'
import { VueService } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projet: string; service: string }>
}): Promise<Metadata> {
  const { service } = await params
  const s = serviceProjetById(service)
  return {
    title: s ? `${s.nom} · ${TYPE_SERVICE_LABEL[s.type]}` : 'Service introuvable',
  }
}

export default async function PageService({
  params,
}: {
  params: Promise<{ projet: string; service: string }>
}) {
  const { projet, service } = await params
  const s = serviceProjetById(service)
  // Le service doit exister ET appartenir au projet de l'URL : sinon l'adresse
  // décrit une hiérarchie qui n'existe pas, et vaut un 404.
  if (!s || s.projetId !== projet || !projetById(projet)) notFound()
  return <VueService id={service} />
}
