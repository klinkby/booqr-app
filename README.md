# Klinkby.Booqr.App

[![Docker Image CI](https://github.com/klinkby/booqr-app/actions/workflows/docker-image.yml/badge.svg?branch=main)](https://github.com/klinkby/booqr-app/actions/workflows/docker-image.yml)
[![CodeQL](https://github.com/klinkby/booqr-app/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/klinkby/booqr-app/actions/workflows/github-code-scanning/codeql)
[![License](https://img.shields.io/github/license/klinkby/booqr-app.svg)](LICENSE)

A modern Single Page Application (SPA) built with Svelte 5 and SvelteKit, designed as the frontend for the Booqr booking
management system. This application emphasizes security, accessibility, and standards-first development with a
minimalist, composable architecture.

## Features

- **Lean Dependency Tree**: Tree-shaken, code-split chunks — no monolithic "vendor" bundle.
- **[Svelte 5 with Runes](https://svelte.dev/docs/svelte/overview)**: Modern reactive programming using Svelte 5's runes
  system (`$state`, `$derived`, `$effect`, `$props`) for efficient state management.
- **[SvelteKit SPA Mode](https://svelte.dev/docs/kit/single-page-apps)**: Static site generation targeting static
  deployments with client-side routing.
- **Internationalization**: [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) provides English
  and Danish messages, browser-language detection, and a persisted language preference.
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework for consistent, minimal styling.
- **[OpenAPI Code Generation](https://github.com/ferdikoomen/openapi-typescript-codegen)**: Auto-generated API client
  from OpenAPI specification.
- **[TanStack Query](https://tanstack.com/query/latest/docs/framework/svelte/overview)**: Declarative data fetching and
  caching via route-local `*Data.svelte.js` hooks, with automatic 401 refresh-and-retry and coarse cache invalidation.
- **JWT Authentication**: Secure authentication flow.
- **ES2022 Target**: Modern JavaScript features for optimal performance.
- **[Semantic HTML5](https://html.spec.whatwg.org/)**: Strict adherence to semantic markup and WCAG AA accessibility
  standards.
- **Security-First Design**: OWASP-aligned security practices.
- **[Playwright E2E Testing](https://playwright.dev/)**: End-to-end testing with semantic selectors and accessibility
  assertions.
- **Container Security**: Runs rootless in minimal [Alpine Linux](https://alpinelinux.org/) images (~20MB) with
  immutable filesystem.
  - [Lighttpd Web Server](https://www.lighttpd.net/): Secure, minimal-attack-surface static web server in production.
  - Two-Stage Docker Builds: Reproducible builds with separate build and runtime stages for optimal security and size.

## Project Structure

The application is organized following SvelteKit's file-based routing conventions:

- [src/routes](src/routes): Page components and routes
- [src/lib](src/lib): Shared utilities and components
- [src/routes/+layout.svelte](src/routes/+layout.svelte): Top-level layout with semantic navigation
- [e2e](e2e): Playwright end-to-end tests
- [static](static): Static assets served at root
- [Dockerfile](Dockerfile): Multi-stage build configuration
- [lighttpd.conf](lighttpd.conf): Production web server configuration
- [AGENTS.md](AGENTS.md): Development guidelines for AI agents

**Note**: Never manually edit files in `src/lib/api/` as they are auto-generated.

## Internationalization

The app uses Paraglide JS for all interface text. Source messages live in `messages/en.json` and `messages/da.json`;
the Vite plugin compiles them into `src/lib/paraglide/`. Import translated strings as `m` from
`$lib/paraglide/messages.js`, for example `m.navSignIn()`. Do not edit the generated Paraglide output directly.

Paraglide resolves the locale in this order: its `localStorage` preference, the browser's preferred language, then
English. The footer language control uses `src/lib/locale.svelte.js` to call Paraglide's `setLocale()`. It intentionally
reloads the SPA so every translated module initializes with the new locale.

`src/routes/+layout.svelte` is the document-level integration point. It sets `<html lang>` and text direction from
`getLocale()` / `getTextDirection()` inside a component `$effect`, while also using translated labels in shared layout
UI. This keeps the document language correct for assistive technology as well as visual translations.

## Licensed under AGPL-3.0

Copyright (C) 2026 Mads Klinkby ([https://www.kli.dk](https://www.kli.dk))

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a [copy of the GNU Affero General Public License
along with this program](LICENSE). If not, see <http://www.gnu.org/licenses/>.
