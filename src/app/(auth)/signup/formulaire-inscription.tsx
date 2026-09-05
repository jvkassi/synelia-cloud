'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Building2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input, Select } from '@/components/ui/field'
import { PAYS, SECTEURS } from '@/lib/mock'
import { TVA_PCT } from '@/lib/format'
import { ApiError, ecrireSession, requete, type SessionApi } from '@/lib/api/client'

// `organisations.pays` côté backend est un code ISO 3166-1 alpha-2 (varchar(2)) ;
// `PAYS` n’a que des libellés pour l’affichage. ponytail: map figée pour les 12
// entrées de la liste plutôt qu’une dépendance ISO complète.
const CODE_PAYS: Record<string, string> = {
  "Côte d'Ivoire": 'CI',
  Sénégal: 'SN',
  Bénin: 'BJ',
  'Burkina Faso': 'BF',
  Mali: 'ML',
  Togo: 'TG',
  Niger: 'NE',
  Guinée: 'GN',
  Cameroun: 'CM',
  Ghana: 'GH',
  France: 'FR',
  Autre: 'CI',
}

/**
 * Inscription réelle (`POST /auth/inscription`) : un seul appel crée le
 * compte et, si `nomOrg` est renseigné, l’organisation dans la foulée — le
 * backend ne connaît pas d’étape « fournisseur d’identité » séparée.
 */
export function FormulaireInscriptionApi() {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [nomOrg, setNomOrg] = useState('')
  const [pays, setPays] = useState(PAYS[0])
  const [secteur, setSecteur] = useState('')
  const [tva, setTva] = useState('')
  const [conditions, setConditions] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const complet =
    nom.trim().length >= 2 && email.trim().length > 0 && motDePasse.length >= 8 && conditions

  const inscrire = async (e?: { preventDefault: () => void }) => {
    e?.preventDefault()
    if (!complet) return
    setChargement(true)
    setErreur(null)
    try {
      const session = await requete<SessionApi>('/auth/inscription', {
        methode: 'POST',
        corps: {
          email,
          nom,
          motDePasse,
          accepteConditions: conditions,
          ...(nomOrg.trim()
            ? {
                organisation: {
                  nom: nomOrg,
                  pays: CODE_PAYS[pays] ?? 'CI',
                  secteur: secteur || undefined,
                  tva: tva || undefined,
                },
              }
            : {}),
        },
      })
      ecrireSession(session)
      router.push('/app')
    } catch (e) {
      setErreur(
        e instanceof ApiError
          ? `${e.message}${e.correlationId ? ` Référence ${e.correlationId}.` : ''}`
          : 'Le backend ne répond pas.',
      )
    } finally {
      setChargement(false)
    }
  }

  return (
    <form className="space-y-4 rounded-[10px] border border-g-300 bg-white p-5" onSubmit={inscrire}>
      <div className="flex items-center gap-2">
        <User size={15} className="text-p-700" />
        <h2 className="type-h3">Votre identité</h2>
      </div>
      <Field label="Nom complet" required>
        <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Awa Koffi" autoFocus />
      </Field>
      <Field label="Adresse e-mail professionnelle" required>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="prenom.nom@votre-organisation.ci"
        />
      </Field>
      <Field label="Mot de passe" required hint="8 caractères minimum">
        <Input
          type="password"
          autoComplete="new-password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          placeholder="••••••••••"
        />
      </Field>

      <div className="flex items-center gap-2 border-t border-g-100 pt-4">
        <Building2 size={15} className="text-p-700" />
        <h2 className="type-h3">Votre organisation</h2>
        <span className="text-[11.5px] font-normal text-g-500">— facultatif</span>
      </div>
      <Field label="Nom de l’organisation">
        <Input
          value={nomOrg}
          onChange={(e) => setNomOrg(e.target.value)}
          placeholder="Digital Business Africa"
        />
      </Field>
      {nomOrg.trim() !== '' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Pays">
            <Select value={pays} onChange={(e) => setPays(e.target.value)}>
              {PAYS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Secteur d’activité" hint="facultatif">
            <Select value={secteur} onChange={(e) => setSecteur(e.target.value)}>
              <option value="">Sélectionner…</option>
              {SECTEURS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}
      {nomOrg.trim() !== '' && (
        <Field label="Numéro de TVA" hint="facultatif">
          <Input value={tva} onChange={(e) => setTva(e.target.value)} placeholder="CI-2019-4472-B" />
        </Field>
      )}

      <div className="border-t border-g-100 pt-4">
        <Checkbox
          checked={conditions}
          onChange={(e) => setConditions(e.target.checked)}
          label="J’accepte les conditions générales de vente et la politique de confidentialité"
          description={`Montants hors taxes en FCFA, TVA ${TVA_PCT} % appliquée à la facturation. Aucun engagement en mensuel.`}
        />
      </div>

      {erreur && <p className="text-[12.5px] font-medium text-err">{erreur}</p>}

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={chargement}
        disabled={!complet}
        iconAfter={<ArrowRight size={15} />}
      >
        Créer mon compte
      </Button>
    </form>
  )
}
