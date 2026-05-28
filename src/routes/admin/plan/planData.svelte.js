import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { VacancyService } from '$lib/api';
import { authedQueryFn } from '$lib/queryClient';

/**
 * Route-local data hook for the admin plan calendar. Owns all svelte-query
 * wiring (vacancy fetching + mutations) so `+page.svelte` stays a thin
 * coordinator and the reusable Calendar/VacancyForm components remain purely
 * presentational.
 *
 * Must be called once during component setup (it relies on the QueryClient
 * provided by the route's `+layout.svelte`).
 *
 * @param {() => { from: string|null, to: string|null }} getRange thunk
 *   returning the current week range read live from the URL.
 */
export function usePlanVacancies(getRange) {
	const queryClient = useQueryClient();

	// v6 reactivity: read the reactive range *inside* the thunk so dependency
	// tracking works and week navigation refetches. The query key (incl.
	// from/to) replaces the old module-level Map — each week caches separately.
	const query = createQuery(() => {
		const { from, to } = getRange();
		return {
			queryKey: ['vacancies', from, to],
			enabled: !!from && !!to,
			queryFn: () => authedQueryFn(() => VacancyService.getVacancies(from, to)),
		};
	});

	// A single invalidateQueries replaces the old purge(from,to) + invalidate('app:vacancies').
	function invalidateVacancies() {
		return queryClient.invalidateQueries({ queryKey: ['vacancies'] });
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
		get isLoading() {
			return query.isLoading;
		},
		get error() {
			return query.error;
		},
		addVacancy: (requestBody) => addMutation.mutateAsync(requestBody),
		deleteVacancy: (id) => deleteMutation.mutateAsync(id),
		getVacancy: (id) => authedQueryFn(() => VacancyService.getVacancyById(id)),
	};
}
