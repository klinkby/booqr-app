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
			// Enable aggressive tree shaking
			// - moduleSideEffects: 'no-external' preserves side effects in our code
			//   but removes them from node_modules, allowing better optimization
			// - propertyReadSideEffects: false assumes property reads don't have side effects
			// - tryCatchDeoptimization: false allows more aggressive optimization
			treeshake: {
				moduleSideEffects: 'no-external',
				propertyReadSideEffects: false,
				tryCatchDeoptimization: false
			}
		}
	},
	plugins: [tailwindcss(), sveltekit()]
});
