import { OpenAPI } from '$lib/api/index.js';
import { browser } from '$app/environment';

const tokenName = 'access_token';

class AuthState {
	#token = $state(bootstrapToken());

	isLoggedIn = $derived(this.#token !== null);

	userId = $derived(parseToken(this.#token)?.sub ?? null);
	role = $derived(parseToken(this.#token)?.role ?? null);
	isEmployee = $derived(this.role === 'Employee' || this.role === 'Admin');

	get accessToken() {
		return this.#token;
	}

	set accessToken(jwtBearer) {
		if (!browser) return;

		const tokenObj = parseToken(jwtBearer);

		if (validate(tokenObj)) {
			sessionStorage.setItem(tokenName, jwtBearer);
			this.#token = jwtBearer;
		} else {
			sessionStorage.removeItem(tokenName);
			this.#token = null;
		}
	}

	clear() {
		this.accessToken = null;
	}
}

export const auth = new AuthState();

// Configure OpenAPI to read from authState reactively
if (browser) {
	Object.defineProperty(OpenAPI, 'TOKEN', {
		get: () => auth.accessToken,
		enumerable: true,
		configurable: true,
	});
	Object.defineProperty(OpenAPI, 'WITH_CREDENTIALS', {
		get: () => auth.isLoggedIn,
		enumerable: true,
		configurable: true,
	});
	OpenAPI.CREDENTIALS = 'include';
	// Enforce: credentials are only sent to /api/ paths regardless of OpenAPI.BASE,
	// preventing accidental cookie leakage if BASE is ever pointed at an external host.
	OpenAPI.FETCH = (url, init) => {
		let isApiPath;
		try {
			isApiPath = new URL(url, location.origin).pathname.startsWith('/api/');
		} catch {
			isApiPath = false;
		}
		if (!isApiPath && init?.credentials === 'include') {
			return fetch(url, { ...init, credentials: 'same-origin' });
		}
		return fetch(url, init);
	};
}

function bootstrapToken() {
	if (!browser) return null;

	const jwtBearer = sessionStorage.getItem(tokenName);
	if (jwtBearer === null || typeof jwtBearer !== 'string') return null;

	const tokenObj = parseToken(jwtBearer);
	if (!validate(tokenObj)) {
		sessionStorage.removeItem(tokenName);
		return null;
	}

	return jwtBearer;
}

function parseToken(jwtBearer) {
	if (jwtBearer === null || typeof jwtBearer !== 'string') return null;

	const parts = jwtBearer.split('.');
	if (parts.length !== 3) return null;

	try {
		// Decode payload (second part of JWT)
		return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
	} catch {
		return null;
	}
}

function validate(tokenObj) {
	if (!tokenObj || typeof tokenObj !== 'object') return false;

	if (!tokenObj.exp || typeof tokenObj.exp !== 'number') return false;
	const now = Math.floor(Date.now() / 1000);

	if (tokenObj.exp <= now) return false;
	if (typeof tokenObj.nbf === 'number' && tokenObj.nbf > now) return false;

	return true;
}
