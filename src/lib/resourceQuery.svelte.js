import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { authedQueryFn } from './queryClient.js';

/**
 * Generic reactive query for a collection resource. Wraps the fetcher in
 * `authedQueryFn` (401 refresh-and-retry) and unwraps the `{ items }`
 * collection envelope used by all generated services.
 *
 * Handles both unfiltered lists (static key, `enabled` defaults true) and
 * URL-param-driven lists (key + `enabled` guard recomputed each call). Pass a
 * thunk so the reactive params are read inside it — v6 tracks dependencies
 * read during the thunk, so the query refetches when they change.
 *
 * Must be called once during component/hook setup.
 *
 * @param {() => { queryKey: Array, fetcher: () => Promise<{items: Array}>, enabled?: boolean }} options
 * @returns {{ readonly items: Array, readonly isLoading: boolean, readonly isFetching: boolean, readonly error: unknown }}
 *   `isLoading` is first-load-only (false during background refetch); use
 *   `isFetching` for a spinner while a cached query revalidates.
 */
export function useResourceQuery(options) {
	const query = createQuery(() => {
		const { queryKey, fetcher, enabled = true } = options();
		return {
			queryKey,
			enabled,
			queryFn: () => authedQueryFn(fetcher),
		};
	});

	return {
		get items() {
			return query.data?.items ?? [];
		},
		get isLoading() {
			return query.isLoading;
		},
		get isFetching() {
			return query.isFetching;
		},
		get error() {
			return query.error;
		},
	};
}

/**
 * Generic mutation that coarsely invalidates the whole resource on success.
 * The returned function is `mutateAsync`, so it resolves only after the
 * invalidation refetch settles — callers can close a form knowing the list is
 * already fresh. The mutator is wrapped in `authedQueryFn` for 401 retry.
 *
 * Must be called once during component/hook setup.
 *
 * @param {Array} invalidateKey the resource's `.all` key (coarse invalidation)
 * @param {(variables: any) => Promise<unknown>} mutator
 * @returns {(variables: any) => Promise<unknown>}
 */
export function useResourceMutation(invalidateKey, mutator) {
	const queryClient = useQueryClient();
	const mutation = createMutation(() => ({
		mutationFn: (variables) => authedQueryFn(() => mutator(variables)),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: invalidateKey }),
	}));
	return (variables) => mutation.mutateAsync(variables);
}

/**
 * Generic reactive query for a paginated collection resource. Manages
 * `start` offset internally; each page caches separately (key includes
 * start). `placeholderData` keeps the previous page visible while the next
 * loads. `hasNextPage` is true when the returned batch is exactly PAGE_SIZE.
 *
 * Must be called once during component/hook setup.
 *
 * @param {() => { queryKey: Array, fetcher: (start: number, num: number) => Promise<{items: Array}>, enabled?: boolean }} options
 * @returns {{
 *   readonly items: Array,
 *   readonly isLoading: boolean,
 *   readonly isFetching: boolean,
 *   readonly error: unknown,
 *   readonly hasPreviousPage: boolean,
 *   readonly hasNextPage: boolean,
 *   nextPage: () => void,
 *   previousPage: () => void,
 * }}
 */
export function usePagedResourceQuery(options) {
	const PAGE_SIZE = 100;
	let start = $state(0);

	const query = createQuery(() => {
		const { queryKey, fetcher, enabled = true } = options();
		return {
			queryKey: [...queryKey, start],
			enabled,
			queryFn: () => authedQueryFn(() => fetcher(start, PAGE_SIZE)),
			placeholderData: (prev) => prev,
		};
	});

	return {
		get items() {
			return query.data?.items ?? [];
		},
		get isLoading() {
			return query.isLoading;
		},
		get isFetching() {
			return query.isFetching;
		},
		get error() {
			return query.error;
		},
		get hasPreviousPage() {
			return start > 0;
		},
		get hasNextPage() {
			return (query.data?.items?.length ?? 0) === PAGE_SIZE;
		},
		nextPage() {
			start += PAGE_SIZE;
		},
		previousPage() {
			start = Math.max(0, start - PAGE_SIZE);
		},
	};
}

/**
 * Mutation for pre-auth / auth-flow endpoints (login, password reset,
 * change-password). Deliberately does NOT route through `authedQueryFn`: a 401
 * here is a legitimate failure (bad credentials / expired link), not a trigger
 * for token refresh, and no refresh token exists during these flows. Takes no
 * invalidateKey because there is no cached resource to invalidate.
 *
 * Returns `mutateAsync`, so callers `await` the result and catch failures.
 *
 * Must be called once during component/hook setup.
 *
 * @param {(variables: any) => Promise<unknown>} mutator
 * @returns {(variables: any) => Promise<unknown>}
 */
export function usePublicMutation(mutator) {
	const mutation = createMutation(() => ({
		mutationFn: (variables) => mutator(variables),
	}));
	return (variables) => mutation.mutateAsync(variables);
}

/**
 * Imperative one-off authed fetch with no caching — for detail fetches that
 * must be fresh on every call (e.g. opening a view panel). Still gets 401
 * refresh-and-retry; deliberately skips the query cache so a reopened panel
 * never shows stale detail.
 *
 * @param {() => Promise<T>} operation
 * @returns {Promise<T>}
 * @template T
 */
export function fetchResource(operation) {
	return authedQueryFn(operation);
}
