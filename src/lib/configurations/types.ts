/**
 * Schéma de configuration d'un service managé (§6.6, onglet « Paramètres
 * spécifiques »).
 *
 * Règle qui gouverne tout ce dossier : **des politiques, jamais du contenu.**
 * Le portail règle ici ce qui est autorisé, quel quota s'applique, quelle
 * rétention court. Il n'affiche ni un message, ni un fichier, ni une écriture
 * comptable — cela se passe dans la solution amont, dont l'écran principal ne
 * doit jamais être réimplémenté.
 *
 * Chaque service a son fichier, parce que configurer une messagerie n'a
 * presque rien de commun avec configurer un Drive ou un ERP : les objets
 * diffèrent, les unités diffèrent, les risques diffèrent.
 */

/** Ce qu'il faut faire prendre effet après un changement. */
export type EffetChamp =
  | 'immediat'
  | 'redemarrage'
  | 'prochaine_connexion'
  | 'fenetre_maintenance'

interface ChampCommun {
  cle: string
  libelle: string
  /** Pourquoi ce réglage existe et ce qu'il change concrètement. */
  aide: string
  effet?: EffetChamp
  /** Conséquence sur la facture, quand il y en a une. */
  impactFacture?: string
  /** Réglage imposé par le palier ou par la conformité, donc non modifiable. */
  verrouille?: string
}

export type ChampConfig =
  | (ChampCommun & { type: 'bascule'; valeur: boolean })
  | (ChampCommun & {
      type: 'choix'
      valeur: string
      options: Array<{ valeur: string; libelle: string; detail?: string }>
    })
  | (ChampCommun & {
      type: 'nombre'
      valeur: number
      unite?: string
      min?: number
      max?: number
    })
  | (ChampCommun & { type: 'liste'; valeurs: string[]; placeholder?: string })
  | (ChampCommun & { type: 'texte'; valeur: string; placeholder?: string })
  | (ChampCommun & {
      /** État constaté, en lecture seule, avec une action de vérification. */
      type: 'etat'
      etat: 'ok' | 'attention' | 'echec'
      detail: string
      action?: string
    })

export interface SectionConfig {
  titre: string
  phrase: string
  champs: ChampConfig[]
}

export interface ConfigurationService {
  /** Slug du service au catalogue. */
  slug: string
  /** Solution amont configurée, nommée pour lever toute ambiguïté. */
  solution: string
  /** Ce que le portail gouverne pour ce service, en une phrase. */
  intro: string
  /**
   * Ce qui ne se règle pas ici, et où cela se règle. Écrire cette liste évite
   * la question « pourquoi je ne trouve pas X ? » et rappelle la frontière.
   */
  horsPerimetre: Array<{ quoi: string; ou: string }>
  sections: SectionConfig[]
}
