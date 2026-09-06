'use client'

import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { KeyRound, ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CopyField } from '@/components/ui/display'
import { Switch } from '@/components/ui/field'
import { Card, CardHeader, Callout, PageHeader } from '@/components/composition/card'
import { SkeletonCards } from '@/components/composition/states'
import { BoutonAction } from '@/components/app/actions'
import { useApp } from '@/components/app/contexte'
import { ApiError, estActif, requete } from '@/lib/api/client'

/** `GET /moi` : seul le champ `mfaEnabled` intéresse cet écran. */
interface MoiReponse {
  utilisateur: { mfaEnabled: boolean }
}

/** `POST /moi/mfa` : secret et codes de secours, renvoyés une seule fois. */
interface Enrollment {
  secret: string
  urlOtpauth: string
  codesSecours: string[]
}

export default function MonCompte() {
  const api = estActif()
  const { utilisateur } = useApp()

  const [chargement, setChargement] = useState(api)
  const [erreur, setErreur] = useState<{ message: string; correlationId?: string } | null>(null)
  const [mfaActif, setMfaActif] = useState(false)

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [sauvegarde, setSauvegarde] = useState(false)

  const charger = useCallback(() => {
    if (!api) return
    setChargement(true)
    setErreur(null)
    requete<MoiReponse>('/moi').then(
      (r) => {
        setMfaActif(r.utilisateur.mfaEnabled)
        setChargement(false)
      },
      (e: unknown) => {
        setErreur(
          e instanceof ApiError
            ? { message: e.message, correlationId: e.correlationId }
            : { message: 'Le backend ne répond pas.' },
        )
        setChargement(false)
      },
    )
  }, [api])

  useEffect(() => {
    charger()
  }, [charger])

  // Le code QR se génère entièrement dans le navigateur : le secret ne part
  // jamais vers un service tiers, contrairement à une image générée par une
  // API de QR code externe.
  useEffect(() => {
    if (!enrollment) {
      setQr(null)
      return
    }
    let annule = false
    QRCode.toDataURL(enrollment.urlOtpauth, { margin: 1, width: 208 }).then((url) => {
      if (!annule) setQr(url)
    })
    return () => {
      annule = true
    }
  }, [enrollment])

  return (
    <div className="space-y-5">
      <PageHeader
        fil={[{ label: 'Espace client', href: '/app' }, { label: 'Mon compte' }]}
        titre="Mon compte"
        sousTitre="Le mot de passe et la double authentification de votre propre compte — ce que vous réglez ici ne touche que vous, pas le reste de l’organisation."
        meta={
          <Badge tone="neutral" size="sm">
            {utilisateur.email}
          </Badge>
        }
      />

      {!api && (
        <Callout ton="warn" titre="Page indisponible en mode maquette">
          La double authentification agit sur un compte réel côté backend : cet écran n’a de sens
          qu’une fois l’API branchée. En mode maquette, aucune donnée de compte n’existe à modifier.
        </Callout>
      )}

      {api && chargement && <SkeletonCards nombre={1} hauteur="h-72" />}

      {api && !chargement && erreur && (
        <Card className="border-[#EFC3BD] bg-err-bg">
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white text-err">
              <ShieldAlert size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="type-h3">Impossible de lire l’état de votre double authentification</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-g-700">{erreur.message}</p>
              {erreur.correlationId && (
                <div className="mt-3 max-w-sm">
                  <CopyField label="Identifiant de corrélation" value={erreur.correlationId} />
                </div>
              )}
              <Button className="mt-3" size="sm" variant="secondary" onClick={charger}>
                Réessayer
              </Button>
            </div>
          </div>
        </Card>
      )}

      {api && !chargement && !erreur && (
        <Card>
          <CardHeader
            titre="Double authentification (TOTP)"
            sousTitre="Un code à 6 chiffres, généré par une application d’authentification, en plus de votre mot de passe."
            actions={
              <Badge tone={mfaActif ? 'ok' : 'warn'} dot size="sm">
                {mfaActif ? 'Activée' : 'Désactivée'}
              </Badge>
            }
          />

          {!mfaActif && !enrollment && (
            <div className="space-y-4">
              <p className="text-[12.5px] leading-relaxed text-g-700">
                Une fois activée, chaque connexion demandera en plus le code affiché par votre
                application (Google Authenticator, Authy, 1Password…). Huit codes de secours à
                usage unique sont générés en même temps, pour le jour où vous perdez l’accès à
                l’application.
              </p>
              <BoutonAction
                libelle="Activer la double authentification"
                variant="primary"
                icone={<ShieldCheck size={14} />}
                operation={{
                  titre: 'Double authentification activée',
                  detail: 'Scannez le code puis enregistrez vos codes de secours : ils ne seront plus jamais affichés.',
                  appel: () =>
                    requete<Enrollment>('/moi/mfa', {
                      methode: 'POST',
                      corps: { methode: 'totp' },
                    }).then((r) => {
                      setEnrollment(r)
                      setMfaActif(true)
                      return r
                    }),
                }}
              />
            </div>
          )}

          {enrollment && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[208px_1fr]">
                <div className="flex items-center justify-center rounded-[8px] border border-g-300 bg-white p-3">
                  {qr ? (
                    // eslint-disable-next-line @next/next/no-img-element -- data URI générée localement, pas une ressource à optimiser
                    <img src={qr} alt="Code QR d’activation de la double authentification" width={192} height={192} />
                  ) : (
                    <SkeletonCards nombre={1} hauteur="h-48" />
                  )}
                </div>
                <div className="space-y-3">
                  <CopyField
                    label="Saisie manuelle (si le code QR ne peut pas être scanné)"
                    value={enrollment.secret}
                  />
                  <p className="text-[11.5px] leading-relaxed text-g-500">
                    Scannez ce code avec votre application d’authentification, ou saisissez la clé
                    manuellement. Le compte apparaîtra sous « Synelia Cloud ».
                  </p>
                </div>
              </div>

              <div className="rounded-[8px] border border-err/40 bg-err-bg px-3.5 py-3">
                <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink">
                  <KeyRound size={13} className="shrink-0 text-err" />
                  Notez ces codes de secours maintenant — ils ne seront plus jamais affichés
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-g-700">
                  Chacun ne fonctionne qu’une fois et permet de vous reconnecter si vous perdez
                  l’accès à votre application d’authentification.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {enrollment.codesSecours.map((c) => (
                    <span
                      key={c}
                      className="rounded-[4px] bg-white px-2 py-1 text-center font-mono text-[12px] text-ink"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <Switch
                checked={sauvegarde}
                onChange={setSauvegarde}
                label="J’ai scanné le code et noté mes codes de secours dans un endroit sûr"
              />

              <Button disabled={!sauvegarde} onClick={() => setEnrollment(null)}>
                Terminé
              </Button>
            </div>
          )}

          {mfaActif && !enrollment && (
            <div className="space-y-4">
              <p className="text-[12.5px] leading-relaxed text-g-700">
                Chaque connexion demande déjà votre mot de passe et un code à 6 chiffres. La
                désactiver retire cette protection immédiatement, et vos codes de secours actuels
                deviennent invalides. Une future réactivation générera un nouveau secret.
              </p>
              <BoutonAction
                libelle="Désactiver la double authentification"
                variant="danger"
                icone={<ShieldOff size={14} />}
                operation={{
                  ton: 'warn',
                  titre: 'Double authentification désactivée',
                  detail: 'Vos codes de secours ne sont plus valables.',
                  appel: () => requete('/moi/mfa', { methode: 'DELETE' }),
                  effetFinal: () => setMfaActif(false),
                }}
                confirmation={{
                  ressource: utilisateur.email,
                  titre: 'Désactiver la double authentification ?',
                  pertes: [
                    'Le mot de passe seul suffira désormais à se connecter',
                    'Les codes de secours actuels deviendront invalides',
                  ],
                  libelleAction: 'Désactiver',
                }}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
