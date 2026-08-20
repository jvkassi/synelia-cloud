import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TICKETS } from '@/lib/mock'
import { VueTicket } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const t = TICKETS.find((x) => x.id === id || x.numero === id)
  return { title: t ? `${t.numero} · ${t.sujet}` : 'Ticket introuvable' }
}

export default async function PageTicket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = TICKETS.find((x) => x.id === id || x.numero === id)
  if (!t) notFound()
  return <VueTicket id={t.id} />
}
