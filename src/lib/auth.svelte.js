import { OpenAPI } from '$lib/api/index.js';
import { browser } from '$app/environment';

const tokenName = 'access_token';

class AuthState {
	#token = $state(bootstrapToken());

	isLoggedIn = $derived(this.#token !== null);
	
	userId = $derived(parseToken(this.#token)?.sub ?? null);
	role = $derived(parseToken(this.#token)?.role ?? null);
	userId = $derived(parseToken(this.#token)?.userId ?? null);
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
		configurable: true
	});
	Object.defineProperty(OpenAPI, 'WITH_CREDENTIALS', {
		get: () => auth.isLoggedIn,
		enumerable: true,
		configurable: true
	});
	OpenAPI.CREDENTIALS = 'include';
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
	}
	catch {
		return null;
	}
}

function validate(tokenObj) {
	if (!tokenObj || typeof tokenObj !== 'object') return false;
	
	// Require expiration field
	if (!tokenObj.exp || typeof tokenObj.exp !== 'number') return false;
	const now = Math.floor(Date.now() / 1000);

	// Valid if not yet expired
	return tokenObj.exp > now;
}
