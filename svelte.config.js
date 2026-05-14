import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({ fallback: 'index.html' }),
		csp: {
			directives: {
				'default-src': ['self'],
				'script-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'https://gravatar.com'],
				'object-src': ['none'],
				'frame-src': ['none'],
			},
		},
	},
};

export default config;
