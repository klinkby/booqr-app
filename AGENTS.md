# Repository Overview for Agents

- **Framework**: SvelteKit with Svelte 5 in SPA mode, targeting static site deployments. Agents MUST prefer Svelte 5 features, specifically **runes** (`$state`, `$derived`, `$effect`, etc.) for reactivity and state management.
- **Styling**: Tailwind CSS with the official `forms` plugin ensures a minimal but extendable design system.
- **Tooling**: Keeps dependencies lean by relying on native ES2022 features and avoiding TypeScript tooling.
- **Verification**: Playwright is installed for end-to-end verification of the UI when needed.

Agents should focus on small, composable changes that align with these constraints and avoid introducing unnecessary dependencies.

## Build and Publishing 
- Uses two-stage Docker builds to ensure repeatability and the final image is compact and secure.
- Static web server is lighttpd configured for security and minimal attack surface.
- Keep the build output split into vendor and non-vendor bundles while targeting ES2022 without introducing TypeScript.
