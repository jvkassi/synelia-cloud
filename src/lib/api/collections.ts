/**
 * Registre collection → endpoint.
 *
 * `useCollection(nom, graine)` ne connaît que `nom` : ce registre dit quelle
 * route `GET /v1/…` sert la collection quand l’API est active. Les clés à
 * suffixe (`snapshots-<id>`, `elevations-<id>`…) et les clés inconnues n’y
 * figurent pas — elles gardent la graine de la maquette.
 */
export const REGISTRE_COLLECTIONS: Record<string, string> = {
  vms: '/vms',
  espaces: '/espaces',
  buckets: '/buckets',
  'cles-s3': '/cles-s3',
  clusters: '/kubernetes',
  reseaux: '/reseaux',
  ips: '/ips',
  'groupes-securite': '/groupes-securite',
  'load-balancers': '/load-balancers',
  tunnels: '/vpn',
  'plans-sauvegarde': '/sauvegarde/plans',
  'points-restauration': '/sauvegarde/points',
  'plans-pra': '/pra',
  projets: '/projets',
  deploiements: '/deploiements',
  'domaines-applicatifs': '/domaines-applicatifs',
  factures: '/facturation/factures',
  souscriptions: '/facturation/souscriptions',
  'moyens-paiement': '/facturation/moyens-paiement',
  memberships: '/membres',
  invitations: '/invitations',
  'jetons-api': '/securite/cles-api',
  sessions: '/securite/sessions',
  tickets: '/support/tickets',
  jobs: '/travaux',
  organisations: '/organisations',
  offres: '/admin/catalogue/offres',
  backends: '/admin/backends',
  incidents: '/admin/statut/incidents',
  'equipe-synelia': '/admin/equipe',
  hebergements: '/web/hebergements',
  'sites-web': '/web/sites',
  'serveurs-bases': '/web/bases',
  domaines: '/web/domaines',
  messageries: '/web/emails',
  drives: '/web/drive',
  certificats: '/web/ssl',
  'cles-smtp': '/web/smtp/cles',
  'bases-managees': '/bases',
  'regles-alertes': '/observabilite/alertes',
  impayes: '/admin/facturation/impayes',
  'parc-instances': '/admin/marketplace/instances',
  'campagnes-maj': '/admin/marketplace/campagnes',
  'tickets-plateforme': '/admin/tickets',
  'jobs-plateforme': '/admin/travaux',
  'attestations-generees': '/attestations',
}

/** Endpoint d’une collection, ou `undefined` quand elle reste locale. */
export function endpointDe(nom: string): string | undefined {
  return REGISTRE_COLLECTIONS[nom]
}
