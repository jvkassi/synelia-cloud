import { VuePoint } from './vue'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <VuePoint pointId={id} />
}
