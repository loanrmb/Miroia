# Miroïa — Product Spec

Reference document for building the Miroïa application. Pair with `CLAUDE.md`.
Everything here targets French *coachs en image*. UI copy is French; this spec is in English.

---

## 1. Who the users are

**Primary user = the buyer = the coach.** An independent, usually solo *coach / conseillère en
image* in France. Often a reconversion profile. Sells packages of sessions to private clients
(mostly women), working 1:1. Today she runs her practice across WhatsApp, Google Drive, Canva,
a calendar app, and manual invoicing — there is no tool built for her work.

**Secondary user = the client (cliente).** The coachee. She does not create anything. She receives
a curated, read-only **book** of her own results (palette, morpho, style, photos, recommendations).

**Not the v1 user:** salons / makeup artists / hairdressers (drifting here dissolves the niche and
puts Miroïa back in a crowded category), agencies with staff coaches (Studio tier, later), and the
client as a self-serve paying account.

---

## 2. The image-coach workflow (what the product must mirror)

The job is a consistent staged pipeline across essentially every coach:

1. **Bilan d'image / entretien préalable** (~30 min) — define needs, lifestyle, budget, objectives.
   Followed by a **devis**.
2. **Colorimétrie** (~1h30) — the one obligatory step. Draping with fabric swatches to read skin
   tone, eyes, hair. Methods scale from 4 → 8 → 12 → 16 saisons (and tonal). Output: a personal
   **nuancier** (palette of colours "à porter" vs "à éviter") applied to clothes, makeup, hair
   colour, jewellery metals.
3. **Morpho-visage / visagisme** (~1h30–2h) — face shape → haircut, glasses, makeup. Often from a photo.
4. **Morphologie-silhouette** (~1h30–2h) — body shape → cuts, materials, prints, accessories.
5. **Style** — style discovery via questionnaire / "book de style".
6. **Tri de penderie** — wardrobe sort; build outfits from existing pieces + a missing-pieces shopping list.
7. **Accompagnement shopping** — guided in-store or online with direct purchase links.

**The central deliverable is the personalized "book" / guide** the client takes home to apply the
advice autonomously. Coaches build it by hand today. In Miroïa it is generated automatically from
the data entered above. This is the spine of the product and its differentiator.

Sessions are delivered en présentiel, à domicile, en boutique, or en ligne/visio. Engagements are
multi-session and progressive, oriented toward client autonomy. Gift purchases ("offrir une séance")
are common (gift cards = a later idea, not MVP).

---

## 3. What's already sold on miroia.vercel.app/tarifs.html

The product must eventually honour these. **MVP = deliver the full Essentiel tier + the signature
book.** Higher-tier items are deferred but must not be contradicted.

| Tier | Price | Key promises |
|------|-------|--------------|
| **Essentiel** | 29 €/mo | up to 30 clientes, agenda & séances illimitées, fiches complètes, colorimétrie + morphologie, photos illimitées, devis & factures, email support |
| **Pro** | 59 €/mo | clientes illimitées, garde-robe virtuelle, suivi d'objectifs, templates de séance personnalisés, analyses avancées, branding factures, application mobile, support prioritaire |
| **Studio** | 149 €/mo | up to 5 coachs, espace équipe partagé, rôles & permissions, reporting consolidé, account manager, onboarding, accès API |

Cross-cutting commitments: **14-day free trial, no card**; **data hosted in France/EU**; import from
Notion/Airtable/Sheets (Pro/Studio); "partage cliente" of session summaries.

**Two inconsistencies to resolve with the owner:**
- Pricing FAQ says clients receive summaries **by email** ("en un clic"), i.e. *no client login*.
  This spec uses a **private shareable link** for the book — consistent with that promise, and lighter
  than full client accounts. Full client logins are an easy Supabase upgrade later if wanted.
- "Application mobile" is sold in the Pro tier, but produit.html no longer mentions iOS/Android.
  Treat "mobile" as a responsive/PWA experience until a native app is explicitly scoped, and align
  the site copy accordingly.

---

## 4. MVP feature set

**Coach side**
- Auth (email/password), coach profile + business name (for invoice branding later).
- Clients: list + fiche cliente (contact, photo, notes).
- Bilan d'image intake: objectives, lifestyle, budget, free notes.
- Sessions typed by prestation (bilan, colorimétrie, morpho-visage, morphologie-silhouette, style,
  tri de penderie, shopping, autre), each with date, status, notes.
- **Nuancier / colorimétrie tool (signature):** pick method + saison, build a palette of hex
  swatches tagged "à porter" / "à éviter", plus maquillage / cheveux / métaux recommendations.
- Morphologie module: face shape + notes; body type + notes.
- Style profile: keywords + questionnaire.
- Photos avant/après via Supabase Storage, per client/session.
- Devis & factures (basic line items, totals, PDF export).
- `visible_to_client` toggle on shareable items.
- Basic dashboard (counts, upcoming séances).

**Client side**
- A private, link-based **book**: palette, morpho summary, style, published avant/après photos,
  session recaps. Read-only. Optional password.

**Deferred (sold but not in MVP):** garde-robe virtuelle, shopping-links module, suivi d'objectifs,
customizable session templates, advanced analytics/reporting, multi-coach Studio (team, roles,
consolidated reporting, API), native mobile, import tooling.

---

## 5. Database schema (Postgres / Supabase)

