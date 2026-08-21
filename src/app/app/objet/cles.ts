/**
 * Clés d'accès S3 — partagées entre la liste des buckets et la fiche d'un
 * bucket, qui montrent la même collection sous deux angles.
 */
export interface CleS3 {
  id: string
  nom: string
  portee: string
  creee: string
  derniereUtilisation: string
}

export const CHAMPS_CLE = [
  { id: 'nom', label: 'Nom de la clé', placeholder: 'app-metier-uploads', obligatoire: true },
  {
    id: 'portee',
    label: 'Portée',
    type: 'select' as const,
    options: [
      { value: 'lecture', label: 'Lecture seule' },
      { value: 'ecriture', label: 'Lecture et écriture' },
      { value: 'admin', label: 'Administration du bucket' },
    ],
  },
]
