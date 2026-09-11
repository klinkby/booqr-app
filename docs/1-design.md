# Multi-Tenancy Design — Booqr App (Frontend)

> Companion: `docs/implementation.md` (orchestration guide for implementation agents).
> Backend counterpart (schema, RLS, roles, admin CLI) lives in the `klinkby/booqr` repo. This document
> carries the full system design for context; the **frontend work is §3**, and the **API contract in §2**
> is what this repo depends on.

## Context

Booqr is becoming multi-tenant: multiple independent businesses on one deployment, each on its own
subdomain (`<slug>.booqr.dk`), each seeing only its own data. Isolation is **enforced by the database**
(backend concern). The SPA's job is to resolve which tenant it is serving from the host, brand accordingly,
and send unknown subdomains to the marketing site.

## System model (brief)

- **One shared Postgres schema** with a `tenant_id` column per table, protected by Row-Level Security, and
  **one DB login role per tenant**. The backend connects as the tenant's role, so every query is confined to
  that tenant by the database. (Full detail in the backend repo.)
- **Tenant identity = immutable integer id**; the **slug** (`acme` in `acme.booqr.dk`) is the public routing
  label, validated as a DNS label `^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?$`.
- **Reserved/apex hosts** — `www`, `api`, naked `booqr.dk` — carry **no tenant** and serve the marketing /
  onboarding site, not the booking app.

## 2. API contract the SPA depends on (implemented by backend)

- **`GET /api/tenant`** (anonymous): resolves the tenant from the `Host` header.
  - Known tenant → `200` with public branding: `{ id, slug, displayName, logo? }` (no secrets, no
    cross-tenant data).
  - Unknown / deleted / malformed subdomain → **`404` ProblemDetails, `type: tenant-not-found`**.
  - **Never a redirect** — a 302 would be wrong for `fetch`/XHR. The browser-level redirect is the SPA's job.
- Access tokens carry a `tenant` claim; the backend rejects a token whose tenant ≠ the host-resolved tenant
  (`403`). The SPA does not need to read the claim — it just must not reuse a session across subdomains.
- All existing `/api/*` collection/detail/auth endpoints are unchanged in shape; they are simply
  tenant-scoped server-side. Pagination (`Start`/`Num`), `{ items }` envelopes, and `apiErrorMessage`
  handling are unchanged.

## 3. Frontend changes (this repo)

SvelteKit 5 SPA (runes), static SPA mode, `ssr = false`.

1. **Tenant state singleton** — new `src/lib/tenant.svelte.js`: a runes-based `TenantState` (mirroring
   `auth.svelte.js`) holding `{ id, slug, displayName, logo }` and a `resolved`/`notFound` status. Export a
   singleton `tenant`. Export from `src/lib/index.js`.
2. **Bootstrap** in `src/routes/+layout.svelte` — mirror the existing auth/locale bootstrap: on mount (client
   only), call `GET /api/tenant` via the generated client (or `request` from `$lib/api/core/request` if the
   generated service lacks it), populate `tenant`.
   - On **`tenant-not-found`** → redirect the browser to `https://www.booqr.dk` with a full-page
     `window.location.assign('https://www.booqr.dk')` (cross-origin; `goto` is same-origin only). Do **not**
     render the app shell first (avoid a flash).
   - On reserved/apex host (no subdomain, or `www`) → render the marketing/landing + onboarding view, not
     the tenant booking app. (Detect from `window.location.hostname` against the base domain.)
   - On success → proceed; expose `tenant` to the tree.
3. **Per-tenant branding** — surface `tenant.displayName` (and logo if present) in `NavBar`/`<title>` via the
   presentational component props already in `src/lib/components/`. Keep components presentational (props in,
   no API calls).
4. **Session hygiene across subdomains** — ensure logout/`queryClient.clear()` and `auth.clear()` behavior is
   unaffected; a session belongs to one subdomain. No new global identity.
5. **i18n** — any new user-facing strings (e.g. an interstitial while resolving, or a "redirecting…" state)
   go through Paraglide (`messages/en.json`, `messages/da.json`); never hard-code copy.

**Accessibility & semantics (required):** any new view keeps a single `<main id="main">`, one `<h1>`, the
skip link, labelled controls, and WCAG AA contrast. The resolving/redirecting state uses `role="status"` /
`aria-live` for the announcement rather than a silent spinner.

## 4. Edge / domain (backend/ops, for context)

- HAProxy accepts `*.booqr.dk`, routes `/api/` → API and everything else → this SPA, redirects only the
  **naked apex** `booqr.dk` → `www` (an exact match — the old prefix rule wrongly rewrote
  `alice.booqr.dk` → `www.alice.booqr.dk`).
- DNS wildcard `*.booqr.dk`; wildcard TLS cert. The SPA is served identically for every `*.booqr.dk`; tenant
  validity is decided only by `GET /api/tenant`.

## 5. Verification (this repo)

- `npm run lint` (ESLint + Prettier) and `npm run format`.
- `npm run test:e2e` (Playwright) — **never** `npx playwright test` / `npm test` directly. Cover:
  - a **known-tenant load**: `GET /api/tenant` mocked `200` → app renders with branding, single `<main>`,
    one `<h1>`, skip link present;
  - an **unknown subdomain**: mocked `404 tenant-not-found` → browser redirected to `www.booqr.dk`
    (assert navigation), no tenant app content rendered;
  - **reserved/apex host** → marketing view.
  - Credentials via `TEST_EMAIL`/`TEST_PASSWORD` from `.env`; never hard-code or log tokens.
- UI/UX change → the PR attaches a Playwright screenshot of the branded app and the redirect behavior.

## Security notes (frontend)

- Treat tenant validity as decided **only** by the API response — the SPA is served for any `*.booqr.dk`, so
  never assume a subdomain is valid client-side.
- Show generic errors via `apiErrorMessage`; never render backend internals.
- Keep `withCredentials` scoped to `/api/` paths; never send credentials cross-origin (the `www` redirect is
  a plain navigation, no credentials).
- Never log tenant identifiers, tokens, PII, or the `Host` value.
- No `{@html}`; rely on Svelte auto-escaping for tenant `displayName`/branding (attacker-influenced only via
  a provisioned tenant, but treat as untrusted and escape).
