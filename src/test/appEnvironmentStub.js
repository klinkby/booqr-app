// Test stub for SvelteKit's `$app/env`, aliased in vitest.config.js.
// `browser = false` keeps module-init browser-only side effects (e.g. the
// reserved-host bootstrap in tenant.svelte.js) inert under the Node test env.
export const browser = false;
export const dev = false;
export const building = false;
export const version = 'test';
