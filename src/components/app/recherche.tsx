'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APPLICATIONS } from '@/lib/mock/paas'
import { ESPACES, VMS, K8S_CLUSTERS, LOAD_BALANCERS, BUCKETS } from '@/lib/mock/iaas'
import { SERVICES_MANAGES } from '@/lib/mock/marketplace'
import { FACTURES, TICKETS_PLATEFORME } from '@/lib/mock/commerce'
import { ORGANISATIONS } from '@/lib/mock/orgs'
import { HEBERGEMENTS, DOMAINES } from '@/lib/mock/web'
import { BACKENDS } from '@/lib/mock/iaas'

interface Entree {
  id: string
  label: string
  categorie: string
  href: string
  meta?: string
}

function entreesClient(): Entree[] {
  return [
    ...ESPACES.map((e) => ({
      id: e.id,
      label: e.code,
      categorie: 'Espaces Cloud',
      href: `/app/espaces/${e.id}`,
      meta: `${e.offreNom} · ${e.site}`,
    })),
    ...VMS.map((v) => ({
      id: v.id,
      label: v.nom,
      categorie: 'Machines virtuelles',
      href: `/app/vms/${v.id}`,
      meta: `${v.os} · ${v.ips[0]?.adresse ?? ''}`,
    })),
    ...K8S_CLUSTERS.map((c) => ({
      id: c.id,
      label: c.nom,
      categorie: 'Kubernetes',
      href: `/app/kubernetes/${c.id}`,
      meta: `v${c.version}`,
    })),
    ...LOAD_BALANCERS.map((l) => ({
      id: l.id,
      label: l.nom,
      categorie: 'Load balancers',
      href: `/app/reseau/lb/${l.id}`,
      meta: `${l.layer.toUpperCase()} · ${l.vip}`,
    })),
    ...BUCKETS.map((b) => ({
      id: b.id,
      label: b.nom,
      categorie: 'Stockage objet',
      href: `/app/objet/${b.id}`,
      meta: b.region,
    })),
    ...APPLICATIONS.map((a) => ({
      id: a.id,
      label: a.nom,
      categorie: 'Applications',
      href: `/app/apps/${a.id}`,
      meta: a.domainePrincipal,
    })),
    ...SERVICES_MANAGES.map((s) => ({
      id: s.id,
      label: s.nom,
      categorie: 'Services managés',
      href: `/app/services/${s.id}`,
      meta: s.domaine,
    })),
    ...HEBERGEMENTS.map((h) => ({
      id: h.id,
      label: h.domaine,
      categorie: 'Hébergements web',
      href: `/app/web/${h.id}`,
      meta: h.type,
    })),
    ...DOMAINES.map((d) => ({
      id: d.id,
      label: d.nom,
      categorie: 'Domaines',
      href: '/app/domaines',
      meta: `expire le ${d.expiration}`,
    })),
    ...FACTURES.map((f) => ({
      id: f.id,
      label: f.numero,
      categorie: 'Factures',
      href: '/app/facturation',
      meta: f.periode,
    })),
    ...TICKETS_PLATEFORME.filter((t) => t.orgId === 'org-dba').map((t) => ({
      id: t.id,
      label: `${t.numero} — ${t.sujet}`,
      categorie: 'Tickets',
      href: `/app/support/${t.id}`,
      meta: t.gravite,
    })),
  ]
}

function entreesFournisseur(): Entree[] {
  return [
    ...ORGANISATIONS.map((o) => ({
      id: o.id,
      label: o.nom,
      categorie: 'Organisations',
      href: `/admin/organisations/${o.id}`,
      meta: o.type,
    })),
    ...BACKENDS.map((b) => ({
      id: b.id,
      label: b.code,
      categorie: 'Backends',
      href: '/admin/capacite',
      meta: b.type,
    })),
    ...ESPACES.map((e) => ({
      id: e.id,
      label: e.code,
      categorie: 'Espaces Cloud',
      href: '/admin/capacite',
      meta: e.site,
    })),
    ...VMS.slice(0, 8).map((v) => ({
      id: v.id,
      label: v.nom,
      categorie: 'Machines virtuelles',
      href: `/app/vms/${v.id}`,
      meta: v.os,
    })),
    ...FACTURES.map((f) => ({
      id: f.id,
      label: f.numero,
      categorie: 'Factures',
      href: '/admin/facturation',
      meta: f.periode,
    })),
    ...TICKETS_PLATEFORME.map((t) => ({
      id: t.id,
      label: `${t.numero} — ${t.sujet}`,
      categorie: 'Tickets',
      href: '/admin/tickets',
      meta: t.gravite,
    })),
  ]
}

