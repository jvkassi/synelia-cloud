import type { Metadata } from 'next'
import { JOBS, JOBS_PLATEFORME } from '@/lib/mock'
import { VueSuiviTache } from './vue'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const job = [...JOBS, ...JOBS_PLATEFORME].find((j) => j.id === id)
  return { title: job ? `Suivi · ${job.label}` : 'Suivi de tâche' }
}

export default async function PageSuiviTache({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <VueSuiviTache id={id} />
}
