import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Montserrat, Open_Sans } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  weight: ['400', '600', '700'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Synelia Cloud — Infrastructure cloud souveraine en Côte d’Ivoire',
    template: '%s · Synelia Cloud',
  },
  description:
    'Espaces Cloud, machines virtuelles, Kubernetes managé, sauvegarde immuable, plan de reprise et solutions open source opérées par Synelia. Deux sites en Côte d’Ivoire : Abidjan et Grand-Bassam.',
  applicationName: 'Synelia Cloud',
  authors: [{ name: 'Synelia Group Afrique', url: 'https://synelia.tech' }],
  keywords: [
    'cloud souverain',
    "Côte d'Ivoire",
    'Abidjan',
    'Kubernetes managé',
    'sauvegarde immuable',
    'PRA',
    'Nextcloud',
    'marketplace open source',
  ],
  openGraph: {
    title: 'Synelia Cloud — Infrastructure cloud souveraine en Côte d’Ivoire',
    description:
      'Une plateforme de gestion de cloud multi-tenant : infrastructure, applications et solutions open source opérées, hébergées à Abidjan et Grand-Bassam.',
    type: 'website',
    locale: 'fr_CI',
    siteName: 'Synelia Cloud',
  },
}

export const viewport: Viewport = {
  themeColor: '#4B2882',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${montserrat.variable} ${openSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
