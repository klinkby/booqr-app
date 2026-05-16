import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({ fallback: 'index.html' }),
		csp: {
			directives: {
				'default-src': ['self'],
				'frame-src': ['none'],
				'img-src': ['self', 'data:'],
				'object-src': ['none'],
				'script-src': ['self', 'unsafe-inline'],
				'style-src': ['self', 'unsafe-inline', 'unsafe-hashes'],
			},
		},
	},
};

export default config;
