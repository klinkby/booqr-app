import { QueryClient } from '@tanstack/svelte-query';
import { ApiError } from '$lib/api';
import { refreshToken } from '$lib/invokeApi';

/**
 * Runs an API operation with automatic 401 refresh-and-retry, mirroring the
 * semantics of `invokeApi` but owned by the query layer so components don't
 * call `invokeApi` directly. On a 401 it awaits the shared coalesced refresh
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
