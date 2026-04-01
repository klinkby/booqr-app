import {connect} from 'node:http2';
import tailwindcss from '@tailwindcss/vite';
import {sveltekit} from '@sveltejs/kit/vite';
import {defineConfig} from 'vite';

const API_TARGET = 'https://www.booqr.dk';
const H1_HEADERS = new Set(['host', 'connection', 'transfer-encoding', 'keep-alive', 'upgrade']);

/** Proxies an incoming HTTP/1.1 request to the upstream over HTTP/2. */
function proxyToH2(req, res) {
	const client = connect(API_TARGET);
	const headers = {':path': req.originalUrl, ':method': req.method};
	for (const [k, v] of Object.entries(req.headers)) {
		if (!H1_HEADERS.has(k)) headers[k] = v;
	}
	const h2req = client.request(headers);
	req.pipe(h2req);
	h2req.on('response', (h2headers) => {
		const outHeaders = {};
		for (const [k, v] of Object.entries(h2headers)) {
			if (!k.startsWith(':')) outHeaders[k] = v;
		}
		res.writeHead(h2headers[':status'], outHeaders);
	});
	h2req.pipe(res);
	h2req.on('end', () => client.close());
	h2req.on('error', (err) => {
		if (!res.headersSent) res.writeHead(502);
		res.end(err.message);
		client.close();
	});
}

export default defineConfig({
	build: {
		target: 'es2022',
		minify: 'oxc'
	},
	oxc: {
		target: 'es2022'
	},
	plugins: [
		{
			name: 'h2-proxy',
			configureServer(server) {
				server.middlewares.use('/api', proxyToH2);
			}
		},
		tailwindcss(),
		sveltekit()
	]
});
