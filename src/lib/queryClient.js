import { QueryClient } from '@tanstack/svelte-query';
import { ApiError, AuthenticationService } from '$lib/api';
import { auth } from './auth.svelte.js';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

let refreshPromise = null;
/**
 * Runs an API operation with automatic 401 refresh-and-retry, and awaits the shared coalesced refresh
 * (see `refreshToken`) and retries once.
 *
 * TanStack Query's `retry` option is a synchronous predicate and cannot perform
 * the token refresh itself, so the refresh lives here in the queryFn wrapper.
 * The QueryClient's `defaultOptions.retry` below only governs non-auth retries.
 */
export async function authedQueryFn(operation) {
	try {
		return await operation();
	} catch (error) {
		if (!(error instanceof ApiError) || error.status !== 401) {
			throw error;
		}
		await refreshToken();
		return await operation();
	}
}

// Singleton QueryClient. Safe as a module singleton because the app runs as a
// pure client-side SPA (`export const ssr = false`) — there is no server-side
// request lifecycle that could leak cached state between users.
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Mirror the previous module-level Map cache: data stays fresh until an
			// explicit `invalidateQueries` after a mutation. With staleTime Infinity,
			// refetchOnWindowFocus/refetchOnMount stay inert, matching prior behavior.
			staleTime: Infinity,
			// Drop cached data 15 min after a query goes unobserved (e.g. after
			// navigating away), so the cache doesn't grow unbounded within a session.
			gcTime: 1000 * 60 * 15,
			// Auth (401) retry is handled in `authedQueryFn`. Here we only retry
			// transient/server errors and never retry client (4xx) errors.
			retry: (failureCount, error) => {
				if (error instanceof ApiError && error.status < 500) return false;
				return failureCount < 2;
			},
		},
		mutations: {
			retry: false,
		},
	},
});

/**
 * Performs a coalesced token refresh. Concurrent callers share a single
 * in-flight refresh promise.
 */
async function refreshToken() {
	if (refreshPromise) {
		await refreshPromise;
		return;
	}
	refreshPromise = doRefresh();
	try {
		await refreshPromise;
	} finally {
		refreshPromise = null;
	}
}

async function doRefresh() {
	try {
		const response = await AuthenticationService.refresh();
		auth.accessToken = response.access_token;
	} catch (error) {
		auth.clear();
		// Capture current URL to return after re-authentication
		const returnUrl = globalThis.location.pathname + globalThis.location.search;
		await goto(resolve(`/login?returnUrl=${encodeURIComponent(returnUrl)}`));
		throw error;
	}
}
