import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { VacancyService } from '$lib/api';
import { authedQueryFn } from '$lib/queryClient';

/**
 * Query key factory — the single source of truth for this resource's keys.
 * Queries and invalidations both reference these, so a typo can't silently
 * decouple them (the #1 scaling hazard with svelte-query). `range` extends
 * `all`, so `invalidateQueries({ queryKey: vacancyKeys.all })` matches every
 * cached range by prefix. Template rule: each resource hook defines its own
 * key factory like this.
 */
const vacancyKeys = {
	all: ['vacancies'],
	range: (from, to) => [...vacancyKeys.all, from, to],
};

/**
 * Route-local data hook for the admin plan calendar. Owns all svelte-query
 * wiring (vacancy fetching + mutations) so `+page.svelte` stays a thin
 * coordinator and the reusable Calendar/VacancyForm components remain purely
 * presentational.
 *
 * Must be called once during component setup (it relies on the QueryClient
 * provided higher in the tree).
 *
 * @param {() => { from: string|null, to: string|null }} getRange thunk
 *   returning the current week range read live from the URL.
 * @returns {{
 *   readonly vacancies: Array<object>,
 *   readonly isLoading: boolean,
 *   readonly error: unknown,
 *   addVacancy: (requestBody: object) => Promise<unknown>,
 *   deleteVacancy: (id: string|number) => Promise<unknown>,
 *   getVacancy: (id: string|number) => Promise<object>,
 * }}
 */
export function usePlanVacancies(getRange) {
	const queryClient = useQueryClient();

	// v6 reactivity: read the reactive range *inside* the thunk so dependency
	// tracking works and week navigation refetches. The query key (incl.
	// from/to) replaces the old module-level Map — each week caches separately.
	const query = createQuery(() => {
		const { from, to } = getRange();
		return {
			queryKey: vacancyKeys.range(from, to),
			enabled: !!from && !!to,
			queryFn: () => authedQueryFn(() => VacancyService.getVacancies(from, to)),
		};
	});

	// A single invalidateQueries replaces the old purge(from,to) + invalidate('app:vacancies').
	// Awaited via onSuccess below, so mutateAsync resolves only after the refetch
	// settles — callers can close the form knowing the list is already fresh.
	function invalidateVacancies() {
		return queryClient.invalidateQueries({ queryKey: vacancyKeys.all });
	}

	const addMutation = createMutation(() => ({
		mutationFn: (requestBody) => authedQueryFn(() => VacancyService.addVacancy(requestBody)),
		onSuccess: invalidateVacancies,
	}));

	const deleteMutation = createMutation(() => ({
		mutationFn: (id) => authedQueryFn(() => VacancyService.deleteVacancy(id)),
		onSuccess: invalidateVacancies,
	}));

	return {
		get vacancies() {
			return query.data?.items ?? [];
		},
		// isLoading is the first-load-without-data flag (false during background
		// refetch). Pages wanting a spinner while a cached query refetches should
		// expose query.isFetching instead.
		get isLoading() {
			return query.isLoading;
		},
		get error() {
			return query.error;
		},
		addVacancy: (requestBody) => addMutation.mutateAsync(requestBody),
		deleteVacancy: (id) => deleteMutation.mutateAsync(id),
		// Deliberately imperative (not a createQuery): a one-off detail fetch for
		// the view panel that needs no reactivity and must be fresh on every open.
		// It still gets 401 refresh-and-retry via authedQueryFn; it intentionally
		// skips the query cache so a reopened panel never shows stale detail.
		getVacancy: (id) => authedQueryFn(() => VacancyService.getVacancyById(id)),
	};
}

