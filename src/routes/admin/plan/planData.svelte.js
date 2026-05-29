import { LocationService, UserService, VacancyService } from '$lib/api';
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
 */
export function usePlanData(getRange) {
	const query = useResourceQuery(() => {
		const { from, to } = getRange();
		return {
			queryKey: queryKeys.vacancies.range(from, to),
			enabled: !!from && !!to,
			fetcher: () => VacancyService.getVacancies(from, to),
		};
	});

	const locations = useResourceQuery(() => ({
		queryKey: queryKeys.locations.all,
		fetcher: () => LocationService.getLocations(0, 100),
	}));

	// Use UserService (not EmployeeService) so IDs match vacancy.employeeId and
	// VacancyForm's employee selector which initialises from auth.userId (a User ID).
	const employees = useResourceQuery(() => ({
		queryKey: queryKeys.employeeUsers.all,
		fetcher: () => UserService.getUsers(undefined, 'Employee'),
	}));

	const addVacancy = useResourceMutation(queryKeys.vacancies.all, (requestBody) =>
		VacancyService.addVacancy(requestBody),
	);
	const deleteVacancy = useResourceMutation(queryKeys.vacancies.all, (id) => VacancyService.deleteVacancy(id));

	return {
		get vacancies() {
			return query.items;
		},
		get locations() {
			return locations.items;
		},
		get employees() {
			return employees.items;
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
