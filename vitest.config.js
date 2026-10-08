import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Standalone config for the unit suite (pure `$lib` logic only — no Svelte
// component rendering). Kept separate from `vite.config.js` so the Paraglide /
// SvelteKit build plugins don't run; the `$lib` alias and `$app/environment`
// stub are declared explicitly here. The `svelte` plugin is included so `.svelte.js`
// modules that use runes (e.g. `tenant.svelte.js`) still compile under Vitest.
export default defineConfig({
	plugins: [svelte()],
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
			// SvelteKit's `$app/environment` isn't available outside the dev/build
			// server; stub it so modules importing `browser` load in the Node test env.
			'$app/environment': fileURLToPath(new URL('./src/test/appEnvironmentStub.js', import.meta.url)),
		},
	},
	test: {
		environment: 'node',
		include: ['src/**/*.test.js'],
	},
});
