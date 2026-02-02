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
		minify: 'terser',
		cssMinify: 'lightningcss',
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
				passes: 2
			},
			mangle: {
				safari10: true
			},
			format: {
				comments: false
			}
		},
		rollupOptions: {
			output: {
				manualChunks(id) {
					// Split vendor chunks more granularly for better caching
					if (id.includes('node_modules')) {
						if (id.includes('axios')) {
							return 'axios';
						}
						if (id.includes('svelte')) {
							return 'svelte';
						}
						return 'vendor';
					}
				},
				// Optimize chunk file naming
				chunkFileNames: '_app/immutable/chunks/[name]-[hash].js',
				assetFileNames: '_app/immutable/assets/[name]-[hash][extname]'
			},
			// Enable tree shaking
			treeshake: {
				moduleSideEffects: 'no-external',
				propertyReadSideEffects: false,
				tryCatchDeoptimization: false
			}
		}
	},
	plugins: [tailwindcss(), sveltekit()]
});
