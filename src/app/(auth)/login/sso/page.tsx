'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Building2, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Callout, KeyValueList } from '@/components/composition/card'
import { ErrorState } from '@/components/composition/states'

interface Fournisseur {
  domaine: string
  nom: string
  protocole: 'OIDC' | 'SAML'
  utilisateurs: number
  issuer: string
}

const ANNUAIRE: Fournisseur[] = [
  {
    domaine: 'dba.africa',
    nom: 'Keycloak DBA',
    protocole: 'OIDC',
    utilisateurs: 6,
    issuer: 'https://sso.synelia.cloud/realms/dba-africa',
  },
  {
    domaine: 'cofina-digital.ci',
    nom: 'Cofina Directory',
    protocole: 'SAML',
    utilisateurs: 24,
    issuer: 'https://adfs.cofina-digital.ci/adfs/services/trust',
  },
  {
    domaine: 'oneci.ci',
    nom: 'ONECI Identity',
    protocole: 'SAML',
    utilisateurs: 38,
    issuer: 'https://idp.oneci.ci/saml2/metadata',
  },
]

export default function ConnexionSso() {
  const [domaine, setDomaine] = useState('')
  const [etat, setEtat] = useState<'vide' | 'recherche' | 'trouve' | 'inconnu'>('vide')
  const [resultat, setResultat] = useState<Fournisseur | null>(null)

  const resoudre = () => {
    const cible = domaine.trim().toLowerCase().replace(/^@/, '')
    if (!cible) return
    setEtat('recherche')
    const trouve = ANNUAIRE.find((f) => f.domaine === cible || cible.endsWith(`.${f.domaine}`))
    // Résolution synchrone : la maquette n'effectue aucun appel réseau.
    if (trouve) {
      setResultat(trouve)
      setEtat('trouve')
    } else {
      setResultat(null)
      setEtat('inconnu')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-g-500 transition-colors hover:text-p-700"
        >
          <ArrowLeft size={13} />
          Retour aux modes de connexion
        </Link>
        <h1 className="type-h1 mt-3">SSO de mon entreprise</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-g-500">
          Saisissez le domaine de votre organisation. Nous résolvons le fournisseur d’identité
          déclaré, puis vous redirigeons vers lui.
        </p>
      </div>

      <div className="rounded-[10px] border border-g-300 bg-white p-5">
        <Field
          label="Domaine de votre organisation"
          hint="par exemple acme.ci"
        >
          <Input
            iconBefore={<Building2 size={14} />}
            placeholder="acme.ci"
            value={domaine}
            onChange={(e) => {
              setDomaine(e.target.value)
              setEtat('vide')
            }}
            onKeyDown={(e) => e.key === 'Enter' && resoudre()}
            autoFocus
          />
        </Field>
        <Button
          fullWidth
          className="mt-3.5"
          onClick={resoudre}
          disabled={!domaine.trim()}
          loading={etat === 'recherche'}
          iconBefore={<Search size={14} />}
        >
          Résoudre mon fournisseur
        </Button>
      </div>

      {etat === 'trouve' && resultat && (
        <div className="space-y-3.5 rounded-[10px] border border-[#B7E3D0] bg-ok-bg p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="ok" dot>
              Fournisseur trouvé
            </Badge>
            <span className="text-[13px] font-bold text-ink">{resultat.nom}</span>
            <Badge tone="neutral" size="sm">
              {resultat.protocole}
            </Badge>
          </div>
          <KeyValueList
            colonnes={1}
            items={[
              { cle: 'Domaine vérifié', valeur: resultat.domaine },
              { cle: 'Utilisateurs fédérés', valeur: `${resultat.utilisateurs} comptes synchronisés` },
              {
                cle: 'Issuer',
                valeur: <span className="break-all font-mono text-[11.5px]">{resultat.issuer}</span>,
              },
            ]}
          />
          <ButtonLink href="/callback" fullWidth iconAfter={<ArrowRight size={14} />}>
            Continuer vers {resultat.domaine}
          </ButtonLink>
          <p className="text-[11.5px] leading-relaxed text-g-700">
            Vous allez être redirigé vers l’écran d’authentification de votre organisation. Vos
            groupes d’annuaire déterminent vos rôles dans Synelia Cloud.
          </p>
        </div>
      )}

      {etat === 'inconnu' && (
        <ErrorState
          titre="Aucun fournisseur d’identité pour ce domaine"
          cause={`Le domaine « ${domaine.trim()} » n’est pas déclaré comme domaine vérifié d’une organisation Synelia Cloud, ou la fédération n’a pas encore été configurée par son administrateur.`}
          reprise="Vérifiez l’orthographe du domaine, demandez à votre administrateur s’il a bien vérifié le domaine et activé la fédération, ou revenez à la connexion par e-mail."
          seed={`sso-${domaine}`}
        />
      )}

      {etat === 'inconnu' && (
        <ButtonLink href="/login" variant="secondary" fullWidth>
          Revenir à la connexion par e-mail
        </ButtonLink>
      )}

      <Callout ton="info" titre="Comment fonctionne la fédération">
        Synelia Cloud accepte OpenID Connect et SAML 2.0. Le provisioning à la première connexion
        (JIT) crée le compte au premier accès, et le mapping des groupes de votre annuaire vers les
        rôles Synelia est défini par votre administrateur dans l’espace client.
      </Callout>
    </div>
  )
}