All tables RLS-enabled. Coach-owned rows scoped to `auth.uid()`. Child tables scope via their parent
client's `coach_id`. The public book is read only through a `SECURITY DEFINER` function keyed on the
share token, returning only `visible_to_client = true` rows.

```sql
-- COACHES (1:1 with auth.users)
create table coaches (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  business_name text,
  created_at timestamptz default now()
);

-- CLIENTS
create table clients (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references coaches(id) on delete cascade,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  photo_path text,
  notes text,
  created_at timestamptz default now()
);

-- BILAN D'IMAGE (1:1 with client)
create table client_bilan (
  client_id uuid primary key references clients(id) on delete cascade,
  objectives text,
  lifestyle text,
  budget text,
  notes text,
  updated_at timestamptz default now()
);

-- SESSIONS / SÉANCES
create type session_type as enum
  ('bilan','colorimetrie','morpho_visage','morphologie_silhouette','style','tri_penderie','shopping','autre');
create type session_status as enum ('planned','done','cancelled');
create table sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  type session_type not null,
  session_date timestamptz,
  duration_min int,
  status session_status default 'planned',
  notes text,
  created_at timestamptz default now()
);

-- COLORIMÉTRIE / NUANCIER (1:1 with client)
create type colorimetry_method as enum ('4_saisons','8_saisons','12_saisons','16_saisons','tonal');
create table colorimetry_profiles (
  client_id uuid primary key references clients(id) on delete cascade,
  method colorimetry_method,
  season text,
  -- palette: [{ "hex":"#aabbcc", "name":"corail", "category":"porter"|"eviter" }]
  palette jsonb default '[]'::jsonb,
  makeup_notes text,
  hair_notes text,
  metals text,
  notes text,
  visible_to_client boolean not null default false,
  updated_at timestamptz default now()
);

-- MORPHOLOGIE (visage + silhouette, 1:1 with client)
create table morphology_profiles (
  client_id uuid primary key references clients(id) on delete cascade,
  face_shape text,
  face_notes text,      -- haircut / glasses / makeup
  body_type text,
  body_notes text,      -- cuts / materials / prints / accessories
  visible_to_client boolean not null default false,
  updated_at timestamptz default now()
);

-- STYLE (1:1 with client)
create table style_profiles (
  client_id uuid primary key references clients(id) on delete cascade,
  keywords text[],
  questionnaire jsonb default '{}'::jsonb,
  notes text,
  visible_to_client boolean not null default false,
  updated_at timestamptz default now()
);

-- PHOTOS (avant / après)
create type photo_kind as enum ('before','after','other');
create table photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  storage_path text not null,
  kind photo_kind default 'other',
  caption text,
  visible_to_client boolean not null default false,
  created_at timestamptz default now()
);

-- DEVIS & FACTURES
create type doc_status as enum ('draft','sent','accepted','declined','paid');
create table quotes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references coaches(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  number text,
  status doc_status default 'draft',
  line_items jsonb default '[]'::jsonb,  -- [{label, qty, unit_price}]
  subtotal numeric(10,2),
  total numeric(10,2),
  currency text default 'EUR',
  issued_at date,
  valid_until date,
  created_at timestamptz default now()
);
create table invoices (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references coaches(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  number text,
  status doc_status default 'draft',
  line_items jsonb default '[]'::jsonb,
  subtotal numeric(10,2),
  total numeric(10,2),
  currency text default 'EUR',
  issued_at date,
  due_at date,
  paid_at date,
  created_at timestamptz default now()
);

-- CLIENT BOOK (the reveal) — 1:1 with client
create table client_books (
  client_id uuid primary key references clients(id) on delete cascade,
  share_token uuid not null default gen_random_uuid() unique,
  password_hash text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz default now()
);
```

**RLS sketch** (write real policies per table):
- `coaches`: row where `id = auth.uid()`.
- `clients` and all `*_profiles`, `sessions`, `photos`: coach can CRUD where the owning
  `coach_id = auth.uid()` (resolve through `clients` for child tables).
- `quotes` / `invoices`: where `coach_id = auth.uid()`.
- `client_books`: coach-only via parent client.
- **Public book:** no anon RLS. A `SECURITY DEFINER` function
  `get_published_book(token uuid, pw text)` validates the token (+ optional password), checks
  `published = true`, and returns only `visible_to_client = true` profile/photo data + session recaps.

**Deferred tables (do not create yet):** `wardrobe_items`, `goals`, `session_templates`,
team/roles tables for Studio.

---

## 6. Build phases

| Phase | Scope | Done when |
|-------|-------|-----------|
| 0+1 | Scaffold, EU Supabase, coach auth, full schema + RLS, protected `/dashboard`, deploy | Auth flow works on Vercel |
| 2 | Fiche cliente CRUD + bilan intake | Coach can create/edit a client and her bilan |
| 3 | Sessions + **nuancier tool** + morpho + style | A full analysis can be recorded for one client |
| 4 | Photos avant/après via Storage | Upload + display, per client/session |
| 5 | Client book + private share link | A published book renders read-only via token URL |
| 6 | Devis & factures + PDF + branding | Create, total, export a devis and a facture |
| 7+ | Deferred features, prioritized later | — |

Validation: the owner will interview coaches *once an MVP exists* and iterate from there.
The schema deliberately carries the portal/book fields from day one so nothing needs re-architecting.
