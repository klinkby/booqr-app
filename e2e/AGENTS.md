# E2E Tests - Agent Guidelines

Playwright end-to-end tests. No unit tests exist in this project — this is the only test layer.

## Running

- **Always** `npm run test:e2e` — never `npx playwright test` or `npm test` directly.
- The config (`playwright.config.js`) starts its own preview server: `npm run build && npm run preview`
  on port 4173, so a run always builds first. Chromium-only, headless.
- Credentials come from `.env` via `dotenv.config()` in `playwright.config.js` (`TEST_EMAIL` / `TEST_PASSWORD`)
  — never hardcode them. Tests fall back to `test@example.com` / `TestPassword1!` only so a missing `.env`
  doesn't crash mock-only specs.

## Mocking (`mocks.js`)

Most specs run offline against route mocks instead of a real backend. Call `setupApiMocks(page)` in
`beforeEach`; it registers every endpoint the layout + common pages need (tenant, vacancies, locations,
services, employees, users, my-bookings). Exported fixtures: `FAKE_TOKEN`, `LOCATIONS`, `EMPLOYEES`,
`SERVICES`.

- **Route registration order matters.** Playwright matches routes in **reverse** registration order (last
  registered wins). `setupApiMocks` relies on this: generic `**/api/users*` first, then `my-bookings`, then
  single-user detail last. A per-test `page.route(...)` in the test body registers _after_ `beforeEach`, so it
  overrides the shared mock — use that to specialize a response (e.g. a POST/PUT/409 for one test).
- **Auth.** `setupAuthToken(page)` injects `FAKE_TOKEN` (an Employee JWT) into `sessionStorage` before load,
  bypassing the login UI — use it for admin-page tests. Tests that exercise the real login flow instead mock
  `**/api/auth/login` and fill the form.

## Form submission gotchas (shared `Form.svelte`)

`Form.svelte`'s submit handler runs `event.target.checkValidity()` and, on failure, calls `reportValidity()`
and **returns before** invoking the page's `onsubmit`. So native HTML constraints silently block submission
with no app-level error:

- Inputs with `minlength="8"` (e.g. the change-password fields) reject short values natively — to reach the
  app's _custom_ complexity error, use an 8+ char value that still fails the pattern (e.g. `weakpass`).
- `PhoneInput` has an EU/Scandinavian `pattern`; a too-short phone blocks submit. Use a pattern-valid number
  like `4512345678` when a test needs the form to actually submit.

The email link on the contact **edit** form is labelled "Email" via `aria-labelledby`, so its accessible name
is not the address — match it by `href` (`a[href="mailto:..."]`), not by link name.

## Screenshots

Capture with the shared helper, never a raw `page.screenshot({...})`:

```js
import { pageScreenshot } from './mocks.js';
await pageScreenshot(page, 'admin-services-edit');
```

The helper (in `mocks.js`) owns the format/quality/path: full-page **WebP quality 80** written to
`e2e/screenshots/<name>.webp`. These files are committed. To change format/quality/dir, edit the helper only.

**Naming:** `<url-slug>[-<action-or-state>]` — URL path slugified (`/` → `home`, `/admin/plan` →
`admin-plan`, `/book/[serviceId]` → `book-service`), with a single-dash suffix **only when an action or
non-default state** produced the shot (`home-switch-to-danish`, `admin-plan-create-vacancy`,
`change-password-expired`). No `--`. Every page route should keep at least one screenshot.

## Conventions

- Prefer semantic selectors: `getByRole`, `getByLabel`, `nav a[href="/login"]`. Avoid brittle CSS/text where a
  role works.
- Never log tokens or passwords.
- Before committing: `npm run lint` and `npm run format` (repo-wide ESLint + Prettier).
