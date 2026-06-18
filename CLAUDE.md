# CLAUDE.md — Miroïa (application)

Standing instructions for Claude Code. Read fully before any task.
For deep detail (workflow research, feature rationale, full schema), see `PRODUCT_SPEC.md`.

---

## What this is

Miroïa is a vertical CRM / digital studio for **French image coaches** (*coachs en image* /
*conseillères en image*) — solo professionals who run colorimétrie, morphologie and style
analyses for private clients. No dedicated French software exists for this niche; that is the moat.

This repo is the **application**. The marketing site is separate (`github.com/loanrmb/Miroia`,
live at miroia.vercel.app) and is the source of truth for branding and committed features.

**Product thesis:** as the coach records colorimétrie, morphologie, style, photos and session
notes, Miroïa auto-composes a per-client **"book" / guide** (the deliverable coaches make by hand
today in PDF/Canva). The CRM and that book are the same data viewed two ways. The "reveal" is
simply sharing the book. Build everything around this spine.

---

## Stack (locked)

- **Next.js** (App Router, TypeScript, strict)
- **Supabase** — Auth, Postgres, Storage. **Region MUST be EU** (Paris `eu-west-3` or Frankfurt).
  The marketing site promises FR/EU data residency; do not use a US region.
- **Vercel** for hosting. GitHub for the repo (owner connects these manually).
- PWA-friendly; no native mobile app in scope.

## Hard rules

- **All UI copy in French.** Keep domain terms exact: colorimétrie, nuancier, morpho-visage,
  morphologie-silhouette, tri de penderie, bilan d'image, devis, facture, séance, fiche cliente.
- **TypeScript strict.** No `any` without justification.
- Database migrations are committed `.sql` files runnable in the Supabase dashboard.
- **RLS enabled on every table.** A coach only ever touches their own rows. See schema notes below.
- The public client "book" is served **server-side via a `SECURITY DEFINER` function keyed on a
  share token** — never by opening broad anonymous RLS. Only `visible_to_client = true` rows leak.
- Match the marketing site's design language (below). Do not invent a new visual identity.
- Verify the app builds and the relevant flow works before declaring a phase done.

## Design language (from the marketing site `styles.css`)

- Headings: **GT Walsheim Medium**. Body: **Inter Variable**.
- "Liquid Glass" aesthetic, multicolor prism accent:
  violet `#b266ff` → pink `#ff6699` → peach `#ff9966` → cyan `#66ccff`.
- Pull exact tokens from the marketing repo's `styles.css` rather than approximating.
- Respect `prefers-reduced-motion` on any animation.

---

## Data model (summary — full SQL in PRODUCT_SPEC.md)

Two actors: **coach** (account owner, does all work) and **client/cliente** (views her own book only).

Core tables, all RLS-enabled, all coach-scoped:
`coaches`, `clients`, `client_bilan`, `sessions`, `colorimetry_profiles`,
`morphology_profiles`, `style_profiles`, `photos`, `quotes` (devis), `invoices` (factures),
`client_books`.

Portal pattern: every shareable profile/photo row carries `visible_to_client boolean default false`.
The coach view shows everything; the book view shows only published rows. The coach controls the toggle.

Deferred (do NOT build until told): `wardrobe_items` (garde-robe virtuelle), `goals`
(suivi d'objectifs), team/roles (Studio multi-coach), analytics, import tooling.

---

## Build phases (do them in order; one phase per session)

0+1. **Skeleton** — scaffold, EU Supabase wired, coach email/password auth, full schema + RLS,
     a protected `/dashboard`, deployed to Vercel. No features.
2.   **Clients** — fiche cliente list + CRUD, bilan d'image intake (objectifs, mode de vie, budget).
3.   **Analyses** — sessions typed by prestation, the **nuancier/colorimétrie tool** (signature
     feature: saison + hex swatches "à porter"/"à éviter" + maquillage/cheveux/métaux), morpho
     (visage + silhouette), style profile.
4.   **Photos** — avant/après upload via Supabase Storage, per client/session.
5.   **Client book** — auto-composed from `visible_to_client` data; private shareable link
     (optional password). This is the reveal.
6.   **Business** — devis & factures (basic), PDF export, coach branding.
7+.  Deferred features above, as prioritized later.

The signature feature is the **nuancier (Phase 3)**. Build it well — it is what no horizontal CRM can copy.
