import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { VMS } from '@/lib/mock'
import { VueVm } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vm: string }>
}): Promise<Metadata> {
  const { vm } = await params
  const m = VMS.find((x) => x.id === vm)
  return { title: m ? `${m.nom} · Machine virtuelle` : 'Machine introuvable' }
}

export default async function PageVm({ params }: { params: Promise<{ vm: string }> }) {
  const { vm } = await params
  if (!VMS.some((m) => m.id === vm)) notFound()
  return <VueVm id={vm} />
}
