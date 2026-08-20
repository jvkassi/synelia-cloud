import type { Metadata } from 'next'
import { VueSimulateur } from './vue'

export const metadata: Metadata = {
  title: 'Simulateur de budget',
  description:
    'Configurez votre Espace Cloud, vos sièges marketplace et votre hébergement web, et comparez à votre facture VMware, AWS ou Microsoft 365 actuelle. Hypothèses de calcul affichées.',
}

export default function Simulateur() {
  return <VueSimulateur />
}
