import axios from 'axios';
import createAuthRefreshInterceptorImport from 'axios-auth-refresh';
import { OpenAPI } from './api/core/OpenAPI';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

import { authState } from '$lib/auth.svelte.js';

const createAuthRefreshInterceptor =
	typeof createAuthRefreshInterceptorImport === 'function'
		? createAuthRefreshInterceptorImport
		: createAuthRefreshInterceptorImport.default;

// Track if interceptors have been configured to prevent duplicate registration
let interceptorsConfigured = false;

// Function to get current access token
export function getAccessToken() {
	return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('access_token') : null;
}

// Function to set access token
export function setAccessToken(token) {
	if (typeof sessionStorage !== 'undefined') {
		if (token) {
			sessionStorage.setItem('access_token', token);
		} else {
			sessionStorage.removeItem('access_token');
		}
		authState.refresh();
	}
}

// Function to clear access token
export function clearAccessToken() {
	if (typeof sessionStorage !== 'undefined') {
		sessionStorage.removeItem('access_token');
		authState.refresh();
	}
}

// Validate token format and expiration
export function isValidToken(token) {
	if (!token || typeof token !== 'string') return false;
	// JWT tokens have 3 parts separated by dots
	const parts = token.split('.');
	if (parts.length !== 3) return false;

	try {
		// Decode payload (second part of JWT)
		const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
		if (payload.exp && typeof payload.exp === 'number') {
			const now = Math.floor(Date.now() / 1000);
			return payload.exp > now;
		}
	} catch (e) {
		// If decoding fails, consider it invalid
		return false;
	}

	return true;
}

// Configure axios default instance with interceptors
// The generated API code uses the default axios instance
function setupAxiosInterceptors() {
	// Prevent duplicate interceptor registration
	if (interceptorsConfigured) {
		return;
	}
	interceptorsConfigured = true;

	// Request interceptor to inject access token
	axios.interceptors.request.use((request) => {
		const token = getAccessToken();
		if (token && isValidToken(token)) {
			request.headers['Authorization'] = `Bearer ${token}`;
		}
		// Ensure credentials are included for refresh cookie only for our API
		if (request.url && (request.url.startsWith('/api/') || (request.url.includes('://') && new URL(request.url).pathname.startsWith('/api/')))) {
			request.withCredentials = true;
		}
		return request;
	});

	// Refresh auth logic
	const refreshAuthLogic = (failedRequest) =>
		axios
			.post('/api/auth/refresh', null, {
				withCredentials: true, // Send httponly refresh cookie
				skipAuthRefresh: true, // Prevent infinite loop if refresh also fails
			})
			.then((tokenRefreshResponse) => {
				const newToken = tokenRefreshResponse.data?.access_token;
				// Validate token before storing
				if (newToken && isValidToken(newToken)) {
					setAccessToken(newToken);
					failedRequest.response.config.headers['Authorization'] = `Bearer ${newToken}`;
					return Promise.resolve();
				} else {
					throw new Error('Invalid token received from refresh endpoint');
				}
			})
			.catch((error) => {
				// If refresh fails, clear token and redirect to login
				clearAccessToken();
				if (browser) {
					goto('/login');
				}
				return Promise.reject(error);
			});

	// Bind axios-auth-refresh interceptor to default axios instance
	createAuthRefreshInterceptor(axios, refreshAuthLogic, {
		statusCodes: [401], // Trigger refresh on 401 Unauthorized
	});
}

// Configure OpenAPI and axios on app initialization
export function configureApiClient() {
	if (!browser) {
		return;
	}

	OpenAPI.TOKEN = getAccessToken;
	OpenAPI.WITH_CREDENTIALS = true;
	OpenAPI.CREDENTIALS = 'include';

	// Setup axios interceptors for auth refresh
	setupAxiosInterceptors();
}
