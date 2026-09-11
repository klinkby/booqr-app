# Implementation Guide — Frontend Multi-Tenancy (orchestration)

Audience: the **frontend orchestration agent**. You coordinate; you spawn **subagents** to implement
well-scoped subtasks in parallel. Read `docs/1-design.md` first — it is the source of truth. This guide is
*how* to build it safely. The frontend work is small; most of the design lives server-side.

## Orchestration model

- **Model policy (per user preference):**
  - **Haiku** subagents for routine, well-bounded subtasks (a presentational tweak, wiring props, adding
    Paraglide strings, an e2e spec that follows an existing one).
  - **Sonnet** subagents for **security-sensitive or cross-cutting** subtasks — the tenant bootstrap +
    redirect logic, and anything touching auth/session or the API layer. Marked **[SONNET]** below;
    everything else **[HAIKU]**.
- **Parallelism:** the tenant-state singleton (Task 1) is the shared contract — build it **first**, then the
  rest can run in parallel. Do not let two subagents edit `+layout.svelte` at once.
- **Each subagent gets:** the relevant part of `docs/1-design.md`, exact files, the existing pattern to
  mirror (cite paths — e.g. `src/lib/auth.svelte.js`, `src/routes/admin/plan/planData.svelte.js`), its
  validation command, and its security checklist item. Tell it **not** to add features beyond its subtask.

## Ground rules every subagent must follow (from repo AGENTS.md)

- **Svelte 5 runes** only: `$state`, `$derived`, `$props`, `$effect`. `$derived(expr)` for expressions,
  `$derived.by(fn)` for bodies — **never** `$derived(() => …)`. Event attributes (`onclick={…}`), not
  `on:click`. Navigation via `goto` for same-origin; **cross-origin** (the `www` redirect) uses
  `window.location.assign(...)`.
- **Presentational components** (`src/lib/components/`) never call API services — props in, callbacks out.
  Data/bootstrap logic lives in route-local `*.svelte.js` hooks / `src/lib/*.svelte.js`.
- **Never edit `src/lib/api/**`** (generated). Extend via `request` from `$lib/api/core/request` if needed.
- **i18n:** all user-facing copy through Paraglide (`messages/en.json`, `messages/da.json`); import `m` from
  `$lib/paraglide/messages.js`. Never hard-code strings; never edit generated `src/lib/paraglide/**`.
- **Accessibility (blocking):** single `<main id="main">`, one `<h1>`, skip link, labelled controls, WCAG AA;
  dynamic states use `role="status"`/`aria-live`. Markup works without JS where progressive enhancement
  applies.
- **Verification:** `npm run lint` + `npm run format`; e2e via **`npm run test:e2e`** only (never
  `npx playwright test` / `npm test`). Keys `(item.id)` on `#each`; `SvelteMap` not `new Map()` for reactive
  state.
- **Conventional commits.** **Run lint + e2e before committing.** No scope creep — flag ambiguity to the
  orchestrator.

## Work breakdown

### Task 1 — Tenant state singleton  **[HAIKU]** (build first; shared contract)
- New `src/lib/tenant.svelte.js`: a runes `TenantState` mirroring `src/lib/auth.svelte.js`, holding
  `{ id, slug, displayName, logo }` and a status (`loading` / `resolved` / `notFound`). Export singleton
  `tenant`; re-export from `src/lib/index.js`.
- No API call inside the singleton module top-level beyond what mirrors `auth` init; the actual fetch is
  driven from the layout (Task 2).
- **Gate:** lint clean; imports resolve.

### Task 2 — Bootstrap + unknown-subdomain redirect  **[SONNET]** (after Task 1)
- In `src/routes/+layout.svelte`, mirror the existing auth/locale bootstrap `$effect` (client-only,
  `ssr = false`): call `GET /api/tenant` via the generated client (or `request`), populate `tenant`.
  - `200` → `tenant.resolved`, render the app.
  - **`404 tenant-not-found`** → `window.location.assign('https://www.booqr.dk')`; do **not** render the app
    shell first (guard the render so there's no flash of tenant UI).
  - **Reserved/apex host** (no subdomain or `www`/base domain, detected from `window.location.hostname`) →
    render the marketing/landing + onboarding view, not the booking app.
  - While resolving, show an accessible `role="status"` interstitial (Paraglide copy).
- **Gate:** e2e for known-tenant load, unknown-subdomain redirect, and apex/marketing view all pass.

### Task 3 — Per-tenant branding  **[HAIKU]** (after Task 1; parallel with Task 4)
- Surface `tenant.displayName` (+ logo if present) in `NavBar`/`<title>` via existing presentational
  component props. Keep components presentational; pass branding down as props from the layout.
- **Gate:** lint clean; branding renders from mocked `tenant`.

### Task 4 — i18n strings  **[HAIKU]** (parallel with Task 3)
- Add any new copy (resolving/redirecting interstitial, marketing-view labels if introduced) to
  `messages/en.json` + `messages/da.json`; reference via `m.*`.
- **Gate:** Paraglide compiles in the Vite build; no hard-coded strings.

### Task 5 — E2E specs  **[HAIKU]** (after Task 2)
- Playwright specs (mirror existing ones): mock `GET /api/tenant` → `200` (branded app renders; assert one
  `<main>`, one `<h1>`, skip link) and → `404 tenant-not-found` (assert navigation to `www.booqr.dk`, no
  tenant content); apex host → marketing view. Credentials from `TEST_EMAIL`/`TEST_PASSWORD`; never log
  tokens.
- **Gate:** `npm run test:e2e` green.

## Security checklist (OWASP-aligned) — orchestrator verifies before final commit

- **Tenant validity is server-decided:** the SPA never treats a subdomain as valid without a `200` from
  `GET /api/tenant`; unknown → redirect, never a partial render of tenant UI.
- **No cross-origin credential leak:** the `www` redirect is a plain navigation with no credentials;
  `withCredentials` stays scoped to `/api/` paths.
- **Session hygiene:** a session belongs to one subdomain; logout still `queryClient.clear()` + `auth.clear()`;
  no global identity introduced.
- **XSS:** tenant `displayName`/branding is untrusted (attacker-influenceable via provisioning) — rely on
  Svelte auto-escaping, **no `{@html}`**; if ever needed, `DOMPurify`.
- **No logging** of tokens, PII, `Host`, or tenant identifiers.
- **Error messaging:** generic via `apiErrorMessage(err, fallback)`; never surface backend internals.
- **Bloat/simplification pass:** reuse `auth.svelte.js`/`resourceQuery.svelte.js` patterns; no new state
  store or persistence key beyond `tenant.svelte.js`; keep components presentational.

## Definition of done

- `npm run lint` + `npm run format` clean; `npm run test:e2e` green (all three scenarios above).
- Accessibility invariants hold (landmarks, single H1, skip link, `aria-live` on the resolving state).
- PR attaches a **Playwright screenshot** of the branded app and the redirect behavior (per user preference
  for UI/UX changes in this NPM project).
- Conventional commits; pushed to `claude/multi-tenancy-options-fsx16n`. No feature beyond the design.
