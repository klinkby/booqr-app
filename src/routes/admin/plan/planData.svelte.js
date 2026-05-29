import { VacancyService } from '$lib/api';
import { queryKeys } from '$lib/queryKeys';
import { useResourceQuery, useResourceMutation, fetchResource } from '$lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the admin plan calendar. Composes the generic
 * resource primitives so `+page.svelte` stays a thin coordinator and the
 * reusable Calendar/VacancyForm components remain purely presentational.
 *
 * This is the template for query-backed routes: keys come from the central
 * `queryKeys` registry, fetching/mutation go through the generic
 * `useResource*` helpers, and only the resource-specific wiring lives here.
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
	// Read the reactive range inside the thunk so week navigation refetches.
	const query = useResourceQuery(() => {
		const { from, to } = getRange();
		return {
			queryKey: queryKeys.vacancies.range(from, to),
			enabled: !!from && !!to,
			fetcher: () => VacancyService.getVacancies(from, to),
		};
	});

	const addVacancy = useResourceMutation(queryKeys.vacancies.all, (requestBody) =>
		VacancyService.addVacancy(requestBody),
	);
	const deleteVacancy = useResourceMutation(queryKeys.vacancies.all, (id) => VacancyService.deleteVacancy(id));

	return {
		get vacancies() {
			return query.items;
		},
		get isLoading() {
			return query.isLoading;
		},
		get error() {
			return query.error;
		},
		addVacancy,
		deleteVacancy,
		// One-off, always-fresh detail fetch for the view panel.
		getVacancy: (id) => fetchResource(() => VacancyService.getVacancyById(id)),
	};
}
