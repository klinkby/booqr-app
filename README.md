# Klinkby.Booqr.App

[![Docker Image CI](https://github.com/klinkby/booqr-app/actions/workflows/docker-image.yml/badge.svg?branch=main)](https://github.com/klinkby/booqr-app/actions/workflows/docker-image.yml)
[![License](https://img.shields.io/github/license/klinkby/booqr-app.svg)](LICENSE)

A modern Single Page Application (SPA) built with Svelte 5 and SvelteKit, designed as the frontend for the Booqr booking management system. This application emphasizes security, accessibility, and standards-first development with a minimalist, composable architecture.


## Features

*   **[Svelte 5 with Runes](https://svelte.dev/docs/svelte/overview)**: Modern reactive programming using Svelte 5's runes system (`$state`, `$derived`, `$effect`, `$props`) for efficient state management.
*   **[SvelteKit SPA Mode](https://svelte.dev/docs/kit/single-page-apps)**: Static site generation targeting static deployments with client-side routing.
*   **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework with the official `@tailwindcss/forms` plugin for consistent, minimal styling.
*   **[OpenAPI Code Generation](https://github.com/ferdikoomen/openapi-typescript-codegen)**: Auto-generated API client from OpenAPI specification with compile-time type safety.
*   **[Axios with Auth Interceptors](https://axios-http.com/)**: HTTP client with automatic JWT token refresh using `axios-auth-refresh` package.
*   **JWT Authentication**: Secure authentication flow with:
    *   Access tokens stored in `sessionStorage`
    *   Refresh tokens in `HttpOnly`, `SameSite=Strict` cookies
    *   Automatic token refresh on 401 responses
    *   Token rotation with family-based tracking
*   **[Semantic HTML5](https://html.spec.whatwg.org/)**: Strict adherence to semantic markup and WCAG AA accessibility standards:
    *   Proper landmark elements (`<main>`, `<nav>`, `<header>`, `<footer>`)
    *   Skip navigation links for keyboard users
    *   Logical heading hierarchy (H1-H6)
    *   Form labels and fieldsets
    *   ARIA attributes only where necessary
*   **Security-First Design**: OWASP-aligned security practices:
    *   No secrets in code (environment variables only)
    *   XSS prevention with automatic content escaping
    *   CSRF protection via SameSite cookies
    *   Token validation before storage/use
    *   Generic error messages to prevent information disclosure
*   **Automatic API Pagination**: Client-side pagination utility for efficient data fetching with auto-pagination support.
*   **[Playwright E2E Testing](https://playwright.dev/)**: End-to-end testing with semantic selectors and accessibility assertions.
*   **[Lighttpd Web Server](https://www.lighttpd.net/)**: Secure, minimal-attack-surface static web server in production.
*   **Container Security**: Runs rootless in minimal [Alpine Linux](https://alpinelinux.org/) images (~20MB) with immutable filesystem.
*   **Two-Stage Docker Builds**: Reproducible builds with separate build and runtime stages for optimal security and size.
*   **ES2022 Target**: Modern JavaScript features with code splitting (vendor/non-vendor bundles) for optimal performance.


## Project Structure

The application is organized following SvelteKit's file-based routing conventions:

*   [src/routes](src/routes): Page components and routes
    *   `/` - Home page
    *   `/calendar` - Vacancy calendar view with auto-paginated data
    *   `/login` - Authentication form with email/password
*   [src/lib](src/lib): Shared utilities and components
    *   `api/` - Auto-generated API client (do not edit manually)
    *   `axiosConfig.js` - Centralized axios configuration with interceptors
    *   `index.js` - Shared utility exports (pagination helpers, etc.)
*   [src/routes/+layout.svelte](src/routes/+layout.svelte): Top-level layout with semantic navigation
*   [e2e](e2e): Playwright end-to-end tests
*   [static](static): Static assets served at root
*   [Dockerfile](Dockerfile): Multi-stage build configuration
*   [lighttpd.conf](lighttpd.conf): Production web server configuration
*   [AGENTS.md](AGENTS.md): Development guidelines for AI agents


## Minimal Runtime Dependencies

- [Node.js 24](https://nodejs.org/) for development and build
- [Svelte 5](https://svelte.dev/) and [SvelteKit](https://kit.svelte.dev/) framework
- [Axios](https://axios-http.com/) for HTTP requests
- [axios-auth-refresh](https://github.com/Flyrell/axios-auth-refresh) for token refresh automation
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [lighttpd](https://www.lighttpd.net/) for production serving (Alpine Linux container)


## Developing

Install dependencies and start the development server:

```sh
npm install
npm run dev

# or open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production build:

```sh
npm run build
```

Preview the production build locally:

```sh
npm run preview
```

## Testing

Run end-to-end tests with Playwright:

```sh
npm test
```

Test credentials should be configured in a `.env` file (see `.env.example` for required variables).

## API Client Generation

Regenerate the API client from the backend's OpenAPI specification:

```sh
npm run import-api
```

**Note**: Never manually edit files in `src/lib/api/` as they are auto-generated.


## Licensed under AGPL-3.0

Copyright (C) 2026 Mads Klinkby

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a [copy of the GNU Affero General Public License
along with this program](LICENSE).  If not, see <http://www.gnu.org/licenses/>.
