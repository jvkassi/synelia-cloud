/**
 * Registre des configurations de service.
 *
 * Un fichier par service, indexé par son slug au catalogue. Configurer une
 * messagerie n'a presque rien de commun avec configurer un Drive ou un ERP :
 * les objets diffèrent (domaines contre dossiers contre modules), les unités
 * diffèrent (boîtes contre Go contre utilisateurs), les risques diffèrent
 * (réputation d'expédition contre partage public contre clôture comptable).
 * Un formulaire générique aurait donc menti sur les trois plans.
 */

import type { ConfigurationService } from './types'
import { CONFIG_DRIVE_PRO } from './drive-pro'
import { CONFIG_EMAIL_PRO } from './email-pro'
import { CONFIG_VISIO } from './visio'
import { CONFIG_GED } from './ged'
import { CONFIG_ERP } from './erp'
import { CONFIG_CRM } from './crm'
import { CONFIG_WORDPRESS } from './wordpress'
import { CONFIG_PRESTASHOP } from './prestashop'
import { CONFIG_BI } from './bi'
import { CONFIG_FORGE } from './forge'
import { CONFIG_COFFRE } from './coffre'
import { CONFIG_AUTOMATISATION } from './automatisation'
import { CONFIG_ANALYTICS_WEB } from './analytics-web'

export * from './types'

const TOUTES: ConfigurationService[] = [
  CONFIG_DRIVE_PRO,
  CONFIG_EMAIL_PRO,
  CONFIG_VISIO,
  CONFIG_GED,
  CONFIG_ERP,
  CONFIG_CRM,
  CONFIG_WORDPRESS,
  CONFIG_PRESTASHOP,
  CONFIG_BI,
  CONFIG_FORGE,
  CONFIG_COFFRE,
  CONFIG_AUTOMATISATION,
  CONFIG_ANALYTICS_WEB,
]

export const CONFIGURATIONS: Record<string, ConfigurationService> = Object.fromEntries(
  TOUTES.map((c) => [c.slug, c]),
)

/** Configuration d'un service, ou `undefined` si le catalogue n'en décrit pas. */
export function configurationDuService(slug: string): ConfigurationService | undefined {
  return CONFIGURATIONS[slug]
}

/** Nombre de réglages exposés, pour annoncer la densité de l'onglet. */
export function compteReglages(config: ConfigurationService): number {
  return config.sections.reduce((total, s) => total + s.champs.length, 0)
}
