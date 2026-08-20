import type { Metadata } from 'next'
import { CadreApplications } from './cadre'

export const metadata: Metadata = {
  title: 'Applications',
  description: 'Les sites installés sur vos hébergements : WordPress, PrestaShop, PHP, statique. Le contenu s\'édite dans l\'application, jamais ici.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CadreApplications>{children}</CadreApplications>
}
