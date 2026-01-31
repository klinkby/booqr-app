import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		proxy: {
			'/api': {
				target: 'https://www.booqr.dk',
				changeOrigin: true
			}
		}
	},
	build: {
		target: 'es2022',
		minify: 'esbuild',
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules')) {
						return 'vendor';
					}
				}
			}
		}
	},
	plugins: [tailwindcss(), sveltekit()]
});
