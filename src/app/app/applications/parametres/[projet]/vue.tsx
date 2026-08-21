'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { money } from '@/lib/format'
import { projetById, servicesDuProjet } from '@/lib/mock'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GatedAction } from '@/components/ui/display'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/field'
import { Card, CardHeader } from '@/components/composition/card'
import { ConfirmDialog } from '@/components/ui/overlay'
import { EnteteProjet } from '@/components/business/projets'
import { useApp } from '@/components/app/contexte'

export function VueParametres({ id }: { id: string }) {
  const projet = projetById(id)!
  const { autorise, refus } = useApp()
  const services = servicesDuProjet(projet.id)
  const [suppression, setSuppression] = useState(false)

  return (
    <div className="space-y-5">
      <EnteteProjet
        projet={projet}
        section="Paramètres"
        titre="Paramètres du projet"
        sousTitre="L’identité du projet, ses environnements et son rattachement à un Espace Cloud. Ces réglages ne touchent aucun service en marche — sauf la suppression, qui les détruit tous."
        meta={
          <>
            <Badge tone="neutral">
              {services.length} service{services.length > 1 ? 's' : ''}
            </Badge>
            <Badge tone="neutral">
              Espace <span className="font-mono">{projet.espaceId.toUpperCase()}</span>
            </Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            titre="Identité du projet"
            sousTitre="Le nom apparaît dans les journaux, la facturation et le showback."
          />
          <div className="space-y-3.5">
            <Field label="Nom">
              <Input defaultValue={projet.nom} />
            </Field>
            <Field label="Description">
              <Textarea rows={3} defaultValue={projet.description} />
            </Field>
            <Field
              label="Espace Cloud de rattachement"
              hint="Détermine le quota consommé et le site physique par défaut des services."
            >
              <Select defaultValue={projet.espaceId}>
                <option value={projet.espaceId}>{projet.espaceId.toUpperCase()}</option>
              </Select>
            </Field>
          </div>
          <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
            <Button size="sm" className="mt-4">
              Enregistrer
            </Button>
          </GatedAction>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              titre="Environnements"
              sousTitre="Ajouter un environnement ne déploie rien : il naît vide."
            />
            <div className="space-y-2">
              {projet.environnements.map((e) => (
                <div
                  key={e}
                  className="flex items-center justify-between gap-3 rounded-[6px] border border-g-300 px-3 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-ink">{e}</span>
                    <span className="block text-[11px] text-g-500">
                      {services.filter((s) => s.environnement === e).length} service(s) ·{' '}
                      {money(
                        services
                          .filter((s) => s.environnement === e)
                          .reduce((a, s) => a + s.coutMensuel, 0),
                      )}
                      /mois
                    </span>
                  </span>
                  {e === 'Production' ? (
                    <Badge tone="violet" size="sm">
                      Protégé
                    </Badge>
                  ) : (
                    <Switch checked={false} onChange={() => {}} label="Approbation requise" />
                  )}
                </div>
              ))}
            </div>
            <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                iconBefore={<Plus size={13} />}
              >
                Ajouter un environnement
              </Button>
            </GatedAction>
          </Card>

          <Card className="border-err/40">
            <CardHeader
              titre="Supprimer le projet"
              sousTitre="Irréversible. Les services, leurs volumes et leurs sauvegardes sont détruits."
            />
            <ul className="mb-3 space-y-1 text-[12px] text-g-700">
              <li>
                {services.length} service{services.length > 1 ? 's' : ''} arrêté
                {services.length > 1 ? 's' : ''} puis supprimé{services.length > 1 ? 's' : ''}
              </li>
              <li>
                {services.filter((s) => s.type === 'base').length} base(s) de données et leurs
                volumes
              </li>
              <li>Les domaines rattachés cessent de répondre immédiatement</li>
            </ul>
            <GatedAction autorise={autorise('app.deploy')} message={refus('app.deploy')}>
              <Button
                variant="danger"
                size="sm"
                iconBefore={<Trash2 size={13} />}
                onClick={() => setSuppression(true)}
              >
                Supprimer ce projet
              </Button>
            </GatedAction>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={suppression}
        onClose={() => setSuppression(false)}
        onConfirm={() => setSuppression(false)}
        titre="Supprimer le projet"
        ressource={projet.nom}
        pertes={[
          `${services.length} service(s) en cours d’exécution`,
          `${services.filter((s) => s.type === 'base').length} base(s) de données et leurs volumes`,
          'Les sauvegardes associées, au-delà de la rétention légale',
          'Les domaines rattachés, qui cesseront de répondre',
        ]}
        libelleAction="Supprimer définitivement"
      />
    </div>
  )
}