/** Recherche globale ⌘K (§1.6). */
export function RechercheGlobale({ portee = 'client' }: { portee?: 'client' | 'fournisseur' }) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [q, setQ] = useState('')

  const entrees = useMemo(
    () => (portee === 'client' ? entreesClient() : entreesFournisseur()),
    [portee],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOuvert((v) => !v)
      }
      if (e.key === 'Escape') setOuvert(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const resultats = useMemo(() => {
    if (!q.trim()) return entrees.slice(0, 8)
    const needle = q.trim().toLowerCase()
    return entrees
      .filter(
        (e) =>
          e.label.toLowerCase().includes(needle) ||
          e.categorie.toLowerCase().includes(needle) ||
          (e.meta ?? '').toLowerCase().includes(needle),
      )
      .slice(0, 14)
  }, [q, entrees])

  const groupes = useMemo(() => {
    const map = new Map<string, Entree[]>()
    for (const r of resultats) {
      const arr = map.get(r.categorie) ?? []
      arr.push(r)
      map.set(r.categorie, arr)
    }
    return Array.from(map.entries())
  }, [resultats])

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={cn(
          'flex h-8 w-full max-w-md items-center gap-2 rounded-[6px] border px-2.5 text-left transition-colors',
          portee === 'client'
            ? 'border-g-300 bg-g-050 text-g-500 hover:border-p-400 hover:bg-white'
            : 'border-white/15 bg-white/10 text-p-300 hover:bg-white/15',
        )}
      >
        <Search size={13} className="shrink-0" />
        <span className="flex-1 truncate text-[12.5px]">
          Rechercher une organisation, une ressource, une facture…
        </span>
        <kbd
          className={cn(
            'shrink-0 rounded border px-1 py-px font-mono text-[10px]',
            portee === 'client' ? 'border-g-300 bg-white' : 'border-white/20 bg-white/10',
          )}
        >
          ⌘K
        </kbd>
      </button>

      {ouvert && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
          <div
            className="fixed inset-0 bg-p-900/40 backdrop-blur-[2px]"
            onClick={() => setOuvert(false)}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-xl animate-scale-in overflow-hidden rounded-[14px] bg-white shadow-[0_24px_64px_rgba(43,27,77,.24)]">
            <div className="flex items-center gap-2.5 border-b border-g-100 px-4 py-3">
              <Search size={15} className="shrink-0 text-g-500" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher…"
                className="flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-g-500"
              />
              <kbd className="shrink-0 rounded border border-g-300 bg-g-050 px-1.5 py-0.5 font-mono text-[10px] text-g-500">
                esc
              </kbd>
            </div>
            <div className="max-h-[52vh] overflow-y-auto py-2">
              {groupes.length === 0 && (
                <p className="px-4 py-6 text-center text-[13px] text-g-500">
                  Aucun résultat pour « {q} ».
                </p>
              )}
              {groupes.map(([cat, items]) => (
                <div key={cat} className="mb-1">
                  <p className="type-micro px-4 py-1.5 text-g-500">{cat}</p>
                  {items.map((it) => (
                    <button
                      key={`${cat}-${it.id}`}
                      type="button"
                      onClick={() => {
                        setOuvert(false)
                        setQ('')
                        router.push(it.href)
                      }}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left transition-colors hover:bg-p-050"
                    >
                      <span className="min-w-0 truncate text-[13px] text-ink">{it.label}</span>
                      {it.meta && (
                        <span className="shrink-0 truncate text-[11.5px] text-g-500">{it.meta}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
